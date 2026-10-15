import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { MealCard } from "./MealCard";
import { AddFoodModal, NewFood } from "./AddFoodModal";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import { toLocalDateString } from "@/lib/dates";
import type { FoodOption } from "@/lib/foodSearch";

type MealType = "breakfast" | "lunch" | "dinner" | "snacks";

const MEALS: { type: MealType; title: string }[] = [
  { type: "breakfast", title: "Breakfast" },
  { type: "lunch", title: "Lunch" },
  { type: "dinner", title: "Dinner" },
  { type: "snacks", title: "Snacks" },
];

export const FoodDiary = () => {
  const { currentDate, setCurrentDate, getMealsForDate, allMeals, addFood, removeFood } = useAppContext();
  const [addingTo, setAddingTo] = useState<MealType | null>(null);

  const date = new Date(currentDate + "T00:00:00");
  const displayMeals = getMealsForDate(currentDate);

  // The user's most recently logged foods, so repeat meals are one tap away.
  const recentFoods = useMemo<FoodOption[]>(() => {
    const seen = new Set<string>();
    const recents: FoodOption[] = [];
    const dates = Object.keys(allMeals).sort().reverse();
    for (const d of dates) {
      for (const m of MEALS) {
        for (const food of [...(allMeals[d]?.[m.type] ?? [])].reverse()) {
          const key = `${food.name}|${food.servingSize}`.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          recents.push({
            key: `recent-${key}`,
            name: food.name,
            unit: "serving",
            baseAmount: 1,
            defaultAmount: 1,
            servingLabel: food.servingSize,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
          });
          if (recents.length >= 10) return recents;
        }
      }
    }
    return recents;
  }, [allMeals]);

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) setCurrentDate(toLocalDateString(newDate));
  };

  const handleAddFood = async (food: NewFood) => {
    if (addingTo) await addFood(addingTo, food, currentDate);
  };

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Food Diary</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{format(date, "MMMM d, yyyy")}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleDateChange}
              disabled={(d) => d > today}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {MEALS.map((m) => (
          <MealCard
            key={m.type}
            title={m.title}
            foods={displayMeals[m.type]}
            onAddFood={() => setAddingTo(m.type)}
            onRemoveFood={(foodId) => removeFood(m.type, foodId, currentDate)}
          />
        ))}
      </div>

      <AddFoodModal
        isOpen={addingTo !== null}
        onClose={() => setAddingTo(null)}
        onAddFood={handleAddFood}
        mealType={MEALS.find((m) => m.type === addingTo)?.title.toLowerCase() ?? ""}
        recentFoods={recentFoods}
      />
    </div>
  );
};
