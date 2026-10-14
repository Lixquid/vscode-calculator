import * as assert from "assert";

import { expandEmptySelection } from "../../selectionUtils.js";

suite("expandEmptySelection", () => {
	test("expands a cursor inside a word to the word bounds", () => {
		assert.deepStrictEqual(expandEmptySelection("foo bar", 1), {
			start: 0,
			end: 3,
		});
		assert.deepStrictEqual(expandEmptySelection("foo bar", 4), {
			start: 4,
			end: 7,
		});
	});

	test("expands a cursor at word boundaries", () => {
		assert.deepStrictEqual(expandEmptySelection("foo bar", 0), {
			start: 0,
			end: 3,
		});
		assert.deepStrictEqual(expandEmptySelection("foo bar", 3), {
			start: 0,
			end: 3,
		});
		assert.deepStrictEqual(expandEmptySelection("foo bar", 7), {
			start: 4,
			end: 7,
		});
	});

	test("leaves a cursor between words empty", () => {
		assert.deepStrictEqual(expandEmptySelection("foo bar", 4), {
			start: 4,
			end: 7,
		});
		assert.deepStrictEqual(expandEmptySelection("foo  bar", 4), {
			start: 4,
			end: 4,
		});
	});

	test("treats all whitespace as a separator", () => {
		assert.deepStrictEqual(expandEmptySelection("foo\tbar", 5), {
			start: 4,
			end: 7,
		});
	});

	test("handles an empty line", () => {
		assert.deepStrictEqual(expandEmptySelection("", 0), {
			start: 0,
			end: 0,
		});
	});
});
