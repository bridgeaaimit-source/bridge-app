'use client';

/**
 * TranscriptPanel
 * 
 * Streaming transcript display.
 * Shows conversation with per-speaker color coding.
 * Auto-scrolls as new tokens arrive.
 * Student can scroll up to read history; auto-scroll re-attaches when they reach bottom.
 */

import { useRef, useEffect, useState, useCallback } from 'react';

// Consistent color per speaker id
const SPEAKER_COLORS = {
  moderator: { bg: '#F0FDF4', border: '#86EFAC', name: '#15803D', dot: '#22C55E' },
  aggressive: { bg: '#FFF7ED', border: '#FED7AA', name: '#C2410C', dot: '#F97316' },
  analytical: { bg: '#EFF6FF', border: '#BFDBFE', name: '#1D4ED8', dot: '#3B82F6' },
  contrarian: { bg: '#FAF5FF', border: '#DDD6FE', name: '#6D28D9', dot: '#8B5CF6' },
  balanced:   { bg: '#F0FDF4', border: '#A7F3D0', name: '#065F46', dot: '#10B981' },
  student:    { bg: '#F0F9FF', border: '#BAE6FD', name: '#0369A1', dot: '#0EA5E9' },
};

const FALLBACK_COLOR = { bg: '#F8FAFC', border: '#E2E8F0', name: '#475569', dot: '#94A3B8' };

export default function TranscriptPanel({ turns = [], streamingText = '', streamingSpeakerId = null, speakerNames = {} }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimerRef = useRef(null);

  // Auto-scroll logic
  const scrollToBottom = useCallback(() => {
    if (!isUserScrolling && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isUserScrolling]);

  useEffect(() => { scrollToBottom(); }, [turns, streamingText, scrollToBottom]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (!isAtBottom) {
      setIsUserScrolling(true);
      clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setIsUserScrolling(false), 4000);
    } else {
      setIsUserScrolling(false);
    }
  };

  const displayTurns = [...turns];
  if (streamingSpeakerId && streamingText) {
    // Show the currently streaming turn inline
    displayTurns.push({
      speakerId: streamingSpeakerId,
      text: streamingText,
      streaming: true,
    });
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex flex-col gap-3 overflow-y-auto px-1"
      style={{ maxHeight: '100%' }}
    >
      {displayTurns.length === 0 && (
        <div className="text-center text-slate-400 text-sm py-8">
          Discussion will appear here...
        </div>
      )}

      {displayTurns.map((turn, idx) => {
        const colors = SPEAKER_COLORS[turn.speakerId] || FALLBACK_COLOR;
        const isModerator = turn.speakerId === 'moderator';
        const isStudent = turn.speakerId === 'student';
        const speakerName = speakerNames[turn.speakerId]
          || (isStudent ? 'You' : turn.speakerId);

        return (
          <div key={idx} className={`flex gap-2.5 ${isStudent ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Speaker dot */}
            <div className="flex-shrink-0 mt-1">
              <div
                className="w-2 h-2 rounded-full mt-1.5"
                style={{ backgroundColor: colors.dot }}
              />
            </div>

            {/* Message bubble */}
            <div
              className={`relative rounded-2xl px-4 py-2.5 max-w-[85%] ${isStudent ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
              style={{
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                opacity: turn.streaming ? 1 : 1,
              }}
            >
              {/* Speaker name */}
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: colors.name }}
                >
                  {isModerator ? '★ ' : ''}{speakerName}
                </span>
                {isModerator && (
                  <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                    Moderator
                  </span>
                )}
                {isStudent && (
                  <span className="text-[9px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-semibold">
                    You
                  </span>
                )}
              </div>

              {/* Text */}
              <p className="text-sm text-slate-700 leading-relaxed">
                {turn.text}
                {turn.streaming && (
                  <span
                    className="inline-block w-0.5 h-4 ml-0.5 bg-slate-400 align-middle"
                    style={{ animation: 'blink 1s step-end infinite' }}
                  />
                )}
              </p>
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} className="h-1" />

      {/* Scroll up indicator */}
      {isUserScrolling && (
        <button
          onClick={() => {
            setIsUserScrolling(false);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="fixed bottom-36 left-1/2 -translate-x-1/2 z-20 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-slate-700 transition-colors"
        >
          ↓ Jump to latest
        </button>
      )}

      <style jsx>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
