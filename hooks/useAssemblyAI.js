import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

// ─── Indian English corrections ──────────────────────────────────────────────
const CORRECTIONS = [
  [/\bi\b/g, 'I'],
  [/\bi'm\b/gi, "I'm"], [/\bi've\b/gi, "I've"], [/\bi'll\b/gi, "I'll"],
  [/\bi was\b/gi, 'I was'], [/\bi am\b/gi, 'I am'], [/\bi have\b/gi, 'I have'],
  [/\bi can\b/gi, 'I can'], [/\bi do\b/gi, 'I do'], [/\bi think\b/gi, 'I think'],
  [/\bi feel\b/gi, 'I feel'], [/\bi believe\b/gi, 'I believe'],
  [/\bi know\b/gi, 'I know'], [/\bi want\b/gi, 'I want'],
  [/\bcant\b/gi, "can't"], [/\bdont\b/gi, "don't"], [/\bwont\b/gi, "won't"],
  [/\bisnt\b/gi, "isn't"], [/\bwasnt\b/gi, "wasn't"], [/\bhavent\b/gi, "haven't"],
  [/\bdidnt\b/gi, "didn't"], [/\bcouldnt\b/gi, "couldn't"],
  [/\bim\b/gi, "I'm"], [/\bur\b/gi, 'your'], [/\bbcoz\b/gi, 'because'],
  [/\bcoz\b/gi, 'because'], [/\bgonna\b/gi, 'going to'],
  [/\bwanna\b/gi, 'want to'], [/\bkinda\b/gi, 'kind of'],
  [/\bsorta\b/gi, 'sort of'], [/\bgotta\b/gi, 'got to'],
  [/\bna\b/g, ''], [/\byaar\b/gi, ''],
  // Tech terms
  [/\bmy sql\b/gi, 'MySQL'], [/\bpost gres\b/gi, 'PostgreSQL'],
  [/\bmongo db\b/gi, 'MongoDB'], [/\bgit hub\b/gi, 'GitHub'],
  [/\blinked in\b/gi, 'LinkedIn'], [/\bjava script\b/gi, 'JavaScript'],
  [/\btype script\b/gi, 'TypeScript'], [/\bnode js\b/gi, 'Node.js'],
  [/\breact js\b/gi, 'React.js'], [/\bnext js\b/gi, 'Next.js'],
  [/\bvs code\b/gi, 'VS Code'], [/\bopen ai\b/gi, 'OpenAI'],
  [/\bdot net\b/gi, '.NET'], [/\bgit hub\b/gi, 'GitHub'],
  [/\bamazon web services\b/gi, 'AWS'], [/\bgoogle cloud\b/gi, 'GCP'],
  // Numbers
  [/\bone lakh\b/gi, '1,00,000'], [/\bone crore\b/gi, '1,00,00,000'],
];

function applyCorrections(text) {
  let r = text.trim();
  CORRECTIONS.forEach(([pattern, replacement]) => {
    r = r.replace(pattern, replacement);
  });
  return r.replace(/\s{2,}/g, ' ').trim();
}

const FILLER_PATTERNS = [
  /\b(um+|uh+|umm+|uhh+)\b/gi,
  /\b(like|you know|kind of|sort of)\b/gi,
  /\b(actually|basically|literally|obviously)\b/gi,
  /\b(I mean|you see|right|isn't it)\b/gi,
  /\b(so|anyway|well|okay|ok)\b/gi,
];

function detectFillers(text) {
  const counts = {};
  FILLER_PATTERNS.forEach(p => {
    const matches = text.match(new RegExp(p.source, 'gi')) || [];
    matches.forEach(m => { const w = m.toLowerCase(); counts[w] = (counts[w] || 0) + 1; });
  });
  return { words: Object.keys(counts), counts };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAssemblyAI({ onVoiceCommand } = {}) {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [fillerWords, setFillerWords] = useState([]);
  const [fillerWordCounts, setFillerWordCounts] = useState({});
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [speechLang, setSpeechLangState] = useState('en-IN');
  const [volume, setVolume] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const [voiceCommandDetected, setVoiceCommandDetected] = useState(null);

  const recognitionRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const processorRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const finalRef = useRef('');
  const isRecordingRef = useRef(false);
  const wsSpeechStarted = useRef(false);
  const restartTimer = useRef(null);
  const silenceTimer = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSpeechLangState(localStorage.getItem('bridge_speech_lang') || 'en-IN');
    }
  }, []);

  const setLang = useCallback((lang) => {
    setSpeechLangState(lang);
    if (typeof window !== 'undefined') localStorage.setItem('bridge_speech_lang', lang);
  }, []);

  const updateStats = useCallback((text) => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    const { words: fw, counts: fc } = detectFillers(text);
    setFillerWords(fw);
    setFillerWordCounts(fc);
  }, []);

  const commitFinal = useCallback((text) => {
    const corrected = applyCorrections(text);
    finalRef.current = corrected;
    setTranscript(corrected);
    setInterimTranscript('');
    updateStats(corrected);
  }, [updateStats]);

  // ── AssemblyAI real-time via direct WebSocket ─────────────────────────────
  const startAssemblyAI = useCallback(async (lang) => {
    try {
      const res = await fetch('/api/assemblyai-token');
      if (!res.ok) throw new Error('Token fetch failed');
      const { token } = await res.json();
      if (!token) throw new Error('No token');

      const sampleRate = 16000;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;

      // Volume analyser
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate });
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const trackVolume = () => {
        if (!isRecordingRef.current) return;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setVolume(Math.min(100, avg * 2));
        animFrameRef.current = requestAnimationFrame(trackVolume);
      };
      trackVolume();

      // AssemblyAI WebSocket
      const ws = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${sampleRate}&token=${token}&word_boost=${encodeURIComponent(
          JSON.stringify(['React','JavaScript','Python','Node','MongoDB','SQL','MySQL','PostgreSQL','AWS','GCP','Azure','GitHub','Docker','Kubernetes','TypeScript','Infosys','TCS','Wipro','Accenture','Flipkart','IIT','NIT','BITS'])
        )}&boost_param=high`
      );

      const timeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
          throw new Error('AssemblyAI timeout');
        }
      }, 6000);

      ws.onopen = () => {
        clearTimeout(timeout);
        setIsConnecting(false);
        setIsRecording(true);
        setRecordingStatus('listening');
        wsRef.current = ws;

        // Pipe raw PCM via ScriptProcessor
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const f32 = e.inputBuffer.getChannelData(0);
          const i16 = new Int16Array(f32.length);
          for (let i = 0; i < f32.length; i++) {
            i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32768));
          }
          ws.send(i16.buffer);
        };
        source.connect(processor);
        processor.connect(audioCtx.destination);
        processorRef.current = processor;
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.message_type === 'PartialTranscript' && msg.text) {
            setInterimTranscript(msg.text);
            updateStats((finalRef.current + ' ' + msg.text).trim());
            clearTimeout(silenceTimer.current);
            silenceTimer.current = setTimeout(() => {
              if (isRecordingRef.current && finalRef.current.length > 20) {
                setRecordingStatus('processing');
              }
            }, 4000);
          } else if (msg.message_type === 'FinalTranscript' && msg.text) {
            const newFinal = applyCorrections((finalRef.current + ' ' + msg.text).trim());
            commitFinal(newFinal);
          }
        } catch {}
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        throw new Error('AssemblyAI WS error');
      };

      ws.onclose = () => {
        if (isRecordingRef.current) {
          setUsingFallback(true);
          startWebSpeech(lang);
        }
      };

    } catch (err) {
      console.warn('AssemblyAI unavailable, using Web Speech API:', err.message);
      setUsingFallback(true);
      startWebSpeech(lang);
    }
  }, [commitFinal, updateStats]);

  // ── Web Speech API — 50ms restart = NO dropped words between pauses ───────
  const startWebSpeech = useCallback((lang) => {
    if (wsSpeechStarted.current) return;
    wsSpeechStarted.current = true;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition requires Chrome or Edge browser.');
      setIsConnecting(false);
      return;
    }

    const useLang = lang || (typeof window !== 'undefined' ? localStorage.getItem('bridge_speech_lang') || 'en-IN' : 'en-IN');
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.lang = useLang;

    recognition.onstart = () => {
      setIsConnecting(false);
      setIsRecording(true);
      setRecordingStatus('listening');
    };

    recognition.onresult = (event) => {
      // Clear silence timer on new speech
      clearTimeout(silenceTimer.current);

      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        // Pick best alternative
        let best = result[0];
        for (let j = 1; j < result.length; j++) {
          if (result[j] && (result[j].confidence || 0) > (best.confidence || 0)) best = result[j];
        }
        if (result.isFinal) finalText += best.transcript + ' ';
        else interimText += best.transcript;
      }

      if (finalText.trim()) {
        const newFinal = applyCorrections((finalRef.current + ' ' + finalText).trim());
        commitFinal(newFinal);
        if (interimText) { setInterimTranscript(interimText); updateStats((newFinal + ' ' + interimText).trim()); }

        // Voice command detection: finish/end/stop interview
        const lower = newFinal.toLowerCase();
        if (/\b(finish|end|stop)\s+(the\s+)?interview\b/.test(lower) || /\bi\s+(want to|wanna)\s+(finish|end|stop)\b/.test(lower)) {
          if (!voiceCommandDetected) {
            setVoiceCommandDetected('finish');
            onVoiceCommand?.('finish');
          }
        }

        // Silence detection — 6s after last final word (longer for natural pauses)
        silenceTimer.current = setTimeout(() => {
          if (isRecordingRef.current && finalRef.current.length > 20) {
            setRecordingStatus('paused');
          }
        }, 6000);
      } else if (interimText) {
        setInterimTranscript(interimText);
        updateStats((finalRef.current + ' ' + interimText).trim());
      }
    };

    recognition.onerror = (e) => {
      if (!isRecordingRef.current) return;
      if (e.error === 'no-speech' || e.error === 'audio-capture') return;
      if (e.error === 'network') { setTimeout(() => { if (isRecordingRef.current) try { recognition.start(); } catch {} }, 1000); return; }
      if (e.error === 'not-allowed') { setError('Microphone permission denied. Please allow access.'); isRecordingRef.current = false; return; }
      if (e.error !== 'aborted') console.warn('Speech error:', e.error);
    };

    // ── Smart restart: 1000ms delay prevents mid-sentence interruptions ────
    // Web Speech API auto-ends after ~60s of silence or sometimes randomly.
    // We wait 1s then restart only if still recording and not mid-speech.
    recognition.onend = () => {
      if (!isRecordingRef.current) return;
      clearTimeout(restartTimer.current);
      restartTimer.current = setTimeout(() => {
        if (isRecordingRef.current && !recognitionRef.current) {
          // Only restart if we haven't already started a new one
          const newRec = new SR();
          newRec.continuous = true;
          newRec.interimResults = true;
          newRec.maxAlternatives = 3;
          newRec.lang = useLang;
          // Copy all handlers
          newRec.onstart = recognition.onstart;
          newRec.onresult = recognition.onresult;
          newRec.onerror = recognition.onerror;
          newRec.onend = recognition.onend;
          try {
            newRec.start();
            recognitionRef.current = newRec;
          } catch {}
        }
      }, 1000);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      wsSpeechStarted.current = false;
    }
  }, [commitFinal, updateStats]);

  // ── startRecording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async (existingStream = null) => {
    try {
      setError(null);
      isRecordingRef.current = true;
      wsSpeechStarted.current = false;
      setUsingFallback(false);
      setIsConnecting(true);

      const lang = typeof window !== 'undefined' ? localStorage.getItem('bridge_speech_lang') || 'en-IN' : 'en-IN';

      // Try AssemblyAI first; falls back to Web Speech API internally
      await startAssemblyAI(lang);

    } catch (err) {
      console.error('startRecording error:', err);
      isRecordingRef.current = false;
      const msg =
        err.name === 'NotAllowedError'  ? 'Microphone permission denied. Click the lock icon in your browser address bar and allow microphone.' :
        err.name === 'NotFoundError'    ? 'No microphone detected. Please connect a microphone and try again.' :
        err.name === 'NotReadableError' ? 'Microphone is in use by another app. Close Zoom/Meet/Teams and retry.' :
                                          'Could not start recording. Please check browser permissions.';
      setError(msg);
      setIsConnecting(false);
      toast.error(msg, { duration: 6000 });
    }
  }, [startAssemblyAI]);

  // ── stopRecording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    wsSpeechStarted.current = false;
    clearTimeout(restartTimer.current);
    clearTimeout(silenceTimer.current);
    cancelAnimationFrame(animFrameRef.current);

    // Stop Web Speech
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    // Stop AssemblyAI WS
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ terminate_session: true }));
        }
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    // Stop audio pipeline
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (analyserRef.current) { analyserRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }

    setIsRecording(false);
    setRecordingStatus('idle');
    setVolume(0);

    // Merge any pending interim into final transcript
    setInterimTranscript(prev => {
      if (prev && prev.trim()) {
        const combined = applyCorrections((finalRef.current + ' ' + prev).trim());
        finalRef.current = combined;
        setTranscript(combined);
        updateStats(combined);
      }
      return '';
    });
  }, [updateStats]);

  const clearTranscript = useCallback(() => {
    finalRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setWordCount(0);
    setFillerWords([]);
    setFillerWordCounts({});
    setError(null);
    setVolume(0);
    setVoiceCommandDetected(null);
  }, []);

  const resetVoiceCommand = useCallback(() => {
    setVoiceCommandDetected(null);
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
    volume,
    usingFallback,
    voiceCommandDetected,
    resetVoiceCommand,
    startRecording,
    stopRecording,
    clearTranscript,
    exportTranscript,
  };
}
