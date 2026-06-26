'use client';

/**
 * GDTimer
 * 
 * Simple, premium timer component displaying count-up MM:SS.
 * Highlights in red when 1 minute remains (9:00 / 540s or later).
 * 
 * Props:
 *   elapsedSeconds  number — total elapsed seconds in the session
 */
export default function GDTimer({ elapsedSeconds = 0 }) {
  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = elapsedSeconds >= 540; // 9:00 minutes elapsed (1 min left of 10-min session)

  return (
    <div className="flex items-center gap-2">
      {/* Small pulsing dot */}
      <div 
        className={`w-2.5 h-2.5 rounded-full ${
          isWarning ? 'bg-red-500 animate-ping' : 'bg-teal-500 animate-pulse'
        }`} 
      />
      <span 
        className={`font-mono text-sm font-bold tracking-wider tabular-nums transition-colors duration-300 ${
          isWarning ? 'text-red-600 font-black' : 'text-slate-600'
        }`}
      >
        {formatTime(elapsedSeconds)}
      </span>
    </div>
  );
}
