import { useOrg } from '../lib/orgContext';
import { isManager } from '../lib/roles';
import { useOrgSettings } from '../hooks/useOrgSettings';
import { he } from '../locales/he';
import PageHeader from '../components/ui/PageHeader';
import SettingRow from '../components/settings/SettingRow';

const t = he.settings;

// הגדרות הארגון (אפיון v8 §3.9) — מנהלים בלבד.
// המבנה מחולק לסעיפים כדי שהגדרות נוספות ייכנסו בלי שינוי מבנה.
export default function SettingsPage() {
  const { member } = useOrg();
  const manager = isManager(member);
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
          </div>

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
