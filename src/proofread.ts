import { diffWords } from "diff";
import { Editor, Notice, RequestUrlResponse, requestUrl } from "obsidian";
import Proofreader from "./main";
import { OPENAI_MODEL, ProofreaderSettings, STATIC_PROMPT } from "./settings";

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
): Promise<string | undefined> {
	if (!settings.openAiApiKey) {
		new Notice("Please set your OpenAI API key in the plugin settings.");
		return;
	}
	const notice = new Notice("🤖 Sending proofread request…");

	// DOCS https://platform.openai.com/docs/api-reference/chat
	let response: RequestUrlResponse;
	try {
		response = await requestUrl({
			url: "https://api.openai.com/v1/chat/completions",
			method: "POST",
			contentType: "application/json",
			// biome-ignore lint/style/useNamingConvention: not by me
			headers: { Authorization: "Bearer " + settings.openAiApiKey },
			body: JSON.stringify({
				model: OPENAI_MODEL,
				messages: [{ role: "user", content: STATIC_PROMPT + oldText }],
			}),
		});
	} catch (error) {
		notice.hide();
		if ((error as { status: number }).status === 401) {
			new Notice("OpenAI API key is not valid. Please check the key in the plugin settings.");
			return;
		}
		new Notice("Error. Check the console for more details.");
		console.error("Proofreader plugin error:", error);
		return;
	}
	notice.hide();

	let newText = response.json?.choices?.[0]?.message?.content;
	if (!newText) {
		new Notice("Error. Check the console for more details.");
		console.error("Proofreader plugin error:", response);
		return;
	}

	// Ensure same amount of surrounding whitespace.
	// (A selection can have surrounding whitespace, but the AI response usually
	// removes those. This results the text effectively being trimmed.)
	const leadingWhitespace = oldText.match(/^(\s*)/)?.[0] || "";
	const trailingWhitespace = oldText.match(/(\s*)$/)?.[0] || "";
	newText = newText.replace(/^(\s*)/, leadingWhitespace).replace(/(\s*)$/, trailingWhitespace);

	return newText;
}

export async function proofread(plugin: Proofreader, editor: Editor): Promise<void> {
	const selection = editor.getSelection();
	const cursor = editor.getCursor();
	const oldText = selection || editor.getLine(cursor.line);

	// GUARD
	const mode = selection === "" ? "paragraph" : "selection";
	if (oldText.trim() === "") {
		new Notice(`Current ${mode} is empty.`, 6000);
		return;
	}
	if (oldText.match(/==|~~/)) {
		const warnMsg =
			`Current ${mode} already has highlights or strikethroughs. \n\n` +
			"Please accept/reject the changes before making another proofreading request.";
		new Notice(warnMsg, 6000);
		return;
	}

	// PROOFREAD
	const newText = await openAiRequest(plugin.settings, oldText);
	if (!newText) return;
	if (newText === oldText) {
		new Notice("✅ Nothing found to change.");
		return;
	}

	const changes = getDiffMarkdown(oldText, newText);
	if (selection) editor.replaceSelection(changes);
	else editor.setLine(cursor.line, changes);

	editor.setCursor(cursor);
}
