-- "My foods": foods and recipes people save themselves.
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS public.custom_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  serving_label TEXT NOT NULL DEFAULT '1 serving',
  calories NUMERIC(7,1) NOT NULL CHECK (calories >= 0),
  protein NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat NUMERIC(6,1) NOT NULL DEFAULT 0 CHECK (fat >= 0),
  -- For recipes: the ingredients and how many servings the whole recipe makes
  is_recipe BOOLEAN NOT NULL DEFAULT false,
  ingredients JSONB,
  servings NUMERIC(5,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_foods_user_idx ON public.custom_foods (user_id, name);

ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'custom_foods' AND policyname = 'Users manage their own custom foods') THEN
    CREATE POLICY "Users manage their own custom foods" ON public.custom_foods
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
