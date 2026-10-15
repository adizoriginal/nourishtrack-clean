-- Each user's daily water goal (in glasses)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_goal INTEGER CHECK (water_goal IS NULL OR (water_goal >= 1 AND water_goal <= 30));

NOTIFY pgrst, 'reload schema';
