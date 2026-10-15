// Turns a typed meal like "2 eggs, toast with butter and a cup of coffee"
// into separate items with an amount, a unit and the food name.

export type MealUnit =
  | "g"
  | "kg"
  | "oz"
  | "lb"
  | "ml"
  | "l"
  | "floz"
  | "cup"
  | "tbsp"
  | "tsp"
  | "slice"
  | "piece"
  | "bowl"
  | "plate"
  | "glass"
  | "can"
  | "bottle"
  | "handful"
  | "scoop"
  | "serving";

export type MealSize = "small" | "medium" | "large";

export interface ParsedMealItem {
  /** The text this item came from */
  text: string;
  /** How many (of the unit, or of the food itself when there's no unit) */
  quantity: number;
  /** True when the person typed an amount; false when we assumed 1 */
  quantityGiven: boolean;
  unit: MealUnit | null;
  size: MealSize | null;
  /** The food name with amounts removed, e.g. "eggs" */
  food: string;
  /** Came after "with" (e.g. the milk in "coffee with milk"), so usually a small amount */
  side: boolean;
}

const NUMBER_WORDS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  half: 0.5,
  quarter: 0.25,
  couple: 2,
  few: 3,
  dozen: 12,
};

const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };

const UNIT_WORDS: Record<string, MealUnit> = {
  g: "g",
  gr: "g",
  gram: "g",
  grams: "g",
  gramme: "g",
  grammes: "g",
  kg: "kg",
  kilo: "kg",
  kilos: "kg",
  kilogram: "kg",
  kilograms: "kg",
  oz: "oz",
  ounce: "oz",
  ounces: "oz",
  lb: "lb",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  ml: "ml",
  millilitre: "ml",
  millilitres: "ml",
  milliliter: "ml",
  milliliters: "ml",
  l: "l",
  litre: "l",
  litres: "l",
  liter: "l",
  liters: "l",
  cup: "cup",
  cups: "cup",
  mug: "cup",
  mugs: "cup",
  tbsp: "tbsp",
  tbs: "tbsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  spoon: "tbsp",
  spoons: "tbsp",
  spoonful: "tbsp",
  spoonfuls: "tbsp",
  tsp: "tsp",
  teaspoon: "tsp",
  teaspoons: "tsp",
  slice: "slice",
  slices: "slice",
  piece: "piece",
  pieces: "piece",
  pc: "piece",
  pcs: "piece",
  bowl: "bowl",
  bowls: "bowl",
  plate: "plate",
  plates: "plate",
  plateful: "plate",
  glass: "glass",
  glasses: "glass",
  can: "can",
  cans: "can",
  tin: "can",
  tins: "can",
  bottle: "bottle",
  bottles: "bottle",
  handful: "handful",
  handfuls: "handful",
  scoop: "scoop",
  scoops: "scoop",
  serving: "serving",
  servings: "serving",
  portion: "serving",
  portions: "serving",
  helping: "serving",
  helpings: "serving",
};

const SIZE_WORDS: Record<string, MealSize> = {
  small: "small",
  little: "small",
  medium: "medium",
  regular: "medium",
  large: "large",
  big: "large",
};

// Words that carry no meaning for finding the food
const FILLER = new Set(["of", "some", "the", "my", "x", "about", "around", "approx", "approximately", "roughly"]);

const round = (n: number) => Math.round(n * 100) / 100;

/** Read a number at the start of the words list. Returns [value, wordsUsed]. */
function readNumber(words: string[]): [number, number] | null {
  const w = words[0];
  if (!w) return null;

  // "1/2", "1.5", "2", "½", "1½"
  const simple = w.match(/^(\d+(?:[.,]\d+)?)?([½¼¾⅓⅔])?$/);
  if (simple && (simple[1] || simple[2])) {
    let value = simple[1] ? parseFloat(simple[1].replace(",", ".")) : 0;
    if (simple[2]) value += FRACTIONS[simple[2]];
    // "1 1/2"
    const next = words[1]?.match(/^(\d+)\/(\d+)$/);
    if (next && simple[1] && !simple[2]) return [value + Number(next[1]) / Number(next[2]), 2];
    return [value, 1];
  }
  const frac = w.match(/^(\d+)\/(\d+)$/);
  if (frac && Number(frac[2]) > 0) return [Number(frac[1]) / Number(frac[2]), 1];

  if (w in NUMBER_WORDS) {
    let value = NUMBER_WORDS[w];
    let used = 1;
    // "a half", "a couple", "a few", "a dozen"
    if ((w === "a" || w === "an") && words[1] && ["half", "quarter", "couple", "few", "dozen"].includes(words[1])) {
      value = NUMBER_WORDS[words[1]];
      used = 2;
    }
    // "half a cup" / "half an apple"
    if ((words[used - 1] === "half" || words[used - 1] === "quarter") && (words[used] === "a" || words[used] === "an")) {
      used += 1;
    }
    return [value, used];
  }
  return null;
}

/** Split "200g" into "200 g", "2x" into "2 x", "x2" into "x 2" */
function tokenize(text: string): string[] {
  return text
    .replace(/(\d)\s*(fl\.?\s*oz)\b/gi, "$1 floz ")
    .replace(/\bfl\.?\s*oz\b/gi, "floz")
    .replace(/(\d)([a-z]+)\b/gi, "$1 $2")
    .replace(/\bx(\d)/gi, "x $1")
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function parseMealItem(text: string, side = false): ParsedMealItem | null {
  const words = tokenize(text.toLowerCase().trim());
  if (words.length === 0) return null;

  let quantity = 1;
  let quantityGiven = false;
  let unit: MealUnit | null = null;
  let size: MealSize | null = null;
  const rest: string[] = [];

  const takeUnit = (w: string) => {
    if (w === "floz") return "floz" as MealUnit;
    return UNIT_WORDS[w] ?? null;
  };

  let i = 0;
  // Leading amount: "2", "2 cups of", "a large", "half a"
  const lead = readNumber(words);
  if (lead) {
    quantity = lead[0];
    quantityGiven = !(words[0] === "a" || words[0] === "an") || lead[1] > 1;
    i = lead[1];
    // A "2x" style multiplier
    if (words[i] === "x") i += 1;
  }

  for (; i < words.length; i++) {
    const w = words[i];
    if (!unit && takeUnit(w) && (i === 0 || rest.length === 0)) {
      unit = takeUnit(w);
      continue;
    }
    if (!size && SIZE_WORDS[w] && rest.length === 0) {
      size = SIZE_WORDS[w];
      continue;
    }
    rest.push(w);
  }

  // Trailing amount: "rice 200 g", "eggs x2", "coffee 2 cups"
  const tailUnit = rest.length >= 2 ? takeUnit(rest[rest.length - 1]) : null;
  if (tailUnit && !unit) {
    const num = readNumber([rest[rest.length - 2]]);
    if (num) {
      quantity = num[0];
      quantityGiven = true;
      unit = tailUnit;
      rest.splice(rest.length - 2, 2);
    }
  }
  // Unit at the end of the name: "3 plantain slices", "2 pizza slices"
  if (!unit && rest.length >= 2) {
    const last = takeUnit(rest[rest.length - 1]);
    if (last && ["slice", "piece", "cup", "bowl", "plate", "glass", "can", "bottle", "scoop", "serving"].includes(last)) {
      unit = last;
      rest.pop();
    }
  }

  if (rest.length >= 2 && !quantityGiven) {
    const last = rest[rest.length - 1];
    const prev = rest[rest.length - 2];
    if (prev === "x" && /^\d+(\.\d+)?$/.test(last)) {
      quantity = parseFloat(last);
      quantityGiven = true;
      rest.splice(rest.length - 2, 2);
    } else if (/^\d+(\.\d+)?$/.test(last)) {
      quantity = parseFloat(last);
      quantityGiven = true;
      rest.pop();
    }
  }

  const food = rest
    .filter((w, idx) => !(FILLER.has(w) && (idx === 0 || idx === rest.length - 1)))
    .join(" ")
    .replace(/^of\s+/, "")
    .replace(/[.,;:!?]+$/g, "")
    .trim();
  if (!food || !/[a-z]/i.test(food)) return null;

  return {
    text: text.trim(),
    quantity: round(quantity > 0 ? quantity : 1),
    quantityGiven,
    unit,
    size,
    food,
    side,
  };
}

/**
 * Split a whole meal into items. Separators: commas, new lines, "and", "plus", "&", "+", ";".
 * Things after "with" become their own (side) item: "toast with butter" -> toast + butter.
 */
export function parseMealText(text: string): ParsedMealItem[] {
  const items: ParsedMealItem[] = [];
  const parts = text
    .replace(/\r/g, "")
    .split(/\n|,|;|\+|&|\band\b|\bplus\b|\balso\b/i)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const part of parts) {
    const pieces = part.split(/\bwith\b|\bw\/\s*/i).map((p) => p.trim()).filter(Boolean);
    pieces.forEach((piece, idx) => {
      const item = parseMealItem(piece, idx > 0);
      if (item) items.push(item);
    });
  }
  return items.slice(0, 15);
}

/** Simple English singular for matching: "eggs" -> "egg", "berries" -> "berry", "tomatoes" -> "tomato" */
export function singular(word: string): string {
  if (word.length <= 3) return word;
  if (/ies$/.test(word)) return word.slice(0, -3) + "y";
  if (/(oes|ches|shes|xes|sses)$/.test(word)) return word.slice(0, -2);
  if (/s$/.test(word) && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

export function foodWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w && !FILLER.has(w) && w !== "and" && w !== "or" && w !== "with")
    .map(singular);
}
