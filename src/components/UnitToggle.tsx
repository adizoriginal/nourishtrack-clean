import { cn } from "@/lib/utils";
import type { UnitSystem } from "@/lib/units";

interface UnitToggleProps {
  value: UnitSystem;
  onChange: (units: UnitSystem) => void;
  className?: string;
}

/** Small two-option switch: kg / cm  ⇄  lb / ft */
export const UnitToggle = ({ value, onChange, className }: UnitToggleProps) => (
  <div
    role="radiogroup"
    aria-label="Units"
    className={cn("inline-flex rounded-lg border bg-muted/40 p-0.5 text-sm", className)}
  >
    {(
      [
        { v: "metric", label: "kg / cm" },
        { v: "imperial", label: "lb / ft" },
      ] as { v: UnitSystem; label: string }[]
    ).map((o) => (
      <button
        key={o.v}
        type="button"
        role="radio"
        aria-checked={value === o.v}
        onClick={() => onChange(o.v)}
        className={cn(
          "rounded-md px-3 py-1 font-medium transition-colors",
          value === o.v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);
