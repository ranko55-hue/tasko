# הקמת מנוע החיוב (Cardcom V11) — TEST

מנוע פר-ארגון, תמחור פר-מושב: **199 ₪ בסיס** (כולל 2 משתמשים) **+ 49 ₪ לכל עובד פעיל
מעבר לשניים**, בתוספת מע״מ. **ניסיון 7 יום** מהקמת הארגון.

## 1. Secrets (צד שרת בלבד — להריץ פעם אחת)

```bash
npx supabase secrets set \
  CARDCOM_TERMINAL=1000 \
  CARDCOM_API_NAME=<API_NAME_TEST> \
  CARDCOM_API_PASSWORD=<API_PASSWORD_TEST> \
  APP_URL=https://tasko-gamma.vercel.app \
  BILLING_CRON_SECRET=<מחרוזת-אקראית-שתבחר>
```

`BILLING_PURGE_ENABLED` — לא מוגדר = מחיקת נתונים **כבויה** (ברירת מחדל). הפעלה עתידית בלבד.

## 2. Cron יומי לחיוב חוזר

לתזמן קריאה יומית ל-`billing-charge-cycle` עם ההדר `x-cron-secret`. דרך pg_cron:

```sql
select cron.schedule('billing-daily', '0 3 * * *', $$
  select net.http_post(
    url    := 'https://<PROJECT-REF>.supabase.co/functions/v1/billing-charge-cycle',
    headers:= jsonb_build_object('Content-Type','application/json','x-cron-secret','<BILLING_CRON_SECRET>'),
    body   := '{}'::jsonb
  );
$$);
```

(או דרך Supabase Dashboard → Integrations → Cron.)

## 3. Webhook (IndicatorUrl)

נשלח אוטומטית ע"י הפונקציות כ-`WebHookUrl = <SUPABASE_URL>/functions/v1/billing-webhook`
(פרוס עם `--no-verify-jwt`). אין להגדיר ידנית ב-Cardcom.

## 4. פרטי TEST

טרמינל `1000` · כרטיס `4580000000000000` · תוקף `12/30` · CVV `123`.
**ת"ז בעל הכרטיס:** יש להשתמש ב-**`123456782`** — הערך `123456789` נכשל בספרת הביקורת
של ת"ז ישראלית ב-Cardcom (לקח מוכר מפריליו).

## 5. שבעת התרחישים לבדיקה (TEST)

1. **הרשמה → ניסיון** — ארגון חדש נכנס ל-`trialing`, 7 יום.
2. **חיוב ראשון → פעיל + חשבונית** — הגדרות → חיוב → "התחלת מנוי" → כרטיס בדיקה →
   חזרה, סטטוס `active`, חשבונית מופיעה עם קישור.
3. **חיוב חוזר** — לדחוף `current_period_end` אחורה ידנית ולהריץ את הקרון → חיוב + חשבונית חדשה.
4. **כשל חיוב → past_due → expired** — טוקן/סכום פסול; 3 כשלים → `expired`.
5. **ביטול** — גישה עד סוף התקופה; אחרי הקרון → `canceled` + נעילה.
6. **החלפת כרטיס** — "עדכון כרטיס" → טוקן חדש נשמר.
7. **שינוי מספר מושבים** — הוספת/השבתת עובד משנה את הסכום בחיוב הבא (199 + 49×N).

## 6. לקחי פרודקציה מוטמעים

- **מזהה עסקה ≤ 50 תווים** — `ts` + UUID בלי מקפים + תקופה + מספר ניסיון (43 תווים).
- **כפילות מזהה בניסיון חוזר** — מספר הניסיון מוטמע במזהה כדי שניסיון חוזר לא יידחה כ"כפול".
- **white-screen אחרי return** — רענון בהשהיות + ניקוי `?billing` מה-URL; הנעילה חלה רק
  אחרי שה-status ידוע (`known`).
