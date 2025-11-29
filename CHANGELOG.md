# Changelog

## 0.6.5

### Fixed
- Fix special character color in html and xml
- Fix color of logical operator in batchfiles
- Fix color of raw multi docstring in python

## 0.6.4

### Fixed
- Fixed color of question mark on php closing tag.
- Fixed colored blocks in icon not being centered.

## 0.6.3

### Changed
- Changed editor widgets background color.
- Changed marketplace icon.

## 0.6.2

### Fixed
- Fixed error in publish script initiation.

## 0.6.1

### Added
- Added prepublish script.
- Added new build script.

### Fixed
- Removed some trailing commas in the theme files.

### Changed
- Changed marketplace icon to a more vibrant version.

## 0.6.0

### Added
- Added syntax highlighting rules for Java.

### Fixed
- Fixed line numbers in gutter being too bright for inactive lines.

### Changed
- Chaged README.md intro sentence, recommendations and disclaimer.

## 0.5.0

### Added
- Added syntax highlighting for Ruby code.
- Added syntax highlighting for Powershell code.

### Fixed
- Fixed color of code fence punctuation in markdown.
- Fixed color of code fence language specifier.

### Changed
- Changed README.md.

## 0.4.0

### Added
- Added syntax highlighting for Go.

### Changed
- Changed Marketplace Icon.

## 0.3.0

### Added
- Added new theme variant "Vibrant".
- Added an icon for the marketplace listing.
- Added new preview images to the README file.
- Added a color rule for builtin variables in python.
- Added a color rule for local variables in javscript and typescript.
- Added ansi terminal colors.
- Added basic styling for tex and latex files.
- Added color rule to style toplevel script, style and template tags in vue.

### Changed
- Changed the color of properties.
- Changed the color of default variables and classes in javascript and typescript.
- Changed the color of jsx/tsx components.
- Changed the color of the f-string keyword in python to follow the original theme.

### Fixed
- Fixed the color of enum members in typescript.
- Fixed the color of instanceof keyword in javascript and typescript.
- Fixed the color of variables and punctuation and strings in javascript template strings.
- Fixed color of the question mark operator in rust.
- Fixed color of a template tag in vue also being highlighted differently when nested.
- Fixed css units not having the correct color in vue files.
- Fixed color of module includes in c and c++.
- Fixed number format color in c.

## 0.2.3

### Changed
- Reworked a lot of rules.
- Markdown bold, italic and italic, bold markup is now styled accordingly.
- `support.function` now colored like `entity.name.function`.
- simplified rule for coloring `storage.type.number.python`.

### Fixed
- Fixed Changelog was not updated correctly.
- Fixed token `keyword.overriden` colored as magic variable in Python.

### Removed
- Removed highlighting rules for regex.
- Removed Duplicate rule.
- Removed rule for coloring python functions individually.

## 0.2.2

### Fixed
- Fix highlighting issues in Python files.
    - self and cls declaration not colored correctly.
    - property declaration not colored correctly.
- Fix python enum member color.


## 0.2.1

### Changed
- Change rule for highlighting parameters in darkred to only apply to python.
- Change highlighting of enum members in python to white as in the original JetBrains theme.

### Fixed
- Fix Changelog file not being included in the distribution package.
- Fix highlighting issues in C++ files.
    - types not colored correclty
    - storage modifier reference not colored correclty
    - add rule to highlight enum members


## 0.2.0

### Added
- Add a Changelog file.
- Add highlighting rules for INI Files.
- Add bracket pair colorization colors.

### Changed
- Change color of Badge on Marketplace extension packs from blue to gray.
- Change highlighting of `entity.name.function`. Function calls are now styled in blue similar to function declarations.
- Change parameters are now highlighted in darkred.

### Fixed
- Fix low contrast between current search match and other search matches.
- Fix semantic highlighting rules for rust and python being commented out.
- Fix javadoc docstring commentblock not being styled correctly.


## 0.1.1

### Added
- Highlighting for Yaml Anchors and Aliases.

### Changed
- Display Name.
- Change Description in README.md.
- Enable semantic highlighting.

### Fixed
- Link in README.md pointing to local image.


## 0.1.0 - 2025-5-10

Release
