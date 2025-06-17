import "obsidian";

declare module "obsidian" {
	interface Editor {
		cm: EditorView;
	}
}
