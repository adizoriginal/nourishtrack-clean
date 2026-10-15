import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { sendToUser } from "../_shared/push.ts";

// Runs every 15 minutes (scheduled in the database). For each person with reminders on,
// if it's their reminder time and they haven't logged that meal today, send a notification.

type Meal = "breakfast" | "lunch" | "dinner";
const MEALS: Meal[] = ["breakfast", "lunch", "dinner"];
// A reminder goes out once, within this many minutes after its time
const WINDOW_MINUTES = 30;

const MESSAGES: Record<Meal, { title: string; body: string }> = {
  breakfast: { title: "Good morning ☀️", body: "What did you have for breakfast? Log it in a few seconds." },
  lunch: { title: "Lunch check-in 🍽️", body: "Haven't logged lunch yet. Tap to add it." },
  dinner: { title: "How was dinner? 🌙", body: "Log your dinner to keep your streak going." },
};

interface SettingsRow {
  user_id: string;
  timezone: string;
  breakfast_time: string | null;
  lunch_time: string | null;
  dinner_time: string | null;
  last_sent: Record<string, string> | null;
}

/** Today's date and minutes past midnight in someone's time zone */
function localNow(now: Date, timeZone: string) {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return localNow(now, "UTC");
  }
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

const toMinutes = (hhmm: string) => {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

serve(async (req) => {
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Only the database's scheduled job may call this
  const { data: secret } = await admin.from("app_secrets").select("value").eq("name", "cron_secret").maybeSingle();
  if (!secret?.value || req.headers.get("x-cron-secret") !== secret.value) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data, error } = await admin
    .from("reminder_settings")
    .select("user_id,timezone,breakfast_time,lunch_time,dinner_time,last_sent")
    .eq("enabled", true);
  if (error) {
    console.error("reminder_settings:", error.message);
    return new Response("Error", { status: 500 });
  }

  const now = new Date();
  let sent = 0;
  for (const s of (data ?? []) as SettingsRow[]) {
    const local = localNow(now, s.timezone || "UTC");
    const lastSent = { ...(s.last_sent ?? {}) };
    let changed = false;

    for (const meal of MEALS) {
      const at = s[`${meal}_time` as const];
      const target = at ? toMinutes(at) : null;
      if (target === null) continue;
      if (local.minutes < target || local.minutes >= target + WINDOW_MINUTES) continue;
      if (lastSent[meal] === local.date) continue;

      lastSent[meal] = local.date;
      changed = true;

      // Already logged this meal today? Then no need to remind.
      const { count } = await admin
        .from("food_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", s.user_id)
        .eq("entry_date", local.date)
        .eq("meal_type", meal);
      if ((count ?? 0) > 0) continue;

      sent += await sendToUser(admin, s.user_id, { ...MESSAGES[meal], url: "/food-diary", tag: `reminder-${meal}` });
    }

    if (changed) {
      await admin.from("reminder_settings").update({ last_sent: lastSent }).eq("user_id", s.user_id);
    }
  }

  return new Response(JSON.stringify({ checked: data?.length ?? 0, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
