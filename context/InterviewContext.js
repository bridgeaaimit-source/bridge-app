"use client";

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
      
    case 'RECORD_VIOLATION': {
      const newViolationsCount = state.integrity.violations.length + 1;
      let newScore = 100;
      if (newViolationsCount === 1) newScore = 85;
      else if (newViolationsCount === 2) newScore = 60;
      else if (newViolationsCount >= 3) newScore = 30;
      return { 
        ...state, 
        integrity: {
          ...state.integrity,
          integrityScore: newScore,
          violations: [...state.integrity.violations, action.payload]
        }
      };
    }

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
        },
        integrity: {
          isFullscreen: false,
          integrityScore: 100,
          violations: []
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
