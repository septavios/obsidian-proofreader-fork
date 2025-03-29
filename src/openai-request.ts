import { Notice, RequestUrlResponse, requestUrl } from "obsidian";
import { OPENAI_MODEL, ProofreaderSettings, STATIC_PROMPT } from "./settings";

function logError(obj: unknown): void {
	const hotkey = process.platform === "darwin" ? "cmd+opt+i" : "ctrl+shift+i";
	new Notice(`Error. Check the console for more details (${hotkey}).`);
	console.error("[Proofreader plugin] error", obj);
}

export async function openAiRequest(
	settings: ProofreaderSettings,
	oldText: string,
	scope: string,
): Promise<{ newText: string; overlength: boolean } | undefined> {
	// GUARD
	if (!settings.openAiApiKey) {
		new Notice("Please set your OpenAI API key in the plugin settings.");
		return;
	}

	let msg = `🤖 ${scope} is being proofread…`;
	if (oldText.length > 1500) msg += "\n\nDue to the length of the text, this may take a moment.";
	if (oldText.length > 15000) msg += " (A minute or longer.)";
	const notice = new Notice(msg, 0);

	// SEND REQUEST
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
		console.debug("[Proofreader plugin] OpenAI response", response);
	} catch (error) {
		notice.hide();
		if ((error as { status: number }).status === 401) {
			new Notice("OpenAI API key is not valid. Please verify the key in the plugin settings.");
			return;
		}
		logError(error);
		return;
	}
	notice.hide();

	// GUARD
	let newText = response.json?.choices?.[0].message.content;
	if (!newText) {
		logError(response);
		return;
	}

	// Ensure same amount of surrounding whitespace
	// (A selection can have surrounding whitespace, but the AI response usually
	// removes those. This results the text effectively being trimmed.)
	const leadingWhitespace = oldText.match(/^(\s*)/)?.[0] || "";
	const trailingWhitespace = oldText.match(/(\s*)$/)?.[0] || "";
	newText = newText.replace(/^(\s*)/, leadingWhitespace).replace(/(\s*)$/, trailingWhitespace);

	// determine if overlength
	// https://platform.openai.com/docs/guides/conversation-state?api-mode=responses#managing-context-for-text-generation
	const outputTokensUsed = response.json?.usage?.completion_tokens || 0;
	const overlength = outputTokensUsed >= OPENAI_MODEL.maxOutputTokens;
	if (overlength) {
		const msg =
			"Text is longer than the maximum output supported by the AI model.\n\n" +
			"Suggestions are thus only made until the cut-off point.";
		new Notice(msg, 10_000);
	}

	return { newText: newText, overlength: overlength };
}
