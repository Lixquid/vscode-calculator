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

![Usage-1](https://i.imgur.com/Ba6T7k0.png)

The math widget in the status bar will show you the result:

![Usage-2](https://i.imgur.com/ozoUOON.png)

You can also use Calculator commands to modify the text directly:

![Usage-3](https://i.imgur.com/d7SPoXB.png)

![Usage-4](https://i.imgur.com/kj9bC9u.png)

## Commands

- `calculator.evaluate`
    - Evaluates the expression, and appends it to the selection.
- `calculator.replace`
    - Evaluates the expression, and replaces it with the result.
- `calculator.count`
    - Counts each selection / cursor, and replaces the contents with the number.
- `calculator.count_from`
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

## Other

Powered by [Math JS](http://mathjs.org/).

[Calculator](https://github.com/lixquid/vscode-calculator) is hosted at
GitHub.

Calculator is licensed under the GPLv3.
