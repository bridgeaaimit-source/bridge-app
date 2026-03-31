"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Upload, Briefcase, Target, TrendingUp, Users, RefreshCw, ExternalLink, Lock, CheckCircle, XCircle, AlertCircle, Star, MapPin, DollarSign, Clock, Building, Award, Brain, Send, FileText, Search, Filter, Calendar } from "lucide-react";
import AppShell from "@/components/AppShell";
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
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }
  }, []);

  // Load jobs on mount
  useEffect(() => {
    if (resumeUploaded && profile) {
      fetchJobs();
    }
  }, [resumeUploaded, profile]);

  const fetchJobs = async () => {
    if (!profile) return;
    fetchJobsWithProfile(profile);
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
          profile: profileData
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
      
      console.log('Jobs fetched:', data.jobs?.length);
      setJobs(data.jobs || []);
      
      if (data.jobs && data.jobs.length > 0) {
        toast.success(`Found ${data.jobs.length} jobs matching your profile!`);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs. Showing sample jobs.');
      
      // Fallback to sample jobs if API fails
      setJobs([
        {
          id: '1',
          company: 'Google',
          title: 'Software Engineer - Entry Level',
          location: 'Bengaluru',
          type: 'Full-time',
          salary: '₹20-40 LPA',
          match_percent: 92,
          interview_probability: 87,
          skills_required: ['Python', 'Java', 'SQL', 'Git'],
          posted_days_ago: 2,
          apply_url: 'https://www.google.com/careers',
          description: 'Join Google as a Software Engineer and work on cutting-edge technology.'
        },
        {
          id: '2',
          company: 'Microsoft',
          title: 'Data Scientist',
          location: 'Hyderabad',
          type: 'Full-time',
          salary: '₹15-30 LPA',
          match_percent: 88,
          interview_probability: 82,
          skills_required: ['Python', 'ML', 'Statistics', 'SQL'],
          posted_days_ago: 3,
          apply_url: 'https://careers.microsoft.com',
          description: 'Work on data-driven solutions at Microsoft.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, or DOCX file');
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
          resume_base64: base64.split(',')[1] // Remove data:application/pdf;base64, prefix
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
          profile: profile
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
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Your Resume</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-200 transition-colors">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drop your resume here or click to browse</p>
              <p className="text-sm text-gray-500">PDF, DOC, DOCX (Max 5MB)</p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer mt-4"
              >
                <FileText className="w-4 h-4" />
                Choose File
              </label>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-cyan-900">
                💡 Upload your resume to get personalized job recommendations and apply with one click using our Smart Apply feature.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jobs & Internships</h1>
            <p className="text-gray-600 mt-1">Find opportunities that match your profile</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-gray-200">
          {[
            { id: 'foryou', label: 'For You', icon: Target },
            { id: 'smartapply', label: 'Smart Apply', icon: Brain },
            { id: 'postjob', label: 'Post a Job', icon: Building }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-500'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
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
                          <input type="checkbox" className="rounded border-gray-300 text-purple-500" />
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
                          <input type="checkbox" className="rounded border-gray-300 text-purple-500" />
                          <span className="text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                      <option>All Locations</option>
                      <option>Bengaluru</option>
                      <option>Mumbai</option>
                      <option>Pune</option>
                      <option>Hyderabad</option>
                      <option>Remote</option>
                    </select>
                  </div>

                  <button className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-500 transition-colors">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content - Job Cards */}
            <div className="lg:col-span-3">
              {/* Profile Banner */}
              {profile && (
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-6 mb-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-2">Your Profile Summary</h3>
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
                      <div className="text-xs text-purple-100">BRIDGE Score</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Market Insights */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Market Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">2,847</div>
                    <div className="text-sm text-gray-600">Active Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-gray-600">Match Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600">156</div>
                    <div className="text-sm text-gray-600">New This Week</div>
                  </div>
                </div>
              </div>

              {/* Job Cards Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                    <div className="text-gray-600">Finding jobs for you...</div>
                  </div>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                  <p className="text-gray-600">Try adjusting your filters or upload a different resume</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobs.map((job, index) => (
                    <div key={job.id || index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center text-lg font-bold text-purple-700">
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

                        {/* Skills */}
                        {job.skills_required && job.skills_required.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.skills_required.slice(0, 4).map((skill, i) => (
                              <span key={i} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
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
                                className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full"
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
                          className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
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
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Smart Apply</h2>
              
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setSmartApplyMode('url')}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    smartApplyMode === 'url'
                      ? 'bg-white text-purple-500 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Job URL
                </button>
                <button
                  onClick={() => setSmartApplyMode('paste')}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    smartApplyMode === 'paste'
                      ? 'bg-white text-purple-500 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              )}

              <button 
                onClick={handleSmartApply}
                disabled={smartApplyLoading}
                className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                        <div className="text-3xl font-bold text-purple-600">
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
                              className="bg-purple-600 h-2 rounded-full"
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
                          <span className="font-semibold text-purple-600">{i + 1}.</span>
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
      </div>
    </AppShell>
  );
}
