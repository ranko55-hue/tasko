import { buildWaLink } from '../../lib/waPhone';
import { he } from '../../locales/he';
import WhatsAppIcon from './WhatsAppIcon';

// אייקון וואטסאפ ליד מספר טלפון — פותח שיחת wa.me (עם הודעה מוקדמת אם ניתנה).
// גליף רשמי 20px בתוך מטרת מגע 40px (radius 8), ירוק וואטסאפ, hover עדין.
// inline-flex + align-middle כדי שיישב על קו הבסיס של המספר שלידו, לא צף.
export default function WhatsAppButton({ phone, text, title, className = '' }) {
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
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg align-middle text-[#25D366] transition-colors hover:bg-[#25D366]/10 ${className}`}
    >
      <WhatsAppIcon size={20} />
    </a>
  );
}
