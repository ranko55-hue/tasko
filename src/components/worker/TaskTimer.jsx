import { useEffect, useState } from 'react';
import { elapsedSeconds } from '../../lib/taskFlow';
import { formatDuration } from '../../lib/time';
import { he } from '../../locales/he';

// טיימר זמן נטו — מתקתק כשהמשימה בעבודה, קפוא אחרת
export default function TaskTimer({ task }) {
  const running = task.status === 'in_progress' && task.work_started_at;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div className="flex items-baseline justify-between rounded-xl bg-navy px-4 py-3 text-white">
      <span className="text-base text-lineDark">{he.worker.netTime}</span>
      <span
        className={`font-mono text-3xl font-bold tabular-nums ${running ? 'text-emerald-400' : ''}`}
      >
        {formatDuration(elapsedSeconds(task))}
      </span>
    </div>
  );
}
