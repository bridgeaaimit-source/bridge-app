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
  const websocketRef = useRef(null);
  const audioChunksRef = useRef([]);
  const finalTranscriptRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

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

      // Create WebSocket connection
      const ws = new WebSocket(
        `${config.deepgramUrl}?${new URLSearchParams({
          model: config.options.model,
          language: config.options.language,
          smart_format: config.options.smart_format.toString(),
          punctuate: config.options.punctuate.toString(),
          profanity_filter: config.options.profanity_filter.toString(),
          diarize: config.options.diarize.toString(),
          interim_results: config.options.interim_results.toString(),
          vad_events: config.options.vad_events.toString(),
          endpointing: config.options.endpointing.toString(),
        })}`
      );

      ws.onopen = () => {
        console.log('Deepgram WebSocket connected');
        setIsConnecting(false);
        setRecordingStatus('listening');
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        setError('Connection error. Retrying...');
        setIsConnecting(false);
      };

      ws.onclose = (event) => {
        console.log('Deepgram WebSocket closed:', event.code, event.reason);
        setIsConnecting(false);
        
        // Auto-reconnect if still recording
        if (isRecording && event.code !== 1000) {
          console.log('Attempting to reconnect...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectToDeepgram();
          }, 2000);
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
            sampleRate: 16000, // Deepgram prefers 16kHz
            channelCount: 1,
          }
        });
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
          // Send audio chunk to Deepgram
          websocketRef.current.send(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Only stop tracks if we created the stream (not in video mode)
        if (!existingStream) {
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Connect to Deepgram
      await connectToDeepgram();

      // Start recording
      mediaRecorder.start(250); // Send chunks every 250ms
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
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
    
    toast.success('Recording stopped');
  }, []);

  /**
   * Pause recording
   */
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
