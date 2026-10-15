-- Keep the full recipe when a generated meal is saved, so it still shows in Profile > Saved Meal Plans.
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS ingredients JSONB;
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS instructions JSONB;
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS ready_in_minutes INTEGER;
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS servings INTEGER;
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Make sure each user can only see and change their own saved meals.
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meal_plans' AND policyname = 'Users can view their own meal plans') THEN
    CREATE POLICY "Users can view their own meal plans" ON public.meal_plans FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meal_plans' AND policyname = 'Users can create their own meal plans') THEN
    CREATE POLICY "Users can create their own meal plans" ON public.meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meal_plans' AND policyname = 'Users can delete their own meal plans') THEN
    CREATE POLICY "Users can delete their own meal plans" ON public.meal_plans FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Tell the API about the new columns straight away.
NOTIFY pgrst, 'reload schema';
