-- Meal reminders (notifications). Safe to run more than once.

-- 1. Which devices can receive notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (user_id);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 2. Each person's reminder times
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  breakfast_time TEXT CHECK (breakfast_time IS NULL OR breakfast_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  lunch_time TEXT CHECK (lunch_time IS NULL OR lunch_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  dinner_time TEXT CHECK (dinner_time IS NULL OR dinner_time ~ '^[0-2][0-9]:[0-5][0-9]$'),
  last_sent JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'push_subscriptions' AND policyname = 'Users manage their own devices') THEN
    CREATE POLICY "Users manage their own devices" ON public.push_subscriptions
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reminder_settings' AND policyname = 'Users manage their own reminders') THEN
    CREATE POLICY "Users manage their own reminders" ON public.reminder_settings
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 3. Server-only secrets (no policies = nobody but the server can read them)
CREATE TABLE IF NOT EXISTS public.app_secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;
INSERT INTO public.app_secrets (name, value)
VALUES ('cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
ON CONFLICT (name) DO NOTHING;

-- 4. Check for reminders to send every 15 minutes
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nourishtrack-reminders') THEN
    PERFORM cron.unschedule('nourishtrack-reminders');
  END IF;
END $$;

SELECT cron.schedule(
  'nourishtrack-reminders',
  '*/15 * * * *',
  $job$
  SELECT net.http_post(
    url := 'https://fgmibebjtylyhzqgczfc.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT value FROM public.app_secrets WHERE name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $job$
);

NOTIFY pgrst, 'reload schema';
