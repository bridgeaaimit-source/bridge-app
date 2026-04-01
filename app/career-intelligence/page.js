"use client";
import { useState, useEffect } from 'react';
import AppShell from "@/components/AppShell";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, Briefcase, Sparkles, CheckCircle, 
  TrendingUp, Award, BookOpen, Calendar, Target, 
  ExternalLink, Download, RefreshCw, ChevronRight,
  Clock, DollarSign, BarChart3, AlertCircle
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import toast from "react-hot-toast";

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
    "Reading your resume",
    "Mapping the job requirements",
    "Finding your skill gaps",
    "Scanning 10,000+ certifications",
    "Building your roadmap"
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
      toast.success('Resume uploaded!');
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      toast.success('Resume uploaded!');
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
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
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
    <AppShell>
      <AnimatePresence mode="wait">
        {/* PHASE 1: INPUT */}
        {phase === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[calc(100vh-200px)] flex items-center justify-center"
          >
            <div className="max-w-5xl mx-auto w-full px-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-12"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <Sparkles className="w-8 h-8 text-purple-500" />
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                    How ready are you?
                  </h1>
                </div>
                <p className="text-lg text-gray-600">
                  Upload your resume, tell us the role — we'll tell you exactly what's missing.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Card 1: Resume Upload/Text */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl border-2 border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-900">Resume</h3>
                    </div>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setInputMode('file')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          inputMode === 'file' 
                            ? 'bg-white text-purple-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        PDF
                      </button>
                      <button
                        onClick={() => setInputMode('text')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          inputMode === 'text' 
                            ? 'bg-white text-purple-600 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Text
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
                          ? 'border-purple-500 bg-purple-50' 
                          : resumeFile 
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      {resumeFile ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <CheckCircle className="w-12 h-12 text-green-600" />
                          <p className="text-sm font-medium text-gray-900">{resumeFile.name}</p>
                          <p className="text-xs text-gray-500">PDF uploaded</p>
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-12 h-12 text-gray-400" />
                          <p className="text-sm font-medium text-gray-700">Drop PDF here</p>
                          <p className="text-xs text-gray-500">or click to browse</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume text here..."
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors resize-none text-sm text-gray-900 placeholder-gray-400"
                    />
                  )}
                </motion.div>

                {/* Card 2: Job Role */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-2xl border-2 border-gray-200 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-cyan-600" />
                    <h3 className="font-semibold text-gray-900">Target Role</h3>
                  </div>
                  
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. SDE-2 at Amazon"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:outline-none transition-colors text-gray-900 placeholder-gray-400"
                  />
                  
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-gray-500">Examples:</p>
                    <button
                      onClick={() => setJobRole('Product Manager at Flipkart')}
                      className="text-xs text-cyan-600 hover:underline block"
                    >
                      Product Manager at Flipkart
                    </button>
                    <button
                      onClick={() => setJobRole('Data Scientist at Google')}
                      className="text-xs text-cyan-600 hover:underline block"
                    >
                      Data Scientist at Google
                    </button>
                  </div>
                </motion.div>

                {/* Card 3: Job Description */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl border-2 border-gray-200 p-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-teal-600" />
                    <h3 className="font-semibold text-gray-900">Job Description</h3>
                  </div>
                  
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the complete job description here..."
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors resize-none text-gray-900 placeholder-gray-400 text-sm"
                  />
                  
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">Or paste LinkedIn job URL</p>
                    <p className="text-xs text-gray-400">{jobDescription.length} chars</p>
                  </div>
                </motion.div>
              </div>

              {/* CTA Button */}
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                  canAnalyze
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Analyze <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: LOADING */}
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900"
          >
            <div className="text-center">
              <motion.div
                key={loadingStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-8"
              >
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {loadingSteps[loadingStep]}
                </h2>
                <div className="flex items-center justify-center gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-cyan-400 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>

              <div className="w-96 max-w-full mx-auto mb-4">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <p className="text-sm text-gray-400">This usually takes 5-10 seconds</p>
            </div>
          </motion.div>
        )}

        {/* PHASE 3: RESULTS */}
        {phase === 'results' && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-6"
          >
            {/* LEFT SIDEBAR - Sticky */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                {/* Profile Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {jobRole.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">Applying for</h3>
                      <p className="text-xs text-gray-600">{jobRole}</p>
                    </div>
                  </div>

                  {/* Match Score Donut */}
                  <div className="relative h-48 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { value: results.matchScore },
                            { value: 100 - results.matchScore }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                        >
                          <Cell fill={getScoreColor(results.matchScore)} />
                          <Cell fill="#f3f4f6" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="text-4xl font-bold"
                        style={{ color: getScoreColor(results.matchScore) }}
                      >
                        {results.matchScore}%
                      </motion.div>
                      <p className="text-xs text-gray-600">Match Score</p>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Skills</span>
                      <span className="font-semibold">{results.scoreBreakdown.skills}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Experience</span>
                      <span className="font-semibold">{results.scoreBreakdown.experience}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Education</span>
                      <span className="font-semibold">{results.scoreBreakdown.education}%</span>
                    </div>
                  </div>
                </div>

                {/* Quick Jump Links */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Quick Jump</h4>
                  <nav className="space-y-1">
                    {[
                      { id: 'overview', label: 'Overview', icon: TrendingUp },
                      { id: 'skills', label: 'Missing Skills', icon: Target },
                      { id: 'certifications', label: 'Certifications', icon: Award },
                      { id: 'courses', label: 'Courses', icon: BookOpen },
                      { id: 'roadmap', label: 'Roadmap', icon: Calendar },
                      { id: 'resume', label: 'Resume Tips', icon: FileText },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => scrollToSection(item.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeSection === item.id
                              ? 'bg-cyan-50 text-cyan-700 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-3 rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                  <button
                    onClick={() => {
                      setPhase('input');
                      setResults(null);
                      setResumeFile(null);
                      setJobRole('');
                      setJobDescription('');
                    }}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-analyze
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT CONTENT - Scrollable */}
            <div className="flex-1 space-y-8 pb-20">
              {/* SECTION 1: OVERVIEW */}
              <section id="overview" className="scroll-mt-24">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-lg p-6 mb-6">
                    <p className="text-gray-800 leading-relaxed">{results.summary}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-orange-600" />
                        <h4 className="font-semibold text-gray-900">Skills Gap</h4>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {Object.values(results.missingSkills).flat().length}
                      </p>
                      <p className="text-xs text-gray-600">skills to learn</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="w-5 h-5 text-purple-600" />
                        <h4 className="font-semibold text-gray-900">Certs Needed</h4>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {results.certifications.filter(c => c.priority === 'critical').length}
                      </p>
                      <p className="text-xs text-gray-600">critical certifications</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-cyan-600" />
                        <h4 className="font-semibold text-gray-900">Prep Time</h4>
                      </div>
                      <p className="text-2xl font-bold text-cyan-600">
                        {results.estimatedPrepTime}
                      </p>
                      <p className="text-xs text-gray-600">estimated timeline</p>
                    </div>
                  </div>

                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 mb-1">Your Biggest Blocker</h4>
                        <p className="text-red-800">{results.biggestBlocker}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* SECTION 2: SKILL GAP ANALYSIS */}
              <section id="skills" className="scroll-mt-24">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills You Need to Land This Role</h2>
                  
                  {/* Skill Category Tabs */}
                  <div className="flex gap-2 mb-6 overflow-x-auto">
                    {Object.keys(results.missingSkills).map((category) => (
                      <button
                        key={category}
                        onClick={() => setSkillTab(category)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                          skillTab === category
                            ? 'bg-cyan-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.charAt(0).toUpperCase() + category.slice(1)} Skills
                        <span className="ml-2 text-xs opacity-75">
                          ({results.missingSkills[category].length})
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Skill Bars */}
                  <div className="space-y-4">
                    {results.missingSkills[skillTab]?.map((skill, index) => {
                      const gap = skill.requiredLevel - skill.currentLevel;
                      const isExpanded = expandedSkills[`${skillTab}-${index}`];
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <button
                            onClick={() => setExpandedSkills({
                              ...expandedSkills,
                              [`${skillTab}-${index}`]: !isExpanded
                            })}
                            className="w-full"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">{skill.skill}</h4>
                              <span className="text-sm font-medium text-orange-600">{gap}% gap</span>
                            </div>
                            
                            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${skill.currentLevel}%` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className="absolute left-0 top-0 h-full bg-gray-400 rounded-full"
                              />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${skill.requiredLevel}%` }}
                                transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                                className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full opacity-50"
                              />
                              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                                <span className="text-gray-700">Current: {skill.currentLevel}%</span>
                                <span className="text-gray-900">Required: {skill.requiredLevel}%</span>
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="mt-4 pt-4 border-t border-gray-200"
                            >
                              <h5 className="font-semibold text-gray-900 mb-2 text-sm">How to Learn This</h5>
                              <p className="text-sm text-gray-700">{skill.howToLearn}</p>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </section>

              {/* SECTION 3: CERTIFICATIONS */}
              <section id="certifications" className="scroll-mt-24">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Certifications That Will Get You Hired</h2>
                    <select
                      value={certFilter}
                      onChange={(e) => setCertFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Certifications</option>
                      <option value="critical">Critical Only</option>
                      <option value="free">Free Only</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    {filteredCerts.map((cert, index) => {
                      const borderColor = cert.priority === 'critical' ? 'border-red-500' : 
                                         cert.priority === 'recommended' ? 'border-amber-500' : 
                                         'border-green-500';
                      
                      return (
                        <div key={index} className={`border-l-4 ${borderColor} bg-gray-50 rounded-lg p-6`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: cert.logoColor }}
                              >
                                {cert.logoAbbr}
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 text-lg">{cert.name}</h3>
                                <p className="text-sm text-gray-600">{cert.issuingBody} • Valid for {cert.validity}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              cert.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              cert.priority === 'recommended' ? 'bg-amber-100 text-amber-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {cert.priority.toUpperCase()}
                            </span>
                          </div>

                          <p className="text-gray-800 italic mb-4">"{cert.whyItGetsYouHired}"</p>

                          <div className="flex gap-3 mb-4">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Clock className="w-4 h-4" />
                              {cert.duration}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              {cert.cost}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <BarChart3 className="w-4 h-4" />
                              {cert.demandLevel} Demand
                            </div>
                          </div>

                          <details className="mb-4">
                            <summary className="cursor-pointer text-sm font-semibold text-gray-900 mb-2">
                              What You'll Learn
                            </summary>
                            <ul className="space-y-1 ml-4">
                              {cert.whatYoullLearn.map((item, i) => (
                                <li key={i} className="text-sm text-gray-700 list-disc">{item}</li>
                              ))}
                            </ul>
                          </details>

                          <div className="flex gap-3">
                            <a
                              href={cert.certificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                            >
                              Get Certified <ExternalLink className="w-4 h-4" />
                            </a>
                            <a
                              href={cert.prepCourseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                              Best Prep Course <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Prep: {cert.prepCourseName} on {cert.prepCoursePlatform}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </section>

              {/* SECTION 4: COURSES */}
              <section id="courses" className="scroll-mt-24">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Fastest Path to Job-Ready</h2>
                    <select
                      value={courseFilter}
                      onChange={(e) => setCourseFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Courses</option>
                      <option value="free">Free Only</option>
                      <option value="quick">Under 10hrs</option>
                      <option value="beginner">Beginner</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredCourses.map((course, index) => {
                      const platformColors = {
                        'Coursera': 'from-blue-500 to-blue-600',
                        'Udemy': 'from-purple-500 to-purple-600',
                        'YouTube': 'from-red-500 to-red-600',
                        'freeCodeCamp': 'from-green-500 to-green-600',
                        'edX': 'from-cyan-500 to-cyan-600'
                      };
                      
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                          <div className={`h-2 bg-gradient-to-r ${platformColors[course.platform] || 'from-gray-500 to-gray-600'}`} />
                          
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <span className="text-xs font-semibold text-gray-600">{course.platform}</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded ${
                                course.cost.toLowerCase() === 'free' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {course.cost}
                              </span>
                            </div>

                            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{course.name}</h3>
                            <p className="text-sm text-gray-600 mb-3">by {course.instructor}</p>

                            <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {course.duration}
                              </div>
                              <div className="flex items-center gap-1">
                                {'⭐'.repeat(Math.floor(course.rating))}
                                <span>{course.rating}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
                                {course.skillTaught}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {course.level}
                              </span>
                            </div>

                            <a
                              href={course.directUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors flex items-center justify-center gap-2"
                            >
                              Start Learning <ChevronRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </section>

              {/* SECTION 5: ROADMAP */}
              <section id="roadmap" className="scroll-mt-24">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Personalized Action Plan</h2>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-teal-500 h-3 rounded-full transition-all"
                          style={{ width: `${getRoadmapCompletion()}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {getRoadmapCompletion()}% Complete
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {results.roadmap.map((week, weekIndex) => (
                      <div key={weekIndex} className="flex gap-4">
                        <div className="flex-shrink-0 w-16 text-center">
                          <div className="bg-cyan-100 text-cyan-700 font-bold text-sm px-3 py-2 rounded-lg">
                            Week {week.week}
                          </div>
                        </div>

                        <div className="flex-1 space-y-3">
                          {week.tasks.map((task, taskIndex) => {
                            const taskKey = `${weekIndex}-${taskIndex}`;
                            const isCompleted = roadmapProgress[taskKey];
                            const typeColors = {
                              'learning': 'border-blue-500 bg-blue-50',
                              'certification': 'border-purple-500 bg-purple-50',
                              'project': 'border-green-500 bg-green-50',
                              'apply': 'border-amber-500 bg-amber-50'
                            };
                            
                            return (
                              <div 
                                key={taskIndex}
                                className={`border-l-4 ${typeColors[task.type]} rounded-lg p-4 ${
                                  isCompleted ? 'opacity-60' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={isCompleted}
                                    onChange={() => toggleRoadmapTask(weekIndex, taskIndex)}
                                    className="mt-1 w-5 h-5 text-cyan-600 rounded focus:ring-2 focus:ring-cyan-500"
                                  />
                                  <div className="flex-1">
                                    <h4 className={`font-semibold text-gray-900 mb-1 ${
                                      isCompleted ? 'line-through' : ''
                                    }`}>
                                      {task.title}
                                    </h4>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {task.timeEstimate}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                        task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                        'bg-green-100 text-green-700'
                                      }`}>
                                        {task.priority}
                                      </span>
                                      <span className="capitalize text-xs">{task.type}</span>
                                    </div>
                                    {task.url && (
                                      <a
                                        href={task.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-cyan-600 hover:underline mt-2 inline-flex items-center gap-1"
                                      >
                                        View Resource <ExternalLink className="w-3 h-3" />
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
                </motion.div>
              </section>

              {/* SECTION 6: RESUME TIPS */}
              <section id="resume" className="scroll-mt-24">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl border border-gray-200 p-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Make Your Resume Hit Harder</h2>
                  
                  <div className="space-y-6">
                    {results.resumeTips.map((tip, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <h4 className="text-sm font-semibold text-red-700 mb-2">❌ Weak Version</h4>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <p className="text-sm text-gray-800">{tip.original}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-green-700 mb-2">✅ Stronger Version</h4>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <p className="text-sm text-gray-800">{tip.improved}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3">
                          <p className="text-sm text-blue-900">
                            <span className="font-semibold">Why it's better:</span> {tip.reason}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tip.improved);
                            toast.success('Copied to clipboard!');
                          }}
                          className="mt-3 text-sm text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
                        >
                          📋 Copy Improved Bullet
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
