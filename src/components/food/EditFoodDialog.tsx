import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parsePortion, rescaleFood } from "@/lib/portions";

export interface LoggedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface EditFoodDialogProps {
  food: LoggedFood | null;
  mealLabel: string;
  onClose: () => void;
  onSave: (updated: LoggedFood) => Promise<boolean>;
  onRemove: () => void;
}

export const EditFoodDialog = ({ food, mealLabel, onClose, onSave, onRemove }: EditFoodDialogProps) => {
  const info = food ? parsePortion(food.servingSize) : null;
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (food && info) setAmount(String(info.amount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [food?.id]);

  if (!food || !info) return null;

  const isGrams = info.kind === "grams";
  const step = isGrams ? 10 : 0.5;
  const n = parseFloat(amount);
  const valid = Number.isFinite(n) && n > 0 && n <= (isGrams ? 5000 : 50);
  const preview = valid ? rescaleFood(food, n) : null;
  const unchanged = valid && n === info.amount;

  const nudge = (dir: 1 | -1) => {
    const current = Number.isFinite(n) ? n : info.amount;
    const next = Math.max(step, Math.round((current + dir * step) * 10) / 10);
    setAmount(String(next));
  };

  const save = async () => {
    if (!preview) return;
    setSaving(true);
    const ok = await onSave(preview);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{food.name}</DialogTitle>
          <DialogDescription>
            In {mealLabel} · currently {food.servingSize}, {Math.round(food.calories)} kcal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="edit-amount">
            {isGrams ? "Amount (grams)" : `How many? (1 = ${info.label})`}
          </Label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" onClick={() => nudge(-1)} aria-label="Less">
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="edit-amount"
              type="number"
              inputMode="decimal"
              min={isGrams ? 1 : 0.25}
              step={isGrams ? 1 : 0.25}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-center text-lg"
            />
            <Button type="button" variant="outline" size="icon" onClick={() => nudge(1)} aria-label="More">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {!isGrams && (
            <div className="flex gap-2 pt-1">
              {[0.5, 1, 1.5, 2].map((q) => (
                <Button
                  key={q}
                  type="button"
                  size="sm"
                  variant={n === q ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setAmount(String(q))}
                >
                  {q === 0.5 ? "½" : q === 1.5 ? "1½" : q}
                </Button>
              ))}
            </div>
          )}
        </div>

        {preview && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground">{preview.servingSize}</span>
              <span>
                <span className="text-lg font-semibold">{preview.calories}</span> kcal
              </span>
            </div>
            <div className="mt-1 text-muted-foreground">
              P {preview.protein}g · C {preview.carbs}g · F {preview.fat}g
            </div>
          </div>
        )}

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
            Remove
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={!preview || unchanged || saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
