"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Users, MessageSquare, Clock, Target, Zap, Award, TrendingUp, Mic, Square, Play } from "lucide-react";
import toast from "react-hot-toast";

const topics = [
  { id: 1, title: "AI in Education: Boon or Risk?", participants: 18 },
  { id: 2, title: "Remote Work vs Office Culture", participants: 14 },
  { id: 3, title: "Should Coding Be Mandatory for MBAs?", participants: 11 },
  { id: 4, title: "Is Social Media Helping Students?", participants: 16 },
];

const initialMessages = [
  { id: 1, user: "Aarav", text: "I think AI can personalize learning at scale." },
  { id: 2, user: "Nisha", text: "Yes, but we should ensure students still think critically." },
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

  useEffect(() => {
    const saved = sessionStorage.getItem('gd_topic');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTopicData(data);
        setActiveView('practice');
        sessionStorage.removeItem('gd_topic');
      } catch(e) {
        console.error('Parse error:', e);
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

  const joinDiscussion = (topic) => {
    setSelectedTopic(topic);
    setPoints([]);
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { id: Date.now(), user: "You", text: input.trim() }]);
    setInput("");
  };

  const getAIPoints = () => {
    setPoints([
      "Start with a balanced view and define the core problem.",
      "Add one practical example from campus or workplace.",
      "Close with a clear recommendation and expected impact.",
    ]);
  };

  const startRecording = () => {
    setIsRecording(true);
    toast.success("Recording started!");
  };

  const stopRecording = () => {
    setIsRecording(false);
    toast.success("Recording saved!");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (activeView === 'practice' && topicData) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] text-white">
        <div className="max-w-md mx-auto px-6 py-6">
          
          {/* Header */}
          <header className="flex items-center gap-3 mb-6">
            <button 
              onClick={() => setActiveView('topics')}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              <span className="text-xl font-bold">GD Practice</span>
            </div>
          </header>

          {/* Topic Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6">
            <h1 className="text-2xl font-bold mb-3">{topicData.gd_topic}</h1>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold
                ${topicData.difficulty === 'Easy' 
                  ? 'bg-green-500/20 text-green-400'
                  : topicData.difficulty === 'Hard'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'}`}>
                {topicData.difficulty}
              </span>
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {topicData.time_suggested} minutes
              </span>
            </div>
            <p className="text-white/90 text-sm">{topicData.why_relevant}</p>
          </div>

          {/* Background Card */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
            <h3 className="text-blue-300 font-semibold text-sm mb-2">📚 Background Context</h3>
            <p className="text-white text-sm">{topicData.background}</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1">
            {['prepare', 'practice', 'key-points'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-all
                  ${activeTab === tab 
                    ? 'bg-purple-500 text-white' 
                    : 'text-gray-400 hover:text-white'}`}
              >
                {tab === 'prepare' && '📝 Prepare'}
                {tab === 'practice' && '🎤 Practice'}
                {tab === 'key-points' && '💎 Key Points'}
              </button>
            ))}
          </div>

          {/* Prepare Tab */}
          {activeTab === 'prepare' && (
            <div className="space-y-4">
              {/* Pros */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <h3 className="text-green-400 font-bold mb-3">✅ Pros</h3>
                {topicData.pros?.map((pro, i) => (
                  <p key={i} className="text-white text-sm mb-2">• {pro}</p>
                ))}
              </div>

              {/* Cons */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <h3 className="text-red-400 font-bold mb-3">❌ Cons</h3>
                {topicData.cons?.map((con, i) => (
                  <p key={i} className="text-white text-sm mb-2">• {con}</p>
                ))}
              </div>

              {/* Key Facts */}
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4">
                <h3 className="text-gray-300 font-bold mb-3">📊 Key Facts</h3>
                {topicData.key_facts?.map((fact, i) => (
                  <p key={i} className="text-white text-sm mb-2">• {fact}</p>
                ))}
              </div>

              {/* How to Start */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4">
                <h3 className="text-orange-300 font-bold mb-3">🚀 How to Start</h3>
                <p className="text-white text-sm italic">"{topicData.how_to_start}"</p>
              </div>

              {/* Power Phrases */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                <h3 className="text-purple-300 font-bold mb-3">⚡ Power Phrases</h3>
                {topicData.power_phrases?.map((phrase, i) => (
                  <p key={i} className="text-white text-sm mb-2 italic">"{phrase}"</p>
                ))}
              </div>
            </div>
          )}

          {/* Practice Tab */}
          {activeTab === 'practice' && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-4">Your Turn to Speak</h3>
                
                {/* Timer Selection */}
                <div className="flex justify-center gap-2 mb-6">
                  {[2, 5, 10].map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTimer(time)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all
                        ${selectedTimer === time 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                    >
                      {time}min
                    </button>
                  ))}
                </div>

                {/* Recording Interface */}
                <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    {isRecording ? (
                      <Square onClick={stopRecording} className="w-10 h-10 text-red-500 cursor-pointer" />
                    ) : (
                      <Mic onClick={startRecording} className="w-10 h-10 text-purple-400 cursor-pointer hover:text-purple-300" />
                    )}
                  </div>
                  
                  {isRecording && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400 mb-2">{formatTime(recordingTime)}</p>
                      <p className="text-gray-400">Recording... Tap to stop</p>
                    </div>
                  )}
                  
                  {!isRecording && (
                    <div className="text-center">
                      <p className="text-gray-400 mb-4">Tap microphone to start</p>
                      <button 
                        onClick={startRecording}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
                      >
                        Start Recording
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Key Points Tab */}
          {activeTab === 'key-points' && (
            <div className="space-y-4">
              {/* Example Argument */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <h3 className="text-blue-300 font-bold mb-3">💬 Example Argument</h3>
                <p className="text-white text-sm italic">"{topicData.example_argument}"</p>
              </div>

              {/* Counter Argument */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                <h3 className="text-red-300 font-bold mb-3">🔄 Counter Argument</h3>
                <p className="text-white text-sm italic">"{topicData.counter_argument}"</p>
              </div>

              {/* Conclusion */}
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <h3 className="text-green-300 font-bold mb-3">🎯 Conclusion</h3>
                <p className="text-white text-sm italic">"{topicData.conclusion_line}"</p>
              </div>

              {/* Interview Connection */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                <h3 className="text-purple-300 font-bold mb-3">💼 Interview Connection</h3>
                <p className="text-white text-sm">{topicData.interview_connection}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original topics view
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-md mx-auto px-6 py-6">
        
        {/* Header */}
        <header className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => window.history.back()}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" />
            <span className="text-xl font-bold">GD Practice</span>
          </div>
        </header>

        {!selectedTopic ? (
          <>
            {/* Topics List */}
            <div className="space-y-3 mb-6">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => joinDiscussion(topic)}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{topic.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>{topic.participants} participants</span>
                      </div>
                    </div>
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0F]/90 backdrop-blur-xl border-t border-white/10">
              <div className="max-w-md mx-auto px-6 py-3">
                <div className="grid grid-cols-5 gap-4">
                  <a href="/dashboard" className="flex flex-col items-center gap-1 text-gray-400">
                    <Users className="w-5 h-5" />
                    <span className="text-xs">Home</span>
                  </a>
                  <a href="/interview" className="flex flex-col items-center gap-1 text-gray-400">
                    <Mic className="w-5 h-5" />
                    <span className="text-xs">Interview</span>
                  </a>
                  <a href="/pulse" className="flex flex-col items-center gap-1 text-purple-400">
                    <Zap className="w-5 h-5" />
                    <span className="text-xs">Pulse</span>
                  </a>
                  <a href="/gd" className="flex flex-col items-center gap-1 text-purple-400">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-xs">GD</span>
                  </a>
                  <a href="/profile" className="flex flex-col items-center gap-1 text-gray-400">
                    <Target className="w-5 h-5" />
                    <span className="text-xs">Profile</span>
                  </a>
                </div>
              </div>
            </nav>
          </>
        ) : (
          <>
            {/* Discussion View */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mb-4">
              <h3 className="text-lg font-semibold text-white mb-2">{selectedTopic.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                <Users className="w-4 h-4" />
                <span>{selectedTopic.participants} participants</span>
              </div>

              {/* Messages */}
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.user === "You" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] ${message.user === "You" ? "bg-purple-500 text-white" : "bg-white/20 text-white"} rounded-2xl px-4 py-2`}>
                      <p className="text-xs font-semibold mb-1">{message.user}</p>
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-xl transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* AI Suggestions */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-4 mb-4">
              <h3 className="text-white font-semibold mb-2">💡 AI Suggestions</h3>
              {points.length > 0 ? (
                <ul className="space-y-1 text-white text-sm">
                  {points.map((point, index) => (
                    <li key={index}>• {point}</li>
                  ))}
                </ul>
              ) : (
                <button
                  onClick={getAIPoints}
                  className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold py-2 rounded-xl transition-colors"
                >
                  Get AI Points
                </button>
              )}
            </div>

            {/* Back Button */}
            <button
              onClick={() => setSelectedTopic(null)}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Back to Topics
            </button>
          </>
        )}
      </div>
    </div>
  );
}
