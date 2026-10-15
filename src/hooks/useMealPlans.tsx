
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  // Recipe details (empty for meals saved before these were stored)
  ingredients?: string[] | null;
  instructions?: string[] | null;
  ready_in_minutes?: number | null;
  servings?: number | null;
  source_url?: string | null;
}

// Lets every list of saved meals on the page refresh when one is added elsewhere
const MEAL_PLANS_CHANGED = "nourishtrack:meal-plans-changed";

const RECIPE_FIELDS = ["ingredients", "instructions", "ready_in_minutes", "servings", "source_url"] as const;

const asStringArray = (v: unknown): string[] | null =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toMealPlan = (row: any): MealPlan => ({
  ...row,
  ingredients: asStringArray(row.ingredients),
  instructions: asStringArray(row.instructions),
});

export const useMealPlans = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadMealPlans = async (quiet = false) => {
    if (!user) return;
    
    if (!quiet) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMealPlans((data || []).map(toMealPlan));
    } catch (error: any) {
      console.error('Error loading meal plans:', error);
      toast({
        variant: "destructive",
        title: "Error loading meal plans",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMealPlan = async (id: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('meal_plans')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state immediately
      setMealPlans(prev => prev.filter(plan => plan.id !== id));
      
      toast({
        title: "Meal plan deleted successfully!",
      });
    } catch (error: any) {
      console.error('Error deleting meal plan:', error);
      toast({
        variant: "destructive",
        title: "Error deleting meal plan",
        description: error.message,
      });
    }
  };

  const addMealPlan = async (mealPlan: Omit<MealPlan, 'id'>) => {
    if (!user) return;
    
    try {
      let { data, error } = await supabase
        .from('meal_plans')
        .insert({
          ...mealPlan,
          user_id: user.id,
        })
        .select()
        .single();

      // If the database hasn't been updated with the recipe columns yet, save without them
      // rather than failing (the recipe just won't be stored for this meal).
      if (error && (error.code === 'PGRST204' || /column/i.test(error.message))) {
        const basic: Record<string, unknown> = { ...mealPlan };
        RECIPE_FIELDS.forEach((f) => delete basic[f]);
        ({ data, error } = await supabase
          .from('meal_plans')
          .insert({ ...(basic as Omit<MealPlan, 'id'>), user_id: user.id })
          .select()
          .single());
      }

      if (error) throw error;

      // Update local state immediately, and tell other lists on the page
      setMealPlans(prev => [toMealPlan(data), ...prev]);
      window.dispatchEvent(new Event(MEAL_PLANS_CHANGED));
      
      return data;
    } catch (error: any) {
      console.error('Error adding meal plan:', error);
      toast({
        variant: "destructive",
        title: "Error adding meal plan",
        description: error.message,
      });
      throw error;
    }
  };

  // Load meal plans when user changes
  useEffect(() => {
    if (user) {
      loadMealPlans();
    } else {
      setMealPlans([]);
    }
  }, [user]);

  useEffect(() => {
    const reload = () => {
      if (user) loadMealPlans(true);
    };
    window.addEventListener(MEAL_PLANS_CHANGED, reload);
    return () => window.removeEventListener(MEAL_PLANS_CHANGED, reload);
  }, [user]);

  return {
    mealPlans,
    isLoading,
    loadMealPlans,
    deleteMealPlan,
    addMealPlan,
  };
};
