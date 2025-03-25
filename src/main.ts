import { Plugin } from "obsidian";
import { acceptOrReject } from "./accept-reject-suggestions";
import { proofreadParagraph } from "./proofread";
import { DEFAULT_SETTINGS, ProofreaderSettings, ProofreaderSettingsMenu } from "./settings";

// biome-ignore lint/style/noDefaultExport: required for Obsidian plugins to work
export default class Proofreader extends Plugin {
	settings: ProofreaderSettings = DEFAULT_SETTINGS;

	override async onload(): Promise<void> {
		// settings
		await this.loadSettings();
		this.addSettingTab(new ProofreaderSettingsMenu(this));

		// commands
		this.addCommand({
			id: "proofread-paragraph",
			name: "Proofread current paragraph",
			editorCallback: (editor): Promise<void> => proofreadParagraph(this, editor),
		});
		this.addCommand({
			id: "accept-suggestions",
			name: "Accept all suggestions for current paragraph",
			editorCallback: (editor): void => acceptOrReject(editor, "accept"),
		});
		this.addCommand({
			id: "reject-suggestions",
			name: "Reject all suggestions for current paragraph",
			editorCallback: (editor): void => acceptOrReject(editor, "reject"),
		});

		console.info(this.manifest.name + " Plugin loaded.");
	}

	override onunload(): void {
		console.info(this.manifest.name + " Plugin unloaded.");
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
}
