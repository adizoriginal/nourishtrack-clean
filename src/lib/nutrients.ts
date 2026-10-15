// Vitamins, minerals and other nutrients beyond calories and macros.
// Daily amounts are general adult guidelines (WHO / US dietary reference values) and vary by person.

export type NutrientKey = "fiber" | "sugar" | "satFat" | "sodium" | "potassium" | "calcium" | "iron" | "vitC" | "vitD";

export type Nutrients = Partial<Record<NutrientKey, number>>;

export interface NutrientInfo {
  key: NutrientKey;
  label: string;
  unit: "g" | "mg" | "µg";
  /** "goal" = try to reach it, "limit" = try to stay under it */
  kind: "goal" | "limit";
  /** USDA FoodData Central nutrient number */
  usda: string;
}

export const NUTRIENTS: NutrientInfo[] = [
  { key: "fiber", label: "Fibre", unit: "g", kind: "goal", usda: "291" },
  { key: "potassium", label: "Potassium", unit: "mg", kind: "goal", usda: "306" },
  { key: "calcium", label: "Calcium", unit: "mg", kind: "goal", usda: "301" },
  { key: "iron", label: "Iron", unit: "mg", kind: "goal", usda: "303" },
  { key: "vitC", label: "Vitamin C", unit: "mg", kind: "goal", usda: "401" },
  { key: "vitD", label: "Vitamin D", unit: "µg", kind: "goal", usda: "328" },
  { key: "sugar", label: "Sugar", unit: "g", kind: "limit", usda: "269" },
  { key: "satFat", label: "Saturated fat", unit: "g", kind: "limit", usda: "606" },
  { key: "sodium", label: "Sodium (salt)", unit: "mg", kind: "limit", usda: "307" },
];

/** Daily reference amounts for an adult */
export function dailyTargets(sex: string, calorieGoal: number): Record<NutrientKey, number> {
  const female = sex === "female";
  return {
    fiber: Math.round((calorieGoal / 1000) * 14), // 14 g per 1,000 kcal
    potassium: 3500,
    calcium: 1000,
    iron: female ? 18 : 8,
    vitC: female ? 75 : 90,
    vitD: 15,
    sugar: Math.round((calorieGoal * 0.1) / 4), // keep free sugars under ~10% of calories
    satFat: Math.round((calorieGoal * 0.1) / 9), // under 10% of calories
    sodium: 2000,
  };
}

const round = (key: NutrientKey, n: number) => {
  const info = NUTRIENTS.find((x) => x.key === key);
  // grams to 1 decimal, mg and µg to whole numbers (or 1 decimal when small)
  if (info?.unit === "g" || n < 10) return Math.round(n * 10) / 10;
  return Math.round(n);
};

export function scaleNutrients(n: Nutrients | undefined, factor: number): Nutrients | undefined {
  if (!n) return undefined;
  const out: Nutrients = {};
  for (const [k, v] of Object.entries(n) as [NutrientKey, number][]) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = round(k, v * factor);
  }
  return Object.keys(out).length ? out : undefined;
}

export function addNutrients(a: Nutrients, b: Nutrients | undefined): Nutrients {
  if (!b) return a;
  const out: Nutrients = { ...a };
  for (const [k, v] of Object.entries(b) as [NutrientKey, number][]) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

export const hasNutrients = (n: Nutrients | undefined | null) => !!n && Object.keys(n).length > 0;

/** Keep only known keys with valid numbers (for data coming from the database) */
export function cleanNutrients(raw: unknown): Nutrients | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Nutrients = {};
  for (const { key } of NUTRIENTS) {
    const v = Number((raw as Record<string, unknown>)[key]);
    if (Number.isFinite(v) && v >= 0) out[key] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Nutrients from a USDA search result (per 100 g) */
export function usdaNutrients(foodNutrients: { nutrientNumber?: string; value?: number }[] | undefined): Nutrients | undefined {
  if (!foodNutrients) return undefined;
  const out: Nutrients = {};
  for (const info of NUTRIENTS) {
    const n = foodNutrients.find((x) => String(x.nutrientNumber) === info.usda);
    if (n && typeof n.value === "number") out[info.key] = n.value;
  }
  return Object.keys(out).length ? out : undefined;
}
