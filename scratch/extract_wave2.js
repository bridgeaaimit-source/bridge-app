const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '..', 'components', 'smart-interview');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

// 1. SetupForm.js
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
${fs.readFileSync(path.join(__dirname, 'setupCode.txt'), 'utf8').split('\\n').slice(2, -2).join('\\n')}
  );
}
`;
fs.writeFileSync(path.join(componentsDir, 'SetupForm.js'), setupFormCode);

// 2. FeedbackReport.js
const feedbackReportCode = `"use client";

import React from 'react';
import { useInterviewState } from '@/context/InterviewContext';
import { Mic, Lightbulb, CheckCircle, AlertCircle, Award } from 'lucide-react';
import AppShell from '@/components/AppShell';

export default function FeedbackReport({ resetInterview, isEvaluating }) {
  const state = useInterviewState();
  const feedback = state.evaluation.feedback;

  return (
${fs.readFileSync(path.join(__dirname, 'feedbackCode.txt'), 'utf8').split('\\n').slice(2, -2).join('\\n')}
  );
}
`;
fs.writeFileSync(path.join(componentsDir, 'FeedbackReport.js'), feedbackReportCode);

// 3. Update page.js
let pageJsCode = fs.readFileSync(path.join(__dirname, '..', 'app', 'smart-interview', 'page.js'), 'utf8');

// Replace SetupForm block
const setupBlock = fs.readFileSync(path.join(__dirname, 'setupCode.txt'), 'utf8');
pageJsCode = pageJsCode.replace(
  setupBlock,
  "if (state.status === 'setup') {\\n    return <SetupForm startInterview={startInterview} loadFeedbackHistory={loadFeedbackHistory} handleResumeUpload={handleResumeUpload} loading={loading} />;\\n  }"
);

// Replace FeedbackReport block
const feedbackBlock = fs.readFileSync(path.join(__dirname, 'feedbackCode.txt'), 'utf8');
pageJsCode = pageJsCode.replace(
  feedbackBlock,
  "if (state.status === 'feedback') {\\n    return <FeedbackReport resetInterview={resetInterview} isEvaluating={isEvaluating} />;\\n  }"
);

// Remove the local fileInputRef in page.js
pageJsCode = pageJsCode.replace(/const fileInputRef = useRef\(null\);\\n/g, '');

// Add imports to page.js
// Find the last import statement
const lines = pageJsCode.split('\\n');
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
pageJsCode = lines.join('\\n');

fs.writeFileSync(path.join(__dirname, '..', 'app', 'smart-interview', 'page.js'), pageJsCode);

console.log('Components extracted and page.js updated.');
