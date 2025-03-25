import { Plugin } from "obsidian";
import { proofreadParagraph } from "./proofread";

// biome-ignore lint/style/noDefaultExport: required for Obsidian plugins to work
export default class Proofreader extends Plugin {
	override onload(): void {
		console.info(this.manifest.name + " Plugin loaded.");

		this.addCommand({
			id: "proofread-paragraph",
			name: "Proofread current paragraph",
			editorCallback: (editor): Promise<void> => proofreadParagraph(editor),
		});
	}

	override onunload(): void {
		console.info(this.manifest.name + " Plugin unloaded.");
	}
}
