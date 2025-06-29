# Changelog

## 0.2.3

### Changed
- Reworked a lot of rules
- Markdown bold, italic and italic, bold markup is now styled accordingly
- `support.function` now colored like `entity.name.function`
- simplified rule for coloring `storage.type.number.python`

### Fixed
- Fixed Changelog was not updated correctly
- Fixed token `keyword.overriden` colored as magic variable in Python

### Removed
- Removed highlighting rules for regex
- Removed Duplicate rule
- Removed rule for coloring python functions individually

## 0.2.2

### Fixed
- Fix highlighting issues in Python files
    - self and cls declaration not colored correctly
    - property declaration not colored correctly
- Fix python enum member color


## 0.2.1

### Changed
- Change rule for highlighting parameters in darkred to only apply to python
- Change highlighting of enum members in python to white as in the original JetBrains theme

### Fixed
- Fix Changelog file not being included in the distribution package
- Fix highlighting issues in C++ files
    - types not colored correclty
    - storage modifier reference not colored correclty
    - add rule to highlight enum members


## 0.2.0

### Added
- Add a Changelog file
- Add highlighting rules for INI Files
- Add bracket pair colorization colors

### Changed
- Change color of Badge on Marketplace extension packs from blue to gray
- Change highlighting of `entity.name.function`. Function calls are now styled in blue similar to function declarations
- Change parameters are now highlighted in darkred

### Fixed
- Fix low contrast between current search match and other search matches 
- Fix semantic highlighting rules for rust and python being commented out
- Fix javadoc docstring commentblock not being styled correctly


## 0.1.1

### Added
- Highlighting for Yaml Anchors and Aliases

### Changed
- Display Name
- Change Description in README.md
- Enable semantic highlighting

### Fixed
- Link in README.md pointing to local image


## 0.1.0 - 2025-5-10

Release
