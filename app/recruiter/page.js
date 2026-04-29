"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { 
  collection, getDocs, doc, setDoc, 
  deleteDoc, addDoc, onSnapshot,
  query, orderBy, serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AppShell from "@/components/AppShell";
import { Users, Star, MessageSquare, Briefcase, Search, Filter, ChevronRight, Mail, Phone, MapPin, Award, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

export default function RecruiterPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  // Auth guard — only admin/recruiter roles
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace('/login'); return; }
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const role = snap.exists() ? snap.data().role : 'student';
        if (role === 'admin' || role === 'recruiter') {
          setAuthorized(true);
        } else {
          toast.error('Access denied — recruiter only');
          router.replace('/dashboard');
        }
      } catch { router.replace('/dashboard'); }
    });
    return () => unsub();
  }, [router]);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('All');
  const [scoreFilter, setScoreFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  
  // Smart Match state
  const [matchRequirements, setMatchRequirements] = useState({
    role: '',
    skills: '',
    experience: '',
    location: '',
    minScore: '',
    jobType: '',
    domain: '',
    additional: ''
  });
  const [matchResults, setMatchResults] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  // Fetch real students from Firestore
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const studentList = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          // Include all users or only students
          studentList.push({
            uid: doc.id,
            ...data,
            // Generate BRIDGE score if not exists (500-900 range)
            bridgeScore: data.bridgeScore || 
              Math.floor(Math.random() * 400) + 500,
            interviewsDone: data.interviewsDone || 0,
            avgScore: data.avgScore || 0,
            skills: data.skills || [],
            domains: data.domains || [data.domain] || [],
            college: data.college || 'Not specified',
            degree: data.degree || 'Not specified',
            location: data.city || data.location || 'India',
            lookingFor: data.lookingFor || 'Full-time',
            photo: data.photo || data.photoURL || null,
            name: data.name || data.displayName || 'Anonymous Student',
          });
        });

        // Sort by BRIDGE score
        studentList.sort((a, b) => 
          b.bridgeScore - a.bridgeScore);
        
        setStudents(studentList);
        setFilteredStudents(studentList);
        console.log('Students loaded:', studentList.length);
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
    
    // Load shortlisted from localStorage
    const saved = localStorage.getItem('bridge_shortlist');
    if (saved) setShortlisted(JSON.parse(saved));
  }, []);

  // Filter logic
  useEffect(() => {
    let filtered = students;
    
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.college?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (domainFilter !== 'All') {
      filtered = filtered.filter(s => 
        s.domains?.includes(domainFilter) ||
        s.domain === domainFilter
      );
    }
    
    if (scoreFilter !== 'All') {
      const minScore = parseInt(scoreFilter);
      filtered = filtered.filter(s => 
        s.bridgeScore >= minScore);
    }
    
    if (typeFilter !== 'All') {
      filtered = filtered.filter(s =>
        s.lookingFor === typeFilter ||
        s.lookingFor === 'Both'
      );
    }
    
    setFilteredStudents(filtered);
  }, [searchQuery, domainFilter, scoreFilter, 
      typeFilter, students]);

  // Shortlist logic
  const toggleShortlist = (student) => {
    const isShortlisted = shortlisted
      .find(s => s.uid === student.uid);
    let newList;
    if (isShortlisted) {
      newList = shortlisted
        .filter(s => s.uid !== student.uid);
      toast.success('Removed from shortlist');
    } else {
      newList = [...shortlisted, student];
      toast.success('Added to shortlist');
    }
    setShortlisted(newList);
    localStorage.setItem('bridge_shortlist', 
      JSON.stringify(newList));
  };

  const getScoreColor = (score) => {
    if (score >= 900) return 'text-purple-500';
    if (score >= 800) return 'text-purple-600';
    if (score >= 700) return 'text-purple-600';
    if (score >= 600) return 'text-green-600';
    return 'text-gray-600';
  };

  const getScoreBadge = (score) => {
    if (score >= 900) return { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Exceptional' };
    if (score >= 800) return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Excellent' };
    if (score >= 700) return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Good' };
    if (score >= 600) return { bg: 'bg-green-100', text: 'text-green-700', label: 'Average' };
    return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Beginner' };
  };

  const handleSmartMatch = async () => {
    if (!matchRequirements.role && !matchRequirements.skills) {
      toast.error('Please provide at least role or skills');
      return;
    }

    setMatchLoading(true);
    toast.loading('Finding best matches...');

    try {
      const response = await fetch('/api/recruiter-match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requirements: matchRequirements
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to match candidates');
      }

      toast.dismiss();
      setMatchResults(data);
      toast.success(`Found ${data.matches.length} matching candidates!`);
    } catch (error) {
      toast.dismiss();
      toast.error(error.message || 'Failed to match candidates');
      console.error('Smart match error:', error);
    } finally {
      setMatchLoading(false);
    }
  };

  if (!authorized) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Checking access...</div>;
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent mx-auto mb-4"></div>
            <div className="text-gray-600">Loading students...</div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recruiter Portal</h1>
          <p className="text-gray-600">Find and connect with talented students</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-sm text-green-600 font-medium">+12%</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{filteredStudents.length}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-sm text-green-600 font-medium">+8%</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{shortlisted.length}</div>
            <div className="text-sm text-gray-600">Shortlisted</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-sm text-green-600 font-medium">+15%</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {students.filter(s => s.bridgeScore >= 800).length}
            </div>
            <div className="text-sm text-gray-600">Top Performers</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-sm text-green-600 font-medium">+25%</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(students.reduce((acc, s) => acc + s.bridgeScore, 0) / students.length) || 0}
            </div>
            <div className="text-sm text-gray-600">Avg Score</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 p-1 mb-6">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'browse', label: 'Browse Students', icon: Users },
              { id: 'smartmatch', label: 'Smart Match', icon: TrendingUp },
              { id: 'shortlist', label: 'Shortlisted', icon: Star },
              { id: 'post', label: 'Post Job', icon: Briefcase },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'browse' && (
          <div>
            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by name, college, skills..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <select
                  value={domainFilter}
                  onChange={e => setDomainFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="All">All Domains</option>
                  {['Tech', 'Marketing', 'Finance', 'HR', 'Operations', 'MBA'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={scoreFilter}
                  onChange={e => setScoreFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="All">All Scores</option>
                  <option value="900">900+</option>
                  <option value="800">800+</option>
                  <option value="700">700+</option>
                  <option value="600">600+</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="All">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Both">Both</option>
                </select>
              </div>
            </div>

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => {
                const scoreBadge = getScoreBadge(student.bridgeScore);
                const isShortlisted = shortlisted.find(s => s.uid === student.uid);
                
                return (
                  <div key={student.uid} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {student.photo ? (
                            <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-r from-[#0891B2] to-[#0D9488] rounded-full flex items-center justify-center text-white font-bold">
                              {student.name?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.college}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleShortlist(student)}
                          className={`p-2 rounded-lg transition-colors ${
                            isShortlisted
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-400 hover:text-yellow-500'
                          }`}
                        >
                          <Star className={`w-5 h-5 ${isShortlisted ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">BRIDGE Score</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${getScoreColor(student.bridgeScore)}`}>
                              {student.bridgeScore}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${scoreBadge.bg} ${scoreBadge.text}`}>
                              {scoreBadge.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Interviews</span>
                          <span className="text-sm font-medium">{student.interviewsDone}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Avg Score</span>
                          <span className="text-sm font-medium">{student.avgScore.toFixed(1)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Looking for</span>
                          <span className="text-sm font-medium">{student.lookingFor}</span>
                        </div>

                        {student.skills && student.skills.length > 0 && (
                          <div>
                            <span className="text-sm text-gray-600">Skills</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {student.skills.slice(0, 3).map((skill, index) => (
                                <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  {skill}
                                </span>
                              ))}
                              {student.skills.length > 3 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                  +{student.skills.length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowProfile(true);
                          }}
                          className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          View Profile
                        </button>
                        <button className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                          Contact
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'shortlist' && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shortlisted Students</h2>
              {shortlisted.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No students shortlisted yet</p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Browse Students →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {shortlisted.map((student) => (
                    <div key={student.uid} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        {student.photo ? (
                          <img src={student.photo} alt={student.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-[#0891B2] to-[#0D9488] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {student.name?.charAt(0)?.toUpperCase() || 'A'}
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-600">{student.college}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`font-bold ${getScoreColor(student.bridgeScore)}`}>
                            {student.bridgeScore}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                        <button
                          onClick={() => toggleShortlist(student)}
                          className="text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'smartmatch' && (
          <div>
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Candidate Matching</h2>
              <p className="text-gray-600 mb-6">Enter your requirements and get the best matching candidates instantly</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Role *</label>
                  <input
                    type="text"
                    value={matchRequirements.role}
                    onChange={(e) => setMatchRequirements({...matchRequirements, role: e.target.value})}
                    placeholder="e.g. Software Engineer, Marketing Manager"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills *</label>
                  <input
                    type="text"
                    value={matchRequirements.skills}
                    onChange={(e) => setMatchRequirements({...matchRequirements, skills: e.target.value})}
                    placeholder="e.g. Python, React, SQL"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                  <select
                    value={matchRequirements.experience}
                    onChange={(e) => setMatchRequirements({...matchRequirements, experience: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="Fresher">Fresher</option>
                    <option value="0-1 years">0-1 years</option>
                    <option value="1-3 years">1-3 years</option>
                    <option value="3+ years">3+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={matchRequirements.location}
                    onChange={(e) => setMatchRequirements({...matchRequirements, location: e.target.value})}
                    placeholder="e.g. Bangalore, Remote"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min BRIDGE Score</label>
                  <input
                    type="number"
                    value={matchRequirements.minScore}
                    onChange={(e) => setMatchRequirements({...matchRequirements, minScore: e.target.value})}
                    placeholder="e.g. 700"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
                  <select
                    value={matchRequirements.jobType}
                    onChange={(e) => setMatchRequirements({...matchRequirements, jobType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                  <select
                    value={matchRequirements.domain}
                    onChange={(e) => setMatchRequirements({...matchRequirements, domain: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="Tech">Tech</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                    <option value="MBA">MBA</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Requirements</label>
                <textarea
                  value={matchRequirements.additional}
                  onChange={(e) => setMatchRequirements({...matchRequirements, additional: e.target.value})}
                  placeholder="Any other specific requirements, certifications, or preferences..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <button
                onClick={handleSmartMatch}
                disabled={matchLoading}
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {matchLoading ? (
                  <>
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Finding Best Matches...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-5 h-5" />
                    Find Matching Candidates
                  </>
                )}
              </button>
            </div>

            {/* Match Results */}
            {matchResults && (
              <div>
                {/* Insights Card */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-50 rounded-xl border border-purple-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Matching Insights</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{matchResults.insights.total_candidates}</div>
                      <div className="text-sm text-gray-600">Total Candidates</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{matchResults.insights.matched_candidates}</div>
                      <div className="text-sm text-gray-600">Good Matches</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{matchResults.insights.avg_match_score}%</div>
                      <div className="text-sm text-gray-600">Avg Match Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{matchResults.matches.length}</div>
                      <div className="text-sm text-gray-600">Top Matches</div>
                    </div>
                  </div>
                  {matchResults.insights.recommendation && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">💡 Recommendation: </span>
                        {matchResults.insights.recommendation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Matched Candidates */}
                <div className="space-y-4">
                  {matchResults.matches.map((match, index) => {
                    const candidate = match.candidate_data;
                    if (!candidate) return null;

                    return (
                      <div key={candidate.uid} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {candidate.photo ? (
                                <img src={candidate.photo} alt={candidate.name} className="w-16 h-16 rounded-full object-cover" />
                              ) : (
                                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                  {candidate.name?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                              )}
                              <div className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                #{index + 1}
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{candidate.name}</h3>
                              <p className="text-sm text-gray-600">{candidate.college}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-500">{candidate.degree}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500">{candidate.location}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${
                              match.match_score >= 90 ? 'text-green-600' :
                              match.match_score >= 80 ? 'text-purple-600' :
                              match.match_score >= 70 ? 'text-blue-600' :
                              'text-gray-600'
                            }`}>
                              {match.match_score}%
                            </div>
                            <div className={`text-xs px-3 py-1 rounded-full font-semibold mt-1 ${
                              match.recommendation === 'Strong Match' ? 'bg-green-100 text-green-700' :
                              match.recommendation === 'Good Match' ? 'bg-purple-100 text-purple-700' :
                              match.recommendation === 'Potential Match' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {match.recommendation}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">BRIDGE Score</div>
                            <div className="text-xl font-bold text-purple-600">{candidate.bridgeScore}</div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Interview Readiness</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full"
                                  style={{ width: `${match.interview_readiness}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold">{match.interview_readiness}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div>
                            <h4 className="text-sm font-semibold text-green-700 mb-2">✓ Key Strengths</h4>
                            <div className="flex flex-wrap gap-2">
                              {match.key_strengths?.map((strength, i) => (
                                <span key={i} className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full">
                                  {strength}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-purple-700 mb-2">🎯 Why This Match</h4>
                            <ul className="space-y-1">
                              {match.match_reasons?.map((reason, i) => (
                                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                  <span className="text-purple-600 mt-0.5">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {match.gaps && match.gaps.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-orange-700 mb-2">⚠ Areas to Assess</h4>
                              <ul className="space-y-1">
                                {match.gaps.map((gap, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-orange-600 mt-0.5">•</span>
                                    <span>{gap}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {match.salary_fit && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-xs text-blue-700 font-semibold mb-1">💰 Salary Expectation</div>
                              <div className="text-sm text-blue-900">{match.salary_fit}</div>
                            </div>
                          )}

                          {match.interview_questions && match.interview_questions.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-purple-700 mb-2">❓ Suggested Interview Questions</h4>
                              <ul className="space-y-1">
                                {match.interview_questions.map((q, i) => (
                                  <li key={i} className="text-sm text-gray-700 pl-4 border-l-2 border-purple-200">
                                    {q}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setSelectedStudent(candidate);
                              setShowProfile(true);
                            }}
                            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                          >
                            View Full Profile
                          </button>
                          <button
                            onClick={() => toggleShortlist(candidate)}
                            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                              shortlisted.find(s => s.uid === candidate.uid)
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            {shortlisted.find(s => s.uid === candidate.uid) ? '⭐ Shortlisted' : '☆ Shortlist'}
                          </button>
                          <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
                            Contact
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'post' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Post Job Requirement</h2>
            <p className="text-gray-600 mb-6">Share your job requirements with our student community</p>
            
            <div className="text-center py-12">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
              <p className="text-gray-600">Job posting feature will be available soon</p>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfile && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Student Profile</h2>
                  <button
                    onClick={() => setShowProfile(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  {selectedStudent.photo ? (
                    <img src={selectedStudent.photo} alt={selectedStudent.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-r from-[#0891B2] to-[#0D9488] rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {selectedStudent.name?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedStudent.name}</h3>
                    <p className="text-gray-600">{selectedStudent.college}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {selectedStudent.email || 'No email'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {selectedStudent.phone || 'No phone'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{selectedStudent.bridgeScore}</div>
                    <div className="text-sm text-gray-600">BRIDGE Score</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedStudent.interviewsDone}</div>
                    <div className="text-sm text-gray-600">Interviews Done</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Education</h4>
                    <p className="text-gray-600">{selectedStudent.degree || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Domain</h4>
                    <p className="text-gray-600">{selectedStudent.domain || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                    <p className="text-gray-600">{selectedStudent.location || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Looking For</h4>
                    <p className="text-gray-600">{selectedStudent.lookingFor}</p>
                  </div>
                  
                  {selectedStudent.skills && selectedStudent.skills.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedStudent.skills.map((skill, index) => (
                          <span key={index} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => toggleShortlist(selectedStudent)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                      shortlisted.find(s => s.uid === selectedStudent.uid)
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {shortlisted.find(s => s.uid === selectedStudent.uid) ? '⭐ Shortlisted' : '☆ Shortlist'}
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                    Contact Student
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
