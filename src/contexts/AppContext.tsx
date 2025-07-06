import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  date?: string;
}

interface WeightRecord {
  date: string;
  weight: number;
}

interface UserProfile {
  name: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  activityLevel: string;
  weightGoal: string;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  dietaryPreferences: string[];
}

interface DailyMeals {
  [date: string]: {
    breakfast: Food[];
    lunch: Food[];
    dinner: Food[];
    snacks: Food[];
  };
}

interface AppContextType {
  meals: {
    breakfast: Food[];
    lunch: Food[];
    dinner: Food[];
    snacks: Food[];
  };
  allMeals: DailyMeals;
  currentDate: string;
  weightHistory: WeightRecord[];
  profile: UserProfile;
  isLoading: boolean;
  addFood: (mealType: string, food: Food, date?: string) => Promise<void>;
  removeFood: (mealType: string, foodId: string, date?: string) => Promise<void>;
  addWeightRecord: (weight: number) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  setCurrentDate: (date: string) => void;
  getMealsForDate: (date: string) => {
    breakfast: Food[];
    lunch: Food[];
    dinner: Food[];
    snacks: Food[];
  };
  getNutritionSummary: (date?: string) => {
    caloriesConsumed: number;
    proteinConsumed: number;
    carbsConsumed: number;
    fatConsumed: number;
  };
  loadUserData: () => Promise<void>;
  refreshMealPlans: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  name: "User",
  age: 30,
  gender: "male",
  height: 175,
  weight: 70,
  activityLevel: "moderate",
  weightGoal: "maintain",
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 200,
  fatGoal: 65,
  dietaryPreferences: [],
};

const getTodayString = () => new Date().toISOString().split('T')[0];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentDate, setCurrentDateState] = useState<string>(getTodayString());
  const [allMeals, setAllMeals] = useState<DailyMeals>({});
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isLoading, setIsLoading] = useState(false);

  const meals = allMeals[currentDate] || {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  };

  const setCurrentDate = (date: string) => {
    console.log('Setting current date to:', date);
    setCurrentDateState(date);
  };

  const getMealsForDate = (date: string) => {
    console.log('Getting meals for date:', date);
    console.log('All meals available:', Object.keys(allMeals));
    
    const mealsForDate = allMeals[date] || {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    
    console.log('Returning meals for date:', date, mealsForDate);
    return mealsForDate;
  };

  const loadUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile({
          name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'User',
          age: data.age || 30,
          gender: data.gender || 'male',
          height: data.height || 175,
          weight: data.weight || 70,
          activityLevel: data.activity_level || 'moderate',
          weightGoal: data.weight_goal || 'maintain',
          calorieGoal: data.calorie_goal || 2000,
          proteinGoal: data.protein_goal || 150,
          carbsGoal: data.carbs_goal || 200,
          fatGoal: data.fat_goal || 65,
          dietaryPreferences: data.dietary_preferences ? JSON.parse(data.dietary_preferences) : [],
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadFoodEntries = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading food entries:', error);
        return;
      }

      const mealsByDate: DailyMeals = {};
      
      data?.forEach((entry) => {
        const date = entry.entry_date;
        console.log('Processing food entry for date:', date, 'food:', entry.name);
        
        if (!mealsByDate[date]) {
          mealsByDate[date] = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: [],
          };
        }
        
        const food: Food = {
          id: entry.id,
          name: entry.name,
          calories: entry.calories,
          protein: entry.protein,
          carbs: entry.carbs,
          fat: entry.fat,
          servingSize: entry.serving_size,
          date: entry.entry_date,
        };
        
        const mealType = entry.meal_type as keyof typeof mealsByDate[typeof date];
        mealsByDate[date][mealType].push(food);
      });
      
      console.log('Final loaded meals by date:', mealsByDate);
      setAllMeals(mealsByDate);
    } catch (error) {
      console.error('Error loading food entries:', error);
    }
  };

  const loadWeightEntries = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: true });

      if (error) {
        console.error('Error loading weight entries:', error);
        return;
      }

      const weightRecords: WeightRecord[] = data?.map((entry) => ({
        date: entry.entry_date,
        weight: entry.weight,
      })) || [];
      
      setWeightHistory(weightRecords);
    } catch (error) {
      console.error('Error loading weight entries:', error);
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await Promise.all([
        loadUserProfile(),
        loadFoodEntries(),
        loadWeightEntries(),
      ]);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addFood = async (mealType: string, food: Food, date?: string) => {
    if (!user) return;
    
    const targetDate = date || currentDate;
    const foodWithDate = { ...food, date: targetDate };
    
    try {
      const { data, error } = await supabase
        .from('food_entries')
        .insert({
          user_id: user.id,
          food_id: food.id,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          serving_size: food.servingSize,
          meal_type: mealType,
          entry_date: targetDate,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Successfully added food to database:', data);
      console.log('Adding food to date:', targetDate, 'meal:', mealType, 'food:', food.name);

      // Create new food object with database ID
      const newFood = {
        ...foodWithDate,
        id: data.id,
      };

      // Update local state immediately with the correct ID
      setAllMeals(prevMeals => {
        const updatedMeals = {
          ...prevMeals,
          [targetDate]: {
            ...prevMeals[targetDate] || { breakfast: [], lunch: [], dinner: [], snacks: [] },
            [mealType]: [...(prevMeals[targetDate]?.[mealType as keyof typeof prevMeals[typeof targetDate]] || []), newFood]
          }
        };
        console.log('Updated all meals after add:', updatedMeals);
        return updatedMeals;
      });

      toast({
        title: "Food added successfully!",
        description: `${food.name} added to ${mealType} for ${targetDate}`,
      });
    } catch (error: any) {
      console.error('Error adding food:', error);
      toast({
        variant: "destructive",
        title: "Error adding food",
        description: error.message,
      });
    }
  };

  const removeFood = async (mealType: string, foodId: string, date?: string) => {
    if (!user) return;
    
    const targetDate = date || currentDate;
    
    try {
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', foodId)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('Successfully removed food from database. Food ID:', foodId);
      console.log('Removing food from date:', targetDate, 'meal:', mealType);

      // Update local state immediately
      setAllMeals(prevMeals => {
        const updatedMeals = {
          ...prevMeals,
          [targetDate]: {
            ...prevMeals[targetDate] || { breakfast: [], lunch: [], dinner: [], snacks: [] },
            [mealType]: (prevMeals[targetDate]?.[mealType as keyof typeof prevMeals[typeof targetDate]] || []).filter(food => food.id !== foodId)
          }
        };
        console.log('Updated all meals after removal:', updatedMeals);
        return updatedMeals;
      });

      toast({
        title: "Food removed successfully!",
      });
    } catch (error: any) {
      console.error('Error removing food:', error);
      toast({
        variant: "destructive",
        title: "Error removing food",
        description: error.message,
      });
    }
  };

  const addWeightRecord = async (weight: number) => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // First, check if an entry already exists for today
      const { data: existingEntry, error: checkError } = await supabase
        .from('weight_entries')
        .select('id, weight')
        .eq('user_id', user.id)
        .eq('entry_date', today)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let result;
      if (existingEntry) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('weight_entries')
          .update({ weight: weight })
          .eq('id', existingEntry.id);
        
        if (updateError) throw updateError;
        result = 'updated';
      } else {
        // Insert new entry
        const { error: insertError } = await supabase
          .from('weight_entries')
          .insert({
            user_id: user.id,
            weight: weight,
            entry_date: today,
          });

        if (insertError) throw insertError;
        result = 'created';
      }

      // Update local state
      const existingEntryIndex = weightHistory.findIndex(entry => entry.date === today);
      
      if (existingEntryIndex !== -1) {
        const updatedHistory = [...weightHistory];
        updatedHistory[existingEntryIndex] = { date: today, weight };
        setWeightHistory(updatedHistory);
      } else {
        setWeightHistory([...weightHistory, { date: today, weight }].sort((a, b) => a.date.localeCompare(b.date)));
      }
      
      toast({
        title: `Weight ${result === 'updated' ? 'updated' : 'logged'} successfully!`,
        description: `Your weight of ${weight} kg has been ${result === 'updated' ? 'updated' : 'recorded'} for today.`,
      });
    } catch (error: any) {
      console.error('Error adding/updating weight record:', error);
      toast({
        variant: "destructive",
        title: "Error logging weight",
        description: error.message || "An error occurred while logging your weight.",
      });
    }
  };

  const updateProfile = async (newProfileData: Partial<UserProfile>) => {
    if (!user) return;
    
    const updatedProfile = { ...profile, ...newProfileData };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: updatedProfile.name.split(' ')[0] || updatedProfile.name,
          last_name: updatedProfile.name.split(' ').slice(1).join(' ') || '',
          age: updatedProfile.age,
          gender: updatedProfile.gender,
          height: updatedProfile.height,
          weight: updatedProfile.weight,
          activity_level: updatedProfile.activityLevel,
          weight_goal: updatedProfile.weightGoal,
          calorie_goal: updatedProfile.calorieGoal,
          protein_goal: updatedProfile.proteinGoal,
          carbs_goal: updatedProfile.carbsGoal,
          fat_goal: updatedProfile.fatGoal,
          dietary_preferences: JSON.stringify(updatedProfile.dietaryPreferences || []),
        });

      if (error) throw error;

      setProfile(updatedProfile);
      
      toast({
        title: "Profile updated successfully!",
        description: "Your profile settings have been saved.",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
      throw error;
    }
  };

  const refreshMealPlans = async () => {
    // This function will be used by MealPlanList to refresh after deletion
    // Implementation will be handled by the MealPlanList component
  };

  const getNutritionSummary = (date?: string) => {
    const targetDate = date || currentDate;
    const targetMeals = getMealsForDate(targetDate);
    
    const allFoods = [
      ...targetMeals.breakfast,
      ...targetMeals.lunch,
      ...targetMeals.dinner,
      ...targetMeals.snacks
    ];
    
    return {
      caloriesConsumed: allFoods.reduce((sum, food) => sum + food.calories, 0),
      proteinConsumed: allFoods.reduce((sum, food) => sum + food.protein, 0),
      carbsConsumed: allFoods.reduce((sum, food) => sum + food.carbs, 0),
      fatConsumed: allFoods.reduce((sum, food) => sum + food.fat, 0),
    };
  };

  // Load user data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Reset state when user logs out
      setAllMeals({});
      setProfile(defaultProfile);
      setWeightHistory([]);
    }
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        meals,
        allMeals,
        currentDate,
        weightHistory,
        profile,
        isLoading,
        addFood,
        removeFood,
        addWeightRecord,
        updateProfile,
        setCurrentDate,
        getMealsForDate,
        getNutritionSummary,
        loadUserData,
        refreshMealPlans,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
