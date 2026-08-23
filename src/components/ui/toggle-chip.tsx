"use client";

import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import * as React from "react";
import { cn } from "@/lib/utils";

const chipClassName =
  "inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium leading-relaxed transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

export function ToggleChipGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  );
}

export function ToggleChipItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item className={cn(chipClassName, className)} {...props}>
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export function ToggleChipGrid({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      className={cn("grid grid-cols-5 gap-2", className)}
      {...props}
    />
  );
}
