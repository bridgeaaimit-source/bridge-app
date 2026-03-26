"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, Info, Send, RotateCcw, Share2, Home, Mic, Zap, Trophy, User } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

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
  const [interviewMode, setInterviewMode] = useState("text"); // "text" or "voice"
  const [selectedDomain, setSelectedDomain] = useState("Software Engineer");
  const [answer, setAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [analyses, setAnalyses] = useState([]);
  const [responses, setResponses] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [selectedFeedbackTab, setSelectedFeedbackTab] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isAnalyzingAnswer, setIsAnalyzingAnswer] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [browserSupport, setBrowserSupport] = useState(true);

  useEffect(() => {
    // Check browser support for Web Speech API
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setBrowserSupport(false);
    }
  }, []);

  const startRecording = () => {
    if (!browserSupport) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsRecording(true);
      setTranscript("");
    };

    recognitionInstance.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
    };

    recognitionInstance.onend = () => {
      setIsRecording(false);
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
  };

  useEffect(() => {
    if (step === 3 && feedback) {
      // Trigger confetti when interview is complete
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);
    }
  }, [step, feedback]);

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

  const startInterview = async (mode) => {
    console.log('=== START INTERVIEW CALLED ===');
    console.log('Mode:', mode);
    console.log('Selected domain:', selectedDomain);
    
    setInterviewMode(mode);
    setErrorMessage("");
    setIsLoadingQuestions(true);

    try {
      console.log('Making API call to /api/interview...');
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: selectedDomain, count: 5 }),
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

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
      setTranscript("");
      setStep(2);
    } catch (error) {
      console.error('Start interview error:', error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while starting your interview. Please try again."
      );
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const submitVoiceAnswer = async () => {
    if (!transcript.trim()) {
      setErrorMessage("Please speak your answer before submitting.");
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
          answer: transcript.trim(),
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
          answer: transcript.trim(),
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
        setTranscript("");
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

  const shareResult = () => {
    // Generate shareable text
    const shareText = `I scored ${feedback?.score.toFixed(1)}/10 in my AI Mock Interview on BRIDGE! 🚀 My BRIDGE Score is growing stronger. Join me!`;
    
    if (navigator.share) {
      navigator.share({
        title: "BRIDGE AI Mock Interview Result",
        text: shareText,
        url: window.location.origin,
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareText);
      alert("Result copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-6 py-6">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h1 className="text-lg font-bold text-purple-400">AI Mock Interview</h1>

          <button className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <Info className="w-5 h-5" />
          </button>
        </header>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-semibold mb-3">
            <span className={step >= 1 ? "text-purple-400" : "text-gray-500"}>Step 1: Choose Domain</span>
            <span className={step >= 2 ? "text-purple-400" : "text-gray-500"}>Step 2: Answer Questions</span>
            <span className={step >= 3 ? "text-purple-400" : "text-gray-500"}>Step 3: Get Feedback</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
              style={{
                width: step === 1 ? "33%" : step === 2 ? "66%" : "100%",
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="mb-20">
          {step === 1 && (
            <section className="animate-fade-up">
              <h2 className="text-2xl font-bold mb-2">What role are you preparing for?</h2>
              <p className="text-gray-400 text-sm mb-6">We'll ask you 5 targeted questions</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {domains.map((domain) => {
                  const active = selectedDomain === domain.label;
                  return (
                    <button
                      key={domain.label}
                      onClick={() => setSelectedDomain(domain.label)}
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        active
                          ? "bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-500/25"
                          : "bg-white/10 border-white/20 hover:bg-white/20"
                      }`}
                    >
                      <div className="text-2xl mb-2">{domain.icon}</div>
                      <div className="text-sm font-semibold">{domain.label}</div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => startInterview("text")}
                disabled={isLoadingQuestions}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed mb-3"
                style={{ boxShadow: '0 10px 25px rgba(108, 99, 255, 0.3)' }}
              >
                {isLoadingQuestions ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Generating Questions...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>📝</span>
                    Start Text Interview
                  </div>
                )}
              </button>

              <button
                onClick={() => startInterview("voice")}
                disabled={isLoadingQuestions || !browserSupport}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl font-semibold shadow-lg hover:shadow-red-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)' }}
              >
                {isLoadingQuestions ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    Generating Questions...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>🎤</span>
                    Start Voice Interview
                  </div>
                )}
              </button>

              {!browserSupport && (
                <div className="mt-4 px-4 py-3 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-300 text-sm text-center">
                  ⚠️ Please use Chrome on Android for voice interview
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
                  {errorMessage}
                </div>
              )}
            </section>
          )}

          {step === 2 && interviewMode === "voice" && (
            <section className="animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-purple-400">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
                <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-xs font-semibold text-red-400">
                  02:30
                </div>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                  style={{
                    width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 mb-6" style={{ boxShadow: '0 20px 40px rgba(108, 99, 255, 0.3)' }}>
                <div className="text-sm text-purple-200 mb-2">Current prompt</div>
                <h3 className="text-lg font-semibold leading-relaxed">
                  {currentQuestion || "Loading your interview question..."}
                </h3>
              </div>

              {/* Microphone Button */}
              <div className="flex flex-col items-center mb-6">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50' 
                      : 'bg-purple-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
                  }`}
                  style={{ 
                    boxShadow: isRecording 
                      ? '0 0 30px rgba(239, 68, 68, 0.6)' 
                      : '0 10px 25px rgba(108, 99, 255, 0.3)' 
                  }}
                >
                  <span className="text-3xl">{isRecording ? '🔴' : '🎤'}</span>
                </button>
                <div className="text-sm text-gray-400 mt-3">
                  {isRecording ? 'Recording...' : 'Tap to Speak'}
                </div>
              </div>

              {/* Live Transcription */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4 min-h-[120px]">
                <div className="text-xs text-gray-400 mb-2">Live Transcription</div>
                <div className="text-white min-h-[80px]">
                  {transcript || "Your speech will appear here..."}
                </div>
              </div>

              <button
                onClick={submitVoiceAnswer}
                disabled={!transcript.trim() || isAnalyzingAnswer}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl font-semibold shadow-lg hover:shadow-red-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)' }}
              >
                {isAnalyzingAnswer ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    AI is analyzing your answer...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Stop & Analyze
                    <Send className="w-4 h-4" />
                  </div>
                )}
              </button>

              {errorMessage && (
                <div className="mt-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
                  {errorMessage}
                </div>
              )}
            </section>
          )}

          {step === 2 && interviewMode === "text" && (
            <section className="animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-purple-400">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </div>
                <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-xs font-semibold text-red-400">
                  02:30
                </div>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                  style={{
                    width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 mb-6" style={{ boxShadow: '0 20px 40px rgba(108, 99, 255, 0.3)' }}>
                <div className="text-sm text-purple-200 mb-2">Current prompt</div>
                <h3 className="text-lg font-semibold leading-relaxed">
                  {currentQuestion || "Loading your interview question..."}
                </h3>
              </div>

              <div className="mb-4">
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full min-h-[180px] bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-white placeholder-gray-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
                <div className="text-right text-xs text-gray-400 mt-2">{wordCount} words</div>
              </div>

              <button
                onClick={submitAnswer}
                disabled={isAnalyzingAnswer}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ boxShadow: '0 10px 25px rgba(108, 99, 255, 0.3)' }}
              >
                {isAnalyzingAnswer ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                    AI is analyzing your answer...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    Submit Answer
                    <Send className="w-4 h-4" />
                  </div>
                )}
              </button>

              {errorMessage && (
                <div className="mt-4 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center">
                  {errorMessage}
                </div>
              )}
            </section>
          )}

          {step === 3 && (
            <section className="animate-fade-up">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Interview Complete! 🎉</h2>
                <p className="text-gray-400 text-sm">Great effort. Here's your AI feedback summary.</p>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 text-center mb-6" style={{ boxShadow: '0 20px 40px rgba(108, 99, 255, 0.3)' }}>
                <div className="text-sm text-purple-200 mb-2">BRIDGE Score Change</div>
                <div className="text-4xl font-black mb-2">+23 points! 🚀</div>
                <div className="text-2xl font-bold">{feedback?.score ?? 0} / 10</div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                  <div className="text-xs text-gray-400 mb-1">Clarity</div>
                  <div className="text-lg font-bold text-green-400">{feedback?.clarity ?? 0}/10</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                  <div className="text-xs text-gray-400 mb-1">Confidence</div>
                  <div className="text-lg font-bold text-green-400">{feedback?.confidence ?? 0}/10</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                  <div className="text-xs text-gray-400 mb-1">Content</div>
                  <div className="text-lg font-bold text-green-400">{feedback?.content ?? 0}/10</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
                  <div className="text-xs text-gray-400 mb-1">Communication</div>
                  <div className="text-lg font-bold text-green-400">{feedback?.communication ?? 0}/10</div>
                </div>
              </div>

              {/* Word Count Analysis */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-6">
                <div className="text-sm font-semibold mb-3">Word Count Analysis</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{feedback?.word_count ?? 0}</div>
                    <div className="text-xs text-gray-400">words used</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-400">Ideal: 80-120</div>
                    <div className="text-xs text-gray-400">Good range for interview answers</div>
                  </div>
                </div>
              </div>

              {/* Filler Words Analysis */}
              <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-500/20 mb-6">
                <div className="text-sm font-semibold text-red-400 mb-3">Filler Words Detected</div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-2xl font-bold text-red-400">{feedback?.filler_words?.count ?? 0}</div>
                  <div className="text-sm text-red-300">filler words found</div>
                </div>
                {(feedback?.filler_words?.found?.length > 0) && (
                  <div className="space-y-2">
                    <div className="text-xs text-red-300">Found: {feedback?.filler_words?.found?.join(", ")}</div>
                    <div className="text-xs text-gray-400 bg-red-500/5 rounded p-2">{feedback?.filler_words?.examples}</div>
                    <div className="text-xs text-red-200">{feedback?.filler_feedback}</div>
                  </div>
                )}
              </div>

              {/* Structure Analysis */}
              <div className="bg-blue-500/10 backdrop-blur-sm rounded-2xl p-4 border border-blue-500/20 mb-6">
                <div className="text-sm font-semibold text-blue-400 mb-3">Answer Structure</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Overall Rating</span>
                    <span className="text-sm font-bold text-blue-300">{feedback?.structure?.rating || "Poor"}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`text-center p-2 rounded ${feedback?.structure?.has_opening ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      <div className="text-xs">Opening</div>
                    </div>
                    <div className={`text-center p-2 rounded ${feedback?.structure?.has_examples ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      <div className="text-xs">Examples</div>
                    </div>
                    <div className={`text-center p-2 rounded ${feedback?.structure?.has_conclusion ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      <div className="text-xs">Conclusion</div>
                    </div>
                  </div>
                  {feedback?.structure_feedback && (
                    <div className="text-xs text-blue-200 bg-blue-500/5 rounded p-2">{feedback?.structure_feedback}</div>
                  )}
                </div>
              </div>

              {/* Language Analysis */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-orange-500/10 backdrop-blur-sm rounded-2xl p-4 border border-orange-500/20">
                  <div className="text-sm font-semibold text-orange-400 mb-3">Weak Language</div>
                  <div className="space-y-1">
                    {feedback?.weak_language?.length > 0 ? (
                      feedback?.weak_language?.map((phrase, idx) => (
                        <div key={`weak-${idx}`} className="text-xs text-orange-300">• {phrase}</div>
                      ))
                    ) : (
                      <div className="text-xs text-green-400">No weak phrases detected!</div>
                    )}
                  </div>
                </div>
                <div className="bg-green-500/10 backdrop-blur-sm rounded-2xl p-4 border border-green-500/20">
                  <div className="text-sm font-semibold text-green-400 mb-3">Strong Language</div>
                  <div className="space-y-1">
                    {feedback?.strong_language?.length > 0 ? (
                      feedback?.strong_language?.map((phrase, idx) => (
                        <div key={`strong-${idx}`} className="text-xs text-green-300">• {phrase}</div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400">Could be stronger</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-6">
                <div className="font-semibold mb-3">Per-question feedback</div>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {responses.map((item, idx) => {
                    const active = idx === selectedFeedbackTab;
                    return (
                      <button
                        key={`tab-${idx}`}
                        onClick={() => setSelectedFeedbackTab(idx)}
                        className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                          active
                            ? "bg-purple-500 text-white"
                            : "bg-white/10 text-gray-400 hover:bg-white/20"
                        }`}
                      >
                        Q{idx + 1}
                      </button>
                    );
                  })}
                </div>

                {responses[selectedFeedbackTab] && (
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="text-xs font-semibold text-gray-400 mb-1">Question</div>
                      <div className="text-sm font-medium">
                        {responses[selectedFeedbackTab].question}
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-400">Your answer</div>
                        <div className="bg-purple-500/20 px-2 py-1 rounded text-xs font-bold text-purple-400">
                          Score: {Number(responses[selectedFeedbackTab]?.analysis?.score ?? 0).toFixed(1)}/10
                        </div>
                      </div>
                      <div className="text-sm leading-relaxed text-gray-300">
                        {responses[selectedFeedbackTab].answer}
                      </div>
                    </div>

                    <div className="bg-green-500/10 rounded-xl p-3 border border-green-500/20">
                      <div className="text-sm font-bold text-green-400 mb-2">Strengths</div>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-green-300">
                        {(
                          responses[selectedFeedbackTab]?.analysis?.strengths?.length
                            ? responses[selectedFeedbackTab].analysis.strengths
                            : ["Clear attempt and relevant framing."]
                        ).map((item, idx) => (
                          <li key={`q-strength-${selectedFeedbackTab}-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                      <div className="text-sm font-bold text-red-400 mb-2">Improvements</div>
                      <ul className="list-disc space-y-1 pl-5 text-sm text-red-300">
                        {(
                          responses[selectedFeedbackTab]?.analysis?.improvements?.length
                            ? responses[selectedFeedbackTab].analysis.improvements
                            : ["Add stronger specifics and measurable outcomes."]
                        ).map((item, idx) => (
                          <li key={`q-improvement-${selectedFeedbackTab}-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-purple-500/10 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/20 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-bold text-purple-400">Model Answer</div>
                  <button
                    onClick={() => navigator.clipboard.writeText(feedback?.better_answer || "")}
                    className="text-xs bg-purple-500/20 px-2 py-1 rounded text-purple-300 hover:bg-purple-500/30 transition-colors"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="text-sm leading-relaxed text-purple-200">
                  {feedback?.better_answer || "A well-structured answer should include specific examples, measurable results, and a clear conclusion that demonstrates your capabilities and alignment with the role requirements."}
                </div>
              </div>

              <div className="bg-green-500/10 backdrop-blur-sm rounded-2xl p-4 border border-green-500/20 mb-4">
                <div className="text-sm font-bold text-green-400 mb-3">Overall Strengths</div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-green-300">
                  {(feedback?.strengths?.length ? feedback.strengths : ["Strong effort and thoughtful responses."]).map(
                    (item, idx) => (
                      <li key={`strength-${idx}`}>{item}</li>
                    )
                  )}
                </ul>
              </div>

              <div className="bg-orange-500/10 backdrop-blur-sm rounded-2xl p-4 border border-orange-500/20 mb-6">
                <div className="text-sm font-bold text-orange-400 mb-3">Areas to Improve</div>
                <ul className="list-disc space-y-1 pl-5 text-sm text-orange-300">
                  {(
                    feedback?.improvements?.length
                      ? feedback.improvements
                      : ["Add more specific examples and measurable outcomes."]
                  ).map((item, idx) => (
                    <li key={`improvement-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={resetInterview}
                  className="py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Practice Again
                </button>
                <button
                  onClick={shareResult}
                  className="py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share Result
                </button>
              </div>
            </section>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-md mx-auto px-6 py-3">
            <div className="grid grid-cols-5 gap-4">
              <Link href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400">
                <Home className="w-5 h-5" />
                <span className="text-xs">Home</span>
              </Link>
              <Link href="/interview" className="flex flex-col items-center gap-1 text-purple-400">
                <Mic className="w-5 h-5" />
                <span className="text-xs">Practice</span>
              </Link>
              <Link href="/pulse" className="flex flex-col items-center gap-1 text-gray-400">
                <Zap className="w-5 h-5" />
                <span className="text-xs">PULSE</span>
              </Link>
              <Link href="/leaderboard" className="flex flex-col items-center gap-1 text-gray-400">
                <Trophy className="w-5 h-5" />
                <span className="text-xs">Trophy</span>
              </Link>
              <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400">
                <User className="w-5 h-5" />
                <span className="text-xs">Profile</span>
              </Link>
            </div>
          </div>
        </nav>
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
