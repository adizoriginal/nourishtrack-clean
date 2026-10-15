
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChefHat, Plus, Info, ExternalLink } from "lucide-react";
import { useAppContext } from "@/contexts/AppContext";

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: {
    id: string;
    name: string;
    description: string;
    meal_type: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    ingredients?: string[];
    instructions?: string[];
    readyInMinutes?: number;
    servings?: number;
    sourceUrl?: string;
    isSaved?: boolean;
  } | null;
}

export const MealDetailModal = ({ isOpen, onClose, meal }: MealDetailModalProps) => {
  const { addFood, currentDate } = useAppContext();

  const handleAddToFoodDiary = async () => {
    if (!meal) return;

    const foodItem = {
      id: `meal-${Date.now()}`,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fats,
      servingSize: "1 serving"
    };

    // addFood shows its own success or error message
    const ok = await addFood(meal.meal_type, foodItem, currentDate);
    if (ok) onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  if (!meal) return null;

  const hasRecipe = (meal.ingredients?.length ?? 0) > 0 || (meal.instructions?.length ?? 0) > 0;
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(meal.name + " recipe")}`;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{meal.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Badge variant="secondary" className="capitalize">{meal.meal_type}</Badge>
              {meal.readyInMinutes ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {meal.readyInMinutes} min
                </Badge>
              ) : null}
              {meal.servings ? (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {meal.servings} servings
                </Badge>
              ) : null}
              {meal.sourceUrl && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a href={meal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs">
                    Original Recipe
                  </a>
                </Badge>
              )}
            </div>

            {meal.servings ? (
              <div className="mb-4 flex gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  This recipe makes {meal.servings} serving{meal.servings > 1 ? "s" : ""}. Nutrition values are per
                  serving.
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm font-medium">Calories</p>
                <p className="text-xl font-bold">{meal.calories}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Protein</p>
                <p className="text-xl font-bold">{meal.protein}g</p>
              </div>
              <div>
                <p className="text-sm font-medium">Carbs</p>
                <p className="text-xl font-bold">{meal.carbs}g</p>
              </div>
              <div>
                <p className="text-sm font-medium">Fats</p>
                <p className="text-xl font-bold">{meal.fats}g</p>
              </div>
            </div>
          </div>

          {meal.ingredients && meal.ingredients.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <ChefHat className="h-5 w-5 mr-2" />
                Ingredients
              </h3>
              <ul className="space-y-2">
                {meal.ingredients.map((ingredient: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-sm">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {meal.instructions && meal.instructions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Instructions</h3>
              <ol className="space-y-3">
                {meal.instructions.map((instruction: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-sm">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!hasRecipe && (
            <div className="rounded-lg border p-4 text-sm space-y-2">
              <p className="font-medium">Recipe not available</p>
              <p className="text-muted-foreground">
                {meal.isSaved
                  ? "This meal was saved before NourishTrack started keeping full recipes, so only its nutrition was stored. Meals you save from now on will keep their ingredients and steps."
                  : "No ingredients or steps were provided for this meal."}
              </p>
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-nourish-700 underline-offset-4 hover:underline"
              >
                Search for this recipe
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleAddToFoodDiary} className="flex-1 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add to Food Diary
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
