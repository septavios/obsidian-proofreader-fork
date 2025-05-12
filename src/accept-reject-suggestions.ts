import { Editor, EditorPosition, Notice } from "obsidian";

function removeMarkup(text: string, mode: "accept" | "reject"): string {
	const noMarkup =
		mode === "accept"
			? text.replace(/==/g, "").replace(/~~[^=~]*~~/g, "")
			: text.replace(/~~/g, "").replace(/==[^=~]*==/g, "");
	return noMarkup.replaceAll("  ", " "); // remove double spaces left by markup
}

// Manually calculating the visibility of an offset is necessary, since
// CodeMirror's viewport includes extra margin around the visible area.
function positionVisibleOnScreen(editor: Editor, pos: EditorPosition): boolean {
	const offset = editor.posToOffset(pos);

	const coord = editor.cm.coordsAtPos(offset);
	if (!coord) return false; // no coord = outside viewport

	// FIX typo-casting as `unknown` and then actual type, since Obsidian's
	// typing is incomplete, see https://forum.obsidian.md/t/api-bug-editor-getscrollinfo-is-typed-incorrectly/98886
	const view = editor.getScrollInfo() as unknown as { clientHeight: number };

	const visible = coord.top < view.clientHeight && coord.top > 0;
	return visible;
}

//──────────────────────────────────────────────────────────────────────────────

export function acceptOrRejectInText(editor: Editor, mode: "accept" | "reject"): void {
	const selection = editor.getSelection();
	const cursor = editor.getCursor();
	const scope = selection ? "selection" : "paragraph";
	const text = selection || editor.getLine(cursor.line);

	if (!text.match(/==|~~/)) {
		new Notice(`There are no highlights or strikethroughs in the ${scope}.`, 3000);
		return;
	}

	const updatedText = removeMarkup(text, mode);
	if (selection) editor.replaceSelection(updatedText);
	else editor.setLine(cursor.line, updatedText);

	// keep cursor location
	const charsLess = text.length - updatedText.length;
	cursor.ch = Math.max(cursor.ch - charsLess, 0);
	editor.setCursor(cursor);
}

export function acceptOrRejectNextSuggestion(editor: Editor, mode: "accept" | "reject"): void {
	const cursor = editor.getCursor();
	const cursorOffset = editor.posToOffset(cursor) + 1;
	const text = editor.getValue();

	// CASE 1: if cursor not visible, scroll to it instead
	if (!positionVisibleOnScreen(editor, cursor)) {
		new Notice("Cursor is not visible. Scrolled to the cursor instead.");
		editor.scrollIntoView({ from: cursor, to: cursor }, true);
		return;
	}

	// FIND NEXT SUGGESTION
	// since highlights and strikethroughs do not span lines, it is safe to
	// start searching at the beginning of the cursor line
	const startOfCursorlineOffset = editor.posToOffset({ line: cursor.line, ch: 0 });
	let searchStart = startOfCursorlineOffset;

	let matchText = "";
	let matchStart = 0;
	let matchEnd = 0;
	while (true) {
		const nextMatch = text.slice(searchStart).match(/ ?(==[^~=]*?==|~~[^~=]*~~) ?/);
		if (!nextMatch) {
			new Notice("There are no highlights or strikethroughs until the end of the note.", 3000);
			return;
		}
		matchText = nextMatch[0];
		matchStart = searchStart + (nextMatch.index as number);
		matchEnd = matchStart + matchText.length;
		const cursorOnMatch = cursorOffset >= matchStart && cursorOffset <= matchEnd;
		const cursorBeforeMatch = cursorOffset <= matchStart;
		if (cursorOnMatch || cursorBeforeMatch) break;
		searchStart = matchEnd;
	}
	const matchStartPos = editor.offsetToPos(matchStart);
	const matchEndPos = editor.offsetToPos(matchEnd);

	// CASE 2: if suggestion not visible, scroll to it instead
	if (!positionVisibleOnScreen(editor, matchEndPos)) {
		new Notice("Next suggestion not visible. Scrolled to next suggestion instead.");
		editor.scrollIntoView({ from: matchStartPos, to: matchEndPos }, true);
		editor.setCursor(matchStartPos);
		return;
	}

	// CASE 3: Cursor & suggestion visible -> update text
	const updatedText = removeMarkup(matchText, mode);
	editor.replaceRange(updatedText, matchStartPos, matchEndPos);
	editor.setCursor(matchStartPos);
}
