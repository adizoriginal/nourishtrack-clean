
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface MealPlan {
  id: string;
  name: string;
  description: string | null;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const useMealPlans = () => {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadMealPlans = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMealPlans(data || []);
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
      const { data, error } = await supabase
        .from('meal_plans')
        .insert({
          ...mealPlan,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately
      setMealPlans(prev => [data, ...prev]);
      
      toast({
        title: "Meal plan added successfully!",
      });
      
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

  return {
    mealPlans,
    isLoading,
    loadMealPlans,
    deleteMealPlan,
    addMealPlan,
  };
};
