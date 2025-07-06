
import { useAppContext } from "@/contexts/AppContext";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { NutrientChart } from "@/components/dashboard/NutrientChart";
import { WeightChart } from "@/components/dashboard/WeightChart";
import { DailySummary } from "@/components/dashboard/DailySummary";

const Dashboard = () => {
  const { profile, getMealsForDate, weightHistory, getNutritionSummary, currentDate } = useAppContext();
  
  // Get today's nutrition data
  const todayString = new Date().toISOString().split('T')[0];
  const { caloriesConsumed, proteinConsumed, carbsConsumed, fatConsumed } = getNutritionSummary(todayString);
  const todaysMeals = getMealsForDate(todayString);
  
  // Calculate macronutrient calories
  const proteinCalories = proteinConsumed * 4;
  const carbsCalories = carbsConsumed * 4;
  const fatCalories = fatConsumed * 9;
  
  const today = new Date();
  
  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>
      
      <div className="mb-6 p-4 bg-muted/30 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">📊 What do these calories represent?</h3>
        <p className="text-muted-foreground">
          The calories shown below are from all the meals you've logged in your Food Diary for today ({new Date().toLocaleDateString()}). 
          This includes your breakfast, lunch, dinner, and snacks. The progress bars show how close you are to reaching your daily nutrition goals.
        </p>
      </div>
      
      <DashboardSummary 
        caloriesConsumed={caloriesConsumed}
        caloriesGoal={profile.calorieGoal}
        proteinConsumed={proteinConsumed}
        proteinGoal={profile.proteinGoal}
        carbsConsumed={carbsConsumed}
        carbsGoal={profile.carbsGoal}
        fatConsumed={fatConsumed}
        fatGoal={profile.fatGoal}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <NutrientChart 
          proteinCalories={proteinCalories}
          carbsCalories={carbsCalories}
          fatCalories={fatCalories}
        />
        
        <WeightChart 
          weightData={weightHistory}
        />
      </div>
      
      <div className="mt-6">
        <DailySummary 
          meals={todaysMeals}
          date={today}
        />
      </div>
    </div>
  );
};

export default Dashboard;
