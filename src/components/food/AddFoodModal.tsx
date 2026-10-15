import { useEffect, useRef, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search } from "lucide-react";
import { FoodOption, scaleFood, searchFoods } from "@/lib/foodSearch";

export interface NewFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (food: NewFood) => Promise<void> | void;
  mealType: string;
  recentFoods?: FoodOption[];
}

const emptyQuickAdd = { name: "", calories: "", protein: "", carbs: "", fat: "", serving: "" };

export const AddFoodModal = ({ isOpen, onClose, onAddFood, mealType, recentFoods = [] }: AddFoodModalProps) => {
  const [tab, setTab] = useState("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodOption[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodOption | null>(null);
  const [amount, setAmount] = useState("");
  const [quick, setQuick] = useState(emptyQuickAdd);
  const [isSaving, setIsSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Reset everything each time the dialog opens
  useEffect(() => {
    if (isOpen) {
      setTab("search");
      setQuery("");
      setResults([]);
      setHasSearched(false);
      setSearchError(null);
      setSelected(null);
      setAmount("");
      setQuick(emptyQuickAdd);
    }
    return () => abortRef.current?.abort();
  }, [isOpen]);

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);
    setSearchError(null);
    setSelected(null);
    try {
      const found = await searchFoods(query, controller.signal);
      setResults(found);
      setHasSearched(true);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setSearchError((err as Error).message);
      setResults([]);
    } finally {
      if (abortRef.current === controller) setIsSearching(false);
    }
  };

  const choose = (option: FoodOption) => {
    setSelected(option);
    setAmount(String(option.defaultAmount));
  };

  const amountNumber = parseFloat(amount);
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0;
  const preview = selected && amountValid ? scaleFood(selected, amountNumber) : null;

  const quickCalories = parseFloat(quick.calories);
  const quickValid = quick.name.trim().length > 0 && Number.isFinite(quickCalories) && quickCalories >= 0;

  const save = async (food: NewFood) => {
    setIsSaving(true);
    try {
      await onAddFood(food);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSelected = () => {
    if (!selected || !preview) return;
    save({ id: `${selected.key}-${Date.now()}`, name: selected.name, ...preview });
  };

  const handleQuickAdd = () => {
    if (!quickValid) return;
    const num = (v: string) => {
      const n = parseFloat(v);
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
    };
    save({
      id: `custom-${Date.now()}`,
      name: quick.name.trim(),
      calories: Math.round(quickCalories),
      protein: num(quick.protein),
      carbs: num(quick.carbs),
      fat: num(quick.fat),
      servingSize: quick.serving.trim() || "1 serving",
    });
  };

  const listToShow = hasSearched || searchError ? results : recentFoods;
  const showingRecents = !hasSearched && !searchError && recentFoods.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add food to {mealType}</DialogTitle>
          <DialogDescription>Search the food database, or quick-add your own food.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="quick">Quick add</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="e.g. rice, plantain, egg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search foods"
                  autoFocus
                />
              </div>
              <Button type="submit" variant="secondary" disabled={isSearching || query.trim().length < 2}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </form>

            {showingRecents && <p className="text-xs font-medium text-muted-foreground">Recent foods</p>}

            <div className="h-[220px] overflow-y-auto border rounded-md">
              {searchError ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {searchError}
                  <Button variant="link" className="block mx-auto" onClick={() => setTab("quick")}>
                    Use Quick add instead
                  </Button>
                </div>
              ) : listToShow.length > 0 ? (
                <div className="divide-y divide-border">
                  {listToShow.map((food) => (
                    <button
                      type="button"
                      key={food.key}
                      className={`w-full text-left p-3 hover:bg-muted transition-colors ${
                        selected?.key === food.key ? "bg-muted" : ""
                      }`}
                      onClick={() => choose(food)}
                    >
                      <div className="font-medium">{food.name}</div>
                      <div className="text-sm text-muted-foreground flex justify-between gap-2">
                        <span className="truncate">
                          {food.unit === "g" ? `per ${food.baseAmount} g` : food.servingLabel || "1 serving"}
                          {food.detail ? ` · ${food.detail}` : ""}
                        </span>
                        <span className="shrink-0">{Math.round(food.calories)} kcal</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {hasSearched ? (
                    <>
                      No foods found for "{query}".
                      <Button variant="link" className="block mx-auto" onClick={() => {
                        setQuick({ ...emptyQuickAdd, name: query });
                        setTab("quick");
                      }}>
                        Quick add "{query}"
                      </Button>
                    </>
                  ) : (
                    "Type a food and press Search."
                  )}
                </div>
              )}
            </div>

            {selected && (
              <div className="border rounded-md p-4 bg-muted/50 space-y-3">
                <div className="font-medium">{selected.name}</div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="amount">{selected.unit === "g" ? "Amount (grams)" : "Servings"}</Label>
                  <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min={selected.unit === "g" ? 1 : 0.25}
                    step={selected.unit === "g" ? 1 : 0.25}
                    className="w-24"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                {preview && (
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div><span className="font-semibold">{preview.calories}</span> kcal</div>
                    <div className="text-muted-foreground">P {preview.protein}g</div>
                    <div className="text-muted-foreground">C {preview.carbs}g</div>
                    <div className="text-muted-foreground">F {preview.fat}g</div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleAddSelected} disabled={!preview || isSaving}>
                {isSaving ? "Adding..." : "Add food"}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="quick" className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="qa-name">Food name *</Label>
              <Input
                id="qa-name"
                placeholder="e.g. Jollof rice with chicken"
                value={quick.name}
                onChange={(e) => setQuick({ ...quick, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="qa-cal">Calories (kcal) *</Label>
                <Input id="qa-cal" type="number" inputMode="decimal" min={0} value={quick.calories}
                  onChange={(e) => setQuick({ ...quick, calories: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qa-serving">Serving</Label>
                <Input id="qa-serving" placeholder="e.g. 1 plate" value={quick.serving}
                  onChange={(e) => setQuick({ ...quick, serving: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["protein", "carbs", "fat"] as const).map((k) => (
                <div className="space-y-1" key={k}>
                  <Label htmlFor={`qa-${k}`} className="capitalize">{k} (g)</Label>
                  <Input id={`qa-${k}`} type="number" inputMode="decimal" min={0} value={quick[k]}
                    onChange={(e) => setQuick({ ...quick, [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Only the name and calories are required.</p>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleQuickAdd} disabled={!quickValid || isSaving}>
                {isSaving ? "Adding..." : "Add food"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
