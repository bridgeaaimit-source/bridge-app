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
        <div className="max-w-[600px] mx-auto px-6 py-20 text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-4xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Report Generation Failed
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              We couldn&apos;t generate your feedback report. This may be due to a network timeout or server issue.
              Your interview responses have been saved — you can try again.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            {onRetryEvaluation && (
              <button
                onClick={onRetryEvaluation}
                className="flex-1 flex items-center justify-center gap-2 bg-[#0D9488] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Report
              </button>
            )}
            <button
              onClick={resetInterview}
              className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
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
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>
              Performance Report
            </h1>
            <p className="text-gray-500 mt-1 text-sm">{jobRole} · {round}</p>
          </div>
          <button
            onClick={resetInterview}
            className="flex items-center gap-2 bg-[#CCFBF1] text-[#0D9488] px-5 py-2 rounded-full font-semibold text-sm hover:bg-[#99F6E4] transition-colors"
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
                <div className={`rounded-2xl p-8 text-center flex flex-col justify-center items-center ${
                  isHigh ? 'bg-gradient-to-r from-[#0D9488] to-[#14B8A6]' :
                  isMid  ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                           'bg-gradient-to-r from-red-500 to-rose-400'
                }`}>
                  <p className="text-white/70 uppercase tracking-widest text-xs font-bold mb-2">Placement Chance</p>
                  <p className="text-6xl font-bold text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>{chance}%</p>
                  <span className="inline-flex items-center bg-white/20 text-white px-5 py-2 rounded-full text-sm font-bold">
                    {feedback.verdict || 'Pending'}
                  </span>
                </div>
              );
            })()}

            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] flex flex-col justify-center items-center text-center">
              <p className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-2">Integrity Score</p>
              <p className={`text-6xl font-bold mb-3 ${
                integrityScore >= 80 ? 'text-[#0D9488]' :
                integrityScore >= 50 ? 'text-yellow-600' : 'text-red-500'
              }`} style={{ fontFamily: 'Syne, sans-serif' }}>
                {integrityScore}%
              </p>
              <span className={`inline-flex items-center px-5 py-2 rounded-full text-sm font-bold ${
                integrityScore >= 80 ? 'bg-teal-50 text-[#0D9488] border border-teal-100' :
                integrityScore >= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {integrityScore >= 80 ? '🔒 Integrity Passed' :
                 integrityScore >= 50 ? '⚠️ Warnings Triggered' : '❌ Flagged for Review'}
              </span>
              {violations.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">{violations.length} tab/window switch{violations.length > 1 ? 'es' : ''} detected.</p>
              )}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(feedback.scores || {}).map(([key, value]) => {
              const scoreValue = typeof value === 'object' && value !== null && 'score' in value
                ? value.score : value;
              return (
                <div key={key} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(13,148,136,0.06)] border border-gray-100">
                  <p className="text-[10px] text-gray-400 capitalize mb-2">{key.replace(/_/g, ' ')}</p>
                  <p className="text-2xl font-bold text-[#0D9488] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {scoreValue}<span className="text-sm text-gray-400">/10</span>
                  </p>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-[#0D9488] h-1.5 rounded-full" style={{ width: `${Math.min(scoreValue * 10, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {feedback.summary && (
            <div className="bg-gradient-to-r from-[#0D9488] to-[#0F766E] rounded-2xl p-8 text-white">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Performance Summary
              </h3>
              <p className="text-[#CCFBF1] mb-4 text-sm leading-relaxed">{feedback.summary.key_takeaways}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {feedback.summary.strengths && (
                  <div>
                    <div className="text-xs font-bold mb-2 uppercase tracking-wide text-[#CCFBF1]">Strengths</div>
                    <ul className="space-y-1">
                      {feedback.summary.strengths.map((s, i) => (
                        <li key={i} className="text-xs flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {feedback.summary.weaknesses && (
                  <div>
                    <div className="text-xs font-bold mb-2 uppercase tracking-wide text-[#CCFBF1]">Areas to Improve</div>
                    <ul className="space-y-1">
                      {feedback.summary.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />{w}
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
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                <Award className="w-5 h-5 text-[#0D9488]" />
                Career Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Market Fit</div>
                  <div className={`text-lg font-bold ${
                    feedback.career_insights.market_fit === 'High' ? 'text-green-600' :
                    feedback.career_insights.market_fit === 'Medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>{feedback.career_insights.market_fit}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Salary Range</div>
                  <div className="text-lg font-bold text-gray-900">{feedback.career_insights.salary_range}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Growth Potential</div>
                  <div className={`text-lg font-bold ${
                    feedback.career_insights.growth_potential === 'High' ? 'text-green-600' :
                    feedback.career_insights.growth_potential === 'Medium' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>{feedback.career_insights.growth_potential}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-2">Recommended Roles</div>
                  <div className="flex flex-wrap gap-2">
                    {feedback.career_insights.recommended_roles?.map((role, i) => (
                      <span key={i} className="px-3 py-1 bg-[#0D9488]/10 text-[#0D9488] rounded-full text-xs font-medium">
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
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Try Another Interview
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
