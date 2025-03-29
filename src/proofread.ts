import { Change, diffWords } from "diff";
import { Editor, Notice, getFrontMatterInfo } from "obsidian";
import Proofreader from "./main";
import { openAiRequest } from "./openai-request";

// DOCS https://github.com/kpdecker/jsdiff#readme
function getDiffMarkdown(oldText: string, newText: string, overlength?: boolean): string {
	const diff = diffWords(oldText, newText);

	// do not remove text after cutoff-length
	if (overlength) {
		(diff.at(-1) as Change).removed = false;
		const cutOffCallout =
			"\n\n" +
			"> [!INFO] End of proofreading\n" +
			"> The input text was too long. Text after this point is unchanged." +
			"\n\n";
		diff.splice(-2, 0, { added: false, removed: false, value: cutOffCallout });
	}

	// diff objects to ==highlights== and ~~strikethrough~~
	const textWithSuggestions = diff
		.map((part) => {
			if (part.added) return `==${part.value}==`;
			if (part.removed) return `~~${part.value}~~`;
			return part.value;
		})
		.join("");

	// notification
	const changeCount = diff.filter((part) => part.added || part.removed).length;
	const pluralS = changeCount === 1 ? "" : "s";
	if (changeCount > 0) new Notice(`🤖 ${changeCount} change${pluralS} made.`);

	return textWithSuggestions;
}

async function getChanges(
	plugin: Proofreader,
	oldText: string,
	scope: string,
): Promise<string | undefined> {
	if (oldText.trim() === "") {
		new Notice(`${scope} is empty.`);
		return;
	}
	if (oldText.match(/==|~~/)) {
		const warnMsg =
			`${scope} already has highlights or strikethroughs.\n\n` +
			"Please accept/reject the changes before making another proofreading request.";
		new Notice(warnMsg, 6000);
		return;
	}
	const { newText, overlength } = (await openAiRequest(plugin.settings, oldText, scope)) || {};
	if (!newText) return;

	if (newText === oldText) {
		new Notice("✅ Text is good, nothing to change.");
		return;
	}

	return getDiffMarkdown(oldText, newText, overlength);
}

//──────────────────────────────────────────────────────────────────────────────

export async function proofreadDocument(plugin: Proofreader, editor: Editor): Promise<void> {
	const noteWithFrontmatter = editor.getValue();
	const bodyStart = getFrontMatterInfo(noteWithFrontmatter).contentStart || 0;
	const bodyEnd = noteWithFrontmatter.length;
	const oldText = noteWithFrontmatter.slice(bodyStart);

	const changes = await getChanges(plugin, oldText, "Document");
	if (!changes) return;

	const bodyStartPos = editor.offsetToPos(bodyStart);
	const bodyEndPos = editor.offsetToPos(bodyEnd);
	editor.replaceRange(changes, bodyStartPos, bodyEndPos);
	editor.setCursor(bodyStartPos); // to start of doc
}

export async function proofreadText(plugin: Proofreader, editor: Editor): Promise<void> {
	const cursor = editor.getCursor("from"); // `from` gives start if selection
	const selection = editor.getSelection();
	const oldText = selection || editor.getLine(cursor.line);
	const scope = selection ? "Selection" : "Paragraph";

	const changes = await getChanges(plugin, oldText, scope);
	if (!changes) return;

	if (selection) {
		editor.replaceSelection(changes);
		editor.setCursor(cursor); // to start of selection
	} else {
		editor.setLine(cursor.line, changes);
		editor.setCursor({ line: cursor.line, ch: 0 }); // to start of paragraph
	}
}
