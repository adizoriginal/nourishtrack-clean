import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Amount, FoodOption, applyAmount, defaultAmount, searchFoods } from "@/lib/foodSearch";
import { localMatches } from "@/lib/foodMatch";
import { BarcodeLookupError, lookupBarcode } from "@/lib/barcode";
import { useCustomFoods } from "@/hooks/useCustomFoods";
import { useToast } from "@/hooks/use-toast";
import { BarcodeScanner } from "./BarcodeScanner";
import { AmountPicker } from "./AmountPicker";
import { DescribeMeal } from "./DescribeMeal";
import { MyFoods } from "./MyFoods";
import type { Nutrients } from "@/lib/nutrients";

export interface NewFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  nutrients?: Nutrients;
}

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (food: NewFood) => Promise<void> | void;
  /** Add several foods at once (from "Describe") */
  onAddFoods?: (foods: NewFood[]) => Promise<boolean | void> | boolean | void;
  mealType: string;
  recentFoods?: FoodOption[];
}

const emptyQuickAdd = { name: "", calories: "", protein: "", carbs: "", fat: "", serving: "" };
const TABS = ["search", "describe", "mine", "scan", "quick"] as const;
type Tab = (typeof TABS)[number];
const TAB_KEY = "nourishtrack:add-food-tab";

const readTab = (): Tab => {
  try {
    const t = localStorage.getItem(TAB_KEY) as Tab | null;
    return t && (TABS as readonly string[]).includes(t) && t !== "scan" && t !== "quick" ? t : "search";
  } catch {
    return "search";
  }
};

const sourceLabel = (food: FoodOption) =>
  food.source === "mine" ? "Your food" : food.source === "recent" ? "Recent" : food.source === "common" ? "Common" : undefined;

export const AddFoodModal = ({ isOpen, onClose, onAddFood, onAddFoods, mealType, recentFoods = [] }: AddFoodModalProps) => {
  const { options: mine, saveFood } = useCustomFoods();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodOption[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodOption | null>(null);
  const [amount, setAmount] = useState<Amount>({ quantity: 100, unit: "g" });
  const [qtyText, setQtyText] = useState("");
  const [quick, setQuick] = useState(emptyQuickAdd);
  const [saveQuick, setSaveQuick] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset everything each time the dialog opens
  useEffect(() => {
    if (isOpen) {
      setTab(readTab());
      setQuery("");
      setResults([]);
      setHasSearched(false);
      setSearchError(null);
      setSelected(null);
      setQtyText("");
      setQuick(emptyQuickAdd);
      setSaveQuick(false);
      setScanError(null);
    }
    return () => abortRef.current?.abort();
  }, [isOpen]);

  const changeTab = (value: string) => {
    setTab(value as Tab);
    try {
      localStorage.setItem(TAB_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const runSearch = async () => {
    if (query.trim().length < 2) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSelected(null);
    // Your foods and everyday foods show straight away; the big database fills in below
    const local = localMatches(query, mine, 6);
    setResults(local);
    setHasSearched(true);
    setIsSearching(true);
    setSearchError(null);
    try {
      const found = await searchFoods(query, controller.signal);
      const seen = new Set(local.map((f) => f.name.toLowerCase()));
      setResults([...local, ...found.filter((f) => !seen.has(f.name.toLowerCase()))]);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      if (local.length === 0) setSearchError((err as Error).message);
    } finally {
      if (abortRef.current === controller) setIsSearching(false);
    }
  };

  const choose = (option: FoodOption) => {
    const start = option.source === "barcode" && option.portions?.length ? { quantity: 1, unit: 0 } : defaultAmount(option);
    setSelected(option);
    setAmount(start);
    setQtyText(String(start.quantity));
  };

  // A scanned product shows up in the search list, already selected, ready to add
  const handleBarcode = async (code: string) => {
    setLookingUp(true);
    setScanError(null);
    try {
      const product = await lookupBarcode(code);
      setResults([product]);
      setHasSearched(true);
      setSearchError(null);
      setQuery("");
      choose(product);
      setTab("search");
    } catch (err) {
      setScanError(err instanceof BarcodeLookupError ? err.message : "Something went wrong looking up that barcode.");
    } finally {
      setLookingUp(false);
    }
  };

  const preview = selected && amount.quantity > 0 ? applyAmount(selected, amount) : null;

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

  const saveMany = async (foods: NewFood[]) => {
    setIsSaving(true);
    try {
      if (onAddFoods) {
        const ok = await onAddFoods(foods);
        if (ok === false) return;
      } else {
        for (const f of foods) await onAddFood(f);
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSelected = () => {
    if (!selected || !preview) return;
    save({ id: `${selected.key}-${Date.now()}`, name: selected.name, ...preview });
  };

  const handleQuickAdd = async () => {
    if (!quickValid) return;
    const num = (v: string) => {
      const n = parseFloat(v);
      return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : 0;
    };
    const food = {
      name: quick.name.trim(),
      calories: Math.round(quickCalories),
      protein: num(quick.protein),
      carbs: num(quick.carbs),
      fat: num(quick.fat),
      servingSize: quick.serving.trim() || "1 serving",
    };
    if (saveQuick) {
      try {
        await saveFood({
          name: food.name,
          servingLabel: food.servingSize,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          isRecipe: false,
        });
      } catch (err) {
        toast({ variant: "destructive", title: "Couldn't save to My foods", description: (err as Error).message });
      }
    }
    save({ id: `custom-${Date.now()}`, ...food });
  };

  const listToShow = hasSearched || searchError ? results : recentFoods;
  const showingRecents = !hasSearched && !searchError && recentFoods.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add food to {mealType}</DialogTitle>
          <DialogDescription>Search, describe your meal in words, pick from your own foods, or scan a barcode.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={changeTab}>
          <TabsList className="grid h-auto w-full grid-cols-5">
            <TabsTrigger value="search" className="px-1 text-xs sm:text-sm">
              Search
            </TabsTrigger>
            <TabsTrigger value="describe" className="px-1 text-xs sm:text-sm">
              Describe
            </TabsTrigger>
            <TabsTrigger value="mine" className="px-1 text-xs sm:text-sm">
              My foods
            </TabsTrigger>
            <TabsTrigger value="scan" className="px-1 text-xs sm:text-sm">
              Scan
            </TabsTrigger>
            <TabsTrigger value="quick" className="px-1 text-xs sm:text-sm">
              Quick add
            </TabsTrigger>
          </TabsList>

          <TabsContent value="describe" className="space-y-3">
            {tab === "describe" && (
              <DescribeMeal mine={mine} onConfirm={saveMany} busy={isSaving} autoFocus />
            )}
          </TabsContent>

          <TabsContent value="mine" className="space-y-3">
            {tab === "mine" && <MyFoods onAdd={save} isSaving={isSaving} />}
          </TabsContent>

          <TabsContent value="scan" className="space-y-3">
            {tab === "scan" && <BarcodeScanner onCode={handleBarcode} busy={lookingUp} error={scanError} />}
          </TabsContent>

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
                  <Button variant="link" className="block mx-auto" onClick={() => changeTab("quick")}>
                    Use Quick add instead
                  </Button>
                </div>
              ) : listToShow.length > 0 ? (
                <div className="divide-y divide-border">
                  {listToShow.map((food) => {
                    const tag = sourceLabel(food);
                    return (
                      <button
                        type="button"
                        key={food.key}
                        className={`w-full text-left p-3 hover:bg-muted transition-colors ${
                          selected?.key === food.key ? "bg-muted" : ""
                        }`}
                        onClick={() => choose(food)}
                      >
                        <div className="font-medium flex items-center gap-2">
                          <span className="truncate">{food.name}</span>
                          {tag && tag !== "Recent" && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {tag}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex justify-between gap-2">
                          <span className="truncate">
                            {food.unit === "g"
                              ? food.portions?.[0]
                                ? `${food.portions[0].label} (${Math.round(food.portions[0].grams)} g)`
                                : `per ${food.baseAmount} g`
                              : food.servingLabel || "1 serving"}
                            {food.detail && food.source !== "mine" ? ` · ${food.detail}` : ""}
                          </span>
                          <span className="shrink-0">
                            {Math.round(
                              food.unit === "g" && food.portions?.[0]
                                ? (food.calories * food.portions[0].grams) / food.baseAmount
                                : food.calories
                            )}{" "}
                            kcal
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {isSearching && (
                    <div className="flex items-center justify-center gap-2 p-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching more foods...
                    </div>
                  )}
                </div>
              ) : isSearching ? (
                <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </div>
              ) : (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {hasSearched ? (
                    <>
                      No foods found for "{query}".
                      <Button
                        variant="link"
                        className="block mx-auto"
                        onClick={() => {
                          setQuick({ ...emptyQuickAdd, name: query });
                          changeTab("quick");
                        }}
                      >
                        Quick add "{query}"
                      </Button>
                    </>
                  ) : (
                    <>
                      Type a food and press Search.
                      <Button variant="link" className="block mx-auto" onClick={() => changeTab("describe")}>
                        Or describe your whole meal in words
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {selected && (
              <div className="border rounded-md p-4 bg-muted/50 space-y-3">
                <div className="font-medium">{selected.name}</div>
                <AmountPicker
                  id="amount"
                  option={selected}
                  amount={amount}
                  text={qtyText}
                  onChange={(t, a) => {
                    setQtyText(t);
                    setAmount(a);
                  }}
                />
                {preview && (
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="font-semibold">{preview.calories}</span> kcal
                    </div>
                    <div className="text-muted-foreground">P {preview.protein}g</div>
                    <div className="text-muted-foreground">C {preview.carbs}g</div>
                    <div className="text-muted-foreground">F {preview.fat}g</div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
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
                <Input
                  id="qa-cal"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={quick.calories}
                  onChange={(e) => setQuick({ ...quick, calories: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qa-serving">Serving</Label>
                <Input
                  id="qa-serving"
                  placeholder="e.g. 1 plate"
                  value={quick.serving}
                  onChange={(e) => setQuick({ ...quick, serving: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(["protein", "carbs", "fat"] as const).map((k) => (
                <div className="space-y-1" key={k}>
                  <Label htmlFor={`qa-${k}`} className="capitalize">
                    {k} (g)
                  </Label>
                  <Input
                    id={`qa-${k}`}
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={quick[k]}
                    onChange={(e) => setQuick({ ...quick, [k]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="qa-save" checked={saveQuick} onCheckedChange={(v) => setSaveQuick(v === true)} />
              <Label htmlFor="qa-save" className="font-normal">
                Also save to My foods for next time
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">Only the name and calories are required.</p>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
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
