'use client';

import Link from 'next/link';

/**
 * PastSessions
 * 
 * Displays list of past GD sessions completed by the user.
 * 
 * Props:
 *   sessions  array — list of session objects containing { sessionId, topic, category, overallScore, createdAt }
 *   loading   boolean — whether sessions are loading
 */
export default function PastSessions({ sessions = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm animate-pulse flex items-center justify-between">
            <div className="space-y-2.5 w-2/3">
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/4" />
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h4 className="font-bold text-slate-700 text-sm mb-1">No Practice History Yet</h4>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
          Start your first Solo AI GD practice to build your Bridge Score.
        </p>
      </div>
    );
  }

  // Format date safely
  const formatDate = (dateVal) => {
    if (!dateVal) return '';
    try {
      let d = dateVal;
      // Handle Firestore timestamps
      if (dateVal.seconds) {
        d = new Date(dateVal.seconds * 1000);
      } else {
        d = new Date(dateVal);
      }
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 60) return 'text-teal-600 bg-teal-50 border-teal-100';
    if (score >= 45) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-4">
      {sessions.map((session) => {
        const scoreColor = getScoreColor(session.overallScore);
        return (
          <div 
            key={session.sessionId}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            {/* Session Info */}
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  {session.category || 'General'}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  {formatDate(session.createdAt)}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                {session.topic}
              </h3>
            </div>

            {/* Score & View CTA */}
            <div className="flex items-center justify-between sm:justify-end gap-5 border-t border-slate-50 pt-3 sm:border-t-0 sm:pt-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Score:</span>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-sm border-2 ${scoreColor}`}>
                  {session.overallScore}
                </div>
              </div>
              <Link 
                href={`/gd/ai/report/${session.sessionId}`}
                className="text-xs font-bold text-teal-600 border border-teal-200 hover:bg-teal-50 px-4 py-2 rounded-xl transition-all duration-200"
              >
                View Report
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
