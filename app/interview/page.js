"use client";

import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, Info, Send, RotateCcw, Share2, Home, Mic, Zap, Trophy, User, Volume2, Lightbulb, Star, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

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

  useEffect(() => {
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
    if (!browserSupport) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';
    
    recognitionInstance.onstart = () => {
      setIsRecording(true);
      setTranscript("");
    };
    
    recognitionInstance.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);
    };
    
    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      toast.error('Speech recognition failed. Please try again.');
    };
    
    recognitionInstance.onend = () => {
      setIsRecording(false);
      if (transcript.trim()) {
        submitVoiceAnswer();
      }
    };
    
    setRecognition(recognitionInstance);
    recognitionInstance.start();
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
    }
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

  const submitVoiceAnswer = async () => {
    if (!transcript.trim()) {
      setErrorMessage("Please speak an answer before submitting.");
      return;
    }

    if (!uid || !sessionId) {
      setErrorMessage("User session not initialized. Please refresh and try again.");
      return;
    }

    setErrorMessage("");
    setIsAnalyzingAnswer(true);

    try {
      const currentQuestion = questions[currentQuestionIndex];
      console.log('Submitting voice answer:', { currentQuestion, transcript: transcript.trim(), domain: selectedDomain, uid, sessionId });
      
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          answer: transcript.trim(),
          domain: selectedDomain,
          uid,
          sessionId
        }),
      });

      console.log('Voice answer response status:', response.status);
      const data = await response.json();
      console.log('Voice answer response data:', data);

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
          analysis: data
        }
      ];
      setResponses(updatedResponses);
      setTranscript("");
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setStep(3);
        setFeedback(data);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Error submitting voice answer:', error);
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
      const currentQuestion = questions[currentQuestionIndex];
      const response = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          answer: answer.trim(),
          domain: selectedDomain,
          uid,
          sessionId
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

      const isLastQuestion = currentQuestionIndex >= questions.length - 1;
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

  const aggregateFeedback = (analyses) => {
    if (!analyses || analyses.length === 0) return null;

    const totalScore = analyses.reduce((sum, analysis) => sum + (analysis.score || 0), 0);
    const overallScore = totalScore / analyses.length;

    const allFillerWords = new Set();
    const allStrengths = [];
    const allImprovements = [];

    analyses.forEach(analysis => {
      if (analysis.filler_words) {
        analysis.filler_words.forEach(word => allFillerWords.add(word));
      }
      if (analysis.strengths) {
        allStrengths.push(...analysis.strengths);
      }
      if (analysis.improvements) {
        allImprovements.push(...analysis.improvements);
      }
    });

    return {
      overall_score: overallScore,
      filler_words: Array.from(allFillerWords),
      strengths: allStrengths,
      improvements: allImprovements,
      metrics: {
        clarity: overallScore,
        relevance: overallScore,
        confidence: overallScore,
        structure: overallScore,
        completeness: overallScore
      },
      model_answer: "Based on your responses, a strong answer would demonstrate clear communication of your skills and experiences with specific examples, showing how they align with the role requirements."
    };
  };

  return (
    <AppShell>
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
              step >= 1 ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
              <span>Choose Domain</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step >= 2 ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
              <span>Answer Questions</span>
            </div>
            <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step >= 3 ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'
            }`}>
              <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
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
                              ? 'border-purple-500 bg-purple-50 shadow-md' 
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
                            ? "bg-white text-purple-500 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Text Mode
                      </button>
                      <button
                        onClick={() => setInterviewMode("voice")}
                        className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                          interviewMode === "voice"
                            ? "bg-white text-purple-500 shadow-sm"
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
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingQuestions ? "Loading Questions..." : "Begin Interview →"}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                {/* Question Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                        <Mic className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of 5</div>
                        <div className="font-semibold text-gray-900">AI Interviewer</div>
                      </div>
                    </div>
                    <button
                      onClick={() => speakText(questions[currentQuestionIndex])}
                      className="p-2 text-gray-600 hover:text-purple-400 transition-colors"
                      title="Speak Question"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full transition-all duration-300"
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
                        className="w-full h-32 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {answer.length} characters
                        </div>
                        <button
                          onClick={submitAnswer}
                          disabled={!answer.trim() || isAnalyzingAnswer}
                          className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isAnalyzingAnswer ? "Analyzing..." : "Submit Answer"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-8 text-center">
                        {isRecording ? (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                              <Mic className="w-8 h-8 text-white" />
                            </div>
                            <div className="text-gray-900">Recording... Speak now</div>
                            <button
                              onClick={stopRecording}
                              className="bg-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors"
                            >
                              Stop Recording
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto">
                              <Mic className="w-8 h-8 text-purple-500" />
                            </div>
                            <div className="text-gray-600">Click to start recording</div>
                            <button
                              onClick={startRecording}
                              disabled={!browserSupport}
                              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Start Recording
                            </button>
                          </div>
                        )}
                      </div>
                      {transcript && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                          <div className="text-sm text-cyan-600 font-medium mb-2">Transcript:</div>
                          <div className="text-gray-900">{transcript}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                    <div className="text-red-600 text-sm">{errorMessage}</div>
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
                      className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
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
                                className="bg-purple-500 h-2 rounded-full"
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

                {/* Model Answer */}
                {feedback.model_answer && (
                  <div className="bg-purple-50 rounded-2xl p-6 shadow-sm border border-purple-100">
                    <h3 className="font-semibold text-purple-800 mb-4">Model Answer</h3>
                    <p className="text-gray-700">{feedback.model_answer}</p>
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
                    <div className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-500">1</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Structure your answer</div>
                      <div className="text-sm text-gray-600">Start with context, then main points, conclusion</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-500">2</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Use STAR method</div>
                      <div className="text-sm text-gray-600">Situation, Task, Action, Result</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-500">3</span>
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
                    <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-purple-500" />
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
