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

// ─── Camera Test Component ──────────────────────────────────────────────────
function CameraTest({ onResult }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [errorMsg, setErrorMsg] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const streamRef = useRef(null);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startCamera = useCallback(async (deviceId) => {
    stopStream();
    setStatus("loading");
    setErrorMsg("");
    try {
      const constraints = { video: deviceId ? { deviceId: { exact: deviceId } } : true, audio: false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      setStatus("ok");
      onResult(true);
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cams = devs.filter(d => d.kind === "videoinput");
      setDevices(cams);
      if (!selectedDevice && cams.length > 0) setSelectedDevice(cams[0].deviceId);
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err.name === "NotAllowedError" ? "Camera permission denied" :
        err.name === "NotFoundError" ? "No camera found on this device" :
        "Camera access failed"
      );
      onResult(false);
    }
  }, [onResult, selectedDevice]);

  useEffect(() => {
    const t = setTimeout(() => { startCamera(); }, 0);
    return () => {
      clearTimeout(t);
      stopStream();
    };
  }, [startCamera]);

  const handleDeviceChange = (e) => {
    setSelectedDevice(e.target.value);
    startCamera(e.target.value);
  };

  return (
    <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-teal-50 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${status === "ok" ? "bg-green-50 text-green-600" : status === "error" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Camera Verification</h3>
          <p className="text-[10px] text-gray-400">Ensure your face is clearly visible</p>
        </div>
        <div className="ml-auto">
          {status === "ok" && <span className="text-green-600 text-xs font-semibold">Passed</span>}
          {status === "error" && <span className="text-red-600 text-xs font-semibold">Failed</span>}
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden max-h-48">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {status === "loading" && <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" /></div>}
        </div>
        {devices.length > 1 && (
          <select value={selectedDevice} onChange={handleDeviceChange} className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none">
            {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,6)}`}</option>)}
          </select>
        )}
      </div>
    </div>
  );
}

// ─── Microphone Test Component ──────────────────────────────────────────────
function MicTest({ onResult }) {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [volume, setVolume] = useState(0);

  const stopAll = () => {
    cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    streamRef.current = null; audioCtxRef.current = null; analyserRef.current = null;
  };

  const startMic = useCallback(async () => {
    stopAll();
    setStatus("loading");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      setStatus("ok");
      onResult(true);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const buf = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        animRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        setVolume(Math.sqrt(sum / buf.length));

        ctx.fillStyle = "#f9fafb";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const barW = (canvas.width / buf.length) * 2;
        let x = 0;
        for (let i = 0; i < buf.length; i++) {
          const h = (buf[i] / 255) * canvas.height * 0.8;
          ctx.fillStyle = "#0D9488";
          ctx.fillRect(x, canvas.height - h, barW, h);
          x += barW + 1;
        }
      };
      draw();
    } catch (err) {
      setStatus("error");
      onResult(false);
    }
  }, [onResult]);

  useEffect(() => {
    const t = setTimeout(() => { startMic(); }, 0);
    return () => {
      clearTimeout(t);
      stopAll();
    };
  }, [startMic]);

  return (
    <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-teal-50 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${status === "ok" ? "bg-green-50 text-green-600" : status === "error" ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
          <Mic className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Microphone Verification</h3>
          <p className="text-[10px] text-gray-400">Speak to test input activity</p>
        </div>
        <div className="ml-auto">
          {status === "ok" && volume > 5 && <span className="text-green-600 text-xs font-semibold">Working</span>}
        </div>
      </div>
      <div className="p-5 space-y-3">
        <canvas ref={canvasRef} width={300} height={50} className="w-full h-12 rounded-lg bg-gray-50 border border-gray-200" />
      </div>
    </div>
  );
}

// ─── Voice Recognition Test Component ──────────────────────────────────────────
function VoiceTest({ onResult, selectedLang, onLangChange }) {
  const [isListening, setIsListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [interimText, setInterimText] = useState("");
  const [accuracy, setAccuracy] = useState(null);
  const recognitionRef = useRef(null);
  const finalRef = useRef("");

  const TEST_SENTENCE = "I am ready for my AI placement mock interview today";
  const testWords = TEST_SENTENCE.toLowerCase().split(" ");

  const calcAccuracy = useCallback((text) => {
    const heardWords = text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/).filter(Boolean);
    let matches = 0;
    testWords.forEach((expected, i) => {
      const h = heardWords[i] || "";
      if (expected === h || levenshtein(expected, h) <= 1) matches++;
    });
    const acc = Math.round((matches / testWords.length) * 100);
    setAccuracy(acc);
    // Fix 1: lower threshold to 40% — mic works, minor accent differences are fine
    onResult(acc >= 40);
  }, [onResult, testWords]);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition requires Chrome or Edge"); return; }
    finalRef.current = "";
    setHeard(""); setInterimText(""); setAccuracy(null);

    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = selectedLang;

    r.onstart = () => setIsListening(true);
    r.onresult = (event) => {
      let interim = "", final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const best = event.results[i][0];
        if (event.results[i].isFinal) final += best.transcript + " ";
        else interim += best.transcript;
      }
      if (final.trim()) {
        finalRef.current = (finalRef.current + " " + final).trim();
        setHeard(finalRef.current);
        setInterimText(interim);
        calcAccuracy(finalRef.current);
      } else setInterimText(interim);
    };

    r.onerror = () => {};
    r.onend = () => setIsListening(false);
    r.start();
    recognitionRef.current = r;
  }, [selectedLang, calcAccuracy]);

  const stop = () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  };

  useEffect(() => () => stop(), []);

  return (
    <div className="bg-white rounded-2xl border border-teal-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-teal-50 flex items-center gap-3">
        <div className="w-9 h-9 bg-teal-50 rounded-full flex items-center justify-center text-[#0D9488]">
          <Volume2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Transcript Validation</h3>
          <p className="text-[10px] text-gray-400">Speak the text to calibrate</p>
        </div>
        {accuracy !== null && <span className="ml-auto text-xs font-bold text-[#0D9488]">{accuracy}% accuracy</span>}
      </div>
      <div className="p-5 space-y-3">
        <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-3 text-xs font-medium text-teal-800">
          {"\"" + TEST_SENTENCE + "\""}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 min-h-[50px] text-xs">
          {heard || interimText ? (
            <p className="text-gray-900">{heard} {interimText && <span className="text-gray-400 italic">{interimText}</span>}</p>
          ) : (
            <p className="text-gray-400 italic">Spoken words will appear here...</p>
          )}
        </div>
        <div className="flex gap-2">
          {!isListening ? (
            <button onClick={start} className="flex-1 bg-[#0D9488] text-white py-2 rounded-xl text-xs font-semibold hover:bg-[#0F766E]">
              Start Speaking Test
            </button>
          ) : (
            <button onClick={stop} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-semibold hover:bg-red-600">
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SmartInterviewPage() {
  const router = useRouter();
  const [stage, setStage] = useState('setup'); // 'setup' | 'device-test' | 'interviewing' | 'feedback' | 'history'
  const [resumeBase64, setResumeBase64] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [round, setRound] = useState('HR Round');
  const [mode, setMode] = useState('voice'); // Supported modes: only 'voice' | 'video'. Typing is completely removed.
  
  const { isBypassed, mockUserData } = useAuthBypass();
  
  // Device Check Inline States
  const [cameraOk, setCameraOk] = useState(null);
  const [micOk, setMicOk] = useState(null);
  const [voiceOk, setVoiceOk] = useState(null);
  const [selectedLang, setSelectedLang] = useState("en-IN");
  // Fix 7: fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Fix 8: violation debounce ref
  const lastViolationTimeRef = useRef(0);
  // Fix 9: stable video element ref
  const liveVideoRef = useRef(null);

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

  // Redesign state variables:
  const [sessionMemory, setSessionMemory] = useState(null);
  
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
  const [violations, setViolations] = useState([]);
  const [integrityScore, setIntegrityScore] = useState(100);

  // Voice command handler — say "finish interview" to end early
  const handleVoiceCommand = (command) => {
    if (command === 'finish') {
      const hasCurrentAnswer = fullTranscript || interimTranscript || currentAnswer;
      const hasHistory = conversationHistory.length > 0;
      if (hasHistory || hasCurrentAnswer) {
        submitAnswer(fullTranscript || interimTranscript || currentAnswer, true);
      } else {
        resetInterview();
      }
    }
  };

  // Use Deepgram transcription hook with voice command support
  const {
    isRecording,
    isConnecting,
    transcript,
    interimTranscript,
    fullTranscript,
    wordCount,
    fillerWords,
    fillerWordCounts,
    recordingStatus,
    error: transcriptionError,
    speechLang,
    setLang,
    voiceCommandDetected,
    resetVoiceCommand,
    startRecording: startDeepgramRecording,
    stopRecording: stopDeepgramRecording,
    clearTranscript,
    exportTranscript,
  } = useDeepgramTranscription({ onVoiceCommand: handleVoiceCommand });

  const startRecordingState = () => {
    if (mode === 'video') {
      startVideoRecording();
    } else {
      startDeepgramRecording();
    }
  };

  const stopRecordingState = () => {
    if (mode === 'video') {
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

  // Fix 7: listen to fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

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

      const handleEnd = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        if (onEnd) onEnd();
      };

      audio.onended = handleEnd;
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        speakTextFallback(text, onEnd);
      };

      await audio.play();
    } catch (err) {
      console.warn('ElevenLabs TTS failed, using browser fallback:', err.message);
      speakTextFallback(text, onEnd);
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
    if (stage !== 'interviewing' || !isRecording || showCompletionModal || isThinking || isTyping) return;

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
  }, [transcript, interimTranscript, isRecording, stage, wordCount, showCompletionModal, isThinking, isTyping]);

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
    if (stage !== 'interviewing') return;

    const DEBOUNCE_MS = 2000; // ignore second event within 2 seconds

    const handleViolation = (type) => {
      const now = Date.now();
      // Skip if a violation was already recorded within the debounce window
      if (now - lastViolationTimeRef.current < DEBOUNCE_MS) return;
      lastViolationTimeRef.current = now;

      const timestamp = new Date().toISOString();
      setViolations((prev) => {
        const nextViolations = [...prev, { type, timestamp }];
        const count = nextViolations.length;
        
        let newScore = 100;
        if (count === 1) newScore = 85;
        else if (count === 2) newScore = 60;
        else if (count >= 3) newScore = 30;
        setIntegrityScore(newScore);

        if (count === 1) {
          toast.error("Warning: Tab switching detected. Please focus on the interview.", { duration: 5000 });
        } else if (count === 2) {
          toast.error("Final Warning: Repeated switching will flag this interview.", { duration: 6000 });
        } else {
          toast.error("Interview Flagged: Multiple window switches detected.", { duration: 6000 });
        }

        return nextViolations;
      });
    };

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
  }, [stage]);

  const startInterview = async (bypassDeviceCheck = false) => {
    if (!resumeBase64 || !jobRole) {
      toast.error('Please upload resume and enter job role');
      return;
    }

    if (!bypassDeviceCheck) {
      const permanentSkip = typeof window !== 'undefined' && localStorage.getItem('bridge_skip_device_test') === 'true';
      const sessionDone  = typeof window !== 'undefined' && sessionStorage.getItem('bridge_device_test_done') === 'true';
      if (!permanentSkip && !sessionDone) {
        setStage('device-test');
        return;
      }
    }

    setLoading(true);
    setViolations([]);
    setIntegrityScore(100);
    lastViolationTimeRef.current = 0;
    
    try {
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

      setCurrentQuestion(data.question);
      setInterviewerThought(data.interviewer_thought || '');
      setConversationHistory([
        { role: 'interviewer', message: data.question }
      ]);
      setSessionMemory(data.session_memory || null);
      setStage('interviewing');
      setQuestionNumber(1);
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
        : mode === 'voice'
          ? fullTranscript
          : currentAnswer;
    
    console.log('submitAnswer called:', { answer, shouldFinish, mode, currentQuestion });

    if (!answer.trim() && !shouldFinish) {
      toast.error('Please provide an answer');
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
      
    const updatedHistory = answer.trim()
      ? [...conversationHistory, { role: 'user', message: answer }]
      : conversationHistory;

    if (answer.trim()) {
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', message: answer }
      ]);
    }

    if (shouldFinish) {
      setIsTyping(false);
      setCurrentAnswer('');
      clearTranscript();
      toast.success('Interview finished! Generating feedback...');
      await getFeedback(sessionMemory, updatedHistory);
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
          last_question: currentQuestion,
          last_answer: answer,
          session_memory: sessionMemory,
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

      const updatedMemory = data.session_memory || sessionMemory;
      setSessionMemory(updatedMemory);

      if (data.interview_complete) {
        toast.success('Interview completed! Generating feedback...');
        await getFeedback(updatedMemory, updatedHistory);
      } else if (data.question) {
        setCurrentQuestion(data.question);
        setInterviewerThought(data.interviewer_thought || '');
        setConversationHistory(prev => [
          ...prev,
          { role: 'interviewer', message: data.question }
        ]);
        setQuestionNumber(questionNumber + 1);

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
        await getFeedback(updatedMemory, updatedHistory);
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

  const getFeedback = async (memoryObj, historyOverride) => {
    setIsEvaluating(true);
    const historyToUse = historyOverride || conversationHistory;

    try {
      const response = await fetch('/api/smart-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'evaluate',
          job_role: jobRole,
          jd: jobDescription,
          round,
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

      setFeedback(data);
      setStage('feedback');
      
      try {
        const user = isBypassed ? { uid: 'test-user-123' } : auth.currentUser;
        
        if (user) {
          console.log('🔄 Starting feedback save process...');
          
          if (!isBypassed) {
            await addDoc(collection(db, 'users', user.uid, 'interview_feedback'), {
              jobRole,
              round,
              feedback: {
                ...data,
                integrityScore,
                violations
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
              jobRole,
              round,
              feedback: {
                ...data,
                integrityScore,
                violations
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
      setFeedback({
        error: true,
        overall_score: 0,
        placement_chance: 'Unable to evaluate',
        verdict: 'Feedback generation failed.',
        scores: {},
        summary: { key_takeaways: 'Failed to generate feedback.' },
        question_analysis: []
      });
      setStage('feedback');
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
    setSpeakingTime(0);
    setViolations([]);
    setIntegrityScore(100);
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
        setStage('history');
      } else {
        const feedbackRef = collection(db, 'users', user.uid, 'interview_feedback');
        const q = query(feedbackRef, orderBy('createdAt', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);
        
        const history = [];
        querySnapshot.forEach((doc) => {
          history.push({ id: doc.id, ...doc.data() });
        });
        
        setFeedbackHistory(history);
        setStage('history');
      }
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
    setIntegrityScore(historicalData.feedback?.integrityScore || 100);
    setViolations(historicalData.feedback?.violations || []);
    setStage('feedback');
  };

  // SETUP SCREEN
  if (stage === 'setup') {
    return (
      <AppShell>
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              {/* Setup form */}
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
                        <p className="text-sm text-gray-400 max-w-xs">Drag & drop your PDF or DOCX here. {"We'll"} tailor questions to your experience.</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" id="resume-upload" />
                  </label>
                </div>
              </div>

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
                        placeholder="Paste JD text snippet"
                        className="w-full bg-gray-50 border-2 border-[#CCFBF1] focus:border-[#0D9488] rounded-xl px-4 py-3 outline-none text-gray-800 text-sm transition-colors" />
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
                    <div className="grid grid-cols-2 gap-3">
                      {[{m:'voice',Icon:Mic,label:'Voice Only'},{m:'video',Icon:Play,label:'Video & Voice'}].map(({m,Icon,label}) => (
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

              <div className="bg-[#F0FDFA] rounded-2xl p-6 border border-[#CCFBF1]">
                <p className="font-bold text-[#0D9488] mb-3 flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" /> What to expect
                </p>
                <ul className="text-xs text-gray-600 space-y-1.5 mb-6">
                  <li>• AI asks 8–12 highly personalized questions</li>
                  <li>• Hands-free conversational speech flow</li>
                  <li>• Full scoring analysis and integrity rating provided</li>
                </ul>
                {startError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <p className="text-red-600 text-sm">❌ {startError}</p>
                  </div>
                )}
                <button onClick={() => startInterview(false)} disabled={!resumeBase64 || !jobRole || loading}
                  className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-4 rounded-2xl font-bold text-base hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Preparing Interview…</> : <>Start Practice Interview <FileText className="w-4 h-4" /></>}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(13,148,136,0.08)] border border-gray-100">
                <h3 className="font-bold text-[#0D9488] mb-4 flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
                  <Lightbulb className="w-5 h-5" /> Pacing & Pointers
                </h3>
                <div className="flex flex-col gap-3">
                  {[
                    {title:'STAR Method', body:'Structure answers using Situation, Task, Action, and Result.'},
                    {title:'Comprehension Time', body:'You get 5 seconds to think before the mic opens automatically.'},
                    {title:'Stay Focused', body:'Keep the tab active. Leaving the window will impact your integrity score.'},
                  ].map(({title,body}) => (
                    <div key={title} className="p-4 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1]">
                      <p className="font-bold text-gray-800 text-sm mb-1">{title}</p>
                      <p className="text-xs text-gray-500">{body}</p>
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

  // INLINE DEVICE TEST SCREEN (Bypasses extra page redirects)
  if (stage === 'device-test') {
    const allDone = cameraOk !== null && micOk !== null && voiceOk !== null;
    const allPass = cameraOk && micOk && voiceOk;
    const corePass = micOk && voiceOk;

    return (
      <AppShell>
        <div className="max-w-[700px] mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{fontFamily:'Syne,sans-serif'}}>Verify Your Setup</h1>
            <p className="text-sm text-gray-500">Ensure camera and microphone are configured correctly for voice transcription.</p>
          </div>

          <div className="space-y-6">
            {mode === 'video' && <CameraTest onResult={setCameraOk} />}
            <MicTest onResult={setMicOk} />
            <VoiceTest onResult={setVoiceOk} selectedLang={selectedLang} onLangChange={setSelectedLang} />

            {(mode === 'video' ? allPass : corePass) ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-4 animate-fade-in">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-green-950 text-lg">Setup Verified!</h3>
                  <p className="text-xs text-green-700">Everything is working correctly. {"You're"} ready to start!</p>
                </div>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('bridge_device_test_done', 'true');
                    }
                    startInterview(true);
                  }}
                  className="w-full bg-[#0D9488] text-white py-4 rounded-xl font-semibold hover:bg-[#0F766E] transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  Start Interview <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 text-center space-y-3">
                <p className="text-sm text-yellow-800 font-semibold">Please complete the verification checks above to start.</p>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      sessionStorage.setItem('bridge_device_test_done', 'true');
                    }
                    startInterview(true);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline flex items-center gap-1 mx-auto"
                >
                  Skip verification and start anyway
                </button>
              </div>
            )}
            
            <button
              onClick={() => setStage('setup')}
              className="w-full py-3 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Parameters Setup
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // INTERVIEW SCREEN
  if (stage === 'interviewing') {
    // Fix 6: 15s → 10s lock
    const isNextLocked = speakingTime < 10;

    return (
      <AppShell>
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
                <span className="text-xs font-bold text-[#0D9488]">Question {questionNumber}</span>
                <span className="text-xs text-gray-400">• {round}</span>
              </div>
              {/* Fix 7: Exit fullscreen button */}
              {isFullscreen && (
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
              className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm shadow hover:opacity-90 transition-opacity"
            >
              <X className="w-4 h-4" />
              Finish &amp; Get Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                
                {interviewerThought && (
                  <div className="bg-[#F0FDFA] border border-[#0D9488]/20 rounded-xl p-3 mb-3 animate-fade-in">
                    <p className="text-xs text-[#8888A0] mb-1">💭 Context / Why this is asked:</p>
                    <p className="text-xs text-[#44445A]">{interviewerThought}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-[#F0FDFA] rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-[#0D9488]" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">AI Recruiter</div>
                    <div className="font-semibold text-gray-900">{jobRole} Panel</div>
                  </div>
                  <button
                    onClick={() => speakText(currentQuestion)}
                    className="ml-auto p-2 text-gray-600 hover:text-[#14B8A6] transition-colors"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

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
              {mode === 'video' && !isThinking && (
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
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Questions done</span>
                    <span className="text-sm font-bold text-[#0D9488]">{questionNumber - 1}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-[#0D9488] h-1.5 rounded-full transition-all" style={{width:`${Math.min(((questionNumber-1)/10)*100,100)}%`}} />
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-50">
                    <span className="text-gray-500">Integrity Status</span>
                    <span className={`font-semibold ${violations.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {violations.length === 0 ? '🔒 Perfect' : `⚠️ ${violations.length} warnings`}
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
  if (stage === 'feedback') {
    return (
      <AppShell>
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
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
                <div className="text-gray-600">Analyzing your responses...</div>
              </div>
            </div>
          ) : feedback ? (
            <div className="space-y-8">
              
              {/* Placement & Integrity score headers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(() => {
                  const chance = feedback.placement_chance || feedback.placementChance || 0;
                  const isHigh = chance >= 75;
                  const isMid = chance >= 50;
                  return (
                    <div className={`rounded-2xl p-8 text-center flex flex-col justify-center items-center ${
                      isHigh ? 'bg-gradient-to-r from-[#0D9488] to-[#14B8A6]' :
                      isMid  ? 'bg-gradient-to-r from-yellow-500 to-orange-400' :
                               'bg-gradient-to-r from-red-500 to-rose-400'
                    }`}>
                      <p className="text-white/70 uppercase tracking-widest text-xs font-bold mb-2">Placement Chance</p>
                      <p className="text-6xl font-bold text-white mb-3" style={{fontFamily:'Syne,sans-serif'}}>{chance}%</p>
                      <span className="inline-flex items-center bg-white/20 text-white px-5 py-2 rounded-full text-sm font-bold">
                        {feedback.verdict || 'Pending'}
                      </span>
                    </div>
                  );
                })()}

                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] flex flex-col justify-center items-center text-center">
                  <p className="text-gray-400 uppercase tracking-widest text-xs font-bold mb-2">Integrity Score</p>
                  <p className={`text-6xl font-bold mb-3 ${
                    integrityScore >= 80 ? 'text-[#0D9488]' :
                    integrityScore >= 50 ? 'text-yellow-600' : 'text-red-500'
                  }`} style={{fontFamily:'Syne,sans-serif'}}>{integrityScore}%</p>
                  <span className={`inline-flex items-center px-5 py-2 rounded-full text-sm font-bold ${
                    integrityScore >= 80 ? 'bg-teal-50 text-[#0D9488] border border-teal-100' :
                    integrityScore >= 50 ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                    'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {integrityScore >= 80 ? '🔒 Integrity Passed' :
                     integrityScore >= 50 ? '⚠️ Warnings Triggered' : '❌ Flagged for Review'}
                  </span>
                  {violations.length > 0 && (
                    <p className="text-xs text-gray-400 mt-3">{violations.length} tab/window switches detected.</p>
                  )}
                </div>
              </div>

              {/* Score Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(feedback.scores || {}).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(13,148,136,0.06)] border border-gray-100">
                    <p className="text-[10px] text-gray-400 capitalize mb-2">{key.replace(/_/g, ' ')}</p>
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
                  <p className="text-[#CCFBF1] mb-4 text-sm leading-relaxed">{feedback.summary.key_takeaways}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {feedback.summary.strengths && (
                      <div>
                        <div className="text-xs font-bold mb-2 uppercase tracking-wide text-[#CCFBF1]">Strengths</div>
                        <ul className="space-y-1">
                          {feedback.summary.strengths.map((s, i) => (
                            <li key={i} className="text-xs flex items-center gap-2">
                              <CheckCircle className="w-3.5 h-3.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {feedback.summary.weaknesses && (
                      <div>
                        <div className="text-xs font-bold mb-2 uppercase tracking-wide text-[#CCFBF1]">Areas to Improve</div>
                        <ul className="space-y-1">
                          {feedback.summary.weaknesses.map((w, i) => (
                            <li key={i} className="text-xs flex items-center gap-2">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Question-by-Question Analysis Removed - Token Optimization */}

              {/* Career Insights */}
              {feedback.career_insights && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2" style={{fontFamily:'Syne,sans-serif'}}>
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

                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(item.feedback?.scores || {}).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-sm font-semibold text-gray-900">{value}/10</div>
                        <div className="text-[10px] text-gray-500 capitalize">{key.replace('_', ' ')}</div>
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
