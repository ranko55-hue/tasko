import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ביטול / חידוש מנוי — גישה נשמרת עד סוף התקופה, אז נעילה (בקרון).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw { status: 401, message: "missing_auth" };
    const anon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anon.auth.getUser();
    if (!user) throw { status: 401, message: "invalid_token" };
    const { data: me } = await anon.from("org_members")
      .select("org_id, role").eq("auth_user_id", user.id).eq("is_active", true)
      .eq("role", "admin").maybeSingle();
    if (!me) throw { status: 403, message: "admin_only" };

    const { action } = await req.json();
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const patch = action === "resume"
      ? { cancel_at_period_end: false, canceled_at: null }
      : { cancel_at_period_end: true, canceled_at: new Date().toISOString() };
    await admin.from("subscriptions").update(patch).eq("org_id", me.org_id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "internal_error" }), {
      status: err.status ?? 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
