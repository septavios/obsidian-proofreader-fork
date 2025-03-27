import { diffWords } from "diff";
import { Editor, Notice, RequestUrlResponse, getFrontMatterInfo, requestUrl } from "obsidian";
import Proofreader from "./main";
import { OPENAI_MODEL, ProofreaderSettings, STATIC_PROMPT } from "./settings";

//──────────────────────────────────────────────────────────────────────────────

// DOCS https://github.com/kpdecker/jsdiff#readme
function getDiffMarkdown(oldText: string, newText: string): string {
	const diff = diffWords(oldText, newText);

	// text
	const textWithSuggestions = diffWords(oldText, newText)
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
): Promise<string | undefined> {
	// GUARD missing API key
	if (!settings.openAiApiKey) {
		new Notice("Please set your OpenAI API key in the plugin settings.");
		return;
	}
	// GUARD text too long — prevent request for a request that is *likely* too
	// long to prevent incurring a charge
	// https://platform.openai.com/docs/guides/conversation-state?api-mode=responses#managing-context-for-text-generation
	const estimatedMaxChars = OPENAI_MODEL.maxOutputTokens * 4; // SOURCE https://platform.openai.com/tokenizer
	if (oldText.length > estimatedMaxChars) {
		const overLength = Math.round(oldText.length - estimatedMaxChars);
		const msg =
			`The ${scope} is ~${overLength} characters too long.\n\n` +
			`The maximum length is ~${estimatedMaxChars} characters.`;
		new Notice(msg, 6000);
		return;
	}

	// SEND REQUEST
	const notice = new Notice("🤖 Sending proofread request…");
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

	// HANDLE RESPONSE
	let newText = response.json?.choices?.[0].message.content;
	if (!newText) {
		new Notice("Error. Check the console for more details (ctrl+shift+i / cmd+opt+i).");
		console.error("Proofreader plugin error:", response);
		return;
	}

	// GUARD text too long
	// abort to prevent a cut-off text to be used for diff creation. (There is
	// also a length check before the request is send, but it is based on
	// estimates, and thus a small chance that the actual text is too long.)
	const outputTokensUsed = response.json?.usage?.completion_tokens || 0;
	if (outputTokensUsed > OPENAI_MODEL.maxOutputTokens) {
		const tokensCutOff = outputTokensUsed - OPENAI_MODEL.maxOutputTokens;
		const msg =
			`The ${scope} is ~${tokensCutOff} tokens too long to create suggestions. ` +
			`The maximum length is ~${OPENAI_MODEL.maxOutputTokens} tokens.` +
			"\n\n" +
			"The cut-off, raw response-text can be retrieved from in the console (ctrl+shift+i / cmd+opt+i).";
		new Notice(msg, 10000);

		// save text in console, since the request still incurred a certain cost
		navigator.clipboard.writeText(newText);
	}

	// Ensure same amount of surrounding whitespace
	// (A selection can have surrounding whitespace, but the AI response usually
	// removes those. This results the text effectively being trimmed.)
	const leadingWhitespace = oldText.match(/^(\s*)/)?.[0] || "";
	const trailingWhitespace = oldText.match(/(\s*)$/)?.[0] || "";
	newText = newText.replace(/^(\s*)/, leadingWhitespace).replace(/(\s*)$/, trailingWhitespace);

	return newText;
}

export async function proofread(
	plugin: Proofreader,
	editor: Editor,
	scope: "Document" | "Selection" | "Paragraph" | string, // Area of text that should be proofread
): Promise<void> {
	const cursor = editor.getCursor();
	let oldText: string;
	let bodyStart = 0;
	let bodyEnd = 0;

	if (scope === "Document") {
		const noteWithFrontmatter = editor.getValue();
		bodyStart = getFrontMatterInfo(noteWithFrontmatter).contentStart || 0;
		oldText = noteWithFrontmatter.slice(bodyStart);
		bodyEnd = noteWithFrontmatter.length;
	} else if (editor.somethingSelected()) {
		scope = "Selection";
		oldText = editor.getSelection();
	} else {
		scope = "Paragraph";
		oldText = editor.getLine(cursor.line);
	}

	// GUARD
	if (oldText.trim() === "") {
		new Notice(`${scope} is empty.`);
		return;
	}
	if (oldText.match(/==|~~/)) {
		const warnMsg =
			`${scope} already has highlights or strikethroughs. \n\n` +
			"Please accept/reject the changes before making another proofreading request.";
		new Notice(warnMsg, 6000);
		return;
	}

	// PROOFREAD
	const newText = await openAiRequest(plugin.settings, oldText, scope);
	if (!newText) return;
	if (newText === oldText) {
		new Notice("✅ Text is good, nothing change.");
		return;
	}
	const changes = getDiffMarkdown(oldText, newText);

	if (scope === "Note") {
		const bodyStartPos = editor.offsetToPos(bodyStart);
		const bodyEndPos = editor.offsetToPos(bodyEnd);
		editor.replaceRange(changes, bodyStartPos, bodyEndPos);
	} else if (scope === "Paragraph") {
		editor.setLine(cursor.line, changes);
	} else if (scope === "Selection") {
		editor.replaceSelection(changes);
	}

	editor.setCursor(cursor);
}
