'use strict';

// Imports /////////////////////////////////////////////////////////////////////

import * as copyPaste from "copy-paste";
import * as math from "mathjs";
import * as vscode from "vscode";

// Variables ///////////////////////////////////////////////////////////////////

const config = vscode.workspace.getConfiguration( "calculator" );

let widget: vscode.StatusBarItem;

// Functions ///////////////////////////////////////////////////////////////////

function iterateSelections( all: boolean, callback: ( input: string ) => string ): void {

	const editor = vscode.window.activeTextEditor;
	const document = editor.document;
	const selections = editor.selections;

	vscode.window.activeTextEditor.edit(( edit ) => {

		for ( const selection of selections ) {

			if ( selection.isEmpty && !all ) continue;

			const text = document.getText( selection );

			try {
				const result = callback( text );
				if ( result == null ) continue;
				edit.replace( selection, result );
			} catch ( ex ) {
				console.error( ex );
			}

		}

	});

}

function evaluateSelections(): void {
	iterateSelections( false, ( input ) => {
		return input + " = " + math.eval( input ).toString();
	});
}

function replaceSelections(): void {
	iterateSelections( false, ( input ) => {
		return math.eval( input ).toString();
	});
}

function countSelections(): void {
	let count = config.get( "count_start", 0 );
	iterateSelections( true, ( input ) => {
		count++;
		return ( count - 1 ).toString();
	});
}

function showInputPanel(): void {

	// This is a bit of a horrible hack.
	// As a result, there is no way to "cancel" the dialogue box without
	// entering invalid input.
	let output;

	vscode.window.showInputBox( {
		prompt: "Enter a Math Expression to evaluate it. Pressing Enter will set the clipboard text to the return value.",
		placeHolder: "Expression",
		validateInput: function ( expression: string ): string {

			try {
				output = math.eval( expression );
				return output.toString();
			} catch ( ex ) {
				output = undefined;
				return "Error";
			}

		}
	}).then( function ( expression: string ): void {

		if ( expression == null &&
			config.get( "_debug_disableinputclipboard", false ) ) {
			return;
		}

		if ( output == null ) return;

		copyPaste.copy( output );

	});
}

function onSelection(): void {

	const editor = vscode.window.activeTextEditor;

	if ( editor.selections.length != 1 || editor.selection.isEmpty ) return;

	try {
		widget.text = "= " + math.eval(
			editor.document.getText( editor.selection ) ).toString();
		widget.show();
	} catch ( ex ) { }

}

// Exports /////////////////////////////////////////////////////////////////////

export function activate( context: vscode.ExtensionContext ) {

	// Commands //

	const command = vscode.commands.registerCommand;

	context.subscriptions.push(
		command( "calculator.evaluate", evaluateSelections ),
		command( "calculator.replace", replaceSelections ),
		command( "calculator.count", countSelections ),
		command( "calculator.showInput", showInputPanel )
	);

	// Widget //

	if ( config.get( "disable_widget", false ) ) return;

	widget = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right );
	widget.command = "calculator._hide_widget";

	context.subscriptions.push(
		// Widget object
		widget,
		// Internal command to hide the widget when clicked
		command( "calculator._hide_widget", () => widget.hide() ),
		// Subscription to a changing selection to update the widget
		vscode.window.onDidChangeTextEditorSelection( onSelection ) );

}
