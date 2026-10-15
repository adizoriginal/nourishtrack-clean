import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getVapidKeys, sendToUser } from "../_shared/push.ts";

// { action: "key" }  -> the public key browsers need to turn on notifications
// { action: "test" } -> send a test notification to the signed-in user's devices

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) return json({ error: "Please sign in again" }, 401);

    const body = await req.json().catch(() => ({}));
    if (body?.action === "test") {
      const sent = await sendToUser(admin, authData.user.id, {
        title: "Reminders are on 🎉",
        body: "This is what a NourishTrack reminder looks like.",
        url: "/food-diary",
        tag: "test",
      });
      return json({ sent });
    }

    const keys = await getVapidKeys(admin);
    return json({ publicKey: keys.publicKey });
  } catch (error) {
    console.error("push-config error:", (error as Error).message);
    const missing = /app_secrets|push_subscriptions/.test((error as Error).message);
    return json({ error: missing ? "Reminders aren't set up on the server yet." : "Something went wrong." }, 500);
  }
});
