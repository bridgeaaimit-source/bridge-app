"use client";

import { useMemo, useState } from "react";

const tabs = ["All", "TCS", "Infosys", "Wipro", "Accenture"];

const mockExperiences = [
  {
    id: 1,
    company: "TCS",
    role: "Assistant System Engineer",
    roundType: "Technical",
    difficulty: "Medium",
    helpful: 21,
    questions: [
      "Explain OOP principles with examples.",
      "Difference between REST and SOAP APIs?",
      "How would you optimize SQL query performance?",
    ],
  },
  {
    id: 2,
    company: "Infosys",
    role: "Systems Engineer",
    roundType: "HR",
    difficulty: "Easy",
    helpful: 13,
    questions: [
      "Tell me about yourself.",
      "Why Infosys?",
      "How do you handle feedback from seniors?",
    ],
  },
  {
    id: 3,
    company: "Wipro",
    role: "Project Engineer",
    roundType: "GD",
    difficulty: "Hard",
    helpful: 28,
    questions: [
      "GD topic: AI replacing jobs.",
      "How do you convince a teammate in disagreement?",
    ],
  },
  {
    id: 4,
    company: "Accenture",
    role: "Associate Software Engineer",
    roundType: "Technical",
    difficulty: "Medium",
    helpful: 17,
    questions: [
      "Difference between stack and queue.",
      "What is normalization in DBMS?",
      "Explain one challenging project from college.",
    ],
  },
  {
    id: 5,
    company: "Capgemini",
    role: "Analyst",
    roundType: "HR",
    difficulty: "Easy",
    helpful: 9,
    questions: [
      "Walk me through your resume.",
      "How do you prioritize tasks under deadlines?",
    ],
  },
];

function badgeStyle(difficulty) {
  if (difficulty === "Easy") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (difficulty === "Hard") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function PulsePage() {
  const [activeTab, setActiveTab] = useState("All");
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState(mockExperiences);
  const [form, setForm] = useState({
    company: "",
    role: "",
    roundType: "HR",
    questions: "",
    difficulty: "Medium",
  });

  const filteredItems = useMemo(() => {
    if (activeTab === "All") return items;
    return items.filter((item) => item.company === activeTab);
  }, [activeTab, items]);

  const submitExperience = () => {
    if (!form.company.trim() || !form.role.trim() || !form.questions.trim()) return;

    const newItem = {
      id: Date.now(),
      company: form.company.trim(),
      role: form.role.trim(),
      roundType: form.roundType,
      difficulty: form.difficulty,
      helpful: 0,
      questions: form.questions
        .split("\n")
        .map((q) => q.trim())
        .filter(Boolean)
        .slice(0, 5),
    };

    setItems((prev) => [newItem, ...prev]);
    setForm({
      company: "",
      role: "",
      roundType: "HR",
      questions: "",
      difficulty: "Medium",
    });
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-4 text-slate-900">
      <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="flex items-center justify-between px-4 pb-2 pt-5">
          <h1 className="text-xl font-black tracking-tight text-[#2B5CE6]">PULSE 🔥</h1>
          <button className="rounded-xl border border-slate-200 p-2 text-slate-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M7 12h10M10 18h4" />
            </svg>
          </button>
        </header>

        <main className="px-4 pb-24">
          <section className="rounded-xl border border-[#FF6B35]/20 bg-[#FFF5F1] p-3">
            <p className="text-xs font-semibold text-[#FF6B35]">
              🤖 AI Insight: TCS is focusing on communication skills this week based on 12 recent experiences
            </p>
          </section>

          <section className="mt-3 rounded-xl border border-slate-200 bg-[#EEF3FF] p-3">
            <p className="text-sm font-semibold text-[#2B5CE6]">
              3 students shared TCS experiences today
            </p>
          </section>

          <section className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  activeTab === tab
                    ? "border-[#2B5CE6] bg-[#EEF3FF] text-[#2B5CE6]"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </section>

          <section className="mt-4 space-y-3">
            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEF3FF] text-xs font-bold text-[#2B5CE6]">
                      {item.company.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.company}</p>
                      <p className="text-xs text-slate-500">{item.role}</p>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${badgeStyle(item.difficulty)}`}>
                    {item.difficulty}
                  </span>
                </div>

                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Questions Asked
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {item.questions.slice(0, 3).map((q, idx) => (
                    <li key={`${item.id}-${idx}`}>{q}</li>
                  ))}
                </ul>

                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {item.roundType} Round
                  </span>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
                      👍 Helpful ({item.helpful})
                    </button>
                    <button className="rounded-lg bg-[#2B5CE6] px-2 py-1 text-xs font-semibold text-white">
                      Read More
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        </main>

        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-[#2B5CE6] text-2xl text-white shadow-[0_10px_24px_rgba(43,92,230,0.35)]"
        >
          +
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-30 bg-slate-900/40">
            <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[390px] rounded-t-3xl bg-white p-4">
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-slate-200" />
              <h2 className="text-base font-bold text-slate-900">Add Experience</h2>

              <div className="mt-3 space-y-3">
                <input
                  value={form.company}
                  onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
                  placeholder="Company name"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
                />
                <input
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  placeholder="Role"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
                />
                <select
                  value={form.roundType}
                  onChange={(e) => setForm((prev) => ({ ...prev, roundType: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
                >
                  <option>HR</option>
                  <option>Technical</option>
                  <option>GD</option>
                </select>
                <textarea
                  value={form.questions}
                  onChange={(e) => setForm((prev) => ({ ...prev, questions: e.target.value }))}
                  placeholder="Questions asked (one per line)"
                  className="min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
                />
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#2B5CE6]"
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitExperience}
                    className="w-full rounded-xl bg-[#2B5CE6] px-3 py-2 text-sm font-semibold text-white"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
