import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { chargeByToken, createDocumentUrl } from "../_shared/cardcom.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PURGE_ENABLED = Deno.env.get("BILLING_PURGE_ENABLED") === "true";
const MAX_RETRIES = 3;

const iso = (d: Date) => d.toISOString();
const addMonth = (d: Date) => { const x = new Date(d); x.setMonth(x.getMonth() + 1); return x; };
const inDays = (n: number) => iso(new Date(Date.now() + n * 86400000));
const ymd = (d: Date) => iso(d).slice(0, 10).replace(/-/g, "");

// קרון יומי — חיוב מנויים שהגיע מועדם, פקיעת ניסיונות, ביטולים, ומחיקה.
// מוגן בהדר x-cron-secret. אין JWT.
Deno.serve(async (req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  // הסוד נוצר ונשמר ב-DB (billing_config) ע"י המיגרציה — לא ב-env ולא ב-git.
  const { data: cfg } = await admin.from("billing_config").select("value").eq("key", "cron_secret").maybeSingle();
  if (!cfg || req.headers.get("x-cron-secret") !== cfg.value) {
    return new Response("forbidden", { status: 403 });
  }
  const now = new Date();
  const report = { ver: "t1", renewed: 0, failed: 0, canceled: 0, expired: 0, purged: 0, purgeSkipped: 0 };

  const { data: subs } = await admin.from("subscriptions")
    .select("*")
    .or(`current_period_end.lte.${iso(now)},trial_ends_at.lte.${iso(now)},data_purge_at.lte.${iso(now)}`);

  for (const sub of subs ?? []) {
    try {
      if (sub.status === "vip") continue; // פטור — לא מחייבים, לא פוגים, לא מוחקים.

      // מחיקת נתונים (ריטיינר) — רק אם הדגל דלוק.
      if (sub.data_purge_at && new Date(sub.data_purge_at) <= now && !sub.purged_at) {
        if (PURGE_ENABLED) {
          await admin.rpc("purge_org_data", { p_org: sub.org_id });
          await admin.from("subscriptions").update({ purged_at: iso(now) }).eq("org_id", sub.org_id);
          report.purged++;
        } else { report.purgeSkipped++; }
        continue;
      }

      // ניסיון שפג בלי כרטיס → פג תוקף (נעילה; עדיין ניתן לשלם).
      if (sub.status === "trialing" && sub.trial_ends_at && new Date(sub.trial_ends_at) <= now) {
        await admin.from("subscriptions").update({ status: "expired", data_purge_at: inDays(30) }).eq("org_id", sub.org_id);
        report.expired++;
        continue;
      }

      // ביטול שהגיע לסוף התקופה → נעילה + מחיקה בעוד 30 יום.
      if (sub.cancel_at_period_end && sub.current_period_end && new Date(sub.current_period_end) <= now) {
        await admin.from("subscriptions").update({ status: "canceled", data_purge_at: inDays(30) }).eq("org_id", sub.org_id);
        report.canceled++;
        continue;
      }

      // חידוש — חיוב הטוקן בסכום המחושב (בסיס + מושבים).
      const due = ["active", "past_due"].includes(sub.status) && sub.current_period_end && new Date(sub.current_period_end) <= now;
      if (!due) continue;

      if (!sub.cardcom_token) {
        await admin.from("subscriptions").update({ status: "past_due", last_charge_status: "no_token", last_charge_at: iso(now) }).eq("org_id", sub.org_id);
        report.failed++;
        continue;
      }

      const { data: amount } = await admin.rpc("billing_amount", { p_org: sub.org_id });
      const { data: seats } = await admin.rpc("billing_seats", { p_org: sub.org_id });
      const { data: acct } = await admin.from("org_members")
        .select("full_name, email, phone").eq("org_id", sub.org_id).eq("role", "admin").eq("is_active", true).limit(1).maybeSingle();

      // מזהה עסקה ≤50 תווים, בלי מקפים; מספר הניסיון מוטמע כדי שניסיון חוזר
      // אחרי כשל לא יידחה כ"עסקה כפולה", אך ריצה חוזרת של אותו ניסיון = מזהה זהה.
      const attempt = sub.charge_retries ?? 0;
      const uniq = `ts${String(sub.org_id).replace(/-/g, "")}${ymd(new Date(sub.current_period_end))}${attempt}`;

      const tx = await chargeByToken({
        amount,
        token: sub.cardcom_token,
        cardExpiration: String(sub.card_exp ?? "").replace("/", ""), // MM/YY → MMYY
        externalUniqTranId: uniq,
        name: acct?.full_name ?? "Tasko",
        email: acct?.email ?? "",
        phone: acct?.phone ?? "",
        productName: `מנוי Tasko — ${amount} ₪/חודש`,
      });

      if (tx.ResponseCode === 0) {
        await admin.from("subscriptions").update({
          status: "active",
          current_period_end: iso(addMonth(new Date(sub.current_period_end))),
          charge_retries: 0,
          last_charge_at: iso(now),
          last_charge_status: "success",
        }).eq("org_id", sub.org_id);
        if (tx.DocumentNumber) {
          let docUrl = tx.DocumentUrl ?? null;
          if (!docUrl) {
            try { docUrl = (await createDocumentUrl(tx.DocumentNumber))?.DocumentUrl ?? null; } catch { /* פרודקשן יחזיר קישור */ }
          }
          await admin.from("billing_invoices").upsert({
            org_id: sub.org_id,
            invoice_number: String(tx.DocumentNumber),
            invoice_url: docUrl,
            amount, seats: seats ?? null, charged_at: iso(now),
          }, { onConflict: "invoice_number" });
        }
        report.renewed++;
      } else {
        const retries = (sub.charge_retries ?? 0) + 1;
        const dead = retries >= MAX_RETRIES;
        await admin.from("subscriptions").update({
          status: dead ? "expired" : "past_due",
          charge_retries: retries,
          last_charge_at: iso(now),
          last_charge_status: `fail:${tx.ResponseCode} ${(tx.Description ?? "").slice(0, 150)}`.trim(),
          data_purge_at: dead ? inDays(30) : null,
        }).eq("org_id", sub.org_id);
        console.error("charge failed", sub.org_id, JSON.stringify(tx));
        report.failed++;
      }
    } catch (err) {
      console.error("cron row error", sub.org_id, String(err));
    }
  }

  return new Response(JSON.stringify(report), { headers: { "Content-Type": "application/json" } });
});
