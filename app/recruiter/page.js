"use client";
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, getDocs, doc, setDoc, 
  deleteDoc, addDoc, onSnapshot,
  query, orderBy, serverTimestamp,
  getDoc
} from 'firebase/firestore';

export default function RecruiterPage() {
  const [activeTab, setActiveTab] = useState('browse');
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
  const [requirements, setRequirements] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [recruiterName, setRecruiterName] = useState('Recruiter');
  const [recruiterCompany, setRecruiterCompany] = useState('');

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
    let filtered = [...students];
    
    if (searchQuery) {
      filtered = filtered.filter(s => 
        s.name?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        s.college?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        s.skills?.some(skill => 
          skill.toLowerCase()
            .includes(searchQuery.toLowerCase()))
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
    } else {
      newList = [...shortlisted, student];
    }
    setShortlisted(newList);
    localStorage.setItem('bridge_shortlist', 
      JSON.stringify(newList));
  };

  // Messaging logic
  const sendMessage = async (studentUid, studentName) => {
    if (!newMessage.trim()) return;
    
    const convId = `recruiter_${studentUid}`;
    const messagesRef = collection(
      db, 'messages', convId, 'chats');
    
    await addDoc(messagesRef, {
      senderId: 'recruiter',
      senderName: recruiterName,
      text: newMessage,
      timestamp: serverTimestamp(),
      read: false
    });

    // Update conversation metadata
    await setDoc(doc(db, 'messages', convId), {
      recruiterName,
      recruiterCompany,
      studentUid,
      studentName,
      lastMessage: newMessage,
      lastTime: serverTimestamp(),
      unreadCount: 1
    }, { merge: true });

    setNewMessage('');
  };

  const openChat = async (student) => {
    setActiveChat(student);
    const convId = `recruiter_${student.uid}`;
    const chatsRef = collection(
      db, 'messages', convId, 'chats');
    const q = query(chatsRef, 
      orderBy('timestamp', 'asc'));
    
    onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setMessages(msgs);
    });
  };

  // Render content function
  const renderContent = () => {
    switch(activeTab) {

      case 'browse':
        return (
          <div>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                Browse Students
              </h2>
              <p className="text-gray-400">
                {filteredStudents.length} students found
              </p>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, college, skills..."
                className="flex-1 min-w-[200px] bg-white/10 
                  border border-white/20 rounded-xl px-4 
                  py-2 text-white text-sm"/>
              
              {/* Domain Filter */}
              <select
                value={domainFilter}
                onChange={e => setDomainFilter(e.target.value)}
                className="bg-white/10 border border-white/20 
                  rounded-xl px-3 py-2 text-white text-sm">
                {['All','Tech','Marketing','Finance',
                  'HR','Operations','MBA'].map(d => (
                  <option key={d} value={d} 
                    className="bg-[#0A0A0F]">{d}</option>
                ))}
              </select>

              {/* Score Filter */}
              <select
                value={scoreFilter}
                onChange={e => setScoreFilter(e.target.value)}
                className="bg-white/10 border border-white/20 
                  rounded-xl px-3 py-2 text-white text-sm">
                {[
                  {label:'All Scores', value:'All'},
                  {label:'900+', value:'900'},
                  {label:'800+', value:'800'},
                  {label:'700+', value:'700'},
                  {label:'600+', value:'600'},
                ].map(o => (
                  <option key={o.value} value={o.value}
                    className="bg-[#0A0A0F]">
                    {o.label}
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="bg-white/10 border border-white/20 
                  rounded-xl px-3 py-2 text-white text-sm">
                {['All','Full-time','Internship'].map(t => (
                  <option key={t} value={t}
                    className="bg-[#0A0A0F]">{t}</option>
                ))}
              </select>
            </div>

            {/* Loading */}
            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 
                gap-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} 
                    className="h-48 bg-white/5 rounded-2xl 
                      animate-pulse"/>
                ))}
              </div>
            )}

            {/* No students */}
            {!loading && filteredStudents.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">👥</p>
                <p className="text-white font-bold text-lg">
                  No students found
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Try adjusting your filters
                </p>
              </div>
            )}

            {/* Student Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 
              gap-4">
              {filteredStudents.map(student => (
                <div key={student.uid}
                  className="bg-white/5 border border-white/10 
                    rounded-2xl p-5 hover:border-purple-500/30 
                    transition-all">
                  
                  {/* Header */}
                  <div className="flex items-start 
                    justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {student.photo ? (
                        <img src={student.photo}
                          alt={student.name}
                          className="w-12 h-12 rounded-full 
                            object-cover"/>
                      ) : (
                        <div className="w-12 h-12 rounded-full 
                          bg-purple-600 flex items-center 
                          justify-center text-white font-bold">
                          {student.name?.charAt(0) || 'S'}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-bold 
                          text-sm">
                          {student.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {student.degree}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {student.college}
                        </p>
                      </div>
                    </div>
                    
                    {/* BRIDGE Score */}
                    <div className={`text-center px-3 py-1 
                      rounded-xl
                      ${student.bridgeScore >= 900
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : student.bridgeScore >= 800
                        ? 'bg-green-500/20 text-green-400'
                        : student.bridgeScore >= 700
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'}`}>
                      <div className="text-lg font-black">
                        {student.bridgeScore}
                      </div>
                      <div className="text-xs">Score</div>
                    </div>
                  </div>

                  {/* Location + Type */}
                  <div className="flex gap-2 mb-3">
                    <span className="bg-white/10 text-gray-300 
                      text-xs px-2 py-1 rounded-full">
                      📍 {student.location}
                    </span>
                    <span className="bg-white/10 text-gray-300 
                      text-xs px-2 py-1 rounded-full">
                      💼 {student.lookingFor}
                    </span>
                  </div>

                  {/* Domains */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {student.domains?.slice(0,3).map(d => (
                      <span key={d}
                        className="bg-purple-500/20 
                          text-purple-300 text-xs px-2 
                          py-0.5 rounded-full">
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {student.skills?.slice(0,3).map(s => (
                      <span key={s}
                        className="bg-white/10 text-gray-400 
                          text-xs px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                    {student.skills?.length > 3 && (
                      <span className="text-gray-500 text-xs">
                        +{student.skills.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mb-4 
                    text-center">
                    <div className="flex-1 bg-white/5 
                      rounded-xl py-2">
                      <div className="text-white font-bold 
                        text-sm">
                        {student.interviewsDone}
                      </div>
                      <div className="text-gray-500 
                        text-xs">
                        Interviews
                      </div>
                    </div>
                    <div className="flex-1 bg-white/5 
                      rounded-xl py-2">
                      <div className="text-white font-bold 
                        text-sm">
                        {student.avgScore || '--'}
                      </div>
                      <div className="text-gray-500 
                        text-xs">
                        Avg Score
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowProfile(true);
                      }}
                      className="flex-1 bg-purple-600 
                        hover:bg-purple-700 text-white 
                        py-2 rounded-xl text-sm font-medium
                        transition-all">
                      View Profile
                    </button>
                    <button
                      onClick={() => toggleShortlist(student)}
                      className={`px-3 py-2 rounded-xl 
                        text-sm transition-all
                        ${shortlisted.find(
                          s => s.uid === student.uid)
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-white/10 text-gray-400'}`}>
                      {shortlisted.find(
                        s => s.uid === student.uid)
                        ? '⭐' : '☆'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'shortlist':
        return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                My Shortlist
              </h2>
              <p className="text-gray-400">
                {shortlisted.length} candidates shortlisted
              </p>
            </div>

            {shortlisted.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">⭐</p>
                <p className="text-white font-bold">
                  No candidates shortlisted yet
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Browse students and click ☆ to shortlist
                </p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-4 bg-purple-600 px-6 py-2 
                    rounded-xl text-white text-sm">
                  Browse Students →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 
                md:grid-cols-3 gap-4">
                {shortlisted.map(student => (
                  <div key={student.uid}
                    className="bg-white/5 border 
                      border-yellow-500/30 rounded-2xl p-5">
                    
                    <div className="flex items-center 
                      gap-3 mb-4">
                      {student.photo ? (
                        <img src={student.photo}
                          className="w-12 h-12 rounded-full"/>
                      ) : (
                        <div className="w-12 h-12 
                          rounded-full bg-purple-600 
                          flex items-center justify-center 
                          text-white font-bold">
                          {student.name?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-bold">
                          {student.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {student.college}
                        </p>
                      </div>
                      <div className="ml-auto text-yellow-400 
                        font-black text-lg">
                        {student.bridgeScore}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setActiveTab('messages');
                          openChat(student);
                        }}
                        className="flex-1 bg-purple-600 
                          text-white py-2 rounded-xl 
                          text-sm">
                        💬 Message
                      </button>
                      <button
                        onClick={() => toggleShortlist(student)}
                        className="px-3 py-2 bg-red-500/20 
                          text-red-400 rounded-xl text-sm">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'post':
        return <PostRequirement db={db} />;

      case 'messages':
        return (
          <MessagesTab 
            db={db}
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            messages={messages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
            openChat={openChat}
            recruiterName={recruiterName}
            shortlisted={shortlisted}
          />
        );
    }
  };

  return (
    <>
      {/* MOBILE LAYOUT */}
      <div className="md:hidden min-h-screen 
        bg-[#0A0A0F] text-white">
        
        {/* Mobile Top Bar */}
        <div className="sticky top-0 bg-[#0A0A0F]/95 
          backdrop-blur-lg border-b border-white/10 
          px-4 py-3 flex justify-between items-center z-10">
          <div>
            <h1 className="text-lg font-bold text-white">
              Recruiter Portal
            </h1>
            <p className="text-xs text-gray-400">
              {filteredStudents.length} students available
            </p>
          </div>
          <a href="/dashboard" 
            className="text-gray-400 text-sm">
            ← Back
          </a>
        </div>

        {/* Mobile Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 
          bg-[#0A0A0F]/95 backdrop-blur-lg 
          border-t border-white/10 z-10">
          <div className="flex justify-around py-3">
            {[
              {id:'browse', icon:'👥', label:'Students'},
              {id:'shortlist', icon:'⭐', label:'Shortlist'},
              {id:'post', icon:'💼', label:'Post Job'},
              {id:'messages', icon:'💬', label:'Messages'},
            ].map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1
                  ${activeTab === tab.id 
                    ? 'text-purple-400' 
                    : 'text-gray-500'}`}>
                <span className="text-xl">{tab.icon}</span>
                <span className="text-xs">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Content */}
        <div className="px-4 pt-4 pb-24">
          {renderContent()}
        </div>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex min-h-screen 
        bg-[#0A0A0F] text-white">
        
        {/* Sidebar */}
        <div className="w-64 fixed left-0 top-0 bottom-0 
          bg-[#111118] border-r border-white/10 
          flex flex-col">
          
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="text-2xl font-black text-white">
              BRIDGE
            </div>
            <div className="text-xs text-purple-400 mt-1">
              Recruiter Portal
            </div>
          </div>

          {/* Recruiter Info */}
          <div className="p-4 border-b border-white/10">
            <input
              value={recruiterName}
              onChange={e => setRecruiterName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white/5 rounded-lg px-3 
                py-2 text-white text-sm mb-2"/>
            <input
              value={recruiterCompany}
              onChange={e => setRecruiterCompany(e.target.value)}
              placeholder="Company name"
              className="w-full bg-white/5 rounded-lg px-3 
                py-2 text-white text-sm"/>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-4 space-y-1">
            {[
              {id:'browse', icon:'👥', 
                label:'Browse Students',
                count: filteredStudents.length},
              {id:'shortlist', icon:'⭐', 
                label:'My Shortlist',
                count: shortlisted.length},
              {id:'post', icon:'💼', 
                label:'Post Requirement',
                count: null},
              {id:'messages', icon:'💬', 
                label:'Messages',
                count: null},
            ].map(tab => (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center 
                  justify-between px-4 py-3 rounded-xl 
                  text-sm transition-all
                  ${activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:bg-white/5'}`}>
                <span className="flex items-center gap-3">
                  {tab.icon} {tab.label}
                </span>
                {tab.count !== null && (
                  <span className={`text-xs px-2 py-0.5 
                    rounded-full
                    ${activeTab === tab.id
                      ? 'bg-white/20'
                      : 'bg-white/10'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Back to app */}
          <div className="p-4 border-t border-white/10">
            <a href="/dashboard"
              className="flex items-center gap-2 
                text-gray-400 hover:text-white 
                text-sm transition-colors">
              ← Back to Student App
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="ml-64 flex-1 p-8">
          {renderContent()}
        </div>
      </div>

      {/* Student Profile Modal */}
      {showProfile && selectedStudent && (
        <div className="fixed inset-0 bg-black/80 
          backdrop-blur-sm z-50 flex items-center 
          justify-center p-4"
          onClick={() => setShowProfile(false)}>
          <div className="bg-[#111118] border border-white/20 
            rounded-3xl p-6 w-full max-w-lg max-h-[90vh] 
            overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            
            {/* Close */}
            <button 
              onClick={() => setShowProfile(false)}
              className="float-right text-gray-400 
                hover:text-white text-xl">
              ✕
            </button>

            {/* Profile header */}
            <div className="text-center mb-6">
              {selectedStudent.photo ? (
                <img src={selectedStudent.photo}
                  className="w-20 h-20 rounded-full 
                    mx-auto mb-3"/>
              ) : (
                <div className="w-20 h-20 rounded-full 
                  bg-purple-600 flex items-center 
                  justify-center text-white text-2xl 
                  font-bold mx-auto mb-3">
                  {selectedStudent.name?.charAt(0)}
                </div>
              )}
              <h2 className="text-white text-xl font-bold">
                {selectedStudent.name}
              </h2>
              <p className="text-gray-400">
                {selectedStudent.degree} • 
                {selectedStudent.college}
              </p>
              <p className="text-gray-500 text-sm">
                📍 {selectedStudent.location}
              </p>
            </div>

            {/* BRIDGE Score */}
            <div className={`rounded-2xl p-4 text-center mb-4
              ${selectedStudent.bridgeScore >= 800
                ? 'bg-green-500/20 border border-green-500/30'
                : 'bg-purple-500/20 border border-purple-500/30'}`}>
              <div className="text-4xl font-black text-white">
                {selectedStudent.bridgeScore}
              </div>
              <div className="text-sm text-gray-300">
                BRIDGE Score
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 mb-6">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-1">
                  Looking For
                </p>
                <p className="text-white text-sm">
                  {selectedStudent.lookingFor}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-1">
                  Domains
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedStudent.domains?.map(d => (
                    <span key={d} 
                      className="bg-purple-500/20 
                        text-purple-300 text-xs px-2 
                        py-0.5 rounded-full">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-gray-400 text-xs mb-1">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedStudent.skills?.map(s => (
                    <span key={s}
                      className="bg-white/10 text-gray-300 
                        text-xs px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  toggleShortlist(selectedStudent);
                  setShowProfile(false);
                }}
                className={`flex-1 py-3 rounded-xl 
                  font-medium text-sm transition-all
                  ${shortlisted.find(
                    s => s.uid === selectedStudent.uid)
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-white/10 text-white'}`}>
                {shortlisted.find(
                  s => s.uid === selectedStudent.uid)
                  ? '⭐ Shortlisted'
                  : '☆ Shortlist'}
              </button>
              <button
                onClick={() => {
                  setShowProfile(false);
                  setActiveTab('messages');
                  openChat(selectedStudent);
                }}
                className="flex-1 bg-purple-600 text-white 
                  py-3 rounded-xl font-medium text-sm">
                💬 Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// POST REQUIREMENT COMPONENT
function PostRequirement({ db }) {
  const [form, setForm] = useState({
    title: '',
    type: 'Full-time',
    location: '',
    salary: '',
    skills: '',
    domain: 'Tech',
    openings: 1,
    description: '',
    deadline: '',
    company: '',
    contact: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.company) {
      alert('Please fill job title and company name');
      return;
    }
    setLoading(true);
    try {
      await addDoc(
        collection(db, 'job_requirements'), {
        ...form,
        skills: form.skills.split(',')
          .map(s => s.trim()),
        postedAt: serverTimestamp(),
        status: 'active'
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Post error:', err);
      alert('Failed to post. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🎉</div>
      <h2 className="text-white text-2xl font-bold mb-2">
        Requirement Posted!
      </h2>
      <p className="text-gray-400 mb-6">
        Students will be notified about this opportunity
      </p>
      <button
        onClick={() => setSubmitted(false)}
        className="bg-purple-600 px-6 py-3 rounded-xl 
          text-white font-medium">
        Post Another →
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-white mb-6">
        Post Job Requirement
      </h2>

      <div className="space-y-4">
        {/* Company */}
        <div>
          <label className="text-gray-400 text-sm mb-1 
            block">Company Name *</label>
          <input
            value={form.company}
            onChange={e => setForm({
              ...form, company: e.target.value})}
            placeholder="e.g. TCS, Startup India"
            className="w-full bg-white/10 border 
              border-white/20 rounded-xl px-4 py-3 
              text-white"/>
        </div>

        {/* Job Title */}
        <div>
          <label className="text-gray-400 text-sm mb-1 
            block">Job Title *</label>
          <input
            value={form.title}
            onChange={e => setForm({
              ...form, title: e.target.value})}
            placeholder="e.g. Marketing Executive"
            className="w-full bg-white/10 border 
              border-white/20 rounded-xl px-4 py-3 
              text-white"/>
        </div>

        {/* Type + Domain */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm 
              mb-1 block">Type</label>
            <select
              value={form.type}
              onChange={e => setForm({
                ...form, type: e.target.value})}
              className="w-full bg-white/10 border 
                border-white/20 rounded-xl px-4 py-3 
                text-white">
              <option className="bg-[#0A0A0F]">
                Full-time
              </option>
              <option className="bg-[#0A0A0F]">
                Internship
              </option>
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-sm 
              mb-1 block">Domain</label>
            <select
              value={form.domain}
              onChange={e => setForm({
                ...form, domain: e.target.value})}
              className="w-full bg-white/10 border 
                border-white/20 rounded-xl px-4 py-3 
                text-white">
              {['Tech','Marketing','Finance',
                'HR','Operations','MBA'].map(d => (
                <option key={d} 
                  className="bg-[#0A0A0F]">{d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location + Salary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm 
              mb-1 block">Location</label>
            <input
              value={form.location}
              onChange={e => setForm({
                ...form, location: e.target.value})}
              placeholder="Mumbai / Remote"
              className="w-full bg-white/10 border 
                border-white/20 rounded-xl px-4 py-3 
                text-white"/>
          </div>
          <div>
            <label className="text-gray-400 text-sm 
              mb-1 block">Salary/Stipend</label>
            <input
              value={form.salary}
              onChange={e => setForm({
                ...form, salary: e.target.value})}
              placeholder="3-5 LPA / ₹15,000/month"
              className="w-full bg-white/10 border 
                border-white/20 rounded-xl px-4 py-3 
                text-white"/>
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="text-gray-400 text-sm 
            mb-1 block">Required Skills 
            (comma separated)</label>
          <input
            value={form.skills}
            onChange={e => setForm({
              ...form, skills: e.target.value})}
            placeholder="Excel, Canva, Digital Marketing"
            className="w-full bg-white/10 border 
              border-white/20 rounded-xl px-4 py-3 
              text-white"/>
        </div>

        {/* Openings */}
        <div>
          <label className="text-gray-400 text-sm 
            mb-1 block">Number of Openings</label>
          <input
            type="number"
            value={form.openings}
            onChange={e => setForm({
              ...form, openings: e.target.value})}
            min="1"
            className="w-full bg-white/10 border 
              border-white/20 rounded-xl px-4 py-3 
              text-white"/>
        </div>

        {/* Description */}
        <div>
          <label className="text-gray-400 text-sm 
            mb-1 block">Job Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({
              ...form, description: e.target.value})}
            placeholder="Describe the role, 
              responsibilities, requirements..."
            rows={4}
            className="w-full bg-white/10 border 
              border-white/20 rounded-xl px-4 py-3 
              text-white resize-none"/>
        </div>

        {/* Contact */}
        <div>
          <label className="text-gray-400 text-sm 
            mb-1 block">Contact Email/WhatsApp</label>
          <input
            value={form.contact}
            onChange={e => setForm({
              ...form, contact: e.target.value})}
            placeholder="hr@company.com or +91XXXXXXXXXX"
            className="w-full bg-white/10 border 
              border-white/20 rounded-xl px-4 py-3 
              text-white"/>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-purple-600 
            hover:bg-purple-700 text-white py-4 
            rounded-xl font-bold text-lg 
            disabled:opacity-50 transition-all">
          {loading 
            ? 'Posting...' 
            : 'Post Requirement →'}
        </button>
      </div>
    </div>
  );
}

// MESSAGES COMPONENT
function MessagesTab({ 
  db, activeChat, setActiveChat,
  messages, newMessage, setNewMessage,
  sendMessage, openChat, 
  recruiterName, shortlisted 
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">
        Messages
      </h2>

      {!activeChat ? (
        <div>
          {shortlisted.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">💬</p>
              <p className="text-white font-bold">
                No conversations yet
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Shortlist students to message them
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shortlisted.map(student => (
                <div key={student.uid}
                  onClick={() => openChat(student)}
                  className="bg-white/5 border 
                    border-white/10 rounded-2xl p-4 
                    flex items-center gap-4 
                    cursor-pointer hover:bg-white/10 
                    transition-all">
                  {student.photo ? (
                    <img src={student.photo}
                      className="w-12 h-12 rounded-full"/>
                  ) : (
                    <div className="w-12 h-12 rounded-full 
                      bg-purple-600 flex items-center 
                      justify-center text-white font-bold">
                      {student.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-white font-medium">
                      {student.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {student.college}
                    </p>
                  </div>
                  <span className="text-purple-400 text-sm">
                    Chat →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-[600px]">
          {/* Chat header */}
          <div className="flex items-center gap-3 
            pb-4 border-b border-white/10 mb-4">
            <button
              onClick={() => setActiveChat(null)}
              className="text-gray-400 hover:text-white">
              ←
            </button>
            {activeChat.photo ? (
              <img src={activeChat.photo}
                className="w-10 h-10 rounded-full"/>
            ) : (
              <div className="w-10 h-10 rounded-full 
                bg-purple-600 flex items-center 
                justify-center text-white font-bold">
                {activeChat.name?.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-white font-medium">
                {activeChat.name}
              </p>
              <p className="text-gray-400 text-xs">
                {activeChat.college}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto 
            space-y-3 mb-4">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 
                text-sm py-8">
                Start the conversation!
              </p>
            ) : (
              messages.map(msg => (
                <div key={msg.id}
                  className={`flex 
                    ${msg.senderId === 'recruiter'
                      ? 'justify-end'
                      : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 
                    py-2 rounded-2xl text-sm
                    ${msg.senderId === 'recruiter'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/10 text-white'}`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && 
                sendMessage(
                  activeChat.uid, 
                  activeChat.name)}
              placeholder="Type a message..."
              className="flex-1 bg-white/10 border 
                border-white/20 rounded-xl px-4 py-3 
                text-white text-sm"/>
            <button
              onClick={() => sendMessage(
                activeChat.uid, 
                activeChat.name)}
              className="bg-purple-600 px-6 py-3 
                rounded-xl text-white font-medium">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
