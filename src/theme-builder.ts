import * as fs from 'fs';
import * as path from 'path';
import * as jsonc from 'jsonc-parser';

import type {
  ColorTheme,
  ThemeBuilderOptions,
  ThemeConfig,
  ThemeDef,
  ThemeWriteResult,
  TokenColor,
} from './types';

const DEFAULT_SCHEMA = 'vscode://schemas/color-theme';

const KEY_ORDER: (keyof ColorTheme)[] = [
  '$schema',
  'name',
  'include',
  'colors',
  'tokenColors',
  'semanticHighlighting',
  'semanticTokenColors',
];

export class ThemeBuilder {
  private readonly rootDir: string;
  private readonly schema: string;
  private readonly defs: Record<string, string>;
  private readonly defCache = new Map<string, ThemeDef>();

  constructor(options: ThemeBuilderOptions = {}) {
    this.rootDir = options.rootDir ?? process.cwd();
    this.schema = options.schema ?? DEFAULT_SCHEMA;
    this.defs = options.defs ?? {};
  }

  /**
   * Load and parse a def fragment by name (cached).
   *
   * @param name
   * @returns
   */
  loadDef(name: string): ThemeDef {
    const cached = this.defCache.get(name);
    if (cached) {
      return cached;
    }

    const relPath = this.defs[name];
    if (relPath === undefined) {
      throw new Error(`unknown def "${name}". Define it in the defs map.`);
    }

    const defPath = path.resolve(this.rootDir, relPath);
    if (!fs.existsSync(defPath)) {
      throw new Error(`def "${name}" file ${defPath} does not exist.`);
    }

    const errors: jsonc.ParseError[] = [];
    const parsed = jsonc.parse(fs.readFileSync(defPath, 'utf8'), errors, {
      allowTrailingComma: true,
    }) as ThemeDef;
    if (errors.length > 0) {
      const details = errors
        .map(e => `${jsonc.printParseErrorCode(e.error)} at offset ${e.offset}`)
        .join(', ');
      throw new Error(`failed to parse def "${name}" (${defPath}): ${details}`);
    }

    this.defCache.set(name, parsed);
    return parsed;
  }

  /** Build a single theme. `themes` is needed to resolve `include` references. */
  build(
    key: string,
    themeConfig: ThemeConfig,
    themes: Record<string, ThemeConfig> = {}
  ): ColorTheme {
    if (!themeConfig.filename) {
      throw new Error(`theme "${key}" is missing a "filename".`);
    }

    const theme: ColorTheme = {
      $schema: themeConfig.schema ?? this.schema,
      name: themeConfig.name ?? key,
    };

    if (themeConfig.include) {
      const target = themes[themeConfig.include];
      if (!target) {
        throw new Error(
          `theme "${key}" includes unknown theme "${themeConfig.include}". ` +
            `It must match another theme key.`
        );
      }
      theme.include = `./${target.filename}.json`;
    }

    const defNames = themeConfig.defs ?? [];
    if (!Array.isArray(defNames)) {
      throw new Error(`theme "${key}" has a non-array "defs".`);
    }
    for (const name of defNames) {
      ThemeBuilder.mergeDef(theme, this.loadDef(name));
    }

    if (typeof themeConfig.semanticHighlighting === 'boolean') {
      theme.semanticHighlighting = themeConfig.semanticHighlighting;
    }

    if (theme.tokenColors) {
      ThemeBuilder.normalizeScopes(theme.tokenColors);
    }

    if (theme.colors && Object.keys(theme.colors).length === 0) {
      delete theme.colors;
    }
    if (
      theme.semanticTokenColors &&
      Object.keys(theme.semanticTokenColors).length === 0
    ) {
      delete theme.semanticTokenColors;
    }
    if (theme.tokenColors && theme.tokenColors.length === 0) {
      delete theme.tokenColors;
    }

    return ThemeBuilder.orderKeys(theme);
  }

  /**
   * Build every theme in the map.
   * @param themes
   * @returns
   */
  buildAll(themes: Record<string, ThemeConfig>): Record<string, ColorTheme> {
    const result: Record<string, ColorTheme> = {};
    for (const [key, themeConfig] of Object.entries(themes)) {
      result[key] = this.build(key, themeConfig, themes);
    }
    return result;
  }

  /**
   * Build and write every theme to `outputDir`, returning per-theme summaries.
   * @param themes
   * @param outputDir
   * @returns
   */
  writeAll(
    themes: Record<string, ThemeConfig>,
    outputDir: string
  ): ThemeWriteResult[] {
    const resolvedDir = path.resolve(this.rootDir, outputDir);
    fs.mkdirSync(resolvedDir, { recursive: true });

    const results: ThemeWriteResult[] = [];
    for (const [key, themeConfig] of Object.entries(themes)) {
      const theme = this.build(key, themeConfig, themes);
      const outPath = path.join(resolvedDir, `${themeConfig.filename}.json`);
      fs.writeFileSync(outPath, JSON.stringify(theme, null, 2) + '\n', 'utf8');
      results.push({
        key,
        filename: themeConfig.filename,
        path: outPath,
        theme,
      });
    }
    return results;
  }

  /**
   * Merge a def into a theme. colors/semanticTokenColors are last-wins on key
   * collisions, tokenColors accumulate so later rules keep precedence.
   * @param theme
   * @param def
   */
  private static mergeDef(theme: ColorTheme, def: ThemeDef): void {
    if (def.colors) {
      theme.colors = Object.assign(theme.colors ?? {}, def.colors);
    }
    if (def.semanticTokenColors) {
      theme.semanticTokenColors = Object.assign(
        theme.semanticTokenColors ?? {},
        def.semanticTokenColors
      );
    }
    if (Array.isArray(def.tokenColors)) {
      theme.tokenColors = (theme.tokenColors ?? []).concat(def.tokenColors);
    }
    if (def.semanticHighlighting === true) {
      theme.semanticHighlighting = true;
    }
  }

  /**
   * Reduce single-entry scope arrays to a plain string.
   * @param tokenColors
   */
  private static normalizeScopes(tokenColors: TokenColor[]): void {
    for (const rule of tokenColors) {
      if (Array.isArray(rule.scope) && rule.scope.length === 1) {
        rule.scope = rule.scope[0];
      }
    }
  }

  /**
   * Return a copy with keys in a predefined order.
   * @param theme
   * @returns
   */
  private static orderKeys(theme: ColorTheme): ColorTheme {
    const ordered: ColorTheme = {};
    for (const prop of KEY_ORDER) {
      if (theme[prop] !== undefined) {
        (ordered as Record<string, unknown>)[prop] = theme[prop];
      }
    }
    return ordered;
  }
}
