import { cn } from "@/lib/utils";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("relative h-3 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg viewBox="0 0 100 1" preserveAspectRatio="none" className="h-full w-full">
        <rect x="0" y="0" width={clamped} height="1" className="fill-primary" />
      </svg>
    </div>
  );
}
