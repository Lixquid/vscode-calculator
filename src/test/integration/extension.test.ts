import * as assert from "assert";
import * as vscode from "vscode";

suite("Calculator extension", () => {
	suiteTeardown(async () => {
		await vscode.commands.executeCommand(
			"workbench.action.closeActiveEditor",
		);
	});

	test("is active", () => {
		const extension = vscode.extensions.getExtension("lixquid.calculator");
		assert.ok(extension, "The extension should be present.");
		assert.strictEqual(extension.isActive, true);
	});
});

suite("Calculator commands", () => {
	let editor: vscode.TextEditor;

	suiteSetup(async () => {
		const document = await vscode.workspace.openTextDocument();
		editor = await vscode.window.showTextDocument(document);
	});

	teardown(async () => {
		// Clear the document for the next test.
		await editor.edit((editBuilder) => {
			editBuilder.delete(
				new vscode.Range(
					0,
					0,
					editor.document.lineCount - 1,
					editor.document.lineAt(editor.document.lineCount - 1).text
						.length,
				),
			);
		});
	});

	/**
	 * Replaces the entire document contents with the given text.
	 */
	async function setText(text: string): Promise<void> {
		await editor.edit((editBuilder) => {
			editBuilder.insert(new vscode.Position(0, 0), text);
		});
	}

	async function setSelections(
		selections: vscode.Selection[],
	): Promise<void> {
		editor.selections = selections;
		// Give the editor a moment to apply the selection changes.
		await new Promise((resolve) => setTimeout(resolve, 10));
	}

	/**
	 * Executes a calculator command. The extension awaits its edits, so the
	 * document is updated once the returned promise resolves.
	 */
	async function execute(command: string): Promise<unknown> {
		return vscode.commands.executeCommand(command);
	}

	test("evaluate appends the result to the selection", async () => {
		await setText("1 + 2");
		await setSelections([new vscode.Selection(0, 0, 0, 5)]);
		await execute("calculator.evaluate");
		assert.strictEqual(editor.document.getText(), "1 + 2 = 3");
	});

	test("evaluate handles multiple selections", async () => {
		await setText("1 + 1\n2 + 2");
		await setSelections([
			new vscode.Selection(0, 0, 0, 5),
			new vscode.Selection(1, 0, 1, 5),
		]);
		await execute("calculator.evaluate");
		assert.strictEqual(editor.document.getText(), "1 + 1 = 2\n2 + 2 = 4");
	});

	test("evaluate expands empty selections to the surrounding word", async () => {
		await setText("12 abc");
		await setSelections([new vscode.Selection(0, 1, 0, 1)]);
		await execute("calculator.evaluate");
		assert.strictEqual(editor.document.getText(), "12 = 12 abc");
	});

	test("replace replaces the selection with the result", async () => {
		await setText("2 * 3");
		await setSelections([new vscode.Selection(0, 0, 0, 5)]);
		await execute("calculator.replace");
		assert.strictEqual(editor.document.getText(), "6");
	});

	test("replace handles multiple selections", async () => {
		await setText("1+1\n2+2");
		await setSelections([
			new vscode.Selection(0, 0, 0, 3),
			new vscode.Selection(1, 0, 1, 3),
		]);
		await execute("calculator.replace");
		assert.strictEqual(editor.document.getText(), "2\n4");
	});

	test("replace uses the surrounding word for empty selections", async () => {
		await setText("1+1 foo");
		await setSelections([new vscode.Selection(0, 1, 0, 1)]);
		await execute("calculator.replace");
		assert.strictEqual(editor.document.getText(), "2 foo");
	});

	suite("count", () => {
		const config = vscode.workspace.getConfiguration("calculator");

		test("numbers selections starting from countStart", async () => {
			await setText("a\nb\nc");
			await setSelections([
				new vscode.Selection(0, 0, 0, 1),
				new vscode.Selection(1, 0, 1, 1),
				new vscode.Selection(2, 0, 2, 1),
			]);
			await config.update(
				"countStart",
				5,
				vscode.ConfigurationTarget.Global,
			);
			try {
				await execute("calculator.count");
				assert.strictEqual(editor.document.getText(), "5\n6\n7");
			} finally {
				await config.update(
					"countStart",
					undefined,
					vscode.ConfigurationTarget.Global,
				);
			}
		});
	});
});
