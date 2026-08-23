"use client";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { Input, Label } from "@/components/ui/input";
import { ToggleChipGrid, ToggleChipGroup, ToggleChipItem } from "@/components/ui/toggle-chip";
import { saveActivityLog } from "@/lib/actions/training";
import { formatPaceSecPerKm, kmToMeters, parseDurationToSeconds } from "@/lib/utils";

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
    const [rpe, setRpe] = useState("4");
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
          rpe: Number(rpe),
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
      <Dialog.Root
        open={modal.visible}
        onOpenChange={(open) => {
          if (!open) modal.hide();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Dialog.Content className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col outline-none lg:inset-auto lg:left-1/2 lg:top-1/2 lg:max-h-[85vh] lg:w-full lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2">
            <Card className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl rounded-b-none lg:max-h-[85vh] lg:rounded-2xl">
              <div className="mx-auto mt-2 h-1.5 w-12 shrink-0 rounded-full bg-muted lg:hidden" aria-hidden />
              <CardHeader className="relative shrink-0 pb-3">
                <Dialog.Title asChild>
                  <CardTitle>{t("title")}</CardTitle>
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4"
                    aria-label={t("close")}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
                <ToggleChipGroup
                  type="single"
                  value={offPlan ? "off" : "plan"}
                  onValueChange={(value) => {
                    if (value) setOffPlan(value === "off");
                  }}
                  className="mt-2"
                  aria-label={t("followPlan")}
                >
                  <ToggleChipItem value="plan">{t("followPlan")}</ToggleChipItem>
                  <ToggleChipItem value="off">{t("offPlan")}</ToggleChipItem>
                </ToggleChipGroup>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-safe">
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
                  <ToggleChipGrid
                    type="single"
                    value={rpe}
                    onValueChange={(value) => {
                      if (value) setRpe(value);
                    }}
                    className="mt-2"
                    aria-label={t("rpe")}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <ToggleChipItem key={n} value={String(n)} className="min-h-12 px-1 text-xs">
                        {RPE_LABELS[n] ?? n}
                      </ToggleChipItem>
                    ))}
                  </ToggleChipGrid>
                </div>
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
                    <div>
                      <Label>{t("feel")}</Label>
                      <ToggleChipGroup
                        type="single"
                        value={feel}
                        onValueChange={(value) => {
                          if (value) setFeel(value);
                        }}
                        className="mt-2"
                        aria-label={t("feel")}
                      >
                        {(["good", "ok", "bad"] as const).map((f) => (
                          <ToggleChipItem key={f} value={f}>
                            {f === "good" ? t("feelGood") : f === "ok" ? t("feelOk") : t("feelBad")}
                          </ToggleChipItem>
                        ))}
                      </ToggleChipGroup>
                    </div>
                    <Button type="button" variant="outline" onClick={() => setShowPain(!showPain)}>
                      {t("painQuestion")}
                    </Button>
                    {showPain ? (
                      <div className="flex flex-col gap-3">
                        <ToggleChipGroup
                          type="single"
                          value={painLocation}
                          onValueChange={(value) => {
                            if (value) setPainLocation(value);
                          }}
                          className="flex-wrap"
                          aria-label={t("painQuestion")}
                        >
                          {PAIN_LOCATIONS.map((loc) => (
                            <ToggleChipItem key={loc} value={loc}>
                              {loc}
                            </ToggleChipItem>
                          ))}
                        </ToggleChipGroup>
                        <Input
                          inputMode="numeric"
                          value={painScore}
                          onChange={(e) => setPainScore(Number(e.target.value))}
                          placeholder={t("painScore")}
                        />
                        <CheckboxField id="altersGait" checked={altersGait} onCheckedChange={setAltersGait}>
                          {t("altersGait")}
                        </CheckboxField>
                      </div>
                    ) : null}
                    <div>
                      <Label htmlFor="note">{t("note")}</Label>
                      <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                  </div>
                ) : null}
              </CardContent>
              <div className="sticky bottom-0 shrink-0 border-t border-border bg-card p-5 pb-safe pt-4">
                <Button type="button" size="lg" className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                  {t("save")}
                </Button>
              </div>
            </Card>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  },
);

export function showLogModal(props: LogModalProps = {}) {
  NiceModal.show(LogRunModal, props);
}
