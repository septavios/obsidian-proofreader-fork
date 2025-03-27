import { Editor, Notice } from "obsidian";

function updateText(text: string, mode: "accept" | "reject"): string {
	return mode === "accept"
		? text.replace(/==/g, "").replace(/~~.*?~~/g, "")
		: text.replace(/~~/g, "").replace(/==.*?==/g, "");
}

export function acceptOrRejectInText(editor: Editor, mode: "accept" | "reject"): void {
	const selection = editor.getSelection();
	const cursor = editor.getCursor();
	const scope = selection ? "selection" : "paragraph";
	const text = selection || editor.getLine(cursor.line);

	if (!text.match(/==|~~/)) {
		new Notice(`There are no highlights or strikethroughs in the ${scope}.`, 3000);
		return;
	}

	const updatedText = updateText(text, mode);
	if (selection) editor.replaceSelection(updatedText);
	else editor.setLine(cursor.line, updatedText);

	// keep cursor location
	const charsLess = text.length - updatedText.length;
	cursor.ch = Math.max(cursor.ch - charsLess, 0);
	editor.setCursor(cursor);
}

export function acceptOrRejectNextSuggestion(editor: Editor, mode: "accept" | "reject"): void {
	const cursor = editor.getCursor()
	const cursorOffset = editor.posToOffset(cursor) + 1;
	const text = editor.getValue();

	let matchText = "";
	let matchStart = 0;
	let matchEnd = 0;
	let searchPos = 0;
	while (true) {
		const nextMatch = text.slice(searchPos).match(/(==|~~)(.*?)(\1)/);
		if (!nextMatch) {
			new Notice("There are no highlights or strikethroughs until the end of the note.", 3000);
			return;
		}
		matchText = nextMatch[0];
		matchStart = searchPos + (nextMatch.index as number);
		matchEnd = matchStart + matchText.length;
		const cursorOnMatch = cursorOffset >= matchStart && cursorOffset <= matchEnd;
		const cursorBeforeMatch = cursorOffset <= matchStart;
		if (cursorOnMatch || cursorBeforeMatch) break;
		searchPos = matchEnd + 1;
	}

	const matchStartPos = editor.offsetToPos(matchStart);
	const matchEndPos = editor.offsetToPos(matchEnd);
	const updatedText = updateText(matchText, mode);

	editor.replaceRange(updatedText, matchStartPos, matchEndPos);
	editor.setCursor(matchStartPos);
}
