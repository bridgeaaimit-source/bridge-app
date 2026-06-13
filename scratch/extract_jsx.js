const fs = require('fs');
const pagePath = 'app/smart-interview/page.js';
let code = fs.readFileSync(pagePath, 'utf8');

const s_setup = code.indexOf("if (state.status === 'setup') {");
const s_device = code.indexOf("if (state.status === 'device-test') {");
const s_active = code.indexOf("if (state.status === 'interviewing') {");
const s_feedback = code.indexOf("if (state.status === 'feedback') {");
const s_history = code.indexOf("if (state.status === 'history') {");

if (s_setup === -1 || s_device === -1 || s_active === -1 || s_feedback === -1 || s_history === -1) {
  console.log("Could not find all markers.");
  console.log({ s_setup, s_device, s_active, s_feedback, s_history });
  process.exit(1);
}

// Ensure the comments are included if they exist right before the if statements
function getStart(idx) {
  let sub = code.substring(0, idx);
  let lastComment = sub.lastIndexOf('//');
  if (lastComment > idx - 100 && !sub.substring(lastComment, idx).includes('}')) {
    return lastComment;
  }
  return idx;
}

const p_setup = getStart(s_setup);
const p_device = getStart(s_device);
const p_active = getStart(s_active);
const p_feedback = getStart(s_feedback);
const p_history = getStart(s_history);

const setupBlock = code.substring(p_setup, p_device);
const deviceBlock = code.substring(p_device, p_active);
const activeBlock = code.substring(p_active, p_feedback);
const feedbackBlock = code.substring(p_feedback, p_history);

function writeComponent(name, props, block, imports) {
  let cleaned = block.replace(/if\s*\([^)]+\)\s*{\s*return\s*\(/, 'return (');
  cleaned = cleaned.replace(/\);\s*}\s*$/, ');');
  
  // also clean up any leading comments
  cleaned = cleaned.replace(/^\s*\/\/[^\n]+\n+/, '');

  const fileContent = `import React from 'react';
${imports}

export const ${name} = React.memo(({ ${props} }) => {
  ${cleaned}
});
`;
  fs.writeFileSync(`components/smart-interview/${name}.js`, fileContent);
  console.log(`Created ${name}.js`);
}

writeComponent('SetupForm', 'state, dispatch, handleResumeUpload, startInterview, loadFeedbackHistory, fileInputRef, jobRole, jobDescription, resumeFileName', setupBlock, 
`import { Upload, CheckCircle, FileText, Play, Mic, History, AlertCircle } from 'lucide-react';
import AppShell from '@/components/AppShell';`);

writeComponent('DeviceTestPanel', 'state, dispatch, startInterview, cameraOk, setCameraOk, micOk, setMicOk, voiceOk, setVoiceOk, isVideoSupported, setIsVideoSupported, selectedLang, setSelectedLang', deviceBlock, 
`import { Mic, Video, Volume2, ShieldAlert, ArrowRight, Activity, Settings, Maximize } from 'lucide-react';
import AppShell from '@/components/AppShell';
import VoiceTest from '@/components/VoiceTest';`);

writeComponent('ActiveInterview', 'state, dispatch, isRecording, toggleRecording, currentAnswer, setCurrentAnswer, isEvaluating, endInterview, submitAnswer, formatTime, transcript, recordingTimeLeft, renderQuestionBadges', activeBlock, 
`import { Mic, MicOff, Send, Clock, User, MessageSquare, AlertCircle, Maximize } from 'lucide-react';
import AppShell from '@/components/AppShell';`);

writeComponent('FeedbackReport', 'state, dispatch, resetInterview, formatTime', feedbackBlock, 
`import { CheckCircle, AlertCircle, BarChart2, Star, TrendingUp, Clock, History, Activity, ShieldAlert, Award } from 'lucide-react';
import AppShell from '@/components/AppShell';`);

let newCode = code.substring(0, p_setup);
newCode += `
  // SETUP SCREEN
  if (state.status === 'setup') {
    return <SetupForm
      state={state}
      dispatch={dispatch}
      handleResumeUpload={handleResumeUpload}
      startInterview={startInterview}
      loadFeedbackHistory={loadFeedbackHistory}
      fileInputRef={fileInputRef}
      jobRole={state.config.jobRole}
      jobDescription={state.config.jobDescription}
      resumeFileName={state.config.resumeFileName}
    />;
  }

  // DEVICE TEST SCREEN
  if (state.status === 'device-test') {
    return <DeviceTestPanel
      state={state}
      dispatch={dispatch}
      startInterview={startInterview}
      cameraOk={cameraOk} setCameraOk={setCameraOk}
      micOk={micOk} setMicOk={setMicOk}
      voiceOk={voiceOk} setVoiceOk={setVoiceOk}
      isVideoSupported={isVideoSupported} setIsVideoSupported={setIsVideoSupported}
      selectedLang={selectedLang} setSelectedLang={setSelectedLang}
    />;
  }

  // ACTIVE INTERVIEW SCREEN
  if (state.status === 'interviewing' || state.status === 'processing') {
    return <ActiveInterview
      state={state}
      dispatch={dispatch}
      isRecording={isRecording}
      toggleRecording={toggleRecording}
      currentAnswer={currentAnswer}
      setCurrentAnswer={setCurrentAnswer}
      isEvaluating={isEvaluating}
      endInterview={endInterview}
      submitAnswer={submitAnswer}
      formatTime={formatTime}
      transcript={transcript}
      recordingTimeLeft={recordingTimeLeft}
      renderQuestionBadges={renderQuestionBadges}
    />;
  }

  // FEEDBACK SCREEN
  if (state.status === 'feedback') {
    return <FeedbackReport
      state={state}
      dispatch={dispatch}
      resetInterview={resetInterview}
      formatTime={formatTime}
    />;
  }

`;
newCode += code.substring(p_history);

newCode = newCode.replace("import React, { useState, useEffect, useRef, useCallback } from 'react';", 
`import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SetupForm } from '@/components/smart-interview/SetupForm';
import { DeviceTestPanel } from '@/components/smart-interview/DeviceTestPanel';
import { ActiveInterview } from '@/components/smart-interview/ActiveInterview';
import { FeedbackReport } from '@/components/smart-interview/FeedbackReport';`);

fs.writeFileSync(pagePath, newCode);
console.log("Replaced page.js blocks!");
