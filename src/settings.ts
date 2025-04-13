import { PluginSettingTab, Setting } from "obsidian";
import Proofreader from "./main";

//──────────────────────────────────────────────────────────────────────────────

// DOCS https://platform.openai.com/docs/models/gpt-4o-mini
// `gpt-4o-mini` is much cheaper and slightly quicker, and still has
// sufficiently good output. (A 2000 word document costs about 0.2 cent.)
export const OPENAI_MODEL = {
	name: "gpt-4o-mini",
	maxOutputTokens: 16_384,
	costPerMillionToken: { input: 0.15, output: 0.6 },
};

//──────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
	openAiApiKey: "",
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
