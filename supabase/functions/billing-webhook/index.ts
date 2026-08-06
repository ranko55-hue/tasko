import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getLowProfileResult, createDocumentUrl } from "../_shared/cardcom.ts";

// כתובת מסמך: מעדיפים את מה ש-Cardcom החזיר; אם ריק (קורה בטרמינל TEST) —
// מנסים CreateDocumentUrl לפי מספר המסמך. בפרודקשן זה מחזיר קישור אמיתי.
async function resolveDocUrl(direct: string | null | undefined, number: number | string | null | undefined) {
  if (direct) return direct;
  if (!number) return null;
  try {
    const d = await createDocumentUrl(number);
    return d?.DocumentUrl ?? null;
  } catch { return null; }
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ok = (extra: Record<string, unknown> = {}) =>
  new Response(JSON.stringify({ ok: true, ...extra }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function addMonth(d: Date) { const x = new Date(d); x.setMonth(x.getMonth() + 1); return x; }
const two = (n: number) => String(n).padStart(2, "0");

async function readLowProfileId(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const q = url.searchParams.get("lowprofilecode") || url.searchParams.get("LowProfileId");
  if (q) return q;
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const b = await req.json();
      return b.LowProfileId || b.lowprofilecode || b.LowProfileCode || null;
    }
    const form = await req.formData();
    return (form.get("LowProfileId") || form.get("lowprofilecode") || form.get("LowProfileCode"))?.toString() || null;
  } catch { return null; }
}

// IndicatorUrl של Cardcom — לעולם לא סומכים על גוף הבקשה; מושכים את התוצאה
// המאומתת מ-Cardcom לפי LowProfileId. מחזיר תמיד 200 כדי ש-Cardcom לא ינסה שוב.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  try {
    const lpId = await readLowProfileId(req);
    if (!lpId) return ok({ ignored: "no_lp" });

    const result = await getLowProfileResult(lpId);
    if (result.ResponseCode !== 0) return ok({ ignored: "LP_NOT_SUCCESSFUL" });

    const [mode, orgId] = String(result.ReturnValue ?? "").split("|");
    if (!orgId) return ok({ ignored: "no_org" });

    const tok = result.TokenInfo ?? {};
    const tran = result.TranzactionInfo ?? {};
    const cardExp = tran.CardMonth && tran.CardYear
      ? `${two(Number(tran.CardMonth))}/${String(tran.CardYear).slice(-2)}`
      : null;
    const last4 = tran.Last4CardDigitsString ??
      (tran.Last4CardDigits != null ? String(tran.Last4CardDigits).padStart(4, "0") : null);
    const tokenExp = tok.TokenExDate
      ? `${String(tok.TokenExDate).slice(0, 4)}-${String(tok.TokenExDate).slice(4, 6)}-${String(tok.TokenExDate).slice(6, 8)}`
      : null;

    const cardPatch: Record<string, unknown> = {
      cardcom_token: tok.Token ?? tran.Token ?? null,
      card_exp: cardExp,
      card_last4: last4,
      cardcom_token_exp: tokenExp,
      cardcom_customer_id: result.DocumentInfo?.AccountId ?? null,
    };

    if (mode === "card") {
      await admin.from("subscriptions").update(cardPatch).eq("org_id", orgId);
      return ok({ mode: "card" });
    }

    if (tran.ResponseCode !== 0) return ok({ ignored: "TRAN_FAIL" });

    const now = new Date();
    await admin.from("subscriptions").update({
      ...cardPatch,
      status: "active",
      current_period_end: addMonth(now).toISOString(),
      cancel_at_period_end: false,
      canceled_at: null,
      data_purge_at: null,
      charge_retries: 0,
      last_charge_at: now.toISOString(),
      last_charge_status: "success",
    }).eq("org_id", orgId);

    if (result.DocumentInfo?.DocumentNumber) {
      const { data: seats } = await admin.rpc("billing_seats", { p_org: orgId });
      const docUrl = await resolveDocUrl(result.DocumentInfo.DocumentUrl, result.DocumentInfo.DocumentNumber);
      await admin.from("billing_invoices").upsert({
        org_id: orgId,
        invoice_number: String(result.DocumentInfo.DocumentNumber),
        invoice_url: docUrl,
        amount: tran.Amount ?? 0,
        seats: seats ?? null,
        charged_at: now.toISOString(),
      }, { onConflict: "invoice_number" });
    }

    return ok({ mode: "sub" });
  } catch (err) {
    console.error("billing-webhook", String(err));
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
