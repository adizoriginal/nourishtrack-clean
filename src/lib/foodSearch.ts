// Food search backed by USDA FoodData Central (free, works from the browser).
// Get a free key at https://fdc.nal.usda.gov/api-key-signup and set VITE_USDA_API_KEY.
// Without a key the shared DEMO_KEY is used, which is heavily rate limited.
import { Nutrients, scaleNutrients, usdaNutrients } from "./nutrients";

export interface Portion {
  /** e.g. "1 cup", "1 medium", "1 slice" */
  label: string;
  grams: number;
}

export interface FoodOption {
  key: string;
  name: string;
  detail?: string;
  /** "g" = nutrients are per `baseAmount` grams, "serving" = per 1 serving */
  unit: "g" | "serving";
  baseAmount: number;
  defaultAmount: number;
  servingLabel?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Household measures for gram-based foods (first one is the usual portion) */
  portions?: Portion[];
  /** Vitamins, minerals etc. for the same amount as calories (per baseAmount) */
  nutrients?: Nutrients;
  source?: "usda" | "common" | "mine" | "recent" | "barcode";
}

const USDA_KEY = import.meta.env.VITE_USDA_API_KEY || "DEMO_KEY";
const cache = new Map<string, FoodOption[]>();

interface UsdaNutrient {
  nutrientNumber?: string;
  value?: number;
}

interface UsdaMeasure {
  disseminationText?: string;
  gramWeight?: number;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  dataType?: string;
  brandOwner?: string;
  foodNutrients?: UsdaNutrient[];
  foodMeasures?: UsdaMeasure[];
}

const nutrient = (food: UsdaFood, ...numbers: string[]) => {
  for (const num of numbers) {
    const n = food.foodNutrients?.find((x) => String(x.nutrientNumber) === num);
    if (n && typeof n.value === "number") return n.value;
  }
  return undefined;
};

// "PLANTAINS, GREEN, BOILED" -> "Plantains, green, boiled"
const tidyName = (name: string) =>
  name === name.toUpperCase() ? name.charAt(0) + name.slice(1).toLowerCase() : name;

// Turn USDA household measures into a short, useful list ("Quantity not specified" = a usual serving)
function usdaPortions(food: UsdaFood): Portion[] | undefined {
  const seen = new Set<string>();
  const list: Portion[] = [];
  let usual: Portion | null = null;
  for (const m of food.foodMeasures ?? []) {
    const text = (m.disseminationText ?? "").trim();
    const grams = Number(m.gramWeight);
    if (!text || !(grams > 0)) continue;
    if (/^guideline|cubic inch|surface inch/i.test(text)) continue;
    if (/^quantity not specified$/i.test(text)) {
      usual = { label: "1 serving", grams };
      continue;
    }
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({ label: text, grams });
  }
  if (usual) list.unshift(usual);
  return list.length ? list.slice(0, 10) : undefined;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function searchFoods(query: string, signal?: AbortSignal): Promise<FoodOption[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  if (cache.has(q)) return cache.get(q)!;

  const params = new URLSearchParams({
    api_key: USDA_KEY,
    query: q,
    pageSize: "25",
    dataType: "Survey (FNDDS),SR Legacy,Foundation",
  });

  // The USDA service sometimes rejects a request for no reason; trying again usually works
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`, { signal });
    } catch (err) {
      if ((err as Error).name === "AbortError") throw err;
      res = null;
    }
    if (res && (res.ok || res.status === 429)) break;
    if (attempt < 2) await sleep(500 + attempt * 500);
  }

  if (!res) throw new Error("Couldn't reach the food database. Check your connection and try again.");
  if (res.status === 429) {
    throw new Error("Too many searches right now. Please wait a minute, or use Quick add.");
  }
  if (!res.ok) {
    throw new Error("Food search is unavailable right now. You can still use Quick add.");
  }

  let data: { foods?: UsdaFood[] };
  try {
    data = await res.json();
  } catch {
    throw new Error("Too many searches right now. Please wait a minute, or use Quick add.");
  }

  const results: FoodOption[] = [];
  for (const food of data.foods ?? []) {
    const calories = nutrient(food, "208", "957", "958");
    if (calories === undefined) continue;
    const portions = usdaPortions(food);
    results.push({
      key: `usda-${food.fdcId}`,
      name: tidyName(food.description),
      detail: food.brandOwner || undefined,
      unit: "g",
      baseAmount: 100,
      defaultAmount: 100,
      calories,
      protein: nutrient(food, "203") ?? 0,
      carbs: nutrient(food, "205") ?? 0,
      fat: nutrient(food, "204") ?? 0,
      portions,
      nutrients: usdaNutrients(food.foodNutrients),
      source: "usda",
    });
  }

  cache.set(q, results);
  return results;
}

/** Scale a food option to the amount the user entered (grams, or servings for serving-based foods). */
export function scaleFood(option: FoodOption, amount: number) {
  const factor = amount / option.baseAmount;
  const round1 = (n: number) => Math.round(n * factor * 10) / 10;
  let servingSize: string;
  if (option.unit === "g") {
    servingSize = `${Math.round(amount * 10) / 10} g`;
  } else {
    const label = option.servingLabel || "serving";
    servingSize = amount === 1 ? label : `${Math.round(amount * 100) / 100} × ${label}`;
  }
  return {
    calories: Math.round(option.calories * factor),
    protein: round1(option.protein),
    carbs: round1(option.carbs),
    fat: round1(option.fat),
    servingSize,
    nutrients: scaleNutrients(option.nutrients, factor),
  };
}

// ---- Amounts: "2 × 1 cup", "150 g", "1.5 servings" ----

/** "g" = grams, "serving" = servings of a serving-based food, otherwise the index of a portion */
export type AmountUnit = "g" | "serving" | number;

export interface Amount {
  quantity: number;
  unit: AmountUnit;
}

export interface UnitChoice {
  value: string;
  label: string;
}

const fmt = (n: number) => String(Math.round(n * 10) / 10);

/** The units someone can pick for a food, e.g. "1 cup (158 g)", "grams" */
export function unitChoices(option: FoodOption): UnitChoice[] {
  if (option.unit === "serving") {
    return [{ value: "serving", label: option.servingLabel || "serving" }];
  }
  const list: UnitChoice[] = (option.portions ?? []).map((p, i) => ({
    value: String(i),
    label: `${p.label} (${fmt(p.grams)} g)`,
  }));
  list.push({ value: "g", label: "grams" });
  return list;
}

export const unitToValue = (unit: AmountUnit) => String(unit);
export const valueToUnit = (value: string): AmountUnit =>
  value === "g" || value === "serving" ? value : Number(value);

/** The amount a food starts with when it's picked */
export function defaultAmount(option: FoodOption): Amount {
  if (option.unit === "serving") return { quantity: option.defaultAmount || 1, unit: "serving" };
  if (option.portions?.length) return { quantity: 1, unit: 0 };
  return { quantity: option.defaultAmount || 100, unit: "g" };
}

/** Grams for an amount (only meaningful for gram-based foods) */
export function amountGrams(option: FoodOption, amount: Amount): number {
  if (amount.unit === "g") return amount.quantity;
  if (typeof amount.unit === "number") {
    const p = option.portions?.[amount.unit];
    return p ? p.grams * amount.quantity : amount.quantity;
  }
  return amount.quantity;
}

/** Nutrition and a readable serving text for a chosen amount */
export function applyAmount(option: FoodOption, amount: Amount) {
  if (option.unit === "serving" || amount.unit === "serving") {
    return scaleFood(option, amount.quantity);
  }
  const grams = amountGrams(option, amount);
  const scaled = scaleFood(option, grams);
  if (typeof amount.unit === "number") {
    const p = option.portions?.[amount.unit];
    if (p) {
      // Stored as "N × label" so the amount can be changed later
      const label = `${p.label} (${fmt(p.grams)} g)`;
      const q = Math.round(amount.quantity * 100) / 100;
      scaled.servingSize = q === 1 ? label : `${q} × ${label}`;
    }
  }
  return scaled;
}
