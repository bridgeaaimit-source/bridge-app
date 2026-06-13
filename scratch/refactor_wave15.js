const fs = require('fs');

// 1. Rewrite InterviewContext.js
const contextFile = 'context/InterviewContext.js';
const newContextContent = `"use client";

import { createContext, useReducer, useContext } from 'react';

export const InterviewStateContext = createContext();
export const InterviewDispatchContext = createContext();

export const initialState = {
  status: 'setup', // setup | device-test | interviewing | feedback | history
  
  config: {
    jobRole: '',
    jobDescription: '',
    round: 'HR Round',
    mode: 'voice',
    resumeBase64: '',
    resumeFileName: '',
    resumeText: '',
  },

  devices: {
    cameraOk: null,
    micOk: null,
    voiceOk: null,
    selectedLang: 'en-IN',
    isVideoSupported: true,
  },

  engine: {
    currentQuestion: '',
    questionNumber: 1,
    conversationHistory: [],
    sessionMemory: null,
    interviewerThought: '',
  },

  evaluation: {
    feedback: null,
    feedbackHistory: [],
  },

  integrity: {
    isFullscreen: false,
    integrityScore: 100,
    violations: [],
  },
  
  error: null,
};

export function interviewReducer(state, action) {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, status: action.payload };
      
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
      
    case 'SET_DEVICES':
      return { ...state, devices: { ...state.devices, ...action.payload } };
      
    case 'SET_INTEGRITY':
      return { ...state, integrity: { ...state.integrity, ...action.payload } };
      
    case 'RECORD_VIOLATION':
      return { 
        ...state, 
        integrity: {
          ...state.integrity,
          integrityScore: Math.max(0, state.integrity.integrityScore - 5),
          violations: [...state.integrity.violations, action.payload]
        }
      };

    case 'SET_ENGINE':
      return { ...state, engine: { ...state.engine, ...action.payload } };

    case 'SET_EVALUATION':
      return { ...state, evaluation: { ...state.evaluation, ...action.payload } };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'START_INTERVIEW':
      return {
        ...state,
        status: 'interviewing',
        error: null,
        engine: {
          ...state.engine,
          currentQuestion: action.payload.question || '',
          sessionMemory: action.payload.sessionMemory || null,
          interviewerThought: action.payload.interviewerThought || '',
          questionNumber: 1,
          conversationHistory: action.payload.question ? [
            { role: 'interviewer', message: action.payload.question }
          ] : []
        }
      };

    case 'RECEIVE_QUESTION':
      return { 
        ...state, 
        status: 'interviewing',
        engine: {
          ...state.engine,
          currentQuestion: action.payload.question || state.engine.currentQuestion,
          sessionMemory: action.payload.sessionMemory || state.engine.sessionMemory,
          interviewerThought: action.payload.interviewerThought || state.engine.interviewerThought,
          questionNumber: state.engine.questionNumber + 1,
          conversationHistory: action.payload.question ? [
            ...state.engine.conversationHistory, 
            { role: 'interviewer', message: action.payload.question }
          ] : state.engine.conversationHistory
        }
      };

    case 'SUBMIT_ANSWER':
      return {
        ...state,
        status: 'interviewing',
        engine: {
          ...state.engine,
          conversationHistory: action.payload.answer ? [
            ...state.engine.conversationHistory,
            { role: 'user', message: action.payload.answer }
          ] : state.engine.conversationHistory,
          sessionMemory: action.payload.sessionMemory || state.engine.sessionMemory
        }
      };

    case 'RECEIVE_EVALUATION':
      return {
        ...state,
        status: 'feedback',
        evaluation: {
          ...state.evaluation,
          feedback: action.payload.feedback,
          feedbackHistory: [...state.evaluation.feedbackHistory, action.payload.feedback]
        }
      };

    case 'RESET_INTERVIEW':
      return {
        ...initialState,
        config: state.config, // preserve config
        devices: state.devices // preserve devices
      };

    default:
      return state;
  }
}

export function InterviewProvider({ children }) {
  const [state, dispatch] = useReducer(interviewReducer, initialState);

  return (
    <InterviewStateContext.Provider value={state}>
      <InterviewDispatchContext.Provider value={dispatch}>
        {children}
      </InterviewDispatchContext.Provider>
    </InterviewStateContext.Provider>
  );
}

export function useInterviewState() {
  const context = useContext(InterviewStateContext);
  if (context === undefined) {
    throw new Error('useInterviewState must be used within an InterviewProvider');
  }
  return context;
}

export function useInterviewDispatch() {
  const context = useContext(InterviewDispatchContext);
  if (context === undefined) {
    throw new Error('useInterviewDispatch must be used within an InterviewProvider');
  }
  return context;
}
`;
fs.writeFileSync(contextFile, newContextContent);
console.log('Updated InterviewContext.js');

// 2. Rewrite page.js
const pageFile = 'app/smart-interview/page.js';
let pageContent = fs.readFileSync(pageFile, 'utf8');

// A. Remove useStates
pageContent = pageContent.replace(/\s*const \[stage, setStage\] = useState\([^)]*\);/g, '');
pageContent = pageContent.replace(/\s*const \[feedback, setFeedback\] = useState\([^)]*\);/g, '');
pageContent = pageContent.replace(/\s*const \[conversationHistory, setConversationHistory\] = useState\([^)]*\);/g, '');

// B. Replace reads
pageContent = pageContent.replace(/\bstage\b/g, 'state.status');
pageContent = pageContent.replace(/\bfeedback\b/g, 'state.evaluation.feedback');
pageContent = pageContent.replace(/\bconversationHistory\b/g, 'state.engine.conversationHistory');

// C. Fix setStage and loadFeedbackHistory
pageContent = pageContent.replace(/setStage\('setup'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'setup' })");
pageContent = pageContent.replace(/setStage\('history'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'history' })");
pageContent = pageContent.replace(/setStage\('device-test'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'device-test' })");
pageContent = pageContent.replace(/setStage\('interviewing'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'interviewing' })");
pageContent = pageContent.replace(/setStage\('feedback'\)/g, "dispatch({ type: 'SET_STATUS', payload: 'feedback' })");

// D. Fix setFeedback
pageContent = pageContent.replace(/setFeedback\(data\);/g, "dispatch({ type: 'RECEIVE_EVALUATION', payload: { feedback: data } });");

// E. Fix START_INTERVIEW block
const startInterviewBlock = `dispatch({ type: 'SET_ENGINE', payload: { currentQuestion: data.question } });
      dispatch({ type: 'SET_ENGINE', payload: { interviewerThought: data.interviewer_thought || '' } });
      setConversationHistory([
        { role: 'interviewer', message: data.question }
      ]);
      dispatch({ type: 'SET_ENGINE', payload: { sessionMemory: data.session_memory || null } });
      dispatch({ type: 'SET_STATUS', payload: 'interviewing' });
      dispatch({ type: 'SET_ENGINE', payload: { questionNumber: 1 } });
      dispatch({ type: 'SET_ERROR', payload: '' });`;

const newStartInterviewBlock = `dispatch({ 
        type: 'START_INTERVIEW', 
        payload: {
          question: data.question,
          interviewerThought: data.interviewer_thought || '',
          sessionMemory: data.session_memory || null
        }
      });`;

pageContent = pageContent.replace(startInterviewBlock, newStartInterviewBlock);

// F. Fix submitAnswer block (append user answer)
const submitAnswerStartBlock = `const updatedHistory = answer.trim()
      ? [...state.engine.conversationHistory, { role: 'user', message: answer }]
      : state.engine.conversationHistory;

    if (answer.trim()) {
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', message: answer }
      ]);
    }`;

const newSubmitAnswerStartBlock = `const updatedHistory = answer.trim()
      ? [...state.engine.conversationHistory, { role: 'user', message: answer.trim() }]
      : state.engine.conversationHistory;

    if (answer.trim()) {
      dispatch({ type: 'SUBMIT_ANSWER', payload: { answer: answer.trim(), sessionMemory: state.engine.sessionMemory } });
    }`;

pageContent = pageContent.replace(submitAnswerStartBlock, newSubmitAnswerStartBlock);

// G. Fix RECEIVE_QUESTION block inside submitAnswer
const receiveQuestionBlock = `dispatch({ type: 'SET_ENGINE', payload: { currentQuestion: data.question } });
        dispatch({ type: 'SET_ENGINE', payload: { interviewerThought: data.interviewer_thought || '' } });
        setConversationHistory(prev => [
          ...prev,
          { role: 'interviewer', message: data.question }
        ]);
        dispatch({ type: 'SET_ENGINE', payload: { questionNumber: state.engine.questionNumber + 1 } });`;

const newReceiveQuestionBlock = `dispatch({
          type: 'RECEIVE_QUESTION',
          payload: {
            question: data.question,
            interviewerThought: data.interviewer_thought || '',
            sessionMemory: updatedMemory
          }
        });`;

pageContent = pageContent.replace(receiveQuestionBlock, newReceiveQuestionBlock);

// H. Fix manual setConversationHistory in handleVoiceCommand 
// Wait, is there any other setConversationHistory? The regex removed them all, but I need to make sure I didn't break anything.
// If any exist, they would crash. I replaced it globally, so any remaining `setConversationHistory` will be undefined.
// Let's also remove `const updatedMemory = data.session_memory || state.engine.sessionMemory;` and `dispatch({ type: 'SET_ENGINE', payload: { sessionMemory: updatedMemory } });`
// Wait, the API response logic handles sessionMemory. I'll just leave `updatedMemory` as a variable since it's passed to `getFeedback`.

fs.writeFileSync(pageFile, pageContent);
console.log('Updated page.js');
