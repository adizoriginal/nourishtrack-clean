import { useState } from "react";
import { ArrowLeft, BookOpen, ChefHat, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CustomFood, CustomFoodInput, RecipeIngredient, customFoodToOption, useCustomFoods } from "@/hooks/useCustomFoods";
import { Amount, applyAmount } from "@/lib/foodSearch";
import { AmountPicker } from "./AmountPicker";
import { DescribeMeal } from "./DescribeMeal";
import type { NewFood } from "./AddFoodModal";

interface MyFoodsProps {
  onAdd: (food: NewFood) => Promise<void> | void;
  isSaving?: boolean;
}

type View = { kind: "list" } | { kind: "food"; food?: CustomFood } | { kind: "recipe"; food?: CustomFood };

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Your own foods and recipes: add them in one tap, create, edit and delete them */
export const MyFoods = ({ onAdd, isSaving }: MyFoodsProps) => {
  const { foods, options, isLoading, saveFood, deleteFood } = useCustomFoods();
  const { toast } = useToast();
  const [view, setView] = useState<View>({ kind: "list" });
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState<Amount>({ quantity: 1, unit: "serving" });
  const [qtyText, setQtyText] = useState("1");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const save = async (food: CustomFoodInput) => {
    try {
      const saved = await saveFood(food);
      toast({ title: food.id ? "Saved" : `${food.name} saved to My foods` });
      setView({ kind: "list" });
      if (saved) {
        setSelectedId(saved.id);
        setAmount({ quantity: 1, unit: "serving" });
        setQtyText("1");
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't save", description: (err as Error).message });
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteFood(id);
      if (selectedId === id) setSelectedId(null);
      setConfirmDelete(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Couldn't delete", description: (err as Error).message });
    }
  };

  if (view.kind === "food") {
    return <FoodForm initial={view.food} onCancel={() => setView({ kind: "list" })} onSave={save} />;
  }
  if (view.kind === "recipe") {
    return <RecipeForm initial={view.food} mine={options} onCancel={() => setView({ kind: "list" })} onSave={save} />;
  }

  const q = filter.trim().toLowerCase();
  const shown = q ? foods.filter((f) => f.name.toLowerCase().includes(q)) : foods;
  const selected = foods.find((f) => f.id === selectedId) ?? null;
  const selectedOption = selected ? customFoodToOption(selected) : null;
  const preview = selectedOption && amount.quantity > 0 ? applyAmount(selectedOption, amount) : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={() => setView({ kind: "food" })}>
          <Plus className="h-4 w-4 mr-1" /> New food
        </Button>
        <Button type="button" variant="outline" onClick={() => setView({ kind: "recipe" })}>
          <ChefHat className="h-4 w-4 mr-1" /> New recipe
        </Button>
      </div>

      {foods.length > 6 && (
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Find in my foods" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
      )}

      <div className="max-h-[260px] overflow-y-auto rounded-md border">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Loading your foods...</p>
        ) : foods.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground space-y-1">
            <BookOpen className="mx-auto h-6 w-6 mb-2" />
            <p className="font-medium text-foreground">Save foods you eat often</p>
            <p>Add a home-cooked dish or a recipe once, then log it in one tap any time.</p>
          </div>
        ) : shown.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nothing matches "{filter}".</p>
        ) : (
          <ul className="divide-y">
            {shown.map((food) => (
              <li key={food.id} className={cn("flex items-center gap-1 pr-1", selectedId === food.id && "bg-muted")}>
                {confirmDelete === food.id ? (
                  <div className="flex flex-1 items-center justify-between gap-2 p-3 text-sm">
                    <span>Delete "{food.name}"?</span>
                    <span className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(null)}>
                        Keep
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(food.id)}>
                        Delete
                      </Button>
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="min-w-0 flex-1 p-3 text-left hover:bg-muted/60"
                      onClick={() => {
                        setSelectedId(food.id);
                        setAmount({ quantity: 1, unit: "serving" });
                        setQtyText("1");
                      }}
                    >
                      <div className="font-medium truncate">{food.name}</div>
                      <div className="text-sm text-muted-foreground flex justify-between gap-2">
                        <span className="truncate">
                          {food.isRecipe ? `Recipe · makes ${food.servings ?? 1}` : food.servingLabel}
                        </span>
                        <span className="shrink-0">{Math.round(food.calories)} kcal</span>
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={`Edit ${food.name}`}
                      onClick={() => setView({ kind: food.isRecipe ? "recipe" : "food", food })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${food.name}`}
                      onClick={() => setConfirmDelete(food.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && selectedOption && (
        <div className="space-y-3 rounded-md border bg-muted/50 p-4">
          <div className="font-medium">{selected.name}</div>
          <AmountPicker
            option={selectedOption}
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
          <Button
            className="w-full"
            disabled={!preview || isSaving}
            onClick={() => preview && onAdd({ id: `mine-${selected.id}-${Date.now()}`, name: selected.name, ...preview })}
          >
            {isSaving ? "Adding..." : "Add food"}
          </Button>
        </div>
      )}
    </div>
  );
};

// ---- New / edit food ----

interface FoodFormProps {
  initial?: CustomFood;
  onCancel: () => void;
  onSave: (food: CustomFoodInput) => Promise<void>;
}

const numberOrZero = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const FoodForm = ({ initial, onCancel, onSave }: FoodFormProps) => {
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    serving: initial?.servingLabel ?? "1 serving",
    calories: initial ? String(initial.calories) : "",
    protein: initial ? String(initial.protein) : "",
    carbs: initial ? String(initial.carbs) : "",
    fat: initial ? String(initial.fat) : "",
  });
  const [saving, setSaving] = useState(false);
  const calories = parseFloat(form.calories);
  const valid = form.name.trim().length > 0 && Number.isFinite(calories) && calories >= 0;

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        setSaving(true);
        await onSave({
          id: initial?.id,
          name: form.name.trim(),
          servingLabel: form.serving.trim() || "1 serving",
          calories: round1(calories),
          protein: round1(numberOrZero(form.protein)),
          carbs: round1(numberOrZero(form.carbs)),
          fat: round1(numberOrZero(form.fat)),
          isRecipe: false,
        });
        setSaving(false);
      }}
    >
      <BackHeader title={initial ? "Edit food" : "New food"} onBack={onCancel} />
      <div className="space-y-1">
        <Label htmlFor="mf-name">Food name *</Label>
        <Input
          id="mf-name"
          placeholder="e.g. Mum's jollof rice"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="mf-serving">One serving is</Label>
          <Input id="mf-serving" placeholder="e.g. 1 plate" value={form.serving} onChange={(e) => setForm({ ...form, serving: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="mf-cal">Calories (kcal) *</Label>
          <Input
            id="mf-cal"
            type="number"
            inputMode="decimal"
            min={0}
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(["protein", "carbs", "fat"] as const).map((k) => (
          <div className="space-y-1" key={k}>
            <Label htmlFor={`mf-${k}`} className="capitalize">
              {k} (g)
            </Label>
            <Input
              id={`mf-${k}`}
              type="number"
              inputMode="decimal"
              min={0}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Nutrition is for one serving. Only the name and calories are required.</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!valid || saving}>
          {saving ? "Saving..." : "Save food"}
        </Button>
      </div>
    </form>
  );
};

// ---- New / edit recipe ----

interface RecipeFormProps {
  initial?: CustomFood;
  mine: ReturnType<typeof useCustomFoods>["options"];
  onCancel: () => void;
  onSave: (food: CustomFoodInput) => Promise<void>;
}

const RecipeForm = ({ initial, mine, onCancel, onSave }: RecipeFormProps) => {
  const [name, setName] = useState(initial?.name ?? "");
  const [servingsText, setServingsText] = useState(String(initial?.servings ?? 4));
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(initial?.ingredients ?? []);
  const [adding, setAdding] = useState((initial?.ingredients ?? []).length === 0);
  const [describeKey, setDescribeKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const servings = parseFloat(servingsText);
  const servingsValid = Number.isFinite(servings) && servings > 0 && servings <= 100;
  const total = ingredients.reduce(
    (t, i) => ({
      calories: t.calories + i.calories,
      protein: t.protein + i.protein,
      carbs: t.carbs + i.carbs,
      fat: t.fat + i.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  const per = servingsValid
    ? {
        calories: Math.round(total.calories / servings),
        protein: round1(total.protein / servings),
        carbs: round1(total.carbs / servings),
        fat: round1(total.fat / servings),
      }
    : null;
  const valid = name.trim().length > 0 && ingredients.length > 0 && !!per;

  return (
    <div className="space-y-3">
      <BackHeader title={initial ? "Edit recipe" : "New recipe"} onBack={onCancel} />
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1">
          <Label htmlFor="rc-name">Recipe name *</Label>
          <Input id="rc-name" placeholder="e.g. Chicken stew" value={name} onChange={(e) => setName(e.target.value)} autoFocus={!initial} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="rc-servings">Servings</Label>
          <Input
            id="rc-servings"
            type="number"
            inputMode="decimal"
            min={1}
            className="w-20"
            value={servingsText}
            onChange={(e) => setServingsText(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Ingredients {ingredients.length > 0 && `(${ingredients.length})`}</div>
        {ingredients.length > 0 && (
          <ul className="divide-y rounded-md border text-sm">
            {ingredients.map((ing, idx) => (
              <li key={`${ing.name}-${idx}`} className="flex items-center gap-2 p-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate">{ing.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{ing.amount}</div>
                </div>
                <span className="shrink-0 tabular-nums">{Math.round(ing.calories)} kcal</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label={`Remove ${ing.name}`}
                  onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {adding ? (
          <div className="rounded-md border border-dashed p-3">
            <DescribeMeal
              key={describeKey}
              mine={mine}
              placeholder="e.g. 500g chicken thighs, 2 cups rice, 1 onion, 2 tomatoes, 2 tbsp oil"
              hint="List everything that goes into the whole recipe, with amounts."
              confirmLabel={(n) => (n === 1 ? "Add 1 ingredient" : `Add ${n} ingredients`)}
              onConfirm={(foods) => {
                setIngredients((prev) => [
                  ...prev,
                  ...foods.map((f) => ({
                    name: f.name,
                    amount: f.servingSize,
                    calories: f.calories,
                    protein: f.protein,
                    carbs: f.carbs,
                    fat: f.fat,
                  })),
                ]);
                setDescribeKey((k) => k + 1);
                setAdding(false);
              }}
            />
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add ingredients
          </Button>
        )}
      </div>

      {ingredients.length > 0 && per && (
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Whole recipe</span>
            <span className="tabular-nums">{Math.round(total.calories).toLocaleString()} kcal</span>
          </div>
          <div className="mt-1 flex justify-between font-medium">
            <span>Per serving</span>
            <span className="tabular-nums">{per.calories} kcal</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Protein {per.protein}g · Carbs {per.carbs}g · Fat {per.fat}g
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!valid || saving}
          onClick={async () => {
            if (!valid || !per) return;
            setSaving(true);
            await onSave({
              id: initial?.id,
              name: name.trim(),
              servingLabel: "1 serving",
              ...per,
              isRecipe: true,
              ingredients,
              servings: round1(servings),
            });
            setSaving(false);
          }}
        >
          {saving ? "Saving..." : "Save recipe"}
        </Button>
      </div>
    </div>
  );
};

const BackHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <div className="flex items-center gap-2">
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onBack} aria-label="Back to my foods">
      <ArrowLeft className="h-4 w-4" />
    </Button>
    <span className="font-medium">{title}</span>
  </div>
);
