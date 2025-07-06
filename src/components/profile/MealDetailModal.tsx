
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ChefHat, Plus, Info, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  } | null;
}

export const MealDetailModal = ({ isOpen, onClose, meal }: MealDetailModalProps) => {
  const { toast } = useToast();
  const { addFood, currentDate } = useAppContext();

  const handleAddToFoodDiary = () => {
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

    addFood(meal.meal_type, foodItem, currentDate);
    
    toast({
      title: "Added to Food Diary!",
      description: `${meal.name} has been added to your ${meal.meal_type} for today.`,
    });
    
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  if (!meal) return null;

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
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {meal.readyInMinutes || 30} min
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {meal.servings || 2} servings
              </Badge>
              {meal.sourceUrl && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  <a href={meal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs">
                    Original Recipe
                  </a>
                </Badge>
              )}
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">About Servings</span>
              </div>
              <p className="text-sm text-blue-700">
                This recipe makes {meal.servings || 2} serving{(meal.servings || 2) > 1 ? 's' : ''}. 
                The nutritional values shown are per serving. You can adjust the ingredients proportionally 
                if you want to make more or fewer servings.
              </p>
            </div>

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
