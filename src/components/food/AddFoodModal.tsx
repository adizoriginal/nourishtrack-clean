
import { useState } from "react";
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
import { Search } from "lucide-react";

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

// Sample food database
const foodDatabase: Food[] = [
  { id: "1", name: "Apple", calories: 95, protein: 0.5, carbs: 25, fat: 0.3, servingSize: "1 medium (182g)" },
  { id: "2", name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: "100g" },
  { id: "3", name: "Brown Rice", calories: 216, protein: 5, carbs: 45, fat: 1.8, servingSize: "1 cup cooked (195g)" },
  { id: "4", name: "Salmon", calories: 206, protein: 22, carbs: 0, fat: 13, servingSize: "100g" },
  { id: "5", name: "Broccoli", calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6, servingSize: "1 cup (91g)" },
  { id: "6", name: "Egg", calories: 78, protein: 6.3, carbs: 0.6, fat: 5.3, servingSize: "1 large (50g)" },
  { id: "7", name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0.4, servingSize: "170g" },
  { id: "8", name: "Banana", calories: 105, protein: 1.3, carbs: 27, fat: 0.4, servingSize: "1 medium (118g)" },
  { id: "9", name: "Almonds", calories: 164, protein: 6, carbs: 6, fat: 14, servingSize: "28g" },
  { id: "10", name: "Avocado", calories: 234, protein: 2.9, carbs: 12.5, fat: 21, servingSize: "1 medium (150g)" },
];

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFood: (food: Food) => void;
  mealType: string;
}

export const AddFoodModal = ({ isOpen, onClose, onAddFood, mealType }: AddFoodModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [servingCount, setServingCount] = useState(1);

  const filteredFoods = searchQuery
    ? foodDatabase.filter(food => 
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : foodDatabase;

  const handleAddFood = () => {
    if (selectedFood) {
      const foodWithAdjustedServings = {
        ...selectedFood,
        calories: Math.round(selectedFood.calories * servingCount),
        protein: parseFloat((selectedFood.protein * servingCount).toFixed(1)),
        carbs: parseFloat((selectedFood.carbs * servingCount).toFixed(1)),
        fat: parseFloat((selectedFood.fat * servingCount).toFixed(1)),
        id: `${selectedFood.id}-${Date.now()}` // Ensure unique ID
      };
      
      onAddFood(foodWithAdjustedServings);
      setSelectedFood(null);
      setServingCount(1);
      setSearchQuery("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Food to {mealType}</DialogTitle>
          <DialogDescription>
            Search for a food item or create a custom entry.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="h-[250px] overflow-y-auto border rounded-md">
          {filteredFoods.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className={`p-3 cursor-pointer hover:bg-muted transition-colors ${
                    selectedFood?.id === food.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedFood(food)}
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>{food.servingSize}</span>
                    <span>{food.calories} kcal</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              No foods found. Try a different search term.
            </div>
          )}
        </div>
        
        {selectedFood && (
          <div className="mt-4 border rounded-md p-4 bg-muted/50">
            <div className="flex justify-between mb-2">
              <span className="font-medium">{selectedFood.name}</span>
              <span>{selectedFood.calories} kcal / serving</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-sm text-muted-foreground mb-4">
              <div>Protein: {selectedFood.protein}g</div>
              <div>Carbs: {selectedFood.carbs}g</div>
              <div>Fat: {selectedFood.fat}g</div>
            </div>
            
            <div className="flex items-center gap-4">
              <Label htmlFor="servings">Servings:</Label>
              <Input
                id="servings"
                type="number"
                min="0.25"
                step="0.25"
                className="w-20"
                value={servingCount}
                onChange={(e) => setServingCount(parseFloat(e.target.value) || 1)}
              />
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAddFood} disabled={!selectedFood}>
            Add Food
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
