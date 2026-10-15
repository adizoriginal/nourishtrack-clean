-- Daily water intake, one row per user per day (counted in glasses).
CREATE TABLE IF NOT EXISTS public.water_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  glasses INTEGER NOT NULL DEFAULT 0 CHECK (glasses >= 0 AND glasses <= 50),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, entry_date)
);

ALTER TABLE public.water_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'water_entries' AND policyname = 'Users can view their own water') THEN
    CREATE POLICY "Users can view their own water" ON public.water_entries FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'water_entries' AND policyname = 'Users can add their own water') THEN
    CREATE POLICY "Users can add their own water" ON public.water_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'water_entries' AND policyname = 'Users can update their own water') THEN
    CREATE POLICY "Users can update their own water" ON public.water_entries FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
