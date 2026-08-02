import { useState } from 'react';
import { he } from '../../locales/he';
import { formatDateTime } from '../../lib/time';
import Icon from '../ui/Icon';

// מודול "תדריך AI — חי" עם צ'יפים ותיוג ספציפי
export default function AIGuidanceModule({
  alerts,
  serviceRequests = [],
  blockedTasks = [],
  overrunTasks = [],
  unclosedTasks = [],
  pinnedChips,
  onTogglePinned,
  pinnedTaskCounts,
  live = false,
  onOpenTask,
}) {
  const [isOpen, setIsOpen] = useState(false);
  // תמיד מערך — הצ'יפים המוצמדים נקראים עם ‎.includes()‎ בלבד
  const pinned = Array.isArray(pinnedChips) ? pinnedChips : [];

  const alertCounter =
    (alerts?.new_calls || 0) +
    (alerts?.delayed || 0) +
    (alerts?.overrun || 0) +
    (alerts?.unclosed || 0);

  const alertChips = [
    { key: 'new_calls', label: 'קריאות חדשות', count: alerts?.new_calls || 0, color: 'bg-statusRed' },
    { key: 'delayed', label: 'בעיכוב', count: alerts?.delayed || 0, color: 'bg-statusRed' },
    { key: 'overrun', label: 'בחריגה', count: alerts?.overrun || 0, color: 'bg-statusRed' },
    { key: 'unclosed', label: 'לא נסגרה בזמן', count: alerts?.unclosed || 0, color: 'bg-statusRed' },
  ];

  const pinnedOptions = [
    { key: 'in_field', label: 'בשטח כרגע', count: pinnedTaskCounts?.in_field || 0 },
    { key: 'in_delay', label: 'בהשהיה', count: pinnedTaskCounts?.in_delay || 0 },
    { key: 'not_started', label: 'טרם החלו', count: pinnedTaskCounts?.not_started || 0 },
    { key: 'scheduled', label: 'מתוזמנות', count: pinnedTaskCounts?.scheduled || 0 },
    { key: 'completed_today', label: 'הושלמו היום', count: pinnedTaskCounts?.completed_today || 0 },
  ];

  // הצג צ'יפים אדומים או "הכל תקין"
  const hasAlerts = alertChips.some((c) => c.count > 0);
  const displayChips = hasAlerts
    ? alertChips.filter((c) => c.count > 0)
    : [{ key: 'ok', label: 'הכל תקין', count: null, color: 'bg-statusGreen' }];

  // הוסף צ'יפים מוצמדים
  const pinnedDisplay = pinnedOptions.filter((p) => pinned.includes(p.key));

  // בדוק אם הכול נכנס
  const allChips = [...displayChips, ...pinnedDisplay];
  const fitsInRow = allChips.length <= 6;
  const overflowCount = fitsInRow ? 0 : allChips.length - 5;

  // רשימת כל הפריטים לפאנל — סדר כניסה, הוותיק למעלה
  const allAlertItems = [
    ...serviceRequests.map((sr) => ({
      type: 'service_request',
      id: sr.id,
      title: sr.requester_name,
      subtitle: sr.clients?.name || 'לא ידוע',
      reason: sr.description,
      createdAt: sr.created_at,
      actionLabel: 'המר למשימה',
    })),
    ...blockedTasks.map((t) => ({
      type: 'task',
      id: t.id,
      title: t.title,
      subtitle: t.assignee?.full_name || he.tasks.unassigned,
      reason: 'משימה חסומה',
      createdAt: t.created_at,
      actionLabel: 'פתח',
    })),
    ...overrunTasks.map((t) => ({
      type: 'task',
      id: t.id,
      title: t.title,
      subtitle: t.assignee?.full_name || he.tasks.unassigned,
      reason: 'חריגה בזמן',
      createdAt: t.created_at,
      actionLabel: 'פתח',
    })),
    ...(unclosedTasks || []).map((t) => ({
      type: 'task',
      id: t.id,
      title: t.title,
      subtitle: t.assignee?.full_name || he.tasks.unassigned,
      reason: `חלף יעד: ${new Date(t.due_at).toLocaleDateString('he-IL')}`,
      createdAt: t.created_at,
      actionLabel: 'פתח',
    })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="mb-6 bg-navy px-4 py-3 rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-black text-white">
          <Icon name="ai" />
          {he.dashboard.aiTitle}
          {/* מחוון חיבור — נקודה בלבד, ההסבר ב-tooltip */}
          <span
            title={live ? he.dashboard.live : he.dashboard.polling}
            aria-label={live ? he.dashboard.live : he.dashboard.polling}
            className={`h-2 w-2 rounded-full ${
              live ? 'animate-pulse bg-statusGreen' : 'bg-slate-500'
            }`}
          />
        </h2>
        <div className="flex items-center gap-3">
          {alertCounter > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-statusRed text-xs font-bold text-white">
              {Math.min(alertCounter, 9)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={isOpen ? he.dashboard.collapse : he.dashboard.expand}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl
                       bg-white/15 text-brandYellow transition-all
                       hover:bg-white/25 active:scale-95"
          >
            <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size="md" />
          </button>
        </div>
      </div>

      {/* Chip row — horizontal scroll */}
      <div className="overflow-x-auto pb-1 -mx-4 px-4">
        <div className="flex gap-2 min-w-min">
          {/* Alert chips or "הכל תקין" */}
          {displayChips.map((chip) =>
            chip.count !== null ? (
              <span
                key={chip.key}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full ${chip.color} px-3 py-1 text-xs font-bold text-white`}
              >
                {chip.label} ({chip.count})
              </span>
            ) : (
              <span
                key={chip.key}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full ${chip.color} px-3 py-1 text-xs font-bold text-white`}
              >
                {chip.label}
              </span>
            )
          )}

          {/* Pinned chips */}
          {pinnedDisplay.map((p) => (
            <span
              key={p.key}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-400 px-3 py-1 text-xs font-bold text-slate-900"
            >
              {p.label}
            </span>
          ))}

          {/* "+N" overflow or "+" button */}
          {overflowCount > 0 && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-slate-400 px-3 py-1 text-xs font-bold text-slate-900">
              +{overflowCount}
            </span>
          )}
          {allChips.length < pinnedOptions.length && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-transparent text-lg font-bold text-slate-300 hover:bg-slate-300/20"
            >
              ＋
            </button>
          )}
        </div>
      </div>

      {/* Panel — open/close */}
      {isOpen && (
        <div className="mt-3 border-t border-navy2 pt-3">
          {/* Pinned selector — pill toggles */}
          <div className="mb-3">
            <div className="mb-2 text-xs font-bold text-slate-300">{he.dashboard.pinnedTitle}</div>
            <div className="flex flex-wrap gap-2">
              {pinnedOptions.map((p) => {
                const active = pinned.includes(p.key);
                const atMax = pinned.length >= 3 && !active;
                return (
                  <button
                    key={p.key}
                    type="button"
                    disabled={atMax}
                    onClick={() => {
                      if (active) onTogglePinned(pinned.filter((c) => c !== p.key));
                      else onTogglePinned([...pinned, p.key].slice(0, 3));
                    }}
                    className={`rounded-lg px-3 py-1.5 text-sm font-bold transition-colors ${
                      active
                        ? 'bg-brandYellow text-navy'
                        : atMax
                          ? 'bg-white/5 text-slate-500 cursor-not-allowed'
                          : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {p.label} {p.count > 0 && <span className="opacity-70">({p.count})</span>}
                  </button>
                );
              })}
            </div>
            {pinned.length >= 3 && (
              <p className="mt-1.5 text-xs text-slate-400">{he.dashboard.pinnedMax}</p>
            )}
          </div>

          {/* Alert items */}
          {hasAlerts && allAlertItems.length > 0 && (
            <div>
              <div className="mb-2 text-xs font-bold text-slate-300">פריטים דורשי תשומת לב</div>
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {allAlertItems.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => item.type === 'task' && onOpenTask?.(item.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg bg-navy2 px-2 py-1.5 text-xs text-start hover:bg-navy2/80 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white truncate">
                        {item.title} — {item.subtitle}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {item.reason} · {formatDateTime(item.createdAt)}
                      </div>
                    </div>
                    <span className="shrink-0 rounded bg-brand px-2 py-0.5 text-xs font-bold text-white">
                      {item.actionLabel}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
