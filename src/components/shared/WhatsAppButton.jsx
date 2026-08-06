import { buildWaLink } from '../../lib/waPhone';
import { he } from '../../locales/he';
import Icon from '../ui/Icon';

// אייקון וואטסאפ ליד מספר טלפון — פותח שיחת wa.me (עם הודעה מוקדמת אם ניתנה).
// ירוק וואטסאפ מוכר, מטרת מגע 40px. מחזיר null אם אין טלפון תקין.
export default function WhatsAppButton({ phone, text, title, size = 'md', className = '' }) {
  const href = buildWaLink(phone, text);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={title || he.wa.open}
      aria-label={he.wa.open}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#25d366] transition-colors hover:bg-[#25d366]/10 ${className}`}
    >
      <Icon name="whatsapp" size={size} strokeWidth={1.75} />
    </a>
  );
}
