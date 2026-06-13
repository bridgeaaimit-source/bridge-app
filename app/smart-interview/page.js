"use client";
import { useState, useRef, useEffect, useCallback } from "react";

export const dynamic = "force-dynamic";
import { ChevronLeft, Brain, Mic, Upload, FileText, Send, CheckCircle, AlertCircle, TrendingUp, Award, Target, MessageSquare, X, Play, Pause, Volume2, Lightbulb, Star, History, Download, DownloadCloud, Book, Camera, XCircle, ChevronDown, ChevronRight, RefreshCw, ArrowRight, Globe, SkipForward } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, collection, addDoc, query, orderBy, limit, getDocs, getDoc, updateDoc } from "firebase/firestore";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import { useAssemblyAI as useDeepgramTranscription } from "@/hooks/useAssemblyAI";
import { InterviewProvider, useInterviewState, useInterviewDispatch } from "@/context/InterviewContext";
import SetupForm from '@/components/smart-interview/SetupForm';
import FeedbackReport from '@/components/smart-interview/FeedbackReport';
import DeviceTestPanel from '@/components/smart-interview/DeviceTestPanel';

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

// Levenshtein helper for voice accuracy check
function levenshtein(a, b) {
  const m = [], al = a.length, bl = b.length;
  for (let i = 0; i <= al; i++) m[i] = [i];
  for (let j = 0; j <= bl; j++) m[0][j] = j;
  for (let i = 1; i <= al; i++)
    for (let j = 1; j <= bl; j++)
      m[i][j] = a[i-1] === b[j-1] ? m[i-1][j-1] : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
  return m[al][bl];
}

// Extracted CameraTest, MicTest, and VoiceTest subcomponents into separate files under components/smart-interview/
function SmartInterviewContent() {
  const state = useInterviewState();
  const dispatch = useInterviewDispatch();
  const router = useRouter();
  
  const { isBypassed, mockUserData } = useAuthBypass();
  
  // Device Check Inline States
  const [cameraOk, setCameraOk] = useState(null);
  const [micOk, setMicOk] = useState(null);
  const [voiceOk, setVoiceOk] = useState(null);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  // Fix 8: violation debounce ref
  const lastViolationTimeRef = useRef(0);
  // Fix 9: stable video element ref
  const liveVideoRef = useRef(null);

  // Interview state
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
  const [loading, setLoading] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [tooFewAnswers, setTooFewAnswers] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [startError, setStartError] = useState('');

  // 15s Lock for Next Question Button
  const [speakingTime, setSpeakingTime] = useState(0);
  const speakingIntervalRef = useRef(null);
  
  // Thinking Countdown (5 seconds)
  const [thinkingTimeLeft, setThinkingTimeLeft] = useState(0);
  const [isThinking, setIsThinking] = useState(false);

  // Silence Detection & Modal (7s Silence, 5s Auto-Submit)
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [autoSubmitCountdown, setAutoSubmitCountdown] = useState(5);
  const silenceTimerRef = useRef(null);
  const autoSubmitTimerRef = useRef(null);

  // Tab switch focus integrity scoring
  const violationsCountRef = useRef(0);
  useEffect(() => {
    violationsCountRef.current = state.integrity.violations.length;
  }, [state.integrity.violations.length]);

  // Voice command handler — say "finish interview" to end early
  const handleVoiceCommand = (command) => {
    if (command === 'finish') {
      const hasCurrentAnswer = fullTranscript || interimTranscript || currentAnswer;
      const hasHistory = state.engine.conversationHistory.length > 0;
      if (hasHistory || hasCurrentAnswer) {
        submitAnswer(fullTranscript || interimTranscript || currentAnswer, true);
      } else {
        resetInterview();
      }
    }
  };

  // Use Deepgram transcription hook with voice command support
  const {
    isRecording = false,
    isConnecting = false,
    transcript = '',
    interimTranscript = '',
    fullTranscript = '',
    wordCount = 0,
    fillerWords = [],
    fillerWordCounts = {},
    recordingStatus = 'idle',
    error: transcriptionError = null,
    speechLang = 'en-IN',
    setLang = () => {},
    voiceCommandDetected = null,
    resetVoiceCommand = () => {},
    startRecording: startDeepgramRecording = () => {},
    stopRecording: stopDeepgramRecording = () => {},
    clearTranscript = () => {},
    exportTranscript = () => {},
  } = useDeepgramTranscription({ onVoiceCommand: handleVoiceCommand });

  // submitAnswer uses fullTranscript in video mode too
  const startRecordingState = () => {
    if (state.config.mode === 'video') {
      startVideoRecording();
    } else {
      startDeepgramRecording();
    }
  };

  const stopRecordingState = () => {
    if (state.config.mode === 'video') {
      stopVideoRecording();
    } else {
      stopDeepgramRecording();
    }
  };

  const videoTranscript = fullTranscript || interimTranscript;
  const fileInputRef = useRef(null);

  // Fix 9: keep video srcObject in sync with stream state
  useEffect(() => {
    if (liveVideoRef.current && videoStream) {
      liveVideoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Stable violation handler
  const handleViolation = useCallback((type) => {
    const now = Date.now();
    const DEBOUNCE_MS = 2000;
    if (now - lastViolationTimeRef.current < DEBOUNCE_MS) return;
    lastViolationTimeRef.current = now;

    const timestamp = new Date().toISOString();
    const currentCount = violationsCountRef.current + 1;

    dispatch({ type: 'RECORD_VIOLATION', payload: { type, timestamp } });

    if (currentCount === 1) {
      toast.error("Warning: Tab switching detected. Please focus on the interview.", { duration: 5000 });
    } else if (currentCount === 2) {
      toast.error("Final Warning: Repeated switching will flag this interview.", { duration: 6000 });
    } else {
      toast.error("Interview Flagged: Multiple window switches detected.", { duration: 6000 });
    }
  }, [dispatch]);

  // Fix 7: listen to fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!document.fullscreenElement;
      dispatch({ type: 'SET_INTEGRITY', payload: { isFullscreen: isFs } });
      if (!isFs && state.status === 'interviewing') {
        handleViolation("Exited fullscreen mode");
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [state.status, handleViolation]);

  // Browser setups
  useEffect(() => {
    if (typeof window !== 'undefined' && !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      setIsVideoSupported(false);
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Pre-load voices so TTS works on first call
      const loadVoices = () => window.speechSynthesis.getVoices();
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

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

  // Fix 2+3: pick an explicit English voice so TTS is never silent
  const getEnglishVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    // Prefer Indian English, then any en-GB/en-US, then any English, then first available
    return (
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang === 'en-GB') ||
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0] ||
      null
    );
  };

  const speakQuickly = (text, onEnd) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getEnglishVoice();
        if (voice) utterance.voice = voice;
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.onend = () => { if (onEnd) onEnd(); };
        utterance.onerror = () => { if (onEnd) onEnd(); };
        window.speechSynthesis.speak(utterance);
      };
      // Wait for voices to load if not yet ready
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => doSpeak();
      }
    } else {
      if (onEnd) onEnd();
    }
  };

  const speakTextFallback = (text, onEnd) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const doSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getEnglishVoice();
        if (voice) utterance.voice = voice;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onstart = () => setIsSpeaking(true);
        const handleEnd = () => {
          setIsSpeaking(false);
          if (onEnd) onEnd();
        };
        utterance.onend = handleEnd;
        utterance.onerror = handleEnd;
        window.speechSynthesis.speak(utterance);
      };
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => doSpeak();
      }
    } else {
      if (onEnd) onEnd();
    }
  };

  const speakText = async (text, onEnd) => {
    if (!text) {
      if (onEnd) onEnd();
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(true);
    const startReq = performance.now();

    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('TTS API unavailable');
      }

      const fetchEnd = performance.now();
      console.log(`[Metrics] TTS API Network Latency: ${Math.round(fetchEnd - startReq)}ms`);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      const handleEnd = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        if (onEnd) onEnd();
      };

      audio.onended = handleEnd;
      audio.onplay = () => {
        const playStart = performance.now();
        console.log(`[Metrics] Audio Playback Latency: ${Math.round(playStart - fetchEnd)}ms | Total Perceived Latency: ${Math.round(playStart - startReq)}ms`);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        speakTextFallback(text, onEnd);
      };

      await audio.play();
    } catch (err) {
      console.warn('Primary TTS failed, using browser fallback:', err.message);
      speakTextFallback(text, onEnd);
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

    const toastId = toast.loading('Reading resume...');

    try {
      const base64 = await fileToBase64(file);
      dispatch({
        type: 'SET_CONFIG',
        payload: {
          resumeBase64: base64,
          resumeFileName: file.name
        }
      });

      const fileExt = file.type === 'application/pdf' ? 'pdf'
        : file.type.includes('wordprocessingml') ? 'docx' : 'doc';

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_base64: base64, file_type: fileExt, file_name: file.name, userId: auth.currentUser?.uid }),
      });
      const data = await res.json();
      if (res.ok && data.resumeText) {
        dispatch({ type: 'SET_CONFIG', payload: { resumeText: data.resumeText } });
      } else {
        dispatch({ type: 'SET_CONFIG', payload: { resumeText: `Resume: ${file.name}` } });
      }

      toast.success('Resume read successfully!', { id: toastId });
    } catch (error) {
      toast.error('Failed to upload resume', { id: toastId });
      console.error('Resume upload error:', error);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        resolve(base64);
      };
      reader.onerror = reject;
    });
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

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (streamErr) {
        if (streamErr.name === 'NotFoundError' || streamErr.name === 'NotReadableError') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          toast('Camera not found — recording audio only', { icon: '🎙️' });
        } else {
          throw streamErr;
        }
      }

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

  // Thinking countdown
  useEffect(() => {
    if (!isThinking) return;
    if (thinkingTimeLeft === 0) {
      setIsThinking(false);
      speakQuickly("Start speaking", () => {
        startRecordingState();
      });
      return;
    }
    const t = setTimeout(() => {
      setThinkingTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [isThinking, thinkingTimeLeft]);

  // Speaking time unlock countdown (Next Question button locks for 15s)
  useEffect(() => {
    if (isRecording) {
      setSpeakingTime(0);
      speakingIntervalRef.current = setInterval(() => {
        setSpeakingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
        speakingIntervalRef.current = null;
      }
      setSpeakingTime(0);
    }
    return () => {
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    };
  }, [isRecording]);

  // Invisible silence detector: triggers after 7 seconds of speech silence
  useEffect(() => {
    if (state.status !== 'interviewing' || !isRecording || showCompletionModal || isThinking || isTyping) return;

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (wordCount > 2) {
      silenceTimerRef.current = setTimeout(() => {
        console.log('🔇 7 seconds of silence detected. Triggering prompt...');
        stopRecordingState();
        setShowCompletionModal(true);
        setAutoSubmitCountdown(5);
      }, 7000);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [transcript, interimTranscript, isRecording, state.status, wordCount, showCompletionModal, isThinking, isTyping]);

  // Auto-submit countdown (5 seconds, hidden from UI)
  useEffect(() => {
    if (!showCompletionModal) {
      if (autoSubmitTimerRef.current) clearInterval(autoSubmitTimerRef.current);
      return;
    }

    setAutoSubmitCountdown(5);
    autoSubmitTimerRef.current = setInterval(() => {
      setAutoSubmitCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(autoSubmitTimerRef.current);
          setShowCompletionModal(false);
          console.log('⏰ Auto-submitting due to silence inactivity...');
          submitAnswer(fullTranscript || interimTranscript || currentAnswer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoSubmitTimerRef.current) clearInterval(autoSubmitTimerRef.current);
    };
  }, [showCompletionModal, fullTranscript, interimTranscript, currentAnswer]);

  const handleContinueAnswering = () => {
    if (autoSubmitTimerRef.current) clearInterval(autoSubmitTimerRef.current);
    setShowCompletionModal(false);
    startRecordingState();
  };

  const handleNextQuestionManual = () => {
    if (autoSubmitTimerRef.current) clearInterval(autoSubmitTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setShowCompletionModal(false);
    stopRecordingState();
    submitAnswer(fullTranscript || interimTranscript || currentAnswer);
  };

  // Fix 8: Tab switch detection — debounced to prevent double-counting
  useEffect(() => {
    if (state.status !== 'interviewing') return;

    // Only fire on actual tab hide — visibilitychange is reliable
    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation("Tab switched or window minimized");
    };

    // blur fires when user switches to another app/window (not just tab)
    // visibilitychange already covers tab switching so blur covers the remaining case
    const handleBlur = () => {
      // Only count as violation if tab is still visible (e.g. alt+tabbed to another app)
      if (!document.hidden) handleViolation("Window lost focus");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [state.status, handleViolation]);

  const startInterview = async (bypassDeviceCheck = false) => {
    if (!state.config.resumeBase64 || !state.config.jobRole) {
      toast.error('Please upload resume and enter job role');
      return;
    }

    if (!bypassDeviceCheck) {
      const permanentSkip = typeof window !== 'undefined' && localStorage.getItem('bridge_skip_device_test') === 'true';
      const sessionDone  = typeof window !== 'undefined' && sessionStorage.getItem('bridge_device_test_done') === 'true';
      if (!permanentSkip && !sessionDone) {
        dispatch({ type: 'SET_STATUS', payload: 'device-test' });
        return;
      }
    }

    setLoading(true);
    lastViolationTimeRef.current = 0;
    
    try {
      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'init',
          resume_base64: state.config.resumeBase64,
          job_role: state.config.jobRole,
          jd: state.config.jobDescription,
          round: state.config.round,
          mode: state.config.mode,
          user_id: auth.currentUser?.uid || 'test-user-123'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response (init):', errorText);
        throw new Error(errorText || 'Failed to start interview');
      }

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

      dispatch({
        type: 'START_INTERVIEW',
        payload: {
          question: data.question,
          interviewerThought: data.interviewer_thought || '',
          sessionMemory: data.session_memory || null
        }
      });
      setStartError('');

      // Fix 7: enter fullscreen when interview starts
      if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Fullscreen might be refused on some browsers — that's ok
        });
      }

      if (autoSpeak) {
        speakText(data.question, () => {
          setIsThinking(true);
          setThinkingTimeLeft(5);
        });
      } else {
        setIsThinking(true);
        setThinkingTimeLeft(5);
      }

    } catch (error) {
      console.error('Interview start error:', error);
      setStartError(error.message || 'Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (overrideAnswer, shouldFinish = false) => {
    const answer =
      typeof overrideAnswer === "string"
        ? overrideAnswer
        : state.config.mode === 'voice'
          ? fullTranscript
          : currentAnswer;
    
    console.log('submitAnswer called:', { answer, shouldFinish, mode: state.config.mode, currentQuestion: state.engine.currentQuestion });

    if (!answer.trim() && !shouldFinish) {
      toast.error('Please provide an answer');
      startRecordingState();
      return;
    }

    setIsTyping(true);
    stopRecordingState(); // Ensure recording stops immediately

    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (autoSubmitTimerRef.current) clearInterval(autoSubmitTimerRef.current);
    setShowCompletionModal(false);
      
    const historySnapshot = state.engine.conversationHistory;
    const updatedHistory = answer.trim()
      ? [...state.engine.conversationHistory, { role: 'user', message: answer }]
      : state.engine.conversationHistory;

    // Optimistically update conversation history
    if (answer.trim()) {
      dispatch({ type: 'SUBMIT_ANSWER', payload: { answer } });
    }

    if (answer.trim()) {
      
    }

    if (shouldFinish) {
      setIsTyping(false);
      setCurrentAnswer('');
      clearTranscript();
      toast.success('Interview finished! Generating state.evaluation.feedback...');
      await getFeedback(state.engine.sessionMemory, updatedHistory);
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
          resume_base64: state.config.resumeBase64,
          job_role: state.config.jobRole,
          jd: state.config.jobDescription,
          round: state.config.round,
          last_question: state.engine.currentQuestion,
          last_answer: answer,
          session_memory: state.engine.sessionMemory,
          conversation_history: updatedHistory,
          user_id: auth.currentUser?.uid || 'test-user-123'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response (continue):', errorText);
        throw new Error(errorText || 'Failed to process answer');
      }

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

      const updatedMemory = (data && data.session_memory) || state.engine.sessionMemory;

      if (data && data.interview_complete === true) {
        toast.success('Interview completed! Generating state.evaluation.feedback...');
        setCurrentAnswer('');
        clearTranscript();
        await getFeedback(updatedMemory, updatedHistory);
      } else if (data && typeof data.question === 'string' && data.question.trim()) {
        dispatch({
          type: 'RECEIVE_QUESTION',
          payload: {
            question: data.question,
            interviewerThought: data.interviewer_thought || '',
            sessionMemory: updatedMemory
          }
        });
        setCurrentAnswer('');
        clearTranscript();

        if (autoSpeak) {
          speakText(data.question, () => {
            setIsThinking(true);
            setThinkingTimeLeft(5);
          });
        } else {
          setIsThinking(true);
          setThinkingTimeLeft(5);
        }
      } else {
        throw new Error('Invalid interview response structure');
      }
      
    } catch (error) {
      toast.error(error.message || 'Failed to process answer');
      console.error('Answer submission error:', error);
      // Rollback optimistic update
      dispatch({ type: 'SET_ENGINE', payload: { conversationHistory: historySnapshot } });
      startRecordingState();
    } finally {
      setIsTyping(false);
      if (state.config.mode === 'video') {
        setRecordedVideoUrl('');
        setRecordingState('idle');
        setRecordingTimeLeft(120);
      }
    }
  };

  const getFeedback = async (memoryObj, historyOverride) => {
    setIsEvaluating(true);
    const historyToUse = historyOverride || state.engine.conversationHistory;

    try {
      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'evaluate',
          job_role: state.config.jobRole,
          jd: state.config.jobDescription,
          round: state.config.round,
          session_memory: memoryObj,
          conversation_history: historyToUse,
          user_id: auth.currentUser?.uid || 'test-user-123'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(errorText || 'Failed to get feedback');
      }

      const responseText = await response.text();
      
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        throw new Error('Invalid response format from server');
      }

      dispatch({ type: 'RECEIVE_EVALUATION', payload: { feedback: data } });
      dispatch({ type: 'SET_STATUS', payload: 'feedback' });
      
      try {
        const user = isBypassed ? { uid: 'test-user-123' } : auth.currentUser;
        
        if (user) {
          console.log('🔄 Starting feedback save process...');
          
          if (!isBypassed) {
            await addDoc(collection(db, 'users', user.uid, 'interview_feedback'), {
              jobRole: state.config.jobRole,
              round: state.config.round,
              feedback: {
                ...data,
                integrityScore: state.integrity.integrityScore,
                violations: state.integrity.violations
              },
              conversationHistory: historyToUse,
              timestamp: new Date().toISOString(),
              createdAt: Date.now()
            });
            console.log('✅ Feedback saved to history');
          } else {
            console.log('🔓 Bypass mode - simulating feedback save to localStorage');
            const mockHistory = JSON.parse(localStorage.getItem('bridge_mock_interview_history') || '[]');
            mockHistory.unshift({
              id: 'mock-feedback-' + Date.now(),
              jobRole: state.config.jobRole,
              round: state.config.round,
              feedback: {
                ...data,
                integrityScore: state.integrity.integrityScore,
                violations: state.integrity.violations
              },
              conversationHistory: historyToUse,
              timestamp: new Date().toISOString(),
              createdAt: Date.now()
            });
            localStorage.setItem('bridge_mock_interview_history', JSON.stringify(mockHistory));
          }
          
          if (!isBypassed) {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const newInterviewsDone = (userData.interviewsDone || 0) + 1;
              const overallScore = data.overall_score || 5;
              const newAvgScore = ((userData.avgScore || 0) * (userData.interviewsDone || 0) + overallScore) / newInterviewsDone;
              const newBridgeScore = Math.min(1000, (userData.bridgeScore || 500) + (overallScore * 10));
              
              const updateData = {
                interviewsDone: newInterviewsDone,
                avgScore: Math.round(newAvgScore * 10) / 10,
                bridgeScore: newBridgeScore,
                streak: (userData.streak || 0) + 1,
                updatedAt: new Date().toISOString()
              };
              
              await updateDoc(userRef, updateData);
            }
          }
        }
      } catch (saveError) {
        console.error('❌ Error saving feedback:', saveError);
        toast.error('Failed to save interview results');
      }
      
    } catch (error) {
      console.error('Feedback error:', error);
      dispatch({ type: 'RECEIVE_EVALUATION', payload: { feedback: { 
        error: true,
        overall_score: 0,
        placement_chance: 'Unable to evaluate',
        verdict: 'Feedback generation failed.',
        scores: {},
        summary: { key_takeaways: 'Failed to generate state.evaluation.feedback.' },
        question_analysis: []
       } } });
      dispatch({ type: 'SET_STATUS', payload: 'feedback' });
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetInterview = () => {
    dispatch({ type: 'RESET_INTERVIEW' });
    setCurrentAnswer('');
    clearTranscript();
    setShowEndModal(false);
    setTooFewAnswers(false);
    setSpeakingTime(0);
  };

  const loadFeedbackHistory = async () => {
    try {
      const user = isBypassed ? { uid: 'test-user-123' } : auth.currentUser;
      if (!user) {
        toast.error('Please login to view history');
        return;
      }

      setLoading(true);
      if (isBypassed) {
        const mockHistory = JSON.parse(localStorage.getItem('bridge_mock_interview_history') || '[]');
        setFeedbackHistory(mockHistory);
        dispatch({ type: 'SET_STATUS', payload: 'history' });
      } else {
        const feedbackRef = collection(db, 'users', user.uid, 'interview_feedback');
        const q = query(feedbackRef, orderBy('createdAt', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        
        const history = [];
        querySnapshot.forEach((doc) => {
          history.push({ id: doc.id, ...doc.data() });
        });
        
        setFeedbackHistory(history);
        dispatch({ type: 'SET_STATUS', payload: 'history' });
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const viewHistoricalFeedback = (historicalData) => {
    dispatch({ type: 'SET_EVALUATION', payload: { feedback: historicalData.feedback } });
    dispatch({
      type: 'SET_CONFIG',
      payload: {
        jobRole: historicalData.jobRole || '',
        round: historicalData.round || 'HR Round'
      }
    });
    dispatch({
      type: 'SET_INTEGRITY',
      payload: {
        integrityScore: historicalData.feedback?.integrityScore || 100,
        violations: historicalData.feedback?.violations || []
      }
    });
    dispatch({ type: 'SET_STATUS', payload: 'feedback' });
  };

  // SETUP SCREEN
  if (state.status === 'setup') {
    return <SetupForm startInterview={startInterview} loadFeedbackHistory={loadFeedbackHistory} handleResumeUpload={handleResumeUpload} loading={loading} />;
  }

  if (state.status === 'device-test') {
    return <DeviceTestPanel startInterview={startInterview} />;
  }

  // INTERVIEW SCREEN
  if (state.status === 'interviewing') {
    // Fix 6: 15s → 10s lock
    const isNextLocked = speakingTime < 10;

    return (
      <AppShell hideNavigation={true}>
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-3">
              {isRecording && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Recording</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-[#CCFBF1] px-3 py-1.5 rounded-full">
                <span className="text-xs font-bold text-[#0D9488]">Question {state.engine.questionNumber}</span>
                <span className="text-xs text-gray-400">• {state.config.round}</span>
              </div>
              {/* Fix 7: Exit fullscreen button */}
              {state.integrity.isFullscreen && (
                <button
                  onClick={() => document.exitFullscreen?.()}
                  title="Exit fullscreen"
                  className="flex items-center gap-1.5 bg-gray-800/70 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-700 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Exit Fullscreen
                </button>
              )}
            </div>
            <button
              onClick={() => {
                stopRecordingState();
                submitAnswer(fullTranscript || interimTranscript || currentAnswer, true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <X className="w-4 h-4" />
              Finish &amp; Get Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                
                {state.engine.interviewerThought && (
                  <div className="bg-[#F0FDFA] border border-[#0D9488]/20 rounded-xl p-3 mb-3 animate-fade-in">
                    <p className="text-xs text-[#8888A0] mb-1">💭 Context / Why this is asked:</p>
                    <p className="text-xs text-[#44445A]">{state.engine.interviewerThought}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#F0FDFA] rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-[#0D9488]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">AI Recruiter</div>
                    <div className="font-semibold text-gray-900">{state.config.jobRole} Panel</div>
                  </div>
                  <button
                    onClick={() => speakText(state.engine.currentQuestion)}
                    className="ml-auto p-2 text-gray-600 hover:text-[#14B8A6] transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {state.engine.conversationHistory.map((msg, index) => (
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

                <div className="border-t pt-4">
                  {isSpeaking ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-[#F0FDFA] rounded-2xl border border-teal-100 text-center space-y-4 animate-fade-in">
                      <div className="flex items-center gap-1.5 h-8">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="w-1.5 bg-[#0D9488] rounded-full animate-bounce" style={{
                            height: '100%',
                            animationDelay: `${i * 0.15}s`,
                            animationDuration: '1.2s'
                          }} />
                        ))}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Interviewer is speaking...</p>
                        <p className="text-xs text-gray-400 mt-1">Please listen carefully to the question.</p>
                      </div>
                      <button 
                        onClick={() => { 
                          if (currentAudioRef.current) {
                            currentAudioRef.current.pause();
                            currentAudioRef.current = null;
                          }
                          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                            window.speechSynthesis.cancel();
                          }
                          setIsSpeaking(false);
                          setIsThinking(true);
                          setThinkingTimeLeft(5);
                        }} 
                        className="text-xs text-[#0D9488] hover:underline font-semibold"
                      >
                        Skip voice and start thinking
                      </button>
                    </div>
                  ) : isThinking ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-[#F0FDFA] rounded-2xl border border-teal-100 text-center space-y-4 animate-fade-in">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#CCFBF1" strokeWidth="6" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#0D9488" strokeWidth="6" 
                            strokeDasharray={2 * Math.PI * 45} 
                            strokeDashoffset={2 * Math.PI * 45 * (1 - thinkingTimeLeft / 5)} 
                            strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <span className="text-3xl font-bold text-[#0D9488]">{thinkingTimeLeft}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">Comprehending Question...</p>
                        <p className="text-xs text-gray-400 mt-1">Take a moment to formulate your answer.</p>
                      </div>
                      <button onClick={() => { setIsThinking(false); startRecordingState(); }} className="text-xs text-[#0D9488] hover:underline font-semibold">
                        Skip countdown and speak now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {isRecording && (
                        <div className="flex flex-col items-center justify-center p-6 bg-red-50/40 border border-red-100 rounded-xl space-y-3 animate-fade-in">
                          <div className="flex items-center gap-1.5 h-8">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="w-1.5 bg-red-500 rounded-full animate-bounce" style={{
                                height: '100%',
                                animationDelay: `${i * 0.15}s`,
                                animationDuration: '1.2s'
                              }} />
                            ))}
                          </div>
                          <p className="text-xs font-semibold text-red-600 animate-pulse">Microphone active — speak your answer now</p>
                        </div>
                      )}

                      {/* Locked manual Next Question button */}
                      <button
                        onClick={handleNextQuestionManual}
                        disabled={isNextLocked || isTyping}
                        className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${
                          isNextLocked 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                            : 'bg-[#0D9488] text-white hover:bg-[#0F766E] shadow-md hover:scale-[1.01]'
                        }`}
                      >
                        {isNextLocked ? (
                          <span>Next Question (Unlocks in {10 - speakingTime}s)</span>
                        ) : (
                          <>Next Question <ArrowRight className="w-4 h-4" /></>
                        )}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            <div className="flex flex-col gap-5">
              {/* Fix 9: video preview with stable ref */}
              {state.config.mode === 'video' && !isThinking && (
                <div className="bg-gray-900 rounded-2xl p-4 overflow-hidden border border-gray-800 shadow-lg">
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-black relative">
                    {/* Always render video element; srcObject kept in sync via useEffect */}
                    <video
                      ref={liveVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`h-full w-full object-cover ${videoStream ? '' : 'hidden'}`}
                    />
                    {!videoStream && (
                      <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">Camera preview</div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100">
                <h3 className="font-bold text-[#0D9488] mb-4 text-sm flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                  <TrendingUp className="w-4 h-4" /> Live Progress
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-[#F0FDFA] rounded-lg">
                    <p className="text-sm text-[#14B8A6]">
                      💡 Be specific and provide examples from your experience
                    </p>
                  </div>
                  <div className="p-3 bg-[#F0FDFA] rounded-lg">
                    <p className="text-sm text-[#14B8A6]">
                      🎯 Relate your answers to the job requirements
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-50">
                    <span className="text-gray-500">Integrity Status</span>
                    <span className={`font-semibold ${state.integrity.violations.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {state.integrity.violations.length === 0 ? '🔒 Perfect' : `⚠️ ${state.integrity.violations.length} warnings`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 7s silence -> 5s auto-submit modal prompt */}
        {showCompletionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-[#0D9488] animate-bounce">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Have you completed your answer?</h3>
                <p className="text-xs text-gray-500 mt-1.5">
                  No speech detected for 7 seconds. Automatically proceeding in <span className="font-bold text-red-500">{autoSubmitCountdown}s</span>...
                </p>
              </div>
              <div className="flex flex-col w-full gap-2 pt-2">
                <button onClick={handleContinueAnswering} className="w-full bg-[#0D9488] text-white py-3 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors">
                  Continue Answering
                </button>
                <button onClick={handleNextQuestionManual} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                  Yes, Next Question
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  // FEEDBACK SCREEN
  if (state.status === 'feedback') {
    return <FeedbackReport resetInterview={resetInterview} isEvaluating={isEvaluating} />;
  }

  // HISTORY SCREEN
  if (state.status === 'history') {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
              <p className="text-gray-600 mt-1">View your previous interview feedback</p>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_STATUS', payload: 'setup' })}
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
                onClick={() => dispatch({ type: 'SET_STATUS', payload: 'setup' })}
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

                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(item.feedback?.scores || {}).map(([key, value]) => {
                      const scoreValue = typeof value === 'object' && value !== null && 'score' in value ? value.score : value;
                      return (
                        <div key={key} className="text-center">
                          <div className="text-sm font-semibold text-gray-900">{scoreValue}/10</div>
                          <div className="text-[10px] text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                        </div>
                      );
                    })}
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


export default function SmartInterviewPage() {
  return (
    <InterviewProvider>
      <SmartInterviewContent />
    </InterviewProvider>
  );
}
