import { useMemo } from "react";
import { ArrowDown, ArrowUp, Gauge } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNodeList } from "@/shared/contexts/NodeListContext";
import { getOSImage } from "@/shared/utils/osImageHelper";
import { formatBytes } from "@/shared/utils/unitHelper";
import {
  normalizePercent,
  usageColor,
  usagePercent,
  useNodeResourceSamples,
} from "./useNodeResourceSamples";

const UsageMetric = ({
  label,
  detail,
  percent,
}: {
  label: string;
  detail: string;
  percent: number;
}) => (
  <div>
    <div className="flex items-baseline justify-between gap-1 text-[10px] leading-4">
      <span className="text-neutral-400">{label}</span>
      <span className="min-w-0 truncate font-medium text-neutral-100">{detail}</span>
    </div>
    <div className="mt-0.5 h-[3px] overflow-hidden rounded-full bg-neutral-800">
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          backgroundColor: usageColor(normalizePercent(percent)),
          width: `${normalizePercent(percent)}%`,
        }}
      />
    </div>
  </div>
);

interface EditorResourceMonitorProps {
  uuid: string;
}

const EditorResourceMonitor = ({ uuid }: EditorResourceMonitorProps) => {
  const { t } = useTranslation();
  const { nodeList } = useNodeList(false) ?? { nodeList: [] };
  const { samples, loadError } = useNodeResourceSamples(useMemo(() => [uuid], [uuid]));
  const sample = samples[uuid] ?? null;

  const node = useMemo(
    () => (nodeList ?? []).find((item) => item.uuid === uuid),
    [nodeList, uuid],
  );

  return (
    <section className="shrink-0 border-t border-[#2b2b2b] bg-[#181818]" aria-label={t("terminal.resource_monitor.title", "资源小窗")}>
      <div className="flex h-7 items-center gap-1.5 px-2 text-[10px] font-semibold uppercase text-neutral-500">
        <Gauge size={12} className="shrink-0" />
        <span>{t("terminal.resource_monitor.title", "资源小窗")}</span>
        <img
          src={getOSImage(node?.os || "")}
          alt=""
          draggable={false}
          className="ml-auto h-3 w-3 shrink-0 object-contain"
        />
        <span className="max-w-[72px] truncate normal-case">{node?.name ?? uuid}</span>
      </div>

      <div className="space-y-1.5 px-2 pb-2">
        {loadError && (
          <p className="text-[10px] text-red-300">
            {t("terminal.resource_monitor.load_error", "实时数据加载失败")}
          </p>
        )}
        {!sample ? (
          <p className="pb-0.5 text-[10px] text-neutral-500">
            {t("terminal.resource_monitor.waiting", "等待数据...")}
          </p>
        ) : !sample.online ? (
          <p className="pb-0.5 text-[10px] text-red-300">
            {t("nodeCard.offline", "离线")}
          </p>
        ) : (
          <>
            <UsageMetric
              label="CPU"
              detail={`${sample.cpuUsage.toFixed(1)}%`}
              percent={sample.cpuUsage}
            />
            <UsageMetric
              label={t("nodeCard.ram", "内存")}
              detail={`${formatBytes(sample.ramUsed)} / ${formatBytes(node?.mem_total ?? 0)}`}
              percent={usagePercent(sample.ramUsed, node?.mem_total ?? 0)}
            />
            <UsageMetric
              label={t("nodeCard.disk", "磁盘")}
              detail={`${formatBytes(sample.diskUsed)} / ${formatBytes(node?.disk_total ?? 0)}`}
              percent={usagePercent(sample.diskUsed, node?.disk_total ?? 0)}
            />
            <div className="grid grid-cols-2 gap-x-1.5 pt-0.5">
              <div className="min-w-0">
                <div className="flex items-center gap-0.5 text-[10px] text-neutral-400">
                  <ArrowUp size={9} className="shrink-0" />
                  <span>{t("dashboard.uploadRate", "上传速率")}</span>
                </div>
                <p className="truncate text-[10px] font-medium text-neutral-100">
                  {formatBytes(sample.networkUp)}/s
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-0.5 text-[10px] text-neutral-400">
                  <ArrowDown size={9} className="shrink-0" />
                  <span>{t("dashboard.downloadRate", "下载速率")}</span>
                </div>
                <p className="truncate text-[10px] font-medium text-neutral-100">
                  {formatBytes(sample.networkDown)}/s
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default EditorResourceMonitor;
