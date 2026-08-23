"use client";

import { useTranslations } from "next-intl";
import {
  formatZoneDisplay,
  zoneColorClass,
  type HrZones,
  type WorkoutSegment,
  type WorkoutSegments,
} from "@/lib/engine/plan-engine";
import { cn } from "@/lib/utils";

type SegmentDetailKey =
  | "stridesDetail"
  | "stridesWork"
  | "stridesRest"
  | "intervalsDetail"
  | "tempoDetail"
  | "fartlekDetail"
  | "activationStrides";

export function WorkoutSegmentBreakdown({
  segments,
  hrZones,
  className,
}: {
  segments: WorkoutSegments;
  hrZones: HrZones | null;
  className?: string;
}) {
  const t = useTranslations("segment");
  const total = segments.totalDurationMin;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className="flex h-3 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={t("barLabel")}
      >
        {segments.segments.map((seg, i) => (
          <div
            key={`${seg.type}-${seg.labelKey}-${i}`}
            className={cn(zoneColorClass(seg.zone), "min-w-[4px] transition-all")}
            style={{ width: `${(seg.durationMin / total) * 100}%` }}
            title={t(seg.labelKey as "warmup")}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {segments.segments.map((seg, i) => (
          <SegmentRow key={`${seg.type}-${seg.labelKey}-${i}`} segment={seg} hrZones={hrZones} />
        ))}
      </ul>
    </div>
  );
}

function SegmentRow({
  segment: seg,
  hrZones,
}: {
  segment: WorkoutSegment;
  hrZones: HrZones | null;
}) {
  const t = useTranslations("segment");

  const zoneDisplay =
    seg.zone && hrZones
      ? t("zoneHr", {
          zone: seg.zone.replace("zone", ""),
          range: formatZoneDisplay(seg.zone, hrZones, "easy"),
        })
      : t("zoneRpe", { rpe: seg.rpe });

  const detailText =
    seg.detailKey && seg.detailParams
      ? t(seg.detailKey as SegmentDetailKey, seg.detailParams)
      : null;

  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed">
      <span
        className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", zoneColorClass(seg.zone))}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <span className="font-medium">{t(seg.labelKey as "warmup")}</span>
          {detailText ? (
            <span className="text-muted-foreground"> · {detailText}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 tabular-nums text-muted-foreground">
          <span>{t("durationMin", { minutes: seg.durationMin })}</span>
          <span className="hidden sm:inline">·</span>
          <span>{zoneDisplay}</span>
        </div>
      </div>
    </li>
  );
}
