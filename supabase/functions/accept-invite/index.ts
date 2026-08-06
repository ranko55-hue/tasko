import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const INVITE_EMAIL_DOMAIN = "invite.tasko.app";

// נרמול טלפון לפורמט בינלאומי — זהה ל-src/lib/waPhone.js.
function waPhone(p: string): string {
  let d = String(p || "").replace(/[^0-9+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "972" + d.slice(1);
  return d;
}

// מזהה התחברות: אימייל אמיתי אם יש, אחרת סינתטי מבוסס-טלפון.
function loginEmailFor(email: string | null, phone: string | null): string {
  const e = (email || "").trim().toLowerCase();
  if (e) return e;
  const p = waPhone(phone || "");
  return p ? `wa-${p}@${INVITE_EMAIL_DOMAIN}` : "";
}

// דף /welcome קורא לפונקציה הזו בלי session — האימות הוא הטוקן עצמו.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // כשלים "עסקיים" צפויים חוזרים כ-200 עם {error} כדי שהלקוח יקרא אותם ישירות;
  // 500 שמור לתקלות בלתי צפויות בלבד.
  const biz = (error: string) =>
    new Response(JSON.stringify({ error }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { token, password } = await req.json();
    if (!token || !password) return biz("missing_fields");
    if (String(password).length < 6) return biz("password_too_short");

    const { data: invite } = await admin
      .from("invites")
      .select("id, org_member_id, expires_at, used_at")
      .eq("token", token)
      .maybeSingle();
    if (!invite) return biz("invalid_token");
    if (invite.used_at) return biz("already_used");
    if (new Date(invite.expires_at).getTime() < Date.now()) return biz("expired");

    const { data: member } = await admin
      .from("org_members")
      .select("id, full_name, email, phone, auth_user_id")
      .eq("id", invite.org_member_id)
      .single();
    if (!member) return biz("member_not_found");
    if (member.auth_user_id) return biz("already_active");

    const loginEmail = loginEmailFor(member.email, member.phone);
    if (!loginEmail) return biz("no_login_identity");

    const { data: created, error: authErr } = await admin.auth.admin.createUser({
      email: loginEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: member.full_name },
    });
    if (authErr) {
      const msg = authErr.message?.includes("already been registered")
        ? "identity_taken"
        : authErr.message;
      throw { status: 500, message: msg };
    }

    // קישור החשבון לחבר + סימון ההזמנה כמומשה. אם הקישור נכשל — מנקים את
    // חשבון ה-auth כדי לא להשאיר יתום.
    const { error: linkErr } = await admin
      .from("org_members")
      .update({ auth_user_id: created.user.id })
      .eq("id", member.id);
    if (linkErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw { status: 500, message: linkErr.message };
    }

    await admin.from("invites").update({ used_at: new Date().toISOString() }).eq("id", invite.id);

    return new Response(
      JSON.stringify({ ok: true, login_email: loginEmail }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    const status = err.status ?? 500;
    const message = err.message ?? "internal_error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
