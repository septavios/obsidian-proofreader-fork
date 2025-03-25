import { Editor } from "obsidian";

export function acceptOrReject(editor: Editor, mode: "accept" | "reject"): void {
	const { line, ch } = editor.getCursor();

	const lineText = editor.getLine(line);
	const updatedLine =
		mode === "accept"
			? lineText.replace(/==/g, "").replace(/~~.*?~~/g, "")
			: lineText.replace(/~~/g, "").replace(/==.*?==/g, "");
	editor.setLine(line, updatedLine);

	// keep cursor location
	const charsLess = lineText.length - updatedLine.length;
	editor.setCursor({ line: line, ch: Math.max(ch - charsLess, 0) });
}
