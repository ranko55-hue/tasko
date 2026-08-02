import { useState } from 'react';
import { he } from '../../locales/he';
import { formatDuration } from '../../lib/time';
import Button from '../shared/Button';
import Field from '../ui/Field';

const t = he.team.detail;

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs font-medium text-grayMid">{label}</p>
      <p className="mt-1 text-2xl font-black text-navy" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-grayLight">{sub}</p>}
    </div>
  );
}

function Stars({ rating, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`h-8 w-8 text-lg ${n <= rating ? 'text-brandYellow' : 'text-lineDark'}`}
        >
          {n <= rating ? '★' : '☆'}
        </button>
      ))}
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });
}

export default function MemberPerformanceTab({
  stats,
  evaluations,
  canWrite,
  onAddEvaluation,
  loading,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [rating, setRating] = useState(3);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onAddEvaluation(rating, body.trim());
      setAddOpen(false);
      setBody('');
      setRating(3);
    } catch {
      setError(t.evalSaveError);
    }
    setBusy(false);
  }

  if (loading) return <p className="py-8 text-center text-grayMid">{he.common.loading}</p>;

  return (
    <div className="space-y-6">
      {/* מדדים */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MetricCard label={t.perfOnTime} value={`${stats.onTimePct}%`} />
          <MetricCard label={t.perfAvgTime} value={formatDuration(stats.avgSeconds)} />
          <MetricCard label={t.perfActiveTasks} value={stats.active} />
          <MetricCard label={t.perfCompleted} value={stats.done} />
          <MetricCard label={t.perfTotalHours} value={formatDuration(stats.totalSeconds)} />
        </div>
      )}

      {/* הערכות */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-navy">{t.evaluations}</h3>
          {canWrite && (
            <Button variant="ghost" size="sm" fullWidth={false} onClick={() => setAddOpen(!addOpen)}>
              {t.addEvaluation}
            </Button>
          )}
        </div>

        {addOpen && canWrite && (
          <form onSubmit={submit} className="mb-4 space-y-3 rounded-xl border border-line bg-surface p-4">
            <div>
              <p className="mb-1 text-sm font-medium text-inkSoft">{t.evalRating}</p>
              <Stars rating={rating} onChange={setRating} />
            </div>
            <Field as="textarea" placeholder={t.evalPlaceholder} value={body} onChange={setBody} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-3">
              <div className="w-32">
                <Button type="submit" disabled={busy || !body.trim()}>
                  {busy ? he.common.loading : he.common.save}
                </Button>
              </div>
              <div className="w-24">
                <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                  {he.common.cancel}
                </Button>
              </div>
            </div>
          </form>
        )}

        {evaluations.length === 0 ? (
          <p className="py-6 text-center text-sm text-grayLight">{t.evalEmpty}</p>
        ) : (
          <div className="space-y-3">
            {evaluations.map((ev) => (
              <div key={ev.id} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <Stars rating={ev.rating} />
                  <span className="text-xs text-grayLight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {fmtDate(ev.created_at)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-inkSoft">{ev.body}</p>
                <p className="mt-1 text-xs text-grayLight">{ev.author?.full_name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
