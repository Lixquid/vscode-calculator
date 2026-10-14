import * as vscode from "vscode";

import { evaluate, type EvaluateSettings } from "./evaluate.js";
import { expandEmptySelection } from "./selectionUtils.js";

//#region Variables
let widget: vscode.StatusBarItem;

//#endregion

//#region Utility Functions
/**
 * Reads the settings that control evaluation from the workspace configuration.
 */
function getEvaluateSettings(): EvaluateSettings {
	const config = vscode.workspace.getConfiguration("calculator");
	return {
		bypassInputFormatting: config.get(
			"advanced.bypassInputFormatting",
			false,
		),
		decimalPlaces: config.get("advanced.decimalPlaces", 14),
		humanFormattedOutput: config.get("humanFormattedOutput", false),
	};
}

/**
 * Determines how empty selections are handled by `iterateSelections`.
 * - `"skip"`: Empty selections are ignored.
 * - `"expand"`: Empty selections are expanded to the space-delimited word
 *   surrounding the cursor.
 * - `"use"`: Empty selections are used as-is (replacing an empty selection
 *   inserts text at the cursor).
 */
type EmptySelectionBehavior = "skip" | "expand" | "use";

/**
 * Expands an empty selection to the bounds of the space-delimited word
 * surrounding the cursor on the same line. If the cursor is not inside a
 * word, the returned selection remains empty.
 */
function expandSelectionInDocument(
	document: vscode.TextDocument,
	selection: vscode.Selection,
): vscode.Selection {
	const { start, end } = expandEmptySelection(
		document.lineAt(selection.start.line).text,
		selection.start.character,
	);
	return new vscode.Selection(
		selection.start.line,
		start,
		selection.start.line,
		end,
	);
}

function iterateSelections(
	emptySelectionBehavior: EmptySelectionBehavior,
	callback: (input: string) => string | undefined,
): Thenable<boolean> | undefined {
	const editor = vscode.window.activeTextEditor;
	const document = editor?.document;
	const selections = editor?.selections;

	if (!document || !selections) {
		return undefined;
	}

	return editor.edit((edit) => {
		for (const selection of selections) {
			let effectiveSelection = selection;
			if (selection.isEmpty) {
				switch (emptySelectionBehavior) {
					case "skip":
						continue;
					case "expand":
						effectiveSelection = expandSelectionInDocument(
							document,
							selection,
						);
						break;
					case "use":
						break;
				}
			}

			const text = document.getText(effectiveSelection);

			try {
				const result = callback(text);
				if (result === undefined || result === null) {
					continue;
				}
				edit.replace(effectiveSelection, result);
			} catch (ex) {
				console.error(ex);
			}
		}
	});
}
//#endregion

//#region Command Functions
async function evaluateSelections(): Promise<void> {
	await iterateSelections("expand", (input) => {
		const r = evaluate(input, getEvaluateSettings());
		if (r === undefined) {
			return undefined;
		}
		return input + " = " + r;
	});
}

async function replaceSelections(): Promise<void> {
	await iterateSelections("expand", (input) => {
		return evaluate(input, getEvaluateSettings());
	});
}

async function countSelections(): Promise<void> {
	let count = vscode.workspace
		.getConfiguration("calculator")
		.get("countStart", 0);
	await iterateSelections("use", () => {
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
	if (value === undefined) {
		return;
	}
	let count = Number.parseInt(value);
	await iterateSelections("use", (input) => {
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
		output = evaluate(value, getEvaluateSettings(), {
			suppressErrorLog: true,
		});
		box.prompt = output ?? "Error";
	});
	box.onDidAccept(() => {
		if (output !== undefined) {
			void vscode.env.clipboard.writeText(output);
			box.dispose();
		}
	});
	box.show();
}
//#endregion

//#region Event Functions
function onSelection(): void {
	const editor = vscode.window.activeTextEditor;

	if (!editor || editor.selections.length !== 1 || editor.selection.isEmpty) {
		return;
	}

	// Suppress errors because the widget is constantly evaluating
	const r = evaluate(
		editor.document.getText(editor.selection),
		getEvaluateSettings(),
		{
			suppressErrorLog: true,
		},
	);
	if (r === undefined) {
		return;
	}
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
