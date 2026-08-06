import { useState } from 'react';
import { useWaTemplates } from '../../hooks/useWaTemplates';
import { WA_TOKENS, fillTokens } from '../../lib/waPhone';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import Field from '../ui/Field';

const t = he.wa;
const MAX = 15;
const DEMO = {
  employeeName: 'דנה', clientName: 'לקוח לדוגמה', orgName: 'הארגון שלי',
  taskNumber: '1042', taskName: 'התקנת מזגן', link: 'https://tasko-gamma.vercel.app/welcome/…',
};

// ניהול תבניות וואטסאפ — admin בלבד. רשימה, הוספה/עריכה עם טוקנים ותצוגה מקדימה.
export default function WaTemplatesManager({ orgId }) {
  const { templates, signature, loading, addTemplate, updateTemplate, deleteTemplate, saveSignature } =
    useWaTemplates(orgId);
  const [sig, setSig] = useState(null);
  const [editing, setEditing] = useState(null); // { id?, title, body, is_system }
  const [error, setError] = useState('');

  const sigVal = sig === null ? signature : sig;

  function insertToken(tok) {
    setEditing((e) => ({ ...e, body: (e.body || '') + tok }));
  }

  async function save() {
    if (!editing.title.trim() || !editing.body.trim()) return setError(t.required);
    try {
      if (editing.id) {
        await updateTemplate(editing.id, { title: editing.title.trim(), body: editing.body });
      } else {
        if (templates.length >= MAX) return setError(t.limit);
        await addTemplate({ title: editing.title.trim(), body: editing.body });
      }
      setEditing(null);
      setError('');
    } catch (err) {
      setError(String(err?.message || '').includes('WA_TEMPLATE_LIMIT') ? t.limit : t.saveError);
    }
  }

  async function remove(tp) {
    if (!window.confirm(t.deleteConfirm)) return;
    try { await deleteTemplate(tp.id); } catch { setError(t.saveError); }
  }

  if (loading) return <p className="text-sm text-grayMid">{he.common.loading}</p>;

  return (
    <div className="space-y-5">
      {/* חתימה */}
      <div>
        <label className="mb-1 block text-sm font-medium text-inkSoft">{t.signature}</label>
        <div className="flex gap-2">
          <input
            value={sigVal}
            onChange={(e) => setSig(e.target.value)}
            placeholder={t.signatureHint}
            className="min-h-touch flex-1 rounded-xl border border-line bg-white px-4 text-sm text-navy focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
          />
          <Button variant="secondary" size="sm" fullWidth={false}
            onClick={() => { saveSignature(sigVal); setSig(null); }}>
            {he.common.save}
          </Button>
        </div>
      </div>

      {/* רשימת תבניות */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-grayMid">{t.templates}</h3>
        <span className="text-xs text-grayLight" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {templates.length}/{MAX}
        </span>
      </div>

      <div className="space-y-2">
        {templates.map((tp) => (
          <div key={tp.id} className="rounded-xl border border-line bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-navy">{tp.title}</span>
                {tp.is_system && (
                  <span className="rounded-md bg-appBg px-2 py-0.5 text-[11px] font-bold text-grayMid">{t.systemBadge}</span>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" fullWidth={false} onClick={() => { setEditing({ id: tp.id, title: tp.title, body: tp.body, is_system: tp.is_system }); setError(''); }}>
                  {he.common.edit}
                </Button>
                {!tp.is_system && (
                  <Button variant="ghost" size="sm" fullWidth={false} onClick={() => remove(tp)}>
                    {he.common.delete}
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-grayDark">{tp.body}</p>
          </div>
        ))}
      </div>

      {editing ? (
        <div className="rounded-xl border border-brand/40 bg-surface p-3">
          <Field label={t.templateTitle} value={editing.title} onChange={(v) => setEditing((e) => ({ ...e, title: v }))} />
          <label className="mb-1 mt-3 block text-sm font-medium text-inkSoft">{t.templateBody}</label>
          <textarea
            rows={3}
            value={editing.body}
            onChange={(e) => setEditing((s) => ({ ...s, body: e.target.value }))}
            className="w-full rounded-xl border border-line bg-white px-4 py-2 text-sm text-navy focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
          />

          <div className="mt-2 flex flex-wrap gap-1">
            <span className="mt-1 text-xs text-grayMid">{t.insertToken}:</span>
            {WA_TOKENS.map((tok) => (
              <button key={tok.token} type="button" onClick={() => insertToken(tok.token)}
                className="rounded-md bg-appBg px-2 py-1 text-xs font-medium text-navy hover:bg-line">
                {tok.token}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-lg bg-white p-3">
            <div className="text-[11px] font-bold tracking-wide text-grayMid">{t.preview}</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-navy">{fillTokens(editing.body, DEMO)}</p>
          </div>

          {error && <p className="mt-2 text-sm font-medium text-urgentInk">{error}</p>}

          <div className="mt-3 flex gap-2">
            <Button size="sm" fullWidth={false} onClick={save}>{he.common.save}</Button>
            <Button size="sm" variant="ghost" fullWidth={false} onClick={() => { setEditing(null); setError(''); }}>{he.common.cancel}</Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" size="sm" fullWidth={false} onClick={() => { setEditing({ title: '', body: '' }); setError(''); }}>
          {t.addTemplate}
        </Button>
      )}

      {error && !editing && <p className="text-sm font-medium text-urgentInk">{error}</p>}
    </div>
  );
}
