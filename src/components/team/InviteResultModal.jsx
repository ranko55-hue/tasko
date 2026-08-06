import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { buildWaLink, fillTokens } from '../../lib/waPhone';
import { useWaTemplates, findInviteTemplate } from '../../hooks/useWaTemplates';
import { inviteUrl } from '../../hooks/useMemberAccess';
import { he } from '../../locales/he';
import Button from '../shared/Button';
import WhatsAppIcon from '../shared/WhatsAppIcon';

const t = he.team.invite;

// מוצג מיד אחרי הקמת עובד (וגם אחרי "שלח מחדש"): קישור ההזמנה + שליחה בוואטסאפ.
export default function InviteResultModal({ token, fullName, phone, orgId, onClose }) {
  const { templates } = useWaTemplates(orgId);
  const [orgName, setOrgName] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('organizations').select('name').eq('id', orgId).maybeSingle();
      setOrgName(data?.name ?? '');
    })();
  }, [orgId]);

  const link = inviteUrl(token);
  const tpl = findInviteTemplate(templates);
  const message = tpl
    ? fillTokens(tpl.body, { employeeName: fullName, orgName, link })
    : t.defaultMessage.replace('{name}', fullName).replace('{org}', orgName).replace('{link}', link);
  const waHref = buildWaLink(phone, message);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* הקישור מוצג בכל מקרה */ }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-emerald-50 p-4">
        <p className="text-sm font-bold text-emerald-800">{t.created}</p>
        <p className="mt-1 text-xs text-emerald-700">{t.createdHint}</p>
      </div>

      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="text-xs font-medium text-grayMid">{t.link}</div>
        <div className="mt-1 flex items-center gap-2">
          <code dir="ltr" className="min-w-0 flex-1 truncate text-sm text-inkSoft">{link}</code>
          <Button variant="ghost" size="sm" fullWidth={false} className="shrink-0" onClick={copy}>
            {copied ? he.common.copied : t.copyLink}
          </Button>
        </div>
      </div>

      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-touch w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 font-bold text-white transition-opacity hover:opacity-90"
        >
          <WhatsAppIcon size={20} />
          {t.sendWhatsApp}
        </a>
      )}

      <Button variant="ghost" onClick={onClose}>{he.common.close}</Button>
    </div>
  );
}
