import { diffWords } from "diff";
import { Editor, Notice, requestUrl } from "obsidian";
import Proofreader from "./main";
import { OPENAI_MODEL, ProofreaderSettings, STATIC_PROMPT } from "./settings";

// DOCS https://github.com/kpdecker/jsdiff#readme
/* -> additions as ==highlights== & removals as ~~strikethroughs~~ */
function getDiffMarkdown(oldText: string, newText: string): string {
	const changes = diffWords(oldText, newText)
		.map((part) => {
			if (part.added) return `==${part.value}==`;
			if (part.removed) return `~~${part.value}~~`;
			return part.value;
		})
		.join("");

	return changes;
}

async function openAiRequest(
	settings: ProofreaderSettings,
	oldText: string,
): Promise<string | undefined> {
	if (!settings.openAiApiKey) {
		new Notice("Please set your OpenAI API key in the plugin settings.");
		return;
	}
	new Notice("🤖 Sending proofread request…");

	// DOCS https://platform.openai.com/docs/api-reference/chat
	const response = await requestUrl({
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

	const error = response.json.error;
	if (error) {
		const msg = `ERROR ${error.code}: ${error.message}`;
		console.error(msg);
		new Notice(msg, 4000);
		return;
	}
	const newText = response.json.choices[0].message.content;
	return newText;
}

export async function proofreadParagraph(plugin: Proofreader, editor: Editor): Promise<void> {
	const cursor = editor.getCursor();
	const oldText = editor.getLine(cursor.line);
	if (oldText.match(/==|~~/)) {
		const warnMsg =
			"Current paragraph already has highlights or strikethroughs. \n\n" +
			"Please accept/reject the changes before making another proofreading request.";
		new Notice(warnMsg, 6000);
		return;
	}

	const newText = await openAiRequest(plugin.settings, oldText);
	if (!newText) return;

	const changes = getDiffMarkdown(oldText, newText);
	editor.setLine(cursor.line, changes);
	editor.setCursor(cursor);
}
