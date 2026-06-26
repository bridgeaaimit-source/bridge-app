'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Canvas, Button, Card, Input, Select } from '@/components/DesignSystem';
import PersonaCard from '@/components/gd-ai/PersonaCard';
import { getSessionPersonas, MODERATOR } from '@/lib/gdPersonas';
import toast from 'react-hot-toast';
import { useAuthBypass } from '@/hooks/useAuthBypass';
import { auth } from '@/lib/firebase';

const TOPIC_PRESETS = {
  current_affairs: [
    "Should India mandate AI literacy in school curriculum by 2027?",
    "One Nation One Election: Feasibility and impact on federalism.",
    "Is India ready for a complete transition to Electric Vehicles by 2030?"
  ],
  business: [
    "Is the 70-hour work week sustainable for Indian youth?",
    "Central Bank Digital Currencies (CBDC) vs Private Crypto.",
    "Is the Indian startup boom sustainable or a funding bubble?"
  ],
  tech: [
    "Will Generative AI create more jobs than it destroys?",
    "Should social media platforms be regulated as publishers?",
    "Data Privacy: Can it exist in the age of big data and AI?"
  ],
  social: [
    "Has social media destroyed offline community relationships?",
    "Should higher education in India be fully privatized?",
    "Environmental conservation vs rapid industrialization in developing countries."
  ],
  abstract: [
    "Red is better than blue.",
    "The path is more important than the destination.",
    "Failure is a better teacher than success."
  ],
  case_study: [
    "A logistics company faces a 20% driver shortage during peak season. Solve it.",
    "A retail bank sees 40% customer attrition to digital-first neo-banks. Adapt.",
    "An eco-friendly cosmetics brand wants to scale retail on a low budget."
  ],
  stress_gd: [
    "Should incompetent employees be fired instantly without severance?",
    "Is absolute compliance to authority necessary for corporate efficiency?",
    "Academic grades are the only valid measure of competence in tech recruiting."
  ],
  ethics: [
    "Should companies track employee screens during remote work?",
    "CSR: Genuine philanthropy or greenwashing marketing?",
    "Is lobbying ethical in corporate policy development?"
  ]
};

const CATEGORY_NAMES = {
  current_affairs: 'Current Affairs',
  business: 'Business & Finance',
  tech: 'Tech & Innovation',
  social: 'Social Issues',
  abstract: 'Abstract Topics',
  case_study: 'Case Study & Ops',
  stress_gd: 'Stress GD Boost',
  ethics: 'Ethics & Governance'
};

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isBypassed, mockUser } = useAuthBypass();
  const [currentUser, setCurrentUser] = useState(null);

  // Setup Flow Steps: 1 = Config, 2 = Personas, 3 = Check
  const [step, setStep] = useState(1);

  // Form State
  const [category, setCategory] = useState('current_affairs');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [language, setLanguage] = useState('en-IN');

  // Device Check State
  const [micGranted, setMicGranted] = useState(false);
  const [requestingMic, setRequestingMic] = useState(false);
  const [testingSpeaker, setTestingSpeaker] = useState(false);
  const [speakerTested, setSpeakerTested] = useState(false);

  // Check URL category
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam && TOPIC_PRESETS[catParam]) {
      setCategory(catParam);
    }
  }, [searchParams]);

  // Set default topic when category changes
  useEffect(() => {
    const presets = TOPIC_PRESETS[category] || [];
    if (presets.length > 0 && !isCustomTopic) {
      setSelectedTopic(presets[0]);
    }
  }, [category, isCustomTopic]);

  // Resolve user
  useEffect(() => {
    if (isBypassed) {
      setCurrentUser(mockUser);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsubscribe();
  }, [isBypassed, mockUser]);

  const activeTopic = isCustomTopic ? customTopic : selectedTopic;
  const personas = getSessionPersonas(difficulty);

  // Handle Mic Request
  const requestMicPermission = async () => {
    setRequestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the test stream tracks immediately
      stream.getTracks().forEach(track => track.stop());
      setMicGranted(true);
      toast.success('Microphone access granted!');
    } catch (err) {
      console.error('Mic permission denied:', err);
      toast.error('Microphone permission was denied. Please check your browser settings.');
    } finally {
      setRequestingMic(false);
    }
  };

  // Test Speaker
  const testSpeakerAudio = async () => {
    setTestingSpeaker(true);
    try {
      const response = await fetch('/api/gd-ai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: 'Speaker check. Your sound is configured correctly. Welcome to Bridge A.I. Group Discussion chamber.',
          voiceRole: 'moderator',
          sessionId: 'audio_check_test',
        }),
      });

      if (!response.ok) throw new Error('TTS check failed');

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setTestingSpeaker(false);
        setSpeakerTested(true);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('Audio test failed:', err);
      toast.error('Failed to play test audio. Continuing anyway.');
      setTestingSpeaker(false);
      setSpeakerTested(true);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (isCustomTopic && !customTopic.trim()) {
        toast.error('Please enter a custom topic title.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleStartSession = () => {
    if (!micGranted) {
      toast.error('Please test and grant microphone access to proceed.');
      return;
    }

    const uid = currentUser?.uid || 'guest_user';
    const setupData = {
      topic: activeTopic,
      category: CATEGORY_NAMES[category] || category,
      difficulty,
      language,
      sessionId: `gd_ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      uid,
      studentName: currentUser?.displayName || currentUser?.name || 'Candidate',
    };

    // Save to sessionStorage
    sessionStorage.setItem('gdSetup', JSON.stringify(setupData));
    router.push('/gd/ai/session');
  };

  return (
    <Canvas>
      <AppShell>
        <div className="max-w-4xl mx-auto px-6 py-10 min-h-[90vh] flex flex-col justify-between">
          
          {/* Progress Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Configure Practice Chamber</h1>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Set up your discussion variables</p>
              </div>
              
              {/* Step indicator bubbles */}
              <div className="flex items-center gap-3">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="flex items-center gap-1.5">
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        step === num 
                          ? 'bg-teal-600 text-white shadow-md scale-105' 
                          : step > num 
                            ? 'bg-teal-100 text-teal-700 font-black' 
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step > num ? '✓' : num}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline ${
                      step === num ? 'text-teal-700' : 'text-slate-400'
                    }`}>
                      {num === 1 ? 'Topic' : num === 2 ? 'Candidates' : 'Devices'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: Topic selection */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category & Topic Form */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Category</label>
                      <Select 
                        value={category} 
                        onChange={(e) => {
                          setCategory(e.target.value);
                          setIsCustomTopic(false);
                        }}
                      >
                        {Object.entries(CATEGORY_NAMES).map(([id, name]) => (
                          <option key={id} value={id}>{name}</option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Topic Option</label>
                      <div className="space-y-2">
                        {TOPIC_PRESETS[category]?.map((topicOption, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedTopic(topicOption);
                              setIsCustomTopic(false);
                            }}
                            className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all font-medium ${
                              !isCustomTopic && selectedTopic === topicOption
                                ? 'bg-teal-50/50 border-teal-500 text-teal-900 shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50/80'
                            }`}
                          >
                            {topicOption}
                          </button>
                        ))}

                        {/* Custom Topic Toggle */}
                        <button
                          type="button"
                          onClick={() => setIsCustomTopic(true)}
                          className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all font-medium ${
                            isCustomTopic
                              ? 'bg-teal-50/50 border-teal-500 text-teal-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50/80'
                          }`}
                        >
                          ✏ Enter custom topic...
                        </button>
                      </div>
                    </div>

                    {isCustomTopic && (
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Custom Topic Title</label>
                        <Input
                          type="text"
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                          placeholder="e.g. Is remote work really the future of tech companies?"
                        />
                      </div>
                    )}
                  </div>

                  {/* Difficulty & Language Panel */}
                  <div className="space-y-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100/80">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Chamber Complexity</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['easy', 'intermediate', 'hard'].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setDifficulty(lvl)}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all border capitalize ${
                              difficulty === lvl
                                ? 'bg-slate-900 text-white border-slate-950 shadow-md scale-102'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        {difficulty === 'easy' && 'Easy: Co-participants debate slowly with few interruptions, helpful for beginners.'}
                        {difficulty === 'intermediate' && 'Medium: Balanced debate flow with normal speaking speeds and occasional interruption.'}
                        {difficulty === 'hard' && 'Hard: Aggressive speakers, heavy interruptions, requires strong logic framing.'}
                      </p>
                    </div>

                    <div className="space-y-3 border-t border-slate-200/50 pt-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Primary Language Accent</label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setLanguage('en-IN')}
                          className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                            language === 'en-IN'
                              ? 'bg-white border-teal-500 text-teal-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-slate-800">English (India)</span>
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5">Professional accent style</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLanguage('hi-IN')}
                          className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-left flex flex-col justify-between ${
                            language === 'hi-IN'
                              ? 'bg-white border-teal-500 text-teal-900 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-slate-800">Hinglish mix</span>
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5">Hindi/English conversational cues</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Persona Introductions */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in py-2">
                <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {MODERATOR.avatarInitial}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{MODERATOR.name}</span>
                      <span className="text-[9px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full font-bold">Session Moderator</span>
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {MODERATOR.background} She will introduce the topic and manage floor transitions.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {personas.map((persona) => (
                    <PersonaCard key={persona.id} persona={persona} />
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Device Check */}
            {step === 3 && (
              <div className="max-w-md mx-auto space-y-6 animate-fade-in py-8">
                <Card className="p-6 border-slate-200/80 space-y-6">
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-slate-800 text-lg">Hardware Verification</h3>
                    <p className="text-xs text-slate-400">Ensure microphone and audio outputs are active.</p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Microphone access verification block */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          micGranted ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-150 text-slate-400'
                        }`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          </svg>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block">Microphone Access</span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {micGranted ? 'Microphone verified successfully' : 'Not granted'}
                          </span>
                        </div>
                      </div>
                      
                      {!micGranted ? (
                        <button
                          onClick={requestMicPermission}
                          disabled={requestingMic}
                          className="bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
                        >
                          {requestingMic ? 'Granting...' : 'Grant Access'}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">✓ Verified</span>
                      )}
                    </div>

                    {/* Speaker test audio block */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          speakerTested ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-150 text-slate-400'
                        }`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                          </svg>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 block">Speaker Sound Output</span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {testingSpeaker ? 'Playing test speech...' : speakerTested ? 'Audio played successfully' : 'Verify speakers work'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={testSpeakerAudio}
                        disabled={testingSpeaker}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-300"
                      >
                        {testingSpeaker ? 'Playing...' : speakerTested ? 'Test Sound Again' : 'Play Test Sound'}
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-6 mt-8">
            <button
              onClick={handlePrevStep}
              disabled={step === 1}
              className={`text-xs font-bold text-slate-500 px-4 py-2 rounded-xl transition-all duration-200 ${
                step === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100'
              }`}
            >
              ← Back
            </button>

            {step < 3 ? (
              <Button 
                onClick={handleNextStep}
                variant="teal"
                className="font-bold px-5 py-2.5 rounded-xl shadow-md"
              >
                Continue &rarr;
              </Button>
            ) : (
              <Button 
                onClick={handleStartSession}
                disabled={!micGranted}
                variant="teal"
                className={`font-bold px-6 py-3 rounded-xl shadow-lg transition-all ${
                  !micGranted ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01]'
                }`}
              >
                Start Practice Room
              </Button>
            )}
          </div>

        </div>
      </AppShell>
    </Canvas>
  );
}

export default function GDAISetupPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    }>
      <SetupContent />
    </Suspense>
  );
}
