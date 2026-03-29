"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Upload, Briefcase, Target, TrendingUp, Users, RefreshCw, ExternalLink, Lock, CheckCircle, XCircle, AlertCircle, Star, MapPin, DollarSign, Clock, Building, Award, Brain, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function JobsPage() {
  const [activeTab, setActiveTab] = useState('foryou');
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [smartApplyUrl, setSmartApplyUrl] = useState('');
  const [smartApplyJD, setSmartApplyJD] = useState('');
  const [smartApplyResult, setSmartApplyResult] = useState(null);
  const [smartApplyLoading, setSmartApplyLoading] = useState(false);
  const [smartApplyMode, setSmartApplyMode] = useState('url'); // 'url' or 'paste'
  const [refreshing, setRefreshing] = useState(false);
  const [expandedJob, setExpandedJob] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  // Load saved profile on mount
  useEffect(() => {
    const saved = localStorage.getItem('bridge_profile');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        console.log('Profile loaded:', p.name);
        setProfile(p);
        setResumeUploaded(true);
        // Auto fetch jobs if profile exists
        fetchJobs(p);
      } catch(e) {
        console.error('Profile parse error:', e);
      }
    } else {
      console.log('No profile in localStorage');
    }
  }, []);

  const handleResumeUpload = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please upload a PDF resume');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'extract_profile',
            resume_base64: base64
          })
        });

        const profileData = await response.json();
        setProfile(profileData);
        setResumeUploaded(true);
        
        // Save to localStorage
        localStorage.setItem('bridge_profile', JSON.stringify(profileData));
        
        toast.success(`Hi ${profileData.name}! Profile extracted successfully`);
        
        // Auto fetch jobs
        await fetchJobs(profileData);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to extract profile from resume');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (profileData = profile) => {
    if (!profileData) return;
    
    setRefreshing(true);
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch_jobs',
          profile: profileData
        })
      });

      const jobsData = await response.json();
      setJobs(jobsData.jobs || []);
    } catch (error) {
      toast.error('Failed to fetch jobs');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSmartApply = async () => {
  console.log('=== SMART APPLY CLICKED ===');
  console.log('Profile:', profile);
  console.log('Mode:', smartApplyMode);
  console.log('JD:', smartApplyJD?.substring(0, 100));
  console.log('URL:', smartApplyUrl);

  if (!profile) {
    alert('Please upload your resume first!');
    setActiveTab('foryou');
    return;
  }

  if (smartApplyMode === 'paste' && !smartApplyJD?.trim()) {
    alert('Please paste the job description!');
    return;
  }

  if (smartApplyMode === 'url' && !smartApplyUrl?.trim()) {
    alert('Please enter a job URL!');
    return;
  }

  setSmartApplyLoading(true);
  setSmartApplyResult(null);

  try {
    const requestBody = {
      action: 'smart_apply',
      job_url: smartApplyMode === 'url' 
        ? smartApplyUrl.trim() : null,
      job_description: smartApplyMode === 'paste'
        ? smartApplyJD.trim() : null,
      profile: profile
    };

    console.log('Sending to API:', {
      action: requestBody.action,
      hasUrl: !!requestBody.job_url,
      hasJD: !!requestBody.job_description,
      jdLength: requestBody.job_description?.length,
      hasProfile: !!requestBody.profile,
      profileName: requestBody.profile?.name
    });

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(requestBody)
    });

    console.log('Response status:', res.status);
    const data = await res.json();
    console.log('API response:', data);

    if (data.error) {
      alert('Error: ' + data.error);
      return;
    }

    setSmartApplyResult(data);

  } catch (err) {
    console.error('Smart apply error:', err);
    alert('Failed: ' + err.message);
  } finally {
    setSmartApplyLoading(false);
  }
};

  const getMatchColor = (percent) => {
    if (percent >= 80) return 'text-green-400';
    if (percent >= 60) return 'text-yellow-400';
    if (percent >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getMatchLabel = (percent) => {
    if (percent >= 80) return 'Strong Match 💪';
    if (percent >= 60) return 'Good Match 👍';
    if (percent >= 40) return 'Partial Match';
    return 'Weak Match';
  };

  const getMatchBg = (percent) => {
    if (percent >= 80) return 'bg-green-500/20 border-green-500/30';
    if (percent >= 60) return 'bg-yellow-500/20 border-yellow-500/30';
    if (percent >= 40) return 'bg-orange-500/20 border-orange-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const handleApply = (job) => {
    if (job.apply_url && 
        job.apply_url.startsWith('http')) {
      window.open(job.apply_url, '_blank');
    } else {
      // Fallback to LinkedIn search
      window.open(
        `https://www.linkedin.com/jobs/search/?keywords=${
          encodeURIComponent(job.title)
        }&location=India`,
        '_blank'
      );
    }
  };

  const handleJobAction = (job, action) => {
    if (action === 'interview') {
      // Store job data for smart interview
      sessionStorage.setItem('job_data', JSON.stringify(job));
      window.location.href = '/smart-interview';
    } else if (action === 'apply') {
      handleApply(job);
    }
  };

  if (!resumeUploaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white">
        <div className="max-w-md mx-auto px-6 py-6">
          {/* Header */}
          <header className="flex items-center gap-3 mb-8">
            <button 
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold">Jobs & Internships</span>
            </div>
          </header>

          {/* Resume Upload Section */}
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-8 mb-8 text-center">
            <Upload className="w-16 h-16 mx-auto mb-4 text-white/80" />
            <h2 className="text-2xl font-bold mb-4">Upload your resume once</h2>
            <p className="text-white/80 mb-6">Get personalized jobs matched to your profile forever</p>
            
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => handleResumeUpload(e.target.files[0])}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center gap-2 bg-white text-purple-600 px-6 py-3 rounded-xl font-semibold cursor-pointer hover:bg-white/90 transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-purple-600/30 border-t-purple-600"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Resume (PDF)
                </>
              )}
            </label>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="font-semibold">AI-Powered Matching</h3>
                  <p className="text-sm text-gray-400">Get jobs that match your skills and experience</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="font-semibold">Smart Apply</h3>
                  <p className="text-sm text-gray-400">Analyze any job URL and get preparation tips</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-orange-400" />
                <div>
                  <h3 className="font-semibold">Interview Prep</h3>
                  <p className="text-sm text-gray-400">Practice with AI for specific job roles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-6 py-6">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold">Jobs</span>
            </div>
          </div>
          
          {/* Profile Summary */}
          <div className="text-right">
            <div className="text-sm text-purple-400">
              Hi, {profile?.name?.split(' ')[0]}!
            </div>
            <div className="text-xs text-gray-400">
              {profile?.domains?.[0]} | {profile?.location}
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1">
          {[
            { id: 'foryou', label: 'For You', icon: Target },
            { id: 'smartapply', label: 'Smart Apply', icon: Brain },
            { id: 'employer', label: 'For Employers', icon: Building }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-1
                ${activeTab === tab.id 
                  ? 'bg-purple-500 text-white' 
                  : 'text-gray-400 hover:text-white'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* FOR YOU TAB */}
        {activeTab === 'foryou' && (
          <div className="space-y-4">
            {/* Profile Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-lg">{profile?.name}</h3>
                  <p className="text-white/80 text-sm">{profile?.education?.degree} at {profile?.education?.college}</p>
                </div>
                <button
                  onClick={() => fetchJobs()}
                  disabled={refreshing}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  {refreshing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {profile?.domains?.map((domain, i) => (
                  <span key={i} className="bg-white/20 px-2 py-1 rounded-full text-xs">
                    {domain}
                  </span>
                ))}
                {profile?.skills?.slice(0, 3).map((skill, i) => (
                  <span key={i} className="bg-white/10 px-2 py-1 rounded-full text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Market Insight */}
            {jobs.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                <h4 className="font-semibold text-orange-400 mb-2">📊 Market Insights</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Market Demand</div>
                    <div className="font-semibold capitalize">{jobs[0]?.profile_insights?.market_demand || 'Medium'}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Avg Match Score</div>
                    <div className="font-semibold">{jobs[0]?.profile_insights?.avg_match_score || 70}%</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-orange-300">
                  💡 {jobs[0]?.profile_insights?.improvement_tip || 'Keep your profile updated'}
                </div>
              </div>
            )}

            {/* Jobs List */}
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <div key={job.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  {/* Premium Lock for jobs after 5th */}
                  {index >= 5 && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
                      <Lock className="w-8 h-8 text-yellow-400 mb-2" />
                      <div className="text-yellow-400 font-semibold">🔒 Upgrade to see more</div>
                      <div className="text-sm text-gray-400 mb-4">Get Premium ₹199/month</div>
                      <button className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold text-sm">
                        Upgrade Now
                      </button>
                    </div>
                  )}
                  
                  {/* Job Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
                        {job.company.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{job.company}</div>
                        <div className="text-xs text-gray-400">{job.posted_days_ago} days ago</div>
                      </div>
                    </div>
                  </div>

                  {/* Job Title */}
                  <h3 className="text-lg font-bold text-purple-400 mb-2">{job.title}</h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-xs">
                      <MapPin className="w-3 h-3" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-xs">
                      <Briefcase className="w-3 h-3" />
                      {job.type}
                    </span>
                    <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-xs">
                      <DollarSign className="w-3 h-3" />
                      {job.salary}
                    </span>
                    <span className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-xs">
                      <Building className="w-3 h-3" />
                      {job.company_size}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {job.skills_required?.slice(0, 4).map((skill, i) => (
                      <span key={i} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Match Section */}
                  <div className={`rounded-xl p-3 mb-4 border ${getMatchBg(job.match_percent)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-lg font-bold ${getMatchColor(job.match_percent)}`}>
                        {job.match_percent}% Match
                      </div>
                      <div className={`text-sm font-semibold ${getMatchColor(job.match_percent)}`}>
                        {getMatchLabel(job.match_percent)}
                      </div>
                    </div>
                    
                    {/* Interview Probability */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-400 mb-1">Interview Chance: {job.interview_probability}%</div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${job.interview_probability}%` }}
                        />
                      </div>
                    </div>

                    {/* Match Reasons */}
                    {job.match_reasons?.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-green-400 font-semibold mb-1">✅ Why you match:</div>
                        {job.match_reasons.slice(0, 2).map((reason, i) => (
                          <div key={i} className="text-xs text-gray-300">• {reason}</div>
                        ))}
                      </div>
                    )}

                    {/* Gap Reasons */}
                    {job.gap_reasons?.length > 0 && (
                      <div>
                        <div className="text-xs text-red-400 font-semibold mb-1">❌ Gaps:</div>
                        {job.gap_reasons.slice(0, 2).map((gap, i) => (
                          <div key={i} className="text-xs text-gray-300">• {gap}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleJobAction(job, 'interview')}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-semibold text-sm transition-colors"
                    >
                      Prepare with AI
                    </button>
                    <button
                      onClick={() => handleJobAction(job, 'apply')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      Apply Now
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {jobs.length === 0 && !refreshing && (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <div className="text-gray-400">No jobs found for your profile</div>
                <button
                  onClick={() => fetchJobs()}
                  className="mt-4 text-purple-400 hover:text-purple-300"
                >
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* SMART APPLY TAB */}
        {activeTab === 'smartapply' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Analyze Any Job</h2>
              <p className="text-gray-400 text-sm">Get personalized insights and preparation tips</p>
            </div>

            {!profile && (
              <div className="bg-red-500/20 border border-red-500/30 
                rounded-2xl p-4 mb-4">
                <p className="text-red-400 font-bold">
                  ⚠️ No Resume Uploaded
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Please upload your resume in the "For You" tab first
                </p>
                <button
                  onClick={() => setActiveTab('foryou')}
                  className="mt-2 bg-purple-600 px-4 py-2 
                    rounded-xl text-white text-sm">
                  Upload Resume →
                </button>
              </div>
            )}

            {profile && (
              <div className="bg-green-500/20 border border-green-500/30 
                rounded-2xl p-3 mb-4">
                <p className="text-green-400 text-sm">
                  ✅ Using profile: {profile.name} | 
                  {profile.domains?.[0]} | {profile.experience_level}
                </p>
              </div>
            )}

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSmartApplyMode('url')}
                className={`flex-1 py-2 rounded-xl text-sm
                  ${smartApplyMode === 'url'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-400'}`}>
                🔗 Paste URL
              </button>
              <button
                onClick={() => setSmartApplyMode('paste')}
                className={`flex-1 py-2 rounded-xl text-sm
                  ${smartApplyMode === 'paste'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/10 text-gray-400'}`}>
                📋 Paste JD
              </button>
            </div>

            {/* URL Mode */}
            {smartApplyMode === 'url' && (
              <div>
                <p className="text-gray-400 text-xs mb-2">
                  Works best with: talent.com, indeed.com, company career pages
                </p>
                <input
                  type="url"
                  value={smartApplyUrl}
                  onChange={(e) => setSmartApplyUrl(e.target.value)}
                  placeholder="https://in.talent.com/view?id=..."
                  className="w-full bg-white/10 border border-white/20 
                    rounded-xl p-3 text-white text-sm mb-3"
                />
              </div>
            )}

            {/* Paste JD Mode */}
            {smartApplyMode === 'paste' && (
              <div>
                <p className="text-gray-400 text-xs mb-2">
                  Copy full job description from any website
                </p>
                <textarea
                  value={smartApplyJD}
                  onChange={(e) => setSmartApplyJD(e.target.value)}
                  placeholder="Paste complete job description here..."
                  rows={6}
                  className="w-full bg-white/10 border border-white/20 
                    rounded-xl p-3 text-white text-sm mb-3"
                />
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleSmartApply}
              disabled={smartApplyLoading || (!smartApplyUrl && !smartApplyJD)}
              className="w-full bg-purple-600 py-3 rounded-xl
                text-white font-bold disabled:opacity-50"
            >
              {smartApplyLoading 
                ? '🤖 Analyzing...' 
                : 'Analyze Job →'}
            </button>

            {/* Results */}
            {smartApplyResult && (
              <div className="mt-4 space-y-4">
                
                {/* Job Header */}
                <div className="bg-white/10 rounded-2xl p-4">
                  <h3 className="text-white font-bold text-lg">
                    {smartApplyResult.job_title}
                  </h3>
                  <p className="text-purple-400">
                    {smartApplyResult.company}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {smartApplyResult.location} • 
                    {smartApplyResult.job_type}
                  </p>
                </div>

                {/* Match Score */}
                <div className={`rounded-2xl p-4 border
                  ${smartApplyResult.match_percent >= 70
                    ? 'bg-green-500/20 border-green-500/30'
                    : smartApplyResult.match_percent >= 50
                    ? 'bg-yellow-500/20 border-yellow-500/30'
                    : 'bg-red-500/20 border-red-500/30'}`}>
                  <div className="text-5xl font-bold text-white mb-1">
                    {smartApplyResult.match_percent}%
                  </div>
                  <div className="text-sm text-gray-300">
                    Profile Match
                  </div>
                  <div className="mt-2 text-sm font-medium
                    text-white">
                    {smartApplyResult.apply_recommendation}
                  </div>
                </div>

                {/* Interview Probability */}
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-gray-400 text-sm mb-2">
                    Interview Probability
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/10 rounded-full h-3">
                      <div 
                        className="bg-purple-500 h-3 rounded-full"
                        style={{width: `${smartApplyResult.interview_probability}%`}}
                      />
                    </div>
                    <span className="text-white font-bold">
                      {smartApplyResult.interview_probability}%
                    </span>
                  </div>
                </div>

                {/* Should Apply Banner */}
                <div className={`rounded-2xl p-4 text-center
                  ${smartApplyResult.should_apply
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-red-500/20 border border-red-500/30'}`}>
                  <p className="text-white font-bold text-lg">
                    {smartApplyResult.should_apply
                      ? '✅ Yes, Apply for This Job!'
                      : '⚠️ Not the Best Match Right Now'}
                  </p>
                </div>

                {/* Strengths */}
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-green-400 font-bold mb-2">
                    ✅ Your Strengths
                  </p>
                  {smartApplyResult.your_strengths?.map((s, i) => (
                    <p key={i} className="text-gray-300 text-sm mb-1">
                      • {s}
                    </p>
                  ))}
                </div>

                {/* Gaps */}
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-red-400 font-bold mb-2">
                    ❌ Gaps to Address
                  </p>
                  {smartApplyResult.your_gaps?.map((g, i) => (
                    <p key={i} className="text-gray-300 text-sm mb-1">
                      • {g}
                    </p>
                  ))}
                </div>

                {/* Interview Questions */}
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-purple-400 font-bold mb-2">
                    ❓ Likely Interview Questions
                  </p>
                  {smartApplyResult.likely_interview_questions
                    ?.map((q, i) => (
                    <p key={i} className="text-gray-300 text-sm mb-2">
                      {i+1}. {q}
                    </p>
                  ))}
                </div>

                {/* Preparation Plan */}
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-orange-400 font-bold mb-2">
                    🎯 Preparation Plan
                  </p>
                  {smartApplyResult.preparation_plan?.map((s, i) => (
                    <p key={i} className="text-gray-300 text-sm mb-2">
                      {s}
                    </p>
                  ))}
                </div>

                {/* Resume Keywords */}
                <div className="bg-white/10 rounded-2xl p-4">
                  <p className="text-yellow-400 font-bold mb-2">
                    📝 Add These to Resume
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {smartApplyResult.resume_keywords?.map((k, i) => (
                      <span key={i} 
                        className="bg-yellow-500/20 text-yellow-300 
                          text-xs px-2 py-1 rounded-full">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(
                      smartApplyResult.apply_url || smartApplyUrl, 
                      '_blank'
                    )}
                    className="flex-1 bg-green-600 py-3 
                      rounded-xl text-white font-bold text-sm">
                    Apply Now →
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('smart_interview_job',
                        JSON.stringify(smartApplyResult));
                      window.location.href = '/smart-interview';
                    }}
                    className="flex-1 bg-purple-600 py-3 
                      rounded-xl text-white font-bold text-sm">
                    Practice Interview
                  </button>
                </div>

                {/* Clear button */}
                <button
                  onClick={() => {
                    setSmartApplyResult(null);
                    setSmartApplyUrl('');
                    setSmartApplyJD('');
                  }}
                  className="w-full text-gray-400 text-sm py-2">
                  ← Analyze Another Job
                </button>
              </div>
            )}
          </div>
        )}

        {/* EMPLOYER TAB */}
        {activeTab === 'employer' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Post a Job or Internship</h2>
              <p className="text-gray-400 text-sm">Reach 25,000+ students directly</p>
            </div>

            <form className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <label className="block text-sm font-medium text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                  placeholder="Your Company"
                />
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <label className="block text-sm font-medium text-gray-300 mb-2">Contact Email</label>
                <input
                  type="email"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                  placeholder="hr@company.com"
                />
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <label className="block text-sm font-medium text-gray-300 mb-2">Job Title</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                  placeholder="Marketing Executive"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                  <select className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white">
                    <option>Full-time</option>
                    <option>Internship</option>
                    <option>Part-time</option>
                  </select>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                    placeholder="Mumbai, Remote"
                  />
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <label className="block text-sm font-medium text-gray-300 mb-2">Salary / Stipend</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                  placeholder="3-5 LPA or ₹15,000/month"
                />
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <label className="block text-sm font-medium text-gray-300 mb-2">Job Description</label>
                <textarea
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 h-24"
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                />
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <label className="block text-sm font-medium text-gray-300 mb-2">Skills Required</label>
                <input
                  type="text"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                  placeholder="Excel, Communication, Marketing (comma separated)"
                />
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <label className="block text-sm font-medium text-gray-300 mb-2">Application Link</label>
                <input
                  type="url"
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                  placeholder="https://company.com/careers/apply"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 rounded-xl font-semibold transition-all"
              >
                Submit Job Posting
              </button>
            </form>

            <div className="text-center text-sm text-gray-400">
              We'll review and publish within 24 hours
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
