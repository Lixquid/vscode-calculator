import { copy } from "copy-paste";
import { format, evaluate as mathEval } from "mathjs";
import * as vscode from "vscode";

//#region Variables
let widget: vscode.StatusBarItem;

const intl = new Intl.NumberFormat(undefined, {
	useGrouping: true,
});
//#endregion

//#region Utility Functions
function evaluate(input: string): string | undefined {
	if (
		!vscode.workspace
			.getConfiguration("calculator")
			.get("advanced.bypassInputFormatting", false)
	) {
		// Math.js does not support newlines in expressions, so we replace them with spaces.
		input = input.replaceAll("\r", "").replaceAll("\n", " ");
	}

	try {
		const result = mathEval(input);
		const config = vscode.workspace.getConfiguration("calculator");
		switch (typeof result) {
			case "function":
				return "Function";
			case "number":
			case "bigint": {
				const decimalPlaces = config.get<number>(
					"advanced.decimalPlaces",
					14,
				);
				let formattedValue: string;

				// Format the number to avoid floating point imprecision issues
				if (decimalPlaces === -1) {
					formattedValue = String(result);
				} else {
					formattedValue = format(result, {
						precision: decimalPlaces,
					});
				}

				// Export with thousands separators (if specified in the current locale)
				// if enabled
				if (config.get("humanFormattedOutput", false)) {
					return intl.format(Number(formattedValue));
				} else {
					return formattedValue;
				}
			}
			default:
				return String(result);
		}
	} catch (ex: unknown) {
		console.error("Error evaluating expression:", ex);
		return undefined;
	}
}

function iterateSelections(
	all: boolean,
	callback: (input: string) => string | undefined,
): void {
	const editor = vscode.window.activeTextEditor;
	const document = editor?.document;
	const selections = editor?.selections;

	if (!document || !selections) return;

	vscode.window.activeTextEditor?.edit((edit) => {
		for (const selection of selections) {
			if (selection.isEmpty && !all) continue;

			const text = document.getText(selection);

			try {
				const result = callback(text);
				if (result == undefined) continue;
				edit.replace(selection, result);
			} catch (ex) {
				console.error(ex);
			}
		}
	});
}
//#endregion

//#region Command Functions
function evaluateSelections(): void {
	iterateSelections(false, (input) => {
		const r = evaluate(input);
		if (r === undefined) return undefined;
		return input + " = " + r;
	});
}

function replaceSelections(): void {
	iterateSelections(false, (input) => {
		return evaluate(input);
	});
}

function countSelections(): void {
	let count = vscode.workspace
		.getConfiguration("calculator")
		.get("countStart", 0);
	iterateSelections(true, () => {
		return String(count++);
	});
}

async function countFromSelections(): Promise<void> {
	// Request the starting number from the user
	const value = await vscode.window.showInputBox({
		title: "Count From",
		placeHolder: String(
			vscode.workspace
				.getConfiguration("calculator")
				.get("countStart", 0),
		),
		validateInput: (input) => {
			return isNaN(Number.parseInt(input))
				? "Please enter a valid integer."
				: undefined;
		},
	});
	if (value === undefined) return;
	let count = Number.parseInt(value);
	iterateSelections(true, (input) => {
		return String(count++);
	});
}

function showInputPanel(): void {
	let output: string | undefined = undefined;

	const box = vscode.window.createInputBox();
	box.title = "Math Input";
	box.placeholder = "Expression";
	box.buttons = [
		vscode.QuickInputButtons.Back,
		{
			iconPath: new vscode.ThemeIcon("copy"),
			tooltip: "Copy Result",
		},
	];
	box.onDidChangeValue((value) => {
		output = evaluate(value);
		box.prompt = output ?? "Error";
	});
	box.onDidAccept(() => {
		if (output !== undefined) {
			copy(output);
			box.dispose();
		}
	});
	box.show();
}
//#endregion

//#region Event Functions
function onSelection(): void {
	const editor = vscode.window.activeTextEditor;

	if (!editor || editor.selections.length != 1 || editor.selection.isEmpty)
		return;

	const r = evaluate(editor.document.getText(editor.selection));
	if (r === undefined) return;
	widget.text = "= " + r;
	widget.show();
}
//#endregion

export function activate(context: vscode.ExtensionContext) {
	// Commands //

	const command = vscode.commands.registerCommand;
	context.subscriptions.push(
		command("calculator.evaluate", evaluateSelections),
		command("calculator.replace", replaceSelections),
		command("calculator.count", countSelections),
		command("calculator.countFrom", countFromSelections),
		command("calculator.showInput", showInputPanel),
	);

	// Widget //

	widget = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	widget.command = "calculator._hide_widget";

	context.subscriptions.push(
		// Widget object
		widget,
		// Internal command to hide the widget when clicked
		command("calculator._hide_widget", () => widget.hide()),
		// Subscription to a changing selection to update the widget
		vscode.window.onDidChangeTextEditorSelection(onSelection),
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration("calculator.disableWidget")) {
				if (
					vscode.workspace
						.getConfiguration("calculator")
						.get("disableWidget", false)
				) {
					widget.hide();
				} else {
					widget.show();
				}
			}
		}),
	);

	if (
		vscode.workspace
			.getConfiguration("calculator")
			.get("disableWidget", false)
	) {
		widget.hide();
	}
}
