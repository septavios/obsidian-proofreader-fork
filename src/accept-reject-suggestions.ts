import { Editor, Notice } from "obsidian";

export function acceptOrRejectInText(editor: Editor, mode: "accept" | "reject"): void {
	const selection = editor.getSelection();
	const cursor = editor.getCursor();
	const scope = selection ? "selection" : "paragraph";
	const text = selection || editor.getLine(cursor.line);

	if (!text.match(/==|~~/)) {
		new Notice(`There are no highlights or strikethroughs in the ${scope}.`, 3000);
		return;
	}

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
