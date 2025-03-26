import { Editor } from "obsidian";

export function acceptOrReject(editor: Editor, mode: "accept" | "reject"): void {
	const selection = editor.getSelection();
	const { line, ch } = editor.getCursor();

	const text = selection || editor.getLine(line);
	const updatedText =
		mode === "accept"
			? text.replace(/==/g, "").replace(/~~.*?~~/g, "")
			: text.replace(/~~/g, "").replace(/==.*?==/g, "");
	if (selection) editor.replaceSelection(updatedText);
	else editor.setLine(line, updatedText);

	// keep cursor location
	const charsLess = text.length - updatedText.length;
	editor.setCursor({ line: line, ch: Math.max(ch - charsLess, 0) });
}
