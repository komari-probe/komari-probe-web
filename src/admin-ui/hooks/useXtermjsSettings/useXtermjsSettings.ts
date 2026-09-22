import { useCallback, useEffect, useRef, useState } from "react";
import type { SetStateAction } from "react";
import { fetchXtermjsSettings, saveXtermjsSettings } from "./api";
import { sanitizeXtermjsSettings } from "./sanitize";
import { createDefaultXtermjsSettings, defaultXtermjsSettings, isPlainObject } from "./types";
import type { XtermjsSettings } from "./types";

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException
      ? error.name === "AbortError"
      : isPlainObject(error) && error.name === "AbortError"
  );
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

export function useXtermjsSettings() {
  const mountedRef = useRef(true);
  const confirmedSettingsRef = useRef<XtermjsSettings>(defaultXtermjsSettings);
  const pendingSettingsRef = useRef<XtermjsSettings>(defaultXtermjsSettings);
  const latestRevisionRef = useRef(0);
  const mutationEpochRef = useRef(0);
  const queueTailRef = useRef(Promise.resolve());
  const pendingTaskCountRef = useRef(0);
  const [settings, setSettingsState] = useState<XtermjsSettings>(
    defaultXtermjsSettings
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  const syncSavingState = useCallback(() => {
    if (mountedRef.current) {
      setSaving(pendingTaskCountRef.current > 0);
    }
  }, []);

  const startQueuedTask = useCallback(
    <T,>(task: () => Promise<T>): Promise<T> => {
      pendingTaskCountRef.current += 1;
      syncSavingState();

      const runTask = () => Promise.resolve().then(task);
      const result = queueTailRef.current.then(runTask, runTask);

      queueTailRef.current = result.then(
        () => undefined,
        () => undefined
      );

      return result.finally(() => {
        pendingTaskCountRef.current -= 1;
        syncSavingState();
      });
    },
    [syncSavingState]
  );

  const applyFetchedSettings = useCallback((nextSettings: XtermjsSettings) => {
    const sanitized = sanitizeXtermjsSettings(nextSettings);
    confirmedSettingsRef.current = sanitized;
    pendingSettingsRef.current = sanitized;

    if (mountedRef.current) {
      setSettingsState(sanitized);
      setError(null);
    }

    return sanitized;
  }, []);

  const refetch = useCallback(
    async (options?: { signal?: AbortSignal }): Promise<XtermjsSettings> => {
      const requestEpoch = mutationEpochRef.current;
      const requestPendingCount = pendingTaskCountRef.current;

      if (mountedRef.current) {
        setLoading(true);
      }

      try {
        const fetched = await fetchXtermjsSettings({ signal: options?.signal });
        const isStale =
          requestEpoch !== mutationEpochRef.current ||
          requestPendingCount !== pendingTaskCountRef.current;

        if (isStale) {
          return sanitizeXtermjsSettings(fetched);
        }

        return mountedRef.current
          ? applyFetchedSettings(fetched)
          : sanitizeXtermjsSettings(fetched);
      } catch (caughtError) {
        if (!isAbortError(caughtError) && mountedRef.current) {
          setError(toError(caughtError));
        }
        throw caughtError;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [applyFetchedSettings]
  );

  const saveSettings = useCallback(
    async (valueOrUpdater: SetStateAction<XtermjsSettings>): Promise<XtermjsSettings> => {
      const baseSettings =
        pendingSettingsRef.current ?? confirmedSettingsRef.current;
      const nextSettings =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(baseSettings)
          : valueOrUpdater;
      const sanitizedNext = sanitizeXtermjsSettings(nextSettings);
      const revision = latestRevisionRef.current + 1;

      latestRevisionRef.current = revision;
      mutationEpochRef.current += 1;
      pendingSettingsRef.current = sanitizedNext;

      return startQueuedTask(async () => {
        try {
          await saveXtermjsSettings(sanitizedNext);
          const confirmed = await fetchXtermjsSettings();

          if (latestRevisionRef.current === revision) {
            confirmedSettingsRef.current = confirmed;
            pendingSettingsRef.current = confirmed;
            if (mountedRef.current) {
              setSettingsState(confirmed);
              setError(null);
            }
          } else {
            confirmedSettingsRef.current = confirmed;
          }

          return confirmed;
        } catch (caughtError) {
          if (latestRevisionRef.current === revision) {
            pendingSettingsRef.current = confirmedSettingsRef.current;
          }

          throw caughtError;
        }
      });
    },
    [startQueuedTask]
  );

  const resetSettings = useCallback(() => {
    return saveSettings(createDefaultXtermjsSettings());
  }, [saveSettings]);

  useEffect(() => {
    const controller = new AbortController();
    mountedRef.current = true;
    void refetch({ signal: controller.signal }).catch(() => {});

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [refetch]);

  return {
    settings,
    loading,
    error,
    saving,
    setSettings: saveSettings,
    resetSettings,
    refetch,
  };
}
