import { Editor, Notice, requestUrl } from "obsidian";
import { OPENAI_API_KEY, OPENAI_MODEL, STATIC_PROMPT } from "./settings";

export async function proofreadParagraph(editor: Editor): Promise<void> {
	new Notice("Sending proofread request…");
	const cursor = editor.getCursor();
	const currentParagraph = editor.getLine(cursor.line);
	const text = currentParagraph;

	// DOCS https://platform.openai.com/docs/api-reference/chat
	const response = await requestUrl({
		url: "https://api.openai.com/v1/chat/completions",
		method: "POST",
		contentType: "application/json",
		// biome-ignore lint/style/useNamingConvention: not by me
		headers: { Authorization: "Bearer " + OPENAI_API_KEY },
		body: JSON.stringify({
			model: OPENAI_MODEL,
			messages: [{ role: "user", content: STATIC_PROMPT + text }],
		}),
	});
	const error = response.json.error;
	if (error) {
		new Notice(`ERROR ${error.code}: ${error.message}`, 0);
		return;
	}
	const answer = response.json.choices[0].message.content;
	new Notice(`answer: ${answer}`, 0);
}
