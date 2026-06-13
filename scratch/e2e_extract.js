const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
const pageJsBakPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js.bak');

// 1. Restore from bak
let code = fs.readFileSync(pageJsBakPath, 'utf8');

// 2. Fix bugs
const setters = ['setCurrentQuestion', 'setQuestionNumber', 'setSessionMemory', 'setInterviewerThought', 'setIntegrityScore', 'setViolations', 'setFeedbackHistory', 'setStartError', 'setIsFullscreen'];
code = code.split('\n').filter(l => !setters.some(s => l.includes(s))).join('\n');

const badHandleViolation = `      const timestamp = new Date().toISOString();
      dispatch({ type: 'SET_INTEGRITY', payload: { violations: (prev } }) => {
        const nextViolations = [...prev, { type, timestamp }];
        const count = nextViolations.length;
        
        let newScore = 100;
        if (count === 1) newScore = 85;
        else if (count === 2) newScore = 60;
        else if (count >= 3) newScore = 30;
        dispatch({ type: 'SET_INTEGRITY', payload: { integrityScore: newScore } });

        if (count === 1) {
          toast.error("Warning: Tab switching detected. Please focus on the interview.", { duration: 5000 });
        } else if (count === 2) {
          toast.error("Final Warning: Repeated switching will flag this interview.", { duration: 6000 });
        } else {
          toast.error("Interview Flagged: Multiple window switches detected.", { duration: 6000 });
        }

        return nextViolations;
      });
    };`;

const goodHandleViolation = `      const timestamp = new Date().toISOString();
      const nextViolations = [...state.integrity.violations, { type, timestamp }];
      const count = nextViolations.length;
      
      let newScore = 100;
      if (count === 1) newScore = 85;
      else if (count === 2) newScore = 60;
      else if (count >= 3) newScore = 30;
      
      dispatch({ type: 'SET_INTEGRITY', payload: { violations: nextViolations, integrityScore: newScore } });

      if (count === 1) {
        toast.error("Warning: Tab switching detected. Please focus on the interview.", { duration: 5000 });
      } else if (count === 2) {
        toast.error("Final Warning: Repeated switching will flag this interview.", { duration: 6000 });
      } else {
        toast.error("Interview Flagged: Multiple window switches detected.", { duration: 6000 });
      }
    };`;

code = code.replace(badHandleViolation, goodHandleViolation);
code = code.replace(/window\.removeEventListener\("blur", handleBlur\);\n    };\n  }, \[state\.status\]\);/g, `window.removeEventListener("blur", handleBlur);\n    };\n  }, [state.status, state.integrity.violations]);`);
code = code.replace(
  "console.log('submitAnswer called:', { answer, shouldFinish, mode: state.config.mode, state.engine.currentQuestion });",
  "console.log('submitAnswer called:', { answer, shouldFinish, mode: state.config.mode, currentQuestion: state.engine.currentQuestion });"
);
code = code.replace(/job_role: jobRole: state\.config\.jobRole,/g, 'job_role: state.config.jobRole,');
code = code.replace(/'state\.evaluation\.feedback'/g, "'feedback'");
code = code.replace(/state\.devices\.selectedLang=\{/g, 'selectedLang={');

// 3. Find boundaries
const setupStartStr = "if (state.status === 'setup') {";
const deviceTestStartStr = "if (state.status === 'device-test') {";
const feedbackStartStr = "if (state.status === 'feedback') {";
const historyStartStr = "// HISTORY SCREEN";

const setupStart = code.indexOf(setupStartStr);
const deviceTestStart = code.indexOf(deviceTestStartStr);
const feedbackStart = code.indexOf(feedbackStartStr);
const historyStart = code.indexOf(historyStartStr);

console.log({setupStart, deviceTestStart, feedbackStart, historyStart});
if (setupStart === -1 || deviceTestStart === -1 || feedbackStart === -1 || historyStart === -1) {
  console.error("Missing boundaries!");
  process.exit(1);
}

const setupBlock = code.substring(setupStart, deviceTestStart);
const feedbackBlock = code.substring(feedbackStart, historyStart);

// 4. Create components
let setupInner = setupBlock.split('\n');
setupInner = setupInner.slice(2, -3).join('\n');

const setupFormCode = `"use client";

import React, { useRef } from 'react';
import { useInterviewState, useInterviewDispatch } from '@/context/InterviewContext';
import { Upload, CheckCircle, FileText, Mic, Play, History, Lightbulb } from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function SetupForm({ startInterview, loadFeedbackHistory, handleResumeUpload, loading }) {
  const state = useInterviewState();
  const dispatch = useInterviewDispatch();
  const fileInputRef = useRef(null);
  const resumeFileName = state.config.resumeFileName;
  const jobRole = state.config.jobRole;
  const jobDescription = state.config.jobDescription;
  const startError = state.error;

  return (
${setupInner}
  );
}
`;

let feedbackInner = feedbackBlock.split('\n');
feedbackInner = feedbackInner.slice(2, -3).join('\n');

const feedbackReportCode = `"use client";

import React from 'react';
import { useInterviewState } from '@/context/InterviewContext';
import { Mic, Lightbulb, CheckCircle, AlertCircle, Award } from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function FeedbackReport({ resetInterview, isEvaluating }) {
  const state = useInterviewState();
  const feedback = state.evaluation.feedback;
  const jobRole = state.config.jobRole;
  const round = state.config.round;
  const integrityScore = state.integrity.integrityScore;
  const violations = state.integrity.violations;

  return (
${feedbackInner}
  );
}
`;

const componentsDir = path.join(__dirname, '..', 'components', 'smart-interview');
if (!fs.existsSync(componentsDir)) fs.mkdirSync(componentsDir, { recursive: true });

fs.writeFileSync(path.join(componentsDir, 'SetupForm.js'), setupFormCode);
fs.writeFileSync(path.join(componentsDir, 'FeedbackReport.js'), feedbackReportCode);

// 5. Replace in page.js
code = code.replace(setupBlock, "if (state.status === 'setup') {\n    return <SetupForm startInterview={startInterview} loadFeedbackHistory={loadFeedbackHistory} handleResumeUpload={handleResumeUpload} loading={loading} />;\n  }\n\n  ");
code = code.replace(feedbackBlock, "if (state.status === 'feedback') {\n    return <FeedbackReport resetInterview={resetInterview} isEvaluating={isEvaluating} />;\n  }\n\n  ");
code = code.replace(/const fileInputRef = useRef\(null\);\n/g, '');

const lines = code.split('\n');
let lastImportIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('import ')) {
    lastImportIdx = i;
  }
}
if (lastImportIdx !== -1) {
  lines.splice(lastImportIdx + 1, 0, "import SetupForm from '@/components/smart-interview/SetupForm';");
  lines.splice(lastImportIdx + 2, 0, "import FeedbackReport from '@/components/smart-interview/FeedbackReport';");
}

fs.writeFileSync(pageJsPath, lines.join('\n'));
console.log("End to end extraction complete!");
