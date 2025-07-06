
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, RefreshCw, ChefHat, Clock, Users, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMealPlans } from "@/hooks/useMealPlans";
import { useAppContext } from "@/contexts/AppContext";

interface GeneratedMeal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_type: string;
  ingredients: string[];
  instructions: string[];
  readyInMinutes: number;
  servings: number;
  sourceUrl?: string;
  nutritionTargets?: {
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
  };
}

export const UnlimitedMealRecommendations = () => {
  const [selectedMealType, setSelectedMealType] = useState<string>("");
  const [generatedMeals, setGeneratedMeals] = useState<GeneratedMeal[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedMeals, setSavedMeals] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();
  const { addMealPlan } = useMealPlans();
  const { addFood, currentDate, profile } = useAppContext();

  const generateMeals = async () => {
    if (!selectedMealType) {
      toast({
        variant: "destructive",
        title: "Please select a meal type",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign in to generate personalized meals",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-meals', {
        body: { 
          mealType: selectedMealType,
          count: 3,
          userId: user.id // Pass user ID for personalization
        }
      });

      if (error) throw error;

      setGeneratedMeals(data.meals || []);
      setSavedMeals(new Set());
      
      toast({
        title: "Personalized meals generated!",
        description: `Generated ${data.meals?.length || 0} ${selectedMealType} recommendations based on your nutrition goals`,
      });
    } catch (error: any) {
      console.error('Error generating meals:', error);
      toast({
        variant: "destructive",
        title: "Error generating meals",
        description: error.message || "Failed to generate meal recommendations",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveMealPlan = async (meal: GeneratedMeal, index: number) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign in to save meals",
      });
      return;
    }

    try {
      await addMealPlan({
        name: meal.name,
        description: `${meal.ingredients?.length || 0} ingredients • ${meal.readyInMinutes || 30} min prep`,
        meal_type: meal.meal_type,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
      });

      setSavedMeals(prev => new Set([...prev, index]));
      
      toast({
        title: "Meal plan saved!",
        description: `${meal.name} has been added to your saved meal plans`,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const saveToFoodDiary = async (meal: GeneratedMeal) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please sign in to save to food diary",
      });
      return;
    }

    try {
      const foodItem = {
        id: `meal-${Date.now()}`,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fats,
        servingSize: "1 serving"
      };

      await addFood(meal.meal_type, foodItem, currentDate);
      
      toast({
        title: "Added to Food Diary!",
        description: `${meal.name} has been added to your ${meal.meal_type} for today.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding to food diary",
        description: error.message,
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          AI Personalized Meal Recommendations
        </CardTitle>
        <CardDescription>
          Meals tailored to your nutrition goals: {profile.calorieGoal} cal/day, {profile.proteinGoal}g protein, weight goal: {profile.weightGoal}
          {profile.dietaryPreferences && profile.dietaryPreferences.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">Dietary preferences: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {profile.dietaryPreferences.map((pref) => (
                  <Badge key={pref} variant="secondary" className="text-xs">
                    {pref.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Select value={selectedMealType} onValueChange={setSelectedMealType}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select meal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="breakfast">Breakfast</SelectItem>
              <SelectItem value="lunch">Lunch</SelectItem>
              <SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="snacks">Snacks</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={generateMeals} 
            disabled={isGenerating || !selectedMealType}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Target className="h-4 w-4" />
                Generate Personalized
              </>
            )}
          </Button>
        </div>

        {generatedMeals.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg capitalize flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Personalized {selectedMealType} Recommendations
            </h3>
            <div className="grid gap-6">
              {generatedMeals.map((meal, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-xl mb-2">{meal.name}</h4>
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="secondary" className="capitalize">
                              {meal.meal_type}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {meal.readyInMinutes || 30} min
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {meal.servings || 2} servings
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700">
                              <Target className="h-3 w-3" />
                              Personalized
                            </Badge>
                            {profile.dietaryPreferences && profile.dietaryPreferences.length > 0 && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                Diet-Friendly
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={savedMeals.has(index) ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => saveMealPlan(meal, index)}
                            disabled={savedMeals.has(index)}
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {savedMeals.has(index) ? "Saved" : "Save Plan"}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => saveToFoodDiary(meal)}
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            Add to Diary
                          </Button>
                        </div>
                      </div>

                      {/* Nutrition Info with Target Comparison */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Calories</p>
                          <p className="text-lg font-bold">{meal.calories}</p>
                          {meal.nutritionTargets && (
                            <p className="text-xs text-muted-foreground">Target: {meal.nutritionTargets.targetCalories}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Protein</p>
                          <p className="text-lg font-bold">{meal.protein}g</p>
                          {meal.nutritionTargets && (
                            <p className="text-xs text-muted-foreground">Target: {meal.nutritionTargets.targetProtein}g</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Carbs</p>
                          <p className="text-lg font-bold">{meal.carbs}g</p>
                          {meal.nutritionTargets && (
                            <p className="text-xs text-muted-foreground">Target: {meal.nutritionTargets.targetCarbs}g</p>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Fat</p>
                          <p className="text-lg font-bold">{meal.fats}g</p>
                          {meal.nutritionTargets && (
                            <p className="text-xs text-muted-foreground">Target: {meal.nutritionTargets.targetFat}g</p>
                          )}
                        </div>
                      </div>

                      {/* Ingredients */}
                      {meal.ingredients && meal.ingredients.length > 0 && (
                        <div>
                          <h5 className="text-lg font-semibold mb-3 flex items-center">
                            <ChefHat className="h-5 w-5 mr-2" />
                            Ingredients
                          </h5>
                          <ul className="space-y-2">
                            {meal.ingredients.map((ingredient: string, ingredientIndex: number) => (
                              <li key={ingredientIndex} className="flex items-start">
                                <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-sm">{ingredient}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Instructions */}
                      {meal.instructions && meal.instructions.length > 0 && (
                        <div>
                          <h5 className="text-lg font-semibold mb-3">Cooking Instructions</h5>
                          <ol className="space-y-3">
                            {meal.instructions.map((instruction: string, instructionIndex: number) => (
                              <li key={instructionIndex} className="flex items-start">
                                <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
                                  {instructionIndex + 1}
                                </span>
                                <span className="text-sm">{instruction}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {generatedMeals.length === 0 && !isGenerating && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a meal type and click generate to get meals tailored to your nutrition goals</p>
            <p className="text-sm mt-2">
              Based on your profile: {profile.calorieGoal} cal/day goal, aiming to {profile.weightGoal}
              {profile.dietaryPreferences && profile.dietaryPreferences.length > 0 && (
                <span> • Following {profile.dietaryPreferences.length} dietary preference(s)</span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
