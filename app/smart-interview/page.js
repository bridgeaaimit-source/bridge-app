"use client";
import { useState, useRef, useEffect } from "react";

export const dynamic = "force-dynamic";
import { ChevronLeft, Brain, Mic, Keyboard, Upload, FileText, Send, CheckCircle, AlertCircle, TrendingUp, Award, Target, MessageSquare, X, Play, Pause, Volume2, Lightbulb, Star, History, Download, DownloadCloud, Book } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import { useAssemblyAI as useDeepgramTranscription } from "@/hooks/useAssemblyAI";

// Build clean [{question, answer}] pairs from conversationHistory array (moved outside to fix prerender hoisting)
const buildHistory = (history) => {
  const pairs = [];
  for (let i = 0; i < history.length - 1; i += 2) {
    const q = history[i];
    const a = history[i + 1];
    if (q?.role === 'interviewer' && a?.role === 'user' && q.message && a.message) {
      pairs.push({ question: q.message, answer: a.message });
    }
  }
  return pairs;
};

export default function SmartInterviewPage() {
  const router = useRouter();
  const [stage, setStage] = useState('setup'); // 'setup' | 'interviewing' | 'feedback' | 'history'
  const [resumeBase64, setResumeBase64] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [round, setRound] = useState('HR Round');
  const [mode, setMode] = useState('text'); // 'text' | 'voice' | 'video'
  
  const { isBypassed, mockUserData } = useAuthBypass();
  
  // Interview state
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVideoSupported, setIsVideoSupported] = useState(true);
  const [videoStream, setVideoStream] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState('');
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(120);
  const [recordingState, setRecordingState] = useState('idle'); // idle | recording | recorded
  const [isVideoRecording, setIsVideoRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const videoChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [tooFewAnswers, setTooFewAnswers] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [interviewerThought, setInterviewerThought] = useState('');
  const [startError, setStartError] = useState('');

  // Voice command handler — say "finish interview" to end early (temporarily disabled to fix prerender)
  const handleVoiceCommand = (command) => {
    // Voice command feature temporarily disabled
  };

  // Use Deepgram transcription hook with voice command support
  // Temporarily disabled entirely to isolate prerender error
  const {
    isRecording: isRecording = false,
    isConnecting: isConnecting = false,
    transcript: transcript = '',
    interimTranscript: interimTranscript = '',
    fullTranscript: fullTranscript = '',
    wordCount: wordCount = 0,
    fillerWords: fillerWords = [],
    fillerWordCounts: fillerWordCounts = {},
    recordingStatus: recordingStatus = 'idle',
    error: transcriptionError = null,
    speechLang: speechLang = 'en-IN',
    setLang: setLang = () => {},
    voiceCommandDetected: voiceCommandDetected = null,
    resetVoiceCommand: resetVoiceCommand = () => {},
    startRecording: startDeepgramRecording = () => {},
    stopRecording: stopDeepgramRecording = () => {},
    clearTranscript: clearTranscript = () => {},
    exportTranscript: exportTranscript = () => {},
  } = {};

  // submitAnswer uses fullTranscript in video mode too
  const videoTranscript = fullTranscript || interimTranscript;
  
  const fileInputRef = useRef(null);

  // Check browser support for speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      setIsVideoSupported(false);
    }

    // Load voices for TTS
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    // Restore setup state after device-test redirect
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('bridge_interview_setup');
      if (saved) {
        try {
          const s = JSON.parse(saved);
          if (s.jobRole) setJobRole(s.jobRole);
          if (s.jobDescription) setJobDescription(s.jobDescription);
          if (s.round) setRound(s.round);
          if (s.mode) setMode(s.mode);
          if (s.resumeBase64) setResumeBase64(s.resumeBase64);
          if (s.resumeFileName) setResumeFileName(s.resumeFileName);
          sessionStorage.removeItem('bridge_interview_setup');
        } catch (e) {
          console.warn('Failed to restore interview setup:', e);
        }
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (videoStream) {
        videoStream.getTracks().forEach((track) => track.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [videoStream, recordedVideoUrl]);

  const currentAudioRef = useRef(null);

  const speakTextFallback = (text) => {
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

  const speakText = async (text) => {
    if (!text) return;

    // Stop any current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('ElevenLabs TTS unavailable');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        speakTextFallback(text);
      };

      await audio.play();
    } catch (err) {
      console.warn('ElevenLabs TTS failed, using browser fallback:', err.message);
      speakTextFallback(text);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const toastId = toast.loading('Reading your resume...');
    try {
      const base64 = await fileToBase64(file);
      setResumeBase64(base64);
      setResumeFileName(file.name);

      const fileExt = file.type === 'application/pdf' ? 'pdf'
        : file.type.includes('wordprocessingml') ? 'docx' : 'doc';

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_base64: base64, file_type: fileExt, file_name: file.name, userId: auth.currentUser?.uid }),
      });
      const data = await res.json();
      if (res.ok && data.resumeText) {
        setResumeText(data.resumeText);
      } else {
        setResumeText(`Resume: ${file.name}`);
      }

      toast.success('Resume read successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to read resume. Please try a PDF file.', { id: toastId });
      console.error('Resume upload error:', error);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        if (!base64) reject(new Error('Empty base64'));
        else resolve(base64);
      };
      reader.onerror = reject;
    });
  };

  const startRecording = () => {
    clearTranscript();
    startDeepgramRecording();
  };

  const stopRecording = () => {
    stopDeepgramRecording();
  };

  const stopVideoStream = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
  };

  const stopVideoRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const startVideoRecording = async () => {
    if (!isVideoSupported) {
      toast.error('Video recording is not supported in this browser');
      return;
    }

    try {
      clearTranscript();
      setRecordedVideoUrl("");
      setRecordingState('recording');
      setRecordingTimeLeft(120);
      setIsVideoRecording(true);

      // Get video+audio stream — fall back to audio-only if camera unavailable
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (streamErr) {
        if (streamErr.name === 'NotFoundError' || streamErr.name === 'NotReadableError') {
          // Try audio only if camera is the problem
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          toast('Camera not found — recording audio only', { icon: '🎙️' });
        } else {
          throw streamErr;
        }
      }

      // Start Deepgram transcription with the existing stream
      // Now uses AudioContext to avoid MediaRecorder conflicts
      startDeepgramRecording(stream);

      setVideoStream(stream);
      videoChunksRef.current = [];

      const preferredMime =
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported &&
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm";

      const recorder = new MediaRecorder(
        stream,
        preferredMime ? { mimeType: preferredMime } : undefined
      );
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setRecordingState('recorded');
        setIsVideoRecording(false);
        stopVideoStream();
        stopDeepgramRecording();
      };

      recorder.start();

      recordingTimerRef.current = setInterval(() => {
        setRecordingTimeLeft((prev) => {
          if (prev <= 1) {
            stopVideoRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Video recording error:", error);
      setIsVideoRecording(false);
      setRecordingState('idle');
      toast.error("Could not access camera/microphone. Please allow permissions.");
    }
  };

  const formatTime = (seconds) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const startInterview = async () => {
    if (!resumeBase64 || !jobRole) {
      toast.error('Please upload resume and enter job role');
      return;
    }

    // Gate through device test unless already done this session or permanently skipped
    if (typeof window !== 'undefined' && (mode === 'voice' || mode === 'video')) {
      const permanentSkip = localStorage.getItem('bridge_skip_device_test') === 'true';
      const sessionDone  = sessionStorage.getItem('bridge_device_test_done') === 'true';
      if (!permanentSkip && !sessionDone) {
        // Save current setup so it's restored when we come back
        sessionStorage.setItem('bridge_interview_setup', JSON.stringify({
          jobRole, jobDescription, round, mode, resumeBase64, resumeFileName
        }));
        router.push(`/device-test?next=${encodeURIComponent('/smart-interview')}`);
        return;
      }
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
          user_id: auth.currentUser?.uid,
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
      setInterviewerThought(data.interviewer_thought || '');
      setConversationHistory([
        { role: 'interviewer', message: data.question }
      ]);
      setStage('interviewing');
      setQuestionNumber(1);
      setStartError('');

      if (autoSpeak) {
        speakText(data.question);
      }

    } catch (error) {
      console.error('Interview start error:', error);
      setStartError(error.message || 'Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClarification = () => {
    const clarification = window.prompt('What would you like clarified about this question?');
    if (!clarification) return;
    submitAnswer(`[Clarification needed]: ${clarification}`, false);
  };

  const submitAnswer = async (overrideAnswer, shouldFinish = false) => {
    const answer =
      typeof overrideAnswer === "string"
        ? overrideAnswer
        : mode === 'voice'
          ? fullTranscript
          : currentAnswer;
    
    console.log('submitAnswer called:', { answer, shouldFinish, mode, currentQuestion });

    if (!answer.trim() && !shouldFinish) {
      toast.error('Please provide an answer');
      return;
    }

    setIsTyping(true);
    
    // Build clean history from existing conversation
    const formattedHistory = buildHistory(conversationHistory);
    console.log('Formatted history from conversationHistory:', formattedHistory);
    
    // Append current answer if present
    const newHistory = answer.trim()
      ? [...formattedHistory, { question: currentQuestion, answer }]
      : formattedHistory;
    
    console.log('Final history to send:', newHistory);
      
    if (answer.trim()) {
      setConversationHistory(prev => [
        ...prev,
        { role: 'interviewer', message: currentQuestion },
        { role: 'user', message: answer }
      ]);
    }

    // Voice command or manual finish — end immediately
    if (shouldFinish) {
      setIsTyping(false);
      setCurrentAnswer('');
      clearTranscript();
      console.log('shouldFinish=true, newHistory.length:', newHistory.length);
      if (newHistory.length === 0) {
        toast.error('Please answer at least one question before finishing.');
        return;
      }
      toast.success('Interview finished! Generating feedback...');
      await getFeedback(newHistory);
      return;
    }

    // Hard limit: End interview after 10 questions
    if (questionNumber >= 10) {
      setIsTyping(false);
      setCurrentAnswer('');
      clearTranscript();
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
          user_id: auth.currentUser?.uid,
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
        setInterviewerThought(data.interviewer_thought || '');
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
      clearTranscript();
      if (mode === 'video') {
        setRecordedVideoUrl('');
        setRecordingState('idle');
        setRecordingTimeLeft(120);
      }
    }
  };

  const getFeedback = async (formattedHistory) => {
    setIsEvaluating(true);

    // formattedHistory is already in the correct format: [{question, answer}, ...]
    console.log('getFeedback called with history:', formattedHistory);
    console.log('resumeBase64 length:', resumeBase64?.length);
    console.log('jobRole:', jobRole, 'round:', round);

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
          user_id: auth.currentUser?.uid,
        }),
      });

      console.log('API response status:', response.status);

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
        // Use mock user if bypass is enabled
        const user = isBypassed ? { uid: 'test-user-123' } : auth.currentUser;
        
        if (user) {
          console.log('🔄 Starting feedback save process...');
          
          // Save interview feedback
          await addDoc(collection(db, 'users', user.uid, 'interview_feedback'), {
            jobRole,
            round,
            feedback: data,
            conversationHistory: conversationHistory,
            timestamp: new Date().toISOString(),
            createdAt: Date.now()
          });
          console.log('✅ Feedback saved to history');
          
          // Update user stats (interviewsDone, avgScore, bridgeScore)
          if (!isBypassed) {
            console.log('📈 Starting user stats update...');
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              console.log('📈 Smart Interview - Current user data before update:', userData);
              const newInterviewsDone = (userData.interviewsDone || 0) + 1;
              const overallScore = data.overall_score || 5;
              const newAvgScore = ((userData.avgScore || 0) * (userData.interviewsDone || 0) + overallScore) / newInterviewsDone;
              const newBridgeScore = Math.min(1000, (userData.bridgeScore || 500) + (overallScore * 10));
              
              const updateData = {
                interviewsDone: newInterviewsDone,
                avgScore: Math.round(newAvgScore * 10) / 10, // Round to 1 decimal
                bridgeScore: newBridgeScore,
                streak: (userData.streak || 0) + 1,
                updatedAt: new Date().toISOString()
              };
              
              console.log('📈 Smart Interview - Updating user stats with:', updateData);
              
              await updateDoc(userRef, updateData);
              
              console.log('✅ User stats updated:', {
                interviewsDone: newInterviewsDone,
                avgScore: newAvgScore,
                bridgeScore: newBridgeScore
              });
            } else {
              console.log('❌ Smart Interview - No user document found, creating new one...');
              // Create user document if it doesn't exist
              await setDoc(userRef, {
                interviewsDone: 1,
                avgScore: data.overall_score || 5,
                bridgeScore: (data.overall_score || 5) * 10,
                streak: 1,
                updatedAt: new Date().toISOString()
              });
              console.log('✅ Created new user document with stats');
            }
          } else {
            console.log('🔓 Bypass mode - skipping Firestore stats update');
          }
        }
      } catch (saveError) {
        console.error('❌ Error saving feedback/updating stats:', saveError);
        toast.error('Failed to save interview results');
        // Don't show error to user, just log it
      }
      
    } catch (error) {
      console.error('Feedback error:', error);
      // Still show feedback screen with an error state rather than leaving user stuck
      setFeedback({
        error: true,
        overall_score: 0,
        placement_chance: 'Unable to evaluate',
        verdict: 'Feedback generation failed. Please try again.',
        scores: {},
        strengths: [],
        improvements: ['Try again with a more stable network connection.'],
        summary: error.message || 'Failed to generate feedback.'
      });
      setStage('feedback');
      toast.error('Could not generate full feedback. Showing partial results.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetInterview = () => {
    setStage('setup');
    setCurrentQuestion('');
    setConversationHistory([]);
    setCurrentAnswer('');
    clearTranscript();
    setQuestionNumber(1);
    setFeedback(null);
    setShowEndModal(false);
    setTooFewAnswers(false);
  };

  const loadFeedbackHistory = async () => {
    try {
      // Use mock user if bypass is enabled
      const user = isBypassed ? { uid: 'test-user-123' } : auth.currentUser;
      
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
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>Smart Interview</h1>
              <p className="text-gray-500 mt-1 text-sm">Personalised to your resume & target role</p>
            </div>
            <button onClick={loadFeedbackHistory}
              className="self-start sm:self-auto flex items-center gap-2 bg-[#CCFBF1] text-[#0D9488] px-5 py-2 rounded-full font-semibold text-sm hover:bg-[#99F6E4] transition-colors">
              <History className="w-4 h-4" /> View History
            </button>
          </div>

          {/* Progress Steps */}
          <div className="relative flex items-center justify-between mb-12 px-2">
            <div className="absolute left-0 right-0 top-5 h-2 bg-[#CCFBF1] rounded-full z-0" />
            <div className="absolute left-0 top-5 h-2 bg-[#0D9488] rounded-full z-0" style={{width:'12.5%'}} />
            {[{n:1,label:'Upload'},{n:2,label:'Configure'},{n:3,label:'Interview'},{n:4,label:'Results'}].map(({n,label},i) => (
              <div key={n} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                  n === 1 ? 'bg-[#0D9488] text-white' : 'bg-[#CCFBF1] text-[#0D9488]'
                }`}>{n}</div>
                <span className={`text-xs font-semibold ${n===1?'text-[#0D9488]':'text-gray-400'}`}>{label}</span>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left 2/3 — Form */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Base Material Card */}
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100 overflow-hidden">
                <div className="bg-[#CCFBF1] px-6 py-4">
                  <h2 className="font-bold text-[#0D9488] flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                    <Upload className="w-5 h-5" /> Base Material
                  </h2>
                </div>
                <div className="p-6">
                  <label htmlFor="resume-upload" className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                    resumeFileName ? 'border-[#0D9488] bg-[#F0FDFA]' : 'border-[#CCFBF1] hover:border-[#0D9488] bg-[#F0FDFA]/50'
                  }`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${
                      resumeFileName ? 'bg-[#0D9488] text-white' : 'bg-[#CCFBF1] text-[#0D9488] group-hover:bg-[#0D9488] group-hover:text-white'
                    }`}>
                      {resumeFileName ? <CheckCircle className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                    </div>
                    {resumeFileName ? (
                      <>
                        <p className="font-bold text-[#0D9488] text-sm">{resumeFileName}</p>
                        <p className="text-xs text-gray-400 mt-1">Click to replace</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-gray-700 mb-1">Upload your Resume</p>
                        <p className="text-sm text-gray-400 max-w-xs">Drag & drop your PDF or DOCX here, or click to browse. We'll tailor questions to your experience.</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" id="resume-upload" />
                  </label>
                </div>
              </div>

              {/* Interview Parameters Card */}
              <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100 overflow-hidden">
                <div className="bg-[#CCFBF1] px-6 py-4">
                  <h2 className="font-bold text-[#0D9488] flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                    <FileText className="w-5 h-5" /> Interview Parameters
                  </h2>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Target Role</label>
                      <input type="text" value={jobRole} onChange={(e) => setJobRole(e.target.value)}
                        placeholder="e.g. Software Engineer"
                        className="w-full bg-gray-50 border-2 border-[#CCFBF1] focus:border-[#0D9488] rounded-xl px-4 py-3 outline-none text-gray-800 text-sm transition-colors placeholder:text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Job Description (Optional)</label>
                      <input type="text" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste JD URL or text snippet"
                        className="w-full bg-gray-50 border-2 border-[#CCFBF1] focus:border-[#0D9488] rounded-xl px-4 py-3 outline-none text-gray-800 text-sm transition-colors placeholder:text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Select Round Type</label>
                    <div className="flex flex-wrap gap-2">
                      {['HR Round','Technical Round','Managerial Round','Final Round'].map((r) => (
                        <button key={r} onClick={() => setRound(r)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                            round === r ? 'bg-[#0D9488] text-white' : 'bg-[#CCFBF1] text-[#0D9488] hover:bg-[#99F6E4]'
                          }`}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Practice Mode</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[{m:'text',Icon:Keyboard,label:'Text'},{m:'voice',Icon:Mic,label:'Voice'},{m:'video',Icon:Play,label:'Video'}].map(({m,Icon,label}) => (
                        <button key={m} onClick={() => setMode(m)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                            mode === m ? 'border-[#0D9488] bg-[#F0FDFA] text-[#0D9488]' : 'border-[#CCFBF1] text-gray-400 hover:border-[#0D9488]/40'
                          }`}>
                          <Icon className="w-6 h-6" />
                          <span className="text-xs font-bold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Expect + CTA */}
              <div className="bg-[#F0FDFA] rounded-2xl p-6 border border-[#CCFBF1]">
                <p className="font-bold text-[#0D9488] mb-3 flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" /> What to expect
                </p>
                <ul className="text-xs text-gray-600 space-y-1.5 mb-6">
                  <li>• AI reads your resume and asks 8–10 personalised questions</li>
                  <li>• You can ask for clarification at any time</li>
                  <li>• Detailed feedback and score provided after completion</li>
                  <li>• Takes about 15–20 minutes</li>
                </ul>
                {startError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-600 text-sm">❌ {startError}</p>
                  </div>
                )}
                <button onClick={startInterview} disabled={!resumeBase64 || !jobRole || loading}
                  className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-4 rounded-2xl font-bold text-base hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Preparing Interview…</> : <>Start Practice Interview <FileText className="w-4 h-4" /></>}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">🔒 Safe practice session — nothing is recorded or shared</p>
              </div>
            </div>

            {/* Right 1/3 — Tips */}
            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100">
                <h3 className="font-bold text-[#0D9488] mb-4 flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                  <Lightbulb className="w-5 h-5" /> Pro Tips
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    {title:'Use the STAR Method', body:'Structure behavioral answers with Situation, Task, Action, Result for maximum clarity.'},
                    {title:'Check Your Lighting', body:'For video mode, ensure you are well-lit and in a quiet environment.'},
                    {title:'Be Specific', body:'Paste the actual JD text for hyper-personalised questions matching the role.'},
                  ].map(({title,body}) => (
                    <div key={title} className="p-4 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1]">
                      <p className="font-bold text-gray-800 text-sm mb-1">{title}</p>
                      <p className="text-xs text-gray-500">{body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100">
                <h3 className="font-bold text-[#0D9488] mb-4 flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                  <Star className="w-5 h-5" /> Sample Questions
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    {q:'"Tell me about a time you faced a significant technical challenge and how you overcame it."', tag:'Behavioral'},
                    {q:'"How would you design a rate limiter for a high-traffic API?"', tag:'System Design'},
                  ].map(({q,tag}) => (
                    <div key={tag} className="p-4 border-l-4 border-[#0D9488] bg-gray-50 rounded-r-xl">
                      <p className="text-sm text-gray-700 font-medium mb-2">{q}</p>
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                    </div>
                  ))}
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
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Recording</span>
              </div>
              <div className="flex items-center gap-2 bg-[#CCFBF1] px-3 py-1.5 rounded-full">
                <span className="text-xs font-bold text-[#0D9488]">Question {questionNumber}</span>
                <span className="text-xs text-gray-400">• {round}</span>
              </div>
            </div>
            <button
              onClick={() => {
                const hasCurrentAnswer = fullTranscript || interimTranscript || currentAnswer;
                const hasHistory = conversationHistory.length > 0;
                if (hasHistory || hasCurrentAnswer) {
                  stopDeepgramRecording();
                  submitAnswer(fullTranscript || interimTranscript || currentAnswer, true);
                } else {
                  resetInterview();
                }
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow hover:opacity-90 transition-opacity"
            >
              <X className="w-4 h-4" />
              {conversationHistory.length > 0 || fullTranscript || currentAnswer ? 'Finish & Get Feedback' : 'End Interview'}
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Interview Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                {/* Interviewer Thought Context */}
                {interviewerThought && (
                  <div className="bg-[#F0FDFA] border border-[#0D9488]/20 rounded-xl p-3 mb-3">
                    <p className="text-xs text-[#8888A0] mb-1">💭 Why this question:</p>
                    <p className="text-xs text-[#44445A]">{interviewerThought}</p>
                  </div>
                )}

                {/* AI Interviewer Card */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#F0FDFA] rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-[#0D9488]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">AI Interviewer</div>
                    <div className="font-semibold text-gray-900">Personalized Interview</div>
                  </div>
                  <button
                    onClick={() => speakText(currentQuestion)}
                    className="ml-auto p-2 text-gray-600 hover:text-[#14B8A6] transition-colors"
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
                            ? 'bg-[#0D9488] text-white'
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
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && submitAnswer()}
                          placeholder="Type your answer..."
                          className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent"
                        />
                        <button
                          onClick={submitAnswer}
                          disabled={!currentAnswer.trim() || isTyping}
                          className="px-6 py-3 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition-colors disabled:opacity-50"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={handleClarification}
                        disabled={isTyping}
                        className="text-xs text-[#0D9488] underline"
                      >
                        🤔 Ask for clarification on this question
                      </button>
                      {conversationHistory.length > 0 && (
                        <button
                          onClick={() => submitAnswer(currentAnswer, true)}
                          disabled={isTyping || isEvaluating}
                          className="w-full py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          Finish Interview &amp; Get Feedback
                        </button>
                      )}
                    </div>
                  ) : mode === 'voice' ? (
                    <div className="space-y-4">
                      {/* Language selector */}
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-gray-500">Language:</span>
                        {[{code:'en-IN',label:'🇮🇳 India'},{code:'en-GB',label:'🇬🇧 UK'},{code:'en-US',label:'🇺🇸 US'}].map(l => (
                          <button key={l.code} onClick={() => setLang(l.code)}
                            className={`text-xs px-2 py-1 rounded-full border transition-all ${
                              speechLang === l.code ? 'bg-[#0D9488] text-white border-[#0D9488]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0D9488]'
                            }`}>{l.label}</button>
                        ))}
                      </div>

                      {/* Recording state */}
                      {isConnecting ? (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center animate-pulse">
                            <Mic className="w-7 h-7 text-yellow-600" />
                          </div>
                          <p className="text-sm text-gray-600">Starting microphone...</p>
                        </div>
                      ) : isRecording ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                              <span className="text-sm font-semibold text-red-700">Recording — speak your answer</span>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span><span className="font-bold text-[#0D9488]">{wordCount}</span> words</span>
                              {fillerWords.length > 0 && <span><span className="font-bold text-orange-500">{fillerWords.length}</span> fillers</span>}
                            </div>
                          </div>

                          {/* Voice command detected banner */}
                          {voiceCommandDetected === 'finish' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
                              <span className="text-amber-600 font-semibold">Voice command detected:</span>
                              <span className="text-amber-800">"Finish interview" — wrapping up...</span>
                            </div>
                          )}

                          {/* Live transcript box */}
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 min-h-[80px] text-left">
                            {(fullTranscript || interimTranscript) ? (
                              <p className="text-sm text-gray-800 leading-relaxed">
                                <span className="text-gray-900">{transcript}</span>
                                {interimTranscript && <span className="text-gray-400 italic"> {interimTranscript}</span>}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-400 italic animate-pulse">Listening... speak now (say "finish interview" anytime to end)</p>
                            )}
                          </div>

                          {/* Filler words */}
                          {Object.keys(fillerWordCounts).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              <span className="text-xs text-gray-400">Fillers:</span>
                              {Object.entries(fillerWordCounts).map(([word, count]) => (
                                <span key={word} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{word} ×{count}</span>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-3 pt-1">
                            <button onClick={stopDeepgramRecording}
                              className="flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                              <span className="w-3 h-3 bg-white rounded-full"></span> Stop Recording
                            </button>
                            {fullTranscript && (
                              <button onClick={() => {
                                const captured = fullTranscript || interimTranscript;
                                stopDeepgramRecording();
                                setTimeout(() => submitAnswer(captured), 50);
                              }}
                                className="flex-1 bg-[#0D9488] text-white py-3 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors">
                                Stop & Submit →
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Transcript persists here after stop */}
                          {fullTranscript && (
                            <div className="bg-[#F0FDFA] border border-teal-200 rounded-xl p-4">
                              <p className="text-xs font-semibold text-teal-700 mb-1">Your answer (ready to submit):</p>
                              <p className="text-sm text-gray-800 leading-relaxed">{fullTranscript}</p>
                            </div>
                          )}

                          {transcriptionError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{transcriptionError}</div>
                          )}

                          <div className="flex gap-3">
                            <button
                              onClick={() => { clearTranscript(); startDeepgramRecording(); }}
                              disabled={isConnecting}
                              className="flex-1 bg-[#0D9488] text-white py-3 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                              <Mic className="w-4 h-4" />
                              {fullTranscript ? 'Re-record' : 'Start Recording'}
                            </button>
                            <button
                              onClick={() => submitAnswer(fullTranscript)}
                              disabled={!fullTranscript || isTyping}
                              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                              Submit Answer →
                            </button>
                          </div>

                          {!fullTranscript && (
                            <p className="text-center text-xs text-gray-400">Press Start Recording, speak your answer, then Stop &amp; Submit</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                          {videoStream ? (
                            <video
                              autoPlay
                              muted
                              playsInline
                              ref={(node) => {
                                if (node && videoStream) {
                                  node.srcObject = videoStream;
                                }
                              }}
                              className="h-full w-full object-cover"
                            />
                          ) : recordedVideoUrl ? (
                            <video controls src={recordedVideoUrl} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-sm text-gray-300">
                              Camera preview will appear here
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-sm">
                        <span className="font-medium text-gray-700 flex items-center gap-2">
                          {isVideoRecording && <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"/>}
                          {isVideoRecording ? 'Recording...' : recordingState === 'recorded' ? 'Recorded' : 'Ready to record'}
                        </span>
                        <span className="font-bold text-[#0D9488]">{formatTime(recordingTimeLeft)}</span>
                      </div>

                      {/* Live transcript during recording */}
                      {isVideoRecording && (
                        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-xs font-semibold text-gray-500">Live Transcript <span className="font-normal text-gray-400">(say "finish interview" to end)</span></span>
                            <div className="flex gap-4 text-xs">
                              <span className="text-[#0D9488] font-bold">{wordCount} words</span>
                              {Object.keys(fillerWordCounts).length > 0 && (
                                <span className="text-orange-500 font-bold">{fillerWords.length} fillers</span>
                              )}
                            </div>
                          </div>
                          {voiceCommandDetected === 'finish' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800 font-medium">
                              Voice command detected: finishing interview...
                            </div>
                          )}
                          <div className="text-gray-700 min-h-[40px]">
                            <span className="text-gray-900">{transcript}</span>
                            {interimTranscript && <span className="text-gray-400 italic"> {interimTranscript}</span>}
                            {!transcript && !interimTranscript && <span className="text-gray-400 italic">Listening... speak now</span>}
                          </div>
                          {Object.keys(fillerWordCounts).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(fillerWordCounts).map(([word, count]) => (
                                <span key={word} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{word} ×{count}</span>
                              ))}
                            </div>
                          )}
                          {/* Finish early during video */}
                          <button
                            onClick={() => { stopVideoRecording(); setTimeout(() => submitAnswer(fullTranscript || interimTranscript, true), 300); }}
                            className="w-full mt-1 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors">
                            Finish Interview &amp; Get Feedback
                          </button>
                        </div>
                      )}

                      {!isVideoRecording && fullTranscript && (
                        <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">Transcript: </span>
                          {fullTranscript}
                          {Object.keys(fillerWordCounts).length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs text-gray-500 mb-1">Filler words:</div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(fillerWordCounts).map(([word, count]) => (
                                  <span key={word} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                    {word} ({count})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}


                      <div className="flex flex-wrap gap-2">
                        {!isVideoRecording && (
                          <button
                            onClick={startVideoRecording}
                            className="rounded-lg bg-[#0D9488] px-4 py-2 text-white hover:bg-[#0F766E] transition-colors"
                          >
                            Start Video Recording
                          </button>
                        )}
                        {isVideoRecording && (
                          <button
                            onClick={stopVideoRecording}
                            className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600 transition-colors"
                          >
                            Stop Recording
                          </button>
                        )}
                        {recordingState === 'recorded' && (
                          <>
                            <button
                              onClick={() => {
                                stopVideoStream();
                                stopDeepgramRecording();
                                setRecordedVideoUrl('');
                                setRecordingState('idle');
                                clearTranscript();
                                setRecordingTimeLeft(120);
                              }}
                              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              Retake
                            </button>
                            <button
                              onClick={() => submitAnswer(videoTranscript || '[Video answer submitted]')}
                              disabled={isTyping}
                              className="rounded-lg bg-[#0D9488] px-4 py-2 text-white hover:bg-[#0F766E] transition-colors disabled:opacity-50"
                            >
                              Submit Answer →
                            </button>
                            <button
                              onClick={() => submitAnswer(videoTranscript || '[Video answer submitted]', true)}
                              disabled={isTyping || isEvaluating}
                              className="rounded-lg border border-red-200 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              Finish &amp; Get Feedback
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-5">
              {/* Progress */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100">
                <h3 className="font-bold text-[#0D9488] mb-4 text-sm flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                  <TrendingUp className="w-4 h-4" /> Progress
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Questions done</span>
                    <span className="text-sm font-bold text-[#0D9488]">{questionNumber - 1}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-[#0D9488] h-1.5 rounded-full transition-all" style={{width:`${Math.min(((questionNumber-1)/10)*100,100)}%`}} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Mode</span>
                    <span className="text-xs font-bold capitalize bg-[#CCFBF1] text-[#0D9488] px-2 py-0.5 rounded-full">{mode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Round</span>
                    <span className="text-xs font-semibold text-gray-700">{round}</span>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100">
                <h3 className="font-bold text-[#0D9488] mb-4 text-sm flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                  <Lightbulb className="w-4 h-4" /> Live Tips
                </h3>
                <div className="flex flex-col gap-2">
                  {['Be specific — use examples','Use STAR method for behavioural Qs','Relate answers to the job role'].map((tip,i) => (
                    <div key={i} className="p-3 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1]">
                      <p className="text-xs text-[#0F766E] leading-snug">{tip}</p>
                    </div>
                  ))}
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
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-10">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>Performance Report</h1>
              <p className="text-gray-500 mt-1 text-sm">{jobRole} · {round}</p>
            </div>
            <button onClick={resetInterview}
              className="flex items-center gap-2 bg-[#CCFBF1] text-[#0D9488] px-5 py-2 rounded-full font-semibold text-sm hover:bg-[#99F6E4] transition-colors">
              <Mic className="w-4 h-4" /> New Interview
            </button>
          </div>

          {isEvaluating ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488]/30 border-t-[#0D9488] mx-auto mb-4"></div>
                <div className="text-gray-600">Analyzing your interview...</div>
              </div>
            </div>
          ) : feedback ? (
            <div className="space-y-8">
              {/* Placement Chance Banner */}
              {(() => {
                const chance = feedback.placement_chance || feedback.placementChance || 0;
                const isHigh = chance >= 75;
                const isMid = chance >= 50;
                return (
                  <div className={`rounded-2xl p-8 text-center overflow-hidden relative ${
                    isHigh ? 'bg-gradient-to-r from-[#0D9488] to-[#14B8A6]' :
                    isMid  ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                             'bg-gradient-to-r from-red-500 to-rose-400'
                  }`}>
                    <p className="text-white/70 uppercase tracking-widest text-xs font-bold mb-2">Placement Chance</p>
                    <p className="text-7xl font-bold text-white mb-3" style={{fontFamily:'Syne,sans-serif'}}>{chance}%</p>
                    <span className="inline-flex items-center bg-white/20 text-white px-5 py-2 rounded-full text-sm font-bold">
                      {feedback.verdict || 'Pending'}
                    </span>
                  </div>
                );
              })()}

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(feedback.scores || {}).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(13,148,136,0.06)] border border-gray-100">
                    <p className="text-xs text-gray-400 capitalize mb-2">{key.replace(/_/g, ' ')}</p>
                    <p className="text-2xl font-bold text-[#0D9488] mb-2" style={{fontFamily:'Syne,sans-serif'}}>{value}<span className="text-sm text-gray-400">/10</span></p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#0D9488] h-1.5 rounded-full" style={{width:`${Math.min(value*10,100)}%`}} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {feedback.summary && (
                <div className="bg-gradient-to-r from-[#0D9488] to-[#0F766E] rounded-2xl p-8 text-white">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Performance Summary
                  </h3>
                  <p className="text-[#CCFBF1] mb-4">{feedback.summary.key_takeaways}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {feedback.summary.strengths && (
                      <div>
                        <div className="text-sm font-semibold mb-2 text-[#CCFBF1]">Strengths</div>
                        <ul className="space-y-1">
                          {feedback.summary.strengths.map((s, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <CheckCircle className="w-3 h-3" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.summary.weaknesses && (
                      <div>
                        <div className="text-sm font-semibold mb-2 text-[#CCFBF1]">Areas to Improve</div>
                        <ul className="space-y-1">
                          {feedback.summary.weaknesses.map((w, i) => (
                            <li key={i} className="text-sm flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Score Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(feedback.scores || {}).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">{value}/10</div>
                    <div className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>

              {/* Question-by-Question Analysis */}
              {feedback.question_analysis && feedback.question_analysis.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-[#0D9488]" />
                    Question-by-Question Analysis
                  </h3>
                  <div className="space-y-4">
                    {feedback.question_analysis.map((qa, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[#0D9488] mb-1">Q{qa.question_number}</div>
                            <div className="text-sm text-gray-700 font-medium">{qa.question}</div>
                          </div>
                          <div className="text-lg font-bold text-[#0D9488]">{qa.score}/10</div>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">{qa.answer_quality}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {qa.what_did_well && qa.what_did_well.length > 0 && (
                            <div className="bg-green-50 rounded-lg p-3">
                              <div className="text-xs font-semibold text-green-700 mb-1">What You Did Well</div>
                              <ul className="space-y-1">
                                {qa.what_did_well.map((item, i) => (
                                  <li key={i} className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {qa.what_to_improve && qa.what_to_improve.length > 0 && (
                            <div className="bg-orange-50 rounded-lg p-3">
                              <div className="text-xs font-semibold text-orange-700 mb-1">What to Improve</div>
                              <ul className="space-y-1">
                                {qa.what_to_improve.map((item, i) => (
                                  <li key={i} className="text-xs text-orange-600 flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Feedback */}
              {feedback.actionable_feedback && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#0D9488]" />
                    Actionable Next Steps
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {feedback.actionable_feedback.immediate_steps && (
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-3">Immediate Steps</div>
                        <ul className="space-y-2">
                          {feedback.actionable_feedback.immediate_steps.map((step, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <div className="w-5 h-5 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">{i + 1}</div>
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.actionable_feedback.resources && (
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-3">Recommended Resources</div>
                        <ul className="space-y-2">
                          {feedback.actionable_feedback.resources.map((resource, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <Book className="w-4 h-4 text-[#0D9488] mt-0.5 flex-shrink-0" />
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.actionable_feedback.practice_areas && (
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-3">Practice Areas</div>
                        <ul className="space-y-2">
                          {feedback.actionable_feedback.practice_areas.map((area, i) => (
                            <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                              <Target className="w-4 h-4 text-[#0D9488] mt-0.5 flex-shrink-0" />
                              {area}
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
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
                      }`}>
                        {feedback.career_insights.market_fit}
                      </div>
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
                      }`}>
                        {feedback.career_insights.growth_potential}
                      </div>
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

              {/* Improvement Roadmap */}
              {feedback.improvement_roadmap && feedback.improvement_roadmap.length > 0 && (
                <div className="bg-gradient-to-br from-[#CCFBF1] to-[#CCFBF1] rounded-2xl p-6 border border-[#CCFBF1]">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-[#0D9488]" />
                    Your Improvement Roadmap
                  </h3>
                  <div className="space-y-3">
                    {feedback.improvement_roadmap.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 bg-white rounded-lg p-4">
                        <div className="flex-shrink-0 w-6 h-6 bg-[#0D9488] text-white rounded-full flex items-center justify-center text-sm font-semibold">
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
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <button onClick={resetInterview}
                  className="px-7 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors">
                  Try Another Interview
                </button>
                <button onClick={() => window.location.href='/dashboard'}
                  className="px-7 py-3 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white rounded-full font-semibold shadow hover:opacity-90 transition-opacity">
                  Back to Dashboard
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
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488] border-t-transparent mx-auto mb-4"></div>
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
                className="px-6 py-3 bg-[#0D9488] text-white rounded-lg hover:bg-[#0F766E] transition-colors"
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
                    <span className="text-sm text-[#0D9488] font-medium">Click to view details →</span>
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
