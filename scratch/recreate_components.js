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

const setupBlock = code.substring(setupStart, deviceTestStart);
const feedbackBlock = code.substring(feedbackStart, historyStart);

// Create SetupForm.js
let setupInner = setupBlock.split('\n');
// setupInner[0] is "if (state.status === 'setup') {"
// setupInner[1] is "    return ("
// we want from index 2
// we want to drop the last 3 lines: "    );" "  }" ""
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

// Create FeedbackReport.js
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
fs.writeFileSync(path.join(componentsDir, 'SetupForm.js'), setupFormCode);
fs.writeFileSync(path.join(componentsDir, 'FeedbackReport.js'), feedbackReportCode);

console.log("Recreated components!");
