import type { ITheme } from "@xterm/xterm";
import {
  DEFAULT_CONVERT_EOL,
  DEFAULT_CURSOR_BLINK,
  DEFAULT_CUSTOM_CSS,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_MAC_OPTION_IS_META,
  DEFAULT_SCROLLBACK,
  DEFAULT_TERMINAL_PADDING,
  DEFAULT_TRANSPARENT_BACKGROUND,
  createDefaultXtermjsSettings,
  isPlainObject,
  xtermThemeWhitelist,
  type ParsedXtermThemeJson,
  type XtermStringThemeKey,
  type XtermThemeJsonParseResult,
  type XtermjsSettings,
  type XtermjsSettingsDto,
} from "./types";

function normalizeNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : fallback;
}

function normalizeNumber(
  value: unknown,
  fallback: number,
  minimum: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(minimum, Math.trunc(value));
}

function sanitizeThemeObject(value: Record<string, unknown>): ParsedXtermThemeJson {
  const theme: Partial<ITheme> = {};
  let filtered = false;

  for (const [key, rawValue] of Object.entries(value)) {
    if (!xtermThemeWhitelist.includes(key as keyof ITheme)) {
      filtered = true;
      continue;
    }

    if (key === "extendedAnsi") {
      if (
        Array.isArray(rawValue) &&
        rawValue.every(
          (color) => typeof color === "string" && color.trim().length > 0
        )
      ) {
        theme.extendedAnsi = rawValue;
      } else if (rawValue !== undefined) {
        filtered = true;
      }
      continue;
    }

    if (typeof rawValue === "string" && rawValue.trim().length > 0) {
      theme[key as XtermStringThemeKey] = rawValue;
    } else if (rawValue !== undefined) {
      filtered = true;
    }
  }

  return {
    theme: Object.keys(theme).length > 0 ? theme : undefined,
    filtered,
  };
}

export function parseXtermThemeJson(
  rawValue: string
): XtermThemeJsonParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return { status: "invalid_json" };
  }

  if (!isPlainObject(parsed)) {
    return { status: "non_object" };
  }

  return { status: "ok", ...sanitizeThemeObject(parsed) };
}

export function formatXtermThemeJson(value: Partial<ITheme> | undefined): string {
  return JSON.stringify(value ?? {}, null, 2);
}

function sanitizeThemeValue(value: unknown): Partial<ITheme> | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeThemeObject(value).theme;
}

export function sanitizeXtermjsSettings(value: unknown): XtermjsSettings {
  const fallback = createDefaultXtermjsSettings();

  if (!isPlainObject(value)) {
    return fallback;
  }

  const terminalOptions = isPlainObject(value.terminalOptions)
    ? value.terminalOptions
    : {};

  return {
    terminalOptions: {
      cursorBlink:
        typeof terminalOptions.cursorBlink === "boolean"
          ? terminalOptions.cursorBlink
          : fallback.terminalOptions.cursorBlink,
      convertEol:
        typeof terminalOptions.convertEol === "boolean"
          ? terminalOptions.convertEol
          : fallback.terminalOptions.convertEol,
      fontFamily: normalizeNonEmptyString(
        terminalOptions.fontFamily,
        fallback.terminalOptions.fontFamily!
      ),
      fontSize: normalizeNumber(
        terminalOptions.fontSize,
        fallback.terminalOptions.fontSize!,
        1
      ),
      macOptionIsMeta:
        typeof terminalOptions.macOptionIsMeta === "boolean"
          ? terminalOptions.macOptionIsMeta
          : fallback.terminalOptions.macOptionIsMeta,
      scrollback: normalizeNumber(
        terminalOptions.scrollback,
        fallback.terminalOptions.scrollback!,
        0
      ),
      theme: sanitizeThemeValue(terminalOptions.theme),
    },
    terminalPadding: normalizeNumber(
      value.terminalPadding,
      fallback.terminalPadding,
      0
    ),
    transparentBackground:
      typeof value.transparentBackground === "boolean"
        ? value.transparentBackground
        : fallback.transparentBackground,
    customCss:
      typeof value.customCss === "string"
        ? value.customCss
        : fallback.customCss,
  };
}

function deserializeXtermTheme(value: unknown): Partial<ITheme> | undefined {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeThemeObject(value).theme;
}

export function serializeXtermjsSettings(
  settings: XtermjsSettings
): XtermjsSettingsDto {
  const sanitized = sanitizeXtermjsSettings(settings);
  const terminalOptions = sanitized.terminalOptions;

  return {
    terminalOptions: {
      cursorBlink: terminalOptions.cursorBlink ?? DEFAULT_CURSOR_BLINK,
      convertEol: terminalOptions.convertEol ?? DEFAULT_CONVERT_EOL,
      fontFamily: terminalOptions.fontFamily ?? DEFAULT_FONT_FAMILY,
      fontSize: terminalOptions.fontSize ?? DEFAULT_FONT_SIZE,
      macOptionIsMeta: terminalOptions.macOptionIsMeta ?? DEFAULT_MAC_OPTION_IS_META,
      scrollback: terminalOptions.scrollback ?? DEFAULT_SCROLLBACK,
      theme:
        terminalOptions.theme === undefined
          ? null
          : { ...terminalOptions.theme },
    },
    terminalPadding: sanitized.terminalPadding ?? DEFAULT_TERMINAL_PADDING,
    transparentBackground:
      sanitized.transparentBackground ?? DEFAULT_TRANSPARENT_BACKGROUND,
    customCss: sanitized.customCss ?? DEFAULT_CUSTOM_CSS,
  };
}

export function deserializeXtermjsSettings(value: unknown): XtermjsSettings {
  if (!isPlainObject(value)) {
    return createDefaultXtermjsSettings();
  }

  const terminalOptions = isPlainObject(value.terminalOptions)
    ? value.terminalOptions
    : {};

  return sanitizeXtermjsSettings({
    terminalOptions: {
      cursorBlink:
        typeof terminalOptions.cursorBlink === "boolean"
          ? terminalOptions.cursorBlink
          : DEFAULT_CURSOR_BLINK,
      convertEol:
        typeof terminalOptions.convertEol === "boolean"
          ? terminalOptions.convertEol
          : DEFAULT_CONVERT_EOL,
      fontFamily:
        typeof terminalOptions.fontFamily === "string"
          ? terminalOptions.fontFamily
          : DEFAULT_FONT_FAMILY,
      fontSize:
        typeof terminalOptions.fontSize === "number"
          ? terminalOptions.fontSize
          : DEFAULT_FONT_SIZE,
      macOptionIsMeta:
        typeof terminalOptions.macOptionIsMeta === "boolean"
          ? terminalOptions.macOptionIsMeta
          : DEFAULT_MAC_OPTION_IS_META,
      scrollback:
        typeof terminalOptions.scrollback === "number"
          ? terminalOptions.scrollback
          : DEFAULT_SCROLLBACK,
      theme: deserializeXtermTheme(terminalOptions.theme),
    },
    terminalPadding:
      typeof value.terminalPadding === "number"
        ? value.terminalPadding
        : DEFAULT_TERMINAL_PADDING,
    transparentBackground:
      typeof value.transparentBackground === "boolean"
        ? value.transparentBackground
        : DEFAULT_TRANSPARENT_BACKGROUND,
    customCss:
      typeof value.customCss === "string"
        ? value.customCss
        : DEFAULT_CUSTOM_CSS,
  });
}

export function isTransparentBackground(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  if (normalized === "transparent" || normalized === "none") {
    return true;
  }

  const isTransparentAlpha = (rawAlpha: string): boolean => {
    const alphaValue = rawAlpha.trim();
    if (!alphaValue) {
      return false;
    }

    if (alphaValue.endsWith("%")) {
      const percentage = Number.parseFloat(alphaValue.slice(0, -1));
      return Number.isFinite(percentage) && percentage < 100;
    }

    const alpha = Number.parseFloat(alphaValue);
    return Number.isFinite(alpha) && alpha < 1;
  };

  const hexMatch = normalized.match(/^#([0-9a-f]{4}|[0-9a-f]{8})$/i);
  if (hexMatch) {
    const alphaHex =
      hexMatch[1].length === 4 ? hexMatch[1][3] : hexMatch[1].slice(6, 8);
    return Number.parseInt(alphaHex, 16) < 255;
  }

  const functionalColorMatch = normalized.match(/^(rgba?|hsla?)\((.+)\)$/i);
  if (functionalColorMatch) {
    const colorBody = functionalColorMatch[2];
    const slashAlpha = colorBody.split("/")[1]?.trim();
    if (slashAlpha) {
      return isTransparentAlpha(slashAlpha);
    }

    const parts = colorBody
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 4) {
      return isTransparentAlpha(parts[3]);
    }

    return false;
  }

  return false;
}
