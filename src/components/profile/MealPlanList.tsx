
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { MealDetailModal } from "./MealDetailModal";
import { useMealPlans } from "@/hooks/useMealPlans";

export const MealPlanList = () => {
  const { mealPlans, isLoading, deleteMealPlan } = useMealPlans();
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewMeal = (meal: any) => {
    setSelectedMeal(meal);
    setIsModalOpen(true);
  };

  const handleDeleteMeal = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteMealPlan(id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recommended Meal Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recommended Meal Plans
            <span className="text-sm font-normal text-muted-foreground">
              {mealPlans.length} saved
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mealPlans.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No meal plans saved yet</p>
              <p className="text-sm text-muted-foreground">
                Generate personalized meal recommendations to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mealPlans.map((meal) => (
                <div
                  key={meal.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleViewMeal(meal)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{meal.name}</h4>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full capitalize">
                        {meal.meal_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {meal.description}
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{meal.calories} kcal</span>
                      <span>{meal.protein}g protein</span>
                      <span>{meal.carbs}g carbs</span>
                      <span>{meal.fats}g fat</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDeleteMeal(meal.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <MealDetailModal
        meal={selectedMeal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMeal(null);
        }}
      />
    </>
  );
};
