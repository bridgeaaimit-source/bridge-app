'use client';

/**
 * DimensionScore
 * 
 * Displays the score, letter grade, evaluation summary, evidence quotes,
 * and growth exercises for one of the 9 Group Discussion dimensions.
 * 
 * Props:
 *   dimensionId   string — ID of the dimension (e.g. 'communication', 'listening')
 *   data          object — the dimension data containing { score, grade, summary, evidence, improvement, exercise }
 */
export default function DimensionScore({ dimensionId, data }) {
  if (!data) return null;

  const titles = {
    communication: 'Communication Clarity',
    leadership: 'Leadership & Structuring',
    confidence: 'Voice & Confidence',
    criticalThinking: 'Critical Thinking',
    listening: 'Active Listening',
    persuasiveness: 'Persuasiveness & Impact',
    participation: 'Participation Balance',
    collaboration: 'Collaboration & Building',
    evidenceUsage: 'Evidence & Data Usage',
  };

  const title = titles[dimensionId] || dimensionId;

  // Grade colors
  const gradeColors = {
    A: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    B: { bg: 'bg-teal-50 text-teal-700 border-teal-200' },
    C: { bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    D: { bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    F: { bg: 'bg-red-50 text-red-700 border-red-200' },
  };
  const gradeStyle = gradeColors[data.grade] || gradeColors.C;

  // Progress bar colors
  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-teal-500';
    if (score >= 45) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4">
      {/* Title + Grade + Score Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg leading-tight">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Evaluation Dimension</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${gradeStyle.bg}`}>
            Grade {data.grade}
          </span>
          <span className="text-xl font-extrabold text-slate-800">
            {data.score}<span className="text-xs text-slate-400 font-normal">/100</span>
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(data.score)}`}
          style={{ width: `${data.score}%` }}
        />
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-600 leading-relaxed font-medium">
        {data.summary}
      </p>

      {/* Evidence Quotes */}
      {data.evidence && data.evidence.length > 0 && data.evidence[0].quote && (
        <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evidence Quote</span>
          <blockquote className="text-xs italic text-slate-600 border-l-2 border-teal-500 pl-3 leading-relaxed">
            "{data.evidence[0].quote}"
          </blockquote>
          {data.evidence[0].annotation && (
            <p className="text-[11px] text-slate-500 font-medium pl-3">
              💡 {data.evidence[0].annotation}
            </p>
          )}
        </div>
      )}

      {/* Improvement & Daily Exercise */}
      <div className="border-t border-slate-100 pt-4 mt-auto space-y-3">
        {data.improvement && (
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              !
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Improvement Focus</span>
              <p className="text-xs text-slate-600 leading-relaxed">{data.improvement}</p>
            </div>
          </div>
        )}
        {data.exercise && (
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 text-xs font-bold">
              ✓
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Actionable Exercise</span>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">{data.exercise}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
