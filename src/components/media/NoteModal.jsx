import { useState } from 'react';
import { useOrg } from '../../lib/orgContext';
import { he } from '../../locales/he';
import { addNote } from '../../lib/taskFlow';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Textarea from '../shared/Textarea';
import VoiceRecorder from './VoiceRecorder';

// מודאל הערה — הקלדה (text_note) או הקלטה (voice_note).
// initialMode מאפשר לפתוח ישירות במצב הקלטה (אריח "הקלטה קולית" במגירה).
export default function NoteModal({ task, onDone, onClose, initialMode = 'text' }) {
  const { member } = useOrg();
  const [mode, setMode] = useState(initialMode); // 'text' | 'record'
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function saveText() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await addNote(task, member.id, text.trim());
      onDone();
    } catch {
      setBusy(false);
    }
  }

  return (
    <Modal title={he.worker.noteTitle} onClose={onClose}>
      {mode === 'record' ? (
        <VoiceRecorder task={task} onDone={onDone} onCancel={() => setMode('text')} />
      ) : (
        <div className="space-y-4">
          <Textarea
            label=""
            value={text}
            onChange={setText}
            placeholder={he.worker.notePlaceholder}
            rows={4}
          />
          <Button disabled={busy || !text.trim()} onClick={saveText}>
            {busy ? he.common.loading : he.worker.saveNote}
          </Button>
          <Button variant="outline" onClick={() => setMode('record')}>
            {he.media.recordChoice}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {he.common.cancel}
          </Button>
        </div>
      )}
    </Modal>
  );
}
