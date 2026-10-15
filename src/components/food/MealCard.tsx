
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Plus, X } from "lucide-react";

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
  onAddFood?: () => void;
  onEditFood?: (food: Food) => void;
  /** Shown when this meal is empty but the day before had foods for it */
  copyFromYesterday?: { label: string; count: number; calories: number; onCopy: () => void; busy?: boolean };
}

export const MealCard = ({ title, foods, onRemoveFood, onAddFood, onEditFood, copyFromYesterday }: MealCardProps) => {
  // Calculate total nutrients
  const totalCalories = foods.reduce((sum, food) => sum + food.calories, 0);
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const totalProtein = round1(foods.reduce((sum, food) => sum + food.protein, 0));
  const totalCarbs = round1(foods.reduce((sum, food) => sum + food.carbs, 0));
  const totalFat = round1(foods.reduce((sum, food) => sum + food.fat, 0));

  return (
    <Card className="nourish-card">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xl">
          {title}
          {foods.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">{Math.round(totalCalories)} kcal</span>
          )}
        </CardTitle>
        {onAddFood && (
          <Button size="sm" variant="outline" onClick={onAddFood} aria-label={`Add food to ${title}`}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
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
                    {onEditFood ? (
                      <button
                        type="button"
                        onClick={() => onEditFood(food)}
                        className="text-left rounded-sm hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Change amount of ${food.name}`}
                      >
                        <div className="font-medium">{food.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {food.servingSize} • {Math.round(food.calories)} kcal
                        </div>
                      </button>
                    ) : (
                      <div>
                        <div className="font-medium">{food.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {food.servingSize} • {Math.round(food.calories)} kcal
                        </div>
                      </div>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onRemoveFood(food.id)}
                      className="h-6 w-6 self-start -mr-2"
                      aria-label={`Remove ${food.name}`}
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
            <div className="mt-2 flex flex-col items-center gap-1">
              {copyFromYesterday && (
                <Button
                  variant="outline"
                  onClick={copyFromYesterday.onCopy}
                  disabled={copyFromYesterday.busy}
                  className="h-auto max-w-full whitespace-normal py-2"
                >
                  <Copy className="h-4 w-4 mr-2 shrink-0" />
                  <span className="text-left leading-tight">
                    <span className="block">{copyFromYesterday.label}</span>
                    <span className="block text-xs font-normal text-muted-foreground">
                      {copyFromYesterday.count} item{copyFromYesterday.count === 1 ? "" : "s"} ·{" "}
                      {Math.round(copyFromYesterday.calories)} kcal
                    </span>
                  </span>
                </Button>
              )}
              {onAddFood && (
                <Button variant="link" onClick={onAddFood}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add your first food
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
