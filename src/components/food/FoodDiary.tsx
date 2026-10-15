import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { MealCard } from "./MealCard";
import { AddFoodModal, NewFood } from "./AddFoodModal";
import { EditFoodDialog, LoggedFood } from "./EditFoodDialog";
import { WaterCard } from "@/components/water/WaterCard";
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
  const { currentDate, setCurrentDate, getMealsForDate, allMeals, addFood, addFoods, updateFood, removeFood } =
    useAppContext();
  const [addingTo, setAddingTo] = useState<MealType | null>(null);
  const [editing, setEditing] = useState<{ meal: MealType; food: LoggedFood } | null>(null);
  const [copying, setCopying] = useState(false);

  const date = new Date(currentDate + "T00:00:00");
  const displayMeals = getMealsForDate(currentDate);

  // The day before the one being viewed, for "copy" shortcuts
  const dayBefore = new Date(date);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayBeforeString = toLocalDateString(dayBefore);
  const previousMeals = getMealsForDate(dayBeforeString);
  const isToday = currentDate === toLocalDateString();
  const previousLabel = isToday ? "yesterday" : format(dayBefore, "MMM d");

  const dayIsEmpty = MEALS.every((m) => displayMeals[m.type].length === 0);
  const previousItems = MEALS.flatMap((m) => previousMeals[m.type].map((food) => ({ mealType: m.type, food })));

  const copyItems = async (items: { mealType: MealType; food: LoggedFood }[]) => {
    if (items.length === 0) return;
    setCopying(true);
    await addFoods(
      items.map(({ mealType, food }) => ({
        mealType,
        food: { ...food, id: `copy-${food.id}` },
      })),
      currentDate
    );
    setCopying(false);
  };

  const shiftDay = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setCurrentDate(toLocalDateString(d));
  };

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
            source: "recent",
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

  const handleAddFoods = async (foods: NewFood[]) => {
    if (!addingTo) return false;
    return addFoods(
      foods.map((food) => ({ mealType: addingTo, food })),
      currentDate
    );
  };

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Food Diary</h1>
        <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => shiftDay(-1)} aria-label="Previous day">
          <ChevronLeft className="h-4 w-4" />
        </Button>
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
        <Button variant="ghost" size="icon" onClick={() => shiftDay(1)} disabled={isToday} aria-label="Next day">
          <ChevronRight className="h-4 w-4" />
        </Button>
        </div>
      </div>

      {dayIsEmpty && previousItems.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-dashed p-4">
          <div className="text-sm">
            <div className="font-medium">Eating the same as {previousLabel}?</div>
            <div className="text-muted-foreground">
              Copy all {previousItems.length} foods (
              {Math.round(previousItems.reduce((sum, i) => sum + i.food.calories, 0)).toLocaleString()} kcal) in one tap.
            </div>
          </div>
          <Button onClick={() => copyItems(previousItems)} disabled={copying}>
            <Copy className="h-4 w-4 mr-2" />
            {copying ? "Copying..." : `Copy all of ${previousLabel}`}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {MEALS.map((m) => (
          <MealCard
            key={m.type}
            title={m.title}
            foods={displayMeals[m.type]}
            onAddFood={() => setAddingTo(m.type)}
            onRemoveFood={(foodId) => removeFood(m.type, foodId, currentDate)}
            onEditFood={(food) => setEditing({ meal: m.type, food })}
            copyFromYesterday={
              // Only offer per-meal copy when the rest of the day isn't empty (otherwise the "copy all" box shows)
              !dayIsEmpty && displayMeals[m.type].length === 0 && previousMeals[m.type].length > 0
                ? {
                    label: `Copy ${previousLabel}'s ${m.title.toLowerCase()}`,
                    count: previousMeals[m.type].length,
                    calories: previousMeals[m.type].reduce((sum, f) => sum + f.calories, 0),
                    onCopy: () => copyItems(previousMeals[m.type].map((food) => ({ mealType: m.type, food }))),
                    busy: copying,
                  }
                : undefined
            }
          />
        ))}
        <WaterCard date={currentDate} />
      </div>

      {editing && (
        <EditFoodDialog
          food={editing.food}
          mealLabel={MEALS.find((m) => m.type === editing.meal)?.title.toLowerCase() ?? ""}
          onClose={() => setEditing(null)}
          onSave={(updated) => updateFood(editing.meal, updated, currentDate)}
          onRemove={() => {
            removeFood(editing.meal, editing.food.id, currentDate);
            setEditing(null);
          }}
        />
      )}

      <AddFoodModal
        isOpen={addingTo !== null}
        onClose={() => setAddingTo(null)}
        onAddFood={handleAddFood}
        onAddFoods={handleAddFoods}
        mealType={MEALS.find((m) => m.type === addingTo)?.title.toLowerCase() ?? ""}
        recentFoods={recentFoods}
      />
    </div>
  );
};
