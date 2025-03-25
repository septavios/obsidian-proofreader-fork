import { Plugin } from "obsidian";
import { acceptOrReject } from "./accept-reject-suggestions";
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
	}

	override onunload(): void {
		console.info(this.manifest.name + " Plugin unloaded.");
	}
}
