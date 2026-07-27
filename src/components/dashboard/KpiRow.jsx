import { he } from '../../locales/he';

// אריח KPI על רקע כהה (מגדל פיקוח)
function Tile({ label, value, valueClass = 'text-white', dot }) {
  return (
    <div className="rounded-2xl bg-navy2 p-4">
      <div className="flex items-center gap-2">
        {dot && (
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statusGreen opacity-70" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-statusGreen" />
          </span>
        )}
        <span className="text-sm text-slate-400">{label}</span>
      </div>
      <div className={`mt-1 text-3xl font-black tabular-nums ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}

export default function KpiRow({ kpis }) {
  const k = he.dashboard.kpi;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Tile label={k.open} value={kpis.open} valueClass="text-brandYellow" />
      <Tile label={k.inField} value={kpis.inField} dot />
      <Tile
        label={k.alerts}
        value={kpis.alerts}
        valueClass={kpis.alerts > 0 ? 'text-statusRed' : 'text-white'}
      />
      <Tile label={k.doneToday} value={kpis.doneToday} valueClass="text-slate-300" />
    </div>
  );
}
