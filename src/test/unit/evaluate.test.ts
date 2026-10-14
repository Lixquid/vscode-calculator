import * as assert from "assert";

import { evaluate, type EvaluateSettings } from "../../evaluate.js";

/** Settings equivalent to the default extension configuration. */
const defaultSettings: EvaluateSettings = {
	bypassInputFormatting: false,
	decimalPlaces: 14,
	humanFormattedOutput: false,
};

function settings(overrides: Partial<EvaluateSettings> = {}): EvaluateSettings {
	return { ...defaultSettings, ...overrides };
}

suite("evaluate", () => {
	test("returns undefined for empty or whitespace-only input", () => {
		assert.strictEqual(evaluate("", defaultSettings), undefined);
		assert.strictEqual(evaluate("   ", defaultSettings), undefined);
		assert.strictEqual(evaluate("\n\t", defaultSettings), undefined);
	});

	test("evaluates simple expressions", () => {
		assert.strictEqual(evaluate("1 + 2", defaultSettings), "3");
		assert.strictEqual(evaluate("2 * (3 + 4)", defaultSettings), "14");
	});

	test("rounds to the configured number of decimal places", () => {
		assert.strictEqual(
			evaluate("0.1 + 0.2", settings({ decimalPlaces: 14 })),
			"0.3",
		);
		assert.strictEqual(
			evaluate("1 / 3", settings({ decimalPlaces: 4 })),
			"0.3333",
		);
	});

	test("does not format when decimalPlaces is -1", () => {
		assert.strictEqual(
			evaluate("0.1 + 0.2", settings({ decimalPlaces: -1 })),
			"0.30000000000000004",
		);
	});

	test("formats output for human readability when enabled", () => {
		assert.strictEqual(
			evaluate(
				"1234.5",
				settings({ humanFormattedOutput: true, locale: "en-US" }),
			),
			"1,234.5",
		);
		assert.strictEqual(
			evaluate(
				"1234.5",
				settings({ humanFormattedOutput: true, locale: "de-DE" }),
			),
			"1.234,5",
		);
	});

	test("evaluates multiline input", () => {
		assert.strictEqual(evaluate("1 +\n2", defaultSettings), "3");
	});

	test("joins newline-separated lines into one expression by default", () => {
		assert.strictEqual(evaluate("1\n+2", defaultSettings), "3");
	});

	test("does not join lines when bypassing input formatting", () => {
		assert.strictEqual(
			evaluate("1\n+2", settings({ bypassInputFormatting: true })),
			"[1, 2]",
		);
	});

	test("returns undefined for invalid expressions", () => {
		assert.strictEqual(evaluate("1 +", defaultSettings), undefined);
		assert.strictEqual(
			evaluate("undefinedVariable", defaultSettings),
			undefined,
		);
	});

	test("does not throw for invalid expressions", () => {
		assert.doesNotThrow(() => evaluate("1 +", defaultSettings));
	});

	test("reports errors unless suppressed", () => {
		const errors: unknown[] = [];
		const onError = (ex: unknown): void => {
			errors.push(ex);
		};
		assert.strictEqual(
			evaluate("1 +", defaultSettings, { onError }),
			undefined,
		);
		assert.strictEqual(errors.length, 1);
		assert.strictEqual(
			evaluate("1 +", defaultSettings, {
				onError,
				suppressErrorLog: true,
			}),
			undefined,
		);
		assert.strictEqual(errors.length, 1);
	});

	test("reports functions without evaluating them", () => {
		assert.strictEqual(evaluate("sqrt", defaultSettings), "Function");
	});

	test("stringifies non-numeric results", () => {
		assert.strictEqual(evaluate("1 == 1", defaultSettings), "true");
		assert.strictEqual(evaluate("true", defaultSettings), "true");
		assert.strictEqual(evaluate("[1, 2]", defaultSettings), "[1, 2]");
	});
});
