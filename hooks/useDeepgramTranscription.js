import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for real-time transcription using Deepgram streaming API
 * Handles continuous audio recording, streaming, and transcript management
 */
export function useDeepgramTranscription() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [fillerWords, setFillerWords] = useState([]);
  const [fillerWordCounts, setFillerWordCounts] = useState({});
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, listening, paused, processing
  const [error, setError] = useState(null);

  // Refs for audio and WebSocket
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const websocketRef = useRef(null);
  const audioChunksRef = useRef([]);
  const finalTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const recognitionRef = useRef(null);
  const useFallbackRef = useRef(false);

  // Filler word patterns
  const fillerPatterns = useRef([
    /\b(um|uh|umm|uhh)\b/gi,
    /\b(like|you know|kind of|sort of)\b/gi,
    /\b(actually|basically|literally)\b/gi,
    /\b(I mean|you see)\b/gi,
    /\b(so|anyway|well)\b/gi
  ]);

  /**
   * Detect filler words in text
   */
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
    
    return {
      words: [...new Set(detected)],
      counts
    };
  }, []);

  /**
   * Update transcript and detect filler words
   */
  const updateTranscript = useCallback((newTranscript, isFinal = false) => {
    if (isFinal) {
      finalTranscriptRef.current = newTranscript;
      setTranscript(newTranscript);
      setInterimTranscript('');
    } else {
      setInterimTranscript(newTranscript);
    }

    // Update word count
    const words = newTranscript.trim().split(/\s+/).filter(w => w.length > 0);
    setWordCount(words.length);

    // Detect filler words
    const { words: fillers, counts } = detectFillerWords(newTranscript);
    setFillerWords(fillers);
    setFillerWordCounts(counts);
  }, [detectFillerWords]);

  /**
   * Handle WebSocket message from Deepgram
   */
  const handleWebSocketMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.channel && data.channel.alternatives) {
        const alternative = data.channel.alternatives[0];
        
        if (alternative.transcript) {
          const isFinal = data.is_final;
          const currentFinal = finalTranscriptRef.current;
          
          if (isFinal) {
            // Append final transcript
            const newTranscript = currentFinal + ' ' + alternative.transcript;
            updateTranscript(newTranscript.trim(), true);
          } else {
            // Update interim transcript
            updateTranscript(currentFinal + ' ' + alternative.transcript, false);
          }
        }

        // Handle speech_started and speech_ended events
        if (data.type === 'SpeechStarted') {
          setRecordingStatus('listening');
        } else if (data.type === 'SpeechEnded') {
          setRecordingStatus('listening'); // Keep listening, don't stop
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [updateTranscript]);

  /**
   * Start Web Speech API fallback (built-in browser transcription)
   */
  const startWebSpeechAPI = useCallback(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser');
      setIsConnecting(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Web Speech API started');
      setIsConnecting(false);
      setRecordingStatus('listening');
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      const currentFinal = finalTranscriptRef.current;
      const newTranscript = currentFinal + finalTranscript;
      const displayTranscript = newTranscript + interimTranscript;

      updateTranscript(displayTranscript.trim(), false);
      finalTranscriptRef.current = displayTranscript.trim();
    };

    recognition.onerror = (event) => {
      console.error('Web Speech API error:', event.error);
      if (event.error === 'no-speech') {
        // Restart if no speech
        if (isRecording) {
          recognition.start();
        }
      } else if (event.error !== 'aborted') {
        setError('Speech recognition error: ' + event.error);
        setIsConnecting(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if still recording
      if (isRecording) {
        try {
          recognition.start();
        } catch (e) {
          console.log('Speech recognition restart failed:', e);
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    useFallbackRef.current = true;
  }, [isRecording, updateTranscript]);

  /**
   * Connect to Deepgram WebSocket
   */
  const connectToDeepgram = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);

      // Get Deepgram config from API
      const response = await fetch('/api/transcription/stream', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to get transcription config');
      }

      const config = await response.json();

      if (!config.apiKey) {
        throw new Error('Deepgram API key not configured');
      }

      // Create WebSocket connection with API key as query parameter (required for browser)
      const wsUrl = new URL(config.deepgramUrl);
      wsUrl.searchParams.append('token', config.apiKey);
      wsUrl.searchParams.append('model', config.options.model);
      wsUrl.searchParams.append('language', config.options.language);
      wsUrl.searchParams.append('smart_format', config.options.smart_format.toString());
      wsUrl.searchParams.append('punctuate', config.options.punctuate.toString());
      wsUrl.searchParams.append('profanity_filter', config.options.profanity_filter.toString());
      wsUrl.searchParams.append('diarize', config.options.diarize.toString());
      wsUrl.searchParams.append('interim_results', config.options.interim_results.toString());
      wsUrl.searchParams.append('vad_events', config.options.vad_events.toString());
      wsUrl.searchParams.append('endpointing', config.options.endpointing.toString());

      const ws = new WebSocket(wsUrl.toString());

      ws.onopen = () => {
        console.log('Deepgram WebSocket connected');
        setIsConnecting(false);
        setRecordingStatus('listening');
      };

      ws.onmessage = (event) => {
          console.log('Deepgram message received:', event.data.substring(0, 200));
          handleWebSocketMessage(event);
        };

      ws.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        setError('Connection error. Retrying...');
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('Deepgram WebSocket closed:', event.code, event.reason);
        setIsConnecting(false);

        // If connection failed, fall back to Web Speech API
        if (event.code !== 1000) {
          console.log('Deepgram failed, falling back to Web Speech API');
          toast.error('Deepgram unavailable, using built-in transcription');
          startWebSpeechAPI();
        }
      };

      websocketRef.current = ws;
    } catch (error) {
      console.error('Failed to connect to Deepgram:', error);
      setError(error.message);
      setIsConnecting(false);
      toast.error('Failed to connect to transcription service');
    }
  }, [handleWebSocketMessage, isRecording]);

  /**
   * Start audio recording
   * @param {MediaStream|null} existingStream - Optional existing stream (for video mode)
   */
  const startRecording = useCallback(async (existingStream = null) => {
    try {
      setError(null);

      let stream = existingStream;

      // If no existing stream, get microphone access
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

      // Connect to Deepgram first
      await connectToDeepgram();

      // Check if we should use AudioContext (video mode) or MediaRecorder (voice mode)
      if (existingStream) {
        // Video mode: Use AudioContext to avoid MediaRecorder conflict
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });
        audioContextRef.current = audioContext;

        // Get audio track from the stream
        const audioTrack = stream.getAudioTracks()[0];
        if (!audioTrack) {
          throw new Error('No audio track in stream');
        }

        const audioStream = new MediaStream([audioTrack]);
        const source = audioContext.createMediaStreamSource(audioStream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (e) => {
          if (websocketRef.current?.readyState === WebSocket.OPEN) {
            const audioData = e.inputBuffer.getChannelData(0);
            // Convert Float32Array to Int16Array
            const int16Data = new Int16Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
              int16Data[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
            }
            websocketRef.current.send(int16Data.buffer);
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);
        scriptProcessorRef.current = processor;
      } else {
        // Voice mode: Use MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 16000,
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
            console.log('Sending audio chunk:', event.data.size, 'bytes');
            websocketRef.current.send(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(250);
      }

      audioChunksRef.current = [];
      setIsRecording(true);
      setRecordingStatus('listening');

      toast.success('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      setError(error.message);

      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone.');
      } else {
        toast.error('Failed to start recording. Please try again.');
      }
    }
  }, [connectToDeepgram]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    // Stop MediaRecorder (voice mode)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop AudioContext (video mode)
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Stop Web Speech API fallback
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Clear timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setIsRecording(false);
    setRecordingStatus('idle');
    setInterimTranscript('');
    useFallbackRef.current = false;

    toast.success('Recording stopped');
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingStatus('paused');
    }
  }, []);

  /**
   * Resume recording
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingStatus('listening');
    }
  }, []);

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setWordCount(0);
    setFillerWords([]);
    setFillerWordCounts({});
    setError(null);
  }, []);

  /**
   * Export transcript as text
   */
  const exportTranscript = useCallback(() => {
    const fullTranscript = transcript || interimTranscript;
    const blob = new Blob([fullTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Transcript exported');
  }, [transcript, interimTranscript]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

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
    pauseRecording,
    resumeRecording,
    clearTranscript,
    exportTranscript,
  };
}
