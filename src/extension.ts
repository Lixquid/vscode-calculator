import { copy } from "copy-paste";
import { evaluate as mathEval } from "mathjs";
import * as vscode from "vscode";

//#region Variables
const config = vscode.workspace.getConfiguration("calculator");
let widget: vscode.StatusBarItem;

const intl = new Intl.NumberFormat(undefined, {
	useGrouping: true,
});
//#endregion

//#region Utility Functions
function evaluate(input: string): string | undefined {
	try {
		const result = mathEval(input);
		switch (typeof result) {
			case "function":
				return "Function";
			case "number":
			case "bigint":
				return config.get("humanFormattedOutput", false)
					? intl.format(result)
					: String(result);
			default:
				return String(result);
		}
	} catch {
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
	let count = config.get("countStart", 0);
	iterateSelections(true, () => {
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
		command("calculator.showInput", showInputPanel),
	);

	// Widget //

	if (config.get("disableWidget", false)) return;

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
