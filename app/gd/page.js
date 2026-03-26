"use client";

import { useState } from "react";
import { ChevronLeft, Users, MessageSquare } from "lucide-react";
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
            <h1 className="text-2xl font-bold">GD Battle</h1>
          </div>
        </header>

        <main className="space-y-4">
          {!selectedTopic && (
            <section className="space-y-3">
              {topics.map((topic) => (
                <article
                  key={topic.id}
                  className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm p-4"
                >
                  <p className="text-sm font-semibold text-white">{topic.title}</p>
                  <p className="mt-1 text-xs text-gray-400">{topic.participants} participants active</p>
                  <button
                    onClick={() => joinDiscussion(topic)}
                    className="mt-3 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition-colors"
                  >
                    Join Discussion
                  </button>
                </article>
              ))}
            </section>
          )}

          {selectedTopic && (
            <section className="space-y-3">
              <div className="rounded-2xl bg-gradient-to-br from-[#2B5CE6] to-[#1E3FA8] p-4 text-white">
                <p className="text-xs text-blue-100">Live Topic</p>
                <p className="mt-1 text-sm font-semibold">{selectedTopic.title}</p>
              </div>

              <div className="max-h-60 space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="rounded-xl bg-slate-50 p-2">
                    <p className="text-xs font-semibold text-slate-600">{msg.user}</p>
                    <p className="text-sm text-slate-800">{msg.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your point..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
                />
                <button
                  onClick={sendMessage}
                  className="rounded-xl bg-[#2B5CE6] px-4 py-2 text-sm font-semibold text-white"
                >
                  Send
                </button>
              </div>

              <button
                onClick={getAIPoints}
                className="w-full rounded-xl border border-[#FF6B35] bg-[#FFF5F1] px-4 py-2 text-sm font-semibold text-[#FF6B35]"
              >
                Get AI Points
              </button>

              {points.length > 0 && (
                <div className="rounded-2xl border border-[#FF6B35]/20 bg-[#FFF5F1] p-3">
                  <p className="text-sm font-bold text-[#FF6B35]">Suggested Talking Points</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
