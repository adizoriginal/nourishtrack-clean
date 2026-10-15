import { useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { STREAK_MILESTONES, calculateStreak } from "@/lib/streak";

/** "🔥 6-day streak" — days in a row with at least one food logged. */
export const StreakBadge = () => {
  const { allMeals } = useAppContext();

  const streak = useMemo(() => {
    const logged = Object.entries(allMeals)
      .filter(([, day]) => Object.values(day).some((items) => items.length > 0))
      .map(([date]) => date);
    return calculateStreak(logged);
  }, [allMeals]);

  const { current, best, loggedToday } = streak;
  const milestone = loggedToday && STREAK_MILESTONES.includes(current);

  let message: string;
  if (current === 0) message = "Log a meal today to start a streak";
  else if (!loggedToday) message = "Log something today to keep it going";
  else if (milestone) message = `${current} days in a row, great work!`;
  else if (best > current) message = `Best: ${best} days`;
  else message = "Your best yet. Keep going!";

  return (
    <div className="inline-flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-sm">
      <span className={current > 0 ? "text-2xl" : "text-2xl grayscale opacity-50"} aria-hidden>
        {milestone ? "🎉" : "🔥"}
      </span>
      <div className="leading-tight">
        <div className="font-semibold">{current === 0 ? "No streak yet" : `${current}-day streak`}</div>
        <div className="text-xs text-muted-foreground">{message}</div>
      </div>
    </div>
  );
};
