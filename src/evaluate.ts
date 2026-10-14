import { evaluate as mathEval, format } from "mathjs";

/**
 * User-facing settings that control how expressions are evaluated and
 * formatted.
 */
export interface EvaluateSettings {
	/** If true, input will not have its newlines removed before evaluation. */
	bypassInputFormatting: boolean;
	/**
	 * Number of decimal places to format evaluated numbers.
	 * Set to -1 to disable formatting.
	 */
	decimalPlaces: number;
	/** If true, output will be formatted for human readability. */
	humanFormattedOutput: boolean;
	/** Locale used for human formatting. Defaults to the system locale. */
	locale?: string;
}

const defaultOnError = (ex: unknown): void => {
	console.error("Error evaluating expression:", ex);
};

/**
 * Evaluates a mathjs expression and returns its formatted result.
 * Returns undefined if the input is empty or cannot be evaluated.
 */
export function evaluate(
	input: string,
	settings: EvaluateSettings,
	options: {
		suppressErrorLog?: boolean;
		/** Called with the error when evaluation fails, unless suppressed. */
		onError?: (ex: unknown) => void;
	} = {},
): string | undefined {
	const { suppressErrorLog = false } = options;
	// Filter whitespace-only content to prevent errors.
	if (input.trim().length === 0) {
		return undefined;
	}

	if (!settings.bypassInputFormatting) {
		// Math.js does not support newlines in expressions, so we replace them
		// with spaces.
		input = input.replaceAll("\r", "").replaceAll("\n", " ");
	}

	try {
		const result = mathEval(input);
		switch (typeof result) {
			case "function":
				return "Function";
			case "number":
			case "bigint": {
				let formattedValue: string;

				// Format the number to avoid floating point imprecision issues
				if (settings.decimalPlaces === -1) {
					formattedValue = String(result);
				} else {
					formattedValue = format(result, {
						precision: settings.decimalPlaces,
					});
				}

				// Export with thousands separators (if specified in the given
				// locale) if enabled
				if (settings.humanFormattedOutput) {
					const intl = new Intl.NumberFormat(settings.locale, {
						useGrouping: true,
					});
					return intl.format(Number(formattedValue));
				} else {
					return formattedValue;
				}
			}
			default:
				return String(result);
		}
	} catch (ex: unknown) {
		const { onError = defaultOnError } = options;
		if (!suppressErrorLog) {
			onError(ex);
		}
		return undefined;
	}
}
