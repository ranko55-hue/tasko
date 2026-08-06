import { useSearchParams } from 'react-router-dom';
import { useOrg } from '../lib/orgContext';
import { isManager, isAdmin } from '../lib/roles';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { he } from '../locales/he';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import SettingRow from '../components/settings/SettingRow';
import ViewToggle from '../components/shared/ViewToggle';
import CustomFieldsManager from '../components/settings/CustomFieldsManager';
import WaTemplatesManager from '../components/settings/WaTemplatesManager';
import { useBoardView, BOARD_VIEW_OPTIONS } from '../hooks/useBoardView';
import { useMyTasksView, MY_TASKS_VIEW_OPTIONS } from '../hooks/useMyTasksView';

const t = he.settings;

// הגדרות הארגון — מאורגן ללשוניות פר-נושא (אותה שפה של לשוניות כרטיס לקוח/עובד).
// כל הגדרה קיימת עברה ללשונית הנושא שלה; אין שינוי התנהגות — ארגון בלבד.
// הלשונית הפעילה נשמרת ב-URL (settings?tab=...).
export default function SettingsPage() {
  const { member } = useOrg();
  const manager = isManager(member);
  const admin = isAdmin(member);
  const [params, setParams] = useSearchParams();
  const [boardView, chooseBoardView] = useBoardView();
  const [myTasksView, chooseMyTasksView] = useMyTasksView();
  const { settings, loading, saving, error, update } = useOrgSettings(
    manager ? member?.org_id : null,
  );

  if (!manager) {
    return (
      <>
        <PageHeader title={t.title} />
        <p className="py-8 text-center text-lg text-grayMid">{t.managersOnly}</p>
      </>
    );
  }

  // לשוניות שאין להן תוכן לתפקיד — לא מוצגות (שדות מותאמים/וואטסאפ = admin בלבד).
  const TABS = [
    { key: 'general', label: t.tabs.general },
    { key: 'display', label: t.tabs.display },
    { key: 'hours', label: t.tabs.workHours },
    { key: 'fields', label: t.tabs.customFields, adminOnly: true },
    { key: 'whatsapp', label: t.tabs.whatsapp, adminOnly: true },
  ].filter((tb) => !tb.adminOnly || admin);

  const requested = params.get('tab');
  const active = TABS.some((tb) => tb.key === requested) ? requested : 'general';
  const setTab = (k) => setParams({ tab: k });

  const orgErr = error && (
    <p className="mt-4 rounded-lg bg-urgentSoft px-3 py-2 font-medium text-urgentInk">{t.saveError}</p>
  );

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />
      <Tabs tabs={TABS} active={active} onChange={setTab} />

      <section className="max-w-2xl py-6">
        {/* ── כללי ── */}
        {active === 'general' && (
          loading ? <Loading /> : (
            <div className="space-y-6">
              <div className="rounded-lg bg-surface p-3">
                <div className="text-xs text-grayLight">{t.orgName}</div>
                <div className="mt-1 font-bold text-navy">{settings.name || he.common.none}</div>
              </div>

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
              {orgErr}
            </div>
          )
        )}

        {/* ── תצוגה ── */}
        {active === 'display' && (
          <div>
            <p className="mb-2 text-sm text-grayMid">{t.boardViewHint}</p>
            <ViewToggle options={BOARD_VIEW_OPTIONS} view={boardView} onChange={chooseBoardView} />

            <p className="mb-2 mt-6 text-sm text-grayMid">{t.myTasksViewHint}</p>
            <ViewToggle options={MY_TASKS_VIEW_OPTIONS} view={myTasksView} onChange={chooseMyTasksView} />
          </div>
        )}

        {/* ── שעות עבודה ── */}
        {active === 'hours' && (
          loading ? <Loading /> : (
            <div>
              <p className="mb-3 text-sm text-grayMid">{t.workHoursHint}</p>
              <div className="flex items-center gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-inkSoft">{t.workStart}</span>
                  <input
                    type="time"
                    value={settings.work_start_time}
                    disabled={saving}
                    onChange={(e) => update({ work_start_time: e.target.value })}
                    className="min-h-touch rounded-xl border border-line bg-white px-4 text-lg text-navy focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:opacity-50"
                  />
                </label>
                <span className="mt-6 text-grayLight">—</span>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-inkSoft">{t.workEnd}</span>
                  <input
                    type="time"
                    value={settings.work_end_time}
                    disabled={saving}
                    onChange={(e) => update({ work_end_time: e.target.value })}
                    className="min-h-touch rounded-xl border border-line bg-white px-4 text-lg text-navy focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20 disabled:opacity-50"
                  />
                </label>
              </div>
              {orgErr}
            </div>
          )
        )}

        {/* ── שדות מותאמים (admin) ── */}
        {active === 'fields' && admin && <CustomFieldsManager orgId={member.org_id} />}

        {/* ── וואטסאפ (admin) ── */}
        {active === 'whatsapp' && admin && (
          <div>
            <p className="mb-3 text-sm text-grayMid">{he.wa.sectionHint}</p>
            <WaTemplatesManager orgId={member.org_id} />
          </div>
        )}
      </section>
    </>
  );
}

function Loading() {
  return <p className="py-8 text-center text-lg text-grayMid">{he.common.loading}</p>;
}
