"use client";

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import AppShell from "@/components/AppShell";
import { m, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import toast from "react-hot-toast";
import { 
  Canvas,
  SubtlePanel,
  Card,
  Button,
  Input,
  Select,
  typography
} from "@/components/DesignSystem";

// ─── HANDCRAFTED CUSTOM SVG ICON SYSTEM (NO LUCIDE, NO EMOJIS) ───
function SparklesIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function UploadIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function FileTextIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function BriefcaseIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function ChevronRightIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertCircleIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function TrendingUpIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TargetIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function AwardIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

function BookOpenIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function CalendarIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DownloadIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function RefreshCwIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function ClockIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function DollarSignIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function BarChartIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function CopyIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export default function CareerIntelligencePage() {
  const [phase, setPhase] = useState('input'); // input | loading | results
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [inputMode, setInputMode] = useState('file'); // 'file' or 'text'
  const [jobRole, setJobRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [skillTab, setSkillTab] = useState('technical');
  const [expandedSkills, setExpandedSkills] = useState({});
  const [roadmapProgress, setRoadmapProgress] = useState({});
  const [certFilter, setCertFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  const loadingSteps = [
    "Reading resume layout",
    "Mapping the job role requirements",
    "Determining core skill gaps",
    "Scanning recommended certifications",
    "Generating progress action plan"
  ];

  // Load roadmap progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('career_roadmap_progress');
    if (saved) setRoadmapProgress(JSON.parse(saved));
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      toast.success('PDF uploaded and ready.');
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      toast.success('PDF uploaded and ready.');
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  const canAnalyze = (inputMode === 'file' ? resumeFile : resumeText.trim()) && jobRole.trim() && jobDescription.trim();

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setPhase('loading');
    setProgress(0);
    setLoadingStep(0);

    // Animate loading steps
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        return prev;
      });
    }, 1600);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 100) return prev + 2;
        return prev;
      });
    }, 100);

    try {
      const formData = new FormData();
      
      if (inputMode === 'file') {
        formData.append('resume', resumeFile);
      } else {
        formData.append('resumeText', resumeText);
      }
      
      formData.append('jobRole', jobRole);
      formData.append('jobDescription', jobDescription);
      formData.append('userId', auth.currentUser?.uid || '');

      const response = await fetch('/api/career-intelligence', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze');
      }

      clearInterval(stepInterval);
      clearInterval(progressInterval);
      
      setProgress(100);
      setTimeout(() => {
        setResults(data);
        setPhase('results');
      }, 500);

    } catch (error) {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
      toast.error(error.message || 'Analysis failed');
      setPhase('input');
      console.error('Analysis error:', error);
    }
  };

  const toggleRoadmapTask = (weekIndex, taskIndex) => {
    const key = `${weekIndex}-${taskIndex}`;
    const newProgress = {
      ...roadmapProgress,
      [key]: !roadmapProgress[key]
    };
    setRoadmapProgress(newProgress);
    localStorage.setItem('career_roadmap_progress', JSON.stringify(newProgress));
  };

  const getRoadmapCompletion = () => {
    if (!results?.roadmap) return 0;
    const totalTasks = results.roadmap.reduce((acc, week) => acc + week.tasks.length, 0);
    const completedTasks = Object.values(roadmapProgress).filter(Boolean).length;
    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  };

  const scrollToSection = (section) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#14B8A6'; // teal primary
    if (score >= 40) return '#F59E0B'; // amber warning
    return '#EF4444'; // red error
  };

  const filteredCerts = results?.certifications?.filter(cert => {
    if (certFilter === 'all') return true;
    if (certFilter === 'critical') return cert.priority === 'critical';
    if (certFilter === 'free') return cert.cost.toLowerCase().includes('free');
    return true;
  }) || [];

  const filteredCourses = results?.courses?.filter(course => {
    if (courseFilter === 'all') return true;
    if (courseFilter === 'free') return course.cost.toLowerCase() === 'free';
    if (courseFilter === 'quick') return parseInt(course.duration) <= 10;
    if (courseFilter === 'beginner') return course.level === 'Beginner';
    return true;
  }) || [];

  return (
    <Canvas>
      <AppShell>
        <AnimatePresence mode="wait">
          
          {/* PHASE 1: INPUT */}
          {phase === 'input' && (
            <m.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-[1000px] mx-auto px-6 md:px-12 py-10 min-h-screen space-y-12"
            >
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <SparklesIcon className="w-6 h-6" />
                  </div>
                  <h1 className={typography.h1}>Career Intelligence Analyst</h1>
                </div>
                <p className={typography.body}>
                  Identify your exact technical, soft, and industry skill gaps against target jobs instantly.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Resume Card */}
                <Card className="flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <FileTextIcon className="w-4 h-4 text-teal-600" /> Resume Profile
                      </h3>
                      <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setInputMode('file')}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                            inputMode === 'file' 
                              ? 'bg-white text-teal-600 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-850'
                          }`}
                        >
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputMode('text')}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                            inputMode === 'text' 
                              ? 'bg-white text-teal-600 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-850'
                          }`}
                        >
                          TEXT
                        </button>
                      </div>
                    </div>
                    
                    {inputMode === 'file' ? (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                          isDragging 
                            ? 'border-teal-500 bg-teal-50/50' 
                            : resumeFile 
                            ? 'border-emerald-500 bg-emerald-50/20'
                            : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50/30'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        
                        {resumeFile ? (
                          <div className="flex flex-col items-center gap-2">
                            <CheckCircleIcon className="w-10 h-10 text-emerald-600" />
                            <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{resumeFile.name}</p>
                            <p className="text-[10px] text-slate-400">PDF uploaded</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <UploadIcon className="w-10 h-10 text-slate-400" />
                            <p className="text-xs font-bold text-slate-700">Drop PDF here</p>
                            <p className="text-[10px] text-slate-400">or click to browse</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <textarea
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste your raw resume text details (experience, education, projects, skills)..."
                        rows={6}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 resize-none h-[120px]"
                      />
                    )}
                  </div>
                </Card>

                {/* Target Role Card */}
                <Card className="flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <BriefcaseIcon className="w-4 h-4 text-teal-600" /> Target Role
                    </h3>
                    
                    <Input
                      type="text"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder="e.g. SDE-2 at Amazon"
                    />
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Example Templates:</p>
                      <button
                        type="button"
                        onClick={() => setJobRole('Product Manager at Flipkart')}
                        className="text-xs text-teal-600 hover:underline block text-left"
                      >
                        Product Manager at Flipkart
                      </button>
                      <button
                        type="button"
                        onClick={() => setJobRole('Data Scientist at Google')}
                        className="text-xs text-teal-600 hover:underline block text-left"
                      >
                        Data Scientist at Google
                      </button>
                    </div>
                  </div>
                </Card>

                {/* Job Description Card */}
                <Card className="flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <FileTextIcon className="w-4 h-4 text-teal-600" /> Job Description
                    </h3>
                    
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the target job description details or requirement text here..."
                      rows={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400 resize-none h-[120px]"
                    />
                  </div>
                </Card>

              </div>

              {/* Action Button */}
              <Button
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                variant="teal"
                className="w-full justify-center shadow-md py-4 text-base"
              >
                Launch Gap Analysis <ChevronRightIcon className="w-5 h-5 text-white" />
              </Button>

            </m.div>
          )}

          {/* PHASE 2: LOADING */}
          {phase === 'loading' && (
            <m.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-[85vh] flex flex-col items-center justify-center text-center p-6 space-y-6"
            >
              <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-teal-600 animate-spin flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-teal-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-850">{loadingSteps[loadingStep]}</h3>
                <div className="w-64 bg-slate-100 h-1.5 rounded-full overflow-hidden mx-auto">
                  <div 
                    className="h-full bg-teal-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </m.div>
          )}

          {/* PHASE 3: RESULTS */}
          {phase === 'results' && results && (
            <m.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-[1200px] mx-auto px-6 md:px-12 py-10 min-h-screen flex flex-col lg:flex-row gap-8"
            >
              
              {/* LEFT SIDEBAR - Sticky */}
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="sticky top-24 space-y-6">
                  
                  {/* Match Score Card */}
                  <Card className="flex flex-col items-center p-6 space-y-4">
                    <div className="flex items-center gap-3 w-full border-b border-slate-100 pb-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 font-bold text-xs">
                        {jobRole.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Job Position</h4>
                        <p className="text-xs font-bold text-slate-850 truncate max-w-[180px]">{jobRole}</p>
                      </div>
                    </div>

                    {/* Recharts Pie Match Score */}
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { value: results.matchScore },
                              { value: 100 - results.matchScore }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={65}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                          >
                            <Cell fill={getScoreColor(results.matchScore)} />
                            <Cell fill="#F1F5F9" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-3xl font-extrabold text-slate-900">{results.matchScore}%</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Match rating</span>
                      </div>
                    </div>

                    {/* Stats details */}
                    <div className="w-full space-y-2 text-xs border-t border-slate-100 pt-4">
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-400">Skills Weight:</span>
                        <span className="font-bold text-slate-800">{results.scoreBreakdown?.skills}%</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-400">Experience Map:</span>
                        <span className="font-bold text-slate-800">{results.scoreBreakdown?.experience}%</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-slate-400">Academic Score:</span>
                        <span className="font-bold text-slate-800">{results.scoreBreakdown?.education}%</span>
                      </div>
                    </div>
                  </Card>

                  {/* Navigation Links */}
                  <Card className="p-4 space-y-1">
                    {[
                      { id: 'overview', label: 'Summary Overview', icon: TrendingUpIcon },
                      { id: 'skills', label: 'Skill Gap Heatmap', icon: TargetIcon },
                      { id: 'certifications', label: 'Certification Drills', icon: AwardIcon },
                      { id: 'courses', label: 'Curated Courses', icon: BookOpenIcon },
                      { id: 'roadmap', label: 'Action Timeline', icon: CalendarIcon },
                      { id: 'resume', label: 'Resume Checkpoints', icon: FileTextIcon },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeSection === item.id
                              ? 'bg-teal-50 text-teal-700'
                              : 'text-slate-550 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </Card>

                  {/* Sidebar CTAs */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setPhase('input');
                        setResults(null);
                        setResumeFile(null);
                        setJobRole('');
                        setJobDescription('');
                      }}
                      variant="outline"
                      className="w-full justify-center text-xs"
                    >
                      <RefreshCwIcon className="w-3.5 h-3.5" /> Re-Analyze Career Gap
                    </Button>
                  </div>

                </div>
              </div>

              {/* RIGHT CONTENT - Scrollable Panels */}
              <div className="flex-1 space-y-8 pb-24">
                
                {/* OVERVIEW PANEL */}
                <section id="overview" className="scroll-mt-24">
                  <Card className="space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5 text-teal-600" /> Career Profile Analysis
                      </h2>
                    </div>

                    <SubtlePanel className="!p-5 bg-teal-50/20 border-teal-100/50">
                      <p className="text-sm text-slate-700 leading-relaxed font-medium">
                        {results.summary}
                      </p>
                    </SubtlePanel>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Skill Gaps Found</span>
                        <div className="text-2xl font-black text-amber-600">
                          {Object.values(results.missingSkills || {}).flat().length}
                        </div>
                        <span className="text-[9px] text-slate-405 block font-medium">Drills checklist generated</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Critical Certs</span>
                        <div className="text-2xl font-black text-rose-500">
                          {results.certifications?.filter(c => c.priority === 'critical').length || 0}
                        </div>
                        <span className="text-[9px] text-slate-405 block font-medium">Critical blockers found</span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Prep Time</span>
                        <div className="text-2xl font-black text-teal-600">{results.estimatedPrepTime}</div>
                        <span className="text-[9px] text-slate-405 block font-medium">Journey length estimate</span>
                      </div>
                    </div>

                    {results.biggestBlocker && (
                      <div className="border border-rose-100 bg-rose-50/25 rounded-2xl p-5 flex items-start gap-3">
                        <AlertCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Critical Career Blocker</h4>
                          <p className="text-xs text-rose-700 leading-relaxed font-medium">{results.biggestBlocker}</p>
                        </div>
                      </div>
                    )}

                  </Card>
                </section>

                {/* SKILLS HEATMAP PANEL */}
                <section id="skills" className="scroll-mt-24">
                  <Card className="space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <TargetIcon className="w-5 h-5 text-teal-600" /> Skill Gap Heatmap matrix
                      </h2>
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 pb-4">
                      {Object.keys(results.missingSkills || {}).map((category) => (
                        <button
                          key={category}
                          onClick={() => setSkillTab(category)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                            skillTab === category
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50'
                          }`}
                        >
                          {category.charAt(0).toUpperCase() + category.slice(1)} Skills
                          <span className="ml-1.5 text-[10px] opacity-75 font-bold">
                            ({results.missingSkills[category]?.length || 0})
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Skill Heatmap Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {results.missingSkills[skillTab]?.map((skill, index) => {
                        const gap = skill.requiredLevel - skill.currentLevel;
                        const isExpanded = expandedSkills[`${skillTab}-${index}`];
                        
                        // Map color coding based on gap size
                        let heatBg = "bg-emerald-50 border-emerald-150 text-emerald-800";
                        if (gap > 40) {
                          heatBg = "bg-rose-50 border-rose-150 text-rose-800";
                        } else if (gap > 20) {
                          heatBg = "bg-amber-50 border-amber-150 text-amber-800";
                        } else if (gap > 0) {
                          heatBg = "bg-teal-50 border-teal-150 text-teal-800";
                        }

                        return (
                          <div 
                            key={index} 
                            className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all duration-300 ${heatBg}`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h4 className="text-sm font-bold tracking-tight">{skill.skill}</h4>
                                <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">
                                  Current: {skill.currentLevel}% &bull; Required: {skill.requiredLevel}%
                                </p>
                              </div>
                              <span className="text-xs font-black px-2 py-0.5 rounded-md bg-white/50 backdrop-blur-sm">
                                {gap}% gap
                              </span>
                            </div>

                            <div className="space-y-2 border-t border-slate-800/10 pt-3">
                              <p className="text-xs opacity-90 leading-relaxed font-medium">
                                {skill.howToLearn}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </section>

                {/* CERTIFICATIONS PANEL */}
                <section id="certifications" className="scroll-mt-24">
                  <Card className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AwardIcon className="w-5 h-5 text-teal-600" /> Target Industry Certifications
                      </h2>
                      <Select
                        value={certFilter}
                        onChange={(e) => setCertFilter(e.target.value)}
                        className="!w-40 !py-1.5 !text-xs"
                      >
                        <option value="all">All Certifications</option>
                        <option value="critical">Critical Blockers</option>
                        <option value="free">Free / Open</option>
                      </Select>
                    </div>

                    <div className="space-y-4">
                      {filteredCerts.map((cert, index) => {
                        const borderColor = cert.priority === 'critical' ? 'border-rose-500' : 
                                             cert.priority === 'recommended' ? 'border-amber-500' : 
                                             'border-teal-500';
                        
                        return (
                          <div key={index} className={`border-l-4 ${borderColor} bg-slate-50/50 border border-slate-200/50 rounded-2xl p-6 relative flex flex-col justify-between space-y-4`}>
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xs uppercase tracking-widest shrink-0"
                                  style={{ backgroundColor: cert.logoColor || '#0F172A' }}
                                >
                                  {cert.logoAbbr || cert.name?.substring(0,3)}
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-800 text-sm">{cert.name}</h3>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{cert.issuingBody} &bull; Validity: {cert.validity}</p>
                                </div>
                              </div>
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                cert.priority === 'critical' ? 'bg-rose-50 text-rose-700' :
                                cert.priority === 'recommended' ? 'bg-amber-50 text-amber-700' :
                                'bg-teal-50 text-teal-700'
                              }`}>
                                {cert.priority}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 italic leading-relaxed border-t border-slate-100 pt-3">
                              &ldquo;{cert.whyItGetsYouHired}&rdquo;
                            </p>

                            <div className="flex gap-4 text-[10px] font-bold text-slate-500">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                                {cert.duration}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSignIcon className="w-3.5 h-3.5 text-slate-400" />
                                {cert.cost}
                              </div>
                              <div className="flex items-center gap-1">
                                <BarChartIcon className="w-3.5 h-3.5 text-slate-400" />
                                {cert.demandLevel} Demand
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <a
                                href={cert.certificationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-slate-900 hover:bg-slate-950 text-white px-3 py-2 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1 transition-all"
                              >
                                Certification Page <ExternalLinkIcon className="w-3 h-3 text-white" />
                              </a>
                              <a
                                href={cert.prepCourseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1 transition-all"
                              >
                                Study Prep Material <ExternalLinkIcon className="w-3 h-3 text-white" />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </section>

                {/* CURATED COURSES PANEL */}
                <section id="courses" className="scroll-mt-24">
                  <Card className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <BookOpenIcon className="w-5 h-5 text-teal-600" /> Curated Academic Courseware
                      </h2>
                      <Select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className="!w-40 !py-1.5 !text-xs"
                      >
                        <option value="all">All Courseware</option>
                        <option value="free">Free Only</option>
                        <option value="quick">Short drills (&lt;10hrs)</option>
                        <option value="beginner">Beginner tier</option>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredCourses.map((course, index) => {
                        const platformColors = {
                          'Coursera': 'bg-blue-600',
                          'Udemy': 'bg-purple-600',
                          'YouTube': 'bg-red-600',
                          'freeCodeCamp': 'bg-slate-900',
                          'edX': 'bg-indigo-600'
                        };
                        
                        return (
                          <div key={index} className="border border-slate-200/70 rounded-2xl overflow-hidden hover:shadow-sm transition-all flex flex-col justify-between bg-white">
                            <div className={`h-1.5 ${platformColors[course.platform] || 'bg-slate-500'}`} />
                            
                            <div className="p-5 space-y-4 flex-grow flex flex-col justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{course.platform}</span>
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${
                                    course.cost.toLowerCase() === 'free' 
                                      ? 'bg-emerald-50 text-emerald-700' 
                                      : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {course.cost}
                                  </span>
                                </div>

                                <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{course.name}</h3>
                                <p className="text-[11px] text-slate-550">By {course.instructor}</p>
                              </div>

                              <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between text-[11px] text-slate-550">
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                                    {course.duration}
                                  </span>
                                  <span className="font-bold text-amber-500">
                                    Rating: {course.rating} / 5
                                  </span>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                  <span className="text-[8px] font-bold bg-teal-50 border border-teal-100 text-teal-700 px-1.5 py-0.5 rounded-md">
                                    {course.skillTaught}
                                  </span>
                                  <span className="text-[8px] font-bold bg-slate-50 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md">
                                    {course.level}
                                  </span>
                                </div>

                                <a
                                  href={course.directUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl font-bold text-xs text-center flex items-center justify-center gap-1 transition-all"
                                >
                                  Launch Courseware <ChevronRightIcon className="w-3 h-3 text-white" />
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </section>

                {/* ACTION PLAN TIMELINE PANEL */}
                <section id="roadmap" className="scroll-mt-24">
                  <Card className="space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-teal-600" /> Custom Action Roadmap
                      </h2>
                    </div>

                    <div className="space-y-3 bg-slate-50/50 p-4 border border-slate-100 rounded-2xl">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                        <span>Overall Roadmap Progress:</span>
                        <span>{getRoadmapCompletion()}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${getRoadmapCompletion()}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline Tree Component */}
                    <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-8 py-2">
                      {results.roadmap?.map((week, weekIndex) => (
                        <div key={weekIndex} className="relative space-y-4">
                          
                          {/* Timeline Node */}
                          <div className="absolute -left-[37px] top-0.5 w-6 h-6 rounded-full border bg-white border-teal-500 text-teal-600 font-extrabold text-[10px] flex items-center justify-center shadow-sm">
                            {week.week}
                          </div>

                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">
                            Week {week.week} Phase Plan
                          </h3>

                          <div className="space-y-3 pl-2">
                            {week.tasks?.map((task, taskIndex) => {
                              const taskKey = `${weekIndex}-${taskIndex}`;
                              const isCompleted = roadmapProgress[taskKey];
                              const typeColors = {
                                'learning': 'border-blue-500 bg-blue-50/20 text-blue-900',
                                'certification': 'border-purple-500 bg-purple-50/20 text-purple-900',
                                'project': 'border-emerald-500 bg-emerald-50/20 text-emerald-900',
                                'apply': 'border-amber-500 bg-amber-50/20 text-amber-900'
                              };
                              
                              return (
                                <div 
                                  key={taskIndex}
                                  className={`border-l-4 ${typeColors[task.type] || 'border-slate-300 bg-slate-50'} rounded-2xl p-4 transition-all ${
                                    isCompleted ? 'opacity-50' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      onChange={() => toggleRoadmapTask(weekIndex, taskIndex)}
                                      className="mt-0.5 w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500 focus:ring-2"
                                    />
                                    <div className="space-y-2">
                                      <h4 className={`text-xs md:text-sm font-bold text-slate-800 ${
                                        isCompleted ? 'line-through' : ''
                                      }`}>
                                        {task.title}
                                      </h4>
                                      
                                      <div className="flex items-center gap-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span className="flex items-center gap-1">
                                          <ClockIcon className="w-3 h-3 text-slate-400" />
                                          {task.timeEstimate}
                                        </span>
                                        <span className={`px-1.5 py-0.2 rounded ${
                                          task.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                          task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                          'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        }`}>
                                          {task.priority} Priority
                                        </span>
                                        <span>{task.type}</span>
                                      </div>

                                      {task.url && (
                                        <a
                                          href={task.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-teal-600 hover:underline inline-flex items-center gap-1 font-bold pt-1"
                                        >
                                          View Resource <ExternalLinkIcon className="w-3 h-3" />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>

                {/* RESUME TIPS PANEL */}
                <section id="resume" className="scroll-mt-24">
                  <Card className="space-y-6">
                    <div className="border-b border-slate-100 pb-4">
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <FileTextIcon className="w-5 h-5 text-teal-600" /> Resume Tip Matrix
                      </h2>
                    </div>

                    <div className="space-y-6">
                      {results.resumeTips?.map((tip, index) => (
                        <div key={index} className="border border-slate-200/60 rounded-2xl p-6 space-y-4">
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">&bull; Weak wording</h4>
                              <div className="bg-rose-50/20 border border-rose-100/50 rounded-xl p-4 text-xs font-semibold text-rose-800 italic">
                                &ldquo;{tip.original}&rdquo;
                              </div>
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">&bull; Optimized version</h4>
                              <div className="bg-emerald-50/20 border border-emerald-155 rounded-xl p-4 text-xs font-semibold text-emerald-800 italic">
                                &ldquo;{tip.improved}&rdquo;
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4 text-xs leading-relaxed text-slate-600 font-medium">
                            <span className="font-bold text-slate-800 uppercase tracking-wider text-[9px] block mb-1">Impact analysis:</span>
                            {tip.reason}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(tip.improved);
                              toast.success('Optimized version copied!');
                            }}
                            className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 hover:underline"
                          >
                            <CopyIcon className="w-3.5 h-3.5" /> Copy Optimized Bullet point
                          </button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>

              </div>
            </m.div>
          )}

        </AnimatePresence>
      </AppShell>
    </Canvas>
  );
}
