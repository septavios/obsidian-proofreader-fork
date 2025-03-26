import { PluginSettingTab, Setting } from "obsidian";
import Proofreader from "./main";

//──────────────────────────────────────────────────────────────────────────────

export const OPENAI_MODEL = "gpt-4o-mini";

export const STATIC_PROMPT = `
Please make suggestions how to improve
readability, grammar, and language of the following text. Do not change anything
about the content, and refrain from doing any changes when the writing is
already sufficiently clear and concise. Try to make as little changes as
possible. Output only the changed text and nothing else. The text is: 
`.replaceAll("\n", " ");

//──────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
	openAiApiKey: "",
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

		// GENERAL
		new Setting(containerEl).setName("OpenAI API Key").addText((input) => {
			input.inputEl.type = "password"; // obfuscates the field
			input.inputEl.setCssProps({ width: "100%" });
			input
				.setPlaceholder("sk-123456789…")
				.setValue(settings.openAiApiKey)
				.onChange(async (value) => {
					settings.openAiApiKey = value;
					await this.plugin.saveSettings();
				});
		});
	}
}
