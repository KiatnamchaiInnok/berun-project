import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { enUS, th } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPaceSecPerKm(durationSec: number, distanceM: number): string | null {
  if (!distanceM || distanceM <= 0) return null;
  const paceSec = durationSec / (distanceM / 1000);
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

export function formatKm(distanceM: number): string {
  return (distanceM / 1000).toFixed(2);
}

export function parseDurationToSeconds(h: number, m: number, s: number): number {
  return h * 3600 + m * 60 + s;
}

export function kmToMeters(km: number): number {
  return Math.round(km * 1000);
}

export function metersToKm(m: number): number {
  return m / 1000;
}

export function formatShortDate(date: Date | string, locale: string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  const dateLocale = locale === "th" ? th : enUS;
  const pattern = locale === "th" ? "EEE d MMM" : "EEE MMM d";
  return format(value, pattern, { locale: dateLocale });
}
