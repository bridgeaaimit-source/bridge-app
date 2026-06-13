const fs = require('fs');
const path = require('path');

const pageJsPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js');
const pageJsBakPath = path.join(__dirname, '..', 'app', 'smart-interview', 'page.js.bak');

// 1. Copy page.js.bak to page.js
let code = fs.readFileSync(pageJsBakPath, 'utf8');

// 2. Clean up unused lucide icons in page.js
code = code.replace(
  'import { ChevronLeft, Brain, Mic, Upload, FileText, CheckCircle, AlertCircle, TrendingUp, Award, MessageSquare, X, Play, Volume2, Lightbulb, History, Camera, XCircle, ArrowRight } from "lucide-react";',
  'import { ChevronLeft, Brain, Mic, CheckCircle, TrendingUp, MessageSquare, X, Volume2, History, Camera, XCircle, ArrowRight } from "lucide-react";'
);

// 3. Identify the indices of setup, device-test, feedback, and history status check blocks
const setupStartStr = "if (state.status === 'setup') {";
const deviceTestStartStr = "if (state.status === 'device-test') {";
const interviewingStartStr = "// INTERVIEW SCREEN";
const feedbackStartStr = "if (state.status === 'state.evaluation.feedback') {";
const historyStartStr = "// HISTORY SCREEN";

const setupStart = code.indexOf(setupStartStr);
const deviceTestStart = code.indexOf(deviceTestStartStr);
const interviewingStart = code.indexOf(interviewingStartStr);
const feedbackStart = code.indexOf(feedbackStartStr);
const historyStart = code.indexOf(historyStartStr);

console.log({ setupStart, deviceTestStart, interviewingStart, feedbackStart, historyStart });

if (setupStart === -1 || deviceTestStart === -1 || interviewingStart === -1 || feedbackStart === -1 || historyStart === -1) {
  console.error("Could not find block boundaries!");
  process.exit(1);
}

const setupBlock = code.substring(setupStart, deviceTestStart);
const deviceTestBlock = code.substring(deviceTestStart, interviewingStart);
const feedbackBlock = code.substring(feedbackStart, historyStart);

// 4. Replace blocks in page.js
code = code.replace(setupBlock, "if (state.status === 'setup') {\n    return <SetupForm startInterview={startInterview} loadFeedbackHistory={loadFeedbackHistory} handleResumeUpload={handleResumeUpload} loading={loading} />;\n  }\n\n  ");
code = code.replace(deviceTestBlock, "if (state.status === 'device-test') {\n    return <DeviceTestPanel startInterview={startInterview} />;\n  }\n\n  ");
code = code.replace(feedbackBlock, "if (state.status === 'feedback') {\n    return <FeedbackReport resetInterview={resetInterview} isEvaluating={isEvaluating} />;\n  }\n\n  ");

// 5. Remove inline CameraTest, MicTest, and VoiceTest definitions
const inlineComponentsStartStr = "// ─── Camera Test Component ──────────────────────────────────────────────────";
const inlineComponentsEndStr = "function SmartInterviewContent() {";

const compStart = code.indexOf(inlineComponentsStartStr);
const compEnd = code.indexOf(inlineComponentsEndStr);

console.log({ compStart, compEnd });

if (compStart !== -1 && compEnd !== -1) {
  const inlineComponentsBlock = code.substring(compStart, compEnd);
  code = code.replace(inlineComponentsBlock, "// Extracted CameraTest, MicTest, and VoiceTest subcomponents into separate files under components/smart-interview/\n");
}

// 6. Clean up unused refs and states
code = code.replace(/const fileInputRef = useRef\(null\);\n/g, '');

// 7. Add component imports at the bottom of the file
const bottomImportRefStr = "import { InterviewProvider, useInterviewState, useInterviewDispatch } from '@/context/InterviewContext';";
const bottomImportIdx = code.indexOf(bottomImportRefStr);

if (bottomImportIdx !== -1) {
  const replacementImports = bottomImportRefStr + "\n" +
    "import SetupForm from '@/components/smart-interview/SetupForm';\n" +
    "import FeedbackReport from '@/components/smart-interview/FeedbackReport';\n" +
    "import DeviceTestPanel from '@/components/smart-interview/DeviceTestPanel';";
  code = code.replace(bottomImportRefStr, replacementImports);
}

// 8. Insert useInterviewState and useInterviewDispatch declarations at the top of SmartInterviewContent
code = code.replace(
  'function SmartInterviewContent() {',
  'function SmartInterviewContent() {\n  const state = useInterviewState();\n  const dispatch = useInterviewDispatch();'
);

fs.writeFileSync(pageJsPath, code);
console.log("Refactoring page.js and fixing state definitions completed successfully!");
