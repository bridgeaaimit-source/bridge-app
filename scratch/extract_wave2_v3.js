const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
let code = fs.readFileSync(pageJsPath, 'utf8');

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
  console.error("Could not find boundaries!");
  process.exit(1);
}

const setupBlock = code.substring(setupStart, deviceTestStart);
const feedbackBlock = code.substring(feedbackStart, historyStart);

// Create SetupForm.js
const setupFormCode = `"use client";

import React, { useRef } from 'react';
import { useInterviewState, useInterviewDispatch } from '@/context/InterviewContext';
import { Upload, CheckCircle, FileText, Mic, Play, History, Lightbulb } from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function SetupForm({ startInterview, loadFeedbackHistory, handleResumeUpload, loading }) {
  const state = useInterviewState();
  const dispatch = useInterviewDispatch();
  const fileInputRef = useRef(null);

  return (
${setupBlock.split('\n').slice(2, -2).join('\n')}
  );
}
`;

// Create FeedbackReport.js
const feedbackReportCode = `"use client";

import React from 'react';
import { useInterviewState } from '@/context/InterviewContext';
import { Mic, Lightbulb, CheckCircle, AlertCircle, Award } from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function FeedbackReport({ resetInterview, isEvaluating }) {
  const state = useInterviewState();
  const feedback = state.evaluation.feedback;

  return (
${feedbackBlock.split('\n').slice(2, -2).join('\n')}
  );
}
`;

const componentsDir = path.join(__dirname, '..', 'components', 'smart-interview');
if (!fs.existsSync(componentsDir)) fs.mkdirSync(componentsDir, { recursive: true });

fs.writeFileSync(path.join(componentsDir, 'SetupForm.js'), setupFormCode);
fs.writeFileSync(path.join(componentsDir, 'FeedbackReport.js'), feedbackReportCode);

// Replace blocks in page.js
code = code.replace(setupBlock, "if (state.status === 'setup') {\n    return <SetupForm startInterview={startInterview} loadFeedbackHistory={loadFeedbackHistory} handleResumeUpload={handleResumeUpload} loading={loading} />;\n  }\n\n  ");
code = code.replace(feedbackBlock, "if (state.status === 'feedback') {\n    return <FeedbackReport resetInterview={resetInterview} isEvaluating={isEvaluating} />;\n  }\n\n  ");

// Remove unused local variables from page.js
code = code.replace(/const fileInputRef = useRef\(null\);\n/g, '');

// Add imports
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
console.log("Extraction complete!");
