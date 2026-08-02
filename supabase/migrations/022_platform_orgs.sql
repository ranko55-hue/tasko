-- 022: לוח ארגונים/יוזרים — super-admin רואה את כל הארגונים והחברים.
--
-- כל הגישה דרך security definer RPCs בלבד.
-- אין שינוי בשום RLS policy קיימת.

-- ── רשימת ארגונים עם סטטיסטיקות ──────────────────────────────────────
create or replace function platform_list_orgs()
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then
    raise exception 'forbidden';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(r) order by r.created_at desc)
    from (
      select
        o.id,
        o.name,
        o.created_at,
        (select count(*) from org_members m where m.org_id = o.id and m.is_active) as member_count,
        (select count(*) from org_members m where m.org_id = o.id and not m.is_active) as inactive_count,
        (select count(*) from tasks t where t.org_id = o.id) as task_count,
        (select count(*) from clients c where c.org_id = o.id) as client_count,
        (select count(*) from projects p where p.org_id = o.id) as project_count
      from organizations o
    ) r
  ), '[]'::jsonb);
end $$;

-- ── חברי ארגון ספציפי ─────────────────────────────────────────────────
create or replace function platform_org_members(p_org_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not is_platform_admin() then
    raise exception 'forbidden';
  end if;

  return coalesce((
    select jsonb_agg(row_to_json(r) order by r.role, r.full_name)
    from (
      select
        m.id,
        m.full_name,
        m.phone,
        m.email,
        m.role::text,
        m.gender,
        m.is_active,
        m.created_at,
        u.last_sign_in_at
      from org_members m
      left join auth.users u on u.id = m.auth_user_id
      where m.org_id = p_org_id
    ) r
  ), '[]'::jsonb);
end $$;

-- ── החלפת סטטוס פעיל/לא-פעיל לחבר ───────────────────────────────────
create or replace function platform_toggle_member(p_member_id uuid, p_active boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then
    raise exception 'forbidden';
  end if;

  update org_members set is_active = p_active where id = p_member_id;
end $$;
