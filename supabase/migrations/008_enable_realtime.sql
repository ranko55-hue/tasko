-- 008: הפעלת Realtime על הטבלאות שהלוח מאזין להן.
--
-- הרקע: useDashboard נרשם ל-postgres_changes על tasks ועל task_events,
-- והערוץ אמנם מחזיר SUBSCRIBED — אבל אף אירוע לא הגיע. הסיבה: הטבלאות
-- לא היו חברות בפרסום supabase_realtime, ולכן ה-WAL לא נשלח אליהן כלל.
-- התוצאה בפועל: הלוח נפל תמיד לפולינג כל 15 שניות, ונקודת החיבור נשארה אפורה.
--
-- replica identity full: נדרש כדי ש-Realtime יוכל להעריך RLS מול השורה
-- הישנה בעדכון ובמחיקה. הטבלאות קטנות, והעלות ב-WAL זניחה מול הנכונות.

alter table public.tasks       replica identity full;
alter table public.task_events replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public' and tablename = 'task_events'
  ) then
    alter publication supabase_realtime add table public.task_events;
  end if;
end $$;
