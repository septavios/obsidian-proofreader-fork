import { Notice, type RequestUrlResponse, requestUrl } from "obsidian";
import type { ProviderAdapter } from "src/providers/adapter";
import { getModelSpec } from "src/providers/model-info";
import { getEffectivePrompt } from "src/prompt-generator";
import { logError } from "src/utils";

export const openAiRequest: ProviderAdapter = async (settings, oldText) => {
	if (!settings.openAiApiKey) {
		new Notice("Please set your OpenAI API key in the plugin settings.");
		return;
	}

	const model = getModelSpec(settings.model, settings);
	const effectivePrompt = getEffectivePrompt(settings);

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
				model: settings.model,
				messages: [
					{ role: "developer", content: effectivePrompt },
					{ role: "user", content: oldText },
				],
			}),
		});
		console.debug("[Proofreader plugin] OpenAI response", response);
	} catch (error) {
		if ((error as { status: number }).status === 401) {
			const msg = "OpenAI API key is not valid. Please verify the key in the plugin settings.";
			new Notice(msg, 6_000);
			return;
		}
		logError(error);
		return;
	}
	const newText = response.json?.choices?.[0].message.content;
	if (!newText) {
		logError(response);
		return;
	}

	// determine overlength
	// https://platform.openai.com/docs/guides/conversation-state?api-mode=responses#managing-context-for-text-generation
	const outputTokensUsed = response.json?.usage?.completion_tokens || 0;
	const isOverlength = outputTokensUsed >= model.maxOutputTokens;

	return { newText: newText, isOverlength: isOverlength };
};
