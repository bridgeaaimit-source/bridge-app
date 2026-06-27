import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

// ─── Indian English corrections ───────────────────────────────────────────────
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
  [/\bdot net\b/gi, '.NET'],
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

// ─── Overlap & Duplication Prevention Helpers ─────────────────────────────────
function removeOverlap(text1, text2) {
  const t1 = text1.trim();
  const t2 = text2.trim();
  if (!t1) return t2;
  if (!t2) return '';

  const words1 = t1.split(/\s+/);
  const words2 = t2.split(/\s+/);

  const maxOverlap = Math.min(words1.length, words2.length);
  for (let len = maxOverlap; len > 0; len--) {
    let match = true;
    for (let i = 0; i < len; i++) {
      const w1 = words1[words1.length - len + i].toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
      const w2 = words2[i].toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
      if (w1 !== w2) {
        match = false;
        break;
      }
    }
    if (match) {
      return words2.slice(len).join(' ');
    }
  }
  return t2;
}

function safeAppend(existing, newText) {
  const cleanExisting = existing.trim();
  const cleanNew = newText.trim();
  if (!cleanExisting) return cleanNew;
  if (!cleanNew) return cleanExisting;
  
  const appended = removeOverlap(cleanExisting, cleanNew);
  if (!appended) return cleanExisting;
  return cleanExisting + ' ' + appended;
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

  // ── Stable refs for callbacks and state ──────────────────────────────────
  const onVoiceCommandRef = useRef(onVoiceCommand);
  useEffect(() => { onVoiceCommandRef.current = onVoiceCommand; }, [onVoiceCommand]);

  const voiceCommandDetectedRef = useRef(null);
  const isMountedRef = useRef(true);

  // Hardware / API resource refs
  const recognitionRef = useRef(null);        // active SpeechRecognition instance
  const wsRef = useRef(null);                 // AssemblyAI WebSocket
  const streamRef = useRef(null);             // getUserMedia stream
  const audioCtxRef = useRef(null);           // AudioContext
  const processorRef = useRef(null);          // ScriptProcessor node
  const analyserRef = useRef(null);           // AnalyserNode
  const animFrameRef = useRef(null);          // rAF for volume meter

  // State refs that must be readable inside event callbacks without closures
  const finalRef = useRef('');                // accumulated final transcript
  const interimRef = useRef('');              // track the latest interim transcript state
  const lastProcessedIndexRef = useRef(-1);   // track the last processed index of event.results in WebSpeech
  const isRecordingRef = useRef(false);       // true while session should be alive
  const isWebSpeechActiveRef = useRef(false); // guard: one WebSpeech instance at a time
  const restartTimerRef = useRef(null);       // restart debounce
  const watchdogTimerRef = useRef(null);      // detects frozen/dead recognition
  const consecutiveShortSessionsRef = useRef(0); // tracks rapid crash/restart loops
  const lastStartTimeRef = useRef(0);         // timestamp of last SpeechRecognition start
  const lastSpeechActivityRef = useRef(0);     // tracks last SpeechRecognition event

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined') {
      setSpeechLangState(localStorage.getItem('bridge_speech_lang') || 'en-IN');
    }
    return () => { isMountedRef.current = false; };
  }, []);

  const setLang = useCallback((lang) => {
    setSpeechLangState(lang);
    if (typeof window !== 'undefined') localStorage.setItem('bridge_speech_lang', lang);
  }, []);

  const updateStats = useCallback((text) => {
    if (!isMountedRef.current) return;
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    const { words: fw, counts: fc } = detectFillers(text);
    setFillerWords(fw);
    setFillerWordCounts(fc);
  }, []);

  const commitFinal = useCallback((text) => {
    if (!isMountedRef.current) return;
    const corrected = applyCorrections(text);
    finalRef.current = corrected;
    interimRef.current = '';
    setTranscript(corrected);
    setInterimTranscript('');
    updateStats(corrected);
  }, [updateStats]);

  const checkVoiceCommands = useCallback((text) => {
    const lower = text.toLowerCase();
    if (
      /\b(finish|end|stop)\s+(the\s+)?interview\b/.test(lower) ||
      /\bi\s+(want to|wanna)\s+(finish|end|stop)\b/.test(lower)
    ) {
      if (!voiceCommandDetectedRef.current) {
        voiceCommandDetectedRef.current = 'finish';
        setVoiceCommandDetected('finish');
        onVoiceCommandRef.current?.('finish');
      }
    }
  }, []);

  // ── Centralised resource cleanup ─────────────────────────────────────────
  // Safe to call multiple times; clears every audio resource without
  // touching the transcript or isRecordingRef (caller sets those).
  const cleanupResources = useCallback(() => {
    clearTimeout(restartTimerRef.current);
    clearInterval(watchdogTimerRef.current);
    cancelAnimationFrame(animFrameRef.current);

    // Merge any pending interim text into finalRef.current before resource cleanup
    if (interimRef.current && interimRef.current.trim()) {
      const combined = applyCorrections(safeAppend(finalRef.current, interimRef.current));
      finalRef.current = combined;
      setTranscript(combined);
      setInterimTranscript('');
      interimRef.current = '';
      updateStats(combined);
    }

    // Kill Web Speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    isWebSpeechActiveRef.current = false;

    // Kill AssemblyAI WebSocket
    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ terminate_session: true }));
        }
        wsRef.current.close();
      } catch { /* ignore */ }
      wsRef.current = null;
    }

    // Tear down audio pipeline
    if (processorRef.current) { try { processorRef.current.disconnect(); } catch {} processorRef.current = null; }
    if (analyserRef.current) { analyserRef.current = null; }
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, [updateStats]);

  // ── Web Speech API — continuous restart loop ─────────────────────────────
  // Accepts an optional `existingFinal` so transcript is preserved across
  // restarts (e.g. after silence warning "Continue Answering").
  const startWebSpeech = useCallback((lang) => {
    // Single-instance guard
    if (isWebSpeechActiveRef.current) return;
    isWebSpeechActiveRef.current = true;

    const SR = typeof window !== 'undefined'
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (!SR) {
      if (isMountedRef.current) {
        setError('Speech recognition requires Chrome or Edge browser.');
        setIsConnecting(false);
        setIsRecording(false);
      }
      isWebSpeechActiveRef.current = false;
      return;
    }

    // Start a mic stream for volume visualization if not already running
    if (!streamRef.current && typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      }).then(stream => {
        if (!isRecordingRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass({ sampleRate: 16000 });
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
            if (isMountedRef.current) setVolume(Math.min(100, avg * 2));
            animFrameRef.current = requestAnimationFrame(trackVolume);
          };
          trackVolume();
        }
      }).catch(err => {
        console.warn('[WebSpeech Mic Stream] failed for volume meter:', err);
      });
    }

    // Prefer en-IN for Indian English; fall back gracefully
    const useLang = lang ||
      (typeof window !== 'undefined' ? localStorage.getItem('bridge_speech_lang') || 'en-IN' : 'en-IN');

    // ── Build a fresh recognition instance with all handlers ──────────────
    const buildRec = () => {
      lastProcessedIndexRef.current = -1;
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;  // Index 0 is always best; don't iterate
      rec.lang = useLang;       // en-IN for Indian English accent optimisation

      rec.onstart = () => {
        if (!isMountedRef.current) return;
        lastStartTimeRef.current = Date.now(); // Record start time
        lastSpeechActivityRef.current = Date.now(); // Record start activity
        setIsConnecting(false);
        setIsRecording(true);
        setRecordingStatus('listening');
        // Kick watchdog — detects dead speech session if no results or start events fire for 12s
        clearInterval(watchdogTimerRef.current);
        watchdogTimerRef.current = setInterval(() => {
          if (!isRecordingRef.current) { clearInterval(watchdogTimerRef.current); return; }
          
          // 1. If recognitionRef is null, force restart
          if (!recognitionRef.current && isRecordingRef.current) {
            clearInterval(watchdogTimerRef.current);
            isWebSpeechActiveRef.current = false;
            restartTimerRef.current = setTimeout(() => {
              if (isRecordingRef.current) startWebSpeech(useLang);
            }, 500);
            return;
          }

          // 2. If it's been > 12 seconds with zero activity, abort stuck session to trigger a restart
          const timeSinceLastActivity = Date.now() - lastSpeechActivityRef.current;
          if (timeSinceLastActivity > 12000 && recognitionRef.current) {
            console.warn('[Speech Watchdog] No activity for 12s, aborting stuck recognition session.');
            try {
              recognitionRef.current.abort();
            } catch (err) {
              console.error('[Speech Watchdog] Abort failed:', err);
            }
          }
        }, 4000);
      };

      rec.onresult = (event) => {
        if (!isRecordingRef.current || !isMountedRef.current) return;
        lastSpeechActivityRef.current = Date.now(); // Record activity on result

        let interimText = '';
        let newFinalText = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const best = result[0];
          if (result.isFinal) {
            if (i > lastProcessedIndexRef.current) {
              newFinalText += best.transcript + ' ';
              lastProcessedIndexRef.current = i;
            }
          } else {
            interimText += best.transcript;
          }
        }

        interimRef.current = interimText;

        if (newFinalText.trim()) {
          const newFinal = applyCorrections(safeAppend(finalRef.current, newFinalText));
          commitFinal(newFinal);
          if (interimText && isMountedRef.current) {
            setInterimTranscript(interimText);
            updateStats(applyCorrections(safeAppend(newFinal, interimText)));
          }
          checkVoiceCommands(newFinal);
        } else if (isMountedRef.current) {
          setInterimTranscript(interimText);
          const currentTotalText = applyCorrections(safeAppend(finalRef.current, interimText));
          updateStats(currentTotalText);
        }
      };

      rec.onerror = (e) => {
        if (!isRecordingRef.current) return;
        if (e.error === 'no-speech') return;           // normal — user paused
        if (e.error === 'audio-capture') return;       // transient; onend will restart
        if (e.error === 'not-allowed') {
          if (isMountedRef.current) {
            setError('Microphone permission denied. Please allow access in your browser settings.');
          }
          isRecordingRef.current = false;
          return;
        }
        if (e.error === 'network') {
          // Network glitch — onend will fire and restart
          console.warn('[Speech] network error, will auto-restart on onend');
          return;
        }
        if (e.error !== 'aborted') console.warn('[Speech] error:', e.error);
      };

      rec.onend = () => {
        recognitionRef.current = null;

        // Merge any pending interim text into finalRef.current before restart
        if (interimRef.current && interimRef.current.trim()) {
          const combined = applyCorrections(safeAppend(finalRef.current, interimRef.current));
          finalRef.current = combined;
          setTranscript(combined);
          setInterimTranscript('');
          interimRef.current = '';
          updateStats(combined);
        }

        if (!isRecordingRef.current) {
          isWebSpeechActiveRef.current = false;
          return;
        }

        // Check if the session was extremely short (less than 1.5 seconds)
        const sessionDuration = Date.now() - lastStartTimeRef.current;
        if (sessionDuration < 1500) {
          consecutiveShortSessionsRef.current += 1;
        } else {
          consecutiveShortSessionsRef.current = 0;
        }

        // If it failed 3 times consecutively, stop recording to prevent infinite flashing mic
        if (consecutiveShortSessionsRef.current >= 3) {
          console.warn('[Speech] Stopping restart loop: SpeechRecognition sessions ending too fast.');
          consecutiveShortSessionsRef.current = 0;
          stopRecording();
          if (isMountedRef.current) {
            setError('Microphone capture failed or was interrupted. Please check permissions or disconnect other apps using the mic.');
            toast.error('Microphone connection failed. Please check your browser mic permissions.');
          }
          return;
        }

        // Auto-restart after a short delay to prevent mid-sentence interruption
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          if (!isRecordingRef.current) { isWebSpeechActiveRef.current = false; return; }
          isWebSpeechActiveRef.current = false; // allow buildRec to proceed
          try {
            const newRec = buildRec();
            newRec.start();
            recognitionRef.current = newRec;
            isWebSpeechActiveRef.current = true;
          } catch { /* will retry on next watchdog tick */ }
        }, 400);
      };

      return rec;
    };

    try {
      const rec = buildRec();
      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.error('[Speech] failed to start:', e);
      isWebSpeechActiveRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitFinal, updateStats, checkVoiceCommands]);

  // ── AssemblyAI real-time via direct WebSocket ─────────────────────────────
  const startAssemblyAI = useCallback(async (lang) => {
    try {
      const res = await fetch('/api/assemblyai-token');
      if (!res.ok) throw new Error('Token fetch failed');
      const { token } = await res.json();
      if (!token) throw new Error('No token');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      streamRef.current = stream;

      const AudioContextClass = typeof window !== 'undefined'
        ? (window.AudioContext || window.webkitAudioContext)
        : null;
      if (!AudioContextClass) throw new Error('AudioContext not supported');
      const audioCtx = new AudioContextClass({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;
      const actualSampleRate = audioCtx.sampleRate || 16000;

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
        if (isMountedRef.current) setVolume(Math.min(100, avg * 2));
        animFrameRef.current = requestAnimationFrame(trackVolume);
      };
      trackVolume();

      // Derive ISO 639-1 code for AssemblyAI (en-IN → en, hi-IN → hi, etc.)
      const isoLang = (lang || 'en-IN').split('-')[0].toLowerCase() || 'en';

      const ws = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=${actualSampleRate}&token=${token}&language_code=${isoLang}&word_boost=${encodeURIComponent(
          JSON.stringify(['React','JavaScript','Python','Node','MongoDB','SQL','MySQL','PostgreSQL',
            'AWS','GCP','Azure','GitHub','Docker','Kubernetes','TypeScript',
            'Infosys','TCS','Wipro','Accenture','Flipkart','IIT','NIT','BITS'])
        )}&boost_param=high`
      );

      // Connection timeout
      const wsTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          ws.close();
        }
      }, 6000);

      ws.onopen = () => {
        clearTimeout(wsTimeout);
        wsRef.current = ws;
        if (isMountedRef.current) {
          setIsConnecting(false);
          setIsRecording(true);
          setRecordingStatus('listening');
        }

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
        if (!isRecordingRef.current) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.message_type === 'PartialTranscript' && msg.text) {
            if (isMountedRef.current) setInterimTranscript(msg.text);
          } else if (msg.message_type === 'FinalTranscript' && msg.text) {
            const newFinal = applyCorrections(safeAppend(finalRef.current, msg.text));
            commitFinal(newFinal);
            checkVoiceCommands(newFinal);
          }
        } catch { /* ignore malformed JSON */ }
      };

      ws.onerror = () => {
        clearTimeout(wsTimeout);
        // onclose will fire next, which triggers Web Speech fallback
      };

      ws.onclose = () => {
        wsRef.current = null;

        // Merge any pending interim text into finalRef.current before fallback
        if (interimRef.current && interimRef.current.trim()) {
          const combined = applyCorrections(safeAppend(finalRef.current, interimRef.current));
          finalRef.current = combined;
          setTranscript(combined);
          setInterimTranscript('');
          interimRef.current = '';
          updateStats(combined);
        }

        if (isRecordingRef.current) {
          if (isMountedRef.current) setUsingFallback(true);
          startWebSpeech(lang);
        }
      };

    } catch (err) {
      console.warn('[AssemblyAI] unavailable, falling back to Web Speech API:', err.message);
      if (isMountedRef.current) setUsingFallback(true);
      startWebSpeech(lang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitFinal, checkVoiceCommands, startWebSpeech]);

  // ── startRecording ────────────────────────────────────────────────────────
  // preserveTranscript=true: keep finalRef as-is (used by "Continue Answering")
  const startRecording = useCallback(async ({ preserveTranscript = false } = {}) => {
    consecutiveShortSessionsRef.current = 0; // Reset consecutive restart failures on user start
    lastSpeechActivityRef.current = Date.now(); // Initialize activity timestamp on user start
    // Guard: stop any existing session cleanly before starting a new one
    if (isRecordingRef.current) {
      cleanupResources();
      // Brief pause ensures previous mic track is fully released
      await new Promise(r => setTimeout(r, 120));
    }

    if (!preserveTranscript) {
      // Fresh question — wipe the buffer
      finalRef.current = '';
      interimRef.current = '';
      lastProcessedIndexRef.current = -1;
      if (isMountedRef.current) {
        setTranscript('');
        setInterimTranscript('');
        setWordCount(0);
        setFillerWords([]);
        setFillerWordCounts({});
      }
    }
    // If preserveTranscript=true, finalRef retains its accumulated content
    // and the next spoken words will be appended to it automatically.

    try {
      if (isMountedRef.current) {
        setError(null);
        setIsConnecting(true);
        setUsingFallback(false);
        setVoiceCommandDetected(null);
      }
      voiceCommandDetectedRef.current = null;
      isRecordingRef.current = true;
      isWebSpeechActiveRef.current = false;

      const lang = typeof window !== 'undefined'
        ? localStorage.getItem('bridge_speech_lang') || 'en-IN'
        : 'en-IN';

      await startAssemblyAI(lang);

    } catch (err) {
      console.error('[startRecording] error:', err);
      isRecordingRef.current = false;
      if (isMountedRef.current) {
        const msg =
          err.name === 'NotAllowedError'  ? 'Microphone permission denied. Click the lock icon in your browser address bar and allow microphone.' :
          err.name === 'NotFoundError'    ? 'No microphone detected. Please connect a microphone and try again.' :
          err.name === 'NotReadableError' ? 'Microphone is in use by another app. Close Zoom/Meet/Teams and retry.' :
                                            'Could not start recording. Please check browser permissions.';
        setError(msg);
        setIsConnecting(false);
        toast.error(msg, { duration: 6000 });
      }
    }
  }, [startAssemblyAI, cleanupResources]);

  // ── stopRecording ─────────────────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    cleanupResources();

    if (!isMountedRef.current) return;
    setIsRecording(false);
    setRecordingStatus('idle');
    setVolume(0);
  }, [cleanupResources]);

  // ── clearTranscript ───────────────────────────────────────────────────────
  const clearTranscript = useCallback(() => {
    finalRef.current = '';
    interimRef.current = '';
    lastProcessedIndexRef.current = -1;
    if (!isMountedRef.current) return;
    setTranscript('');
    setInterimTranscript('');
    setWordCount(0);
    setFillerWords([]);
    setFillerWordCounts({});
    setError(null);
    setVolume(0);
    setVoiceCommandDetected(null);
    voiceCommandDetectedRef.current = null;
  }, []);

  const resetVoiceCommand = useCallback(() => {
    setVoiceCommandDetected(null);
    voiceCommandDetectedRef.current = null;
  }, []);

  const exportTranscript = useCallback(() => {
    const text = finalRef.current || interimTranscript;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Transcript exported');
  }, [interimTranscript]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      cleanupResources();
    };
  }, [cleanupResources]);

  return {
    isRecording,
    isConnecting,
    transcript,
    interimTranscript,
    fullTranscript: applyCorrections(safeAppend(transcript, interimTranscript)),
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
