const path = require('path');
const { ThemeBuilder, loadTomlConfig } = require('../lib');

const ROOT_DIR = path.dirname(__dirname);
const CONFIG_PATH = path.resolve(
  ROOT_DIR,
  process.argv[2] || 'theme.build.toml'
);

console.log(`Running build script with config: ${CONFIG_PATH}`);

try {
  const config = loadTomlConfig(CONFIG_PATH);
  const builder = new ThemeBuilder({
    rootDir: ROOT_DIR,
    schema: config.schema,
    defs: config.defs,
  });

  const results = builder.writeAll(config.themes, config.outputDir || 'build');

  console.log(`\nBuilding themes`)
  for (const { key, theme, path: outPath } of results) {
    console.log(
      `  ${key} -> ${path.relative(ROOT_DIR, outPath)} ` +
        `(${theme.tokenColors ? theme.tokenColors.length : 0} tokenColors, ` +
        `${theme.colors ? Object.keys(theme.colors).length : 0} colors, ` +
        `${
          theme.semanticTokenColors
            ? Object.keys(theme.semanticTokenColors).length
            : 0
        } semanticTokenColors)`
    );
  }

  console.log(`\nBuild successful: wrote ${results.length} theme(s).`);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
