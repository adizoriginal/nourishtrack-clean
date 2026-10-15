// Food search backed by USDA FoodData Central (free, works from the browser).
// Get a free key at https://fdc.nal.usda.gov/api-key-signup and set VITE_USDA_API_KEY.
// Without a key the shared DEMO_KEY is used, which is heavily rate limited.

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
}

const USDA_KEY = import.meta.env.VITE_USDA_API_KEY || "DEMO_KEY";
const cache = new Map<string, FoodOption[]>();

interface UsdaNutrient {
  nutrientNumber?: string;
  value?: number;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  dataType?: string;
  brandOwner?: string;
  foodNutrients?: UsdaNutrient[];
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

  let res: Response;
  try {
    res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?${params}`, { signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new Error("Couldn't reach the food database. Check your connection and try again.");
  }

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
    });
  }

  cache.set(q, results);
  return results;
}

/** Scale a food option to the amount the user entered. */
export function scaleFood(option: FoodOption, amount: number) {
  const factor = amount / option.baseAmount;
  const round1 = (n: number) => Math.round(n * factor * 10) / 10;
  let servingSize: string;
  if (option.unit === "g") {
    servingSize = `${amount} g`;
  } else {
    const label = option.servingLabel || "serving";
    servingSize = amount === 1 ? label : `${amount} × ${label}`;
  }
  return {
    calories: Math.round(option.calories * factor),
    protein: round1(option.protein),
    carbs: round1(option.carbs),
    fat: round1(option.fat),
    servingSize,
  };
}
