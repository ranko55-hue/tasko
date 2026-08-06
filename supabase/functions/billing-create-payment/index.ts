import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { createLowProfile } from "../_shared/cardcom.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APP_URL") ?? "https://tasko-gamma.vercel.app";

// אדמין הארגון פותח דף תשלום Cardcom (חיוב ראשון + שמירת טוקן).
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

    // הארגון + זהות האדמין נגזרים מהחברות — לא מהלקוח.
    const { data: me } = await anon.from("org_members")
      .select("org_id, full_name, email, phone, role")
      .eq("auth_user_id", user.id).eq("is_active", true).eq("role", "admin").maybeSingle();
    if (!me) throw { status: 403, message: "admin_only" };

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: amount } = await admin.rpc("billing_amount", { p_org: me.org_id });

    const lp = await createLowProfile({
      operation: "ChargeAndCreateToken",
      returnValue: `sub|${me.org_id}`,
      amount,
      successUrl: `${APP_URL}/settings?tab=billing&billing=success`,
      failedUrl: `${APP_URL}/settings?tab=billing&billing=failed`,
      webhookUrl: `${SUPABASE_URL}/functions/v1/billing-webhook`,
      productName: `מנוי Tasko — ${amount} ₪/חודש`,
      name: me.full_name,
      email: me.email ?? user.email,
      phone: me.phone,
      withDocument: true,
    });
    if (lp.ResponseCode !== 0 || !lp.Url) {
      throw { status: 502, message: lp.Description ?? "cardcom_error" };
    }

    await admin.from("subscriptions")
      .update({ cardcom_low_profile_code: String(lp.LowProfileId) })
      .eq("org_id", me.org_id);

    return new Response(JSON.stringify({ url: lp.Url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message ?? "internal_error" }), {
      status: err.status ?? 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
