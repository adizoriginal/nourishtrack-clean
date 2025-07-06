
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface MealSummary {
  name: string;
  calories: number;
}

interface DailySummaryProps {
  meals: {
    breakfast: MealSummary[];
    lunch: MealSummary[];
    dinner: MealSummary[];
    snacks: MealSummary[];
  };
  date: Date;
}

export const DailySummary = ({ meals, date }: DailySummaryProps) => {
  const calculateTotalCalories = (mealItems: MealSummary[]) => {
    return mealItems.reduce((total, item) => total + item.calories, 0);
  };
  
  const mealTypes = [
    { type: "breakfast", label: "Breakfast", items: meals.breakfast },
    { type: "lunch", label: "Lunch", items: meals.lunch },
    { type: "dinner", label: "Dinner", items: meals.dinner },
    { type: "snacks", label: "Snacks", items: meals.snacks },
  ];

  return (
    <Card className="nourish-card">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Today's Meals</span>
          <span className="text-sm font-medium text-muted-foreground">
            {format(date, "MMMM d, yyyy")}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mealTypes.map((meal) => (
            <div key={meal.type} className="border-b border-border pb-3 last:border-0 last:pb-0">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">{meal.label}</h3>
                <span className="text-sm font-medium">
                  {calculateTotalCalories(meal.items)} kcal
                </span>
              </div>
              
              {meal.items.length > 0 ? (
                <ul className="space-y-2">
                  {meal.items.map((item, index) => (
                    <li key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span>{item.calories} kcal</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">No items logged yet</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
