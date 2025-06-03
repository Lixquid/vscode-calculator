import { copy } from "copy-paste";
import { evaluate } from "mathjs";
import * as vscode from "vscode";

//#region Variables
const config = vscode.workspace.getConfiguration("calculator");
let widget: vscode.StatusBarItem;
//#endregion

//#region Utility Functions
function iterateSelections(
	all: boolean,
	callback: (input: string) => string,
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
				if (result == null) continue;
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
		return input + " = " + evaluate(input).toString();
	});
}

function replaceSelections(): void {
	iterateSelections(false, (input) => {
		return evaluate(input).toString();
	});
}

function countSelections(): void {
	let count = config.get("count_start", 0);
	iterateSelections(true, () => {
		count++;
		return (count - 1).toString();
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
		try {
			output = String(evaluate(value));
			box.prompt = output.toString();
		} catch (ex) {
			output = undefined;
			box.prompt = "Error";
		}
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

	try {
		widget.text =
			"= " +
			evaluate(editor.document.getText(editor.selection)).toString();
		widget.show();
	} catch (ex) {}
}
//#endregion

export function activate(context: vscode.ExtensionContext) {
	// Commands //

	const command = vscode.commands.registerCommand;
	context.subscriptions.push(
		command("calculator.evaluate", evaluateSelections),
		command("calculator.replace", replaceSelections),
		command("calculator.count", countSelections),
		command("calculator.showInput", showInputPanel),
	);

	// Widget //

	if (config.get("disable_widget", false)) return;

	widget = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	widget.command = "calculator._hide_widget";

	context.subscriptions.push(
		// Widget object
		widget,
		// Internal command to hide the widget when clicked
		command("calculator._hide_widget", () => widget.hide()),
		// Subscription to a changing selection to update the widget
		vscode.window.onDidChangeTextEditorSelection(onSelection),
	);
}
