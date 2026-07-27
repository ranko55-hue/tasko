import { useState } from 'react';
import { he } from '../../locales/he';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Textarea from '../shared/Textarea';

// מודאל הזנת טקסט — לשימוש חוזר (הערה / דיווח עיכוב)
export default function TextEntryModal({
  title,
  placeholder,
  submitLabel,
  variant = 'primary',
  onSubmit,
  onClose,
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onSubmit(text.trim());
    } catch {
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <Textarea label="" value={text} onChange={setText} placeholder={placeholder} rows={4} />
        <Button variant={variant} disabled={busy || !text.trim()} onClick={submit}>
          {busy ? he.common.loading : submitLabel}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {he.common.cancel}
        </Button>
      </div>
    </Modal>
  );
}
