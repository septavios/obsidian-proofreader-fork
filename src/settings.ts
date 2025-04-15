import { PluginSettingTab, Setting } from "obsidian";
import Proofreader from "./main";

// DOCS https://platform.openai.com/docs/models/gpt-4o-mini
// The `nano` and `mini` models are sufficiently good sufficiently good output.
export const MODEL_SPECS = {
	"gpt-4.1-nano": {
		displayText: "GPT 4.1 nano (recommended)",
		maxOutputTokens: 32_768,
		costPerMillionTokens: { input: 0.1, output: 0.4 },
		intelligence: 2,
		speed: 5,
	},
	"gpt-4.1-mini": {
		displayText: "GPT 4.1 mini",
		maxOutputTokens: 32_768,
		costPerMillionTokens: { input: 0.4, output: 1.6 },
		intelligence: 3,
		speed: 4,
	},
	"gpt-4o-mini": {
		displayText: "GPT 4o mini",
		maxOutputTokens: 16_384,
		costPerMillionTokens: { input: 0.15, output: 0.6 },
		intelligence: 2,
		speed: 4,
	},
};

type OpenAiModels = keyof typeof MODEL_SPECS;

//──────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
	openAiApiKey: "",
	staticPrompt:
		"Please make suggestions how to improve readability, grammar, and language of the following text. Do not change anything about the content, and refrain from doing any changes when the writing is already sufficiently clear and concise. Try to make as little changes as possible. Output only the changed text and nothing else. The text is: ",
	openAiModel: "gpt-4.1-nano" as OpenAiModels,
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
				"4.1 nano is slightly quicker and cheaper, 4.1 mini is slightly higher quality, but also the most expensive. " +
					"4o mini is less recent and thus better tested, but otherwise slightly slower, and slightly lower quality.",
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
