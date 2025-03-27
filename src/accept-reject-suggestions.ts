import { Editor } from "obsidian";

export function acceptOrRejectInText(editor: Editor, mode: "accept" | "reject"): void {
	const selection = editor.getSelection();
	const cursor = editor.getCursor();

	const text = selection || editor.getLine(cursor.line);
	const updatedText =
		mode === "accept"
			? text.replace(/==/g, "").replace(/~~.*?~~/g, "")
			: text.replace(/~~/g, "").replace(/==.*?==/g, "");
	if (selection) editor.replaceSelection(updatedText);
	else editor.setLine(cursor.line, updatedText);

	// keep cursor location
	const charsLess = text.length - updatedText.length;
	cursor.ch = Math.max(cursor.ch - charsLess, 0);
	editor.setCursor(cursor);
}
}
