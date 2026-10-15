import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Plus, Scale, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { DailySummary } from "@/components/dashboard/DailySummary";
import { Meter } from "@/components/dashboard/Meter";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { WaterCard } from "@/components/water/WaterCard";
import { toLocalDateString } from "@/lib/dates";
import { displayWeight, weightUnitLabel } from "@/lib/units";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const fmt = (n: number) => Math.round(n).toLocaleString();

const Dashboard = () => {
  const { profile, getMealsForDate, weightHistory, getNutritionSummary } = useAppContext();

  const today = new Date();
  const todayString = toLocalDateString(today);
  const { caloriesConsumed, proteinConsumed, carbsConsumed, fatConsumed } = getNutritionSummary(todayString);
  const todaysMeals = getMealsForDate(todayString);
  const itemsLogged = Object.values(todaysMeals).reduce((n, items) => n + items.length, 0);

  const goal = profile.calorieGoal;
  const remaining = goal - caloriesConsumed;
  const over = remaining < 0;

  const firstName = profile.name && profile.name !== "User" ? profile.name.split(" ")[0] : "";

  const macros = [
    { label: "Protein", value: proteinConsumed, goal: profile.proteinGoal },
    { label: "Carbs", value: carbsConsumed, goal: profile.carbsGoal },
    { label: "Fat", value: fatConsumed, goal: profile.fatGoal },
  ];

  const latestWeight = weightHistory.length ? weightHistory[weightHistory.length - 1] : null;
  const weightChange =
    weightHistory.length >= 2 ? weightHistory[weightHistory.length - 1].weight - weightHistory[0].weight : null;

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{format(today, "EEEE, MMMM d")}</p>
          <h1 className="text-3xl font-bold">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <StreakBadge />
          <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
            <Link to="/food-diary">
              <Plus className="h-5 w-5" />
              Log food
            </Link>
          </Button>
        </div>
      </div>

      {/* Calories: the one number this page leads with */}
      <Card className="nourish-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {over ? "Over today's goal" : "Calories left today"}
              </p>
              <p className="text-5xl font-bold tracking-tight">
                {fmt(Math.abs(remaining))}
                <span className="ml-2 text-lg font-medium text-muted-foreground">kcal{over ? " over" : ""}</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{fmt(caloriesConsumed)}</span> eaten of{" "}
              <span className="font-semibold text-foreground">{fmt(goal)}</span> kcal goal
            </p>
          </div>
          <Meter value={caloriesConsumed} goal={goal} label="Calories eaten today" size="lg" />
          {itemsLogged === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing logged yet today.{" "}
              <Link to="/food-diary" className="font-medium text-nourish-700 underline-offset-4 hover:underline">
                Log your first meal
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Macros */}
        <Card className="nourish-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Macros today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {macros.map((m) => {
              const left = m.goal - m.value;
              return (
                <div key={m.label} className="space-y-2">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{m.label}</span>
                    <span className="text-muted-foreground">
                      <span className="font-semibold text-foreground">{fmt(m.value)}g</span> / {fmt(m.goal)}g
                      <span className="ml-2">
                        {left >= 0 ? `· ${fmt(left)}g left` : `· ${fmt(-left)}g over`}
                      </span>
                    </span>
                  </div>
                  <Meter value={m.value} goal={m.goal} label={`${m.label} eaten today`} />
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground pt-1">
              Goals come from your profile.{" "}
              <Link to="/profile" className="font-medium text-nourish-700 underline-offset-4 hover:underline">
                Change them
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
        <WaterCard date={todayString} />

        {/* Weight */}
        <Card className="nourish-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="h-5 w-5 text-muted-foreground" />
              Weight
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestWeight ? (
              <>
                <p className="text-3xl font-bold">
                  {displayWeight(latestWeight.weight, profile.units).toFixed(1)}
                  <span className="ml-1 text-base font-medium text-muted-foreground">
                    {weightUnitLabel(profile.units)}
                  </span>
                </p>
                {weightChange !== null && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    {weightChange < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : weightChange > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : null}
                    {weightChange === 0
                      ? "No change"
                      : `${weightChange > 0 ? "+" : "−"}${displayWeight(Math.abs(weightChange), profile.units).toFixed(1)} ${weightUnitLabel(profile.units)}`}{" "}
                    since {format(new Date(weightHistory[0].date + "T00:00:00"), "MMM d")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Last logged {format(new Date(latestWeight.date + "T00:00:00"), "MMM d")}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Log your weight to start seeing your trend.</p>
            )}
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/progress">{latestWeight ? "Log weight & see chart" : "Log your weight"}</Link>
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>

      <DailySummary meals={todaysMeals} date={today} />
    </div>
  );
};

export default Dashboard;
