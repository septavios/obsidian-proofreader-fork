import { MODEL_SPECS } from "src/providers/model-info";
import { ProofreaderSettings } from "src/settings";

type ProviderResponse = {
	newText: string; // output text from LLM
	isOverlength: boolean; // whether output hit token limit, i.e., output is truncated
};

export type ProviderAdapter = (
	settings: ProofreaderSettings,
	oldText: string,
) => Promise<ProviderResponse | undefined>;

export type ModelName = keyof typeof MODEL_SPECS;
export type ProviderName = (typeof MODEL_SPECS)[ModelName]["provider"];

export type ModelSpec = {
	provider: string;
	displayText: string;
	maxOutputTokens: number;
	info: unknown; // not used, just information value
};
