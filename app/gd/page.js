"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Users, MessageSquare, Clock, Target, Zap, Award, TrendingUp, Mic, Square, Play, Timer, Lightbulb, Plus, X } from "lucide-react";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth } from "@/lib/firebase";

const defaultTopics = [
  { id: 1, title: "AI in Education: Boon or Risk?", participants: 18, category: "Technology" },
  { id: 2, title: "Remote Work vs Office Culture", participants: 14, category: "Work Culture" },
  { id: 3, title: "Should Coding Be Mandatory for MBAs?", participants: 11, category: "Education" },
  { id: 4, title: "Is Social Media Helping Students?", participants: 16, category: "Social Impact" },
  { id: 5, title: "Gig Economy vs Traditional Jobs", participants: 12, category: "Career" },
  { id: 6, title: "College Rankings vs Real Skills", participants: 15, category: "Education" },
];

const initialMessages = [
  { id: 1, user: "Aarav", text: "I think AI can personalize learning at scale.", time: "2:30 PM" },
  { id: 2, user: "Nisha", text: "Yes, but we should ensure students still think critically.", time: "2:31 PM" },
];

export default function GDPage() {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [points, setPoints] = useState([]);
  const [topicData, setTopicData] = useState(null);
  const [activeView, setActiveView] = useState('topics');
  const [activeTab, setActiveTab] = useState('prepare');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedTimer, setSelectedTimer] = useState(5);
  
  // Custom Room States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [customDifficulty, setCustomDifficulty] = useState('Medium');
  const [customDuration, setCustomDuration] = useState(10);
  const [customRooms, setCustomRooms] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Load topic data from sessionStorage if available
    const savedTopic = sessionStorage.getItem('gd_topic');
    if (savedTopic) {
      try {
        const topic = JSON.parse(savedTopic);
        setTopicData(topic);
        setSelectedTopic(topic);
        setActiveView('discussion');
      } catch (error) {
        console.error('Error parsing topic data:', error);
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Load custom rooms from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'gd_rooms'),
      where('isCustom', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomRooms(rooms);
    }, (error) => {
      console.error('Error loading custom rooms:', error);
    });

    return () => unsubscribe();
  }, []);

  const createCustomRoom = async () => {
    if (!customTopic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setIsCreating(true);
    try {
      const user = auth.currentUser;
      const roomData = {
        topic: customTopic,
        difficulty: customDifficulty,
        duration: customDuration,
        createdBy: user?.uid || 'anonymous',
        createdByName: user?.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        participants: 0,
        isCustom: true,
        isActive: true
      };

      const docRef = await addDoc(collection(db, 'gd_rooms'), roomData);
      
      // Generate AI content for this topic
      const response = await fetch('/api/gd-from-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: customTopic,
          category: 'Custom'
        })
      });

      let aiContent = null;
      if (response.ok) {
        aiContent = await response.json();
      }

      toast.success('Custom room created!');
      setShowCreateModal(false);
      setCustomTopic('');
      
      // Open the custom room immediately
      const newRoom = {
        id: docRef.id,
        ...roomData,
        title: customTopic,
        aiContent
      };
      handleJoinCustomRoom(newRoom);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinCustomRoom = (room) => {
    setSelectedTopic({
      id: room.id,
      title: room.topic,
      participants: room.participants || 0,
      category: 'Custom',
      difficulty: room.difficulty,
      duration: room.duration,
      isCustom: true
    });
    setActiveView('discussion');
    setMessages([
      { id: 1, user: "Moderator", text: `Welcome to custom GD: ${room.topic}`, time: "Now" },
      { id: 2, user: "You", text: "I'm ready to discuss!", time: "Now" },
    ]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleJoinDiscussion = (topic) => {
    setSelectedTopic(topic);
    setActiveView('discussion');
    setMessages([
      { id: 1, user: "Moderator", text: `Welcome to the discussion on: ${topic.title}`, time: "Now" },
      { id: 2, user: "You", text: "I'm excited to participate!", time: "Now" },
    ]);
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      const newMessage = {
        id: messages.length + 1,
        user: "You",
        text: input.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setInput('');
      
      // Simulate other responses
      setTimeout(() => {
        const responses = [
          "That's an interesting perspective!",
          "I agree with your point.",
          "Have you considered the opposite view?",
          "Great insight! Let me add to that..."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const botMessage = {
          id: messages.length + 2,
          user: "Participant",
          text: randomResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMessage]);
      }, 2000);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast.success("Recording started");
    } else {
      toast.success("Recording stopped");
    }
  };

  if (activeView === 'topics') {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Group Discussion Practice</h1>
              <p className="text-gray-600">Join live GD sessions and improve your communication skills</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[#6C3FE8] text-white px-4 py-3 rounded-xl hover:bg-[#5535C5] transition-colors font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Custom GD
            </button>
          </div>

          {/* Default Topics */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Topics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {defaultTopics.map((topic) => (
              <div key={topic.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{topic.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {topic.participants} participants
                      </span>
                      <span className="bg-[#F8F7FF] text-[#6C3FE8] px-2 py-1 rounded text-xs">
                        {topic.category}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>15 mins</span>
                  </div>
                  <button
                    onClick={() => handleJoinDiscussion(topic)}
                    className="bg-[#6C3FE8] text-white px-4 py-2 rounded-lg hover:bg-[#5535C5] transition-colors text-sm font-medium"
                  >
                    Join Discussion
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Custom Rooms Section */}
          {customRooms.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Custom Rooms</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customRooms.map((room) => (
                  <div key={room.id} className="bg-white rounded-xl border border-[#E8E8F0] p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{room.topic}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {room.participants || 0} participants
                          </span>
                          <span className="bg-[#F8F7FF] text-[#6C3FE8] px-2 py-1 rounded text-xs">
                            {room.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>{room.duration} mins</span>
                      </div>
                      <button
                        onClick={() => handleJoinCustomRoom(room)}
                        className="bg-[#6C3FE8] text-white px-4 py-2 rounded-lg hover:bg-[#5535C5] transition-colors text-sm font-medium"
                      >
                        Join Discussion
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Custom GD Room</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Enter your GD topic..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6C3FE8]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setCustomDifficulty(level)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          customDifficulty === level
                            ? 'bg-[#6C3FE8] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map((time) => (
                      <button
                        key={time}
                        onClick={() => setCustomDuration(time)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          customDuration === time
                            ? 'bg-[#6C3FE8] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {time}m
                      </button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={createCustomRoom}
                  disabled={isCreating || !customTopic.trim()}
                  className="w-full bg-[#6C3FE8] text-white py-3 rounded-xl font-medium hover:bg-[#5535C5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Discussion Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#0891B2] to-[#0D9488] p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-1">
                      {selectedTopic?.title || "Group Discussion"}
                    </h2>
                    <div className="flex items-center gap-4 text-cyan-100 text-sm">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {selectedTopic?.participants || 0} participants
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        15 minutes
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveView('topics')}
                    className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    Leave Discussion
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.user === "You" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md ${
                        message.user === "You"
                          ? "bg-cyan-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      } rounded-lg p-3`}
                    >
                      <div className="font-medium text-sm mb-1">{message.user}</div>
                      <div className="text-sm">{message.text}</div>
                      <div className={`text-xs mt-1 ${
                        message.user === "You" ? "text-cyan-100" : "text-gray-500"
                      }`}>
                        {message.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recording Controls */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#6C3FE8]" />
                Voice Recording
              </h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                    isRecording ? "bg-red-100" : "bg-[#F8F7FF]"
                  }`}>
                    <button
                      onClick={toggleRecording}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                        isRecording
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : "bg-[#6C3FE8] hover:bg-[#5535C5] text-white"
                      }`}
                    >
                      {isRecording ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-gray-600">
                    {isRecording ? `Recording: ${formatTime(recordingTime)}` : "Tap to start recording"}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timer Duration</label>
                  <select
                    value={selectedTimer}
                    onChange={(e) => setSelectedTimer(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value={3}>3 minutes</option>
                    <option value={5}>5 minutes</option>
                    <option value={10}>10 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                GD Tips
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Be Clear & Concise</div>
                    <div className="text-xs text-gray-600">Express your thoughts clearly</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#F8F7FF] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-[#6C3FE8] rounded-full"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Listen Actively</div>
                    <div className="text-xs text-gray-600">Pay attention to others</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#F8F7FF] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-[#9B6DFF] rounded-full"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Add Value</div>
                    <div className="text-xs text-gray-600">Contribute meaningfully</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                Your Performance
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Participation</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-cyan-600 h-2 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Clarity</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                    </div>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Content</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: "70%" }}></div>
                    </div>
                    <span className="text-sm font-medium">70%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
