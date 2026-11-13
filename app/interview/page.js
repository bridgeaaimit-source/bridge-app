"use client";

import { useState, useEffect, useRef } from "react";
import { RotateCcw, Share2, Mic, Volume2, Lightbulb, Star, TrendingUp, AlertCircle, CheckCircle, Keyboard, Bot, ArrowRight, ChevronDown, Clock, Target, Sparkles, Square, PenLine } from "lucide-react";
import confetti from "canvas-confetti";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { normalizeFillerWords } from "@/lib/interviewEval";
import { recommendTraining } from "@/lib/trainingContent";
import Link from "next/link";
import { useAssemblyAI } from "@/hooks/useAssemblyAI";
import { useAuthBypass } from "@/hooks/useAuthBypass";

const domains = [
  { icon: "💻", label: "Software Engineer", hint: "Projects, problem-solving, CS basics" },
  { icon: "📊", label: "Data Analyst", hint: "SQL, metrics, turning data into decisions" },
  { icon: "📣", label: "Marketing", hint: "Brands, campaigns, consumer insight" },
  { icon: "💰", label: "Finance", hint: "Markets, valuation, financial statements" },
  { icon: "🏢", label: "Operations", hint: "Process, supply chain, efficiency" },
  { icon: "🎯", label: "MBA General", hint: "HR round, goals, leadership, why MBA" },
];

const METRIC_INFO = {
  clarity: "How easy your answers were to follow",
  confidence: "How sure and decisive you sounded",
  content: "Depth, examples and relevance",
  communication: "Structure, flow and language",
};

function scoreTone(score) {
  if (score >= 8) return { ring: "#10B981", text: "text-emerald-600", bg: "bg-emerald-50", label: "Interview-ready" };
  if (score >= 6) return { ring: "#F59E0B", text: "text-amber-600", bg: "bg-amber-50", label: "Almost there" };
  return { ring: "#EF4444", text: "text-rose-600", bg: "bg-rose-50", label: "Needs more practice" };
}

function WordMeter({ words, min }) {
  const pct = Math.min(100, Math.round((words / min) * 100));
  const ok = words >= min;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-28 h-1.5 rounded-full bg-slate-200 overflow-hidden shrink-0" aria-hidden="true">
        <div className={`h-full rounded-full transition-all duration-300 ${ok ? "bg-[#0D9488]" : "bg-amber-400"}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm ${ok ? "text-[#0F766E] font-medium" : "text-slate-500"}`}>
        {ok ? `${words} words` : `${words} of ${min} words needed`}
      </span>
    </div>
  );
}

export default function InterviewPage() {
  const { isBypassed, mockUser } = useAuthBypass();
  const [step, setStep] = useState(1);
  const [interviewMode, setInterviewMode] = useState("text"); // "text" or "voice"
  const [selectedDomain, setSelectedDomain] = useState("Software Engineer");
  const [answer, setAnswer] = useState("");
  const [voiceAnswer, setVoiceAnswer] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [analyses, setAnalyses] = useState([]);
  const [responses, setResponses] = useState([]);
  const [uid, setUid] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [selectedFeedbackTab, setSelectedFeedbackTab] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isAnalyzingAnswer, setIsAnalyzingAnswer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [browserSupport, setBrowserSupport] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [failedCount, setFailedCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);            // seconds on the current question
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [openReview, setOpenReview] = useState(0);       // which answer is expanded in the report
  // One entry per question: { question, answer, promise, result, error }
  const evaluationsRef = useRef([]);

  const {
    isRecording,
    isConnecting,
    transcript: hookTranscript,
    interimTranscript: hookInterimTranscript,
    fullTranscript: hookFullTranscript,
    error: transcriptionError,
    speechLang,
    setLang,
    startRecording: startAssemblyAIRecording,
    stopRecording: stopAssemblyAIRecording,
    clearTranscript: clearAssemblyAITranscript,
  } = useAssemblyAI();

  // Preselect a domain when arriving from Domain Training (?domain=Operations)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const requested = new URLSearchParams(window.location.search).get("domain");
    if (requested && domains.some((d) => d.label === requested)) setSelectedDomain(requested);
  }, []);

  useEffect(() => {
    if (hookFullTranscript) {
      setVoiceAnswer(hookFullTranscript);
    }
  }, [hookFullTranscript]);

  useEffect(() => {
    // Bypass mode: set mock uid and sessionId directly
    if (isBypassed) {
      setUid(mockUser.uid);
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      return;
    }

    // Get user ID and generate session ID
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      }
    });

    // Check browser support for Web Speech API
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setBrowserSupport(false);
    }
    
    // Load voices for TTS
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    return () => unsubscribe();
  }, []);

  const speakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const indian = voices.find((v) => v.lang === 'en-IN') || voices.find((v) => v.lang?.startsWith('en-GB'));
      if (indian) { utterance.voice = indian; utterance.lang = indian.lang; }
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const startRecording = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceAnswer("");
    clearAssemblyAITranscript();
    startAssemblyAIRecording();
  };

  const stopRecording = () => {
    stopAssemblyAIRecording();
  };

  const generateQuestions = async () => {
    setIsLoadingQuestions(true);
    setErrorMessage("");
    
    try {
      console.log('Generating questions for domain:', selectedDomain);
      
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: selectedDomain,
          count: 5,
        }),
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data?.error || "Could not generate questions right now.");
      }

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid response format from server");
      }

      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setStep(2);
    } catch (error) {
      console.error('Error generating questions:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating questions. Please try again."
      );
      toast.error("Failed to generate questions");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const startInterview = () => {
    generateQuestions();
  };

  // Clock for the current question; in voice mode the interviewer asks it aloud.
  useEffect(() => {
    if (step !== 2) return;
    setElapsed(0);
    setConfirmLeave(false);
    const tick = setInterval(() => setElapsed((t) => t + 1), 1000);
    if (interviewMode === "voice" && autoSpeak && questions[currentQuestionIndex]) {
      speakText(questions[currentQuestionIndex]);
    }
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, currentQuestionIndex]);

  const MIN_WORDS = 20;
  const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

  const evaluateAnswer = async (question, answerText) => {
    const callApi = async () => {
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer: answerText, domain: selectedDomain, uid }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error || "Could not analyze this answer.");
      return data;
    };
    try {
      return await callApi();
    } catch {
      return await callApi(); // one quiet retry
    }
  };

  const queueEvaluation = (index, question, answerText) => {
    const entry = { question, answer: answerText, result: null, error: null };
    entry.promise = evaluateAnswer(question, answerText)
      .then((result) => { entry.result = result; return result; })
      .catch((err) => { entry.error = err; return null; });
    evaluationsRef.current[index] = entry;
  };

  const saveInterview = async (report) => {
    if (isBypassed || !auth.currentUser) return;
    const user = auth.currentUser;
    try {
      await addDoc(collection(db, "users", user.uid, "interview_feedback"), {
        type: "mock_interview",
        jobRole: selectedDomain,
        round: "Mock Interview",
        mode: interviewMode,
        feedback: {
          overall_score: report.overall_score,
          metrics: report.metrics,
          strengths: report.strengths,
          improvements: report.improvements,
          filler_words: report.filler_words,
        },
        questions: report.perQuestion.map((q) => ({ question: q.question, answer: q.answer, score: q.score, better_answer: q.better_answer })),
        sessionId,
        timestamp: new Date().toISOString(),
        createdAt: Date.now(),
      });
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const newInterviewsDone = (userData.interviewsDone || 0) + 1;
        const newAvgScore = ((userData.avgScore || 0) * (userData.interviewsDone || 0) + report.overall_score) / newInterviewsDone;
        await updateDoc(userRef, {
          interviewsDone: newInterviewsDone,
          avgScore: Math.round(newAvgScore * 10) / 10,
          updatedAt: new Date().toISOString(),
        });
      }
      fetch(`/api/bridge-score?userId=${user.uid}`).catch(() => {});
    } catch (error) {
      console.error("Could not save interview:", error.message);
      toast.error("Your report is ready, but we couldn't save it to your profile.");
    }
  };

  const finishInterview = async () => {
    setIsFinalizing(true);
    setErrorMessage("");
    const entries = evaluationsRef.current;
    await Promise.all(entries.map((e) => e.promise));
    const failed = entries.filter((e) => !e.result);
    setFailedCount(failed.length);
    if (failed.length > 0) {
      setIsFinalizing(false);
      setErrorMessage(`We couldn't evaluate ${failed.length} of your answers. Tap "Retry" to try again.`);
      return;
    }
    const results = entries.map((e) => e.result);
    const report = aggregateFeedback(results, entries);
    setAnalyses(results);
    setResponses(entries.map((e) => ({ question: e.question, answer: e.answer, analysis: e.result })));
    setSelectedFeedbackTab(0);
    setOpenReview(0);
    setFeedback(report);
    setIsFinalizing(false);
    setStep(3);
    if (report.overall_score >= 7) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    saveInterview(report);
  };

  const retryFailed = () => {
    evaluationsRef.current.forEach((entry, index) => {
      if (entry && !entry.result) queueEvaluation(index, entry.question, entry.answer);
    });
    finishInterview();
  };

  const submitAnswerText = (rawText) => {
    const text = (rawText || "").trim();
    if (countWords(text) < MIN_WORDS) {
      setErrorMessage(`Please answer in at least ${MIN_WORDS} words so the AI can give useful feedback.`);
      return;
    }
    setErrorMessage("");
    queueEvaluation(currentQuestionIndex, questions[currentQuestionIndex], text);
    setAnswer("");
    setVoiceAnswer("");
    clearAssemblyAITranscript();
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishInterview();
    }
  };

  const submitVoiceAnswer = () => submitAnswerText(voiceAnswer);
  const submitAnswer = () => submitAnswerText(answer);

  const resetInterview = () => {
    setStep(1);
    setAnswer("");
    setVoiceAnswer("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setAnalyses([]);
    setResponses([]);
    setSelectedFeedbackTab(0);
    setFeedback(null);
    setErrorMessage("");
    setIsLoadingQuestions(false);
    setIsAnalyzingAnswer(false);
    setIsFinalizing(false);
    setFailedCount(0);
    evaluationsRef.current = [];
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  };

  const shareResult = () => {
    const shareText = `I scored ${feedback?.overall_score}/10 in my AI Mock Interview on BRIDGE! 🚀 My BRIDGE Score is growing stronger. Join me!`;
    
    if (navigator.share) {
      navigator.share({
        title: "BRIDGE AI Mock Interview Result",
        text: shareText,
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => toast.success("Result copied — paste it anywhere to share"));
    }
  };

  const aggregateFeedback = (results, entries = []) => {
    if (!results || results.length === 0) return null;
    const avg = (key) => {
      const values = results.map((r) => Number(r?.[key])).filter((n) => Number.isFinite(n));
      return values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : 0;
    };
    const allFillerWords = new Set();
    const allStrengths = [];
    const allImprovements = [];
    results.forEach((r) => {
      normalizeFillerWords(r?.filler_words).found.forEach((w) => allFillerWords.add(w));
      if (Array.isArray(r?.strengths)) allStrengths.push(...r.strengths);
      if (Array.isArray(r?.improvements)) allImprovements.push(...r.improvements);
    });
    return {
      overall_score: avg("score"),
      filler_words: Array.from(allFillerWords),
      strengths: [...new Set(allStrengths.map((t) => String(t).trim()).filter(Boolean))].slice(0, 6),
      improvements: [...new Set(allImprovements.map((t) => String(t).trim()).filter(Boolean))].slice(0, 6),
      metrics: {
        clarity: avg("clarity"),
        confidence: avg("confidence"),
        content: avg("content"),
        communication: avg("communication"),
      },
      perQuestion: results.map((r, i) => ({
        question: entries[i]?.question || questions[i] || `Question ${i + 1}`,
        answer: entries[i]?.answer || "",
        score: Number.isFinite(Number(r?.score)) ? Number(r.score) : 0,
        better_answer: typeof r?.better_answer === "string" ? r.better_answer : "",
      })),
    };
  };

  // ── Presentation helpers ────────────────────────────────────────────────
  const total = questions.length || 5;
  const question = questions[currentQuestionIndex] || "";
  const isLast = currentQuestionIndex >= questions.length - 1;
  const typedWords = countWords(answer);
  const spokenWords = countWords(voiceAnswer);
  const liveWords = countWords([hookTranscript, hookInterimTranscript].filter(Boolean).join(" "));
  const clock = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
  const nextLabel = isFinalizing ? "Scoring your answers" : isLast ? "Finish and see my report" : "Submit and go to next question";
  const tone = feedback ? scoreTone(feedback.overall_score) : null;
  const training = feedback ? recommendTraining({ domain: selectedDomain, metrics: feedback.metrics }) : null;

  const leaveInterview = () => {
    if (!confirmLeave) { setConfirmLeave(true); return; }
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    stopAssemblyAIRecording();
    resetInterview();
  };

  return (
    <AppShell hideNavigation={step === 2}>
      {/* ═════════════ 1. Set up ═════════════ */}
      {step === 1 && (
        <div className="max-w-6xl mx-auto px-4 md:px-10 pt-8 pb-16">
          <div className="mb-8 max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "Syne,sans-serif" }}>
              Mock interview
            </h1>
            <p className="text-slate-600 mt-2 text-base leading-relaxed">
              Five questions for the role you pick. Answer like you would in the real room, then see exactly where you gained and lost marks.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
              <fieldset>
                <legend className="text-lg font-bold text-slate-900 mb-1">Which role are you interviewing for?</legend>
                <p className="text-sm text-slate-500 mb-4">The questions change with the role.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {domains.map((domain) => {
                    const active = selectedDomain === domain.label;
                    return (
                      <button
                        key={domain.label}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setSelectedDomain(domain.label)}
                        className={`flex items-center gap-4 text-left p-4 rounded-2xl border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 ${
                          active ? "border-[#0D9488] bg-[#F0FDFA]" : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className="text-2xl w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0" aria-hidden="true">{domain.icon}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-slate-900">{domain.label}</span>
                          <span className="block text-sm text-slate-500 leading-snug">{domain.hint}</span>
                        </span>
                        {active && <CheckCircle className="w-5 h-5 text-[#0D9488] ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="mt-8">
                <legend className="text-lg font-bold text-slate-900 mb-1">How do you want to answer?</legend>
                <p className="text-sm text-slate-500 mb-4">Speaking is closer to the real thing. Typing is good for a quiet place.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "voice", icon: Mic, title: "Speak my answers", text: "Your words appear as you talk. You can fix them before you submit." },
                    { id: "text", icon: Keyboard, title: "Type my answers", text: "No microphone needed." },
                  ].map((m) => {
                    const active = interviewMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setInterviewMode(m.id)}
                        className={`flex items-start gap-3 text-left p-4 rounded-2xl border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2 ${
                          active ? "border-[#0D9488] bg-[#F0FDFA]" : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <m.icon className={`w-5 h-5 mt-0.5 shrink-0 ${active ? "text-[#0D9488]" : "text-slate-400"}`} />
                        <span>
                          <span className="block font-semibold text-slate-900">{m.title}</span>
                          <span className="block text-sm text-slate-500 leading-snug">{m.text}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {interviewMode === "voice" && !browserSupport && (
                  <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Voice works best in Chrome. If the microphone doesn&apos;t start, switch to typing.
                  </p>
                )}
              </fieldset>

              {errorMessage && (
                <div role="alert" className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200 text-red-700 text-sm">{errorMessage}</div>
              )}

              <button
                onClick={startInterview}
                disabled={isLoadingQuestions}
                className="mt-8 w-full bg-[#0D9488] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#0F766E] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
              >
                {isLoadingQuestions ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Writing your {selectedDomain} questions</>
                ) : (
                  <>Start the {selectedDomain} interview</>
                )}
              </button>
            </div>

            <aside className="rounded-3xl bg-[#0F3D3A] text-white p-6 md:p-7">
              <h2 className="text-lg font-bold mb-5" style={{ fontFamily: "Syne,sans-serif" }}>How it works</h2>
              <ol className="space-y-5">
                {[
                  { title: "Answer five questions", text: `One at a time, at least ${MIN_WORDS} words each. A good answer takes one to two minutes.` },
                  { title: "Each answer is scored", text: "On clarity, confidence, content and communication, out of 10." },
                  { title: "Get your report", text: "Your score, a stronger version of each answer, and one lesson picked for your weakest area." },
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="w-7 h-7 rounded-full bg-white/10 border border-white/20 text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="text-sm text-teal-100/80 leading-relaxed mt-0.5">{item.text}</div>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center gap-2 text-sm text-teal-100/80">
                <Clock className="w-4 h-4 shrink-0" /> About 10 minutes
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* ═════════════ 2. The interview room ═════════════ */}
      {step === 2 && (
        <div className="min-h-screen bg-slate-50">
          {/* Room bar */}
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{selectedDomain} interview</div>
                <div className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {total}</div>
              </div>
              <ol className="flex-1 flex items-center justify-center gap-1.5" aria-label="Progress">
                {[...Array(total)].map((_, i) => (
                  <li
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i < currentQuestionIndex ? "w-8 bg-[#0D9488]" : i === currentQuestionIndex ? "w-12 bg-[#0F3D3A]" : "w-8 bg-slate-200"
                    }`}
                  />
                ))}
              </ol>
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-600 tabular-nums" title="Time on this question">
                <Clock className="w-4 h-4 text-slate-400" /> {clock}
              </div>
              <button
                type="button"
                onClick={leaveInterview}
                onBlur={() => setConfirmLeave(false)}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                  confirmLeave ? "bg-red-600 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {confirmLeave ? "Leave and lose my answers" : "Leave"}
              </button>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
            {/* Interviewer's side of the desk */}
            <section className="rounded-3xl bg-[#0F3D3A] text-white p-6 md:p-10 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-6">
                <span className="relative flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border border-white/20 shrink-0">
                  {isSpeaking && <span className="absolute inset-0 rounded-full border-2 border-teal-300/70 animate-ping motion-reduce:hidden" />}
                  <Bot className="w-5 h-5 text-teal-200" />
                </span>
                <div className="min-w-0">
                  <div className="font-semibold leading-tight">Your interviewer</div>
                  <div className="text-sm text-teal-100/70">{isSpeaking ? "Asking the question" : "Waiting for your answer"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => speakText(question)}
                  className="ml-auto flex items-center gap-2 text-sm font-medium px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-200"
                >
                  <Volume2 className="w-4 h-4" /> {isSpeaking ? "Repeat" : "Hear it"}
                </button>
              </div>
              <h2 key={currentQuestionIndex} className="text-2xl md:text-[2rem] md:leading-[1.25] font-bold tracking-tight max-w-3xl" style={{ fontFamily: "Syne,sans-serif" }}>
                {question}
              </h2>
            </section>

            {/* Candidate's side */}
            <section className="mt-4 rounded-3xl bg-white border border-slate-200 shadow-sm p-6 md:p-8">
              {interviewMode === "text" ? (
                <div>
                  <label htmlFor="answer-box" className="flex items-center gap-2 text-base font-semibold text-slate-900 mb-3">
                    <PenLine className="w-4 h-4 text-[#0D9488]" /> Your answer
                  </label>
                  <textarea
                    id="answer-box"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Start with the situation, say what you did, end with the result."
                    className="w-full h-48 md:h-56 p-4 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-2xl resize-y focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
                  />
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <WordMeter words={typedWords} min={MIN_WORDS} />
                    <button
                      onClick={submitAnswer}
                      disabled={typedWords < MIN_WORDS || isFinalizing}
                      className="bg-[#0D9488] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
                    >
                      {nextLabel}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <Mic className="w-4 h-4 text-[#0D9488]" /> Your answer
                    </div>
                    <div className="flex items-center gap-1.5" role="group" aria-label="Accent for speech recognition">
                      <span className="text-sm text-slate-500 mr-1">My accent</span>
                      {[{ code: "en-IN", label: "Indian" }, { code: "en-GB", label: "British" }, { code: "en-US", label: "American" }].map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          aria-pressed={speechLang === l.code}
                          onClick={() => setLang(l.code)}
                          className={`text-sm px-3 py-1 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                            speechLang === l.code ? "bg-[#0F3D3A] text-white border-[#0F3D3A]" : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isConnecting ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
                      <div className="w-10 h-10 mx-auto border-2 border-slate-300 border-t-[#0D9488] rounded-full animate-spin mb-4" />
                      <p className="font-medium text-slate-700">Turning on your microphone</p>
                    </div>
                  ) : isRecording ? (
                    <div>
                      <div className="rounded-2xl border-2 border-red-200 bg-red-50/40 p-5 md:p-6 min-h-[11rem]">
                        <div className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Recording. Speak now.
                        </div>
                        {hookTranscript || hookInterimTranscript ? (
                          <p className="text-base leading-relaxed text-slate-900">
                            {hookTranscript}
                            {hookInterimTranscript && <span className="text-slate-400"> {hookInterimTranscript}</span>}
                          </p>
                        ) : (
                          <p className="text-base text-slate-400">Your words will appear here as you speak.</p>
                        )}
                      </div>
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <WordMeter words={liveWords} min={MIN_WORDS} />
                        <div className="flex gap-3">
                          <button
                            onClick={stopRecording}
                            type="button"
                            className="flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-300 px-5 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" /> Stop and review
                          </button>
                          {(hookTranscript || hookInterimTranscript) && (
                            <button
                              onClick={() => {
                                const captured = [hookTranscript, hookInterimTranscript].filter(Boolean).join(" ");
                                stopAssemblyAIRecording();
                                setVoiceAnswer(captured);
                                submitAnswerText(captured);
                              }}
                              type="button"
                              className="bg-[#0D9488] text-white px-5 py-3.5 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
                            >
                              Stop and submit
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : voiceAnswer ? (
                    <div>
                      <label htmlFor="voice-review" className="block text-sm text-slate-600 mb-2">This is what we heard. Fix anything that&apos;s wrong, then submit.</label>
                      <textarea
                        id="voice-review"
                        value={voiceAnswer}
                        onChange={(e) => setVoiceAnswer(e.target.value)}
                        className="w-full h-44 p-4 text-base leading-relaxed text-slate-900 border border-slate-300 rounded-2xl resize-y focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
                      />
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <WordMeter words={spokenWords} min={MIN_WORDS} />
                        <div className="flex gap-3">
                          <button
                            onClick={startRecording}
                            type="button"
                            className="bg-white text-slate-800 border border-slate-300 px-5 py-3.5 rounded-xl font-semibold hover:bg-slate-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                          >
                            Record again
                          </button>
                          <button
                            onClick={submitVoiceAnswer}
                            disabled={isFinalizing || spokenWords < MIN_WORDS}
                            type="button"
                            className="bg-[#0D9488] text-white px-5 py-3.5 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
                          >
                            {nextLabel}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 md:p-10 text-center">
                      <button
                        onClick={startRecording}
                        type="button"
                        className="w-20 h-20 mx-auto rounded-full bg-[#0D9488] text-white flex items-center justify-center hover:bg-[#0F766E] transition-colors shadow-lg shadow-teal-600/20 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-200"
                        aria-label="Start recording my answer"
                      >
                        <Mic className="w-8 h-8" />
                      </button>
                      <p className="mt-4 font-semibold text-slate-900">Tap the microphone and answer out loud</p>
                      <p className="text-sm text-slate-500 mt-1">Take a breath first. You can review what we heard before you submit.</p>
                      {transcriptionError && (
                        <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 max-w-md mx-auto">{transcriptionError}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isFinalizing && (
                <div className="mt-5 p-4 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] flex items-center gap-3" role="status">
                  <span className="w-5 h-5 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-[#0F766E] text-sm font-medium">Scoring your {total} answers and writing your report. This takes a few seconds.</span>
                </div>
              )}

              {errorMessage && (
                <div role="alert" className="mt-5 p-4 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between gap-4">
                  <span className="text-red-700 text-sm">{errorMessage}</span>
                  {failedCount > 0 && !isFinalizing && (
                    <button onClick={retryFailed} type="button" className="shrink-0 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700">
                      Retry
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* A good answer has */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {[
                { icon: Target, title: "A clear point first", text: "Answer the question in your first sentence." },
                { icon: Star, title: "One real example", text: "Situation, what you did, what happened." },
                { icon: TrendingUp, title: "A number if you can", text: "Marks, people, rupees, days saved." },
              ].map((tip) => (
                <div key={tip.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/60 px-4 py-3">
                  <tip.icon className="w-4 h-4 text-[#0D9488] mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-800">{tip.title}</div>
                    <div className="text-slate-500 leading-snug">{tip.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════ 3. The report ═════════════ */}
      {step === 3 && feedback && (
        <div className="max-w-5xl mx-auto px-4 md:px-10 pt-8 pb-16 space-y-6">
          {/* Scorecard */}
          <section className="rounded-3xl bg-[#0F3D3A] text-white overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
              <div className="p-8 md:p-10 flex flex-col items-center justify-center text-center md:border-r border-white/10">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="52" fill="none" stroke={tone.ring} strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(feedback.overall_score, 10) / 10)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-extrabold tabular-nums" style={{ fontFamily: "Syne,sans-serif" }}>{feedback.overall_score}</span>
                    <span className="text-sm text-teal-100/70">out of 10</span>
                  </div>
                </div>
                <div className="mt-4 text-lg font-bold">{tone.label}</div>
                <div className="text-sm text-teal-100/70">{selectedDomain} mock interview</div>
              </div>

              <div className="p-8 md:p-10">
                <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "Syne,sans-serif" }}>Your scorecard</h1>
                <dl className="space-y-5">
                  {Object.entries(feedback.metrics || {}).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-baseline justify-between gap-4 mb-1.5">
                        <dt className="font-semibold capitalize">{key.replace("_", " ")}</dt>
                        <dd className="text-sm tabular-nums text-teal-50">{value} / 10</dd>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden" aria-hidden="true">
                        <div className="h-full rounded-full" style={{ width: `${(Math.min(value, 10) / 10) * 100}%`, backgroundColor: scoreTone(value).ring }} />
                      </div>
                      {METRIC_INFO[key] && <p className="text-sm text-teal-100/70 mt-1.5">{METRIC_INFO[key]}</p>}
                    </div>
                  ))}
                </dl>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    onClick={resetInterview}
                    className="flex items-center gap-2 px-5 py-3 bg-white text-[#0F3D3A] rounded-xl font-semibold hover:bg-teal-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <RotateCcw className="w-4 h-4" /> Take another interview
                  </button>
                  <button
                    onClick={shareResult}
                    className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    <Share2 className="w-4 h-4" /> Share my score
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* What to do next */}
          {training && (
            <section className="rounded-3xl bg-[#F0FDFA] border-2 border-[#0D9488] p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="flex items-start gap-4">
                <span className="w-11 h-11 rounded-2xl bg-[#0D9488] text-white flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5" /></span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{training.reason}</h2>
                  <p className="text-slate-600 mt-1 leading-relaxed max-w-xl">
                    Your next step is one short lesson picked for exactly this. Finish it, retake the interview, and watch this score move.
                  </p>
                </div>
              </div>
              <Link
                href={`/training?track=${training.trackId}&lesson=${training.lessonId}&reason=${encodeURIComponent(training.reason)}`}
                className="shrink-0 text-center bg-[#0D9488] text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
              >
                Open my lesson
              </Link>
            </section>
          )}

          {/* What worked / what to fix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /> What you did well</h2>
              {(feedback.strengths || []).length ? (
                <ul className="space-y-3">
                  {feedback.strengths.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2.5 shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-slate-500">Nothing stood out yet. Longer answers with examples give the AI more to credit.</p>}
            </section>
            <section className="bg-white rounded-3xl border border-slate-200 p-6 md:p-7">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-amber-500" /> What to fix before the real one</h2>
              {(feedback.improvements || []).length ? (
                <ul className="space-y-3">
                  {feedback.improvements.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2.5 shrink-0" />{item}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-slate-500">No major gaps found in this round.</p>}
              {feedback.filler_words?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <p className="text-sm text-slate-600 mb-2">Filler words you used. Pause instead of saying them.</p>
                  <div className="flex flex-wrap gap-2">
                    {feedback.filler_words.map((word, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-sm">{word}</span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Answer by answer */}
          {Array.isArray(feedback.perQuestion) && feedback.perQuestion.length > 0 && (
            <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
              <div className="p-6 md:p-7 pb-4">
                <h2 className="font-bold text-slate-900 text-lg">Answer by answer</h2>
                <p className="text-slate-500 text-sm mt-1">Open a question to compare what you said with a stronger answer.</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {feedback.perQuestion.map((item, index) => {
                  const open = openReview === index;
                  const t = scoreTone(item.score);
                  return (
                    <li key={index}>
                      <button
                        type="button"
                        aria-expanded={open}
                        onClick={() => setOpenReview(open ? -1 : index)}
                        className="w-full flex items-center gap-4 text-left px-6 md:px-7 py-4 hover:bg-slate-50 transition-colors focus:outline-none focus-visible:bg-slate-50"
                      >
                        <span className={`w-12 shrink-0 text-center text-sm font-bold tabular-nums rounded-lg py-1.5 ${t.bg} ${t.text}`}>{item.score}/10</span>
                        <span className="flex-1 font-medium text-slate-900">{item.question}</span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                      {open && (
                        <div className="px-6 md:px-7 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-2xl border border-slate-200 p-4">
                            <h3 className="text-sm font-semibold text-slate-500 mb-2">What you said</h3>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{item.answer || "No answer recorded."}</p>
                          </div>
                          <div className="rounded-2xl border border-[#99F6E4] bg-[#F0FDFA] p-4">
                            <h3 className="text-sm font-semibold text-[#0F766E] mb-2">A stronger answer</h3>
                            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{item.better_answer || "No sample answer was generated for this question."}</p>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}
