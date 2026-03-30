"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Brain, Mic, Keyboard, Upload, FileText, Send, CheckCircle, AlertCircle, TrendingUp, Award, Target, MessageSquare, X, Play, Pause, Volume2, Lightbulb, Star, History } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, collection, addDoc, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function SmartInterviewPage() {
  const [stage, setStage] = useState('setup'); // 'setup' | 'interviewing' | 'feedback' | 'history'
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
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [tooFewAnswers, setTooFewAnswers] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  
  const fileInputRef = useRef(null);

  // Check browser support for speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
    }
    
    // Load voices for TTS
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
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

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setResumeBase64(base64);
      setResumeFileName(file.name);
      
      // Extract text from resume (simplified - in production, you'd use a proper PDF parser)
      setResumeText(`Resume uploaded: ${file.name}`);
      
      toast.success('Resume uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload resume');
      console.error('Resume upload error:', error);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const startRecording = () => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

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
        setCurrentAnswer(transcript);
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

  const startInterview = async () => {
    if (!resumeBase64 || !jobRole) {
      toast.error('Please upload resume and enter job role');
      return;
    }

    setLoading(true);
    
    try {
      // Start the interview
      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'init',
          resume_base64: resumeBase64,
          job_role: jobRole,
          jd: jobDescription,
          round,
          mode,
        }),
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response (init):', errorText);
        throw new Error(errorText || 'Failed to start interview');
      }

      // Check if response has content before parsing JSON
      const responseText = await response.text();
      console.log('API Response Text (init):', responseText);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error (init):', parseError);
        console.error('Response that failed to parse:', responseText);
        throw new Error('Invalid response format from server');
      }

      setCurrentQuestion(data.question);
      setConversationHistory([
        { role: 'interviewer', message: data.question }
      ]);
      setStage('interviewing');
      setQuestionNumber(1);
      
      if (autoSpeak) {
        speakText(data.question);
      }
      
    } catch (error) {
      toast.error(error.message || 'Failed to start interview');
      console.error('Interview start error:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    const answer = mode === 'voice' ? transcript : currentAnswer;
    
    if (!answer.trim()) {
      toast.error('Please provide an answer');
      return;
    }

    setIsTyping(true);
    
    // Add user's answer to conversation
    const formattedHistory = conversationHistory.map((item, index) => ({
      question: item.role === 'interviewer' ? item.message : (conversationHistory[index - 1]?.message || ''),
      answer: item.role === 'user' ? item.message : (conversationHistory[index + 1]?.message || '')
    })).filter(item => item.question && item.answer);
    
    const newHistory = [...formattedHistory, { question: currentQuestion, answer }];
    setConversationHistory([
      ...conversationHistory,
      { role: 'interviewer', message: currentQuestion },
      { role: 'user', message: answer }
    ]);

    // Hard limit: End interview after 10 questions
    if (questionNumber >= 10) {
      setIsTyping(false);
      setCurrentAnswer('');
      setTranscript('');
      toast.success('Interview completed! Generating feedback...');
      await getFeedback(newHistory);
      return;
    }

    try {
      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'continue',
          resume_base64: resumeBase64,
          job_role: jobRole,
          jd: jobDescription,
          round,
          conversation_history: newHistory,
          last_answer: answer,
        }),
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response (continue):', errorText);
        throw new Error(errorText || 'Failed to process answer');
      }

      // Check if response has content before parsing JSON
      const responseText = await response.text();
      console.log('API Response Text (continue):', responseText);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error (continue):', parseError);
        console.error('Response that failed to parse:', responseText);
        throw new Error('Invalid response format from server');
      }

      if (data.question) {
        setCurrentQuestion(data.question);
        setConversationHistory([
          ...newHistory,
          { role: 'interviewer', message: data.question }
        ]);
        setQuestionNumber(questionNumber + 1);
        
        if (autoSpeak) {
          speakText(data.question);
        }
      } else {
        // Interview ended, get feedback
        await getFeedback(newHistory);
      }
      
    } catch (error) {
      toast.error(error.message || 'Failed to process answer');
      console.error('Answer submission error:', error);
    } finally {
      setIsTyping(false);
      setCurrentAnswer('');
      setTranscript('');
    }
  };

  const getFeedback = async (conversationHistory) => {
    setIsEvaluating(true);
    
    // Convert conversation history to API format
    const formattedHistory = conversationHistory.map((item, index) => ({
      question: item.role === 'interviewer' ? item.message : (conversationHistory[index - 1]?.message || ''),
      answer: item.role === 'user' ? item.message : (conversationHistory[index + 1]?.message || '')
    })).filter(item => item.question && item.answer);
    
    try {
      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'evaluate',
          resume_base64: resumeBase64,
          job_role: jobRole,
          jd: jobDescription,
          round,
          conversation_history: formattedHistory,
        }),
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(errorText || 'Failed to get feedback');
      }

      // Check if response has content before parsing JSON
      const responseText = await response.text();
      console.log('API Response Text:', responseText);
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

            let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Feedback data received:', data);
        console.log('Placement chance:', data.placement_chance);
        console.log('Scores:', data.scores);
        console.log('Verdict:', data.verdict);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response that failed to parse:', responseText);
        throw new Error('Invalid response format from server');
      }

      setFeedback(data);
      setStage('feedback');
      
      // Save feedback to Firestore
      try {
        const user = auth.currentUser;
        if (user) {
          await addDoc(collection(db, 'users', user.uid, 'interview_feedback'), {
            jobRole,
            round,
            feedback: data,
            conversationHistory: conversationHistory,
            timestamp: new Date().toISOString(),
            createdAt: Date.now()
          });
          console.log('Feedback saved to history');
        }
      } catch (saveError) {
        console.error('Error saving feedback:', saveError);
        // Don't show error to user, just log it
      }
      
    } catch (error) {
      toast.error(error.message || 'Failed to get feedback');
      console.error('Feedback error:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetInterview = () => {
    setStage('setup');
    setCurrentQuestion('');
    setConversationHistory([]);
    setCurrentAnswer('');
    setTranscript('');
    setQuestionNumber(1);
    setFeedback(null);
    setShowEndModal(false);
    setTooFewAnswers(false);
  };

  const loadFeedbackHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error('Please login to view history');
        return;
      }

      setLoading(true);
      const feedbackRef = collection(db, 'users', user.uid, 'interview_feedback');
      const q = query(feedbackRef, orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      
      const history = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() });
      });
      
      setFeedbackHistory(history);
      setStage('history');
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const viewHistoricalFeedback = (historicalData) => {
    setFeedback(historicalData.feedback);
    setJobRole(historicalData.jobRole);
    setRound(historicalData.round);
    setStage('feedback');
  };

  // SETUP SCREEN
  if (stage === 'setup') {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Interview</h1>
              <p className="text-gray-600 mt-1">Personalized based on your resume & job description</p>
            </div>
            <button
              onClick={loadFeedbackHistory}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <History className="w-5 h-5" />
              View History
            </button>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700">
              <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
              <span>Upload</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-500">
              <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">2</span>
              <span>Configure</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-500">
              <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">3</span>
              <span>Interview</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-500">
              <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">4</span>
              <span>Results</span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Setup Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                {/* Resume Upload */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Resume</h2>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Drop your resume here or click to browse</p>
                    <p className="text-sm text-gray-500">PDF, DOC, DOCX (Max 5MB)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label
                      htmlFor="resume-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer mt-4"
                    >
                      <FileText className="w-4 h-4" />
                      Choose File
                    </label>
                  </div>
                  {resumeFileName && (
                    <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700">{resumeFileName}</span>
                    </div>
                  )}
                </div>

                {/* Job Details */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Role</label>
                      <input
                        type="text"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        placeholder="e.g. Software Engineer, Product Manager"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the job description here..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Interview Settings */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interview Round</label>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {['HR Round', 'Technical Round', 'Managerial Round', 'Final Round'].map((r) => (
                          <button
                            key={r}
                            onClick={() => setRound(r)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              round === r
                                ? 'bg-purple-100 text-purple-700 font-semibold'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interview Mode</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setMode('text')}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                            mode === 'text'
                              ? 'bg-purple-100 text-purple-700 font-semibold'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Keyboard className="w-4 h-4" />
                          Text Mode
                        </button>
                        <button
                          onClick={() => setMode('voice')}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                            mode === 'voice'
                              ? 'bg-purple-100 text-purple-700 font-semibold'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Mic className="w-4 h-4" />
                          Voice Mode
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={startInterview}
                  disabled={!resumeBase64 || !jobRole || loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Preparing Interview...' : 'Start Interview'}
                </button>
              </div>
            </div>

            {/* Right Column - Instructions & Tips */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  How it Works
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">1</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Upload Resume</div>
                      <div className="text-sm text-gray-600">AI analyzes your skills and experience</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">2</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Provide Job Details</div>
                      <div className="text-sm text-gray-600">Helps tailor questions to your target role</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-600">3</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">AI Interview</div>
                      <div className="text-sm text-gray-600">Get personalized questions and feedback</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-500" />
                  Pro Tips
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900">
                      💡 Be specific in your job description for better question matching
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      🎯 Choose the right interview round for relevant questions
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900">
                      📈 Use voice mode for more natural interview practice
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // INTERVIEW SCREEN
  if (stage === 'interviewing') {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Interview</h1>
              <p className="text-gray-600 mt-1">Question {questionNumber} • {round}</p>
            </div>
            <button
              onClick={resetInterview}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
              End Interview
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Interview Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                {/* AI Interviewer Card */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">AI Interviewer</div>
                    <div className="font-semibold text-gray-900">Personalized Interview</div>
                  </div>
                  <button
                    onClick={() => speakText(currentQuestion)}
                    className="ml-auto p-2 text-gray-600 hover:text-purple-600 transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Conversation History */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {conversationHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-lg px-4 py-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Answer Input */}
                <div className="border-t pt-4">
                  {mode === 'text' ? (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                        placeholder="Type your answer..."
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={submitAnswer}
                        disabled={!currentAnswer.trim() || isTyping}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      {isRecording ? (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <Mic className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-gray-900">Recording... Speak now</div>
                          <div className="text-sm text-gray-600">{transcript}</div>
                          <button
                            onClick={stopRecording}
                            className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            Stop Recording
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                            <Mic className="w-8 h-8 text-purple-600" />
                          </div>
                          <div className="text-gray-600">Click to start recording</div>
                          <button
                            onClick={startRecording}
                            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            Start Recording
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Tips & Progress */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Interview Tips
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      💡 Be specific and provide examples from your experience
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-900">
                      🎯 Relate your answers to the job requirements
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-900">
                      📈 Use the STAR method for behavioral questions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Your Progress</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Questions Answered</span>
                    <span className="text-sm font-semibold text-gray-900">{questionNumber - 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Interview Mode</span>
                    <span className="text-sm font-semibold text-gray-900 capitalize">{mode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Round</span>
                    <span className="text-sm font-semibold text-gray-900">{round}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // FEEDBACK SCREEN
  if (stage === 'feedback') {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
            <p className="text-gray-600 mt-1">Your performance analysis</p>
          </div>

          {isEvaluating ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
                <div className="text-gray-600">Analyzing your interview...</div>
              </div>
            </div>
          ) : feedback ? (
            <div className="space-y-8">
              {/* Placement Chance */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <div className="mb-6">
                  <div className="text-6xl font-bold gradient-text mb-2">
                    {feedback.placement_chance || feedback.placementChance || 0}%
                  </div>
                  <div className="text-gray-600">Placement Chance</div>
                </div>
                
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${
                  (feedback.placement_chance || feedback.placementChance || 0) >= 75 ? 'bg-green-100 text-green-700' :
                  (feedback.placement_chance || feedback.placementChance || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {feedback.verdict || 'Pending'}
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(feedback.scores || {}).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{value}/10</div>
                    <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>

              {/* Interviewer Notes */}
              {feedback.interviewer_notes && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-cyan-600" />
                    Interviewer Notes
                  </h3>
                  <p className="text-gray-700">{feedback.interviewer_notes}</p>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                {feedback.strengths && feedback.strengths.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Your Strengths
                    </h3>
                    <ul className="space-y-3">
                      {feedback.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Star className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {feedback.weaknesses && feedback.weaknesses.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Areas to Improve
                    </h3>
                    <ul className="space-y-3">
                      {feedback.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Target className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Improvement Roadmap */}
              {feedback.improvement_roadmap && feedback.improvement_roadmap.length > 0 && (
                <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl p-6 border border-cyan-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-cyan-600" />
                    Your Improvement Roadmap
                  </h3>
                  <div className="space-y-3">
                    {feedback.improvement_roadmap.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-4">
                        <div className="flex-shrink-0 w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-gray-700 text-sm flex-1">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Best & Worst Answers */}
              {(feedback.best_answer || feedback.worst_answer) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {feedback.best_answer && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
                      <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Best Answer
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 font-medium">{feedback.best_answer.question}</p>
                      <p className="text-sm text-gray-700">{feedback.best_answer.why}</p>
                    </div>
                  )}
                  {feedback.worst_answer && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
                      <h3 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Needs Improvement
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 font-medium">{feedback.worst_answer.question}</p>
                      <p className="text-sm text-gray-700">{feedback.worst_answer.why}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={resetInterview}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Try Another Interview
                </button>
                <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Share Results
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </AppShell>
    );
  }

  // HISTORY SCREEN
  if (stage === 'history') {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
              <p className="text-gray-600 mt-1">View your previous interview feedback</p>
            </div>
            <button
              onClick={() => setStage('setup')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Setup
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-4"></div>
                <div className="text-gray-600">Loading history...</div>
              </div>
            </div>
          ) : feedbackHistory.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Interview History</h3>
              <p className="text-gray-600 mb-6">Complete your first interview to see feedback here</p>
              <button
                onClick={() => setStage('setup')}
                className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Start Interview
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbackHistory.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => viewHistoricalFeedback(item)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.jobRole}</h3>
                      <p className="text-sm text-gray-600">{item.round}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold gradient-text">
                        {item.feedback?.placement_chance || item.feedback?.placementChance || 0}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(item.feedback?.scores || {}).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-sm font-semibold text-gray-900">{value}/10</div>
                        <div className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      (item.feedback?.placement_chance || item.feedback?.placementChance || 0) >= 75 ? 'bg-green-100 text-green-700' :
                      (item.feedback?.placement_chance || item.feedback?.placementChance || 0) >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.feedback?.verdict}
                    </span>
                    <span className="text-sm text-cyan-600 font-medium">Click to view details →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return null;
}
