import { cn } from "@/lib/utils";

interface MeterProps {
  value: number;
  goal: number;
  label: string;
  className?: string;
  size?: "sm" | "lg";
}

/**
 * A progress track toward a goal. The track is a lighter step of the fill's own colour.
 * Going over the goal switches to amber, and the text says "over" so it never relies on colour alone.
 */
export const Meter = ({ value, goal, label, className, size = "sm" }: MeterProps) => {
  const safeGoal = goal > 0 ? goal : 1;
  const pct = Math.min(100, Math.max(0, (value / safeGoal) * 100));
  const over = value > goal && goal > 0;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={Math.round(value)}
      className={cn(
        "w-full overflow-hidden rounded-full",
        size === "lg" ? "h-3" : "h-2",
        over ? "bg-amber-100" : "bg-nourish-100",
        className
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", over ? "bg-amber-600" : "bg-nourish-600")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};
