import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { NUTRIENTS, Nutrients, addNutrients, dailyTargets, hasNutrients } from "@/lib/nutrients";

interface NutrientsCardProps {
  date: string;
  className?: string;
  /** Start folded up to save space */
  collapsible?: boolean;
}

const fmt = (n: number) => (n >= 100 ? Math.round(n).toLocaleString() : String(Math.round(n * 10) / 10));

/** Fibre, sugar, salt, vitamins and minerals for a day, against general daily guidelines */
export const NutrientsCard = ({ date, className, collapsible }: NutrientsCardProps) => {
  const { getMealsForDate, profile } = useAppContext();
  const [open, setOpen] = useState(!collapsible);
  const meals = getMealsForDate(date);

  const { totals, withData, count } = useMemo(() => {
    const foods = [...meals.breakfast, ...meals.lunch, ...meals.dinner, ...meals.snacks];
    let sum: Nutrients = {};
    let known = 0;
    for (const f of foods) {
      if (hasNutrients(f.nutrients)) {
        sum = addNutrients(sum, f.nutrients);
        known++;
      }
    }
    return { totals: sum, withData: known, count: foods.length };
  }, [meals]);

  const targets = dailyTargets(profile.gender, profile.calorieGoal);
  const goals = NUTRIENTS.filter((n) => n.kind === "goal");
  const limits = NUTRIENTS.filter((n) => n.kind === "limit");

  const row = (key: (typeof NUTRIENTS)[number]) => {
    const value = totals[key.key] ?? 0;
    const target = targets[key.key];
    const pct = target > 0 ? value / target : 0;
    const over = key.kind === "limit" && pct > 1;
    const reached = key.kind === "goal" && pct >= 1;
    return (
      <li key={key.key} className="space-y-1">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="font-medium">{key.label}</span>
          <span className="text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">
              {fmt(value)}
              {key.unit === "g" ? "g" : ` ${key.unit}`}
            </span>{" "}
            / {fmt(target)}
            {key.unit === "g" ? "g" : ` ${key.unit}`}
            {over && <span className="ml-1.5 font-medium text-amber-700 dark:text-amber-400">over</span>}
            {reached && <span className="ml-1.5 font-medium text-nourish-700 dark:text-nourish-400">✓</span>}
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-label={`${key.label}: ${fmt(value)} of ${fmt(target)} ${key.unit}`}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-valuenow={Math.round(value * 10) / 10}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width]",
              key.kind === "goal" ? "bg-primary" : over ? "bg-amber-600" : "bg-slate-400 dark:bg-slate-500"
            )}
            style={{ width: `${Math.min(100, pct * 100)}%` }}
          />
        </div>
      </li>
    );
  };

  return (
    <Card className={cn("nourish-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {collapsible ? (
            <button
              type="button"
              className="flex w-full items-center justify-between text-left"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
            >
              Vitamins & minerals
              {open ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>
          ) : (
            "Vitamins & minerals"
          )}
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent className="space-y-5">
          {withData === 0 ? (
            <p className="text-sm text-muted-foreground">
              {count === 0
                ? "Log some food to see your fibre, vitamins and minerals."
                : "None of the foods logged this day have vitamin and mineral details. Foods added with Search, Describe or Scan include them."}
            </p>
          ) : (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aim for</p>
                <ul className="space-y-3">{goals.map(row)}</ul>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Keep under</p>
                <ul className="space-y-3">{limits.map(row)}</ul>
              </div>
              <p className="flex gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  {withData < count
                    ? `Based on ${withData} of ${count} foods; foods you typed in yourself don't include these details. `
                    : ""}
                  Daily amounts are general adult guidelines and vary by person. Sugar shown is total sugar,
                  including natural sugar in fruit and milk.
                </span>
              </p>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
};
