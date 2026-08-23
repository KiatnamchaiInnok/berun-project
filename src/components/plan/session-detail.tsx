"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  type HrZones,
  type WorkoutSegments,
} from "@/lib/engine/plan-engine";
import { WorkoutSegmentBreakdown } from "./workout-segment-breakdown";

export function SessionDetail({
  header,
  subheader,
  segments,
  hrZones,
  defaultExpanded = false,
}: {
  header: React.ReactNode;
  subheader?: React.ReactNode;
  segments: WorkoutSegments | null;
  hrZones: HrZones | null;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const canExpand = segments != null && segments.segments.length > 0;

  return (
    <div className="min-w-0 rounded-xl border border-border text-sm leading-relaxed">
      <button
        type="button"
        className={cn(
          "flex w-full min-w-0 flex-col gap-1 px-3 py-2 text-left",
          canExpand && "min-h-12 cursor-pointer hover:bg-accent/50",
          !canExpand && "cursor-default",
        )}
        onClick={() => canExpand && setExpanded((v) => !v)}
        aria-expanded={canExpand ? expanded : undefined}
        disabled={!canExpand}
      >
        <div className="flex min-w-0 items-center justify-between gap-x-3">
          <div className="min-w-0 flex-1">{header}</div>
          {canExpand ? (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          ) : null}
        </div>
        {subheader ? (
          <p className="min-w-0 truncate text-xs text-muted-foreground">{subheader}</p>
        ) : null}
      </button>

      {canExpand && expanded ? (
        <div className="border-t border-border px-3 pb-3 pt-3">
          <WorkoutSegmentBreakdown segments={segments!} hrZones={hrZones} />
        </div>
      ) : null}
    </div>
  );
}
