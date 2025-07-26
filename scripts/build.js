const fs = require('fs');
const path = require('path');
const jsonc = require('jsonc-parser');

// Determine source and destination directories
const srcDir = path.dirname(__dirname);
const THEMES_DIR = path.join(srcDir, 'themes');
const DIST_DIR = path.join(srcDir, 'dist', 'jetbrains-dark');
const DIST_THEMES = path.join(DIST_DIR, 'themes');

console.log('Running build script');

// Ensure destination directories exist
fs.mkdirSync(DIST_THEMES, { recursive: true });

// Metadata files to copy
const REQUIRED_FILES = [
  'README.md',
  'CHANGELOG.md',
  'icon.png',
  'package.json',
  'LICENSE.txt',
];

// Copy metadata files
for (const file of REQUIRED_FILES) {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(DIST_DIR, file);
  if (!fs.existsSync(srcDir)) {
    console.error(`Error: File ${file} does not exist.`);
    process.exit(1);
  }
  fs.cpSync(srcPath, destPath);
}

// Theme files to process
const THEMES = [
  'jetbrains-dark.json',
  'jetbrains-dark-syntax.json',
  'jetbrains-dark-vibrant.json',
];

for (const themeFilename of THEMES) {
  const themeFilepath = fs.readFileSync(path.join(THEMES_DIR, themeFilename), {
    encoding: 'utf8',
  });

  let themeJson;
  try {
    let errorsList = [];
    themeJson = jsonc.parse(themeFilepath, errorsList);

    // Reduce scope arrays that contain only one scope
    // to a string if theme contains a tokenColors array
    if (Array.isArray(themeJson.tokenColors)) {
      for (const rule of themeJson.tokenColors) {
        if (Array.isArray(rule.scope)) {
          if (rule.scope.length === 1) {
            rule.scope = rule.scope[0];
          }
        }
      }
    }
  } catch (err) {
    console.error(`Failed to parse ${themeFilename}:`, err.message);
    throw err;
  }

  const minified = JSON.stringify(themeJson);
  const outPath = path.join(DIST_THEMES, themeFilename);
  fs.writeFileSync(outPath, minified, 'utf8');
}

console.log('Build successful.');
