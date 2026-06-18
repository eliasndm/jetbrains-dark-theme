import * as fs from 'fs';
import toml from 'toml';
import type { BuildConfig, ThemeConfig } from './types';

interface RawConfig {
  build?: { output?: string };
  schema?: string;
  defs?: Record<string, string>;
  themes?: Record<string, ThemeConfig>;
}

/**
 * Parse a TOML build config file into a BuildConfig.
 * @param configPath 
 * @returns 
 */
export function loadTomlConfig(configPath: string): BuildConfig {
  if (!fs.existsSync(configPath)) {
    throw new Error(`config file ${configPath} does not exist.`);
  }

  let raw: RawConfig;
  try {
    raw = toml.parse(fs.readFileSync(configPath, 'utf8')) as RawConfig;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`failed to parse ${configPath}: ${message}`);
  }

  const themes = raw.themes ?? {};
  if (Object.keys(themes).length === 0) {
    throw new Error('no themes defined. Add at least one [themes.<key>] table.');
  }

  return {
    schema: raw.schema,
    outputDir: raw.build?.output,
    defs: raw.defs ?? {},
    themes,
  };
}
