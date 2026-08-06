// עטיפת Cardcom V11 (JSON) — פורט מפריליו. הצלחה = ResponseCode === 0.
// אימות: TerminalNumber + ApiName. הסיסמה נדרשת כ-env אך אינה נשלחת בגוף.

const BASE = "https://secure.cardcom.solutions/api/v11";

function env() {
  const terminal = Number(Deno.env.get("CARDCOM_TERMINAL"));
  const apiName = Deno.env.get("CARDCOM_API_NAME");
  const apiPassword = Deno.env.get("CARDCOM_API_PASSWORD");
  if (!terminal || !apiName || !apiPassword) {
    throw { status: 500, message: "cardcom_env_missing" };
  }
  return { terminal, apiName };
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return await res.json();
}

// יצירת דף תשלום LowProfile. Operation: 'ChargeAndCreateToken' | 'CreateTokenOnly'.
export function createLowProfile(a: any) {
  const { terminal, apiName } = env();
  const body: any = {
    TerminalNumber: terminal,
    ApiName: apiName,
    Operation: a.operation,
    ReturnValue: a.returnValue, // "sub|<orgId>" | "card|<orgId>"
    Amount: a.amount,
    SuccessRedirectUrl: a.successUrl,
    FailedRedirectUrl: a.failedUrl,
    CancelRedirectUrl: a.failedUrl,
    WebHookUrl: a.webhookUrl, // IndicatorUrl
    ProductName: a.productName,
    Language: "he",
    ISOCoinId: 1,
    UIDefinition: {
      CardOwnerNameValue: a.name,
      CardOwnerEmailValue: a.email,
      CardOwnerPhoneValue: a.phone,
      IsCardOwnerEmailRequired: false,
    },
  };
  if (a.withDocument) {
    body.Document = {
      DocumentTypeToCreate: "TaxInvoiceAndReceipt",
      Name: a.name,
      Email: a.email,
      IsSendByEmail: !!a.email,
      Mobile: a.phone,
      Language: "he",
      Products: [{ Description: a.productName, Quantity: 1, UnitCost: a.amount }],
    };
  }
  return post("/LowProfile/Create", body);
}

export function getLowProfileResult(lowProfileId: string) {
  const { terminal, apiName } = env();
  return post("/LowProfile/GetLpResult", {
    TerminalNumber: terminal,
    ApiName: apiName,
    LowProfileId: lowProfileId,
  });
}

// חיוב לפי טוקן שמור. cardExpiration בפורמט "MMYY".
export function chargeByToken(a: any) {
  const { terminal, apiName } = env();
  return post("/Transactions/Transaction", {
    TerminalNumber: terminal,
    ApiName: apiName,
    Amount: a.amount,
    Token: a.token,
    CardExpirationMMYY: a.cardExpiration,
    ExternalUniqTranId: a.externalUniqTranId,
    ISOCoinId: 1,
    CardOwnerInformation: { FullName: a.name, CardOwnerEmail: a.email, Phone: a.phone },
    Document: {
      DocumentTypeToCreate: "TaxInvoiceAndReceipt",
      Name: a.name,
      Email: a.email,
      IsSendByEmail: !!a.email,
      Languge: "he", // (כתיב שגוי במקור Cardcom — נשמר בכוונה)
      Products: [{ Description: a.productName, Quantity: 1, UnitCost: a.amount }],
    },
  });
}
