// Display helpers for recipes (used on the server and in the browser).
import { fmt } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries/he";

// 45 -> "45 דק׳", 90 -> "1 ש׳ 30 דק׳", 120 -> "2 ש׳"
export function formatMinutes(minutes: number, t: Dictionary["time"]): string {
  if (minutes < 60) return fmt(t.minutes, { n: minutes });
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? fmt(t.hours, { n: h }) : fmt(t.hoursMinutes, { h, m });
}

// Days left before a recipe in the trash is deleted for good (30 days)
export const TRASH_DAYS = 30;
export function trashDaysLeft(deletedAt: string, now: number): number {
  const passed = (now - new Date(deletedAt).getTime()) / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(TRASH_DAYS - passed));
}
