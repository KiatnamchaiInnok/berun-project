"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { showLogModal } from "@/components/log/log-run-modal";

export function TodayActions({
  sessionId,
  workoutType,
  durationSec,
}: {
  sessionId?: string;
  workoutType: string;
  durationSec?: number;
}) {
  const t = useTranslations("today");

  if (workoutType === "rest" || !sessionId) {
    return null;
  }

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={() =>
        showLogModal({
          plannedSessionId: sessionId,
          workoutType,
          defaultDurationSec: durationSec,
        })
      }
    >
      {t("logRun")}
    </Button>
  );
}
