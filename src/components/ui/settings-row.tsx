import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as React from "react";
import { cn } from "@/lib/utils";

export function SettingsSection({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "px-5 pt-4 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground first:pt-0",
        className,
      )}
    >
      {title}
    </p>
  );
}

export function SettingsSeparator({ className }: { className?: string }) {
  return (
    <SeparatorPrimitive.Root
      decorative
      orientation="horizontal"
      className={cn("mx-5 h-px bg-border", className)}
    />
  );
}

export function SettingsRow({
  label,
  htmlFor,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-between gap-4 px-5 py-2",
        className,
      )}
    >
      <label htmlFor={htmlFor} className="shrink-0 text-sm leading-relaxed">
        {label}
      </label>
      <div className="min-w-0 flex-1 text-right">{children}</div>
    </div>
  );
}
