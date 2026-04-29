import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

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

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const websocketRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const isRecordingRef = useRef(false);
  const recognitionRef = useRef(null);
  const webSpeechStartedRef = useRef(false); // prevent double-start

  // Indian English filler words — covers both standard and desi fillers
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

  const updateTranscript = useCallback((newTranscript, isFinal = false) => {
    if (isFinal) {
      finalTranscriptRef.current = newTranscript;
      setTranscript(newTranscript);
      setInterimTranscript('');
    } else {
      setInterimTranscript(newTranscript);
    }
    const words = newTranscript.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);
    const { words: fillers, counts } = detectFillerWords(newTranscript);
    setFillerWords(fillers);
    setFillerWordCounts(counts);
  }, [detectFillerWords]);

  const handleWebSocketMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.channel?.alternatives) {
        const alt = data.channel.alternatives[0];
        if (alt?.transcript) {
          const isFinal = data.is_final;
          const base = finalTranscriptRef.current;
          const combined = (base + ' ' + alt.transcript).trim();
          updateTranscript(combined, isFinal);
        }
        if (data.type === 'SpeechStarted') setRecordingStatus('listening');
      }
    } catch (e) {
      console.error('WS message parse error:', e);
    }
  }, [updateTranscript]);

  // Web Speech API — primary reliable path for voice recording
  const startWebSpeechAPI = useCallback(() => {
    // Guard: prevent double-start (called from both onerror and onclose paths)
    if (webSpeechStartedRef.current) return;
    webSpeechStartedRef.current = true;

    if (typeof window === 'undefined') return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Please use Chrome or Edge.');
      setIsConnecting(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-IN'; // Indian English

    recognition.onstart = () => {
      setIsConnecting(false);
      setIsRecording(true);
      setRecordingStatus('listening');
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      if (final) {
        const newFinal = (finalTranscriptRef.current + ' ' + final).trim();
        finalTranscriptRef.current = newFinal;
        updateTranscript((newFinal + ' ' + interim).trim(), false);
      } else if (interim) {
        updateTranscript((finalTranscriptRef.current + ' ' + interim).trim(), false);
      }
    };

    recognition.onerror = (event) => {
      if (!isRecordingRef.current) return;
      // no-speech and audio-capture are non-fatal — just restart
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        try { recognition.stop(); } catch {}
        // onend will restart
      } else if (event.error === 'network') {
        // network error — retry after short delay
        setTimeout(() => { if (isRecordingRef.current) { try { recognition.start(); } catch {} } }, 1000);
      } else if (event.error !== 'aborted') {
        console.warn('Speech recognition error:', event.error);
      }
    };

    recognition.onend = () => {
      if (isRecordingRef.current) {
        // Auto-restart to maintain continuous recording
        setTimeout(() => {
          if (isRecordingRef.current && recognitionRef.current) {
            try { recognition.start(); } catch {}
          }
        }, 100);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      webSpeechStartedRef.current = false;
    }
  }, [updateTranscript]);

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
        if (!config.apiKey) throw new Error('No API key');

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

        // 5-second timeout — if Deepgram doesn't open, reject and use Web Speech API
        const timeout = setTimeout(() => {
          try { ws.close(); } catch {}
          settle(reject, new Error('Deepgram timeout'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          setIsConnecting(false);
          setRecordingStatus('listening');
          websocketRef.current = ws;
          settle(resolve, undefined);
        };

        ws.onmessage = handleWebSocketMessage;

        ws.onerror = () => {
          clearTimeout(timeout);
          setIsConnecting(false);
          settle(reject, new Error('WebSocket failed'));
        };

        ws.onclose = (event) => {
          setIsConnecting(false);
          // Only fall back if we haven't already resolved (i.e. WS was never open)
          // AND if this wasn't a clean close. The settled guard prevents double Web Speech start.
          if (!settled && event.code !== 1000) {
            settle(reject, new Error('WebSocket closed before open'));
          }
        };

        websocketRef.current = ws;
      } catch (err) {
        setIsConnecting(false);
        settle(reject, err);
      }
    });
  }, [handleWebSocketMessage]);

  const startRecording = useCallback(async (existingStream = null) => {
    try {
      setError(null);
      isRecordingRef.current = true;
      webSpeechStartedRef.current = false; // reset for each new recording session

      let stream = existingStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000,
            channelCount: 1,
          }
        });
      }

      // Try Deepgram first — silently fall back to Web Speech API if unavailable
      try {
        await connectToDeepgram();
      } catch {
        // Silent fallback — no toast, just use Web Speech API
        startWebSpeechAPI();
        setIsRecording(true);
        return;
      }

      if (existingStream) {
        // Video mode: use AudioContext → ScriptProcessor → WebSocket
        // This avoids MediaRecorder conflict with the video recorder
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) throw new Error('No audio track in video stream');

        const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          if (websocketRef.current?.readyState === WebSocket.OPEN) {
            const float32 = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(float32.length);
            for (let i = 0; i < float32.length; i++) {
              int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
            }
            websocketRef.current.send(int16.buffer);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        scriptProcessorRef.current = processor;
      } else {
        // Voice mode: MediaRecorder → WebSocket
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus' : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
            websocketRef.current.send(event.data);
          }
        };

        recorder.onstop = () => stream.getTracks().forEach(t => t.stop());

        mediaRecorderRef.current = recorder;
        recorder.start(250);
      }

      setIsRecording(true);
      setRecordingStatus('listening');
      toast.success('Recording started');
    } catch (err) {
      console.error('Failed to start recording:', err);
      isRecordingRef.current = false;
      setError(err.message);
      if (err.name === 'NotAllowedError') toast.error('Microphone access denied. Please allow it.');
      else if (err.name === 'NotFoundError') toast.error('No microphone found.');
      else toast.error('Failed to start recording. Please try again.');
    }
  }, [connectToDeepgram, startWebSpeechAPI]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    webSpeechStartedRef.current = false;

    if (mediaRecorderRef.current?.state !== 'inactive') {
      try { mediaRecorderRef.current.stop(); } catch (e) { /* ignore */ }
    }

    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close(1000, 'Recording stopped');
      websocketRef.current = null;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsRecording(false);
    setRecordingStatus('idle');
    setInterimTranscript('');
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
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
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
    startRecording,
    stopRecording,
    clearTranscript,
    exportTranscript,
  };
}
