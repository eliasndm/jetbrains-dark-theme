const fs = require('fs');
const path = require('path');
const chalk = require('chalk').default;
const { ThemeBuilder, loadTomlConfig } = require('../lib');

const ROOT_DIR = path.dirname(__dirname);
const CONFIG_PATH = path.resolve(
  ROOT_DIR,
  process.argv[2] || 'theme.build.toml'
);

function timestamp() {
  return chalk.dim(new Date().toLocaleTimeString());
}

/**
 * Build every theme once, with a fresh builder so def caches never go stale.
 * Throws on failure, caller decides how to handle it.
 */
function build() {
  const start = Date.now();

  const config = loadTomlConfig(CONFIG_PATH);
  const builder = new ThemeBuilder({
    rootDir: ROOT_DIR,
    schema: config.schema,
    defs: config.defs,
  });

  const results = builder.writeAll(config.themes, config.outputDir || 'build');
  const elapsed = Date.now() - start;

  const keyWidth = Math.max(...results.map(({ key }) => key.length));
  console.log(`${timestamp()} ${chalk.cyan('build')} started`);
  for (const { key, path: outPath } of results) {
    const label = key.padEnd(keyWidth);
    console.log(
      `  ${chalk.green('✓')} ${label}  ${chalk.dim(path.relative(ROOT_DIR, outPath))}`
    );
  }
  console.log(chalk.green(`  built ${results.length} theme(s) in ${elapsed}ms`));
}

/**
 * The files to watch: every def plus the config itself.
 * Falls back to just the config file if it can't currently be parsed,
 * so watching keeps working while the error gets fixed.
 */
function watchTargets() {
  try {
    const config = loadTomlConfig(CONFIG_PATH);
    const files = Object.values(config.defs).map(rel =>
      path.resolve(ROOT_DIR, rel)
    );
    files.push(CONFIG_PATH);
    return files;
  } catch (err) {
    return [CONFIG_PATH];
  }
}

const watchedFiles = new Set();

/**
 * Add fs.watch listeners for any target not already being watched.
 * Safe to call repeatedly, existing watchers are left in place.
 * Called after every build attempt, since defs can only be discovered
 * once the config parses, and a fix might add new watch targets.
 */
function ensureWatchers(onChange) {
  for (const file of watchTargets()) {
    if (watchedFiles.has(file)) continue;

    if (!fs.existsSync(file)) {
      console.log(
        chalk.dim(`  ! skipping missing watch target: ${path.relative(ROOT_DIR, file)}`)
      );
      continue;
    }

    watchedFiles.add(file);
    fs.watch(path.dirname(file), (_event, filename) => {
      if (filename && path.basename(file) === filename) {
        onChange();
      }
    });
  }
}

let timer = null;
let building = false;

function scheduleRebuild() {
  clearTimeout(timer);
  timer = setTimeout(runBuild, 100);
}

function runBuild() {
  if (building) return;
  building = true;
  console.log('');
  try {
    build();
  } catch (err) {
    console.log(`${timestamp()} ${chalk.red('build')} failed`);
    console.log(chalk.red(`  ✗ ${err.message}`));
    console.log(chalk.dim('  waiting for changes...'));
  } finally {
    building = false;
    ensureWatchers(scheduleRebuild);
  }
}

ensureWatchers(scheduleRebuild);
console.log(chalk.bold('Watching for changes... (Ctrl+C to stop)'));
scheduleRebuild();