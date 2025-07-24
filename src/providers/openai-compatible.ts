import { Notice, type RequestUrlResponse, requestUrl } from "obsidian";
import type { ProviderAdapter } from "src/providers/adapter";
import { getModelSpec } from "src/providers/model-info";
import { getEffectivePrompt } from "src/prompt-generator";
import { logError } from "src/utils";

export const openAiCompatibleRequest: ProviderAdapter = async (settings, oldText) => {
	if (!settings.customApiKey) {
		new Notice("Please set your custom API key in the plugin settings.");
		return;
	}

	if (!settings.customApiEndpoint) {
		new Notice("Please set your custom API endpoint in the plugin settings.");
		return;
	}

	const model = getModelSpec(settings.model, settings);
	const effectivePrompt = getEffectivePrompt(settings);

	// Ensure the endpoint ends with the correct path
	let endpoint = settings.customApiEndpoint.trim();
	if (!endpoint.endsWith('/chat/completions')) {
		if (endpoint.endsWith('/')) {
			endpoint += 'chat/completions';
		} else {
			endpoint += '/chat/completions';
		}
	}

	let response: RequestUrlResponse;
	try {
		// Use OpenAI-compatible API format
		response = await requestUrl({
			url: endpoint,
			method: "POST",
			contentType: "application/json",
			// biome-ignore lint/style/useNamingConvention: not by me
			headers: { Authorization: "Bearer " + settings.customApiKey },
			body: JSON.stringify({
				model: settings.model,
				messages: [
					{ role: "system", content: effectivePrompt },
					{ role: "user", content: oldText },
				],
			}),
		});
		console.debug("[Proofreader plugin] Custom API response", response);
	} catch (error) {
		if ((error as { status: number }).status === 401) {
			const msg = "Custom API key is not valid. Please verify the key in the plugin settings.";
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
	const outputTokensUsed = response.json?.usage?.completion_tokens || 0;
	const isOverlength = outputTokensUsed >= model.maxOutputTokens;

	return { newText: newText, isOverlength: isOverlength };
};