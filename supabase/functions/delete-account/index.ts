import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Permanently deletes the signed-in user's account and all their data.
// It only ever deletes the account belonging to the login token sent with the request.

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
    const body = await req.json().catch(() => ({}));
    if (body?.confirm !== "DELETE") return json({ error: "Confirmation missing" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) return json({ error: "Server not configured" }, 500);

    const admin = createClient(supabaseUrl, serviceKey);

    // Who is asking? Taken from their login token, never from the request body.
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData?.user) return json({ error: "Please sign in again" }, 401);
    const userId = authData.user.id;

    // Remove their data first (some tables don't delete automatically with the account)
    for (const table of ["food_entries", "weight_entries", "water_entries", "meal_plans"]) {
      const { error } = await admin.from(table).delete().eq("user_id", userId);
      // A table that doesn't exist yet is fine to skip
      if (error && error.code !== "42P01" && error.code !== "PGRST205") {
        console.error(`Failed to delete from ${table}:`, error.message);
        return json({ error: "Couldn't delete your data. Please try again." }, 500);
      }
    }
    const { error: profileError } = await admin.from("profiles").delete().eq("id", userId);
    if (profileError) {
      console.error("Failed to delete profile:", profileError.message);
      return json({ error: "Couldn't delete your data. Please try again." }, 500);
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError.message);
      return json({ error: "Your data was deleted but the account couldn't be closed. Please contact support." }, 500);
    }

    return json({ success: true });
  } catch (error) {
    console.error("delete-account error:", (error as Error).message);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
