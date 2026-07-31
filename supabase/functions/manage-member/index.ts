import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw { status: 401, message: "missing_auth" };

    const anonClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) throw { status: 401, message: "invalid_token" };

    const body = await req.json();
    const { action } = body;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === "create") return await handleCreate(admin, anonClient, caller, body);
    if (action === "reset_password") return await handleResetPassword(admin, anonClient, caller, body);
    if (action === "toggle_active") return await handleToggleActive(admin, anonClient, caller, body);

    throw { status: 400, message: "unknown_action" };
  } catch (err: any) {
    const status = err.status ?? 500;
    const message = err.message ?? "internal_error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function requireAdmin(anonClient: any, callerId: string, orgId: string) {
  const { data: member } = await anonClient
    .from("org_members")
    .select("id, role")
    .eq("auth_user_id", callerId)
    .eq("org_id", orgId)
    .eq("is_active", true)
    .single();
  if (!member || member.role !== "admin") {
    throw { status: 403, message: "admin_only" };
  }
  return member;
}

async function handleCreate(
  admin: any,
  anonClient: any,
  caller: any,
  body: any,
) {
  const { org_id, full_name, email, password, phone, phone2, role, manager_id, gender } = body;
  if (!org_id || !full_name?.trim() || !email?.trim() || !password) {
    throw { status: 400, message: "missing_fields" };
  }
  if (password.length < 6) throw { status: 400, message: "password_too_short" };

  const adminMember = await requireAdmin(anonClient, caller.id, org_id);

  const { data: authUser, error: authErr } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
  });
  if (authErr) {
    if (authErr.message?.includes("already been registered")) {
      throw { status: 409, message: "email_exists" };
    }
    throw { status: 500, message: authErr.message };
  }

  const { data: member, error: memErr } = await admin
    .from("org_members")
    .insert({
      org_id,
      auth_user_id: authUser.user.id,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      phone2: phone2?.trim() || null,
      role: role || "worker",
      manager_id: manager_id || null,
      gender: gender || "m",
    })
    .select("id")
    .single();

  if (memErr) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    throw { status: 500, message: memErr.message };
  }

  return new Response(
    JSON.stringify({ member_id: member.id, email: email.trim().toLowerCase() }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

async function handleResetPassword(
  admin: any,
  anonClient: any,
  caller: any,
  body: any,
) {
  const { org_id, member_id, new_password } = body;
  if (!org_id || !member_id || !new_password) {
    throw { status: 400, message: "missing_fields" };
  }
  if (new_password.length < 6) throw { status: 400, message: "password_too_short" };

  await requireAdmin(anonClient, caller.id, org_id);

  const { data: target } = await admin
    .from("org_members")
    .select("auth_user_id")
    .eq("id", member_id)
    .eq("org_id", org_id)
    .single();
  if (!target?.auth_user_id) throw { status: 404, message: "member_not_found" };

  const { error } = await admin.auth.admin.updateUser(target.auth_user_id, {
    password: new_password,
  });
  if (error) throw { status: 500, message: error.message };

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleToggleActive(
  admin: any,
  anonClient: any,
  caller: any,
  body: any,
) {
  const { org_id, member_id, is_active } = body;
  if (!org_id || !member_id || typeof is_active !== "boolean") {
    throw { status: 400, message: "missing_fields" };
  }

  await requireAdmin(anonClient, caller.id, org_id);

  const { data: target } = await admin
    .from("org_members")
    .select("auth_user_id, role")
    .eq("id", member_id)
    .eq("org_id", org_id)
    .single();
  if (!target) throw { status: 404, message: "member_not_found" };

  if (!is_active && target.role === "admin") {
    const { count } = await admin
      .from("org_members")
      .select("id", { count: "exact", head: true })
      .eq("org_id", org_id)
      .eq("role", "admin")
      .eq("is_active", true);
    if ((count ?? 0) <= 1) throw { status: 400, message: "last_admin" };
  }

  await admin
    .from("org_members")
    .update({ is_active })
    .eq("id", member_id)
    .eq("org_id", org_id);

  if (target.auth_user_id) {
    await admin.auth.admin.updateUser(target.auth_user_id, {
      ban_duration: is_active ? "none" : "876000h",
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
