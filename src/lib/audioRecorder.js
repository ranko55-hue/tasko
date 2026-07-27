// בחירת פורמט הקלטה נתמך — iOS Safari מעדיף audio/mp4, אחרים webm/opus.
export function pickAudioType() {
  const candidates = [
    { mimeType: 'audio/mp4', ext: 'm4a' },
    { mimeType: 'audio/webm;codecs=opus', ext: 'webm' },
    { mimeType: 'audio/webm', ext: 'webm' },
  ];
  const supported = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported;
  for (const c of candidates) {
    if (supported && MediaRecorder.isTypeSupported(c.mimeType)) return c;
  }
  return { mimeType: '', ext: 'webm' }; // ברירת מחדל של הדפדפן
}

export const MAX_RECORDING_SECONDS = 120;
