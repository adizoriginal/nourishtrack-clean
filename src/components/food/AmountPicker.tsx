import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Amount, FoodOption, unitChoices, unitToValue, valueToUnit } from "@/lib/foodSearch";

interface AmountPickerProps {
  option: FoodOption;
  amount: Amount;
  /** The quantity as typed (kept as text so people can clear the box while typing) */
  text: string;
  onChange: (text: string, amount: Amount) => void;
  id?: string;
  className?: string;
  compact?: boolean;
}

/** "2" + "1 cup (158 g)" — a number and a unit to go with it */
export const AmountPicker = ({ option, amount, text, onChange, id, className, compact }: AmountPickerProps) => {
  const choices = unitChoices(option);
  const isGrams = amount.unit === "g";

  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={isGrams ? 1 : 0.25}
        className={cn("shrink-0", compact ? "h-9 w-16 px-2" : "w-20")}
        value={text}
        aria-label="Amount"
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          onChange(e.target.value, { ...amount, quantity: Number.isFinite(n) ? n : 0 });
        }}
      />
      {choices.length > 1 ? (
        <select
          className={cn(
            "min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            compact ? "h-9" : "h-10"
          )}
          aria-label="Unit"
          value={unitToValue(amount.unit)}
          onChange={(e) => {
            const unit = valueToUnit(e.target.value);
            // Switching to grams: start from the weight of what was chosen
            if (unit === "g" && typeof amount.unit === "number") {
              const p = option.portions?.[amount.unit];
              const grams = p ? Math.round(p.grams * amount.quantity) : 100;
              onChange(String(grams), { quantity: grams, unit });
              return;
            }
            if (amount.unit === "g" && unit !== "g") {
              onChange("1", { quantity: 1, unit });
              return;
            }
            onChange(text, { ...amount, unit });
          }}
        >
          {choices.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="truncate text-sm text-muted-foreground">{choices[0]?.label ?? "servings"}</span>
      )}
    </div>
  );
};
