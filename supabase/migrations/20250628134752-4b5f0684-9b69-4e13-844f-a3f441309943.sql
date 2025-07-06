
-- Extend the profiles table with all the missing nutrition and personal info columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_goal TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS calorie_goal INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS protein_goal INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS carbs_goal INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fat_goal INTEGER;

-- Create food_entries table to store daily food logs
CREATE TABLE IF NOT EXISTS public.food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id TEXT NOT NULL,
  name TEXT NOT NULL,
  calories INTEGER NOT NULL,
  protein DOUBLE PRECISION NOT NULL,
  carbs DOUBLE PRECISION NOT NULL,
  fat DOUBLE PRECISION NOT NULL,
  serving_size TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snacks')),
  entry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS food_entries_user_date_idx ON public.food_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS food_entries_user_meal_type_idx ON public.food_entries(user_id, meal_type);

-- Enable RLS on food_entries table
ALTER TABLE public.food_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own food entries" ON public.food_entries;
    DROP POLICY IF EXISTS "Users can create their own food entries" ON public.food_entries;
    DROP POLICY IF EXISTS "Users can update their own food entries" ON public.food_entries;
    DROP POLICY IF EXISTS "Users can delete their own food entries" ON public.food_entries;
END $$;

-- Create RLS policies for food_entries
CREATE POLICY "Users can view their own food entries" 
  ON public.food_entries 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food entries" 
  ON public.food_entries 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food entries" 
  ON public.food_entries 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food entries" 
  ON public.food_entries 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Handle existing profile policies
DO $$ 
BEGIN
    -- Only create profile policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" 
          ON public.profiles 
          FOR SELECT 
          USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
          ON public.profiles 
          FOR UPDATE 
          USING (auth.uid() = id);
    END IF;
END $$;

-- Create function to get food entries for a specific date
CREATE OR REPLACE FUNCTION public.get_food_entries_for_date(target_date DATE)
RETURNS TABLE (
  id UUID,
  food_id TEXT,
  name TEXT,
  calories INTEGER,
  protein DOUBLE PRECISION,
  carbs DOUBLE PRECISION,
  fat DOUBLE PRECISION,
  serving_size TEXT,
  meal_type TEXT,
  entry_date DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fe.id,
    fe.food_id,
    fe.name,
    fe.calories,
    fe.protein,
    fe.carbs,
    fe.fat,
    fe.serving_size,
    fe.meal_type,
    fe.entry_date
  FROM public.food_entries fe
  WHERE fe.user_id = auth.uid() 
    AND fe.entry_date = target_date
  ORDER BY fe.created_at;
END;
$$;
