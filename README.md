# Calculator

Calculation commands and tools for VS Code.

## Installation

To install _Calculator_, do the following steps:

1. Open Visual Studio Code
2. Open the Quick Open Palette (By default: `Ctrl-P`)
3. Type `ext install calculator`
4. Select the Calculator extension
5. Select _Install_

## Usage

Select a math expression:

![Usage-1](./images/1.png)

The math widget in the status bar will show you the result:

![Usage-2](./images/2.png)

You can also use Calculator commands to modify the text directly:

![Usage-3](./images/3.png)

![Usage-4](./images/4.png)

Most commands operate on every selection / cursor in the editor, so they can
be used to evaluate several expressions at once.

## Commands

- `calculator.evaluate`
    - Evaluates the expression, and appends it to the selection.
    - If no selection is present, the space-delimited word surrounding the
      cursor is used instead.
- `calculator.replace`
    - Evaluates the expression, and replaces it with the result.
    - If no selection is present, the space-delimited word surrounding the
      cursor is used instead.
- `calculator.count`
    - Counts each selection / cursor, and replaces the contents with the number.
- `calculator.countFrom`
    - Counts each selection / cursor, and replaces the contents with the number,
      starting from a custom value.
- `calculator.showInput`
    - Opens an input dialogue that will evaluate anything typed into it.
      Confirming the dialogue will copy the result to the clipboard.

## Configuration

- `calculator.countStart` (Default: `0`)
    - The value to start counting from when using the calculator.count command.
- `calculator.disableWidget` (Default: `false`)
    - Disables the calculation widget.
- `calculator.humanFormattedOutput` (Default: `false`)
    - If enabled, the output will be formatted in a human-readable way according
      to the default locale, such as `1,000,000` instead of `1000000`.
- `calculator.advanced.bypassInputFormatting` (Default: `false`)
    - If enabled, input will not have its newlines removed before evaluation.
- `calculator.advanced.decimalPlaces` (Default: `14`, Minimum: `-1`)
    - Number of decimal places to format evaluated numbers. This is to avoid
      floating point precision issues, and is recommended to not be changed.
      Set to `-1` to disable formatting.

## Development

- `npm run compile` compiles the TypeScript sources to `out/`.
- `npm run watch` recompiles on change.
- `npm run lint` lints and checks formatting.
- `npm test` runs the whole test suite (needs a display; use `xvfb-run -a
npm test` on Linux).
- `npm run test:unit` runs only the unit tests, without VS Code.
- `npm run test:integration` runs the integration tests inside a headless
  VS Code instance.

## Other

Powered by [Math JS](http://mathjs.org/).

[Calculator](https://github.com/lixquid/vscode-calculator) is hosted at
GitHub.

Calculator is licensed under the GPLv3.
