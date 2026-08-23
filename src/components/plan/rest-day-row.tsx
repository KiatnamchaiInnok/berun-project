import { cn } from "@/lib/utils";

export function RestDayRow({
  header,
}: {
  header: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-border bg-muted/30 px-3 py-2 text-sm leading-relaxed text-muted-foreground",
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-x-3">{header}</div>
    </div>
  );
}
