
import { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface FoodDiaryProps {
  meals: {
    breakfast: Food[];
    lunch: Food[];
    dinner: Food[];
    snacks: Food[];
  };
  onRemoveFood: (mealType: string, foodId: string) => void;
}

export const FoodDiary = ({ meals, onRemoveFood }: FoodDiaryProps) => {
  const { currentDate, setCurrentDate, getMealsForDate } = useAppContext();
  const [date, setDate] = useState<Date>(new Date(currentDate));
  const [displayMeals, setDisplayMeals] = useState(meals);

  // Convert Date object to YYYY-MM-DD string consistently
  const dateToString = (dateObj: Date) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Update display meals when date changes
  useEffect(() => {
    const dateString = dateToString(date);
    console.log('Date changed to:', dateString);
    console.log('Date object:', date);
    
    // Get meals for the specific date
    const mealsForDate = getMealsForDate(dateString);
    console.log('Meals for date:', dateString, mealsForDate);
    
    setDisplayMeals(mealsForDate);
    
    // Update context current date
    if (dateString !== currentDate) {
      console.log('Updating context current date from', currentDate, 'to', dateString);
      setCurrentDate(dateString);
    }
  }, [date, getMealsForDate, setCurrentDate, currentDate]);

  // Initialize date from context on mount
  useEffect(() => {
    const contextDate = new Date(currentDate + 'T00:00:00');
    console.log('Initializing date from context:', currentDate, 'as Date object:', contextDate);
    setDate(contextDate);
  }, []);

  const handleDateChange = (newDate: Date | undefined) => {
    if (newDate) {
      console.log('Calendar date selected:', newDate);
      console.log('Calendar date ISO string:', newDate.toISOString());
      
      // Ensure we're working with the local date, not UTC
      const localDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      console.log('Local date created:', localDate);
      
      setDate(localDate);
    }
  };

  const handleRemoveFood = (mealType: string, foodId: string) => {
    const dateString = dateToString(date);
    console.log('Removing food:', foodId, 'from', mealType, 'on', dateString);
    
    onRemoveFood(mealType, foodId);
    
    // Update display meals immediately after removal
    setTimeout(() => {
      const updatedMeals = getMealsForDate(dateString);
      console.log('Updated meals after removal:', updatedMeals);
      setDisplayMeals(updatedMeals);
    }, 100);
  };

  // Get today's date for restriction (only allow past and present dates)
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Food Diary</h2>
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
              disabled={(date) => date > today}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <MealCard 
          title="Breakfast" 
          foods={displayMeals.breakfast} 
          onRemoveFood={(foodId) => handleRemoveFood("breakfast", foodId)} 
        />
        
        <MealCard 
          title="Lunch" 
          foods={displayMeals.lunch} 
          onRemoveFood={(foodId) => handleRemoveFood("lunch", foodId)} 
        />
        
        <MealCard 
          title="Dinner" 
          foods={displayMeals.dinner} 
          onRemoveFood={(foodId) => handleRemoveFood("dinner", foodId)} 
        />
        
        <MealCard 
          title="Snacks" 
          foods={displayMeals.snacks} 
          onRemoveFood={(foodId) => handleRemoveFood("snacks", foodId)} 
        />
      </div>
    </div>
  );
};
