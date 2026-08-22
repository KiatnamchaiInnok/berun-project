---
name: mobile-first-ui
description: Mobile-first UI patterns for Berun running app. Use when building pages, forms, modals, navigation, or responsive layouts in this project.
---

# Mobile-First UI (Berun)

## Navigation

- Mobile: bottom bar with 4 tabs + center FAB for logging
- Desktop (`lg+`): sidebar left, content max-w-5xl
- Tabs: Today, Plan, Progress, Settings

## Modals

- Mobile: `Drawer` (vaul) via NiceModal
- Desktop (`md+`): `Dialog` via NiceModal
- Log sheet: pre-fill from planned session (3-tap flow)

## Forms (post-run logging)

Field order matches watch summary: distance → duration → pace (computed) → avg HR → max HR
- Use `inputMode="decimal"` for numbers
- RPE: ToggleGroup grid 1–10 with labels, not sliders
- Pain: hidden behind single button, then location chips + score

## Empty states

- ACWR before 28 days: "Collecting data — N days remaining"
- Never show blank charts

## Status

- Always: icon + color + text label
- Recovery weeks: success styling, not failure

## Components

- shadcn + Tailwind only
- Skeleton for loading states
- sonner for toasts
