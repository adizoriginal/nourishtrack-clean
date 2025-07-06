
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface MealCardProps {
  title: string;
  foods: Food[];
  onRemoveFood: (id: string) => void;
}

export const MealCard = ({ title, foods, onRemoveFood }: MealCardProps) => {
  // Calculate total nutrients
  const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);
  const totalProtein = foods.reduce((sum, food) => sum + food.protein, 0);
  const totalCarbs = foods.reduce((sum, food) => sum + food.carbs, 0);
  const totalFat = foods.reduce((sum, food) => sum + food.fat, 0);

  return (
    <Card className="nourish-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {foods.length > 0 ? (
          <>
            <div className="grid grid-cols-5 gap-2 py-2 text-sm font-medium border-b border-border">
              <div className="col-span-2">Food</div>
              <div className="text-center">Protein</div>
              <div className="text-center">Carbs</div>
              <div className="text-center">Fat</div>
            </div>
            <div className="divide-y divide-border">
              {foods.map((food) => (
                <div key={food.id} className="grid grid-cols-5 gap-2 py-3 items-center">
                  <div className="col-span-2 flex justify-between pr-2">
                    <div>
                      <div className="font-medium">{food.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {food.servingSize} • {food.calories} kcal
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onRemoveFood(food.id)}
                      className="h-6 w-6 self-start -mr-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-center">{food.protein}g</div>
                  <div className="text-center">{food.carbs}g</div>
                  <div className="text-center">{food.fat}g</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 pt-3 mt-2 border-t border-border text-sm font-medium">
              <div className="col-span-2">Total</div>
              <div className="text-center">{totalProtein}g</div>
              <div className="text-center">{totalCarbs}g</div>
              <div className="text-center">{totalFat}g</div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No foods logged yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Add meals from your personalized recommendations in the Profile section
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
