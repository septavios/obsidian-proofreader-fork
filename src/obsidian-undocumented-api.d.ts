import "obsidian";
import { EditorView } from "@codemirror/view";

declare module "obsidian" {
	interface Editor {
		cm: EditorView;
	}
}
