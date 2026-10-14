# Changelog

## 0.3.0

- Evaluate / Replace commands now expand selections to whole words when the cursor has no selection. (#3)
- Add option for decimal places when formatting numbers. (#12)
- Add thousands separators for human-readable output in the widget, and fix round-off errors. (#5)
- Suppress logged errors when the widget fails to evaluate. (#14)
- Change extension type to UI. (#15)
- Remove the copy-paste dependency. (#17)
- Add CI workflow to verify the extension and build the VSIX. (#13)
- Update dependency versions. (#16)
- Add unit and integration tests.

## 0.2.0

> _Note_: This version changes configuration option keys, so changes will be lost on upgrade.

- Fix Input Panel to allow pressing enter / canceling to copy the evaluated result. (#8)
- Fix function names like `map` not outputting as their contents, filling the screen. (#7)
- Add option for human readable outputs. (#5)
- Allow configuration changes to now instantly take effect, instead of requiring a restart.
- Add "Count From" command
- Allow multiline inputs (#4, #10)

## 0.1.1

- Fix image links in README.

## 0.1.0

- Initial Version
- Added Evaluation, Replace, and Count commands.
- Added Math Input panel.
- Added Math status bar widget.
