// Look up a packaged food by its barcode in Open Food Facts (free, worldwide product database).
import type { FoodOption } from "./foodSearch";

interface OffNutriments {
  "energy-kcal_100g"?: number;
  energy_100g?: number; // kJ
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
}

interface OffProduct {
  product_name?: string;
  product_name_en?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: OffNutriments;
}

export class BarcodeLookupError extends Error {}

export const cleanBarcode = (raw: string) => raw.replace(/\D/g, "");

export async function lookupBarcode(rawCode: string): Promise<FoodOption> {
  const code = cleanBarcode(rawCode);
  if (code.length < 8 || code.length > 14) {
    throw new BarcodeLookupError("That doesn't look like a product barcode. They're usually 8 or 13 digits.");
  }

  let res: Response;
  try {
    res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_en,brands,serving_size,serving_quantity,nutriments`
    );
  } catch {
    throw new BarcodeLookupError("Couldn't reach the product database. Check your connection and try again.");
  }
  if (res.status === 404) throw new BarcodeLookupError("We couldn't find this product. You can add it with Quick add.");
  if (!res.ok) throw new BarcodeLookupError("The product database isn't responding right now. Try again in a moment.");

  const data: { status?: number; product?: OffProduct } = await res.json();
  const p = data.product;
  if (data.status !== 1 || !p) {
    throw new BarcodeLookupError("We couldn't find this product. You can add it with Quick add.");
  }

  const n = p.nutriments ?? {};
  const kcal = n["energy-kcal_100g"] ?? (n.energy_100g !== undefined ? n.energy_100g / 4.184 : undefined);
  if (kcal === undefined) {
    throw new BarcodeLookupError("This product has no calorie information yet. You can add it with Quick add.");
  }

  const servingGrams = Number(p.serving_quantity);
  const hasServing = Number.isFinite(servingGrams) && servingGrams > 0 && servingGrams < 2000;
  const name = (p.product_name || p.product_name_en || "Scanned product").trim();
  const brand = p.brands?.split(",")[0]?.trim();

  return {
    key: `off-${code}`,
    name: brand && !name.toLowerCase().includes(brand.split(/\s+/)[0].toLowerCase()) ? `${name} (${brand})` : name,
    detail: hasServing && p.serving_size ? `1 serving = ${p.serving_size}` : undefined,
    unit: "g",
    baseAmount: 100,
    defaultAmount: hasServing ? Math.round(servingGrams) : 100,
    calories: kcal,
    protein: n.proteins_100g ?? 0,
    carbs: n.carbohydrates_100g ?? 0,
    fat: n.fat_100g ?? 0,
    portions: hasServing
      ? [{ label: p.serving_size ? `1 serving (${p.serving_size})` : "1 serving", grams: Math.round(servingGrams * 10) / 10 }]
      : undefined,
    source: "barcode",
  };
}
