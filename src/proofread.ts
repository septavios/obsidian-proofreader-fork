import { diffWords } from "diff";
import { Editor, Notice, requestUrl } from "obsidian";
import { OPENAI_API_KEY, OPENAI_MODEL, STATIC_PROMPT } from "./settings";

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

async function openAiRequest(oldText: string): Promise<string | undefined> {
	// DOCS https://platform.openai.com/docs/api-reference/chat
	const response = await requestUrl({
		url: "https://api.openai.com/v1/chat/completions",
		method: "POST",
		contentType: "application/json",
		// biome-ignore lint/style/useNamingConvention: not by me
		headers: { Authorization: "Bearer " + OPENAI_API_KEY },
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

export async function proofreadParagraph(editor: Editor): Promise<void> {
	new Notice("🤖 Sending proofread request…");
	const cursor = editor.getCursor();
	const oldText = editor.getLine(cursor.line);
	const newText = await openAiRequest(oldText);
	if (!newText) return;

	const changes = getDiffMarkdown(oldText, newText);
	editor.setLine(cursor.line, changes);
	editor.setCursor(cursor);
}
