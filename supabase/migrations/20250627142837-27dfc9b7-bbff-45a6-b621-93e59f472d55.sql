
-- Update the meal_plans table to allow 'snacks' as a meal type
ALTER TABLE meal_plans DROP CONSTRAINT IF EXISTS meal_plans_meal_type_check;

-- Add new constraint that includes snacks
ALTER TABLE meal_plans ADD CONSTRAINT meal_plans_meal_type_check 
  CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks'));
