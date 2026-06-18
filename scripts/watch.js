const fs = require('fs');
const path = require('path');
const { ThemeBuilder, loadTomlConfig } = require('../lib');

const ROOT_DIR = path.dirname(__dirname);
const CONFIG_PATH = path.resolve(ROOT_DIR, process.argv[2] || 'theme.build.toml');

/**
 * Build every theme once, with a fresh builder so def caches never go stale.
 * @returns 
 */
function build() {
  const config = loadTomlConfig(CONFIG_PATH);
  const builder = new ThemeBuilder({
    rootDir: ROOT_DIR,
    schema: config.schema,
    defs: config.defs,
  });
  const results = builder.writeAll(config.themes, config.outputDir || 'build');
  const stamp = new Date().toLocaleTimeString();
  console.log(`[${stamp}] built ${results.length} theme(s):`);
  for (const { key, path: outPath } of results) {
    console.log(`  ${key} -> ${path.relative(ROOT_DIR, outPath)}`);
  }
  return config;
}

/** The files to watch: every def plus the config itself. */
function watchTargets(config) {
  const files = Object.values(config.defs).map(rel =>
    path.resolve(ROOT_DIR, rel)
  );
  files.push(CONFIG_PATH);
  return files;
}

let timer = null;
function scheduleRebuild() {
  // Debounce: editors often emit several events per save.
  clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      build();
    } catch (err) {
      console.error(`Build failed: ${err.message}`);
    }
  }, 100);
}

let config;
try {
  config = build();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}

for (const file of watchTargets(config)) {
  if (!fs.existsSync(file)) {
    console.warn(`Skipping missing watch target: ${path.relative(ROOT_DIR, file)}`);
    continue;
  }
  // Watch the parent dir so atomic saves (rename/replace) keep firing.
  fs.watch(path.dirname(file), (_event, filename) => {
    if (filename && path.basename(file) === filename) {
      scheduleRebuild();
    }
  });
}

console.log('Watching for changes... (Ctrl+C to stop)');
