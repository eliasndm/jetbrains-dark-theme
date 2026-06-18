export interface TokenColorSettings {
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

export interface TokenColor {
  name?: string;
  scope?: string | string[];
  settings: TokenColorSettings;
}

export type SemanticTokenColor =
  | string
  | {
      foreground?: string;
      fontStyle?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
    };

export interface ColorTheme {
  $schema?: string;
  name?: string;
  include?: string;
  colors?: Record<string, string>;
  tokenColors?: TokenColor[];
  semanticHighlighting?: boolean;
  semanticTokenColors?: Record<string, SemanticTokenColor>;
}

/** A def fragment follows the (partial) VSCode color-theme schema. */
export type ThemeDef = Partial<ColorTheme>;

export interface ThemeConfig {
  name?: string;
  filename: string;
  schema?: string;
  /** Key of another theme to `include` (resolved to `./<filename>.json`). */
  include?: string;
  /** Names of defs to merge, in order. */
  defs?: string[];
  semanticHighlighting?: boolean;
}

export interface BuildConfig {
  schema?: string;
  outputDir?: string;
  /** Def name -> file path (relative to the builder's rootDir). */
  defs: Record<string, string>;
  /** Theme key -> theme config. The key is used for `include` resolution. */
  themes: Record<string, ThemeConfig>;
}

export interface ThemeBuilderOptions {
  /** Base directory def paths are resolved against. Defaults to process.cwd(). */
  rootDir?: string;
  /** Default `$schema` for built themes. */
  schema?: string;
  /** Def name -> file path (relative to rootDir). */
  defs?: Record<string, string>;
}

export interface ThemeWriteResult {
  key: string;
  filename: string;
  path: string;
  theme: ColorTheme;
}
