-- 032: תזמון הקרון היומי לחיוב — עצמאי, בלי הגדרות ידניות בלוח Supabase.
--
-- הסוד להגנת הקרון נוצר בתוך ה-DB (billing_config), לא ב-env ולא ב-git.
-- pg_cron קורא כל יום ל-Edge Function billing-charge-cycle עם הסוד בהדר,
-- והפונקציה משווה אותו מול אותה טבלה.

create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists billing_config (
  key   text primary key,
  value text not null
);
alter table billing_config enable row level security;
-- אין policies → נגיש ל-service role בלבד (הפונקציה).

insert into billing_config (key, value)
values ('cron_secret',
        replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- הסרת תזמון קודם באותו שם (אם קיים) לפני יצירה מחדש.
select cron.unschedule('billing-daily')
where exists (select 1 from cron.job where jobname = 'billing-daily');

select cron.schedule('billing-daily', '0 3 * * *', $CRON$
  select net.http_post(
    url := 'https://vnhvanjanjubtsfenkdk.supabase.co/functions/v1/billing-charge-cycle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from billing_config where key = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
$CRON$);
