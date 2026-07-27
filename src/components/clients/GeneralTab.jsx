import { useState } from 'react';
import { he } from '../../locales/he';

const g = he.clientDetail.general;

function Tile({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-0.5 font-bold text-slate-900">{value || he.common.none}</div>
    </div>
  );
}

// לשונית "כללי" — רשת 2 עמודות של תאים + קישור טופס הקריאות עם העתקה.
export default function GeneralTab({ client }) {
  const [copied, setCopied] = useState(false);
  const link = `tasko.app/r/${client?.service_slug ?? ''}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText('https://' + link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* התעלמות — הקישור מוצג בכל מקרה */
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Tile label={g.contactName} value={client?.contact_name} />
        <Tile label={g.phone} value={client?.contact_phone} />
        <Tile label={g.email} value={client?.contact_email} />
        <Tile label={g.businessId} value={client?.business_id} />
        <Tile label={g.address} value={client?.address} />
        <Tile label={g.paymentTerms} value={client?.payment_terms} />
      </div>

      <div className="rounded-xl bg-slate-50 p-3">
        <div className="text-xs text-slate-400">{g.serviceLink}</div>
        <div className="mt-1 flex items-center gap-2">
          <code dir="ltr" className="min-w-0 flex-1 truncate text-sm text-slate-700">
            {link}
          </code>
          <button
            type="button"
            onClick={copy}
            className="min-h-touch shrink-0 rounded-lg bg-navy px-4 text-sm font-bold text-white hover:bg-navy2"
          >
            {copied ? g.copied : g.copy}
          </button>
        </div>
      </div>
    </div>
  );
}
