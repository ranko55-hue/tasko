import { he } from '../locales/he';
import PageHeader from '../components/ui/PageHeader';
import Icon from '../components/ui/Icon';

const r = he.reports;

export default function ReportsPage() {
  return (
    <>
      <PageHeader title={r.title} subtitle={r.subtitle} />

      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Icon name="report" size="xl" className="text-slate-300" />
        <p className="text-lg font-bold text-slate-400">{r.placeholder}</p>
      </div>
    </>
  );
}
