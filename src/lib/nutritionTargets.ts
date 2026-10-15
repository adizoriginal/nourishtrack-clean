// Daily calorie and macro targets.
// Calories: Mifflin-St Jeor resting energy x activity multiplier, adjusted for the goal.
// Macros: protein by body weight, ~27% of calories from fat, carbs fill the rest.

export type Sex = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "extreme";
export type WeightGoal = "lose" | "maintain" | "gain";

export interface TargetInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  weightGoal: WeightGoal;
}

export interface Targets {
  bmr: number;
  maintenanceCalories: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  /** true when the goal adjustment was limited for safety (minimum intake or under-18) */
  adjusted: boolean;
}

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; description: string; multiplier: number }[] = [
  { value: "sedentary", label: "Mostly sitting", description: "Desk job, little or no exercise", multiplier: 1.2 },
  { value: "light", label: "Lightly active", description: "Walking or light exercise 1–3 days a week", multiplier: 1.375 },
  { value: "moderate", label: "Moderately active", description: "Exercise 3–5 days a week", multiplier: 1.55 },
  { value: "active", label: "Very active", description: "Hard exercise 6–7 days a week", multiplier: 1.725 },
  { value: "extreme", label: "Extremely active", description: "Physical job plus daily training", multiplier: 1.9 },
];

export const WEIGHT_GOALS: { value: WeightGoal; label: string; description: string }[] = [
  { value: "lose", label: "Lose weight", description: "About 0.5 kg per week" },
  { value: "maintain", label: "Maintain weight", description: "Stay where you are, eat well" },
  { value: "gain", label: "Gain weight", description: "Build up slowly, about 0.25 kg per week" },
];

const round = (n: number, to = 1) => Math.round(n / to) * to;

export function calculateTargets(input: TargetInput): Targets {
  const { sex, age, heightCm, weightKg, activityLevel, weightGoal } = input;

  const sexOffset = sex === "male" ? 5 : sex === "female" ? -161 : -78; // "other" uses the midpoint
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexOffset;

  const multiplier = ACTIVITY_LEVELS.find((a) => a.value === activityLevel)?.multiplier ?? 1.55;
  const maintenance = bmr * multiplier;

  let adjusted = false;
  let calories = maintenance;
  if (weightGoal === "lose") {
    if (age < 18) {
      // No calorie deficit for under-18s; they're still growing.
      adjusted = true;
    } else {
      calories = maintenance - 500;
      const minimum = sex === "male" ? 1500 : 1200;
      if (calories < minimum) {
        calories = Math.min(minimum, maintenance);
        adjusted = true;
      }
    }
  } else if (weightGoal === "gain") {
    calories = maintenance + 300;
  }

  const calorieGoal = round(calories, 10);
  const { proteinGoal, carbsGoal, fatGoal } = macroTargets(calorieGoal, weightKg, weightGoal);

  return {
    bmr: round(bmr),
    maintenanceCalories: round(maintenance, 10),
    calorieGoal,
    proteinGoal,
    carbsGoal,
    fatGoal,
    adjusted,
  };
}

/** Protein by body weight, ~27% of calories from fat, carbs fill the rest */
export function macroTargets(calorieGoal: number, weightKg: number, weightGoal: WeightGoal) {
  const proteinPerKg = weightGoal === "maintain" ? 1.6 : 1.8;
  // Cap protein at 35% of calories so heavier users don't get extreme targets.
  const proteinGoal = round(Math.min(weightKg * proteinPerKg, (calorieGoal * 0.35) / 4));
  const fatGoal = round((calorieGoal * 0.27) / 9);
  const carbsGoal = round(Math.max(0, (calorieGoal - proteinGoal * 4 - fatGoal * 9) / 4));
  return { proteinGoal, carbsGoal, fatGoal };
}

/** The lowest daily target we'll suggest when losing weight */
export const minimumCalories = (sex: string) => (sex === "male" ? 1500 : 1200);

export const LIMITS = {
  age: { min: 13, max: 100 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 300 },
};
