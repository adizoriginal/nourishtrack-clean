import { useMemo, useState } from "react";
import { Check, Gauge, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { toLocalDateString } from "@/lib/dates";
import { displayWeight, weightUnitLabel } from "@/lib/units";
import { MIN_LOGGED_DAYS, MIN_WEIGH_INS, MIN_WEIGH_SPAN_DAYS, estimateTarget } from "@/lib/adaptiveTarget";
import { WeightGoal, macroTargets } from "@/lib/nutritionTargets";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "nourishtrack:target-checkin-dismissed";
const fmt = (n: number) => Math.round(n).toLocaleString();

const readDismissed = (): { until: number; suggested: number } | null => {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || "null");
  } catch {
    return null;
  }
};

interface AdaptiveTargetCardProps {
  /** "dashboard" only appears when there's a suggestion; "progress" always shows where things stand */
  variant: "dashboard" | "progress";
  className?: string;
}

/** Compares what you eat with how your weight changes, and suggests a better calorie target */
export const AdaptiveTargetCard = ({ variant, className }: AdaptiveTargetCardProps) => {
  const { allMeals, weightHistory, profile, updateProfile } = useAppContext();
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [justUpdated, setJustUpdated] = useState(false);

  const result = useMemo(() => {
    const intakeByDate: Record<string, number> = {};
    for (const [date, day] of Object.entries(allMeals)) {
      intakeByDate[date] = [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].reduce(
        (sum, f) => sum + (Number(f.calories) || 0),
        0
      );
    }
    return estimateTarget({
      intakeByDate,
      weights: weightHistory,
      today: toLocalDateString(),
      currentGoal: profile.calorieGoal,
      weightGoal: (profile.weightGoal as WeightGoal) || "maintain",
      sex: profile.gender,
      age: profile.age,
    });
  }, [allMeals, weightHistory, profile.calorieGoal, profile.weightGoal, profile.gender, profile.age]);

  const units = profile.units;
  const unit = weightUnitLabel(units);

  if (variant === "dashboard") {
    if (result.status !== "ok" || !result.shouldUpdate) return null;
    if (dismissed && dismissed.until > Date.now() && dismissed.suggested === result.suggested) return null;
  }

  const accept = async () => {
    if (result.status !== "ok") return;
    setSaving(true);
    try {
      const latestKg = weightHistory.length ? weightHistory[weightHistory.length - 1].weight : profile.weight;
      const macros = macroTargets(result.suggested, latestKg, (profile.weightGoal as WeightGoal) || "maintain");
      await updateProfile({ calorieGoal: result.suggested, ...macros });
      setJustUpdated(true);
    } finally {
      setSaving(false);
    }
  };

  const notNow = () => {
    if (result.status !== "ok") return;
    const value = { until: Date.now() + 7 * 24 * 60 * 60 * 1000, suggested: result.suggested };
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(value));
    } catch {
      /* ignore */
    }
    setDismissed(value);
  };

  const title = variant === "dashboard" ? "Your calorie target check-in" : "Your real calorie needs";

  let body: React.ReactNode;
  if (result.status === "not-enough") {
    const items = [
      {
        done: result.loggedDays >= MIN_LOGGED_DAYS,
        text: `Log your food on at least ${MIN_LOGGED_DAYS} days (${Math.min(result.loggedDays, MIN_LOGGED_DAYS)} of ${MIN_LOGGED_DAYS} in the last 4 weeks)`,
      },
      {
        done: result.weighIns >= MIN_WEIGH_INS && result.weighSpanDays >= MIN_WEIGH_SPAN_DAYS,
        text: `Weigh in at least ${MIN_WEIGH_INS} times over ${MIN_WEIGH_SPAN_DAYS}+ days (${Math.min(result.weighIns, MIN_WEIGH_INS)} of ${MIN_WEIGH_INS} so far)`,
      },
    ];
    body = (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Formulas only estimate how much your body uses. Once there's enough data, NourishTrack works out your real
          number from what you eat and how your weight changes, then suggests a better target.
        </p>
        <ul className="space-y-2">
          {items.map((i) => (
            <li key={i.text} className="flex items-start gap-2">
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                  i.done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                )}
                aria-hidden
              >
                {i.done && <Check className="h-3 w-3" />}
              </span>
              <span className={i.done ? "text-muted-foreground line-through" : ""}>{i.text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Days with very little logged are left out, since they're probably incomplete.</p>
      </div>
    );
  } else if (result.status === "unusual") {
    body = (
      <p className="text-sm text-muted-foreground">
        Your numbers don't add up yet. This usually happens when some meals aren't logged or the scale jumps around.
        Keep logging every meal and weighing in at the same time of day, and we'll check again.
      </p>
    );
  } else {
    const change = result.weeklyChangeKg;
    const changeText =
      Math.abs(change) < 0.05
        ? "stayed about the same"
        : `went ${change < 0 ? "down" : "up"} about ${displayWeight(Math.abs(change), units).toFixed(1)} ${unit} a week`;
    const goal = profile.weightGoal;
    const aim =
      goal === "lose" && profile.age >= 18
        ? `To lose about ${units === "imperial" ? "1 lb" : "0.5 kg"} a week`
        : goal === "gain"
          ? `To gain about ${units === "imperial" ? "0.5 lb" : "0.25 kg"} a week`
          : "To keep your weight steady";

    body = (
      <div className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/60 p-2">
            <div className="text-lg font-semibold tabular-nums">{fmt(result.avgIntake)}</div>
            <div className="text-xs text-muted-foreground">kcal eaten a day</div>
          </div>
          <div className="rounded-lg bg-muted/60 p-2">
            <div className="text-lg font-semibold tabular-nums">
              {Math.abs(change) < 0.05 ? "±0" : `${change < 0 ? "−" : "+"}${displayWeight(Math.abs(change), units).toFixed(1)}`}
            </div>
            <div className="text-xs text-muted-foreground">{unit} a week</div>
          </div>
          <div className="rounded-lg bg-primary/10 p-2">
            <div className="text-lg font-semibold tabular-nums">{fmt(result.maintenance)}</div>
            <div className="text-xs text-muted-foreground">kcal your body uses</div>
          </div>
        </div>
        <p className="text-muted-foreground">
          Over the last {result.loggedDays} logged days you ate about {fmt(result.avgIntake)} kcal a day and your weight{" "}
          {changeText}. That means your body uses about{" "}
          <span className="font-medium text-foreground">{fmt(result.maintenance)} kcal a day</span>.
        </p>

        {justUpdated ? (
          <p className="flex items-center gap-2 font-medium text-nourish-700 dark:text-nourish-400">
            <Check className="h-4 w-4" /> Target updated to {fmt(profile.calorieGoal)} kcal. We'll keep checking as you log.
          </p>
        ) : result.shouldUpdate ? (
          <>
            {result.losingFast && (
              <p className="rounded-lg bg-amber-50 p-3 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                You're losing weight faster than is usually recommended (more than 1% of your body weight a week). Eating a
                little more helps protect your muscle and energy.
              </p>
            )}
            <p>
              {aim}, we suggest{" "}
              <span className="font-semibold">{fmt(result.suggested)} kcal a day</span>{" "}
              <span className="text-muted-foreground">(now {fmt(profile.calorieGoal)})</span>.
              {result.capped && (
                <span className="text-muted-foreground"> We change it by at most 300 kcal at a time and check again as you keep logging.</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={accept} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update to {fmt(result.suggested)} kcal
              </Button>
              {variant === "dashboard" && (
                <Button variant="ghost" onClick={notNow} disabled={saving}>
                  Not now
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="flex items-center gap-2 font-medium text-nourish-700 dark:text-nourish-400">
            <Check className="h-4 w-4" /> Your target of {fmt(profile.calorieGoal)} kcal looks right. Keep it up!
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          An estimate from your own logs, not medical advice. It's only as accurate as what you log.
        </p>
      </div>
    );
  }

  return (
    <Card className={cn("nourish-card", variant === "dashboard" && "border-primary/40", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
};
