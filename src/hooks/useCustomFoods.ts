import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { FoodOption } from "@/lib/foodSearch";
import type { Json } from "@/integrations/supabase/types";

export interface RecipeIngredient {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CustomFood {
  id: string;
  name: string;
  servingLabel: string;
  /** Nutrition for one serving */
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isRecipe: boolean;
  ingredients?: RecipeIngredient[];
  /** How many servings the whole recipe makes */
  servings?: number;
}

export type CustomFoodInput = Omit<CustomFood, "id"> & { id?: string };

// Shared between every component that uses the hook, so a food saved in one place shows up everywhere
let cache: { userId: string; foods: CustomFood[]; local: boolean } | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const localKey = (userId: string) => `nourishtrack:custom-foods:${userId}`;

const readLocal = (userId: string): CustomFood[] => {
  try {
    const raw = localStorage.getItem(localKey(userId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocal = (userId: string, foods: CustomFood[]) => {
  try {
    localStorage.setItem(localKey(userId), JSON.stringify(foods));
  } catch {
    /* storage full or blocked */
  }
};

// The table may not exist yet if the SQL update hasn't been run
const tableMissing = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205" || /custom_foods/i.test(error.message || ""));

type Row = {
  id: string;
  name: string;
  serving_label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  is_recipe: boolean;
  ingredients: Json | null;
  servings: number | null;
};

const fromRow = (row: Row): CustomFood => ({
  id: row.id,
  name: row.name,
  servingLabel: row.serving_label || "1 serving",
  calories: Number(row.calories) || 0,
  protein: Number(row.protein) || 0,
  carbs: Number(row.carbs) || 0,
  fat: Number(row.fat) || 0,
  isRecipe: !!row.is_recipe,
  ingredients: Array.isArray(row.ingredients) ? (row.ingredients as unknown as RecipeIngredient[]) : undefined,
  servings: row.servings ? Number(row.servings) : undefined,
});

const EMPTY: CustomFood[] = [];

const sortFoods = (foods: CustomFood[]) => [...foods].sort((a, b) => a.name.localeCompare(b.name));

async function load(userId: string) {
  const { data, error } = await supabase
    .from("custom_foods")
    .select("id,name,serving_label,calories,protein,carbs,fat,is_recipe,ingredients,servings")
    .eq("user_id", userId)
    .order("name");
  if (error) {
    if (tableMissing(error)) {
      cache = { userId, foods: sortFoods(readLocal(userId)), local: true };
    } else {
      console.error("Couldn't load your foods:", error.message);
      cache = { userId, foods: sortFoods(readLocal(userId)), local: true };
    }
  } else {
    // Move anything saved on this device before the table existed
    const pending = readLocal(userId);
    let foods = (data as Row[]).map(fromRow);
    if (pending.length > 0) {
      const { data: moved, error: moveError } = await supabase
        .from("custom_foods")
        .insert(pending.map((f) => toRow(userId, f)))
        .select("id,name,serving_label,calories,protein,carbs,fat,is_recipe,ingredients,servings");
      if (!moveError) {
        foods = [...foods, ...(moved as Row[]).map(fromRow)];
        try {
          localStorage.removeItem(localKey(userId));
        } catch {
          /* ignore */
        }
      }
    }
    cache = { userId, foods: sortFoods(foods), local: false };
  }
  notify();
}

const round1 = (n: number) => Math.round((Number(n) || 0) * 10) / 10;

function toRow(userId: string, food: CustomFoodInput) {
  return {
    user_id: userId,
    name: food.name.trim().slice(0, 120),
    serving_label: food.servingLabel.trim() || "1 serving",
    calories: round1(food.calories),
    protein: round1(food.protein),
    carbs: round1(food.carbs),
    fat: round1(food.fat),
    is_recipe: food.isRecipe,
    ingredients: (food.ingredients ?? null) as unknown as Json,
    servings: food.servings ?? null,
  };
}

/** The person's own saved foods and recipes */
export function useCustomFoods() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [, force] = useState(0);

  useEffect(() => {
    const listener = () => force((n) => n + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (cache?.userId === userId) return;
    if (!loading) {
      loading = load(userId).finally(() => {
        loading = null;
      });
    }
  }, [userId]);

  const foods = cache && cache.userId === userId ? cache.foods : EMPTY;
  const isLoading = !!userId && (!cache || cache.userId !== userId);

  const saveFood = useCallback(
    async (food: CustomFoodInput): Promise<CustomFood | null> => {
      if (!userId) return null;
      const current = cache && cache.userId === userId ? cache : { userId, foods: [], local: false };

      if (!current.local) {
        const row = toRow(userId, food);
        const query = food.id
          ? supabase.from("custom_foods").update({ ...row, updated_at: new Date().toISOString() }).eq("id", food.id).eq("user_id", userId)
          : supabase.from("custom_foods").insert(row);
        const { data, error } = await query
          .select("id,name,serving_label,calories,protein,carbs,fat,is_recipe,ingredients,servings")
          .single();
        if (!error && data) {
          const saved = fromRow(data as Row);
          cache = {
            ...current,
            foods: sortFoods([...current.foods.filter((f) => f.id !== saved.id), saved]),
          };
          notify();
          return saved;
        }
        if (!tableMissing(error)) throw new Error(error?.message || "Couldn't save");
        current.local = true;
      }

      // Not set up yet: keep it on this device
      const saved: CustomFood = { ...food, id: food.id ?? `local-${Date.now()}` } as CustomFood;
      const foods = sortFoods([...current.foods.filter((f) => f.id !== saved.id), saved]);
      writeLocal(userId, foods);
      cache = { userId, foods, local: true };
      notify();
      return saved;
    },
    [userId]
  );

  const deleteFood = useCallback(
    async (id: string) => {
      if (!userId || !cache || cache.userId !== userId) return;
      if (!cache.local) {
        const { error } = await supabase.from("custom_foods").delete().eq("id", id).eq("user_id", userId);
        if (error && !tableMissing(error)) throw new Error(error.message);
      }
      const foods = cache.foods.filter((f) => f.id !== id);
      if (cache.local) writeLocal(userId, foods);
      cache = { ...cache, foods };
      notify();
    },
    [userId]
  );

  // The same foods in the shape the food picker uses
  const options = useMemo<FoodOption[]>(() => foods.map(customFoodToOption), [foods]);

  return { foods, options, isLoading, saveFood, deleteFood };
}

export function customFoodToOption(food: CustomFood): FoodOption {
  return {
    key: `mine-${food.id}`,
    name: food.name,
    detail: food.isRecipe ? "Your recipe" : "Your food",
    unit: "serving",
    baseAmount: 1,
    defaultAmount: 1,
    servingLabel: food.servingLabel,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    source: "mine",
  };
}
