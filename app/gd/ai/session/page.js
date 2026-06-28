'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Canvas, Button, Card } from '@/components/DesignSystem';
import ParticipantAvatar from '@/components/gd-ai/ParticipantAvatar';
import TranscriptPanel from '@/components/gd-ai/TranscriptPanel';
import SpeakButton from '@/components/gd-ai/SpeakButton';
import GDTimer from '@/components/gd-ai/GDTimer';
import AnalysisLoader from '@/components/gd-ai/AnalysisLoader';
import { buildModeratorOpening, buildModeratorClosing, analyzeSession } from '@/lib/gdModerator';
import { selectNextSpeaker, determineTurnType, updateSpeakerStats, detectAddressedPersona } from '@/lib/gdTurnManager';
import { useAssemblyAI } from '@/hooks/useAssemblyAI';
import toast from 'react-hot-toast';

export default function GDAISessionPage() {
  const router = useRouter();

  // STT Hook
  const {
    transcript,
    interimTranscript,
    fullTranscript,
    isRecording,
    volume,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useAssemblyAI();

  // Session Config State
  const [setupData, setSetupData] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [evalLoading, setEvalLoading] = useState(false);

  // Discussion State
  const [turns, setTurns] = useState([]);
  const [sessionPhase, setSessionPhase] = useState('opening'); // opening | debate | closing
  const [speakerState, setSpeakerState] = useState('idle'); // idle | ai_thinking | ai_speaking | queued | active
  const [activeSpeakerId, setActiveSpeakerId] = useState(null);
  const [streamingSpeakerId, setStreamingSpeakerId] = useState(null);
  const [streamingText, setStreamingText] = useState('');

  // Refs for tracking async state (avoids stale closures in audio & SSE callbacks)
  const turnsRef = useRef([]);
  const isSessionActiveRef = useRef(false);
  const elapsedSecondsRef = useRef(0);
  const speakerStatsRef = useRef({});
  const addressedPersonaIdRef = useRef(null);
  const sessionPhaseRef = useRef('opening');
  const jumpInRequestedRef = useRef(false);
  
  // Hardware refs
  const currentAudioRef = useRef(null);
  const discussAbortControllerRef = useRef(null);
  const isEndingRef = useRef(false);
  const typingIntervalRef = useRef(null);

  // Sync turnsRef with state
  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  // Load Setup Data on mount
  useEffect(() => {
    const rawSetup = sessionStorage.getItem('gdSetup');
    if (!rawSetup) {
      toast.error('Session setup not found. Redirecting to hub.');
      router.push('/gd/ai');
      return;
    }

    try {
      const parsed = JSON.parse(rawSetup);
      setSetupData(parsed);
      
      // Initialize speaker stats
      speakerStatsRef.current = {
        aggressive: { turnCount: 0, lastTurnIndex: -99 },
        analytical: { turnCount: 0, lastTurnIndex: -99 },
        contrarian: { turnCount: 0, lastTurnIndex: -99 },
        balanced: { turnCount: 0, lastTurnIndex: -99 },
        student: { turnCount: 0, lastTurnIndex: -99 },
      };
    } catch {
      toast.error('Invalid setup config. Redirecting.');
      router.push('/gd/ai');
    }
  }, [router]);

  // Count-up Timer Interval
  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        elapsedSecondsRef.current = next;
        
        // Auto-end at 10 minutes (600 seconds)
        if (next >= 600) {
          clearInterval(interval);
          handleEndSession();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isSessionActive]);

  // Start discussion once setupData is populated
  useEffect(() => {
    if (!setupData || isSessionActive) return;
    
    // Start session
    setIsSessionActive(true);
    isSessionActiveRef.current = true;
    sessionPhaseRef.current = 'opening';
    setSessionPhase('opening');

    // Trigger Moderator Opening
    triggerModeratorOpening();
  }, [setupData]);

  // Helper: Save current session transcript progress to Firestore via API
  const saveProgress = async (currentTurns) => {
    if (!setupData) return;
    try {
      await fetch('/api/gd-ai/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: setupData.uid,
          sessionData: {
            sessionId: setupData.sessionId,
            topic: setupData.topic,
            category: setupData.category,
            difficulty: setupData.difficulty,
            turns: currentTurns.map(t => ({
              speakerId: t.speakerId,
              speakerName: t.personaName || t.speakerId,
              text: t.text,
              type: t.type || 'debate'
            })),
            durationSeconds: elapsedSecondsRef.current
          }
        })
      });
    } catch (err) {
      console.error('[gd-ai/session saveProgress] error:', err);
    }
  };

  // Helper: Play Text-to-Speech using server API, falling back to Web Speech Synthesis API
  const playTextToSpeech = async (text, voiceRole, signal) => {
    try {
      const response = await fetch('/api/gd-ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voiceRole: voiceRole,
          uid: setupData?.uid || 'anonymous',
        }),
        signal,
      });

      if (!response.ok) throw new Error('TTS server responded with non-200');

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      await new Promise((resolve, reject) => {
        if (signal?.aborted) {
          URL.revokeObjectURL(audioUrl);
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }

        const onAbort = () => {
          audio.pause();
          URL.revokeObjectURL(audioUrl);
          reject(new DOMException('Aborted', 'AbortError'));
        };
        signal?.addEventListener('abort', onAbort);

        audio.onended = () => {
          signal?.removeEventListener('abort', onAbort);
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = () => {
          signal?.removeEventListener('abort', onAbort);
          URL.revokeObjectURL(audioUrl);
          reject(new Error('Audio playback error'));
        };
        audio.play().catch((err) => {
          signal?.removeEventListener('abort', onAbort);
          URL.revokeObjectURL(audioUrl);
          reject(err);
        });
      });
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      console.warn(`[TTS API Fallback] Using window.speechSynthesis for role: ${voiceRole}`, err);

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        await new Promise((resolve, reject) => {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.9; // Professional medium-slow rate

          const voices = window.speechSynthesis.getVoices();
          const enVoices = voices.filter(v => v.lang.startsWith('en'));
          let selectedVoice = null;
          if (voiceRole === 'moderator' || voiceRole === 'contrarian') {
            selectedVoice = enVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('google uk english female')) || enVoices[0];
          } else {
            selectedVoice = enVoices.find(v => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david') || v.name.toLowerCase().includes('google uk english male')) || enVoices[0];
          }
          if (selectedVoice) utterance.voice = selectedVoice;

          if (signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }

          const safetyTimer = setTimeout(() => {
            console.warn('[SpeechSynthesis] Safety timeout triggered. Resolving to prevent block.');
            signal?.removeEventListener('abort', onAbort);
            resolve();
          }, Math.max(6000, text.split(' ').length * 600 + 4000));

          const onAbort = () => {
            clearTimeout(safetyTimer);
            window.speechSynthesis.cancel();
            reject(new DOMException('Aborted', 'AbortError'));
          };
          signal?.addEventListener('abort', onAbort);

          utterance.onend = () => {
            clearTimeout(safetyTimer);
            signal?.removeEventListener('abort', onAbort);
            resolve();
          };
          utterance.onerror = (e) => {
            clearTimeout(safetyTimer);
            signal?.removeEventListener('abort', onAbort);
            if (e.error === 'interrupted') {
              reject(new DOMException('Aborted', 'AbortError'));
            } else {
              resolve(); // Resolve to not block discussion progression
            }
          };

          currentAudioRef.current = {
            pause: () => {
              clearTimeout(safetyTimer);
              window.speechSynthesis.cancel();
            }
          };

          window.speechSynthesis.speak(utterance);
        });
      } else {
        const readingTimeMs = Math.max(3000, text.split(' ').length * 350);
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, readingTimeMs);
          signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }
    }
  };

  // Helper: Typingly animation of text word-by-word synchronized with voice playback
  const speakAndType = async (speakerId, personaName, text, turnType, signal) => {
    const newTurn = {
      speakerId,
      personaName,
      text: '',
      type: turnType,
      typing: true,
      timestamp: new Date().toISOString(),
    };

    setTurns((prev) => [...prev, newTurn]);

    const words = text.trim().split(/\s+/);
    let currentWordIndex = 0;
    const typingDelay = 320; // 320ms per word (~180 WPM medium-slow reading speed)

    const typingPromise = new Promise((resolve) => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);

      typingIntervalRef.current = setInterval(() => {
        if (signal?.aborted) {
          clearInterval(typingIntervalRef.current);
          resolve();
          return;
        }

        if (currentWordIndex < words.length) {
          const currentText = words.slice(0, currentWordIndex + 1).join(' ');
          currentWordIndex++;
          setTurns((prev) => {
            if (prev.length === 0) return prev;
            const nextTurns = [...prev];
            nextTurns[nextTurns.length - 1] = {
              ...nextTurns[nextTurns.length - 1],
              text: currentText,
            };
            return nextTurns;
          });
        } else {
          clearInterval(typingIntervalRef.current);
          setTurns((prev) => {
            if (prev.length === 0) return prev;
            const nextTurns = [...prev];
            const lastTurn = { ...nextTurns[nextTurns.length - 1] };
            delete lastTurn.typing;
            nextTurns[nextTurns.length - 1] = lastTurn;
            return nextTurns;
          });
          resolve();
        }
      }, typingDelay);
    });

    const speakPromise = playTextToSpeech(text, speakerId, signal);

    await Promise.all([typingPromise, speakPromise]);
  };

  // Moderator Opening
  const triggerModeratorOpening = async () => {
    if (!setupData) return;

    const openingText = buildModeratorOpening(
      setupData.topic,
      ['Vikram', 'Rohan', 'Anjali', 'Dev'],
      setupData.studentName
    );

    setSpeakerState('ai_speaking');
    setActiveSpeakerId('moderator');

    const controller = new AbortController();
    discussAbortControllerRef.current = controller;

    try {
      await speakAndType('moderator', 'Nalini', openingText, 'opening', controller.signal);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Moderator opening voice playback aborted');
        return;
      }
      console.error('Moderator opening voice failed:', err);
    }

    const openingTurn = {
      speakerId: 'moderator',
      text: openingText,
      type: 'opening',
      timestamp: new Date().toISOString(),
    };

    // Save initial progress to Firestore
    await saveProgress([openingTurn]);

    // Transition out of opening phase and trigger first AI speaker
    sessionPhaseRef.current = 'debate';
    setSessionPhase('debate');
    setSpeakerState('idle');
    setActiveSpeakerId(null);

    // Call first turn
    setTimeout(() => {
      runNextTurn();
    }, 800);
  };

  // Helper: Parse streamed SSE events manually
  const parseSSEStream = async (response, onToken, onComplete) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.slice(6).trim();
            const data = JSON.parse(jsonStr);
            if (data.type === 'token') {
              onToken(data.text);
            } else if (data.type === 'done') {
              onComplete(data.text);
            }
          } catch (err) {
            console.error('SSE line error:', err);
          }
        }
      }
    }
  };

  // Core Turn Orchestration Loop
  const runNextTurn = async () => {
    if (!isSessionActiveRef.current || jumpInRequestedRef.current) return;

    const elapsed = elapsedSecondsRef.current;
    if (elapsed >= 600) {
      handleEndSession();
      return;
    }

    const currentTurns = turnsRef.current;
    const lastSpeakerId = currentTurns[currentTurns.length - 1]?.speakerId || 'moderator';
    const personaNames = {
      aggressive: 'Vikram',
      analytical: 'Rohan',
      contrarian: 'Anjali',
      balanced: 'Dev',
    };

    // 1. Check Moderator Interventions
    const directiveResult = analyzeSession({
      turns: currentTurns,
      topic: setupData.topic,
      elapsedSeconds: elapsed,
      totalDurationSeconds: 600,
      studentName: setupData.studentName,
      personaNames,
      currentPhase: sessionPhaseRef.current,
    });

    if (directiveResult.shouldIntervene) {
      if (directiveResult.newPhase) {
        sessionPhaseRef.current = directiveResult.newPhase;
        setSessionPhase(directiveResult.newPhase);
      }

      setSpeakerState('ai_thinking');
      setStreamingSpeakerId('moderator');
      setStreamingText('');

      const controller = new AbortController();
      discussAbortControllerRef.current = controller;

      try {
        const response = await fetch('/api/gd-ai/discuss', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: setupData.topic,
            personaId: 'moderator',
            sessionPhase: sessionPhaseRef.current,
            turns: currentTurns,
            elapsedMinutes: elapsed / 60,
            moderatorDirective: directiveResult.directive,
            studentName: setupData.studentName,
            personaNames,
            isModerator: true,
            uid: setupData.uid,
          }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Moderator generation failed');

        let finalModText = '';
        await parseSSEStream(
          response,
          (tok) => {
            finalModText += tok;
            setStreamingText(finalModText);
          },
          (doneTxt) => {
            finalModText = doneTxt;
          }
        );

        setSpeakerState('ai_speaking');
        setActiveSpeakerId('moderator');
        setStreamingText('');
        setStreamingSpeakerId(null);

        // Speak and type mod text word-by-word
        await speakAndType('moderator', 'Nalini', finalModText, 'moderator', controller.signal);

        const newTurn = {
          speakerId: 'moderator',
          text: finalModText,
          type: 'moderator',
          timestamp: new Date().toISOString(),
        };
        await saveProgress([...currentTurns, newTurn]);

        setSpeakerState('idle');
        setActiveSpeakerId(null);
        
        // Recurse next turn
        setTimeout(() => {
          runNextTurn();
        }, 1000);
        return;

      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Moderator intervention aborted via student interruption.');
          return;
        }
        console.error('Moderator intervention error:', err);
        setSpeakerState('idle');
        setStreamingSpeakerId(null);
        setStreamingText('');
        setTimeout(() => {
          runNextTurn();
        }, 1000);
        return;
      }
    }

    // 2. Select next Speaker
    let studentSilentCount = 0;
    for (let i = currentTurns.length - 1; i >= 0; i--) {
      if (currentTurns[i].speakerId === 'student') break;
      if (currentTurns[i].speakerId !== 'moderator') studentSilentCount++;
    }

    const nextSpeaker = selectNextSpeaker({
      lastSpeakerId,
      forcedSpeakerId: directiveResult.forcedSpeakerId,
      personaIds: ['aggressive', 'analytical', 'contrarian', 'balanced'],
      speakerStats: speakerStatsRef.current,
      currentTurnIndex: currentTurns.length,
      studentSilentTurns: studentSilentCount,
      addressedPersonaId: addressedPersonaIdRef.current,
      sessionPhase: sessionPhaseRef.current,
    });

    // Yield floor to student
    if (nextSpeaker.speakerId === 'student') {
      setSpeakerState('student_active');
      // Wait for student to click Speak Now or press Space.
      // Floor remains open (silent AI wait).
      return;
    }

    // 3. AI Turn speaking
    const aiId = nextSpeaker.speakerId;
    const studentJustSpoke = lastSpeakerId === 'student';
    const turnType = determineTurnType({
      personaId: aiId,
      recentTurns: currentTurns,
      sessionPhase: sessionPhaseRef.current,
      studentJustSpoke,
    });

    setSpeakerState('ai_thinking');
    setStreamingSpeakerId(aiId);
    setStreamingText('');

    const controller = new AbortController();
    discussAbortControllerRef.current = controller;

    try {
      const response = await fetch('/api/gd-ai/discuss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: setupData.topic,
          personaId: aiId,
          sessionPhase: sessionPhaseRef.current,
          turns: currentTurns,
          elapsedMinutes: elapsed / 60,
          studentName: setupData.studentName,
          personaNames,
          turnType,
          uid: setupData.uid,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('AI discuss failed');

      let finalAIText = '';
      await parseSSEStream(
        response,
        (tok) => {
          finalAIText += tok;
          setStreamingText(finalAIText);
        },
        (doneTxt) => {
          finalAIText = doneTxt;
        }
      );

      setSpeakerState('ai_speaking');
      setActiveSpeakerId(aiId);
      setStreamingText('');
      setStreamingSpeakerId(null);

      // Speak and type AI text word-by-word
      await speakAndType(aiId, personaNames[aiId], finalAIText, turnType, controller.signal);

      // Update speaker tracking variables
      speakerStatsRef.current = updateSpeakerStats(speakerStatsRef.current, aiId, currentTurns.length);
      addressedPersonaIdRef.current = detectAddressedPersona(
        finalAIText,
        ['aggressive', 'analytical', 'contrarian', 'balanced'],
        personaNames
      );

      const newTurn = {
        speakerId: aiId,
        personaName: personaNames[aiId],
        text: finalAIText,
        type: turnType,
        timestamp: new Date().toISOString(),
      };
      await saveProgress([...currentTurns, newTurn]);

      setSpeakerState('idle');
      setActiveSpeakerId(null);

      // Trigger next turn
      setTimeout(() => {
        runNextTurn();
      }, 1000);

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('AI turn generation aborted via natural student interruption.');
        return;
      }
      console.error('AI Turn loop error:', err);
      setSpeakerState('idle');
      setStreamingSpeakerId(null);
      setStreamingText('');
      setTimeout(() => {
        runNextTurn();
      }, 2000);
    }
  };

  // Jump In Interruption handler
  const handleJumpIn = async () => {
    if (speakerState === 'active' || speakerState === 'queued') return;

    jumpInRequestedRef.current = true;
    setSpeakerState('queued');

    // 1. Abort discuss HTTP stream / TTS / speaking
    discussAbortControllerRef.current?.abort();

    // 2. Stop audio output / speech synthesis immediately
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Stop typing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    // 3. Save whatever AI text was generated / typed out as interrupted turn
    if (speakerState === 'ai_speaking') {
      // Mark last turn as interrupted
      setTurns((prev) => {
        if (prev.length === 0) return prev;
        const nextTurns = [...prev];
        const lastTurn = { ...nextTurns[nextTurns.length - 1] };
        
        if (!lastTurn.wasInterrupted) {
          lastTurn.text = lastTurn.text.trim() + '...';
          lastTurn.wasInterrupted = true;
          delete lastTurn.typing;
          nextTurns[nextTurns.length - 1] = lastTurn;
          saveProgress(nextTurns);
        }
        return nextTurns;
      });
    } else if (streamingSpeakerId && streamingText.trim()) {
      const personaNames = {
        aggressive: 'Vikram',
        analytical: 'Rohan',
        contrarian: 'Anjali',
        balanced: 'Dev',
        moderator: 'Nalini',
      };
      const interruptedTurn = {
        speakerId: streamingSpeakerId,
        personaName: personaNames[streamingSpeakerId] || streamingSpeakerId,
        text: streamingText + '...',
        type: 'debate',
        wasInterrupted: true,
        timestamp: new Date().toISOString(),
      };

      setTurns((prev) => [...prev, interruptedTurn]);
      await saveProgress([...turnsRef.current, interruptedTurn]);
    }

    setStreamingText('');
    setStreamingSpeakerId(null);
    setActiveSpeakerId(null);

    // 4. Activate mic
    setSpeakerState('active');
    try {
      await startRecording();
    } catch (err) {
      console.error('Failed to trigger STT recording:', err);
      setSpeakerState('idle');
      jumpInRequestedRef.current = false;
      runNextTurn();
    }
  };

  // Done Speaking handler
  const handleDoneSpeaking = async () => {
    setSpeakerState('ai_thinking');
    stopRecording();

    // Wait a brief window for any final speech transcript commits
    await new Promise((resolve) => setTimeout(resolve, 500));

    const finalSpeech = fullTranscript || transcript || '';

    if (finalSpeech.trim()) {
      const studentTurn = {
        speakerId: 'student',
        text: finalSpeech,
        timestamp: new Date().toISOString(),
      };

      // Detect if student addressed any specific persona (e.g. Vikram, Rohan, Anjali, Dev)
      const personaNames = {
        aggressive: 'Vikram',
        analytical: 'Rohan',
        contrarian: 'Anjali',
        balanced: 'Dev',
      };
      addressedPersonaIdRef.current = detectAddressedPersona(
        finalSpeech,
        ['aggressive', 'analytical', 'contrarian', 'balanced'],
        personaNames
      );

      setTurns((prev) => [...prev, studentTurn]);
      await saveProgress([...turnsRef.current, studentTurn]);
    }

    clearTranscript();
    jumpInRequestedRef.current = false;

    setSpeakerState('idle');
    
    // Call next turn loop
    setTimeout(() => {
      runNextTurn();
    }, 800);
  };

  // Stable ref for speakerState to prevent event listener re-binding loops
  const speakerStateRef = useRef(speakerState);
  useEffect(() => {
    speakerStateRef.current = speakerState;
  }, [speakerState]);

  // Spacebar keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        if (e.repeat) return; // Prevent auto-repeat triggers from holding down Spacebar
        
        // Prevent default spacebar scrolling
        e.preventDefault();

        const currentState = speakerStateRef.current;
        if (currentState === 'active') {
          handleDoneSpeaking();
        } else if (currentState === 'idle' || currentState === 'student_active') {
          handleJumpIn();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cleanup active typing intervals on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Session End Evaluator Pipeline
  const handleEndSession = async () => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    // 1. Pause actions
    isSessionActiveRef.current = false;
    setIsSessionActive(false);

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    stopRecording();

    // 2. Open processing loading screen
    setEvalLoading(true);

    if (!setupData) {
      router.push('/gd/ai');
      return;
    }

    try {
      const res = await fetch('/api/gd-ai/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: setupData.sessionId,
          topic: setupData.topic,
          category: setupData.category,
          difficulty: setupData.difficulty,
          turns: turnsRef.current,
          elapsedSeconds: elapsedSecondsRef.current,
          uid: setupData.uid,
          studentName: setupData.studentName,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Evaluation failed');
      }

      const data = await res.json();
      toast.success('Evaluation complete!');
      
      // Save evaluation to local storage as fallback/local history
      if (typeof window !== 'undefined') {
        try {
          const localSessions = JSON.parse(localStorage.getItem('local_gd_sessions') || '[]');
          const localRecord = {
            sessionId: data.sessionId,
            topic: setupData.topic,
            category: setupData.category,
            difficulty: setupData.difficulty,
            type: 'ai_gd',
            durationSeconds: elapsedSecondsRef.current,
            overallScore: data.evaluation.overallScore,
            summary: data.evaluation.summary,
            strongestMoment: data.evaluation.strongestMoment,
            growthArea: data.evaluation.growthArea,
            dimensions: data.evaluation.dimensions,
            overallAnalysis: data.evaluation.overallAnalysis,
            transcript: turnsRef.current.map(t => ({
              speakerId: t.speakerId,
              speakerName: t.personaName || t.speakerId,
              text: t.text,
              type: t.type || 'debate',
            })),
            createdAt: new Date().toISOString(),
          };
          const updated = [localRecord, ...localSessions.filter(s => s.sessionId !== data.sessionId)].slice(0, 20);
          localStorage.setItem('local_gd_sessions', JSON.stringify(updated));
        } catch (storageErr) {
          console.warn('Failed to save session to localStorage:', storageErr);
        }
      }

      // Navigate to report
      router.push(`/gd/ai/report/${data.sessionId}`);
    } catch (err) {
      console.error('[gd-ai/evaluate] failed:', err);
      toast.error(`Evaluation failed: ${err.message}. Saving progress.`);
      router.push('/gd/ai');
    } finally {
      setEvalLoading(false);
    }
  };

  const participantConfigs = {
    moderator: { name: 'Nalini', initial: 'N', color: '#0D9488', role: 'moderator', personality: 'Moderator' },
    aggressive: { name: 'Vikram', initial: 'V', color: '#DC2626', role: 'participant', personality: 'Aggressive Speaker' },
    analytical: { name: 'Rohan', initial: 'R', color: '#2563EB', role: 'participant', personality: 'Data Analyst' },
    contrarian: { name: 'Anjali', initial: 'A', color: '#7C3AED', role: 'participant', personality: 'Contrarian Thinker' },
    balanced: { name: 'Dev', initial: 'D', color: '#059669', role: 'participant', personality: 'Synthesizer' },
  };

  const currentStudentName = setupData?.studentName || 'You';

  return (
    <Canvas>
      <AppShell>
        <div className="max-w-[1100px] mx-auto px-6 py-6 h-[90vh] flex flex-col justify-between gap-5 bg-slate-50/20">
          
          {/* Header topic banner */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm flex-shrink-0">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">
                Practice Session Category: {setupData?.category || 'General'}
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-800 leading-snug truncate">
                Topic: {setupData?.topic}
              </h2>
            </div>
            
            <div className="flex items-center gap-4">
              <GDTimer elapsedSeconds={elapsedSeconds} />
              <button
                onClick={() => {
                  try {
                    if (document.fullscreenElement) {
                      document.exitFullscreen?.().catch(() => {});
                    } else {
                      document.documentElement.requestFullscreen?.().catch(() => {});
                    }
                  } catch (fsErr) {
                    console.warn('Fullscreen action failed:', fsErr);
                  }
                }}
                className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
                title="Toggle Fullscreen"
              >
                🗖 Fullscreen
              </button>
              <button
                onClick={handleEndSession}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-200 transition-colors"
              >
                End GD
              </button>
            </div>
          </div>

          {/* Participant Avatars Strip */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm grid grid-cols-3 sm:grid-cols-6 gap-3 justify-items-center items-center flex-shrink-0">
            {/* Moderator */}
            <ParticipantAvatar
              {...participantConfigs.moderator}
              isActive={activeSpeakerId === 'moderator' || streamingSpeakerId === 'moderator'}
              isThinking={speakerState === 'ai_thinking' && streamingSpeakerId === 'moderator'}
              size="md"
            />
            {/* AI co-participants */}
            {['aggressive', 'analytical', 'contrarian', 'balanced'].map((id) => (
              <ParticipantAvatar
                key={id}
                {...participantConfigs[id]}
                isActive={activeSpeakerId === id || streamingSpeakerId === id}
                isThinking={speakerState === 'ai_thinking' && streamingSpeakerId === id}
                size="md"
              />
            ))}
            {/* Student */}
            <ParticipantAvatar
              name={currentStudentName}
              initial={currentStudentName.charAt(0).toUpperCase()}
              color="#0EA5E9"
              role="student"
              isActive={speakerState === 'active'}
              isThinking={speakerState === 'queued'}
              isMuted={speakerState !== 'active'}
              volume={volume}
              personality="Candidate"
              size="md"
            />
          </div>

          {/* Live Streaming Transcript */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex-grow overflow-hidden flex flex-col justify-between min-h-[300px]">
            <TranscriptPanel
              turns={turns}
              streamingText={
                speakerState === 'active'
                  ? fullTranscript
                  : streamingText
              }
              streamingSpeakerId={
                speakerState === 'active' ? 'student' : streamingSpeakerId
              }
              speakerNames={{
                moderator: 'Nalini',
                aggressive: 'Vikram',
                analytical: 'Rohan',
                contrarian: 'Anjali',
                balanced: 'Dev',
                student: 'You',
              }}
            />
          </div>

          {/* Audio Interface Action Control */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex justify-center items-center shadow-sm flex-shrink-0 relative">
            <SpeakButton
              state={
                speakerState === 'active' ? 'active' :
                speakerState === 'queued' ? 'queued' :
                speakerState === 'ai_thinking' ? 'thinking' :
                speakerState === 'student_active' ? 'active' :
                'idle'
              }
              onJumpIn={handleJumpIn}
              onDoneSpeaking={handleDoneSpeaking}
              volume={volume}
            />

            {/* Displaying interim speech transcript inside the visual control panel */}
            {speakerState === 'active' && interimTranscript && (
              <div className="absolute top-2 left-6 right-6 hidden md:block bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-center text-xs text-slate-500 font-medium truncate">
                🗣 Listening: {interimTranscript}
              </div>
            )}
          </div>

          {/* Immersive Evaluation processing loading layer */}
          <AnalysisLoader isOpen={evalLoading} />

        </div>
      </AppShell>
    </Canvas>
  );
}
