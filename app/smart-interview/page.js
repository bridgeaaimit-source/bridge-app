"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Brain, Mic, Keyboard, Upload, FileText, Send, CheckCircle, AlertCircle, TrendingUp, Award, Target, MessageSquare, X, Play, Pause } from "lucide-react";

export default function SmartInterviewPage() {
  const [stage, setStage] = useState('setup'); // 'setup' | 'interviewing' | 'feedback'
  const [resumeBase64, setResumeBase64] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [round, setRound] = useState('HR Round');
  const [mode, setMode] = useState('text'); // 'text' | 'voice'
  
  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const rounds = ['HR Round', 'Technical', 'Managerial', 'Full Interview'];
  const maxQuestions = 10;

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
        if (event.results[current].isFinal) {
          setCurrentAnswer(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognition);
    }
  }, []);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory, currentQuestion]);

  const handleResumeUpload = async (file) => {
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        setResumeBase64(base64);
        setResumeFileName(file.name);
        
        // Try to extract text for display (simplified)
        setResumeText(`Resume uploaded: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const startInterview = async () => {
    if (!resumeBase64 && !resumeText || !jobRole || !jobDescription) {
      alert('Please fill all fields and upload resume');
      return;
    }

    setLoading(true);
    setStage('interviewing');
    setQuestionNumber(1);
    setConversationHistory([]);

    try {
      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'init',
          resume_base64: resumeBase64,
          resume_text: resumeText,
          job_role: jobRole,
          jd: jobDescription,
          round: round
        })
      });

      const data = await response.json();
      setCurrentQuestion(data.question);
      setIsTyping(false);
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview');
      setStage('setup');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    const answerToSubmit = currentAnswer;
    setCurrentAnswer('');
    setTranscript('');
    setIsTyping(true);

    // Add to conversation history
    const newHistory = [...conversationHistory, {
      question: currentQuestion,
      answer: answerToSubmit
    }];
    setConversationHistory(newHistory);

    try {
      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'continue',
          resume_text: resumeText,
          resume_base64: resumeBase64,
          job_role: jobRole,
          jd: jobDescription,
          round: round,
          conversation_history: newHistory,
          last_answer: answerToSubmit
        })
      });

      const data = await response.json();
      
      if (data.interview_complete || questionNumber >= maxQuestions) {
        // Get final evaluation
        await getFinalEvaluation(newHistory);
      } else {
        setCurrentQuestion(data.question);
        setQuestionNumber(questionNumber + 1);
        setIsTyping(false);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setIsTyping(false);
    }
  };

  const getFinalEvaluation = async (history) => {
    try {
      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate',
          resume_text: resumeText,
          resume_base64: resumeBase64,
          job_role: jobRole,
          jd: jobDescription,
          round: round,
          conversation_history: history
        })
      });

      const data = await response.json();
      setFeedback(data);
      setStage('feedback');
    } catch (error) {
      console.error('Error getting evaluation:', error);
      alert('Failed to get evaluation');
    }
  };

  const startRecording = () => {
    if (recognition) {
      recognition.start();
      setIsRecording(true);
      setTranscript('');
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
  };

  const endInterview = () => {
    if (conversationHistory.length > 0) {
      getFinalEvaluation(conversationHistory);
    } else {
      setStage('setup');
    }
  };

  const getPlacementChanceColor = (chance) => {
    if (chance <= 50) return 'text-red-500';
    if (chance <= 75) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getPlacementChanceBg = (chance) => {
    if (chance <= 50) return 'bg-red-500/20 border-red-500/30';
    if (chance <= 75) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-green-500/20 border-green-500/30';
  };

  // SETUP SCREEN
  if (stage === 'setup') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white">
        {/* Header */}
        <div className="max-w-md mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold">Smart Interview</h1>
            </div>
          </div>

          <p className="text-gray-400 mb-8">Personalized based on your resume & JD</p>

          {/* Resume Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Resume (PDF)
            </label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all
                ${resumeFileName ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-white/5 hover:border-purple-500'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => handleResumeUpload(e.target.files[0])}
                className="hidden"
              />
              {resumeFileName ? (
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">{resumeFileName}</span>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">Click to upload PDF resume</p>
                </div>
              )}
            </div>
          </div>

          {/* Job Role */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Role
            </label>
            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Software Engineer at TCS"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Job Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the complete Job Description here..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Round Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interview Round
            </label>
            <div className="flex gap-2 flex-wrap">
              {rounds.map((r) => (
                <button
                  key={r}
                  onClick={() => setRound(r)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    round === r
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Interview Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('text')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'text'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-600 bg-white/5 hover:border-purple-500'
                }`}
              >
                <Keyboard className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <div className="text-sm font-medium">Text Mode</div>
                <div className="text-xs text-gray-400 mt-1">Type your answers</div>
              </button>
              <button
                onClick={() => setMode('voice')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  mode === 'voice'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-600 bg-white/5 hover:border-purple-500'
                }`}
              >
                <Mic className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <div className="text-sm font-medium">Voice Mode</div>
                <div className="text-xs text-gray-400 mt-1">Speak your answers</div>
              </button>
            </div>
          </div>

          {/* Placement Chance Preview */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              <div>
                <div className="text-sm font-medium text-purple-300">Placement Chance Preview</div>
                <div className="text-xs text-gray-400">Get your placement probability score based on resume vs JD match</div>
              </div>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={startInterview}
            disabled={loading || (!resumeBase64 && !resumeText) || !jobRole || !jobDescription}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold rounded-2xl transition-all hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                Starting Interview...
              </div>
            ) : (
              'Start Interview'
            )}
          </button>
        </div>
      </div>
    );
  }

  // INTERVIEW SCREEN
  if (stage === 'interviewing') {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white flex flex-col">
        {/* Header */}
        <div className="max-w-md mx-auto w-full px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-purple-400">{round}</div>
            <div className="text-sm text-gray-400">Q{questionNumber} of {maxQuestions}</div>
            <button
              onClick={endInterview}
              className="text-red-400 text-sm font-medium"
            >
              End
            </button>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-purple-700 transition-all duration-300"
              style={{ width: `${(questionNumber / maxQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 max-w-md mx-auto w-full px-6 py-4 overflow-y-auto">
          {conversationHistory.map((item, index) => (
            <div key={index} className="mb-4">
              {/* AI Question */}
              <div className="flex gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                  AI
                </div>
                <div className="flex-1 bg-purple-500/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30">
                  <p className="text-white">{item.question}</p>
                </div>
              </div>
              {/* User Answer */}
              <div className="flex gap-3 justify-end">
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 max-w-[80%]">
                  <p className="text-gray-300">{item.answer}</p>
                </div>
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                  U
                </div>
              </div>
            </div>
          ))}

          {/* Current Question */}
          {currentQuestion && (
            <div className="flex gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm font-bold">
                AI
              </div>
              <div className="flex-1 bg-purple-500/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30">
                {isTyping ? (
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                ) : (
                  <p className="text-white">{currentQuestion}</p>
                )}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Answer Input */}
        <div className="max-w-md mx-auto w-full px-6 py-4 border-t border-white/10">
          {mode === 'text' ? (
            <div className="space-y-3">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors resize-none"
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {currentAnswer.split(' ').filter(w => w).length} words (min 30 suggested)
                </div>
                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isTyping}
                  className="px-6 py-2 bg-purple-600 text-white font-medium rounded-xl transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {transcript && (
                <div className="bg-white/10 rounded-xl p-3 text-gray-300">
                  {transcript}
                </div>
              )}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full transition-all ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse' 
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  {isRecording ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Mic className="w-6 h-6 text-white" />
                  )}
                </button>
                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isTyping}
                  className="px-6 py-3 bg-purple-600 text-white font-medium rounded-xl transition-all hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // FEEDBACK SCREEN
  if (stage === 'feedback' && feedback) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white">
        <div className="max-w-md mx-auto px-6 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">Interview Complete</h1>
            <p className="text-gray-400">Here's your detailed evaluation</p>
          </div>

          {/* Placement Chance */}
          <div className={`rounded-2xl p-6 border mb-6 ${getPlacementChanceBg(feedback.placement_chance)}`}>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Placement Chance</div>
              <div className={`text-5xl font-bold mb-2 ${getPlacementChanceColor(feedback.placement_chance)}`}>
                {feedback.placement_chance}%
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                feedback.verdict === 'Selected' ? 'bg-green-500/20 text-green-400' :
                feedback.verdict === 'Strong Maybe' ? 'bg-yellow-500/20 text-yellow-400' :
                feedback.verdict === 'Weak Maybe' ? 'bg-orange-500/20 text-orange-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {feedback.verdict}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Based on your resume fit and interview performance
              </div>
            </div>
          </div>

          {/* Overall Score */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Overall Score</div>
              <div className="text-3xl font-bold text-purple-400">{feedback.overall_score}/10</div>
            </div>
          </div>

          {/* Score Metrics */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              {Object.entries(feedback.scores).map(([key, score]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-300 capitalize">
                    {key.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-700"
                        style={{ width: `${(score / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{score}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interviewer Notes */}
          <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-500/30 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-red-400">Interviewer Notes</h3>
            <p className="text-gray-300 italic">
              "What the interviewer would write about you:"
            </p>
            <p className="text-gray-300 mt-2">{feedback.interviewer_notes}</p>
          </div>

          {/* Best & Worst Answers */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-500/10 backdrop-blur-sm rounded-2xl p-4 border border-green-500/30">
              <h4 className="text-sm font-semibold text-green-400 mb-2">Best Answer</h4>
              <p className="text-xs text-gray-300 mb-1">{feedback.best_answer.question}</p>
              <p className="text-xs text-gray-400">{feedback.best_answer.why}</p>
            </div>
            <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30">
              <h4 className="text-sm font-semibold text-red-400 mb-2">Worst Answer</h4>
              <p className="text-xs text-gray-300 mb-1">{feedback.worst_answer.question}</p>
              <p className="text-xs text-gray-400">{feedback.worst_answer.why}</p>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-green-500/10 backdrop-blur-sm rounded-2xl p-4 border border-green-500/30">
              <h4 className="text-sm font-semibold text-green-400 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {feedback.strengths.map((strength, i) => (
                  <li key={i} className="text-xs text-gray-300">• {strength}</li>
                ))}
              </ul>
            </div>
            <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-4 border border-red-500/30">
              <h4 className="text-sm font-semibold text-red-400 mb-2">Weaknesses</h4>
              <ul className="space-y-1">
                {feedback.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-xs text-gray-300">• {weakness}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Improvement Roadmap */}
          <div className="bg-orange-500/10 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30 mb-6">
            <h3 className="text-lg font-semibold mb-3 text-orange-400">Improvement Roadmap</h3>
            <ol className="space-y-2">
              {feedback.improvement_roadmap.map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-orange-400 font-medium">{i + 1}.</span>
                  <span className="text-gray-300 text-sm">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Hire Decision */}
          <div className={`rounded-2xl p-6 border mb-6 ${
            feedback.should_hire 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <h3 className={`text-lg font-semibold mb-3 ${
              feedback.should_hire ? 'text-green-400' : 'text-red-400'
            }`}>
              {feedback.should_hire ? '✅ Should Hire' : '❌ Should Not Hire'}
            </h3>
            <p className="text-gray-300 text-sm">{feedback.hire_reasoning}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button className="w-full py-3 bg-purple-600 text-white font-bold rounded-2xl transition-all hover:bg-purple-700">
              Share Result
            </button>
            <button 
              onClick={() => setStage('setup')}
              className="w-full py-3 bg-white/10 text-white font-bold rounded-2xl transition-all hover:bg-white/20"
            >
              Try Again
            </button>
            <button className="w-full py-3 bg-white/10 text-white font-bold rounded-2xl transition-all hover:bg-white/20">
              Practice Weak Areas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
