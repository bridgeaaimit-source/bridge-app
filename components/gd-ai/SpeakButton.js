'use client';

/**
 * SpeakButton
 * 
 * The primary interaction control for the student in the live GD room.
 * States:
 *   'idle'     — AI is speaking. Shows "Jump In" with pulsing ring.
 *   'queued'   — Student pressed Jump In. Shows "Your turn soon..."
 *   'active'   — Student's mic is live. Shows "Done Speaking" with waveform.
 *   'thinking' — AI is preparing response (between turns).
 *   'disabled' — Session ended or not yet started.
 */

export default function SpeakButton({ state = 'idle', onJumpIn, onDoneSpeaking, volume = 0 }) {
  const configs = {
    idle: {
      label: 'Speak Now',
      sublabel: 'Jump into the discussion',
      icon: <MicIcon />,
      onClick: onJumpIn,
      color: '#0D9488',
      textColor: 'white',
      pulse: true,
      disabled: false,
    },
    queued: {
      label: 'Your turn soon...',
      sublabel: 'Current speaker finishing',
      icon: <WaitIcon />,
      onClick: null,
      color: '#F59E0B',
      textColor: 'white',
      pulse: false,
      disabled: true,
    },
    active: {
      label: 'Done Speaking',
      sublabel: 'Tap when finished',
      icon: <StopIcon />,
      onClick: onDoneSpeaking,
      color: '#DC2626',
      textColor: 'white',
      pulse: false,
      disabled: false,
    },
    thinking: {
      label: 'Listening...',
      sublabel: 'AI is processing',
      icon: <ThinkIcon />,
      onClick: null,
      color: '#6B7280',
      textColor: 'white',
      pulse: false,
      disabled: true,
    },
    disabled: {
      label: 'Session Ended',
      sublabel: '',
      icon: null,
      onClick: null,
      color: '#E5E7EB',
      textColor: '#9CA3AF',
      pulse: false,
      disabled: true,
    },
  };

  const cfg = configs[state] || configs.idle;

  // Volume ring size for active state
  const volumeRingScale = state === 'active' ? 1 + (volume / 200) : 1;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        {/* Pulse ring */}
        {cfg.pulse && (
          <div
            className="absolute w-20 h-20 rounded-full opacity-25 animate-ping"
            style={{ backgroundColor: cfg.color, animationDuration: '1.8s' }}
          />
        )}

        {/* Volume ring for active mic */}
        {state === 'active' && (
          <div
            className="absolute rounded-full opacity-30 transition-transform duration-75"
            style={{
              width: 80,
              height: 80,
              backgroundColor: cfg.color,
              transform: `scale(${volumeRingScale})`,
            }}
          />
        )}

        {/* Main button */}
        <button
          onClick={cfg.onClick || undefined}
          disabled={cfg.disabled}
          className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 active:scale-95"
          style={{
            backgroundColor: cfg.color,
            color: cfg.textColor,
            boxShadow: cfg.disabled ? 'none' : `0 4px 20px ${cfg.color}60`,
            cursor: cfg.disabled ? 'default' : 'pointer',
          }}
          aria-label={cfg.label}
        >
          <div className="w-7 h-7 flex items-center justify-center">
            {cfg.icon}
          </div>
        </button>
      </div>

      {/* Labels */}
      <div className="text-center space-y-0.5">
        <p className="text-sm font-bold text-slate-800">{cfg.label}</p>
        {cfg.sublabel && (
          <p className="text-xs text-slate-400">{cfg.sublabel}</p>
        )}
      </div>

      {/* Keyboard shortcut hint */}
      {state === 'idle' && (
        <p className="text-[10px] text-slate-300 font-medium">Press Space to speak</p>
      )}
    </div>
  );
}

// SVG Icons
function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function WaitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function ThinkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
