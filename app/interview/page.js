"use client";

import { useState, useEffect, useRef } from "react";
import { RotateCcw, Share2, Mic, Trophy, Volume2, Lightbulb, Star, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
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
  { icon: "💻", label: "Software Engineer" },
  { icon: "📊", label: "Data Analyst" },
  { icon: "📣", label: "Marketing" },
  { icon: "💰", label: "Finance" },
  { icon: "🏢", label: "Operations" },
  { icon: "🎯", label: "MBA General" },
];

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
      toast.success(`Generated ${data.questions.length} questions!`);
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
    setFeedback(report);
    setIsFinalizing(false);
    setStep(3);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
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
      navigator.clipboard.writeText(shareText);
      alert("Result copied to clipboard!");
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
      strengths: allStrengths.slice(0, 6),
      improvements: allImprovements.slice(0, 6),
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

  return (
    <AppShell hideNavigation={step === 2}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Mock Interview</h1>
            <p className="text-gray-600 mt-1">Practice with real questions from top companies</p>
          </div>
          <div className="flex items-center gap-4">
            {typeof window !== 'undefined' && 'speechSynthesis' in window ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Volume2 className="w-4 h-4" />
                <span>TTS Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span>Use Chrome for voice features</span>
              </div>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center text-sm font-semibold mb-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step >= 1 ? 'bg-[#F0FDFA] text-[#0D9488]' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="w-6 h-6 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-xs">1</span>
              <span>Choose Domain</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-[#0D9488]' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step >= 2 ? 'bg-[#F0FDFA] text-[#0D9488]' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="w-6 h-6 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-xs">2</span>
              <span>Answer Questions</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-[#0D9488]' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step >= 3 ? 'bg-[#F0FDFA] text-[#0D9488]' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="w-6 h-6 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-xs">3</span>
              <span>Get Feedback</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Interview Panel */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Select your domain to begin</h2>
                  <p className="text-gray-600 mb-8">We'll ask you 5 targeted questions based on your chosen field</p>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {domains.map((domain) => {
                      const active = selectedDomain === domain.label;
                      return (
                        <button
                          key={domain.label}
                          onClick={() => setSelectedDomain(domain.label)}
                          className={`p-6 rounded-2xl border-2 transition-all ${
                            active 
                              ? 'border-[#0D9488] bg-[#F0FDFA] shadow-md' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="text-3xl mb-3">{domain.icon}</div>
                          <div className="font-semibold text-gray-900">{domain.label}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Interview Mode Toggle */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Interview Mode</label>
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                      <button
                        onClick={() => setInterviewMode("text")}
                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                          interviewMode === "text"
                            ? "bg-white text-[#0D9488] shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Text Mode
                      </button>
                      <button
                        onClick={() => setInterviewMode("voice")}
                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                          interviewMode === "voice"
                            ? "bg-white text-[#0D9488] shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Voice Mode
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={startInterview}
                    disabled={isLoadingQuestions}
                    className="w-full bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingQuestions ? "Loading Questions..." : "Begin Interview →"}
                  </button>
                  {errorMessage && (
                    <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">{errorMessage}</div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Question Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F0FDFA] rounded-full flex items-center justify-center">
                        <Mic className="w-4 h-4 text-[#0D9488]" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</div>
                        <div className="font-semibold text-gray-900">AI Interviewer</div>
                      </div>
                    </div>
                    <button
                      onClick={() => speakText(questions[currentQuestionIndex])}
                      className="p-2 text-gray-600 hover:text-[#0D9488] transition-colors"
                      title="Speak Question"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-[#0D9488] to-[#0F766E] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Question */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {questions[currentQuestionIndex]}
                    </h3>
                  </div>

                  {/* Answer Area */}
                  {interviewMode === "text" ? (
                    <div className="space-y-4">
                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here..."
                        className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
                      />
                      <div className="flex justify-between items-center">
                        <div className={`text-sm ${countWords(answer) >= MIN_WORDS ? 'text-[#0D9488]' : 'text-gray-500'}`}>
                          {countWords(answer)} words {countWords(answer) < MIN_WORDS && `(minimum ${MIN_WORDS})`}
                        </div>
                        <button
                          onClick={submitAnswer}
                          disabled={countWords(answer) < MIN_WORDS || isFinalizing}
                          className="bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isFinalizing ? "Preparing your report..." : currentQuestionIndex >= questions.length - 1 ? "Finish Interview" : "Next Question →"}
                        </button>
                      </div>
                    </div>

                  ) : (
                    <div className="space-y-4">
                      {/* Language selection similar to smart-interview */}
                      <div className="flex items-center justify-end gap-2 mb-2">
                        <span className="text-xs text-gray-500 font-semibold">Language:</span>
                        {[{code:'en-IN',label:'🇮🇳 India'},{code:'en-GB',label:'🇬🇧 UK'},{code:'en-US',label:'🇺🇸 US'}].map(l => (
                          <button 
                            key={l.code} 
                            onClick={() => setLang(l.code)}
                            type="button"
                            className={`text-xs px-2 py-1 rounded-full border font-medium transition-all ${
                              speechLang === l.code 
                                ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-sm' 
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#0D9488]'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>

                      <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-100">
                        {isConnecting ? (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                              <Mic className="w-8 h-8 text-yellow-600" />
                            </div>
                            <div className="text-gray-600 font-medium">Starting microphone...</div>
                          </div>
                        ) : isRecording ? (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                              <Mic className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-gray-900 font-semibold animate-pulse">Recording... Speak your answer now</div>
                            
                            {/* Live transcript during recording */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-[80px] text-left shadow-inner">
                              {(hookTranscript || hookInterimTranscript) ? (
                                <p className="text-sm text-gray-800 leading-relaxed">
                                  <span className="text-gray-900">{hookTranscript}</span>
                                  {hookInterimTranscript && <span className="text-gray-400 italic"> {hookInterimTranscript}</span>}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400 italic">Listening... start speaking</p>
                              )}
                            </div>

                            <div className="flex gap-4 max-w-md mx-auto">
                              <button
                                onClick={stopRecording}
                                type="button"
                                className="flex-1 bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                              >
                                <span className="w-2.5 h-2.5 bg-white rounded-full"></span> Stop
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
                                  className="flex-1 bg-[#0D9488] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors shadow-sm"
                                >
                                  Stop &amp; Submit →
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-[#F0FDFA] rounded-full flex items-center justify-center mx-auto">
                              <Mic className="w-8 h-8 text-[#0D9488]" />
                            </div>
                            
                            {/* Review and Edit when not recording but transcript exists */}
                            {voiceAnswer ? (
                              <div className="space-y-4 text-left max-w-xl mx-auto">
                                <label className="block text-xs font-bold text-[#0D9488] uppercase tracking-wide">Review &amp; Edit Your Answer:</label>
                                <textarea
                                  value={voiceAnswer}
                                  onChange={(e) => setVoiceAnswer(e.target.value)}
                                  className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent bg-white text-sm leading-relaxed"
                                  placeholder="Review transcript..."
                                />
                                <div className="flex gap-4">
                                  <button
                                    onClick={startRecording}
                                    type="button"
                                    className="flex-1 bg-white text-gray-700 border border-gray-300 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                  >
                                    Re-record
                                  </button>
                                  <button
                                    onClick={submitVoiceAnswer}
                                    disabled={isFinalizing || !voiceAnswer.trim()}
                                    type="button"
                                    className="flex-1 bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {isFinalizing ? "Preparing your report..." : currentQuestionIndex >= questions.length - 1 ? "Finish Interview" : "Next Question →"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="text-gray-600 font-medium">Click to start recording</div>
                                <button
                                  onClick={startRecording}
                                  type="button"
                                  className="bg-gradient-to-r from-[#0D9488] to-[#0F766E] text-white px-8 py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                                >
                                  Start Recording
                                </button>
                                {transcriptionError && (
                                  <div className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg p-2 max-w-sm mx-auto">{transcriptionError}</div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {isFinalizing && (
                  <div className="p-4 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1] flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
                    <div className="text-[#0F766E] text-sm font-medium">Preparing your report — scoring your answers...</div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex items-center justify-between gap-4">
                    <div className="text-red-600 text-sm">{errorMessage}</div>
                    {failedCount > 0 && !isFinalizing && (
                      <button
                        onClick={retryFailed}
                        type="button"
                        className="shrink-0 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 3 && feedback && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                  <div className="mb-6">
                    <div className={`text-6xl font-bold ${
                      feedback.overall_score >= 8 ? 'text-green-600' :
                      feedback.overall_score >= 6 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {feedback.overall_score}/10
                    </div>
                    <div className="text-gray-600 mt-2">Overall Score</div>
                  </div>
                  
                  <div className="flex justify-center gap-4 mb-8">
                    <button
                      onClick={shareResult}
                      className="flex items-center gap-2 px-4 py-2 bg-[#F0FDFA] text-[#0D9488] rounded-lg hover:bg-[#CCFBF1] transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Result
                    </button>
                    <button
                      onClick={resetInterview}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Try Again
                    </button>
                  </div>
                </div>

                {/* Detailed Feedback */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Metrics */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                    <div className="space-y-3">
                      {Object.entries(feedback.metrics || {}).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-[#0D9488] h-2 rounded-full"
                                style={{ width: `${(value / 10) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium w-8">{value}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filler Words */}
                  {feedback.filler_words && feedback.filler_words.length > 0 && (
                    <div className="bg-orange-50 rounded-2xl p-6 shadow-sm border border-orange-200">
                      <h3 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Filler Words Detected
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {feedback.filler_words.map((word, index) => (
                          <span key={index} className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-2xl p-6 shadow-sm border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {(feedback.strengths || []).map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-yellow-50 rounded-2xl p-6 shadow-sm border border-yellow-200">
                    <h3 className="font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {(feedback.improvements || []).map((improvement, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Personalised training from this interview */}
                {(() => {
                  const rec = recommendTraining({ domain: selectedDomain, metrics: feedback.metrics });
                  if (!rec) return null;
                  const href = `/training?track=${rec.trackId}&lesson=${rec.lessonId}&reason=${encodeURIComponent(rec.reason)}`;
                  return (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-[#0D9488] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-1">Your next step</p>
                        <p className="font-semibold text-gray-900">{rec.reason}</p>
                        <p className="text-sm text-gray-600">We picked a short lesson to fix exactly this. Then retake the interview to see your score move.</p>
                      </div>
                      <Link href={href} className="shrink-0 text-center bg-[#0D9488] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#0F766E]">
                        Start training →
                      </Link>
                    </div>
                  );
                })()}

                {/* Question-by-question review */}
                {Array.isArray(feedback.perQuestion) && feedback.perQuestion.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Question-by-question review</h3>
                    <div className="space-y-5">
                      {feedback.perQuestion.map((item, index) => (
                        <div key={index} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <p className="font-medium text-gray-900">{index + 1}. {item.question}</p>
                            <span className="shrink-0 text-sm font-semibold text-[#0D9488]">{item.score}/10</span>
                          </div>
                          {item.better_answer && (
                            <div className="bg-[#F0FDFA] rounded-xl p-4 border border-[#CCFBF1]">
                              <div className="text-xs font-bold text-[#0F766E] uppercase tracking-wide mb-1">A stronger answer</div>
                              <p className="text-sm text-gray-700 leading-relaxed">{item.better_answer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Tips and Progress */}
          <div className="space-y-6">
            {/* Tips Card */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Quick Tips
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#F0FDFA] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#0D9488]">1</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Structure your answer</div>
                      <div className="text-sm text-gray-600">Start with context, then main points, conclusion</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#F0FDFA] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#0D9488]">2</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Use STAR method</div>
                      <div className="text-sm text-gray-600">Situation, Task, Action, Result</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-[#F0FDFA] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#0D9488]">3</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Avoid filler words</div>
                      <div className="text-sm text-gray-600">Minimize "um", "like", "you know"</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Card */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Your Progress</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Questions Answered</span>
                    <span className="font-semibold text-gray-900">{currentQuestionIndex}/{questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Time Spent</span>
                    <span className="font-semibold text-gray-900">~2 min/question</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mode</span>
                    <span className="font-semibold text-gray-900 capitalize">{interviewMode}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Domain Info */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">About {selectedDomain}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#F0FDFA] rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-[#0D9488]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">High Demand</div>
                      <div className="text-sm text-gray-600">Top companies are hiring</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Great Growth</div>
                      <div className="text-sm text-gray-600">Career advancement opportunities</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
