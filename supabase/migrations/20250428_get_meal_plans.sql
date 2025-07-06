
-- Create a function to get meal plans
CREATE OR REPLACE FUNCTION public.get_meal_plans()
RETURNS SETOF json AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'id', mp.id,
    'name', mp.name,
    'description', mp.description,
    'meal_type', mp.meal_type,
    'calories', mp.calories,
    'protein', mp.protein,
    'carbs', mp.carbs,
    'fats', mp.fats
  )
  FROM public.meal_plans mp
  WHERE mp.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
