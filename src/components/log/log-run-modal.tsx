"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { saveActivityLog } from "@/lib/actions/training";
import { cn, formatPaceSecPerKm, kmToMeters, parseDurationToSeconds } from "@/lib/utils";

const RPE_LABELS: Record<number, string> = {
  1: "1",
  2: "2",
  3: "3 สบาย",
  4: "4 คุยได้",
  5: "5",
  6: "6",
  7: "7 หนัก",
  8: "8",
  9: "9",
  10: "10 สุด",
};

const PAIN_LOCATIONS = ["knee", "shin", "achilles", "foot", "hip", "other"] as const;

export interface LogModalProps {
  plannedSessionId?: string;
  workoutType?: string;
  defaultDurationSec?: number;
  defaultDistanceM?: number;
}

export const LogRunModal = NiceModal.create(
  ({ plannedSessionId, workoutType = "easy", defaultDurationSec, defaultDistanceM }: LogModalProps) => {
    const modal = useModal();
    const t = useTranslations("log");
    const [offPlan, setOffPlan] = useState(!plannedSessionId);
    const [expanded, setExpanded] = useState(false);
    const [distanceKm, setDistanceKm] = useState(
      defaultDistanceM ? (defaultDistanceM / 1000).toFixed(2) : "",
    );
    const [hours, setHours] = useState("0");
    const [minutes, setMinutes] = useState(
      defaultDurationSec ? String(Math.floor(defaultDurationSec / 60)) : "30",
    );
    const [seconds, setSeconds] = useState("0");
    const [avgHr, setAvgHr] = useState("");
    const [maxHr, setMaxHr] = useState("");
    const [rpe, setRpe] = useState<number>(4);
    const [feel, setFeel] = useState<string>("ok");
    const [showPain, setShowPain] = useState(false);
    const [painLocation, setPainLocation] = useState<string>("knee");
    const [painScore, setPainScore] = useState(0);
    const [altersGait, setAltersGait] = useState(false);
    const [note, setNote] = useState("");

    const durationSec = useMemo(
      () => parseDurationToSeconds(Number(hours), Number(minutes), Number(seconds)),
      [hours, minutes, seconds],
    );
    const distanceM = distanceKm ? kmToMeters(Number(distanceKm)) : undefined;
    const pace = distanceM ? formatPaceSecPerKm(durationSec, distanceM) : null;

    const mutation = useMutation({
      mutationFn: () =>
        saveActivityLog({
          plannedSessionId: offPlan ? undefined : plannedSessionId,
          trainingDate: new Date().toISOString().slice(0, 10),
          workoutType,
          durationSec,
          distanceM,
          avgHr: avgHr ? Number(avgHr) : undefined,
          maxHr: maxHr ? Number(maxHr) : undefined,
          rpe,
          feel,
          note: note || undefined,
          painReports:
            showPain && painScore > 0
              ? [{ location: painLocation, score: painScore, altersGait }]
              : undefined,
        }),
      onSuccess: () => {
        toast.success(t("saved"));
        modal.hide();
      },
      onError: () => toast.error("Error"),
    });

    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center">
        <Card className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-b-none lg:rounded-2xl">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={offPlan ? "outline" : "default"}
                onClick={() => setOffPlan(false)}
              >
                {t("followPlan")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={offPlan ? "default" : "outline"}
                onClick={() => setOffPlan(true)}
              >
                {t("offPlan")}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pb-8">
            <div>
              <Label htmlFor="distance">{t("distanceKm")}</Label>
              <Input
                id="distance"
                inputMode="decimal"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
              />
            </div>
            <div>
              <Label>{t("duration")}</Label>
              <div className="grid grid-cols-3 gap-2">
                <Input inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="h" />
                <Input inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="m" />
                <Input inputMode="numeric" value={seconds} onChange={(e) => setSeconds(e.target.value)} placeholder="s" />
              </div>
            </div>
            {pace ? (
              <p className="text-sm text-muted-foreground tabular-nums">
                {t("pace")}: {pace}
              </p>
            ) : null}
            <div>
              <Label>{t("rpe")}</Label>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRpe(n)}
                    className={cn(
                      "min-h-12 rounded-xl border text-sm leading-relaxed",
                      rpe === n ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {RPE_LABELS[n] ?? n}
                  </button>
                ))}
              </div>
            </div>
            <Button type="button" size="lg" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {t("save")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setExpanded(!expanded)}>
              {t("moreDetails")}
            </Button>
            {expanded ? (
              <div className="flex flex-col gap-4 border-t border-border pt-4">
                <div>
                  <Label htmlFor="avgHr">{t("avgHr")}</Label>
                  <Input id="avgHr" inputMode="numeric" value={avgHr} onChange={(e) => setAvgHr(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="maxHr">{t("maxHr")}</Label>
                  <Input id="maxHr" inputMode="numeric" value={maxHr} onChange={(e) => setMaxHr(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  {(["good", "ok", "bad"] as const).map((f) => (
                    <Button key={f} type="button" variant={feel === f ? "default" : "outline"} onClick={() => setFeel(f)}>
                      {f === "good" ? t("feelGood") : f === "ok" ? t("feelOk") : t("feelBad")}
                    </Button>
                  ))}
                </div>
                <Button type="button" variant="outline" onClick={() => setShowPain(!showPain)}>
                  {t("painQuestion")}
                </Button>
                {showPain ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      {PAIN_LOCATIONS.map((loc) => (
                        <Button
                          key={loc}
                          type="button"
                          size="sm"
                          variant={painLocation === loc ? "default" : "outline"}
                          onClick={() => setPainLocation(loc)}
                        >
                          {loc}
                        </Button>
                      ))}
                    </div>
                    <Input
                      inputMode="numeric"
                      value={painScore}
                      onChange={(e) => setPainScore(Number(e.target.value))}
                      placeholder={t("painScore")}
                    />
                    <label className="flex items-center gap-2 text-sm leading-relaxed">
                      <input type="checkbox" checked={altersGait} onChange={(e) => setAltersGait(e.target.checked)} />
                      {t("altersGait")}
                    </label>
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="note">{t("note")}</Label>
                  <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>
            ) : null}
            <Button type="button" variant="ghost" onClick={() => modal.hide()}>
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  },
);

export function showLogModal(props: LogModalProps = {}) {
  NiceModal.show(LogRunModal, props);
}
