"use client";

import { useState, useEffect } from "react";
import { Upload, Briefcase, Target, RefreshCw, ExternalLink, CheckCircle, AlertCircle, MapPin, DollarSign, Clock, Building, Award, Brain, Filter, MessageSquare } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { auth } from "@/lib/firebase";

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

  // MBA Internship Hub state
  const [mbaProfile, setMbaProfile] = useState(null);
  const [internships, setInternships] = useState([]);
  const [internshipLoading, setInternshipLoading] = useState(false);
  const [extraDomains, setExtraDomains] = useState([]);
  const [tracker, setTracker] = useState([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [showCoverLetter, setShowCoverLetter] = useState(false);

  // Load saved profile on mount
  useEffect(() => {
    const saved = localStorage.getItem('bridge_profile');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        console.log('Profile loaded:', p.name);
        setProfile(p);
        setResumeUploaded(true);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }
  }, []);

  // Load saved MBA profile on mount
  useEffect(() => {
    const saved = localStorage.getItem('bridge_mba_profile');
    if (saved) {
      try {
        setMbaProfile(JSON.parse(saved));
      } catch(e) {
        console.error(e);
      }
    }
    const savedTracker = localStorage.getItem('bridge_internship_tracker');
    if (savedTracker) {
      try {
        setTracker(JSON.parse(savedTracker));
      } catch(e) {
        console.error(e);
      }
    }
  }, []);

  // Load cached jobs on mount (only fetch if no cache)
  useEffect(() => {
    if (resumeUploaded && profile) {
      const cachedJobs = localStorage.getItem('bridge_cached_jobs');
      if (cachedJobs) {
        try {
          const parsed = JSON.parse(cachedJobs);
          setJobs(parsed);
        } catch (e) {
          console.error('Error loading cached jobs:', e);
          fetchJobs();
        }
      } else {
        fetchJobs();
      }
    }
  }, [resumeUploaded, profile]);

  const fetchJobs = async () => {
    if (!profile) return;
    return fetchJobsWithProfile(profile);
  };

  const fetchJobsWithProfile = async (profileData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetch_jobs',
          profile: profileData,
          uid: auth.currentUser?.uid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }

      console.log('Jobs fetched:', data.jobs?.length);
      console.log('Profile insights:', data.profile_insights);

      // Filter jobs with minimum 40% match
      const relevantJobs = (data.jobs || []).filter(job => job.match_percent >= 40);

      setJobs(relevantJobs);
      // Cache jobs in localStorage
      localStorage.setItem('bridge_cached_jobs', JSON.stringify(relevantJobs));

      if (relevantJobs.length > 0) {
        const avgMatch = relevantJobs.reduce((sum, job) => sum + job.match_percent, 0) / relevantJobs.length;
        toast.success(`Found ${relevantJobs.length} relevant jobs (avg match: ${Math.round(avgMatch)}%)`);
      } else {
        toast.error('No relevant jobs found. Try updating your resume with more specific skills.');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // If we have cached jobs, show them instead of error
      const cachedJobs = localStorage.getItem('bridge_cached_jobs');
      if (cachedJobs) {
        try {
          setJobs(JSON.parse(cachedJobs));
          toast.error('Could not refresh jobs. Showing cached results.');
        } catch(e) {
          toast.error('Failed to load jobs. Please try again.');
          setJobs([]);
        }
      } else {
        toast.error('Failed to load jobs. Please try again.');
        setJobs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file for accurate reading. Convert your resume to PDF and try again.');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setLoading(true);
    toast.loading('Analyzing your resume...');

    try {
      const base64 = await fileToBase64(file);
      
      // Extract profile from resume using API
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'extract_profile',
          resume_base64: base64.split(',')[1],
          file_type: 'pdf',
          uid: auth.currentUser?.uid
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      const extractedProfile = await response.json();
      console.log('Extracted profile:', extractedProfile);
      
      // Save to localStorage
      localStorage.setItem('bridge_profile', JSON.stringify(extractedProfile));
      setProfile(extractedProfile);
      setResumeUploaded(true);
      
      toast.dismiss();
      toast.success('Resume analyzed successfully! Finding jobs for you...');
      
      // Fetch jobs immediately
      setTimeout(() => {
        fetchJobsWithProfile(extractedProfile);
      }, 500);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to analyze resume. Please try again.');
      console.error('Resume upload error:', error);
      setLoading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const handleSmartApply = async () => {
    const input = smartApplyMode === 'url' ? smartApplyUrl : smartApplyJD;
    
    if (!input.trim()) {
      toast.error('Please provide job URL or description');
      return;
    }

    if (!profile) {
      toast.error('Please upload your resume first');
      return;
    }

    setSmartApplyLoading(true);
    toast.loading('Analyzing job match...');
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'smart_apply',
          job_url: smartApplyMode === 'url' ? input : undefined,
          job_description: smartApplyMode === 'paste' ? input : undefined,
          profile: profile,
          uid: auth.currentUser?.uid
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process smart apply');
      }

      toast.dismiss();
      setSmartApplyResult(data);
      toast.success('Job analyzed successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Failed to process smart apply');
      console.error('Smart apply error:', error);
    } finally {
      setSmartApplyLoading(false);
    }
  };

  const handlePostJob = async (jobData) => {
    try {
      const response = await fetch('/api/post-job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post job');
      }

      toast.success('Job posted successfully!');
      setActiveTab('foryou');
      fetchJobs();
    } catch (error) {
      toast.error(error.message || 'Failed to post job');
      console.error('Post job error:', error);
    }
  };

  if (!resumeUploaded) {
    return (
      <AppShell>
        <div className="max-w-[600px] mx-auto px-4 py-16">
          <div className="bg-white rounded-3xl p-8 shadow-[0_4px_30px_rgba(13,148,136,0.1)] border border-gray-100 text-center">
            <div className="w-16 h-16 bg-[#CCFBF1] rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Briefcase className="w-8 h-8 text-[#0D9488]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{fontFamily:'Syne,sans-serif'}}>Upload Your Resume</h2>
            <p className="text-gray-500 text-sm mb-8">Get personalized job matches and one-click Smart Apply</p>
            <label className="block border-2 border-dashed border-[#CCFBF1] rounded-2xl p-8 hover:border-[#0D9488] transition-colors cursor-pointer mb-6">
              <Upload className="w-10 h-10 text-[#0D9488] mx-auto mb-3" />
              <p className="text-gray-600 text-sm font-medium">Drop your resume or click to browse</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · Max 5MB</p>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
            </label>
            <div className="p-4 bg-[#F0FDFA] rounded-xl border border-[#CCFBF1]">
              <p className="text-sm text-[#0D9488]">💡 AI reads your resume and matches you to the best opportunities across domains and companies.</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{fontFamily:'Syne,sans-serif'}}>Jobs & Internships</h1>
            <p className="text-gray-500 mt-1 text-sm">Opportunities matched to your resume profile</p>
          </div>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchJobs().finally(() => setRefreshing(false));
            }}
            disabled={refreshing || loading}
            className="flex items-center gap-2 bg-[#CCFBF1] text-[#0D9488] px-4 py-2 rounded-full font-semibold text-sm hover:bg-[#99F6E4] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 p-1 bg-gray-100 rounded-2xl w-fit">
          {[
            { id: 'foryou', label: 'For You', icon: Target },
            { id: 'mba', label: 'Internships', icon: Award },
            { id: 'smartapply', label: 'Smart Apply', icon: Brain },
            { id: 'postjob', label: 'Post a Job', icon: Building }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#0D9488] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'foryou' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Sidebar - Filters */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>
                
                <div className="space-y-6">
                  {/* Domain Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                    <div className="space-y-2">
                      {['Software', 'Data Science', 'Marketing', 'Finance', 'HR'].map((domain) => (
                        <label key={domain} className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-gray-300 accent-[#0D9488]" />
                          <span className="text-sm text-gray-700">{domain}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Job Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                    <div className="space-y-2">
                      {['Full Time', 'Internship', 'Part Time', 'Remote'].map((type) => (
                        <label key={type} className="flex items-center gap-2">
                          <input type="checkbox" className="rounded border-gray-300 accent-[#0D9488]" />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20">
                      <option>All Locations</option>
                      <option>Bengaluru</option>
                      <option>Mumbai</option>
                      <option>Pune</option>
                      <option>Hyderabad</option>
                      <option>Remote</option>
                    </select>
                  </div>

                  <button className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
            {/* Main Content - Job Cards */}
            <div className="lg:col-span-3">
              {/* Profile Banner */}
              {profile && (
                <div className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] rounded-2xl p-6 mb-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">Your Profile Summary</h3>
                        <button
                          onClick={() => document.getElementById('change-resume-input').click()}
                          className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                        >
                          <Upload className="w-3 h-3" />
                          Change Resume
                        </button>
                        <input id="change-resume-input" type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{profile.name}</span>
                        <span>•</span>
                        <span>{profile.domains?.[0] || 'Software'}</span>
                        <span>•</span>
                        <span>{profile.college || 'College'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{profile.bridgeScore || 742}</div>
                      <div className="text-xs text-[#CCFBF1]">BRIDGE Score</div>
                    </div>
                  </div>
                </div>
              )}
              {/* Market Insights */}
              <div className="bg-white rounded-2xl p-6 shadow-[0_4px_20px_rgba(13,148,136,0.06)] border border-gray-100 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Market Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#0D9488]">2,847</div>
                    <div className="text-sm text-gray-500">Active Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-gray-500">Match Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[#0D9488]">156</div>
                    <div className="text-sm text-gray-500">New This Week</div>
                  </div>
                </div>
              </div>
              {/* Job Cards */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488]/30 border-t-[#0D9488] mx-auto mb-4"></div>
                    <div className="text-gray-500 text-sm">Finding jobs for you...</div>
                  </div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-500 text-sm">Try adjusting your filters or upload a different resume</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job, index) => (
                    <div key={job.id || index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#CCFBF1] to-[#99F6E4] rounded-2xl flex items-center justify-center text-lg font-bold text-[#0D9488]">
                            {job.company?.charAt(0)?.toUpperCase() || 'J'}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{job.company}</h3>
                            <h4 className="text-lg font-medium text-gray-800">{job.title}</h4>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          job.match_percent >= 90 ? 'bg-green-100 text-green-700' :
                          job.match_percent >= 80 ? 'bg-yellow-100 text-yellow-700' :
                          job.match_percent >= 70 ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {job.match_percent}% Match
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.type}
                          </span>
                          {job.salary && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {job.salary}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {job.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                        )}

                        {/* Match Reasons - Personalized */}
                        {job.match_reasons && job.match_reasons.length > 0 && (
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-xs font-semibold text-green-700 mb-2">Why this matches you:</div>
                            <ul className="space-y-1">
                              {job.match_reasons.slice(0, 2).map((reason, i) => (
                                <li key={i} className="text-xs text-green-600 flex items-start gap-1">
                                  <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Skills */}
                        {job.skills_required && job.skills_required.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.skills_required.slice(0, 4).map((skill, i) => (
                              <span key={i} className="px-2 py-1 bg-[#F0FDFA] text-[#0D9488] text-xs rounded-full border border-[#CCFBF1]">
                                {skill}
                              </span>
                            ))}
                            {job.skills_required.length > 4 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{job.skills_required.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Interview Probability */}
                        {job.interview_probability && (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Interview Probability</span>
                              <span className="font-semibold text-gray-900">{job.interview_probability}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-[#0D9488] to-[#14B8A6] h-2 rounded-full"
                                style={{ width: `${job.interview_probability}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            if (job.apply_url && job.apply_url !== '#') {
                              window.open(job.apply_url, '_blank');
                              toast.success('Opening application page...');
                            } else {
                              toast.success('Application process started!');
                            }
                          }}
                          className="flex-1 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Apply Now
                        </button>
                        <button 
                          onClick={() => {
                            window.location.href = '/interview';
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Prepare
                        </button>
                      </div>

                      {/* Posted Time */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
                        <Clock className="w-3 h-3" />
                        {job.posted_days_ago ? `${job.posted_days_ago} days ago` : 'Recently posted'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'smartapply' && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(13,148,136,0.06)] border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{fontFamily:'Syne,sans-serif'}}>Smart Apply</h2>
              
              {/* Mode Toggle */}
              <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl w-fit">
                <button
                  onClick={() => setSmartApplyMode('url')}
                  className={`py-2 px-5 rounded-lg text-sm font-semibold transition-colors ${
                    smartApplyMode === 'url'
                      ? 'bg-white text-[#0D9488] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Job URL
                </button>
                <button
                  onClick={() => setSmartApplyMode('paste')}
                  className={`py-2 px-5 rounded-lg text-sm font-semibold transition-colors ${
                    smartApplyMode === 'paste'
                      ? 'bg-white text-[#0D9488] shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Paste JD
                </button>
              </div>

              {/* Input Area */}
              {smartApplyMode === 'url' ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job URL</label>
                  <input
                    type="url"
                    value={smartApplyUrl}
                    onChange={(e) => setSmartApplyUrl(e.target.value)}
                    placeholder="https://company.com/careers/job-id"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488]"
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                  <textarea
                    value={smartApplyJD}
                    onChange={(e) => setSmartApplyJD(e.target.value)}
                    placeholder="Paste the complete job description here..."
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20 focus:border-[#0D9488]"
                  />
                </div>
              )}

              <button 
                onClick={handleSmartApply}
                disabled={smartApplyLoading}
                className="w-full bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {smartApplyLoading ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Analyze & Apply
                  </>
                )}
              </button>

              {smartApplyResult && (
                <div className="mt-6 space-y-4">
                  {/* Match Overview */}
                  <div className={`p-6 rounded-lg ${
                    smartApplyResult.should_apply 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">
                          {smartApplyResult.job_title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {smartApplyResult.company} • {smartApplyResult.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#0D9488]">
                          {smartApplyResult.match_percent}%
                        </div>
                        <div className="text-xs text-gray-600">Match</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Interview Probability</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#0D9488] h-2 rounded-full"
                              style={{ width: `${smartApplyResult.interview_probability}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold">{smartApplyResult.interview_probability}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">Recommendation</div>
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                          smartApplyResult.should_apply 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {smartApplyResult.should_apply ? (
                            <><CheckCircle className="w-4 h-4" /> Apply</>
                          ) : (
                            <><AlertCircle className="w-4 h-4" /> Prepare More</>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 italic">
                      "{smartApplyResult.apply_recommendation}"
                    </p>
                  </div>

                  {/* Strengths & Gaps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Your Strengths
                      </h4>
                      <ul className="space-y-2">
                        {smartApplyResult.your_strengths?.map((strength, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Areas to Improve
                      </h4>
                      <ul className="space-y-2">
                        {smartApplyResult.your_gaps?.map((gap, i) => (
                          <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-orange-500 mt-1">!</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Preparation Plan */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Preparation Plan ({smartApplyResult.preparation_time})
                    </h4>
                    <ol className="space-y-2">
                      {smartApplyResult.preparation_plan?.map((step, i) => (
                        <li key={i} className="text-sm text-gray-700 flex gap-3">
                          <span className="font-semibold text-[#0D9488]">{i + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Interview Questions */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Likely Interview Questions
                    </h4>
                    <ul className="space-y-2">
                      {smartApplyResult.likely_interview_questions?.map((q, i) => (
                        <li key={i} className="text-sm text-gray-700 pl-4 border-l-2 border-purple-200">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    {smartApplyResult.apply_url && smartApplyResult.apply_url !== '#' && (
                      <button
                        onClick={() => window.open(smartApplyResult.apply_url, '_blank')}
                        className="flex-1 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Apply Now
                      </button>
                    )}
                    <button
                      onClick={() => window.location.href = '/interview'}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Practice Interview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'postjob' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Post a Job</h2>
              
              <form className="space-y-6" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const jobData = {
                  company: formData.get('company'),
                  title: formData.get('title'),
                  description: formData.get('description'),
                  location: formData.get('location'),
                  type: formData.get('type'),
                  salary: formData.get('salary')
                };
                handlePostJob(jobData);
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    name="company"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Your company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input
                    name="title"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. Software Engineer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                  <textarea
                    name="description"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe the role, requirements, and responsibilities..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      name="location"
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g. Bengaluru, Remote"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                    <select 
                      name="type"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    >
                      <option>Full Time</option>
                      <option>Part Time</option>
                      <option>Internship</option>
                      <option>Contract</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
                  <input
                    name="salary"
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g. ₹10-20 LPA"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-500 transition-colors"
                >
                  Post Job
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Internships Tab */}
        {activeTab === 'mba' && (
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#0D0D1A]">
                Internship Hub
              </h2>
              <p className="text-[#8888A0] mt-1">
                Upload your resume → Get matched internships instantly
              </p>
            </div>

            {/* Resume Upload (if no profile) */}
            {!mbaProfile && (
              <div className="bg-white border-2 border-dashed border-[#0D9488] rounded-2xl p-8 text-center mb-6">
                <div className="text-4xl mb-3">📄</div>
                <h3 className="font-bold text-[#0D0D1A] mb-2">
                  Upload Your MBA Resume
                </h3>
                <p className="text-[#8888A0] text-sm mb-4">
                  AI reads your resume and finds matching internships automatically
                </p>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    setInternshipLoading(true);
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      const base64 = ev.target.result.split(',')[1];
                      try {
                        const res = await fetch('/api/internships', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'extract_mba_profile',
                            resume_base64: base64,
                            userId: auth.currentUser?.uid
                          })
                        });
                        const data = await res.json();
                        setMbaProfile(data);
                        localStorage.setItem('bridge_mba_profile', JSON.stringify(data));
                      } catch(err) {
                        console.error(err);
                      } finally {
                        setInternshipLoading(false);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                  id="mba-resume-upload"
                />
                <label htmlFor="mba-resume-upload"
                  className="cursor-pointer inline-block bg-[#0D9488] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#0F766E] transition-all">
                  {internshipLoading ? 'Reading Resume...' : 'Upload Resume PDF →'}
                </label>
              </div>
            )}

            {/* Profile Summary Card (after upload) */}
            {mbaProfile && (
              <div className="bg-[#F0FDFA] border border-[#0D9488]/20 rounded-2xl p-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[#0D0D1A]">{mbaProfile.name}</h3>
                    <p className="text-[#8888A0] text-sm">
                      {mbaProfile.mba_specialization?.join(' + ')} · {mbaProfile.mba_college}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {mbaProfile.skills?.slice(0,5).map(s => (
                        <span key={s} className="bg-white text-[#0D9488] text-xs px-2 py-1 rounded-full border border-[#0D9488]/20">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMbaProfile(null);
                      setInternships([]);
                      localStorage.removeItem('bridge_mba_profile');
                    }}
                    className="text-[#8888A0] text-sm hover:text-red-500">
                    Change →
                  </button>
                </div>

                {/* Domain Add-On Selector */}
                <div className="mt-4 pt-4 border-t border-[#0D9488]/20">
                  <p className="text-sm font-medium text-[#0D0D1A] mb-2">
                    Also show internships from:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Marketing', 'Finance', 'HR', 'Operations', 'Consulting', 'Sales', 'Strategy', 'Analytics', 'Supply Chain', 'General Management'].filter(d => !mbaProfile.open_to_domains?.includes(d)).map(domain => (
                      <button
                        key={domain}
                        onClick={() => {
                          setExtraDomains(prev => prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]);
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${extraDomains.includes(domain) ? 'bg-[#0D9488] text-white border-[#0D9488]' : 'bg-white text-[#44445A] border-[#E2E8F0] hover:border-[#0D9488]'}`}>
                        + {domain}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Find Button */}
                <button
                  onClick={async () => {
                    setInternshipLoading(true);
                    try {
                      const res = await fetch('/api/internships', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'find_internships',
                          profile: mbaProfile,
                          extra_domains: extraDomains,
                          userId: auth.currentUser?.uid
                        })
                      });
                      const data = await res.json();
                      setInternships(data.internships || []);
                    } catch(err) {
                      console.error(err);
                    } finally {
                      setInternshipLoading(false);
                    }
                  }}
                  disabled={internshipLoading}
                  className="mt-4 w-full bg-[#0D9488] text-white py-3 rounded-xl font-bold hover:bg-[#0F766E] transition-all disabled:opacity-50">
                  {internshipLoading ? '🔍 Finding internships...' : '🔍 Find My Internships →'}
                </button>
              </div>
            )}

            {/* Search Insights */}
            {internships.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] text-center">
                  <div className="text-2xl font-bold text-[#0D9488]">{internships.length}</div>
                  <div className="text-xs text-[#8888A0]">Matches Found</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] text-center">
                  <div className="text-2xl font-bold text-[#0D9488]">
                    {Math.round(internships.reduce((a,b) => a + b.match_percent, 0) / internships.length)}%
                  </div>
                  <div className="text-xs text-[#8888A0]">Avg Match</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-[#E2E8F0] text-center">
                  <div className="text-2xl font-bold text-[#0D9488]">
                    {internships.filter(i => i.ppo_available).length}
                  </div>
                  <div className="text-xs text-[#8888A0]">PPO Available</div>
                </div>
              </div>
            )}

            {/* Internship Cards */}
            {internshipLoading && (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse"/>
                ))}
              </div>
            )}

            {!internshipLoading && internships.length > 0 && (
              <div className="space-y-4">
                {internships.sort((a,b) => b.match_percent - a.match_percent).map((internship, i) => (
                  <div key={internship.id || i}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#0D9488]/30 hover:shadow-lg transition-all">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#F0FDFA] flex items-center justify-center text-lg font-bold text-[#0D9488]">
                          {internship.company?.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-[#0D0D1A]">{internship.title}</h3>
                          <p className="text-[#8888A0] text-sm">{internship.company}</p>
                        </div>
                      </div>
                      
                      {/* Match % */}
                      <div className={`text-center px-3 py-1 rounded-xl font-bold ${internship.match_percent >= 80 ? 'bg-green-50 text-green-600' : internship.match_percent >= 65 ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-50 text-gray-600'}`}>
                        <div className="text-xl">{internship.match_percent}%</div>
                        <div className="text-xs font-normal">Match</div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-[#F0FDFA] text-[#0D9488] text-xs px-2 py-1 rounded-full">📍 {internship.location}</span>
                      <span className="bg-[#F0FDFA] text-[#0D9488] text-xs px-2 py-1 rounded-full">💰 {internship.stipend}</span>
                      <span className="bg-[#F0FDFA] text-[#0D9488] text-xs px-2 py-1 rounded-full">⏱ {internship.duration}</span>
                      {internship.ppo_available && (
                        <span className="bg-green-50 text-green-600 text-xs px-2 py-1 rounded-full font-medium">⭐ PPO Available</span>
                      )}
                      <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-full">🏢 {internship.company_type}</span>
                    </div>

                    {/* Description */}
                    <p className="text-[#44445A] text-sm mb-3 line-clamp-2">{internship.description}</p>

                    {/* Match reasons */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-green-50 rounded-xl p-2">
                        <p className="text-green-600 text-xs font-medium mb-1">✅ Why you match</p>
                        {internship.match_reasons?.slice(0,2).map((r,i) => (
                          <p key={i} className="text-green-700 text-xs">• {r}</p>
                        ))}
                      </div>
                      {internship.skill_gaps?.length > 0 && (
                        <div className="bg-orange-50 rounded-xl p-2">
                          <p className="text-orange-600 text-xs font-medium mb-1">⚡ Skill gaps</p>
                          {internship.skill_gaps?.slice(0,2).map((g,i) => (
                            <p key={i} className="text-orange-700 text-xs">• {g}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interview probability */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-[#8888A0] mb-1">
                        <span>Interview Probability</span>
                        <span className="font-medium text-[#0D0D1A]">{internship.interview_probability}%</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-[#0D9488] h-2 rounded-full transition-all" style={{ width: `${internship.interview_probability}%` }}/>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          setSelectedInternship(internship);
                          setCoverLetterLoading(true);
                          setShowCoverLetter(true);
                          try {
                            const res = await fetch('/api/internships', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                action: 'cover_letter',
                                internship,
                                profile: mbaProfile,
                                userId: auth.currentUser?.uid
                              })
                            });
                            const data = await res.json();
                            setCoverLetter(data.cover_letter || '');
                          } catch(err) {
                            console.error(err);
                          } finally {
                            setCoverLetterLoading(false);
                          }
                        }}
                        className="flex-1 bg-[#F0FDFA] text-[#0D9488] border border-[#0D9488]/30 py-2.5 rounded-xl text-sm font-medium hover:bg-[#0D9488] hover:text-white transition-all">
                        ✍️ AI Cover Letter
                      </button>
                      
                      <button
                        onClick={() => {
                          const newTracker = [...tracker, { ...internship, status: 'Applied', appliedDate: new Date().toISOString() }];
                          setTracker(newTracker);
                          localStorage.setItem('bridge_internship_tracker', JSON.stringify(newTracker));
                          window.open(internship.apply_url, '_blank');
                        }}
                        className="flex-1 bg-[#0D9488] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-[#0F766E] transition-all">
                        Apply Now →
                      </button>
                      
                      <button
                        onClick={() => {
                          const newTracker = [...tracker, { ...internship, status: 'Saved', savedDate: new Date().toISOString() }];
                          setTracker(newTracker);
                          localStorage.setItem('bridge_internship_tracker', JSON.stringify(newTracker));
                        }}
                        className="px-3 py-2.5 border border-[#E2E8F0] rounded-xl text-[#8888A0] hover:border-[#0D9488] hover:text-[#0D9488] transition-all text-sm">
                        🔖
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Application Tracker */}
            {tracker.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-[#0D0D1A] mb-4">📊 Application Tracker</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['Saved', 'Applied', 'Shortlisted', 'Interview', 'Offer'].map(status => (
                    <div key={status} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs font-semibold text-[#8888A0] mb-2 uppercase">{status} ({tracker.filter(t => t.status === status).length})</p>
                      {tracker.filter(t => t.status === status).map((item, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 mb-2 border border-[#E2E8F0]">
                          <p className="text-xs font-medium text-[#0D0D1A] line-clamp-1">{item.title}</p>
                          <p className="text-xs text-[#8888A0]">{item.company}</p>
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const idx = tracker.findIndex(t => t === item);
                              const updated = tracker.map((t, i) => i === idx ? {...t, status: e.target.value} : t);
                              setTracker(updated);
                              localStorage.setItem('bridge_internship_tracker', JSON.stringify(updated));
                            }}
                            className="mt-1 w-full text-xs border border-[#E2E8F0] rounded px-1 py-0.5 text-[#44445A]">
                            {['Saved','Applied','Shortlisted','Interview','Offer'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cover Letter Modal */}
            {showCoverLetter && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-[#0D0D1A]">AI Cover Letter</h3>
                    <button onClick={() => setShowCoverLetter(false)} className="text-[#8888A0] hover:text-[#0D0D1A]">✕</button>
                  </div>
                  <p className="text-sm text-[#8888A0] mb-3">For: {selectedInternship?.title} at {selectedInternship?.company}</p>
                  {coverLetterLoading ? (
                    <div className="text-center py-8">
                      <div className="text-[#0D9488] animate-spin text-2xl mb-2">⟳</div>
                      <p className="text-[#8888A0]">Writing your cover letter...</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm text-[#44445A] leading-relaxed whitespace-pre-wrap">{coverLetter}</div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => { navigator.clipboard.writeText(coverLetter); alert('Copied to clipboard!'); }}
                          className="flex-1 bg-[#0D9488] text-white py-2.5 rounded-xl text-sm font-medium">📋 Copy Letter</button>
                        <button onClick={() => setShowCoverLetter(false)} className="flex-1 border border-[#E2E8F0] text-[#44445A] py-2.5 rounded-xl text-sm">Close</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
