"use client";

import { useTranslations } from "next-intl";
import { type StrengthExercise } from "@/lib/engine/plan-engine";

function exerciseDetailKey(ex: StrengthExercise): string {
  if (ex.isTimed && ex.isUnilateral) return "exerciseDetailTimedPerSide";
  if (ex.isTimed) return "exerciseDetailTimed";
  if (ex.isUnilateral) return "exerciseDetailPerSide";
  return "exerciseDetail";
}

export function StrengthExerciseList({
  exercises,
}: {
  exercises: StrengthExercise[];
}) {
  const t = useTranslations("strength");

  return (
    <ul className="flex flex-col gap-2 border-t border-border pt-3">
      {exercises.map((ex) => (
        <li
          key={ex.nameKey}
          className="flex items-baseline justify-between gap-3 text-sm leading-relaxed"
        >
          <span className="min-w-0 font-medium">{t(ex.nameKey as "gluteBridge")}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {t(exerciseDetailKey(ex) as "exerciseDetail", {
              sets: ex.sets,
              reps: ex.reps,
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
