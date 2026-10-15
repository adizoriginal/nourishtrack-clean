-- Vitamins, minerals, fibre, sugar etc. for each logged food. Safe to run more than once.
ALTER TABLE public.food_entries ADD COLUMN IF NOT EXISTS nutrients JSONB;
NOTIFY pgrst, 'reload schema';
