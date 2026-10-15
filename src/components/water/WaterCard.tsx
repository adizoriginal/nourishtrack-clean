import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

export const WATER_GOAL_GLASSES = 8;

interface WaterCardProps {
  date: string;
  className?: string;
}

/** Tap to add or remove glasses of water for a day. */
export const WaterCard = ({ date, className }: WaterCardProps) => {
  const { waterByDate, setWater, profile } = useAppContext();
  const glasses = waterByDate[date] ?? 0;
  const goal = WATER_GOAL_GLASSES;
  const reached = glasses >= goal;
  const glassSize = profile.units === "imperial" ? "8 fl oz" : "250 ml";
  const total =
    profile.units === "imperial" ? `${glasses * 8} fl oz` : `${+(glasses * 0.25).toFixed(2)} L`;

  return (
    <Card className={cn("nourish-card", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span aria-hidden>💧</span> Water
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {glasses} / {goal} glasses
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: goal }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-6 flex-1 rounded-sm border transition-colors",
                i < glasses ? "bg-sky-500 border-sky-500" : "bg-sky-50 border-sky-200"
              )}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setWater(date, glasses - 1)}
            disabled={glasses === 0}
            aria-label="Remove a glass of water"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="text-center text-sm" aria-live="polite">
            <div className="font-medium">{reached ? "Goal reached 🎉" : `${goal - glasses} to go`}</div>
            <div className="text-xs text-muted-foreground">
              {total} · 1 glass = {glassSize}
            </div>
          </div>
          <Button
            type="button"
            size="icon"
            onClick={() => setWater(date, glasses + 1)}
            aria-label="Add a glass of water"
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
