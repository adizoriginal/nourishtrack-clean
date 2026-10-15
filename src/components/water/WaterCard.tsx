import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface WaterCardProps {
  date: string;
  className?: string;
}

const MIN_GOAL = 1;
const MAX_GOAL = 30;

/** Tap to add or remove glasses of water for a day. The goal can be changed in place. */
export const WaterCard = ({ date, className }: WaterCardProps) => {
  const { waterByDate, setWater, profile, updateProfile } = useAppContext();
  const glasses = waterByDate[date] ?? 0;
  const goal = profile.waterGoal || 8;
  const reached = glasses >= goal;
  const imperial = profile.units === "imperial";
  const glassSize = imperial ? "8 fl oz" : "250 ml";
  const amount = (n: number) => (imperial ? `${n * 8} fl oz` : `${+(n * 0.25).toFixed(2)} L`);

  const [editingGoal, setEditingGoal] = useState(false);
  const [draftGoal, setDraftGoal] = useState(goal);
  const [savingGoal, setSavingGoal] = useState(false);

  const saveGoal = async () => {
    setSavingGoal(true);
    try {
      await updateProfile({ waterGoal: draftGoal }, { silent: true });
      setEditingGoal(false);
    } catch {
      /* updateProfile shows the error */
    } finally {
      setSavingGoal(false);
    }
  };

  // Show up to 12 boxes; bigger goals use a bar instead
  const showBoxes = goal <= 12;

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
        {showBoxes ? (
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
        ) : (
          <div className="h-3 w-full overflow-hidden rounded-full bg-sky-100" aria-hidden>
            <div className="h-full rounded-full bg-sky-500 transition-[width]" style={{ width: `${Math.min(100, (glasses / goal) * 100)}%` }} />
          </div>
        )}

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
              {amount(glasses)} · 1 glass = {glassSize}
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

        {editingGoal ? (
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Daily goal</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDraftGoal((g) => Math.max(MIN_GOAL, g - 1))}
                  disabled={draftGoal <= MIN_GOAL}
                  aria-label="Lower water goal"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-24 text-center text-sm" aria-live="polite">
                  <span className="font-semibold">{draftGoal}</span> glasses
                  <span className="block text-xs text-muted-foreground">{amount(draftGoal)}</span>
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setDraftGoal((g) => Math.min(MAX_GOAL, g + 1))}
                  disabled={draftGoal >= MAX_GOAL}
                  aria-label="Raise water goal"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingGoal(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={saveGoal} disabled={savingGoal || draftGoal === goal}>
                {savingGoal ? "Saving..." : "Save goal"}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
            onClick={() => {
              setDraftGoal(goal);
              setEditingGoal(true);
            }}
          >
            Change daily goal ({amount(goal)})
          </button>
        )}
      </CardContent>
    </Card>
  );
};
