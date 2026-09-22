import type { ITerminalOptions, ITheme } from "@xterm/xterm";

export const DEFAULT_FONT_FAMILY = "'Cascadia Mono', 'Noto Sans SC', monospace";
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_SCROLLBACK = 5000;
export const DEFAULT_CURSOR_BLINK = true;
export const DEFAULT_CONVERT_EOL = true;
export const DEFAULT_MAC_OPTION_IS_META = true;
export const DEFAULT_TERMINAL_PADDING = 16;
export const DEFAULT_TRANSPARENT_BACKGROUND = false;
export const DEFAULT_CUSTOM_CSS = "";

export type XtermStringThemeKey = Exclude<keyof ITheme, "extendedAnsi">;

export const xtermThemeWhitelist: (keyof ITheme)[] = [
  "foreground",
  "background",
  "cursor",
  "cursorAccent",
  "selectionForeground",
  "selectionBackground",
  "selectionInactiveBackground",
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
  "extendedAnsi",
];

export interface ParsedXtermThemeJson {
  theme: Partial<ITheme> | undefined;
  filtered: boolean;
}

export type XtermThemeJsonParseResult =
  | { status: "invalid_json" }
  | { status: "non_object" }
  | ({ status: "ok" } & ParsedXtermThemeJson);

export interface XtermjsTerminalOptions
  extends Pick<
    ITerminalOptions,
    | "cursorBlink"
    | "convertEol"
    | "fontFamily"
    | "fontSize"
    | "macOptionIsMeta"
    | "scrollback"
  > {
  theme?: Partial<ITheme>;
}

export interface XtermjsTerminalOptionsDto {
  cursorBlink: boolean;
  convertEol: boolean;
  fontFamily: string;
  fontSize: number;
  macOptionIsMeta: boolean;
  scrollback: number;
  theme: Record<string, unknown> | null;
}

export interface XtermjsSettingsDto {
  terminalOptions: XtermjsTerminalOptionsDto;
  terminalPadding: number;
  transparentBackground: boolean;
  customCss: string;
}

export interface XtermjsSettings {
  terminalOptions: XtermjsTerminalOptions;
  terminalPadding: number;
  transparentBackground: boolean;
  customCss: string;
}

export const defaultXtermjsSettings: XtermjsSettings = {
  terminalOptions: {
    cursorBlink: DEFAULT_CURSOR_BLINK,
    convertEol: DEFAULT_CONVERT_EOL,
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize: DEFAULT_FONT_SIZE,
    macOptionIsMeta: DEFAULT_MAC_OPTION_IS_META,
    scrollback: DEFAULT_SCROLLBACK,
    theme: undefined,
  },
  terminalPadding: DEFAULT_TERMINAL_PADDING,
  transparentBackground: DEFAULT_TRANSPARENT_BACKGROUND,
  customCss: DEFAULT_CUSTOM_CSS,
};

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function createDefaultXtermjsSettings(): XtermjsSettings {
  return {
    terminalOptions: {
      ...defaultXtermjsSettings.terminalOptions,
      theme: undefined,
    },
    terminalPadding: defaultXtermjsSettings.terminalPadding,
    transparentBackground: defaultXtermjsSettings.transparentBackground,
    customCss: defaultXtermjsSettings.customCss,
  };
}
