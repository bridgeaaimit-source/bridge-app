'use client';

/**
 * ParticipantAvatar
 * 
 * Circular avatar for each GD participant (AI or student).
 * Shows: name initial, speaking ring animation, thinking indicator, listening pulse.
 * 
 * Props:
 *   name         string   — display name
 *   initial      string   — avatar letter
 *   color        string   — hex color for avatar background
 *   role         string   — 'moderator' | 'participant' | 'student'
 *   isActive     boolean  — currently speaking
 *   isThinking   boolean  — preparing to speak (show dots)
 *   isMuted      boolean  — mic off (student only)
 *   volume       number   — 0–100 for student mic waveform
 *   personality  string   — short label shown below name
 *   size         'sm'|'md'|'lg'
 */

export default function ParticipantAvatar({
  name = '',
  initial = '?',
  color = '#0D9488',
  role = 'participant',
  isActive = false,
  isThinking = false,
  isMuted = false,
  volume = 0,
  personality = '',
  size = 'md',
}) {
  const sizes = {
    sm: { outer: 56, inner: 44, text: 16, label: '10px' },
    md: { outer: 72, inner: 56, text: 20, label: '11px' },
    lg: { outer: 88, inner: 68, text: 24, label: '12px' },
  };
  const s = sizes[size] || sizes.md;
  const ringScale = isActive ? 1 + (volume / 400) : 1;

  return (
    <div className="flex flex-col items-center gap-2" style={{ minWidth: s.outer + 20 }}>
      {/* Avatar with speaking ring */}
      <div className="relative flex items-center justify-center" style={{ width: s.outer, height: s.outer }}>
        {/* Outer pulsing ring — only when active */}
        {isActive && (
          <>
            <div
              className="absolute rounded-full opacity-30 animate-ping"
              style={{
                width: s.outer,
                height: s.outer,
                backgroundColor: color,
                transform: `scale(${ringScale})`,
                animationDuration: '1.2s',
              }}
            />
            <div
              className="absolute rounded-full opacity-20"
              style={{
                width: s.outer + 12,
                height: s.outer + 12,
                border: `2px solid ${color}`,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
          </>
        )}

        {/* Avatar circle */}
        <div
          className="relative flex items-center justify-center rounded-full font-bold text-white select-none z-10 transition-all duration-300"
          style={{
            width: s.inner,
            height: s.inner,
            backgroundColor: color,
            fontSize: s.text,
            boxShadow: isActive
              ? `0 0 0 3px white, 0 0 0 5px ${color}`
              : '0 2px 8px rgba(0,0,0,0.12)',
            transform: isActive ? 'scale(1.05)' : 'scale(1)',
            opacity: isMuted ? 0.6 : 1,
          }}
        >
          {initial}

          {/* Thinking dots overlay */}
          {isThinking && !isActive && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5 bg-white rounded-full px-1.5 py-0.5 shadow-sm">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full"
                  style={{
                    backgroundColor: color,
                    animation: `bounce 1s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Muted indicator */}
          {isMuted && role === 'student' && (
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-3 h-3 text-white fill-none stroke-current" strokeWidth="2">
                <line x1="1" y1="1" x2="23" y2="23" />
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
          )}

          {/* Role badge for moderator */}
          {role === 'moderator' && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-white" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Name + personality label */}
      <div className="text-center space-y-0.5">
        <p
          className="font-semibold text-slate-800 leading-tight truncate"
          style={{ fontSize: s.label, maxWidth: s.outer + 20 }}
        >
          {name}
        </p>
        {personality && (
          <p
            className="text-slate-400 leading-tight truncate"
            style={{ fontSize: '9px', maxWidth: s.outer + 20 }}
          >
            {personality}
          </p>
        )}
        {isActive && (
          <p className="text-[9px] font-bold tracking-wide" style={{ color }}>
            SPEAKING
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.2; }
          50% { transform: scale(1.05); opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
