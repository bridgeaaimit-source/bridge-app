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
    setLoading(true);
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fetch_jobs',
          profile: profile
        }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch jobs');
      }
      
      setJobs(data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
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

    try {
      const base64 = await fileToBase64(file);
      
      // Save to localStorage for demo
      const newProfile = {
        name: 'Demo User',
        domains: ['Software'],
        college: 'Demo College',
        resume: base64,
        bridgeScore: 742
      };
      
      localStorage.setItem('bridge_profile', JSON.stringify(newProfile));
      setProfile(newProfile);
      setResumeUploaded(true);
      
      toast.success('Resume uploaded successfully!');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to upload resume');
      console.error('Resume upload error:', error);
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

    setSmartApplyLoading(true);
    
    try {
      const response = await fetch('/api/smart-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [smartApplyMode]: input,
          profile: profile
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process smart apply');
      }

      setSmartApplyResult(data);
      toast.success('Job analyzed successfully!');
    } catch (error) {
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
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors cursor-pointer mt-4"
              >
                <FileText className="w-4 h-4" />
                Choose File
              </label>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
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
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
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
                  ? 'border-purple-600 text-purple-600'
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
                          <input type="checkbox" className="rounded border-gray-300 text-purple-600" />
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
                          <input type="checkbox" className="rounded border-gray-300 text-purple-600" />
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

                  <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors">
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
                      <div className="text-xs text-purple-200">BRIDGE Score</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Market Insights */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Market Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">2,847</div>
                    <div className="text-sm text-gray-600">Active Jobs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">89%</div>
                    <div className="text-sm text-gray-600">Match Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <div className="text-sm text-gray-600">New This Week</div>
                  </div>
                </div>
              </div>

              {/* Job Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sample Job Cards */}
                {[
                  {
                    company: 'Google',
                    logo: 'G',
                    title: 'Software Engineer',
                    location: 'Bengaluru',
                    type: 'Full Time',
                    salary: '₹20-40 LPA',
                    match: 92,
                    probability: 87,
                    skills: ['Python', 'Java', 'SQL', 'Git'],
                    posted: '2 days ago'
                  },
                  {
                    company: 'Microsoft',
                    logo: 'M',
                    title: 'Data Scientist',
                    location: 'Hyderabad',
                    type: 'Full Time',
                    salary: '₹15-30 LPA',
                    match: 88,
                    probability: 82,
                    skills: ['Python', 'ML', 'Statistics', 'SQL'],
                    posted: '3 days ago'
                  },
                  {
                    company: 'Amazon',
                    logo: 'A',
                    title: 'Product Manager',
                    location: 'Mumbai',
                    type: 'Full Time',
                    salary: '₹25-45 LPA',
                    match: 85,
                    probability: 79,
                    skills: ['Product Strategy', 'Analytics', 'Communication'],
                    posted: '1 week ago'
                  },
                  {
                    company: 'Infosys',
                    logo: 'I',
                    title: 'System Engineer',
                    location: 'Pune',
                    type: 'Full Time',
                    salary: '₹8-15 LPA',
                    match: 78,
                    probability: 85,
                    skills: ['Java', 'Python', 'Cloud', 'DevOps'],
                    posted: '4 days ago'
                  }
                ].map((job, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold text-gray-700">
                          {job.logo}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{job.company}</h3>
                          <h4 className="text-lg font-medium text-gray-800">{job.title}</h4>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        job.match >= 90 ? 'bg-green-100 text-green-700' :
                        job.match >= 80 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {job.match}% Match
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
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {job.salary}
                        </span>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Interview Probability */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Interview Probability</span>
                          <span className="font-semibold text-gray-900">{job.probability}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-purple-700 h-2 rounded-full"
                            style={{ width: `${job.probability}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          // Handle apply now - would integrate with application system
                          toast.success('Application process started!');
                        }}
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Apply Now
                      </button>
                      <button 
                        onClick={() => {
                          // Handle prepare - redirect to interview prep
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
                      {job.posted}
                    </div>
                  </div>
                ))}
              </div>
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
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Job URL
                </button>
                <button
                  onClick={() => setSmartApplyMode('paste')}
                  className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                    smartApplyMode === 'paste'
                      ? 'bg-white text-purple-600 shadow-sm'
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
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {smartApplyLoading ? 'Analyzing...' : 'Analyze & Apply'}
              </button>

              {smartApplyResult && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Analysis Complete!</h3>
                  <p className="text-sm text-green-700">
                    Match Score: {smartApplyResult.matchScore}% | 
                    Interview Probability: {smartApplyResult.interviewProbability}%
                  </p>
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
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
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
