import { useEffect, useState } from 'react';
import { elapsedSeconds } from '../../lib/taskFlow';
import { formatDuration } from '../../lib/time';

// טיימר זמן נטו חי — מתקתק כשהמשימה בעבודה. tabular-nums (DESIGN §2).
export default function LiveNet({ task, className = '' }) {
  const running = task.status === 'in_progress' && task.work_started_at;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <span className={`font-mono font-bold tabular-nums ${className}`}>
      {formatDuration(elapsedSeconds(task))}
    </span>
  );
}
