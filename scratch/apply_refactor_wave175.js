const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/smart-interview/page.js');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalize source content to LF
content = content.replace(/\r\n/g, '\n');

const replacements = [
  // 1. Remove useState declarations
  {
    name: "Remove config useStates",
    target: `  const [resumeBase64, setResumeBase64] = useState('');
  const [resumeFileName, setResumeFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [round, setRound] = useState('HR Round');
  const [mode, setMode] = useState('voice'); // Supported modes: only 'voice' | 'video'. Typing is completely removed.`,
    replacement: ``
  },
  {
    name: "Remove device useStates",
    target: `  // Device Check Inline States
  const [cameraOk, setCameraOk] = useState(null);
  const [micOk, setMicOk] = useState(null);
  const [voiceOk, setVoiceOk] = useState(null);
  const [selectedLang, setSelectedLang] = useState("en-IN");`,
    replacement: `  // Device Check Inline States`
  },
  
  // 2. sessionStorage restoration in useEffect
  {
    name: "SessionStorage restore",
    target: `          if (s.jobRole) setJobRole(s.jobRole);
          if (s.jobDescription) setJobDescription(s.jobDescription);
          if (s.round) setRound(s.round);
          if (s.mode) setMode(s.mode);
          if (s.resumeBase64) setResumeBase64(s.resumeBase64);
          if (s.resumeFileName) setResumeFileName(s.resumeFileName);`,
    replacement: `          if (s.jobRole) dispatch({ type: 'SET_CONFIG', payload: { jobRole: s.jobRole } });
          if (s.jobDescription) dispatch({ type: 'SET_CONFIG', payload: { jobDescription: s.jobDescription } });
          if (s.round) dispatch({ type: 'SET_CONFIG', payload: { round: s.round } });
          if (s.mode) dispatch({ type: 'SET_CONFIG', payload: { mode: s.mode } });
          if (s.resumeBase64) dispatch({ type: 'SET_CONFIG', payload: { resumeBase64: s.resumeBase64 } });
          if (s.resumeFileName) dispatch({ type: 'SET_CONFIG', payload: { resumeFileName: s.resumeFileName } });`
  },

  // 3. resume upload
  {
    name: "Resume base64 / filename upload",
    target: `      const base64 = await fileToBase64(file);
      setResumeBase64(base64);
      setResumeFileName(file.name);`,
    replacement: `      const base64 = await fileToBase64(file);
      dispatch({ type: 'SET_CONFIG', payload: { resumeBase64: base64, resumeFileName: file.name } });`
  },
  {
    name: "Resume text parse",
    target: `      if (res.ok && data.resumeText) {
        setResumeText(data.resumeText);
      } else {
        setResumeText(\`Resume: \${file.name}\`);
      }`,
    replacement: `      if (res.ok && data.resumeText) {
        dispatch({ type: 'SET_CONFIG', payload: { resumeText: data.resumeText } });
      } else {
        dispatch({ type: 'SET_CONFIG', payload: { resumeText: \`Resume: \${file.name}\` } });
      }`
  },

  // 4. startInterview config reads
  {
    name: "startInterview reads",
    target: `  const startInterview = async (bypassDeviceCheck = false) => {
    if (!resumeBase64 || !jobRole) {
      toast.error('Please upload resume and enter job role');
      return;
    }`,
    replacement: `  const startInterview = async (bypassDeviceCheck = false) => {
    if (!state.config.resumeBase64 || !state.config.jobRole) {
      toast.error('Please upload resume and enter job role');
      return;
    }`
  },
  {
    name: "startInterview api payload",
    target: `          action: 'init',
          resume_base64: resumeBase64,
          job_role: jobRole,
          jd: jobDescription,
          round,
          mode,`,
    replacement: `          action: 'init',
          resume_base64: state.config.resumeBase64,
          job_role: state.config.jobRole,
          jd: state.config.jobDescription,
          round: state.config.round,
          mode: state.config.mode,`
  },

  // 5. submitAnswer config/device reads
  {
    name: "submitAnswer answer logic",
    target: `    const answer =
      typeof overrideAnswer === "string"
        ? overrideAnswer
        : mode === 'voice'
          ? fullTranscript
          : currentAnswer;`,
    replacement: `    const answer =
      typeof overrideAnswer === "string"
        ? overrideAnswer
        : state.config.mode === 'voice'
          ? fullTranscript
          : currentAnswer;`
  },
  {
    name: "submitAnswer debug log",
    target: `    console.log('submitAnswer called:', { answer, shouldFinish, mode, currentQuestion });`,
    replacement: `    console.log('submitAnswer called:', { answer, shouldFinish, mode: state.config.mode, currentQuestion });`
  },
  {
    name: "submitAnswer api payload",
    target: `          action: 'continue',
          resume_base64: resumeBase64,
          job_role: jobRole,
          jd: jobDescription,
          round,`,
    replacement: `          action: 'continue',
          resume_base64: state.config.resumeBase64,
          job_role: state.config.jobRole,
          jd: state.config.jobDescription,
          round: state.config.round,`
  },
  {
    name: "submitAnswer video cleanup",
    target: `      if (mode === 'video') {
        setRecordedVideoUrl('');
        setRecordingState('idle');
        setRecordingTimeLeft(120);
      }`,
    replacement: `      if (state.config.mode === 'video') {
        setRecordedVideoUrl('');
        setRecordingState('idle');
        setRecordingTimeLeft(120);
      }`
  },

  // 6. getFeedback config reads and Firebase writes
  {
    name: "getFeedback api payload",
    target: `          action: 'evaluate',
          job_role: jobRole,
          jd: jobDescription,
          round,`,
    replacement: `          action: 'evaluate',
          job_role: state.config.jobRole,
          jd: state.config.jobDescription,
          round: state.config.round,`
  },
  {
    name: "getFeedback firebase write",
    target: `            await addDoc(collection(db, 'users', user.uid, 'interview_feedback'), {
              jobRole,
              round,`,
    replacement: `            await addDoc(collection(db, 'users', user.uid, 'interview_feedback'), {
              jobRole: state.config.jobRole,
              round: state.config.round,`
  },
  {
    name: "getFeedback local mock write",
    target: `            mockHistory.unshift({
              id: 'mock-feedback-' + Date.now(),
              jobRole,
              round,`,
    replacement: `            mockHistory.unshift({
              id: 'mock-feedback-' + Date.now(),
              jobRole: state.config.jobRole,
              round: state.config.round,`
  },

  // 7. viewHistoricalFeedback setter changes
  {
    name: "viewHistoricalFeedback setters",
    target: `  const viewHistoricalFeedback = (historicalData) => {
    dispatch({ type: 'SET_EVALUATION', payload: { feedback: historicalData.feedback } });
    setJobRole(historicalData.jobRole);
    setRound(historicalData.round);`,
    replacement: `  const viewHistoricalFeedback = (historicalData) => {
    dispatch({ type: 'SET_EVALUATION', payload: { feedback: historicalData.feedback } });
    dispatch({ type: 'SET_CONFIG', payload: { jobRole: historicalData.jobRole, round: historicalData.round } });`
  },

  // 8. Setup form values & events
  {
    name: "SetupForm jobRole field",
    target: `                      <input
                        type="text"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}`,
    replacement: `                      <input
                        type="text"
                        value={state.config.jobRole}
                        onChange={(e) => dispatch({ type: 'SET_CONFIG', payload: { jobRole: e.target.value } })}`
  },
  {
    name: "SetupForm jd field",
    target: `                      <input type="text" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}`,
    replacement: `                      <input type="text" value={state.config.jobDescription} onChange={(e) => dispatch({ type: 'SET_CONFIG', payload: { jobDescription: e.target.value } })}`
  },
  {
    name: "SetupForm round click",
    target: `                            onClick={() => setRound(r)}`,
    replacement: `                            onClick={() => dispatch({ type: 'SET_CONFIG', payload: { round: r } })}`
  },
  {
    name: "SetupForm round active check",
    target: `                              round === r`,
    replacement: `                              state.config.round === r`
  },
  {
    name: "SetupForm mode selection",
    target: `                      {[{m:'voice',Icon:Mic,label:'Voice Only'},{m:'video',Icon:Play,label:'Video & Voice'}].map(({m,Icon,label}) => (
                        <button key={m} onClick={() => setMode(m)}
                          className={\`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all \${
                            mode === m ? 'border-[#0D9488] bg-[#F0FDFA] text-[#0D9488]' : 'border-[#CCFBF1] text-gray-400 hover:border-[#0D9488]/40'
                          }\`}>`,
    replacement: `                      {[{m:'voice',Icon:Mic,label:'Voice Only'},{m:'video',Icon:Play,label:'Video & Voice'}].map(({m,Icon,label}) => (
                        <button key={m} onClick={() => dispatch({ type: 'SET_CONFIG', payload: { mode: m } })}
                          className={\`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all \${
                            state.config.mode === m ? 'border-[#0D9488] bg-[#F0FDFA] text-[#0D9488]' : 'border-[#CCFBF1] text-gray-400 hover:border-[#0D9488]/40'
                          }\`}>`
  },
  {
    name: "SetupForm submit button disabled",
    target: `                <button onClick={() => startInterview(false)} disabled={!resumeBase64 || !jobRole || loading}`,
    replacement: `                <button onClick={() => startInterview(false)} disabled={!state.config.resumeBase64 || !state.config.jobRole || loading}`
  },

  // 9. Device test panel reads & writes
  {
    name: "DeviceTest checks logic",
    target: `  if (state.status === 'device-test') {
    const allDone = cameraOk !== null && micOk !== null && voiceOk !== null;
    const allPass = cameraOk && micOk && voiceOk;
    const corePass = micOk && voiceOk;`,
    replacement: `  if (state.status === 'device-test') {
    const allDone = state.devices.cameraOk !== null && state.devices.micOk !== null && state.devices.voiceOk !== null;
    const allPass = state.devices.cameraOk && state.devices.micOk && state.devices.voiceOk;
    const corePass = state.devices.micOk && state.devices.voiceOk;`
  },
  {
    name: "DeviceTest inputs mapping",
    target: `            {mode === 'video' && <CameraTest onResult={setCameraOk} />}
            <MicTest onResult={setMicOk} />
            <VoiceTest onResult={setVoiceOk} selectedLang={selectedLang} onLangChange={setSelectedLang} />

            {(mode === 'video' ? allPass : corePass) ? (`,
    replacement: `            {state.config.mode === 'video' && <CameraTest onResult={(val) => dispatch({ type: 'SET_DEVICES', payload: { cameraOk: val } })} />}
            <MicTest onResult={(val) => dispatch({ type: 'SET_DEVICES', payload: { micOk: val } })} />
            <VoiceTest onResult={(val) => dispatch({ type: 'SET_DEVICES', payload: { voiceOk: val } })} selectedLang={state.devices.selectedLang} onLangChange={(val) => dispatch({ type: 'SET_DEVICES', payload: { selectedLang: val } })} />

            {(state.config.mode === 'video' ? allPass : corePass) ? (`
  },

  // 10. ActiveInterview config reads
  {
    name: "ActiveInterview round render",
    target: `              <div className="flex items-center gap-2 bg-[#CCFBF1] px-3 py-1.5 rounded-full">
                <span className="text-xs font-bold text-[#0D9488]">Question {questionNumber}</span>
                <span className="text-xs text-gray-400">• {round}</span>
              </div>`,
    replacement: `              <div className="flex items-center gap-2 bg-[#CCFBF1] px-3 py-1.5 rounded-full">
                <span className="text-xs font-bold text-[#0D9488]">Question {questionNumber}</span>
                <span className="text-xs text-gray-400">• {state.config.round}</span>
              </div>`
  },
  {
    name: "ActiveInterview jobRole panel title",
    target: `                    <div className="text-sm text-gray-600">AI Recruiter</div>
                    <div className="font-semibold text-gray-900">{jobRole} Panel</div>`,
    replacement: `                    <div className="text-sm text-gray-600">AI Recruiter</div>
                    <div className="font-semibold text-gray-900">{state.config.jobRole} Panel</div>`
  },
  {
    name: "ActiveInterview video preview condition",
    target: `              {mode === 'video' && !isThinking && (`,
    replacement: `              {state.config.mode === 'video' && !isThinking && (`
  },

  // 11. Feedback screen config reads
  {
    name: "FeedbackReport header labels",
    target: `              <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>Performance Report</h1>
              <p className="text-gray-500 mt-1 text-sm">{jobRole} · {round}</p>`,
    replacement: `              <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>Performance Report</h1>
              <p className="text-gray-500 mt-1 text-sm">{state.config.jobRole} · {state.config.round}</p>`
  },

  // 12. Recording start/stop calls
  {
    name: "startRecordingState mode check",
    target: `  const startRecordingState = () => {
    if (mode === 'video') {`,
    replacement: `  const startRecordingState = () => {
    if (state.config.mode === 'video') {`
  },
  {
    name: "stopRecordingState mode check",
    target: `  const stopRecordingState = () => {
    if (mode === 'video') {`,
    replacement: `  const stopRecordingState = () => {
    if (state.config.mode === 'video') {`
  }
];

let errors = [];
replacements.forEach(r => {
  r.target = r.target.replace(/\r\n/g, '\n');
  const index = content.indexOf(r.target);
  if (index === -1) {
    errors.push(`Target NOT found for replacement: "${r.name}"`);
  } else if (content.indexOf(r.target, index + 1) !== -1) {
    errors.push(`Multiple target matches found for replacement: "${r.name}"`);
  }
});

if (errors.length > 0) {
  console.error("Errors found during verification:");
  errors.forEach(e => console.error(e));
  process.exit(1);
}

replacements.forEach(r => {
  r.replacement = r.replacement.replace(/\r\n/g, '\n');
  content = content.replace(r.target, r.replacement);
  console.log(`Successfully applied: "${r.name}"`);
});

// Convert back to CRLF before writing
const outputContent = content.replace(/\n/g, '\r\n');
fs.writeFileSync(pagePath, outputContent, 'utf8');
console.log("Wave 1.75 state migration completed successfully!");
