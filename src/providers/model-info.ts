import type { ProviderAdapter, ProviderName } from "src/providers/adapter";
import { openAiRequest } from "src/providers/openai";
import { openAiCompatibleRequest } from "src/providers/openai-compatible";
import type { ProofreaderSettings } from "src/settings";

export const PROVIDER_REQUEST_MAP: Record<ProviderName, ProviderAdapter> = {
	openai: openAiRequest,
	"openai-compatible": openAiCompatibleRequest,
};

export const MODEL_SPECS = {
	"gpt-4.1-nano": {
		provider: "openai",
		displayText: "GPT 4.1 nano (recommended)",
		maxOutputTokens: 32_768,
		// `info` key is not actively used, just informational
		info: {
			costPerMillionTokens: { input: 0.1, output: 0.4 },
			intelligence: 2,
			speed: 5,
			url: "https://platform.openai.com/docs/models/gpt-4.1-nano",
		},
	},
	"gpt-4.1-mini": {
		provider: "openai",
		displayText: "GPT 4.1 mini",
		maxOutputTokens: 32_768,
		info: {
			costPerMillionTokens: { input: 0.4, output: 1.6 },
			intelligence: 3,
			speed: 4,
			url: "https://platform.openai.com/docs/models/gpt-4.1-mini",
		},
	},
	"gpt-4.1": {
		provider: "openai",
		displayText: "GPT 4.1 (for tasks beyond proofreading)",
		maxOutputTokens: 32_768,
		info: {
			costPerMillionTokens: { input: 2.0, output: 8.0 },
			intelligence: 4,
			speed: 3,
			url: "https://platform.openai.com/docs/models/gpt-4.1",
		},
	},
	"qwen2.5-72b-instruct": {
		provider: "openai-compatible",
		displayText: "Qwen2.5 72B Instruct",
		maxOutputTokens: 32_768,
		info: {
			costPerMillionTokens: { input: 0.5, output: 2.0 },
			intelligence: 4,
			speed: 3,
			url: "https://help.aliyun.com/zh/dashscope/developer-reference/model-introduction",
		},
	},
	"qwen2.5-14b-instruct": {
		provider: "openai-compatible",
		displayText: "Qwen2.5 14B Instruct",
		maxOutputTokens: 32_768,
		info: {
			costPerMillionTokens: { input: 0.2, output: 0.6 },
			intelligence: 3,
			speed: 4,
			url: "https://help.aliyun.com/zh/dashscope/developer-reference/model-introduction",
		},
	},
	"qwen2.5-7b-instruct": {
		provider: "openai-compatible",
		displayText: "Qwen2.5 7B Instruct",
		maxOutputTokens: 32_768,
		info: {
			costPerMillionTokens: { input: 0.1, output: 0.3 },
			intelligence: 2,
			speed: 5,
			url: "https://help.aliyun.com/zh/dashscope/developer-reference/model-introduction",
		},
	},
	"qwen-plus": {
		provider: "openai-compatible",
		displayText: "Qwen Plus",
		maxOutputTokens: 32_768,
		info: {
			costPerMillionTokens: { input: 0.4, output: 1.2 },
			intelligence: 4,
			speed: 4,
			url: "https://help.aliyun.com/zh/dashscope/developer-reference/model-introduction",
		},
	},
	"deepseek-chat": {
		provider: "openai-compatible",
		displayText: "DeepSeek Chat",
		maxOutputTokens: 32_768,
		info: {
			costPerMillionTokens: { input: 0.14, output: 0.28 },
			intelligence: 3,
			speed: 4,
			url: "https://platform.deepseek.com/api-docs/",
		},
	},
} as const; // `as const` needed for type inference

// Helper function to get all available models including custom ones
export function getAllModels(settings: ProofreaderSettings) {
	const builtInModels = Object.keys(MODEL_SPECS) as Array<keyof typeof MODEL_SPECS>;
	const customModelIds = settings.customModels.map(model => model.id);
	return [...builtInModels, ...customModelIds];
}

// Helper function to get model spec (built-in or custom)
export function getModelSpec(modelId: string, settings: ProofreaderSettings) {
	// Check if it's a built-in model
	if (modelId in MODEL_SPECS) {
		return MODEL_SPECS[modelId as keyof typeof MODEL_SPECS];
	}
	
	// Check if it's a custom model
	const customModel = settings.customModels.find(model => model.id === modelId);
	if (customModel) {
		return {
			provider: customModel.provider,
			displayText: customModel.displayName,
			maxOutputTokens: customModel.maxOutputTokens,
		};
	}
	
	// Fallback to default model if not found
	return MODEL_SPECS["gpt-4.1-nano"];
}
