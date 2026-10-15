import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Loader2, Search, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Amount, FoodOption, applyAmount } from "@/lib/foodSearch";
import { amountFor, findFood } from "@/lib/foodMatch";
import { ParsedMealItem, parseMealText } from "@/lib/mealText";
import { AmountPicker } from "./AmountPicker";
import type { NewFood } from "./AddFoodModal";

interface Row {
  id: string;
  parsed: ParsedMealItem;
  option: FoodOption | null;
  alternatives: FoodOption[];
  confident: boolean;
  amount: Amount;
  qtyText: string;
  loading: boolean;
  changing: boolean;
}

interface DescribeMealProps {
  /** Your own foods, matched before anything else */
  mine: FoodOption[];
  onConfirm: (foods: NewFood[]) => Promise<void> | void;
  confirmLabel?: (count: number) => string;
  placeholder?: string;
  hint?: string;
  busy?: boolean;
  autoFocus?: boolean;
}

const EXAMPLES = ["2 eggs, toast with butter and coffee with milk", "200g chicken breast, 1 cup rice, salad", "a banana and a glass of orange juice"];

const describeTyped = (p: ParsedMealItem) => p.text;

export const DescribeMeal = ({
  mine,
  onConfirm,
  confirmLabel = (n) => (n === 1 ? "Add 1 food" : `Add ${n} foods`),
  placeholder = "e.g. 2 eggs, toast with butter and a cup of coffee with milk",
  hint = "Separate foods with commas or \"and\". Add amounts like 2, 1 cup, 150g or a slice.",
  busy,
  autoFocus,
}: DescribeMealProps) => {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const update = (id: string, patch: Partial<Row>) =>
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? prev);

  const findFoods = async () => {
    const parsed = parseMealText(text);
    if (parsed.length === 0) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const initial: Row[] = parsed.map((p, i) => ({
      id: `${Date.now()}-${i}`,
      parsed: p,
      option: null,
      alternatives: [],
      confident: false,
      amount: { quantity: p.quantity, unit: "g" },
      qtyText: String(p.quantity),
      loading: true,
      changing: false,
    }));
    setRows(initial);

    // One at a time: the food database doesn't like lots of requests at once
    for (const row of initial) {
      try {
        const found = await findFood(row.parsed.food, mine, controller.signal);
        if (controller.signal.aborted) return;
        const amount = found.best ? amountFor(found.best, row.parsed) : row.amount;
        update(row.id, {
          option: found.best,
          alternatives: found.alternatives,
          confident: found.confident,
          amount,
          qtyText: String(Math.round(amount.quantity * 100) / 100),
          loading: false,
        });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        update(row.id, { loading: false });
      }
    }
  };

  const pick = (row: Row, option: FoodOption) => {
    const amount = amountFor(option, row.parsed);
    update(row.id, {
      option,
      amount,
      qtyText: String(Math.round(amount.quantity * 100) / 100),
      confident: true,
      changing: false,
    });
  };

  const ready = (rows ?? []).filter((r) => r.option && r.amount.quantity > 0);
  const totals = ready.reduce((sum, r) => sum + applyAmount(r.option!, r.amount).calories, 0);
  const stillLoading = (rows ?? []).some((r) => r.loading);

  const confirm = async () => {
    const foods: NewFood[] = ready.map((r) => ({
      id: `${r.option!.key}-${Date.now()}-${r.id}`,
      name: r.option!.name,
      ...applyAmount(r.option!, r.amount),
    }));
    if (foods.length === 0) return;
    await onConfirm(foods);
  };

  if (!rows) {
    return (
      <div className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={3}
          autoFocus={autoFocus}
          aria-label="Describe what you ate"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              findFoods();
            }
          }}
        />
        <p className="text-xs text-muted-foreground">{hint}</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              type="button"
              key={ex}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setText(ex)}
            >
              {ex}
            </button>
          ))}
        </div>
        <Button className="w-full" onClick={findFoods} disabled={parseMealText(text).length === 0}>
          <Sparkles className="h-4 w-4 mr-2" />
          Find foods
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2" aria-label="Foods found">
        {rows.map((row) => {
          const result = row.option && row.amount.quantity > 0 ? applyAmount(row.option, row.amount) : null;
          return (
            <li key={row.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  {row.loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Finding "{row.parsed.food}"...
                    </div>
                  ) : row.option ? (
                    <>
                      <div className="font-medium leading-tight">{row.option.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        You typed: "{describeTyped(row.parsed)}"
                        {row.option.source === "mine" ? " · your food" : ""}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                      <span>Couldn't find "{row.parsed.food}".</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {result && <span className="text-sm font-semibold tabular-nums">{result.calories} kcal</span>}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Remove ${row.parsed.food}`}
                    onClick={() => setRows((prev) => prev?.filter((r) => r.id !== row.id) ?? prev)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {!row.loading && row.option && !row.confident && (
                <p className="flex items-center gap-1 text-xs text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-3 w-3" /> Closest match. Check it, or change it below.
                </p>
              )}

              {!row.loading && row.option && (
                <AmountPicker
                  compact
                  option={row.option}
                  amount={row.amount}
                  text={row.qtyText}
                  onChange={(qtyText, amount) => update(row.id, { qtyText, amount })}
                />
              )}

              {!row.loading && (
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  onClick={() => update(row.id, { changing: !row.changing })}
                  aria-expanded={row.changing}
                >
                  {row.changing ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  {row.option ? "Not right? Change food" : "Search for it"}
                </button>
              )}

              {row.changing && (
                <ChangeFood
                  initialQuery={row.parsed.food}
                  alternatives={row.alternatives}
                  current={row.option}
                  mine={mine}
                  onPick={(option) => pick(row, option)}
                />
              )}
            </li>
          );
        })}
      </ul>

      {rows.length === 0 && <p className="text-sm text-muted-foreground text-center">No foods left.</p>}

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total</span>
        <span className="font-semibold tabular-nums">{Math.round(totals).toLocaleString()} kcal</span>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            abortRef.current?.abort();
            setRows(null);
          }}
        >
          Edit text
        </Button>
        <Button className="flex-1" onClick={confirm} disabled={ready.length === 0 || stillLoading || busy}>
          {busy ? "Saving..." : confirmLabel(ready.length)}
        </Button>
      </div>
    </div>
  );
};

interface ChangeFoodProps {
  initialQuery: string;
  alternatives: FoodOption[];
  current: FoodOption | null;
  mine: FoodOption[];
  onPick: (option: FoodOption) => void;
}

/** Pick a different match, or search again */
const ChangeFood = ({ initialQuery, alternatives, current, mine, onPick }: ChangeFoodProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [list, setList] = useState(alternatives);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const found = await findFood(query, mine);
      setList(found.alternatives);
      if (found.alternatives.length === 0) setError(`Nothing found for "${query}". Try a simpler name.`);
    } catch {
      setError("Search isn't working right now. Try again in a moment.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md bg-muted/50 p-2">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="h-9 pl-8" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search for a food" />
        </div>
        <Button type="submit" size="sm" variant="secondary" className="h-9" disabled={searching || query.trim().length < 2}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>
      {error && <p className="text-xs text-muted-foreground">{error}</p>}
      {list.length > 0 && (
        <div className="max-h-48 overflow-y-auto divide-y rounded-md border bg-background">
          {list.map((option) => (
            <button
              type="button"
              key={option.key}
              className={cn(
                "w-full p-2 text-left text-sm hover:bg-muted",
                current?.key === option.key && "bg-muted font-medium"
              )}
              onClick={() => onPick(option)}
            >
              <div className="leading-tight">{option.name}</div>
              <div className="text-xs text-muted-foreground">
                {option.unit === "serving"
                  ? `${option.servingLabel || "1 serving"} · ${Math.round(option.calories)} kcal`
                  : `${Math.round(option.calories)} kcal per 100 g`}
                {option.source === "mine" ? " · your food" : ""}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

