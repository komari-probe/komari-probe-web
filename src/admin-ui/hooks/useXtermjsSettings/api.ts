import { isPlainObject } from "./types";
import { deserializeXtermjsSettings, serializeXtermjsSettings } from "./sanitize";
import type { XtermjsSettings } from "./types";

function parseXtermjsEnvelope(value: unknown): {
  status?: unknown;
  message?: unknown;
  data?: unknown;
} {
  return isPlainObject(value) ? value : {};
}

async function readXtermjsEnvelope(response: Response): Promise<{
  status?: unknown;
  message?: unknown;
  data?: unknown;
}> {
  try {
    return parseXtermjsEnvelope(await response.json());
  } catch {
    return {};
  }
}

function getInvalidXtermjsEnvelopeMessage(): string {
  return "Invalid response envelope from /api/admin/settings/xtermjs";
}

function getXtermjsErrorMessage(
  message: unknown,
  fallback: string
): string {
  return typeof message === "string" && message.trim().length > 0
    ? message
    : fallback;
}

export async function fetchXtermjsSettings(options?: {
  signal?: AbortSignal;
}): Promise<XtermjsSettings> {
  const response = await fetch("/api/admin/settings/xtermjs", {
    signal: options?.signal,
  });

  const json = await readXtermjsEnvelope(response);
  if (!response.ok || json.status !== "success") {
    throw new Error(
      getXtermjsErrorMessage(
        json.message,
        response.ok ? getInvalidXtermjsEnvelopeMessage() : `HTTP ${response.status}`
      )
    );
  }

  return deserializeXtermjsSettings(json.data);
}

export async function saveXtermjsSettings(
  settings: XtermjsSettings,
  options?: { signal?: AbortSignal }
): Promise<XtermjsSettings> {
  const response = await fetch("/api/admin/settings/xtermjs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(serializeXtermjsSettings(settings)),
    signal: options?.signal,
  });

  const json = await readXtermjsEnvelope(response);
  if (!response.ok || json.status !== "success") {
    throw new Error(
      getXtermjsErrorMessage(
        json.message,
        response.ok ? getInvalidXtermjsEnvelopeMessage() : `HTTP ${response.status}`
      )
    );
  }

  return deserializeXtermjsSettings(json.data);
}
