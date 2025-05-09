import { PluginSettingTab, Setting } from "obsidian";
import Proofreader from "./main";

// The `nano` and `mini` models are sufficiently good sufficiently good output
// for the very focussed task of just fixing language
export const MODEL_SPECS = {
	"gpt-4.1-nano": {
		displayText: "GPT 4.1 nano (recommended)",
		maxOutputTokens: 32_768,
		costPerMillionTokens: { input: 0.1, output: 0.4 },
		info: {
			intelligence: 2,
			speed: 5,
			url: "https://platform.openai.com/docs/models/gpt-4.1-nano",
		},
	},
	"gpt-4.1-mini": {
		displayText: "GPT 4.1 mini",
		maxOutputTokens: 32_768,
		costPerMillionTokens: { input: 0.4, output: 1.6 },
		info: {
			intelligence: 3,
			speed: 4,
			url: "https://platform.openai.com/docs/models/gpt-4.1-mini",
		},
	},
	"gpt-4.1": {
		displayText: "GPT 4.1 (for tasks beyond proofreading)",
		maxOutputTokens: 32_768,
		costPerMillionTokens: { input: 2.0, output: 8.0 },
		info: {
			intelligence: 4,
			speed: 3,
			url: "https://platform.openai.com/docs/models/gpt-4.1",
		},
	},
};

type OpenAiModels = keyof typeof MODEL_SPECS;

//──────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
	openAiApiKey: "",
	openAiModel: "gpt-4.1-nano" as OpenAiModels,
	staticPrompt:
		"Act as a professional editor. Please make suggestions how to improve clarity, readability, grammar, and language of the following text. Preserve the original meaning and any technical jargon. Suggest structural changes only if they significantly improve flow or understanding. Avoid unnecessary expansion or major reformatting (e.g., no unwarranted lists). Try to make as little changes as possible, refrain from doing any changes when the writing is already sufficiently clear and concise. Output only the revised text and nothing else. The text is:",
	preserveTextInsideQuotes: false,
};

export type ProofreaderSettings = typeof DEFAULT_SETTINGS;

//──────────────────────────────────────────────────────────────────────────────

// DOCS https://docs.obsidian.md/Plugins/User+interface/Settings
export class ProofreaderSettingsMenu extends PluginSettingTab {
	plugin: Proofreader;

	constructor(plugin: Proofreader) {
		super(plugin.app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		const settings = this.plugin.settings;

		containerEl.empty();

		new Setting(containerEl).setName("OpenAI API key").addText((input) => {
			input.inputEl.type = "password"; // obfuscates the field
			input.inputEl.setCssProps({ width: "100%" });
			input
				.setPlaceholder("sk-123456789…")
				.setValue(settings.openAiApiKey)
				.onChange(async (value) => {
					settings.openAiApiKey = value.trim();
					await this.plugin.saveSettings();
				});
		});

		new Setting(containerEl)
			.setName("Model")
			.setDesc(
				"The nano model is slightly quicker and cheaper. " +
					"The mini model is slightly higher quality, but also more expensive. " +
					"Other models are both slower and more expensive; they should only be selected " +
					"by advanced users who customize the prompt and intend to use this plugin for " +
					"tasks beyond proofreading.",
			)
			.addDropdown((dropdown) => {
				for (const key in MODEL_SPECS) {
					if (!Object.hasOwn(MODEL_SPECS, key)) continue;
					const display = MODEL_SPECS[key as OpenAiModels].displayText;
					dropdown.addOption(key, display);
				}
				dropdown.setValue(settings.openAiModel).onChange(async (value) => {
					settings.openAiModel = value as OpenAiModels;
					await this.plugin.saveSettings();
				});
			});

		//────────────────────────────────────────────────────────────────────────
		// CLEANUP OPTIONS
		new Setting(containerEl)
			.setName("Preserve text inside quotes")
			.setDesc('No changes will be made to text inside quotation marks ("").')
			.addToggle((toggle) =>
				toggle.setValue(settings.preserveTextInsideQuotes).onChange(async (value) => {
					settings.preserveTextInsideQuotes = value;
					await this.plugin.saveSettings();
				}),
			);

		//────────────────────────────────────────────────────────────────────────
		// ADVANCED
		new Setting(containerEl).setName("Advanced").setHeading();

		new Setting(containerEl)
			.setName("System prompt")
			.setDesc(
				"The LLM must respond ONLY with the updated text for this plugin to work. " +
					"Most users do not need to change this setting. " +
					"Only change this if you know what you are doing.",
			)
			.addTextArea((textarea) => {
				textarea.inputEl.setCssProps({ width: "25vw", height: "15em" });
				textarea
					.setValue(settings.staticPrompt)
					.setPlaceholder("Make suggestions based on…")
					.onChange(async (value) => {
						if (value.trim() === "") return;
						settings.staticPrompt = value.trim();
						await this.plugin.saveSettings();
					});
			});
	}
}
