/**
 * The bounds of a selection on a single line.
 */
export interface LineSelection {
	start: number;
	end: number;
}

/**
 * Expands an empty selection (a cursor at `character` on a line with the given
 * text) to the bounds of the space-delimited word surrounding the cursor. If
 * the cursor is not inside a word, the returned selection remains empty.
 */
export function expandEmptySelection(
	lineText: string,
	character: number,
): LineSelection {
	let start = character;
	let end = character;
	while (start > 0 && !/\s/.test(lineText[start - 1])) {
		start--;
	}
	while (end < lineText.length && !/\s/.test(lineText[end])) {
		end++;
	}

	return { start, end };
}
