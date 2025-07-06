
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Apple, Droplet, Flame } from "lucide-react";

interface DashboardSummaryProps {
  caloriesConsumed: number;
  caloriesGoal: number;
  proteinConsumed: number;
  proteinGoal: number;
  carbsConsumed: number;
  carbsGoal: number;
  fatConsumed: number;
  fatGoal: number;
}

export const DashboardSummary = ({
  caloriesConsumed,
  caloriesGoal,
  proteinConsumed,
  proteinGoal,
  carbsConsumed,
  carbsGoal,
  fatConsumed,
  fatGoal,
}: DashboardSummaryProps) => {
  const calculatePercentage = (consumed: number, goal: number) => {
    return Math.min(Math.round((consumed / goal) * 100), 100);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="nourish-card animate-enter">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Flame className="mr-2 h-5 w-5 text-destructive" />
            Calories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {caloriesConsumed} <span className="text-sm font-normal text-muted-foreground">/ {caloriesGoal}</span>
          </div>
          <Progress 
            value={calculatePercentage(caloriesConsumed, caloriesGoal)} 
            className="h-2 mt-2" 
          />
          <div className="text-xs text-muted-foreground mt-1">
            {caloriesGoal - caloriesConsumed > 0 
              ? `${caloriesGoal - caloriesConsumed} kcal remaining` 
              : "Daily goal reached"}
          </div>
        </CardContent>
      </Card>

      <Card className="nourish-card animate-enter" style={{ animationDelay: "50ms" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Target className="mr-2 h-5 w-5 text-blue-500" />
            Protein
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {proteinConsumed}g <span className="text-sm font-normal text-muted-foreground">/ {proteinGoal}g</span>
          </div>
          <Progress 
            value={calculatePercentage(proteinConsumed, proteinGoal)} 
            className="h-2 mt-2 bg-muted" 
          />
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round((proteinConsumed / caloriesConsumed) * 400) / 100} calories/gram
          </div>
        </CardContent>
      </Card>

      <Card className="nourish-card animate-enter" style={{ animationDelay: "100ms" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Apple className="mr-2 h-5 w-5 text-nourish-500" />
            Carbs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {carbsConsumed}g <span className="text-sm font-normal text-muted-foreground">/ {carbsGoal}g</span>
          </div>
          <Progress 
            value={calculatePercentage(carbsConsumed, carbsGoal)} 
            className="h-2 mt-2 bg-muted" 
          />
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round((carbsConsumed / caloriesConsumed) * 400) / 100} calories/gram
          </div>
        </CardContent>
      </Card>

      <Card className="nourish-card animate-enter" style={{ animationDelay: "150ms" }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Droplet className="mr-2 h-5 w-5 text-yellow-500" />
            Fat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {fatConsumed}g <span className="text-sm font-normal text-muted-foreground">/ {fatGoal}g</span>
          </div>
          <Progress 
            value={calculatePercentage(fatConsumed, fatGoal)} 
            className="h-2 mt-2 bg-muted" 
          />
          <div className="text-xs text-muted-foreground mt-1">
            {Math.round((fatConsumed / caloriesConsumed) * 900) / 100} calories/gram
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
