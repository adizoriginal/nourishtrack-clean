// Turning meal reminders on and off for this device.
import { supabase } from "@/integrations/supabase/client";
import { isIOS, isStandalone } from "./pwa";

export interface ReminderTimes {
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
}

export const DEFAULT_TIMES: ReminderTimes = { breakfast: "09:00", lunch: "13:30", dinner: "20:00" };

export type PushSupport =
  | "supported"
  | "ios-needs-install" // iPhone/iPad: only works after adding to the home screen
  | "unsupported";

export function pushSupport(): PushSupport {
  if (typeof window === "undefined") return "unsupported";
  const hasApis = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (isIOS() && !isStandalone()) return "ios-needs-install";
  return hasApis ? "supported" : "unsupported";
}

export const notificationPermission = (): NotificationPermission | "unsupported" =>
  typeof Notification === "undefined" ? "unsupported" : Notification.permission;

const urlBase64ToUint8Array = (base64: string) => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

export const timeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

async function functionError(error: unknown, fallback: string) {
  try {
    const body = await (error as { context?: Response })?.context?.json?.();
    if (body?.error) return body.error as string;
  } catch {
    /* ignore */
  }
  return fallback;
}

const tableMissing = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "42P01" || error.code === "PGRST205" || /reminder_settings|push_subscriptions/.test(error.message || ""));

async function registration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  return navigator.serviceWorker.register("/sw.js");
}

/** Is this device currently subscribed? */
export async function deviceSubscribed(): Promise<boolean> {
  if (pushSupport() !== "supported") return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return !!(await reg?.pushManager.getSubscription());
  } catch {
    return false;
  }
}

export async function loadReminderTimes(userId: string): Promise<{ times: ReminderTimes; enabled: boolean } | null> {
  const { data, error } = await supabase
    .from("reminder_settings")
    .select("enabled,breakfast_time,lunch_time,dinner_time")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    enabled: data.enabled,
    times: { breakfast: data.breakfast_time, lunch: data.lunch_time, dinner: data.dinner_time },
  };
}

export async function saveReminderTimes(userId: string, times: ReminderTimes, enabled = true) {
  const { error } = await supabase.from("reminder_settings").upsert(
    {
      user_id: userId,
      enabled,
      timezone: timeZone(),
      breakfast_time: times.breakfast,
      lunch_time: times.lunch,
      dinner_time: times.dinner,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw new Error(tableMissing(error) ? "Reminders aren't set up on the server yet." : error.message);
}

/** Ask permission, subscribe this device and save the times */
export async function enableReminders(userId: string, times: ReminderTimes) {
  if (pushSupport() !== "supported") throw new Error("This browser can't show reminders.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error(
      permission === "denied"
        ? "Notifications are blocked for this site. Allow them in your browser settings, then try again."
        : "You'll need to allow notifications to get reminders."
    );
  }

  const { data, error } = await supabase.functions.invoke("push-config", { body: { action: "key" } });
  if (error || !data?.publicKey) {
    throw new Error(await functionError(error, "Reminders aren't available right now. Please try again later."));
  }

  const reg = await registration();
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    try {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      });
    } catch {
      throw new Error(
        "This browser couldn't turn on notifications. If you're in a private or incognito window, try a normal one."
      );
    }
  }
  const json = sub.toJSON();
  const { error: subError } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
      user_agent: navigator.userAgent.slice(0, 200),
    },
    { onConflict: "endpoint" }
  );
  if (subError) throw new Error(tableMissing(subError) ? "Reminders aren't set up on the server yet." : subError.message);

  await saveReminderTimes(userId, times, true);
}

/** Stop reminders on this device (and pause them if no other device has them) */
export async function disableReminders(userId: string) {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint).eq("user_id", userId);
      await sub.unsubscribe();
    }
  } catch {
    /* already gone */
  }
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (!count) {
    await supabase.from("reminder_settings").update({ enabled: false }).eq("user_id", userId);
  }
}

export async function sendTestReminder(): Promise<number> {
  const { data, error } = await supabase.functions.invoke("push-config", { body: { action: "test" } });
  if (error) throw new Error(await functionError(error, "Couldn't send a test reminder."));
  return Number(data?.sent) || 0;
}
