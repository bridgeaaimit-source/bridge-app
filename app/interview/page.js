"use client";

import { useMemo, useState } from "react";

const domains = [
  { icon: "💻", label: "Software Engineer" },
  { icon: "📊", label: "Data Analyst" },
  { icon: "📣", label: "Marketing" },
  { icon: "💰", label: "Finance" },
  { icon: "🏢", label: "Operations" },
  { icon: "🎯", label: "MBA General" },
];

export default function InterviewPage() {
  const [step, setStep] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState("Software Engineer");
  const [answer, setAnswer] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [analyses, setAnalyses] = useState([]);
  const [responses, setResponses] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [selectedFeedbackTab, setSelectedFeedbackTab] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isAnalyzingAnswer, setIsAnalyzingAnswer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const wordCount = useMemo(() => {
    return answer.trim() ? answer.trim().split(/\s+/).length : 0;
  }, [answer]);

  const currentQuestion = questions[currentQuestionIndex] ?? "";
  const totalQuestions = questions.length || 5;

  const aggregateFeedback = (allAnalyses) => {
    if (!allAnalyses.length) return null;

    const avg = (key) => {
      const total = allAnalyses.reduce((sum, item) => sum + (Number(item?.[key]) || 0), 0);
      return Number((total / allAnalyses.length).toFixed(1));
    };

    const strengths = allAnalyses
      .flatMap((item) => (Array.isArray(item?.strengths) ? item.strengths : []))
      .filter(Boolean)
      .slice(0, 4);

    const improvements = allAnalyses
      .flatMap((item) => (Array.isArray(item?.improvements) ? item.improvements : []))
      .filter(Boolean)
      .slice(0, 4);

    const betterAnswer =
      [...allAnalyses]
        .reverse()
        .find((item) => typeof item?.better_answer === "string" && item.better_answer.trim())?.better_answer ||
      "";

    return {
      score: avg("score"),
      clarity: avg("clarity"),
      confidence: avg("confidence"),
      content: avg("content"),
      strengths,
      improvements,
      better_answer: betterAnswer,
    };
  };

  const startInterview = async () => {
    setErrorMessage("");
    setIsLoadingQuestions(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selectedDomain, count: 5 }),
      });

      const data = await response.json();

      if (!response.ok || !Array.isArray(data?.questions) || !data.questions.length) {
        throw new Error(data?.error || "Could not generate interview questions right now.");
      }

      setQuestions(data.questions.slice(0, 5));
      setCurrentQuestionIndex(0);
      setAnalyses([]);
      setResponses([]);
      setSelectedFeedbackTab(0);
      setFeedback(null);
      setAnswer("");
      setStep(2);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while starting your interview. Please try again."
      );
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      setErrorMessage("Please write an answer before submitting.");
      return;
    }

    setErrorMessage("");
    setIsAnalyzingAnswer(true);

    try {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          answer: answer.trim(),
          domain: selectedDomain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Could not analyze your answer right now.");
      }

      const updatedAnalyses = [...analyses, data];
      setAnalyses(updatedAnalyses);
      const updatedResponses = [
        ...responses,
        {
          question: currentQuestion,
          answer: answer.trim(),
          analysis: data,
        },
      ];
      setResponses(updatedResponses);

      const isLastQuestion = currentQuestionIndex >= totalQuestions - 1;
      if (isLastQuestion) {
        setSelectedFeedbackTab(0);
        setFeedback(aggregateFeedback(updatedAnalyses));
        setStep(3);
      } else {
        setCurrentQuestionIndex((prev) => prev + 1);
        setAnswer("");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while analyzing your answer. Please try again."
      );
    } finally {
      setIsAnalyzingAnswer(false);
    }
  };

  const resetInterview = () => {
    setStep(1);
    setAnswer("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnalyses([]);
    setResponses([]);
    setSelectedFeedbackTab(0);
    setFeedback(null);
    setErrorMessage("");
    setIsLoadingQuestions(false);
    setIsAnalyzingAnswer(false);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-4 text-slate-900">
      <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="flex items-center justify-between px-4 pb-3 pt-5">
          <button
            aria-label="Go back"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <h1 className="text-base font-bold text-[#2B5CE6]">AI Mock Interview</h1>

          <button
            aria-label="Interview info"
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5M12 8h.01" />
            </svg>
          </button>
        </header>

        <div className="px-4 pb-3">
          <div className="flex items-center justify-between gap-1 text-[10px] font-semibold uppercase tracking-wide sm:text-xs">
            <span className={step >= 1 ? "text-[#2B5CE6]" : "text-slate-400"}>Step 1: Choose Domain</span>
            <span className={step >= 2 ? "text-[#2B5CE6]" : "text-slate-400"}>Step 2: Answer Questions</span>
            <span className={step >= 3 ? "text-[#2B5CE6]" : "text-slate-400"}>Step 3: Get Feedback</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#2B5CE6] transition-all duration-500"
              style={{
                width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
              }}
            />
          </div>
        </div>

        <main className="px-4 pb-24">
          {step === 1 && (
            <section className="animate-fade-up">
              <h2 className="text-xl font-bold text-slate-900">What role are you preparing for?</h2>
              <p className="mt-1 text-sm text-slate-500">We&apos;ll ask you 5 targeted questions</p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {domains.map((domain) => {
                  const active = selectedDomain === domain.label;
                  return (
                    <button
                      key={domain.label}
                      onClick={() => setSelectedDomain(domain.label)}
                      className={`rounded-2xl border p-3 text-left shadow-sm transition ${
                        active
                          ? "border-[#2B5CE6] bg-[#EEF3FF] ring-1 ring-[#2B5CE6]"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-xl">{domain.icon}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{domain.label}</p>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={startInterview}
                disabled={isLoadingQuestions}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2B5CE6] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(43,92,230,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoadingQuestions && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                )}
                {isLoadingQuestions ? "Generating Questions..." : "Start Interview →"}
              </button>

              {errorMessage && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {errorMessage}
                </p>
              )}
            </section>
          )}

          {step === 2 && (
            <section className="animate-fade-up">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
                <p className="rounded-lg bg-[#FFF5F1] px-2 py-1 text-xs font-semibold text-[#FF6B35]">02:30</p>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#2B5CE6] transition-all"
                  style={{
                    width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>

              <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#2B5CE6] to-[#1E3FA8] p-4 text-white shadow-[0_10px_30px_rgba(43,92,230,0.35)]">
                <p className="text-sm font-medium text-blue-100">Current prompt</p>
                <h3 className="mt-1 text-base font-semibold leading-relaxed">
                  {currentQuestion || "Loading your interview question..."}
                </h3>
              </div>

              <label className="mt-4 block">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="min-h-[180px] w-full rounded-2xl border border-slate-200 p-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#2B5CE6] focus:ring-2 focus:ring-[#2B5CE6]/20"
                />
              </label>

              <div className="mt-2 text-right text-xs font-medium text-slate-500">{wordCount} words</div>

              <button
                onClick={submitAnswer}
                disabled={isAnalyzingAnswer}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2B5CE6] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(43,92,230,0.35)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAnalyzingAnswer && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                )}
                {isAnalyzingAnswer ? "AI is analyzing your answer..." : "Submit Answer →"}
              </button>

              {errorMessage && (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {errorMessage}
                </p>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="animate-fade-up">
              <h2 className="text-xl font-bold text-slate-900">Interview Complete! 🎉</h2>
              <p className="mt-1 text-sm text-slate-500">Great effort. Here&apos;s your AI feedback summary.</p>

              <div className="mt-4 rounded-2xl bg-[#2B5CE6] p-5 text-center text-white shadow-[0_10px_30px_rgba(43,92,230,0.35)]">
                <p className="text-sm text-blue-100">Overall Score</p>
                <p className="mt-1 text-4xl font-black">{feedback?.score ?? 0} / 10</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <article className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <p className="text-xs text-slate-500">Clarity</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{feedback?.clarity ?? 0}/10</p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <p className="text-xs text-slate-500">Confidence</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{feedback?.confidence ?? 0}/10</p>
                </article>
                <article className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
                  <p className="text-xs text-slate-500">Content</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">{feedback?.content ?? 0}/10</p>
                </article>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <p className="text-sm font-bold text-slate-800">Per-question feedback</p>

                <div className="mt-3 grid grid-cols-5 gap-2">
                  {responses.map((item, idx) => {
                    const active = idx === selectedFeedbackTab;
                    return (
                      <button
                        key={`tab-${idx}`}
                        onClick={() => setSelectedFeedbackTab(idx)}
                        className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                          active
                            ? "border-[#2B5CE6] bg-[#EEF3FF] text-[#2B5CE6]"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Q{idx + 1}
                      </button>
                    );
                  })}
                </div>

                {responses[selectedFeedbackTab] && (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Question</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {responses[selectedFeedbackTab].question}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Your answer
                        </p>
                        <span className="rounded-md bg-[#EEF3FF] px-2 py-1 text-xs font-bold text-[#2B5CE6]">
                          Score: {Number(responses[selectedFeedbackTab]?.analysis?.score ?? 0).toFixed(1)}/10
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700">
                        {responses[selectedFeedbackTab].answer}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-sm font-bold text-emerald-700">Strengths</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
                        {(
                          responses[selectedFeedbackTab]?.analysis?.strengths?.length
                            ? responses[selectedFeedbackTab].analysis.strengths
                            : ["Clear attempt and relevant framing."]
                        ).map((item, idx) => (
                          <li key={`q-strength-${selectedFeedbackTab}-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                      <p className="text-sm font-bold text-[#FF6B35]">Improvements</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-orange-800">
                        {(
                          responses[selectedFeedbackTab]?.analysis?.improvements?.length
                            ? responses[selectedFeedbackTab].analysis.improvements
                            : ["Add stronger specifics and measurable outcomes."]
                        ).map((item, idx) => (
                          <li key={`q-improvement-${selectedFeedbackTab}-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                      <p className="text-sm font-bold text-[#2B5CE6]">How you could have answered this</p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {responses[selectedFeedbackTab]?.analysis?.better_answer ||
                          "Use a STAR-style structure for a sharper response."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-700">Strengths</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-800">
                  {(feedback?.strengths?.length ? feedback.strengths : ["Strong effort and thoughtful responses."]).map(
                    (item, idx) => (
                      <li key={`strength-${idx}`}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <p className="text-sm font-bold text-[#FF6B35]">Improve</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-orange-800">
                  {(
                    feedback?.improvements?.length
                      ? feedback.improvements
                      : ["Add more specific examples and measurable outcomes."]
                  ).map((item, idx) => (
                    <li key={`improvement-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-bold text-[#2B5CE6]">How you could have answered this</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {feedback?.better_answer || "Practice with clearer structure to improve your next response."}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={resetInterview}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Practice Again
                </button>
                <button className="rounded-xl bg-[#2B5CE6] px-3 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(43,92,230,0.35)] transition hover:brightness-105">
                  Share Result
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      <style jsx global>{`
        .animate-fade-up {
          animation: fadeUp 350ms ease both;
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
