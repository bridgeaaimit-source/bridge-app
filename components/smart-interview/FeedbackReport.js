"use client";

import React from 'react';
import { useInterviewState } from '@/context/InterviewContext';
import { Mic, Lightbulb, CheckCircle, AlertCircle, Award, RefreshCw } from 'lucide-react';
import AppShell from '@/components/AppShell';
import PremiumLoading from './PremiumLoading';

export default function FeedbackReport({ resetInterview, isEvaluating, onRetryEvaluation }) {
  const state = useInterviewState();
  const feedback = state.evaluation.feedback;
  const jobRole = state.config.jobRole;
  const round = state.config.round;
  const integrityScore = state.integrity.integrityScore;
  const violations = state.integrity.violations;

  // ── Premium full-screen loading overlay ──────────────────────────────────
  if (isEvaluating) {
    return <PremiumLoading />;
  }

  // ── Error state: evaluation failed ───────────────────────────────────────
  if (!feedback || feedback.error) {
    return (
      <AppShell>

        <div className="relative max-w-[600px] mx-auto px-6 py-20 text-center flex flex-col items-center gap-6 z-10">
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-4xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              Report Generation Failed
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed font-semibold">
              We couldn&apos;t generate your feedback report. This may be due to a network timeout or server issue.
              Your interview responses have been saved — you can try again.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            {onRetryEvaluation && (
              <button
                onClick={onRetryEvaluation}
                className="flex-1 flex items-center justify-center gap-2 bg-[#00C4A7] text-white py-3 px-6 rounded-xl font-bold hover:bg-[#00b296] transition-colors shadow-sm text-xs"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Report
              </button>
            )}
            <button
              onClick={resetInterview}
              className="flex-1 py-3 px-6 bg-white border border-slate-200/65 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors text-xs shadow-sm"
            >
              New Interview
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Full feedback report ──────────────────────────────────────────────────
  return (
    <AppShell>

      <div className="relative max-w-[1240px] mx-auto px-6 py-8 z-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-10 border-b border-slate-100 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Performance Report
            </h1>
            <p className="text-slate-550 mt-1.5 text-sm font-semibold">{jobRole} · {round}</p>
          </div>
          <button
            onClick={resetInterview}
            className="flex items-center gap-2 bg-[#00C4A7]/10 text-[#00C4A7] px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#00C4A7]/20 transition-all shadow-sm"
          >
            <Mic className="w-4 h-4" /> New Interview
          </button>
        </div>

        <div className="space-y-8">

          {/* Placement & Integrity score headers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              const chance = feedback.placement_chance || feedback.placementChance || 0;
              const isHigh = chance >= 75;
              const isMid  = chance >= 50;
              return (
                <div className={`rounded-3xl p-8 text-center flex flex-col justify-center items-center shadow-sm ${
                  isHigh ? 'bg-gradient-to-r from-[#00C4A7] to-[#00b296]' :
                  isMid  ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                           'bg-gradient-to-r from-red-500 to-rose-400'
                }`}>
                  <p className="text-white/70 uppercase tracking-widest text-[10px] font-bold mb-2">Placement Chance</p>
                  <p className="text-6xl font-extrabold text-white mb-3">{chance}%</p>
                  <span className="inline-flex items-center bg-white/20 text-white px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider">
                    {feedback.verdict || 'Pending'}
                  </span>
                </div>
              );
            })()}

            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-8 shadow-sm flex flex-col justify-center items-center text-center">
              <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-2">Integrity Score</p>
              <p className={`text-6xl font-extrabold mb-3 ${
                integrityScore >= 80 ? 'text-[#00C4A7]' :
                integrityScore >= 50 ? 'text-yellow-600' : 'text-red-500'
              }`}>
                {integrityScore}%
              </p>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${
                integrityScore >= 80 ? 'bg-green-50 text-green-700 border border-green-100' :
                integrityScore >= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {integrityScore >= 80 ? '🔒 Integrity Passed' :
                 integrityScore >= 50 ? '⚠️ Warnings Triggered' : '❌ Flagged for Review'}
              </span>
              {violations.length > 0 && (
                <p className="text-[10px] text-slate-400 font-bold mt-3 uppercase tracking-wider">{violations.length} tab/window switch{violations.length > 1 ? 'es' : ''} detected.</p>
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(feedback.scores || {}).map(([key, value]) => {
              const scoreValue = typeof value === 'object' && value !== null && 'score' in value
                ? value.score : value;
              return (
                <div key={key} className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-2 truncate">{key.replace(/_/g, ' ')}</p>
                  <p className="text-2xl font-extrabold text-[#00C4A7] mb-2">
                    {scoreValue}<span className="text-xs text-slate-400 font-bold">/10</span>
                  </p>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="bg-[#00C4A7] h-1.5 rounded-full" style={{ width: `${Math.min(scoreValue * 10, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {feedback.summary && (
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#00C4A7]" />
                Performance Summary
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-semibold mb-6">{feedback.summary.key_takeaways}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {feedback.summary.strengths && (
                  <div className="bg-green-50/30 border border-green-100/40 rounded-2xl p-5">
                    <div className="text-[10px] font-bold mb-3 uppercase tracking-wider text-green-700">Key Strengths</div>
                    <ul className="space-y-2.5">
                      {feedback.summary.strengths.map((s, i) => (
                        <li key={i} className="text-xs font-semibold text-slate-700 flex items-start gap-2 leading-relaxed">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.summary.weaknesses && (
                  <div className="bg-amber-50/30 border border-amber-100/40 rounded-2xl p-5">
                    <div className="text-[10px] font-bold mb-3 uppercase tracking-wider text-amber-700">Areas to Improve</div>
                    <ul className="space-y-2.5">
                      {feedback.summary.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs font-semibold text-slate-700 flex items-start gap-2 leading-relaxed">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Career Insights */}
          {feedback.career_insights && (
            <div className="bg-white/70 backdrop-blur-md border border-white/30 rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="font-extrabold text-slate-800 mb-6 text-sm flex items-center gap-2">
                <Award className="w-5 h-5 text-[#00C4A7]" />
                Career Insights
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center py-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Market Fit</div>
                  <div className={`text-lg font-extrabold ${
                    feedback.career_insights.market_fit === 'High' ? 'text-green-600' :
                    feedback.career_insights.market_fit === 'Medium' ? 'text-yellow-600' :
                    'text-red-650'
                  }`}>{feedback.career_insights.market_fit}</div>
                </div>
                <div className="text-center py-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Salary Range</div>
                  <div className="text-lg font-extrabold text-slate-800">{feedback.career_insights.salary_range}</div>
                </div>
                <div className="text-center py-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1">Growth Potential</div>
                  <div className={`text-lg font-extrabold ${
                    feedback.career_insights.growth_potential === 'High' ? 'text-green-600' :
                    feedback.career_insights.growth_potential === 'Medium' ? 'text-yellow-600' :
                    'text-red-650'
                  }`}>{feedback.career_insights.growth_potential}</div>
                </div>
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-2">Recommended Roles</div>
                  <div className="flex flex-wrap gap-1.5">
                    {feedback.career_insights.recommended_roles?.map((role, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#00C4A7]/10 text-[#00C4A7] rounded-lg text-[9px] font-bold uppercase tracking-wide">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={resetInterview}
              className="px-6 py-3.5 bg-white border border-slate-200/60 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold shadow-sm transition-colors"
            >
              Try Another Interview
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
