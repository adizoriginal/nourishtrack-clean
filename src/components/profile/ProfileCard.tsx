import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppContext } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

export const ProfileCard = () => {
  const { profile, updateProfile, isLoading } = useAppContext();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Local state for form data
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'age' || field === 'height' || field === 'weight' || 
               field === 'calorieGoal' || field === 'proteinGoal' || 
               field === 'carbsGoal' || field === 'fatGoal' ? 
               Number(value) : value
    }));
  };

  const handleDietaryPreferenceChange = (preference: string, checked: boolean) => {
    setFormData(prev => {
      const currentPreferences = prev.dietaryPreferences || [];
      if (checked) {
        return {
          ...prev,
          dietaryPreferences: [...currentPreferences.filter(p => p !== preference), preference]
        };
      } else {
        return {
          ...prev,
          dietaryPreferences: currentPreferences.filter(p => p !== preference)
        };
      }
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    
    try {
      await updateProfile(formData);
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dietaryOptions = [
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'ketogenic', label: 'Ketogenic' },
    { id: 'paleo', label: 'Paleo' },
    { id: 'gluten-free', label: 'Gluten Free' },
    { id: 'dairy-free', label: 'Dairy Free' },
    { id: 'low-sodium', label: 'Low Sodium' },
    { id: 'diabetic', label: 'Diabetic Friendly' }
  ];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="personal">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="dietary">Dietary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input 
                  id="age" 
                  type="number" 
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select 
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input 
                  id="height" 
                  type="number" 
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input 
                  id="weight" 
                  type="number" 
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level</Label>
              <Select 
                value={formData.activityLevel}
                onValueChange={(value) => handleInputChange('activityLevel', value)}
              >
                <SelectTrigger id="activity">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="light">Lightly Active</SelectItem>
                  <SelectItem value="moderate">Moderately Active</SelectItem>
                  <SelectItem value="active">Very Active</SelectItem>
                  <SelectItem value="extreme">Extremely Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          <TabsContent value="goals" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="goal">Weight Goal</Label>
              <Select 
                value={formData.weightGoal}
                onValueChange={(value) => handleInputChange('weightGoal', value)}
              >
                <SelectTrigger id="goal">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose">Lose Weight</SelectItem>
                  <SelectItem value="maintain">Maintain Weight</SelectItem>
                  <SelectItem value="gain">Gain Weight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="calories">Daily Calorie Goal</Label>
              <Input 
                id="calories" 
                type="number" 
                value={formData.calorieGoal}
                onChange={(e) => handleInputChange('calorieGoal', e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input 
                  id="protein" 
                  type="number" 
                  value={formData.proteinGoal}
                  onChange={(e) => handleInputChange('proteinGoal', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input 
                  id="carbs" 
                  type="number" 
                  value={formData.carbsGoal}
                  onChange={(e) => handleInputChange('carbsGoal', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fat">Fat (g)</Label>
                <Input 
                  id="fat" 
                  type="number" 
                  value={formData.fatGoal}
                  onChange={(e) => handleInputChange('fatGoal', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="dietary" className="space-y-4 mt-4">
            <div className="space-y-4">
              <Label className="text-base font-medium">Dietary Preferences</Label>
              <div className="grid grid-cols-1 gap-3">
                {dietaryOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={(formData.dietaryPreferences || []).includes(option.id)}
                      onCheckedChange={(checked) => 
                        handleDietaryPreferenceChange(option.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={option.id} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These preferences will be used when generating personalized meal recommendations.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSave}
          disabled={isUpdating}
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>
    </Card>
  );
};
