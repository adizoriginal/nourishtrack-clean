// Sending phone/browser notifications (Web Push). Keys are created once and kept in app_secrets.
import webpush from "npm:web-push@3.6.7";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const SUBJECT = "mailto:nourishtrackapp@gmail.com";

export interface PushMessage {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** The app's notification keys, created the first time they're needed */
export async function getVapidKeys(admin: SupabaseClient) {
  const { data, error } = await admin.from("app_secrets").select("name,value").in("name", ["vapid_public", "vapid_private"]);
  if (error) throw new Error(`app_secrets: ${error.message}`);
  const pub = data?.find((r) => r.name === "vapid_public")?.value;
  const priv = data?.find((r) => r.name === "vapid_private")?.value;
  if (pub && priv) return { publicKey: pub, privateKey: priv };

  const keys = webpush.generateVAPIDKeys();
  // ignoreDuplicates: if two requests race, keep whichever was saved first
  await admin.from("app_secrets").upsert(
    [
      { name: "vapid_public", value: keys.publicKey },
      { name: "vapid_private", value: keys.privateKey },
    ],
    { onConflict: "name", ignoreDuplicates: true }
  );
  return (await getVapidKeysNoCreate(admin)) ?? keys;
}

async function getVapidKeysNoCreate(admin: SupabaseClient) {
  const { data } = await admin.from("app_secrets").select("name,value").in("name", ["vapid_public", "vapid_private"]);
  const pub = data?.find((r) => r.name === "vapid_public")?.value;
  const priv = data?.find((r) => r.name === "vapid_private")?.value;
  return pub && priv ? { publicKey: pub, privateKey: priv } : null;
}

/** Send one message to all of a user's devices. Returns how many got it. Removes devices that unsubscribed. */
export async function sendToUser(admin: SupabaseClient, userId: string, message: PushMessage): Promise<number> {
  const keys = await getVapidKeys(admin);
  const { data: subs, error } = await admin
    .from("push_subscriptions")
    .select("id,endpoint,p256dh,auth")
    .eq("user_id", userId);
  if (error) throw new Error(`push_subscriptions: ${error.message}`);

  let sent = 0;
  for (const sub of (subs ?? []) as SubscriptionRow[]) {
    try {
      const req = webpush.generateRequestDetails(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(message),
        { TTL: 60 * 60 * 4, urgency: "normal", vapidDetails: { subject: SUBJECT, ...keys } }
      );
      const res = await fetch(req.endpoint, { method: req.method, headers: req.headers as HeadersInit, body: req.body });
      if (res.status === 404 || res.status === 410) {
        // That browser/phone no longer accepts notifications
        await admin.from("push_subscriptions").delete().eq("id", sub.id);
      } else if (res.ok) {
        sent++;
      } else {
        console.error("Push failed", res.status, (await res.text()).slice(0, 200));
      }
    } catch (err) {
      console.error("Push error", (err as Error).message);
    }
  }
  return sent;
}
