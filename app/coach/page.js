"use client";

import { useState } from "react";

export default function CoachPage() {
  const [rawAnswer, setRawAnswer] = useState("");
  const [improvedAnswer, setImprovedAnswer] = useState("");
  const [hinglishText, setHinglishText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [isLoadingRewrite, setIsLoadingRewrite] = useState(false);
  const [isLoadingConvert, setIsLoadingConvert] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const improveWithAI = async () => {
    if (!rawAnswer.trim()) return;
    setErrorMessage("");
    setIsLoadingRewrite(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "rewrite", text: rawAnswer }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Could not improve answer right now.");
      }
      setImprovedAnswer(data.output || "");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsLoadingRewrite(false);
    }
  };

  const convertHinglish = async () => {
    if (!hinglishText.trim()) return;
    setErrorMessage("");
    setIsLoadingConvert(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "hinglish_to_english", text: hinglishText }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Could not convert text right now.");
      }
      setEnglishText(data.output || "");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsLoadingConvert(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-4 text-slate-900">
      <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="px-4 pb-2 pt-5">
          <h1 className="text-xl font-black tracking-tight text-[#2B5CE6]">Communication Coach 📢</h1>
          <p className="mt-1 text-sm text-slate-500">Practice clarity, confidence, and structured speaking.</p>
        </header>

        <main className="space-y-4 px-4 pb-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Rewrite My Answer</p>
            <textarea
              value={rawAnswer}
              onChange={(e) => setRawAnswer(e.target.value)}
              placeholder="Paste your interview answer here..."
              className="mt-2 min-h-[110px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
            />
            <button
              onClick={improveWithAI}
              disabled={isLoadingRewrite}
              className="mt-3 rounded-xl bg-[#2B5CE6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isLoadingRewrite ? "Improving..." : "Improve with AI"}
            </button>
            {improvedAnswer && (
              <div className="mt-3 rounded-xl border border-[#2B5CE6]/20 bg-[#EEF3FF] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2B5CE6]">Improved Version</p>
                <p className="mt-1 text-sm text-slate-700">{improvedAnswer}</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Hinglish to English</p>
            <textarea
              value={hinglishText}
              onChange={(e) => setHinglishText(e.target.value)}
              placeholder="Type Hinglish text here..."
              className="mt-2 min-h-[110px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
            />
            <button
              onClick={convertHinglish}
              disabled={isLoadingConvert}
              className="mt-3 rounded-xl bg-[#2B5CE6] px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {isLoadingConvert ? "Converting..." : "Convert"}
            </button>
            {englishText && (
              <div className="mt-3 rounded-xl border border-[#2B5CE6]/20 bg-[#EEF3FF] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2B5CE6]">
                  Professional English Output
                </p>
                <p className="mt-1 text-sm text-slate-700">{englishText}</p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#FF6B35]/20 bg-[#FFF5F1] p-4">
            <p className="text-sm font-bold text-[#FF6B35]">Daily Tip</p>
            <p className="mt-1 text-sm text-slate-700">
              Use STAR format and numbers in your examples to sound more credible and structured.
            </p>
          </section>

          {errorMessage && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMessage}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
