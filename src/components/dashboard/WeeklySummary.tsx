import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { toLocalDateString } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** Within 10% either side of the calorie goal counts as "on target" */
const ON_TARGET_RANGE = 0.1;

interface Day {
  date: Date;
  key: string;
  calories: number;
  logged: boolean;
}

/** Last 7 days of calories against the daily goal. */
export const WeeklySummary = () => {
  const { allMeals, profile, getNutritionSummary } = useAppContext();
  const goal = profile.calorieGoal;
  const [active, setActive] = useState<string | null>(null);

  const days = useMemo<Day[]>(() => {
    const out: Day[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const key = toLocalDateString(d);
      const meals = allMeals[key];
      const logged = !!meals && Object.values(meals).some((items) => items.length > 0);
      out.push({ date: d, key, calories: logged ? getNutritionSummary(key).caloriesConsumed : 0, logged });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMeals]);

  const loggedDays = days.filter((d) => d.logged);
  const average = loggedDays.length ? loggedDays.reduce((s, d) => s + d.calories, 0) / loggedDays.length : 0;
  const onTarget = loggedDays.filter((d) => Math.abs(d.calories - goal) <= goal * ON_TARGET_RANGE).length;
  const todayKey = toLocalDateString();

  // Scale so the goal line sits about two-thirds up, and the tallest bar still fits
  const scaleMax = Math.max(goal * 1.5, ...days.map((d) => d.calories)) || 1;
  const goalPct = (goal / scaleMax) * 100;

  const describe = (d: Day) => {
    const day = format(d.date, "EEE, MMM d");
    if (!d.logged) return `${day}: nothing logged`;
    const diff = Math.round(d.calories - goal);
    const vs = diff === 0 ? "exactly on goal" : diff > 0 ? `${diff.toLocaleString()} over goal` : `${(-diff).toLocaleString()} under goal`;
    return `${day}: ${Math.round(d.calories).toLocaleString()} kcal (${vs})`;
  };

  const activeDay = days.find((d) => d.key === active);

  return (
    <Card className="nourish-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Last 7 days</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-2xl font-bold">{loggedDays.length ? Math.round(average).toLocaleString() : "–"}</div>
            <div className="text-xs text-muted-foreground">avg kcal / day logged</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {onTarget}
              <span className="text-base font-medium text-muted-foreground">/7</span>
            </div>
            <div className="text-xs text-muted-foreground">days near goal</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {loggedDays.length}
              <span className="text-base font-medium text-muted-foreground">/7</span>
            </div>
            <div className="text-xs text-muted-foreground">days logged</div>
          </div>
        </div>

        {/* Bars */}
        <div>
          <div className="h-5 text-center text-sm" aria-live="polite">
            {activeDay ? describe(activeDay) : <span className="text-muted-foreground">Tap a bar for details</span>}
          </div>
          <div className="relative mt-2 h-40" onMouseLeave={() => setActive(null)}>
            {/* goal line */}
            <div
              className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-foreground/30"
              style={{ bottom: `${goalPct}%` }}
              aria-hidden
            >
              <span className="absolute -top-5 right-0 bg-card pl-1 text-[11px] text-muted-foreground">
                Goal {goal.toLocaleString()}
              </span>
            </div>
            <div className="absolute inset-0 flex items-end justify-between gap-2">
              {days.map((d) => {
                const over = d.logged && d.calories > goal * (1 + ON_TARGET_RANGE);
                const height = d.logged ? Math.max(3, (d.calories / scaleMax) * 100) : 2;
                const isActive = active === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    aria-label={describe(d)}
                    onMouseEnter={() => setActive(d.key)}
                    onFocus={() => setActive(d.key)}
                    onClick={() => setActive(d.key)}
                    className="group relative flex h-full flex-1 flex-col items-center justify-end rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {over && (
                      <span className="mb-0.5 text-[10px] font-medium leading-none text-amber-700" aria-hidden>
                        +{Math.round(d.calories - goal).toLocaleString()}
                      </span>
                    )}
                    <span
                      className={cn(
                        "block w-full max-w-[28px] rounded-t transition-[height,opacity]",
                        !d.logged ? "bg-muted" : over ? "bg-amber-600" : "bg-nourish-600",
                        active && !isActive && "opacity-50"
                      )}
                      style={{ height: `${height}%` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-2 flex justify-between gap-2" aria-hidden>
            {days.map((d) => (
              <div
                key={d.key}
                className={cn(
                  "flex-1 text-center text-xs",
                  d.key === todayKey ? "font-semibold text-foreground" : "text-muted-foreground"
                )}
              >
                {d.key === todayKey ? "Today" : format(d.date, "EEE")}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-nourish-600" aria-hidden /> Up to goal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-600" aria-hidden /> More than 10% over
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0 w-3 border-t-2 border-dashed border-foreground/40" aria-hidden /> Daily goal
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
