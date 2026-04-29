// Deepgram replaced with AssemblyAI + Web Speech API
// This file kept for backward-compatible imports
export { useAssemblyAI as useDeepgramTranscription } from './useAssemblyAI';

import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

// ─── Word correction dictionary for Indian English ───────────────────────────
const CORRECTIONS = {
  "i am": "I am", "i'm": "I'm", "i've": "I've", "i'll": "I'll",
  "i was": "I was", "i have": "I have", "i can": "I can", "i do": "I do",
  "i think": "I think", "i feel": "I feel", "i believe": "I believe",
  "i know": "I know", "i want": "I want", "i need": "I need",
  "cant": "can't", "dont": "don't", "wont": "won't", "isnt": "isn't",
  "wasnt": "wasn't", "havent": "haven't", "hasnt": "hasn't",
  "didnt": "didn't", "couldnt": "couldn't", "wouldnt": "wouldn't",
  "im": "I'm", "ur": "your", "bcoz": "because", "coz": "because",
  "gonna": "going to", "wanna": "want to", "kinda": "kind of",
  "sorta": "sort of", "gotta": "got to",
  // Tech terms
  "react": "React", "reactjs": "React.js", "javascript": "JavaScript",
  "python": "Python", "java": "Java", "sequel": "SQL",
  "my sequel": "MySQL", "mongo db": "MongoDB", "node": "Node.js",
  "nodejs": "Node.js", "git hub": "GitHub", "linked in": "LinkedIn",
  "amazon web services": "AWS", "google cloud": "GCP",
  "type script": "TypeScript", "typescript": "TypeScript",
  "next js": "Next.js", "nextjs": "Next.js",
  "dot net": ".NET", "css": "CSS", "html": "HTML", "api": "API",
  // Common Indian English
  "prepaid": "pre-paid", "one lac": "one lakh", "lacs": "lakhs",
  "crore": "crore", "paise": "paise",
};

function applyCorrections(text) {
  let result = text;
  // Sort by length descending so longer phrases match first
  const sorted = Object.entries(CORRECTIONS).sort((a, b) => b[0].length - a[0].length);
  sorted.forEach(([wrong, right]) => {
    result = result.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), right);
  });
  return result;
}

// ─── Main hook ───────────────────────────────────────────────────────────────
export function useDeepgramTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [fillerWords, setFillerWords] = useState([]);
  const [fillerWordCounts, setFillerWordCounts] = useState({});
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [speechLang, setSpeechLangState] = useState('en-IN');

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const websocketRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef(null);
  const webSpeechStartedRef = useRef(false);
  const micStreamRef = useRef(null);

  // Load saved language preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bridge_speech_lang') || 'en-IN';
      setSpeechLangState(saved);
    }
  }, []);

  const setLang = useCallback((lang) => {
    setSpeechLangState(lang);
    if (typeof window !== 'undefined') localStorage.setItem('bridge_speech_lang', lang);
  }, []);

  const fillerPatterns = useRef([
    /\b(um+|uh+|umm+|uhh+)\b/gi,
    /\b(like|you know|kind of|sort of)\b/gi,
    /\b(actually|basically|literally|obviously|simply|clearly)\b/gi,
    /\b(I mean|you see|means|is it not|isn't it|right)\b/gi,
    /\b(so|anyway|well|okay|ok)\b/gi,
    /\b(na|yaar|no)\b/g,
  ]);

  const detectFillerWords = useCallback((text) => {
    const detected = [];
    const counts = {};
    fillerPatterns.current.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const word = match.toLowerCase();
          detected.push(word);
          counts[word] = (counts[word] || 0) + 1;
        });
      }
    });
    return { words: [...new Set(detected)], counts };
  }, []);

  // ── CRITICAL FIX: commit final text properly so it persists after stop ──
  const commitFinalText = useCallback((text) => {
    const corrected = applyCorrections(text.trim());
    finalTranscriptRef.current = corrected;
    setTranscript(corrected);           // ← sets transcript state (persists after stop)
    setInterimTranscript('');
    const words = corrected.split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    const { words: fillers, counts } = detectFillerWords(corrected);
    setFillerWords(fillers);
    setFillerWordCounts(counts);
  }, [detectFillerWords]);

  const showInterimText = useCallback((interimText) => {
    setInterimTranscript(interimText);
    const combined = (finalTranscriptRef.current + ' ' + interimText).trim();
    const words = combined.split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
  }, []);

  // ── Deepgram WebSocket message handler ──
  const handleWebSocketMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.channel?.alternatives) {
        const alt = data.channel.alternatives[0];
        if (alt?.transcript) {
          if (data.is_final) {
            const newFinal = (finalTranscriptRef.current + ' ' + alt.transcript).trim();
            commitFinalText(newFinal);
          } else {
            showInterimText(alt.transcript);
          }
        }
        if (data.type === 'SpeechStarted') setRecordingStatus('listening');
      }
    } catch (e) {
      console.error('WS message parse error:', e);
    }
  }, [commitFinalText, showInterimText]);

  // ── Web Speech API — the reliable core path ──
  const startWebSpeechAPI = useCallback((lang) => {
    if (webSpeechStartedRef.current) return; // prevent double-start
    webSpeechStartedRef.current = true;

    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition requires Chrome or Edge browser.');
      setIsConnecting(false);
      return;
    }

    const useLang = lang || (typeof window !== 'undefined' ? localStorage.getItem('bridge_speech_lang') || 'en-IN' : 'en-IN');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;   // top-3 gives better accuracy on Indian English
    recognition.lang = useLang;

    recognition.onstart = () => {
      setIsConnecting(false);
      setIsRecording(true);
      setRecordingStatus('listening');
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];

        // Pick the best alternative by confidence score
        let best = result[0];
        for (let j = 1; j < result.length; j++) {
          if (result[j] && (result[j].confidence || 0) > (best.confidence || 0)) {
            best = result[j];
          }
        }

        if (result.isFinal) {
          finalText += best.transcript + ' ';
        } else {
          interimText += best.transcript;
        }
      }

      if (finalText.trim()) {
        // ── CRITICAL FIX: call commitFinalText so transcript state is set ──
        const newFinal = (finalTranscriptRef.current + ' ' + finalText).trim();
        commitFinalText(newFinal);
        if (interimText) showInterimText(interimText);
      } else if (interimText) {
        showInterimText(interimText);
      }
    };

    recognition.onerror = (event) => {
      if (!isRecordingRef.current) return;
      if (event.error === 'no-speech' || event.error === 'audio-capture') return; // non-fatal
      if (event.error === 'network') {
        setTimeout(() => { if (isRecordingRef.current) try { recognition.start(); } catch {} }, 1000);
        return;
      }
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access.');
        isRecordingRef.current = false;
        return;
      }
      if (event.error !== 'aborted') console.warn('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        // 300ms gap prevents word loss at restart boundary
        setTimeout(() => {
          if (isRecordingRef.current && recognitionRef.current) {
            try { recognition.start(); } catch {}
          }
        }, 300);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      webSpeechStartedRef.current = false;
    }
  }, [commitFinalText, showInterimText]);

  // ── Deepgram connection (5s timeout, settles once) ──
  const connectToDeepgram = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      let settled = false;
      const settle = (fn, val) => { if (!settled) { settled = true; fn(val); } };
      try {
        setIsConnecting(true);
        setError(null);

        const response = await fetch('/api/transcription/stream', { method: 'POST' });
        if (!response.ok) throw new Error('Config fetch failed');
        const config = await response.json();
        if (!config.apiKey) throw new Error('No Deepgram API key');

        const wsUrl = new URL('wss://api.deepgram.com/v1/listen');
        wsUrl.searchParams.set('model', 'nova-2');
        wsUrl.searchParams.set('language', 'en-IN');
        wsUrl.searchParams.set('smart_format', 'true');
        wsUrl.searchParams.set('punctuate', 'true');
        wsUrl.searchParams.set('interim_results', 'true');
        wsUrl.searchParams.set('vad_events', 'true');
        wsUrl.searchParams.set('endpointing', '300');
        wsUrl.searchParams.set('filler_words', 'true');
        wsUrl.searchParams.set('token', config.apiKey);

        const ws = new WebSocket(wsUrl.toString());

        const timeout = setTimeout(() => {
          try { ws.close(); } catch {}
          settle(reject, new Error('Deepgram timeout'));
        }, 5000);

        ws.onopen = () => { clearTimeout(timeout); setIsConnecting(false); setRecordingStatus('listening'); websocketRef.current = ws; settle(resolve, undefined); };
        ws.onmessage = handleWebSocketMessage;
        ws.onerror = () => { clearTimeout(timeout); setIsConnecting(false); settle(reject, new Error('WebSocket failed')); };
        ws.onclose = (e) => { setIsConnecting(false); if (!settled && e.code !== 1000) settle(reject, new Error('WS closed before open')); };
        websocketRef.current = ws;
      } catch (err) {
        setIsConnecting(false);
        settle(reject, err);
      }
    });
  }, [handleWebSocketMessage]);

  // ── startRecording ──────────────────────────────────────────────────────────
  const startRecording = useCallback(async (existingStream = null) => {
    try {
      setError(null);
      isRecordingRef.current = true;
      webSpeechStartedRef.current = false;

      if (existingStream) {
        // VIDEO mode: stream is provided by the video recorder
        micStreamRef.current = existingStream;
        try {
          await connectToDeepgram();
        } catch {
          // Fall back to Web Speech API using the video stream's audio
          startWebSpeechAPI(speechLang);
          setIsRecording(true);
          return;
        }
        // Deepgram succeeded — pipe audio via AudioContext
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        const audioTrack = existingStream.getAudioTracks()[0];
        if (!audioTrack) throw new Error('No audio track in video stream');
        const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          if (websocketRef.current?.readyState === WebSocket.OPEN) {
            const f32 = e.inputBuffer.getChannelData(0);
            const i16 = new Int16Array(f32.length);
            for (let i = 0; i < f32.length; i++) i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32768));
            websocketRef.current.send(i16.buffer);
          }
        };
        source.connect(processor);
        processor.connect(audioContext.destination);
        scriptProcessorRef.current = processor;
      } else {
        // VOICE mode: try Deepgram, fall back to Web Speech API
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
        } catch (e1) {
          if (e1.name === 'NotAllowedError') {
            // No getUserMedia permission — Web Speech API will request its own
            startWebSpeechAPI(speechLang);
            setIsRecording(true);
            return;
          }
          // Try bare minimum
          try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
          catch { throw e1; }
        }
        micStreamRef.current = stream;

        try {
          await connectToDeepgram();
          // Deepgram OK — use MediaRecorder to pipe audio
          const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
          const recorder = new MediaRecorder(stream, { mimeType });
          recorder.ondataavailable = (ev) => {
            if (ev.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN)
              websocketRef.current.send(ev.data);
          };
          recorder.onstop = () => stream.getTracks().forEach(t => t.stop());
          mediaRecorderRef.current = recorder;
          recorder.start(250);
        } catch {
          // Deepgram failed — stop the stream and use Web Speech API instead
          stream.getTracks().forEach(t => t.stop());
          micStreamRef.current = null;
          startWebSpeechAPI(speechLang);
          setIsRecording(true);
          return;
        }
      }

      setIsRecording(true);
      setRecordingStatus('listening');
    } catch (err) {
      console.error('Failed to start recording:', err);
      isRecordingRef.current = false;
      const msg =
        err.name === 'NotAllowedError'     ? 'Microphone permission denied. Click the lock icon in the address bar and allow microphone access.' :
        err.name === 'NotFoundError'        ? 'No microphone detected. Please plug in a microphone and try again.' :
        err.name === 'NotReadableError'     ? 'Microphone is in use by another app. Close Zoom/Meet/Teams and retry.' :
        err.name === 'OverconstrainedError' ? 'Microphone settings not supported. Please try Chrome or Edge.' :
                                              'Could not access microphone. Please check your browser permissions.';
      setError(msg);
      toast.error(msg, { duration: 6000 });
    }
  }, [connectToDeepgram, startWebSpeechAPI, speechLang]);

  // ── stopRecording ───────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    webSpeechStartedRef.current = false;

    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    mediaRecorderRef.current = null;

    if (scriptProcessorRef.current) { scriptProcessorRef.current.disconnect(); scriptProcessorRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (websocketRef.current) { websocketRef.current.close(1000, 'done'); websocketRef.current = null; }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }

    setIsRecording(false);
    setRecordingStatus('idle');

    // ── CRITICAL: merge any remaining interim into final transcript ──
    // This ensures fullTranscript is non-empty when user hits "Submit Answer"
    setInterimTranscript(prev => {
      if (prev && prev.trim()) {
        const combined = applyCorrections((finalTranscriptRef.current + ' ' + prev).trim());
        finalTranscriptRef.current = combined;
        setTranscript(combined);
      }
      return '';
    });
  }, []);

  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setWordCount(0);
    setFillerWords([]);
    setFillerWordCounts({});
    setError(null);
  }, []);

  const exportTranscript = useCallback(() => {
    const text = transcript || interimTranscript;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transcript-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript exported');
  }, [transcript, interimTranscript]);

  useEffect(() => () => { stopRecording(); }, [stopRecording]);

  return {
    isRecording,
    isConnecting,
    transcript,
    interimTranscript,
    fullTranscript: transcript || interimTranscript,
    wordCount,
    fillerWords,
    fillerWordCounts,
    recordingStatus,
    error,
    speechLang,
    setLang,
    startRecording,
    stopRecording,
    clearTranscript,
    exportTranscript,
  };
}
