// Finds the best food for a typed name and works out the amount from what was typed.
import { COMMON_FOODS } from "./commonFoods";
import { Amount, FoodOption, searchFoods } from "./foodSearch";
import { ParsedMealItem, foodWords, singular } from "./mealText";

// Words that usually mean a very different product from what someone typed
const UNLIKELY = /\b(baby ?food|babyfood|infant|toddler|formula|frozen meal|dry mix|powder, ns|meatless|imitation)\b/i;

/** How well a candidate name matches the typed words (0 = no match, higher is better) */
export function matchScore(queryWords: string[], candidate: string): number {
  if (queryWords.length === 0) return 0;
  const cand = foodWords(candidate);
  if (cand.length === 0) return 0;
  const set = new Set(cand);
  const matched = queryWords.filter((w) => set.has(w)).length;
  if (matched === 0) return 0;
  if (matched < queryWords.length) return (matched / queryWords.length) * 40;
  let score = 100;
  score -= Math.max(0, cand.length - queryWords.length) * 4; // extra words = less exact
  if (cand[0] === queryWords[0]) score += 8; // "Egg, boiled" for "egg"
  if (cand.join(" ") === queryWords.join(" ")) score += 20; // exact
  return score;
}

function bestScore(queryWords: string[], option: FoodOption & { aliases?: string[] }) {
  let best = matchScore(queryWords, option.name);
  for (const alias of option.aliases ?? []) {
    // Aliases are names people actually type, so an exact alias match beats everything
    let s = matchScore(queryWords, alias);
    const aw = foodWords(alias);
    // "egg" shouldn't pull up "egg noodles": the last word of a name is what the food is
    if (aw.length > queryWords.length && !queryWords.includes(aw[aw.length - 1])) s *= 0.3;
    best = Math.max(best, s >= 100 && aw.length === queryWords.length ? s + 30 : s);
  }
  return best;
}

/** Instant matches from the person's own foods and the built-in list */
export function localMatches(query: string, mine: FoodOption[] = [], limit = 8): FoodOption[] {
  const words = foodWords(query);
  if (words.length === 0) return [];
  const scored: { option: FoodOption; score: number }[] = [];
  for (const option of mine) {
    const s = bestScore(words, option);
    if (s > 0) scored.push({ option, score: s + 15 }); // your own foods first when equally good
  }
  for (const option of COMMON_FOODS) {
    const s = bestScore(words, option);
    if (s > 0) scored.push({ option, score: s });
  }
  return scored
    .filter((x) => x.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.option);
}

function rankUsda(query: string, results: FoodOption[]): FoodOption[] {
  const words = foodWords(query);
  return results
    .map((option, i) => {
      let s = matchScore(words, option.name);
      if (UNLIKELY.test(option.name)) s -= 30;
      if (option.portions?.length) s += 6; // has household measures (cups, slices...)
      s -= i * 0.5; // keep USDA's own order as a tie-breaker
      return { option, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.option);
}

export interface FoodCandidates {
  best: FoodOption | null;
  alternatives: FoodOption[];
  /** false when the best match doesn't contain every word typed, so it's worth checking */
  confident: boolean;
}

/** Best match for a typed food: your foods and the built-in list first, then the USDA database */
export async function findFood(query: string, mine: FoodOption[] = [], signal?: AbortSignal): Promise<FoodCandidates> {
  const local = localMatches(query, mine, 6);
  const words = foodWords(query);
  const strongLocal = local.length > 0 && bestScore(words, local[0] as FoodOption & { aliases?: string[] }) >= 90;
  if (strongLocal) return { best: local[0], alternatives: local, confident: true };

  let usda: FoodOption[] = [];
  try {
    usda = rankUsda(query, await searchFoods(query, signal));
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    // Use what we have locally if the database can't be reached
  }
  const all = [...local, ...usda].slice(0, 12);
  const best = all[0] ?? null;
  const confident = !!best && bestScore(words, best as FoodOption & { aliases?: string[] }) >= 60;
  return { best, alternatives: all, confident };
}

// ---- Amounts ----

const GRAMS_PER: Partial<Record<string, number>> = {
  g: 1,
  kg: 1000,
  oz: 28.35,
  lb: 453.6,
  ml: 1,
  l: 1000,
  floz: 30,
};

// Fallback sizes when a food has no matching household measure (grams)
const FALLBACK_GRAMS: Partial<Record<string, number>> = {
  cup: 240,
  tbsp: 15,
  tsp: 5,
  slice: 30,
  piece: 50,
  bowl: 350,
  plate: 350,
  glass: 240,
  can: 330,
  bottle: 500,
  handful: 30,
  scoop: 30,
};

const UNIT_PATTERNS: Partial<Record<string, RegExp>> = {
  cup: /^1 cup\b(?!.*\bdry\b)/i,
  tbsp: /tablespoon/i,
  tsp: /teaspoon/i,
  slice: /slice/i,
  piece: /\b(piece|item|whole)\b/i,
  bowl: /\bbowl\b/i,
  plate: /\bplate\b/i,
  glass: /\bglass\b/i,
  can: /\bcan\b/i,
  bottle: /\bbottle\b/i,
  scoop: /\bscoop\b/i,
};

const findPortion = (option: FoodOption, test: (label: string) => boolean) =>
  (option.portions ?? []).findIndex((p) => test(p.label));

/** Work out an amount for a matched food from what was typed ("2 eggs", "1 cup", "200g") */
export function amountFor(option: FoodOption, item: ParsedMealItem): Amount {
  const q = item.quantity;

  // Your own foods and recipes are counted in servings
  if (option.unit === "serving") return { quantity: q, unit: "serving" };

  if (item.unit && GRAMS_PER[item.unit]) {
    return { quantity: Math.round(q * GRAMS_PER[item.unit]! * 10) / 10, unit: "g" };
  }

  const portions = option.portions ?? [];

  if (item.unit && item.unit !== "serving") {
    const pattern = UNIT_PATTERNS[item.unit];
    let idx = pattern ? findPortion(option, (l) => pattern.test(l)) : -1;
    if (item.unit === "slice" && idx >= 0) {
      // Prefer a normal slice over thin/thick ones
      const regular = findPortion(option, (l) => /slice/i.test(l) && !/thin|thick|large|small|snack|crust/i.test(l));
      if (regular >= 0) idx = regular;
    }
    if (idx >= 0) return { quantity: q, unit: idx };
    // A bowl or plate is about one and a half / two cups of something
    const cup = findPortion(option, (l) => /^1 cup\b(?!.*\bdry\b)/i.test(l));
    if (cup >= 0 && (item.unit === "bowl" || item.unit === "plate")) {
      return { quantity: q * (item.unit === "bowl" ? 1.5 : 2), unit: cup };
    }
    if (cup >= 0 && item.unit === "glass") return { quantity: q, unit: cup };
    const grams = FALLBACK_GRAMS[item.unit];
    if (grams) return { quantity: Math.round(q * grams), unit: "g" };
  }

  if (portions.length === 0) {
    return { quantity: q * (option.defaultAmount || 100), unit: "g" };
  }

  // "a large banana", "small apple"
  if (item.size) {
    const idx = findPortion(option, (l) => new RegExp(`\\b${item.size}\\b`, "i").test(l));
    if (idx >= 0) return { quantity: q, unit: idx };
  }

  // Something added to something else ("coffee with milk", "toast with butter"): a small amount
  if (item.side && !item.quantityGiven) {
    const small = findPortion(option, (l) => /tablespoon|\bpat\b|fl oz/i.test(l));
    if (small >= 0) return { quantity: 1, unit: small };
  }

  // A count ("10 grapes", "2 eggs"): look for "1 grape", "1 egg"...
  const words = foodWords(item.food).map(singular);
  const named = findPortion(option, (l) => {
    const lw = foodWords(l);
    return /^1\s/.test(l) && words.some((w) => lw.includes(w));
  });
  if (named >= 0 && item.quantityGiven) return { quantity: q, unit: named };

  // The built-in list puts the usual countable portion first
  if (option.source === "common") return { quantity: q, unit: 0 };
  if (named >= 0) return { quantity: q, unit: named };
  const countable = findPortion(option, (l) => /^1 (medium|regular|whole|fruit|item|piece)\b/i.test(l));
  if (countable >= 0 && item.quantityGiven) return { quantity: q, unit: countable };
  return { quantity: q, unit: 0 };
}
