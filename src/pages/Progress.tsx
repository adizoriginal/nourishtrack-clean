
import { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { WeightChart } from "@/components/dashboard/WeightChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { displayWeight, toKg, weightUnitLabel } from "@/lib/units";

const Progress = () => {
  const { weightHistory, addWeightRecord, profile } = useAppContext();
  const [newWeight, setNewWeight] = useState<string>("");

  const units = profile.units;
  const unitLabel = weightUnitLabel(units);
  const show = (kg: number) => displayWeight(kg, units).toFixed(1);

  const handleAddWeight = () => {
    const value = parseFloat(newWeight);
    if (newWeight && !isNaN(value) && value > 0) {
      // Stored in kg (full precision, so pounds read back exactly)
      addWeightRecord(toKg(value, units));
      setNewWeight("");
    }
  };

  // Calculate stats
  let startWeight = 0;
  let currentWeight = 0;
  let weightChange = 0;
  let percentChange = 0;

  if (weightHistory.length > 0) {
    startWeight = weightHistory[0].weight;
    currentWeight = weightHistory[weightHistory.length - 1].weight;
    weightChange = currentWeight - startWeight;
    percentChange = startWeight > 0 ? (weightChange / startWeight) * 100 : 0;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Track Your Progress</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="nourish-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Starting Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weightHistory.length > 0 ? `${show(startWeight)} ${unitLabel}` : "Not logged"}
            </div>
            <div className="text-sm text-muted-foreground">
              {weightHistory.length > 0 ? weightHistory[0].date : "No data"}
            </div>
          </CardContent>
        </Card>
        
        <Card className="nourish-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weightHistory.length > 0 ? `${show(currentWeight)} ${unitLabel}` : "Not logged"}
            </div>
            <div className="text-sm text-muted-foreground">
              {weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].date : "No data"}
            </div>
          </CardContent>
        </Card>
        
        <Card className="nourish-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weight Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center">
              {weightHistory.length < 2 ? (
                "Not enough data"
              ) : weightChange === 0 ? (
                `0.0 ${unitLabel}`
              ) : weightChange < 0 ? (
                <>
                  <TrendingDown className="text-nourish-500 mr-1 h-5 w-5" />
                  {show(Math.abs(weightChange))} {unitLabel}
                </>
              ) : (
                <>
                  <TrendingUp className="text-destructive mr-1 h-5 w-5" />
                  +{show(weightChange)} {unitLabel}
                </>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {weightHistory.length >= 2 ? `${percentChange.toFixed(1)}% change` : "Log more weights to see progress"}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <WeightChart weightData={weightHistory} units={units} />
        
        <Card className="nourish-card">
          <CardHeader>
            <CardTitle>Log Today's Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label htmlFor="weight">Weight ({unitLabel})</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Enter weight"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
              </div>
              <Button onClick={handleAddWeight} disabled={!newWeight}>
                <Plus className="mr-2 h-4 w-4" />
                Add Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Progress;
