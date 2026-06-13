const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
let content = fs.readFileSync(pageFile, 'utf8');

// Normalize all line endings to LF (\n) to make matches completely robust
content = content.replace(/\r\n/g, '\n');

// 1. Add imports at the top
content = content.replace(
  'import { InterviewProvider, useInterviewState, useInterviewDispatch } from "@/context/InterviewContext";',
  'import { InterviewProvider, useInterviewState, useInterviewDispatch } from "@/context/InterviewContext";\n' +
  "import SetupForm from '@/components/smart-interview/SetupForm';\n" +
  "import FeedbackReport from '@/components/smart-interview/FeedbackReport';\n" +
  "import DeviceTestPanel from '@/components/smart-interview/DeviceTestPanel';"
);

// 2. Add violationsCountRef and sync useEffect after violations is declared
content = content.replace(
  '  // Tab switch focus integrity scoring\n  const [violations, setViolations] = useState([]);',
  '  // Tab switch focus integrity scoring\n' +
  '  const [violations, setViolations] = useState([]);\n' +
  '  const violationsCountRef = useRef(0);\n' +
  '  useEffect(() => {\n' +
  '    violationsCountRef.current = violations.length;\n' +
  '  }, [violations.length]);'
);

// 3. Move handleViolation out and make it a stable useCallback, defined before the fullscreen effect
const handleViolationCode = `  // Stable violation handler
  const handleViolation = useCallback((type) => {
    const now = Date.now();
    const DEBOUNCE_MS = 2000;
    if (now - lastViolationTimeRef.current < DEBOUNCE_MS) return;
    lastViolationTimeRef.current = now;

    const timestamp = new Date().toISOString();
    const currentCount = violationsCountRef.current + 1;

    let newScore = 100;
    if (currentCount === 1) newScore = 85;
    else if (currentCount === 2) newScore = 60;
    else if (currentCount >= 3) newScore = 30;

    setIntegrityScore(newScore);
    setViolations((prev) => [...prev, { type, timestamp }]);
    dispatch({ type: 'RECORD_VIOLATION', payload: { type, timestamp } });

    if (currentCount === 1) {
      toast.error("Warning: Tab switching detected. Please focus on the interview.", { duration: 5000 });
    } else if (currentCount === 2) {
      toast.error("Final Warning: Repeated switching will flag this interview.", { duration: 6000 });
    } else {
      toast.error("Interview Flagged: Multiple window switches detected.", { duration: 6000 });
    }
  }, [dispatch]);`;

// 4. Update fullscreen exit violation detection and prepend the handleViolation callback
const fsTarget = `  // Fix 7: listen to fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);`;

const replacementFs = `${handleViolationCode}

  // Fix 7: listen to fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const onFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (!isFs && state.status === 'interviewing') {
        handleViolation("Exited fullscreen mode");
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, [state.status, handleViolation]);`;

if (content.includes(fsTarget)) {
  content = content.replace(fsTarget, replacementFs);
  console.log("Fullscreen and handleViolation code replaced successfully.");
} else {
  console.error("COULD NOT FIND FULLSCREEN TARGET IN PAGE.JS!");
}

// 5. Replace tab switch useEffect with version that references handleViolation without re-defining it
const tabSwitchTarget = `  // Fix 8: Tab switch detection — debounced to prevent double-counting
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
  }, [stage]);`;

const replacementTabSwitch = `  // Fix 8: Tab switch detection — debounced to prevent double-counting
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
  }, [state.status, handleViolation]);`;

if (content.includes(tabSwitchTarget)) {
  content = content.replace(tabSwitchTarget, replacementTabSwitch);
  console.log("Tab switch code replaced successfully.");
} else {
  console.error("COULD NOT FIND TAB SWITCH TARGET IN PAGE.JS!");
}

// 6. submitAnswer: empty answer check (restart recording)
const emptyTarget = `    if (!answer.trim() && !shouldFinish) {
      toast.error('Please provide an answer');
      return;
    }`;

const replacementEmpty = `    if (!answer.trim() && !shouldFinish) {
      toast.error('Please provide an answer');
      startRecordingState();
      return;
    }`;

if (content.includes(emptyTarget)) {
  content = content.replace(emptyTarget, replacementEmpty);
  console.log("Empty answer check updated successfully.");
} else {
  console.error("COULD NOT FIND EMPTY TARGET IN PAGE.JS!");
}

// 7. submitAnswer: replace remaining local conversationHistory references with state.engine.conversationHistory
content = content.replace(/\[\.\.\.conversationHistory,/g, '[...state.engine.conversationHistory,');
content = content.replace(/: conversationHistory/g, ': state.engine.conversationHistory');
content = content.replace(/\|\| conversationHistory;/g, '|| state.engine.conversationHistory;');

// 8. submitAnswer: optimistic update + rollback on error
const submitAnswerBodyStart = `    setIsTyping(true);
    stopRecordingState(); // Ensure recording stops immediately

    if (speakingIntervalRef.current) {
      clearInterval(speakingIntervalRef.current);
      speakingIntervalRef.current = null;
    }
    
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (autoSubmitTimerRef.current) clearInterval(autoSubmitTimerRef.current);
    setShowCompletionModal(false);
      
    const updatedHistory = answer.trim()
      ? [...state.engine.conversationHistory, { role: 'user', message: answer }]
      : state.engine.conversationHistory;`;

const replacementSubmitAnswerBodyStart = `    setIsTyping(true);
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
    }`;

if (content.includes(submitAnswerBodyStart)) {
  content = content.replace(submitAnswerBodyStart, replacementSubmitAnswerBodyStart);
  console.log("Optimistic SUBMIT_ANSWER added.");
} else {
  console.error("COULD NOT FIND SUBMITANSWER BODY START IN PAGE.JS!");
}

const catchBlockTarget = `    } catch (error) {
      toast.error(error.message || 'Failed to process answer');
      console.error('Answer submission error:', error);
    } finally {`;

const replacementCatchBlock = `    } catch (error) {
      toast.error(error.message || 'Failed to process answer');
      console.error('Answer submission error:', error);
      // Rollback optimistic update
      dispatch({ type: 'SET_ENGINE', payload: { conversationHistory: historySnapshot } });
      startRecordingState();
    } finally {`;

if (content.includes(catchBlockTarget)) {
  content = content.replace(catchBlockTarget, replacementCatchBlock);
  console.log("Rollback catch block updated.");
} else {
  console.error("COULD NOT FIND CATCH BLOCK TARGET IN PAGE.JS!");
}

// 9. submitAnswer: RECEIVE_QUESTION dispatch on next question
const nextQuestionTarget = `      } else if (data.question) {
        setCurrentQuestion(data.question);
        setInterviewerThought(data.interviewer_thought || '');
        
        setQuestionNumber(questionNumber + 1);
        setCurrentAnswer('');
        clearTranscript();`;

const replacementNextQuestion = `      } else if (data.question) {
        dispatch({
          type: 'RECEIVE_QUESTION',
          payload: {
            question: data.question,
            interviewerThought: data.interviewer_thought || '',
            sessionMemory: updatedMemory
          }
        });
        setCurrentQuestion(data.question);
        setInterviewerThought(data.interviewer_thought || '');
        
        setQuestionNumber(questionNumber + 1);
        setCurrentAnswer('');
        clearTranscript();`;

if (content.includes(nextQuestionTarget)) {
  content = content.replace(nextQuestionTarget, replacementNextQuestion);
  console.log("RECEIVE_QUESTION dispatch added.");
} else {
  console.error("COULD NOT FIND NEXT QUESTION TARGET IN PAGE.JS!");
}

// 10. startInterview: START_INTERVIEW dispatch
const initTarget = `      setCurrentQuestion(data.question);
      setInterviewerThought(data.interviewer_thought || '');
      
      setSessionMemory(data.session_memory || null);
      dispatch({ type: 'SET_STATUS', payload: 'interviewing' });
      setQuestionNumber(1);
      setStartError('');`;

const replacementInit = `      dispatch({
        type: 'START_INTERVIEW',
        payload: {
          question: data.question,
          interviewerThought: data.interviewer_thought || '',
          sessionMemory: data.session_memory || null
        }
      });
      setCurrentQuestion(data.question);
      setInterviewerThought(data.interviewer_thought || '');
      
      setSessionMemory(data.session_memory || null);
      setQuestionNumber(1);
      setStartError('');`;

if (content.includes(initTarget)) {
  content = content.replace(initTarget, replacementInit);
  console.log("START_INTERVIEW dispatch added.");
} else {
  console.error("COULD NOT FIND INIT TARGET IN PAGE.JS!");
}

// 11. viewHistoricalFeedback: change state.evaluation.feedback references to feedback
content = content.replace(
  'setIntegrityScore(historicalData.state.evaluation.feedback?.integrityScore || 100);',
  'setIntegrityScore(historicalData.feedback?.integrityScore || 100);'
);
content = content.replace(
  'setViolations(historicalData.state.evaluation.feedback?.violations || []);',
  'setViolations(historicalData.feedback?.violations || []);'
);

// 12. History list screen: change item.state.evaluation.feedback to item.feedback
content = content.replace(/item\.state\.evaluation\.feedback/g, 'item.feedback');

// 13. History list screen: normalize scores rendering to prevent object crashes
const scoresListTarget = `                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(item.feedback?.scores || {}).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-sm font-semibold text-gray-900">{value}/10</div>
                        <div className="text-[10px] text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                      </div>
                    ))}
                  </div>`;

const replacementScoresList = `                  <div className="grid grid-cols-6 gap-2">
                    {Object.entries(item.feedback?.scores || {}).map(([key, value]) => {
                      const scoreValue = typeof value === 'object' && value !== null && 'score' in value ? value.score : value;
                      return (
                        <div key={key} className="text-center">
                          <div className="text-sm font-semibold text-gray-900">{scoreValue}/10</div>
                          <div className="text-[10px] text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                        </div>
                      );
                    })}
                  </div>`;

if (content.includes(scoresListTarget)) {
  content = content.replace(scoresListTarget, replacementScoresList);
  console.log("Scores list crash fix applied.");
} else {
  console.error("COULD NOT FIND SCORES LIST TARGET IN PAGE.JS!");
}

// 14. Fix remaining stage references in silence detection useEffect
content = content.replace(
  "    if (stage !== 'interviewing' || !isRecording || showCompletionModal || isThinking || isTyping) return;",
  "    if (state.status !== 'interviewing' || !isRecording || showCompletionModal || isThinking || isTyping) return;"
);
content = content.replace(
  "  }, [transcript, interimTranscript, isRecording, stage, wordCount, showCompletionModal, isThinking, isTyping]);",
  "  }, [transcript, interimTranscript, isRecording, state.status, wordCount, showCompletionModal, isThinking, isTyping]);"
);

fs.writeFileSync(pageFile, content, 'utf8');
console.log("Done applying patches to page.js!");
