import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../lib/orgContext';
import { supabase } from '../../lib/supabase';
import { he } from '../../locales/he';

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
export default function SearchBar({ onNavigate }) {
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
    const term = `%${q.trim()}%`;
    const id = setTimeout(async () => {
      const [t, c, p] = await Promise.all([
        supabase.from('tasks').select('id,title,project_id').eq('org_id', org).ilike('title', term).limit(5),
        supabase.from('clients').select('id,name').eq('org_id', org).ilike('name', term).limit(5),
        supabase.from('projects').select('id,name').eq('org_id', org).ilike('name', term).limit(5),
      ]);
      setRes({ tasks: t.data ?? [], clients: c.data ?? [], projects: p.data ?? [] });
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

  const total = res ? res.tasks.length + res.clients.length + res.projects.length : 0;

  return (
    <div className="relative">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => res && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={he.shell.searchPlaceholder}
        className="min-h-[44px] w-full rounded-xl bg-white/10 px-4 text-white placeholder:text-slate-400 focus:bg-white focus:text-slate-900 focus:outline-none"
      />
      {open && res && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-xl bg-white p-2 text-slate-900 shadow-xl">
          {total === 0 ? (
            <p className="p-3 text-center text-slate-400">{he.shell.searchEmpty}</p>
          ) : (
            <>
              <Group label={he.shell.groupTasks} items={res.tasks} icon="📋" render={(x) => x.title} onPick={(x) => go(`/projects/${x.project_id}`)} />
              <Group label={he.shell.groupClients} items={res.clients} icon="🏢" render={(x) => x.name} onPick={(x) => go(`/clients/${x.id}`)} />
              <Group label={he.shell.groupProjects} items={res.projects} icon="🗂️" render={(x) => x.name} onPick={(x) => go(`/projects/${x.id}`)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
