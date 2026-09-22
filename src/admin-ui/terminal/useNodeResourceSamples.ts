import { useEffect, useState } from "react";
import { useRPC2Call } from "@/shared/contexts/RPC2Context";

export interface RawLatestStatus {
  online?: boolean;
  cpu?: number;
  ram?: number;
  disk?: number;
  net_in?: number;
  net_out?: number;
}

export interface ResourceSample {
  online: boolean;
  cpuUsage: number;
  ramUsed: number;
  diskUsed: number;
  networkDown: number;
  networkUp: number;
}

const RESOURCE_UPDATE_INTERVAL_MS = 2000;

export const normalizePercent = (value: number) =>
  Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

export const usagePercent = (used: number, total: number) =>
  total > 0 ? normalizePercent((used / total) * 100) : 0;

export const usageColor = (percent: number) => {
  if (percent >= 90) return "#dc143c";
  if (percent >= 70) return "#eab308";
  return "#3cb371";
};

const sameSample = (left: ResourceSample, right: ResourceSample) =>
  left.online === right.online &&
  left.cpuUsage === right.cpuUsage &&
  left.ramUsed === right.ramUsed &&
  left.diskUsed === right.diskUsed &&
  left.networkDown === right.networkDown &&
  left.networkUp === right.networkUp;

const toSample = (record: RawLatestStatus | undefined): ResourceSample => ({
  online: record?.online === true,
  cpuUsage: normalizePercent(record?.cpu ?? 0),
  ramUsed: record?.ram ?? 0,
  diskUsed: record?.disk ?? 0,
  networkDown: record?.net_in ?? 0,
  networkUp: record?.net_out ?? 0,
});

/**
 * Polls common:getNodesLatestStatus for the given node uuids every
 * RESOURCE_UPDATE_INTERVAL_MS, pausing while the tab is hidden. Shared by
 * EditorResourceMonitor (single node) and TerminalResourceMonitor (multiple).
 */
export function useNodeResourceSamples(uuids: string[]) {
  const { call } = useRPC2Call();
  const [samples, setSamples] = useState<Record<string, ResourceSample>>({});
  const [loadError, setLoadError] = useState(false);
  const uuidsKey = uuids.join("|");

  useEffect(() => {
    const selectedUuids = uuidsKey ? uuidsKey.split("|") : [];
    if (selectedUuids.length === 0) {
      setSamples({});
      setLoadError(false);
      return;
    }

    let stopped = false;
    let running = false;
    let requestSequence = 0;

    const refresh = async () => {
      if (running || document.hidden) return;
      running = true;
      const sequence = ++requestSequence;

      try {
        const result = await call<
          Record<string, never>,
          Record<string, RawLatestStatus>
        >("common:getNodesLatestStatus");
        if (stopped || sequence !== requestSequence) return;

        const next: Record<string, ResourceSample> = {};
        for (const uuid of selectedUuids) {
          next[uuid] = toSample(result?.[uuid]);
        }

        setSamples((previous) => {
          const previousKeys = Object.keys(previous);
          const changed =
            previousKeys.length !== selectedUuids.length ||
            previousKeys.some(
              (uuid) => !next[uuid] || !sameSample(previous[uuid], next[uuid]),
            );
          return changed ? next : previous;
        });
        setLoadError(false);
      } catch {
        if (!stopped && sequence === requestSequence) {
          setLoadError(true);
        }
      } finally {
        running = false;
      }
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), RESOURCE_UPDATE_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [call, uuidsKey]);

  return { samples, loadError };
}
