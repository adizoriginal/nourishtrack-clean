// Works out how many calories someone's body really uses, from what they log and how their weight changes.
// Energy balance: maintenance ≈ average intake − (weight change per day × 7,700 kcal per kg).
import { WeightGoal, minimumCalories } from "./nutritionTargets";

export const KCAL_PER_KG = 7700;
const WINDOW_DAYS = 28;
export const MIN_LOGGED_DAYS = 10;
export const MIN_WEIGH_INS = 3;
export const MIN_WEIGH_SPAN_DAYS = 10;
/** Days under this are probably not fully logged, so they're left out */
const MIN_DAY_KCAL = 800;
/** Never move the target more than this in one step */
const MAX_STEP = 300;
/** Smaller differences aren't worth bothering people about */
export const MIN_DIFFERENCE = 100;

export interface AdaptiveInput {
  /** kcal eaten per date (YYYY-MM-DD) */
  intakeByDate: Record<string, number>;
  weights: { date: string; weight: number }[];
  today: string;
  currentGoal: number;
  weightGoal: WeightGoal;
  sex: string;
  age: number;
}

export type AdaptiveResult =
  | {
      status: "not-enough";
      loggedDays: number;
      weighIns: number;
      weighSpanDays: number;
    }
  | {
      status: "unusual";
      loggedDays: number;
      weighIns: number;
    }
  | {
      status: "ok";
      loggedDays: number;
      weighIns: number;
      avgIntake: number;
      /** kg per week, negative = losing */
      weeklyChangeKg: number;
      maintenance: number;
      suggested: number;
      /** true when suggested differs enough from the current goal to be worth changing */
      shouldUpdate: boolean;
      /** the step was capped at MAX_STEP */
      capped: boolean;
      /** losing faster than about 1% of body weight a week */
      losingFast: boolean;
      /** weight is changing at about the planned rate and intake is close to the target */
      onTrack: boolean;
    };

const dayNumber = (date: string) => Math.round(new Date(date + "T12:00:00Z").getTime() / 86400000);

export function estimateTarget(input: AdaptiveInput): AdaptiveResult {
  const end = dayNumber(input.today); // today isn't finished, so it's left out
  const start = end - WINDOW_DAYS;

  const days = Object.entries(input.intakeByDate).filter(([date, kcal]) => {
    const d = dayNumber(date);
    return d >= start && d < end && kcal >= MIN_DAY_KCAL;
  });
  const weights = input.weights
    .filter((w) => {
      const d = dayNumber(w.date);
      return d >= start - 3 && d <= end && w.weight > 0;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const span = weights.length >= 2 ? dayNumber(weights[weights.length - 1].date) - dayNumber(weights[0].date) : 0;

  if (days.length < MIN_LOGGED_DAYS || weights.length < MIN_WEIGH_INS || span < MIN_WEIGH_SPAN_DAYS) {
    return { status: "not-enough", loggedDays: days.length, weighIns: weights.length, weighSpanDays: span };
  }

  // Weight trend: straight line through the weigh-ins (less jumpy than first vs last)
  const xs = weights.map((w) => dayNumber(w.date));
  const ys = weights.map((w) => w.weight);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let den = 0;
  xs.forEach((x, i) => {
    num += (x - mx) * (ys[i] - my);
    den += (x - mx) ** 2;
  });
  const kgPerDay = den > 0 ? num / den : 0;

  const avgIntake = days.reduce((sum, [, kcal]) => sum + kcal, 0) / days.length;
  const maintenance = avgIntake - kgPerDay * KCAL_PER_KG;

  // Something is off (e.g. lots of unlogged food or a scale error): don't suggest anything
  if (!Number.isFinite(maintenance) || maintenance < 1200 || maintenance > 5000) {
    return { status: "unusual", loggedDays: days.length, weighIns: weights.length };
  }

  let ideal = maintenance;
  if (input.weightGoal === "lose" && input.age >= 18) {
    ideal = Math.max(maintenance - 500, Math.min(minimumCalories(input.sex), maintenance));
  } else if (input.weightGoal === "gain") {
    ideal = maintenance + 300;
  }

  const diff = ideal - input.currentGoal;
  const capped = Math.abs(diff) > MAX_STEP;
  const stepped = input.currentGoal + Math.sign(diff) * Math.min(Math.abs(diff), MAX_STEP);
  const suggested = Math.round(stepped / 10) * 10;
  const currentWeight = ys[ys.length - 1];
  const weeklyChangeKg = kgPerDay * 7;
  const plannedRate = input.weightGoal === "lose" && input.age >= 18 ? -0.5 : input.weightGoal === "gain" ? 0.25 : 0;
  const onTrack = Math.abs(weeklyChangeKg - plannedRate) < 0.2 && Math.abs(avgIntake - input.currentGoal) < 150;
  const losingFast = weeklyChangeKg < -0.01 * currentWeight;

  return {
    status: "ok",
    loggedDays: days.length,
    weighIns: weights.length,
    avgIntake: Math.round(avgIntake),
    weeklyChangeKg: Math.round(weeklyChangeKg * 100) / 100,
    maintenance: Math.round(maintenance / 10) * 10,
    suggested,
    shouldUpdate: (!onTrack || losingFast) && Math.abs(suggested - input.currentGoal) >= MIN_DIFFERENCE,
    capped,
    losingFast,
    onTrack,
  };
}
