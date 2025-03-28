import { Change, diffWords } from "diff";
import { Editor, Notice, RequestUrlResponse, getFrontMatterInfo, requestUrl } from "obsidian";
import Proofreader from "./main";
import { OPENAI_MODEL, ProofreaderSettings, STATIC_PROMPT } from "./settings";

//──────────────────────────────────────────────────────────────────────────────

// DOCS https://github.com/kpdecker/jsdiff#readme
function getDiffMarkdown(oldText: string, newText: string, overlength?: boolean): string {
	const diff = diffWords(oldText, newText);

	// do not remove text after cutoff-length
	if (overlength) {
		(diff.at(-1) as Change).removed = false;
		const cutOffCallout =
			"\n\n" +
			"> [!INFO] End of proofreading\n" +
			"> The input text text was too long. Text after this point is unchanged." +
			"\n\n";
		diff.splice(-2, 0, { added: false, removed: false, value: cutOffCallout });
	}

	// diff ---> ==highlights== / ~~strikethrough~~
	const textWithSuggestions = diff
		.map((part) => {
			if (part.added) return `==${part.value}==`;
			if (part.removed) return `~~${part.value}~~`;
			return part.value;
		})
		.join("");

	// notification
	const changeCount = diff.filter((part) => part.added || part.removed).length;
	const pluralS = changeCount === 1 ? "" : "s";
	if (changeCount > 0) new Notice(`🤖 ${changeCount} change${pluralS} made.`);

	return textWithSuggestions;
}

async function openAiRequest(
	settings: ProofreaderSettings,
	oldText: string,
	scope: string,
): Promise<{ newText: string; overlength: boolean } | undefined> {
	// GUARD
	if (!settings.openAiApiKey) {
		new Notice("Please set your OpenAI API key in the plugin settings.");
		return;
	}

	// SEND REQUEST
	const notice = new Notice(`🤖 ${scope} is being proofread…`);
	let response: RequestUrlResponse;
	try {
		// DOCS https://platform.openai.com/docs/api-reference/chat
		response = await requestUrl({
			url: "https://api.openai.com/v1/chat/completions",
			method: "POST",
			contentType: "application/json",
			// biome-ignore lint/style/useNamingConvention: not by me
			headers: { Authorization: "Bearer " + settings.openAiApiKey },
			body: JSON.stringify({
				model: OPENAI_MODEL.name,
				messages: [
					{ role: "developer", content: STATIC_PROMPT },
					{ role: "user", content: oldText },
				],
			}),
		});
	} catch (error) {
		notice.hide();
		if ((error as { status: number }).status === 401) {
			new Notice("OpenAI API key is not valid. Please verify the key in the plugin settings.");
			return;
		}
		new Notice("Error. Check the console for more details (ctrl+shift+i / cmd+opt+i).");
		console.error("Proofreader plugin error:", error);
		return;
	}
	notice.hide();

	// GUARD
	let newText = response.json?.choices?.[0].message.content;
	if (!newText) {
		new Notice("Error. Check the console for more details (ctrl+shift+i / cmd+opt+i).");
		console.error("Proofreader plugin error:", response);
		return;
	}

	// Ensure same amount of surrounding whitespace
	// (A selection can have surrounding whitespace, but the AI response usually
	// removes those. This results the text effectively being trimmed.)
	const leadingWhitespace = oldText.match(/^(\s*)/)?.[0] || "";
	const trailingWhitespace = oldText.match(/(\s*)$/)?.[0] || "";
	newText = newText.replace(/^(\s*)/, leadingWhitespace).replace(/(\s*)$/, trailingWhitespace);

	// GUARD
	if (newText === oldText) {
		new Notice("✅ Text is good, nothing to change.");
		return;
	}

	// determine if overlength
	// https://platform.openai.com/docs/guides/conversation-state?api-mode=responses#managing-context-for-text-generation
	const outputTokensUsed = response.json?.usage?.completion_tokens || 0;
	const overlength = outputTokensUsed >= OPENAI_MODEL.maxOutputTokens;
	if (overlength) {
		const msg =
			"Text is longer than the maximum output supported by the AI Model.\n\n" +
			"Suggestions are thus only made until the cut-off point.";
		new Notice(msg, 10_000);
	}

	return { newText: newText, overlength: overlength };
}

function validInputText(oldText: string, scope: string): boolean {
	if (oldText.trim() === "") {
		new Notice(`${scope} is empty.`);
		return false;
	}
	if (oldText.match(/==|~~/)) {
		const warnMsg =
			`${scope} already has highlights or strikethroughs. \n\n` +
			"Please accept/reject the changes before making another proofreading request.";
		new Notice(warnMsg, 6000);
		return false;
	}
	return true;
}

//──────────────────────────────────────────────────────────────────────────────

export async function proofreadDocument(plugin: Proofreader, editor: Editor): Promise<void> {
	const noteWithFrontmatter = editor.getValue();
	const bodyStart = getFrontMatterInfo(noteWithFrontmatter).contentStart || 0;
	const bodyEnd = noteWithFrontmatter.length;
	const oldText = noteWithFrontmatter.slice(bodyStart);

	if (!validInputText(oldText, "Document")) return;
	const { newText, overlength } =
		(await openAiRequest(plugin.settings, oldText, "Document")) || {};
	if (!newText) return;
	const changes = getDiffMarkdown(oldText, newText, overlength);

	const bodyStartPos = editor.offsetToPos(bodyStart);
	const bodyEndPos = editor.offsetToPos(bodyEnd);
	editor.replaceRange(changes, bodyStartPos, bodyEndPos);
	editor.setCursor(editor.offsetToPos(bodyStart)); // to start of doc
}

export async function proofreadSelectionParagraph(
	plugin: Proofreader,
	editor: Editor,
): Promise<void> {
	const cursor = editor.getCursor("from"); // `from` gives start if selection
	const selection = editor.getSelection();
	const oldText = selection || editor.getLine(cursor.line);
	const scope = selection ? "Selection" : "Paragraph";

	if (!validInputText(oldText, scope)) return;
	const { newText, overlength } = (await openAiRequest(plugin.settings, oldText, scope)) || {};
	if (!newText) return;
	const changes = getDiffMarkdown(oldText, newText, overlength);

	if (selection) {
		editor.replaceSelection(changes);
		editor.setCursor(cursor); // to start of selection
	} else {
		editor.setLine(cursor.line, changes);
		editor.setCursor({ line: cursor.line, ch: 0 }); // to start of paragraph
	}
}
