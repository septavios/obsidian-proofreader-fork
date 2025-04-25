import { Change, diffWords } from "diff";
import { Editor, Notice, getFrontMatterInfo } from "obsidian";
import Proofreader from "./main";
import { openAiRequest } from "./openai-request";

// DOCS https://github.com/kpdecker/jsdiff#readme
function getDiffMarkdown(
	oldText: string,
	newText: string,
	overlength?: boolean,
): { textWithSuggestions: string; changeCount: number } {
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
			if (!part.added && !part.removed) return part.value;
			const value = part.added ? `==${part.value}==` : `~~${part.value}~~`;
			return value.replace(/^(==|~~) /, " $1"); // prevent leading spaces in markup, which makes it invalid
		})
		.join("");
	const changeCount = diff.filter((part) => part.added || part.removed).length;

	return { textWithSuggestions: textWithSuggestions, changeCount: changeCount };
}

async function validateAndGetChangesAndNotify(
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
	const { newText, overlength, cost } =
		(await openAiRequest(plugin.settings, oldText, scope)) || {};
	if (!newText) return;

	if (newText === oldText) {
		new Notice("✅ Text is good, nothing to change.");
		return;
	}

	const { textWithSuggestions, changeCount } = getDiffMarkdown(oldText, newText, overlength);

	// notify
	const pluralS = changeCount === 1 ? "" : "s";
	const msg = [
		`🤖 ${changeCount} change${pluralS} made.`,
		"",
		`est. cost: $${cost?.toFixed(5)}`,
	].join("\n");

	// Proofreading a document likely takes longer, we want to keep the finishing
	// message in case the user goes afk. (In the Notice API, duration 0 means
	// keeping the notice until the user dismisses it.)
	const duration = scope === "Document" ? 0 : 5_000;

	new Notice(msg, duration);

	return textWithSuggestions;
}

//──────────────────────────────────────────────────────────────────────────────

export async function proofreadDocument(plugin: Proofreader, editor: Editor): Promise<void> {
	const noteWithFrontmatter = editor.getValue();
	const bodyStart = getFrontMatterInfo(noteWithFrontmatter).contentStart || 0;
	const bodyEnd = noteWithFrontmatter.length;
	const oldText = noteWithFrontmatter.slice(bodyStart);

	const changes = await validateAndGetChangesAndNotify(plugin, oldText, "Document");
	if (!changes) return;

	const bodyStartPos = editor.offsetToPos(bodyStart);
	const bodyEndPos = editor.offsetToPos(bodyEnd);
	editor.replaceRange(changes, bodyStartPos, bodyEndPos);
	editor.setCursor(bodyStartPos); // to start of doc
}

export async function proofreadText(plugin: Proofreader, editor: Editor): Promise<void> {
	const hasMultipleSelections = editor.listSelections().length > 1;
	if (hasMultipleSelections) {
		new Notice("Multiple selections are not supported.");
		return;
	}

	const cursor = editor.getCursor("from"); // `from` gives start if selection
	const selection = editor.getSelection();
	const oldText = selection || editor.getLine(cursor.line);
	const scope = selection ? "Selection" : "Paragraph";

	const changes = await validateAndGetChangesAndNotify(plugin, oldText, scope);
	if (!changes) return;

	if (selection) {
		editor.replaceSelection(changes);
		editor.setCursor(cursor); // to start of selection
	} else {
		editor.setLine(cursor.line, changes);
		editor.setCursor({ line: cursor.line, ch: 0 }); // to start of paragraph
	}
}
