// Changing the amount of a food that's already logged.
import { Nutrients as MicroNutrients, scaleNutrients } from "./nutrients";
// Logged foods store their serving as text, e.g. "150 g", "1 plate" or "1.5 × 1 plate".

export interface PortionInfo {
  /** "g" when the serving is in grams, otherwise a multiple of a named portion */
  kind: "grams" | "multiple";
  /** grams, or how many portions (1 for "1 plate") */
  amount: number;
  /** for "multiple": the portion label without the multiplier, e.g. "1 plate" */
  label: string;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function parsePortion(servingSize: string): PortionInfo {
  const s = (servingSize || "").trim();
  const grams = s.match(/^(\d+(?:\.\d+)?)\s*g$/i);
  if (grams) return { kind: "grams", amount: parseFloat(grams[1]), label: "g" };
  const multiple = s.match(/^(\d+(?:\.\d+)?)\s*×\s*(.+)$/);
  if (multiple) return { kind: "multiple", amount: parseFloat(multiple[1]), label: multiple[2].trim() };
  return { kind: "multiple", amount: 1, label: s || "serving" };
}

export function formatPortion(info: PortionInfo, newAmount: number) {
  if (info.kind === "grams") return `${round1(newAmount)} g`;
  return newAmount === 1 ? info.label : `${round1(newAmount)} × ${info.label}`;
}

interface Nutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  nutrients?: MicroNutrients;
}

/** Scale a logged food from its current amount to a new one. */
export function rescaleFood<T extends Nutrients>(food: T, newAmount: number): T {
  const info = parsePortion(food.servingSize);
  const factor = info.amount > 0 ? newAmount / info.amount : 1;
  return {
    ...food,
    calories: Math.round(food.calories * factor),
    protein: round1(food.protein * factor),
    carbs: round1(food.carbs * factor),
    fat: round1(food.fat * factor),
    servingSize: formatPortion(info, newAmount),
    nutrients: scaleNutrients(food.nutrients, factor),
  };
}
