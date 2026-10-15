-- Remember each user's preferred units (kg/cm or lb/ft) across devices.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS units TEXT;

-- Store body weight with two decimals so pounds convert back exactly (it was whole kg only).
ALTER TABLE public.profiles ALTER COLUMN weight TYPE NUMERIC(6,2);

NOTIFY pgrst, 'reload schema';
