-- 002: ערכי enum חדשים לאירועי משימה.
-- קובץ נפרד בכוונה: Postgres לא מרשה להשתמש בערך enum חדש באותה טרנזקציה
-- שבה הוא נוצר. יש להריץ את הקובץ הזה ולסיים אותו לפני הרצת 003.

alter type event_type add value if not exists 'edited';
alter type event_type add value if not exists 'cancelled';
