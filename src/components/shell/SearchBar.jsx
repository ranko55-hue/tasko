import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../lib/orgContext';
import { supabase } from '../../lib/supabase';
import { he } from '../../locales/he';
import Icon from '../ui/Icon';
import RefNumber from '../shared/RefNumber';

function Group({ label, items, icon, render, onPick }) {
  if (!items.length) return null;
  return (
    <div className="mb-2">
      <div className="px-2 py-1 text-xs font-bold text-slate-400">{label}</div>
      {items.map((x) => (
        <button
          key={x.id}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(x)}
          className="flex min-h-touch w-full items-center gap-2 rounded-lg px-2 text-right hover:bg-slate-100"
        >
          <span>{icon}</span>
          <span className="truncate">{render(x)}</span>
        </button>
      ))}
    </div>
  );
}

// חיפוש גלובלי בפס — משימות / לקוחות / פרויקטים, תוצאות מקובצות.
export default function SearchBar({ onNavigate, onExpandedChange }) {
  const inputRef = useRef(null);
  const [expanded, setExpanded] = useState(false); // מובייל: אייקון שמתרחב לשדה
  const { member } = useOrg();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) {
      setRes(null);
      return;
    }
    const org = member.org_id;
    const raw = q.trim();
    const term = `%${raw}%`;
    // הקלדת מספר ("1004") מחפשת גם לפי המספר הרץ של הלקוח/הפרויקט ולפי מספר המשימה.
    // רק ספרות — כדי ש-"12 רחוב" לא ייחשב מספר.
    const asNumber = /^\d+$/.test(raw) ? Number(raw) : null;
    const id = setTimeout(async () => {
      const [t, c, p, w] = await Promise.all([
        supabase
          .from('tasks')
          .select('id,title,project_id')
          .eq('org_id', org)
          .or(asNumber === null ? `title.ilike.${term}` : `title.ilike.${term},id.eq.${asNumber}`)
          .limit(5),
        supabase
          .from('clients')
          .select('id,number,name')
          .eq('org_id', org)
          .or(asNumber === null ? `name.ilike.${term}` : `name.ilike.${term},number.eq.${asNumber}`)
          .limit(5),
        supabase
          .from('projects')
          .select('id,number,name,sku')
          .eq('org_id', org)
          .or(
            asNumber === null
              ? `name.ilike.${term},sku.ilike.${term}`
              : `name.ilike.${term},sku.ilike.${term},number.eq.${asNumber}`
          )
          .limit(5),
        supabase
          .from('org_members')
          .select('id,full_name,phone')
          .eq('org_id', org)
          .eq('is_active', true)
          .or(`full_name.ilike.${term},phone.ilike.${term}`)
          .limit(5),
      ]);
      setRes({
        tasks: t.data ?? [],
        clients: c.data ?? [],
        projects: p.data ?? [],
        workers: w.data ?? [],
      });
      setOpen(true);
    }, 300);
    return () => clearTimeout(id);
  }, [q, member.org_id]);

  function go(path) {
    setQ('');
    setRes(null);
    setOpen(false);
    onNavigate?.();
    navigate(path);
  }

  const total = res
    ? res.tasks.length + res.clients.length + res.projects.length + (res.workers?.length ?? 0)
    : 0;

  // ב-390 השדה מכווץ לאייקון עד שלוחצים; בדסקטופ תמיד פרוש
  function setExpandedBoth(v) {
    setExpanded(v);
    onExpandedChange?.(v);
  }

  function openField() {
    setExpandedBoth(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className={`relative ${expanded ? 'w-full flex-1' : ''} md:w-full`}>
      {!expanded && (
        <button
          type="button"
          onClick={openField}
          aria-label={he.shell.search}
          className="flex h-11 w-11 items-center justify-center rounded-full text-slate-300
                     hover:bg-white/10 md:hidden"
        >
          <Icon name="search" />
        </button>
      )}

      <div
        className={`w-full items-center gap-2 rounded-full border border-white/20
                    bg-white/[0.14] px-3 transition-colors focus-within:border-white/40
                    focus-within:bg-white/25 ${expanded ? 'flex' : 'hidden md:flex'}`}
      >
        <Icon name="search" size="sm" className="text-slate-300" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => res && setOpen(true)}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
            if (!q) setExpandedBoth(false);
          }}
          placeholder={he.shell.searchPlaceholder}
          className="min-h-[44px] w-full bg-transparent text-white placeholder:text-slate-300
                     focus:outline-none"
        />
      </div>
      {open && res && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl bg-white p-2 text-slate-900 shadow-xl">
          {total === 0 ? (
            <p className="p-3 text-center text-slate-400">{he.shell.searchEmpty}</p>
          ) : (
            <>
              <Group label={he.shell.groupTasks} items={res.tasks} icon={<Icon name="task" />} render={(x) => <>{x.title} <RefNumber value={x.id} className="text-xs" /></>} onPick={(x) => go(`/projects/${x.project_id}`)} />
              <Group label={he.shell.groupClients} items={res.clients} icon={<Icon name="client" />} render={(x) => <>{x.name} <RefNumber value={x.number} className="text-xs" /></>} onPick={(x) => go(`/clients/${x.id}`)} />
              <Group label={he.shell.groupProjects} items={res.projects} icon={<Icon name="project" />} render={(x) => <>{x.name} <RefNumber value={x.number} className="text-xs" /></>} onPick={(x) => go(`/projects/${x.id}`)} />
              <Group label={he.shell.groupWorkers} items={res.workers ?? []} icon={<Icon name="users" />} render={(x) => x.full_name} onPick={(x) => go(`/team/${x.id}`)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
