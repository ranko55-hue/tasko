import { useOrg } from '../lib/orgContext';
import { isManager, isAdmin } from '../lib/roles';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { he } from '../locales/he';
import PageHeader from '../components/ui/PageHeader';
import SettingRow from '../components/settings/SettingRow';
import ViewToggle from '../components/shared/ViewToggle';
import CustomFieldsManager from '../components/settings/CustomFieldsManager';
import { useBoardView, BOARD_VIEW_OPTIONS } from '../hooks/useBoardView';
import { useMyTasksView, MY_TASKS_VIEW_OPTIONS } from '../hooks/useMyTasksView';

const t = he.settings;

// הגדרות הארגון (אפיון v8 §3.9) — מנהלים בלבד.
// המבנה מחולק לסעיפים כדי שהגדרות נוספות ייכנסו בלי שינוי מבנה.
export default function SettingsPage() {
  const { member } = useOrg();
  const manager = isManager(member);
  const admin = isAdmin(member);
  const [boardView, chooseBoardView] = useBoardView();
  const [myTasksView, chooseMyTasksView] = useMyTasksView();
  const { settings, loading, saving, error, update } = useOrgSettings(
    manager ? member?.org_id : null
  );

  if (!manager) {
    return (
      <>
        <PageHeader title={t.title} />
        <p className="py-8 text-center text-lg text-slate-500">{t.managersOnly}</p>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      {loading ? (
        <p className="py-8 text-center text-lg text-slate-500">{he.common.loading}</p>
      ) : (
        <section className="max-w-2xl">
          <h2 className="mb-3 text-sm font-black text-slate-500">{t.sectionTasks}</h2>
          <div className="space-y-3">
            <SettingRow
              label={t.requireProject}
              hint={t.requireProjectHint}
              checked={settings.require_project}
              disabled={saving}
              onChange={(v) => update({ require_project: v })}
            />
            <SettingRow
              label={t.requireApproval}
              hint={t.requireApprovalHint}
              checked={settings.require_approval}
              disabled={saving}
              onChange={(v) => update({ require_approval: v })}
            />
          </div>

          {/* שעות עבודה */}
          <h2 className="mb-3 mt-8 text-sm font-black text-slate-500">
            {t.sectionWorkHours}
          </h2>
          <p className="mb-3 text-sm text-slate-500">{t.workHoursHint}</p>
          <div className="flex items-center gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">{t.workStart}</span>
              <input
                type="time"
                value={settings.work_start_time}
                disabled={saving}
                onChange={(e) => update({ work_start_time: e.target.value })}
                className="min-h-touch rounded-xl border border-line bg-white px-4 text-lg text-slate-900
                           focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20
                           disabled:opacity-50"
              />
            </label>
            <span className="mt-6 text-slate-400">—</span>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">{t.workEnd}</span>
              <input
                type="time"
                value={settings.work_end_time}
                disabled={saving}
                onChange={(e) => update({ work_end_time: e.target.value })}
                className="min-h-touch rounded-xl border border-line bg-white px-4 text-lg text-slate-900
                           focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20
                           disabled:opacity-50"
              />
            </label>
          </div>

          {/* מקטע אחד לשתי התצוגות — הלוח ו"המשימות שלי" */}
          <h2 className="mb-3 mt-8 text-sm font-black text-slate-500">
            {t.sectionBoardView}
          </h2>

          <p className="mb-2 text-sm text-slate-500">{t.boardViewHint}</p>
          <ViewToggle options={BOARD_VIEW_OPTIONS} view={boardView} onChange={chooseBoardView} />

          <p className="mb-2 mt-6 text-sm text-slate-500">{t.myTasksViewHint}</p>
          <ViewToggle
            options={MY_TASKS_VIEW_OPTIONS}
            view={myTasksView}
            onChange={chooseMyTasksView}
          />

          {admin && (
            <div className="mt-8">
              <CustomFieldsManager orgId={member.org_id} />
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 font-medium text-red-700">
              {t.saveError}
            </p>
          )}
        </section>
      )}
    </>
  );
}
