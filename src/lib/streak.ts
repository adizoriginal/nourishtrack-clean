import { toLocalDateString } from "./dates";

export interface StreakInfo {
  /** Days in a row with at least one food logged, ending today (or yesterday if today isn't logged yet) */
  current: number;
  best: number;
  loggedToday: boolean;
}

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
};

/** loggedDates: YYYY-MM-DD strings of days with at least one food entry */
export function calculateStreak(loggedDates: Iterable<string>, today = toLocalDateString()): StreakInfo {
  const days = new Set(loggedDates);
  const loggedToday = days.has(today);

  // Current streak: count back from today, or from yesterday if today has nothing yet (still "alive")
  let current = 0;
  let cursor = loggedToday ? today : addDays(today, -1);
  while (days.has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // Best streak ever
  let best = 0;
  for (const day of days) {
    if (days.has(addDays(day, -1))) continue; // only start counting at the first day of a run
    let length = 0;
    let c = day;
    while (days.has(c)) {
      length++;
      c = addDays(c, 1);
    }
    best = Math.max(best, length);
  }

  return { current, best: Math.max(best, current), loggedToday };
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];
