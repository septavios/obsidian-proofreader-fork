import { PluginSettingTab, Setting } from "obsidian";
import Proofreader from "./main";

// The `nano` and `mini` models are sufficiently good sufficiently good output
// for the very focussed task of just fixing language
export const MODEL_SPECS = {
	"gpt-4.1-nano": {
		displayText: "GPT 4.1 nano",
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
};

type OpenAiModels = keyof typeof MODEL_SPECS;

//──────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
	openAiApiKey: "",
	openAiModel: "gpt-4.1-nano" as OpenAiModels,
	staticPrompt:
		"Please make suggestions how to improve readability, grammar, and language of the following text. Do not change anything about the content, and refrain from doing any changes when the writing is already sufficiently clear and concise. Try to make as little changes as possible. Output only the changed text and nothing else. The text is: ",
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

		new Setting(containerEl).setName("OpenAI API Key").addText((input) => {
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
				"The nano model is slightly quicker and cheaper." +
					" The mini model is slightly higher quality, but also more expensive. ",
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
		// ADVANCED
		new Setting(containerEl).setName("Advanced").setHeading();

		new Setting(containerEl)
			.setName("Prompt")
			.setDesc(
				"The prompt needs to result in the AI answering only with the updated text, otherwise this plugin does not work. " +
					"Most users do not need to change this setting; only change it if you know what you are doing.",
			)
			.addTextArea((textarea) => {
				textarea.inputEl.setCssProps({ width: "25vw", height: "15em" });
				textarea
					.setValue(settings.staticPrompt)
					.setPlaceholder("Make suggestions based on…")
					.onChange(async (value) => {
						settings.staticPrompt = value.trim();
						await this.plugin.saveSettings();
					});
			});
	}
}
