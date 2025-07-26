const fs = require('fs');
const path = require('path');

let srcDir = path.dirname(__dirname);
const changelogFilePath = path.join(srcDir, 'CHANGELOG.md');

console.log('Running prepublish checks.');

let changelogFile;
try {
  changelogFile = fs.readFileSync(changelogFilePath, { encoding: 'utf8' });
} catch (err) {
  console.error('Error: Failed to read changelog file');
  process.exit(1);
}

let versionHeadings = Array.from(
  changelogFile.matchAll(/## (\d+\.\d+\.\d+)/g),
  match => match[1]
);

// Get Version number
const packageJson = fs.readFileSync(path.join(srcDir, 'package.json'), {
  encoding: 'utf8',
});

// Check if changelog contains an entry for the current version
const package = JSON.parse(packageJson);

if (package.version !== versionHeadings[0]) {
  console.error(
    [
      'Error: Changelog version mismatch.',
      `- package.json version: ${package.version}`,
      `- changelog version: ${versionHeadings[0]}`,
      'Update the changelog before publishing!',
    ].join('\n')
  );
  process.exit(1);
}

console.log('Prepublish checks successful');
