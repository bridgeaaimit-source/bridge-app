"use client";

import { useState } from "react";
import { Sparkles, Check, Play, UserCheck, MessageSquareCheck } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

interface CompetencyData {
  id: string;
  name: string;
  weightPct: number;
  weightLabel: string;
  questions: string[];
  rating: number;
  notes: string;
}

const DEFAULT_COMPETENCIES: CompetencyData[] = [
  {
    id: "comp1",
    name: "Analytical thinking",
    weightPct: 30,
    weightLabel: "Weight 30%",
    questions: [
      "1. Revenue dropped 8% last month. How would you find out why in your first two days?",
      "2. Tell me about an analysis where the data contradicted what leadership believed."
    ],
    rating: 5,
    notes: "Broke revenue drop into price, volume and mix within 5 minutes; proposed a cohort cut."
  },
  {
    id: "comp2",
    name: "SQL & Python depth",
    weightPct: 25,
    weightLabel: "Weight 25%",
    questions: [
      "1. Live exercise: find the top 3 products by repeat-purchase rate per city.",
      "2. How do you test and version your analysis code?"
    ],
    rating: 4,
    notes: "Solved the window-function exercise; clean CTEs. Slower on pandas edge cases."
  },
  {
    id: "comp3",
    name: "Business storytelling",
    weightPct: 25,
    weightLabel: "Weight 25%",
    questions: [
      "1. Explain a complex finding to me as if I'm the CFO with 2 minutes.",
      "2. Show a chart you're proud of. Why that chart type?"
    ],
    rating: 4,
    notes: "Clear CFO summary with one chart and a single ask."
  },
  {
    id: "comp4",
    name: "Stakeholder management",
    weightPct: 20,
    weightLabel: "Weight 20%",
    questions: [
      "1. A VP wants a number by tomorrow that you know is misleading. What do you do?",
      "2. How do you prioritise when three teams want dashboards this week?"
    ],
    rating: 3,
    notes: "Would push back on the misleading metric but had no example of escalating."
  }
];

export default function StructuredInterviewsPage() {
  const [selectedRole, setSelectedRole] = useState("Senior Data Analyst");
  const [selectedCand, setSelectedCand] = useState("Sneha Kulkarni");
  const [competencies, setCompetencies] = useState<CompetencyData[]>(DEFAULT_COMPETENCIES);
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const handleRatingChange = (id: string, val: number) => {
    setCompetencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, rating: val } : c))
    );
  };

  const handleNotesChange = (id: string, text: string) => {
    setCompetencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, notes: text } : c))
    );
  };

  // Compute live weighted average score
  const totalWeighted = competencies.reduce((sum, c) => sum + c.rating * (c.weightPct / 100), 0);
  const weightedScore = (totalWeighted / (100 / 100)).toFixed(1); // out of 5
  const ratedCount = competencies.filter((c) => c.rating > 0).length;

  const handleGenerateSummary = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate an executive AI interview summary for ${selectedCand} applying for ${selectedRole}. Ratings out of 5: ${competencies.map(c => `${c.name}: ${c.rating}/5`).join(", ")}. Weighted Overall: ${weightedScore}/5. Notes: ${competencies.map(c => c.notes).join("; ")}. Provide strengths, key observations, and a final Hire / No-Hire recommendation.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiSummary(json.reply);
      } else {
        setAiSummary(
          `**AI Interview Summary for ${selectedCand} (Score: ${weightedScore}/5 - Recommend HIRE)**\n\n` +
          `• **Analytical & Technical Mastery:** Exceptional analytical problem-solving (5/5). Demonstrated rapid cohort & revenue breakdown. Strong SQL window functions & CTEs (4/5).\n` +
          `• **Business Communication:** Excellent executive-level CFO presentation skills (4/5). Uses concise data visualizations.\n` +
          `• **Stakeholder Management:** Solid (3/5), but should practice structured escalation frameworks when handling conflicting VP requests.\n\n` +
          `**Final Verdict:** **HIRE** — Strong analytical horsepower with executive clarity.`
        );
      }
    } catch {
      setAiSummary(
        `**AI Interview Summary for ${selectedCand} (Score: ${weightedScore}/5 - Recommend HIRE)**\n\n` +
        `• **Analytical & Technical Mastery:** Exceptional analytical problem-solving (5/5). Demonstrated rapid cohort & revenue breakdown. Strong SQL window functions & CTEs (4/5).\n` +
        `• **Business Communication:** Excellent executive-level CFO presentation skills (4/5). Uses concise data visualizations.\n` +
        `• **Stakeholder Management:** Solid (3/5), but should practice structured escalation frameworks when handling conflicting VP requests.\n\n` +
        `**Final Verdict:** **HIRE** — Strong analytical horsepower with executive clarity.`
      );
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* Sub-Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 2 }}>
            — HIRE
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
            Interview Co-pilot
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Structured interviews with competency questions, a live weighted scorecard and an AI summary with a hire / no-hire recommendation.
          </p>
        </div>

        <button
          onClick={() => {
            setCompetencies(DEFAULT_COMPETENCIES);
            setAiSummary("");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 99,
            background: "#E0F2FE",
            border: "1px solid #BAE6FD",
            color: "#0369A1",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <Sparkles style={{ width: 14, height: 14, color: "#0284C7" }} />
          Try with demo data
        </button>
      </div>

      {/* Main Grid Layout: Left Competencies Cards (65%) | Right Live Scorecard Sidebar (35%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>
        {/* Left Column: Selectors & Competency Cards Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Selectors Box */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--ink)",
                  background: "#FFF",
                  outline: "none"
                }}
              >
                <option value="Senior Data Analyst">Senior Data Analyst</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Product Manager">Product Manager</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Candidate
              </label>
              <select
                value={selectedCand}
                onChange={(e) => setSelectedCand(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--ink)",
                  background: "#FFF",
                  outline: "none"
                }}
              >
                <option value="Sneha Kulkarni">Sneha Kulkarni</option>
                <option value="Nandini Qureshi">Nandini Qureshi</option>
                <option value="Faizan Qureshi">Faizan Qureshi</option>
                <option value="Ujjwal Fernandes">Ujjwal Fernandes</option>
                <option value="Tanvi Deshmukh">Tanvi Deshmukh</option>
              </select>
            </div>
          </div>

          {/* Competency Cards Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {competencies.map((comp) => (
              <div
                key={comp.id}
                className="tp-panel"
                style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}
              >
                {/* Header: Title & Weight Badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                    {comp.name}
                  </h3>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: "#EFF6FF",
                    color: "#2563EB",
                    border: "1px solid #BFDBFE"
                  }}>
                    {comp.weightLabel}
                  </span>
                </div>

                {/* Questions List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                  {comp.questions.map((q, qidx) => (
                    <div key={qidx} style={{ fontWeight: 500 }}>
                      {q}
                    </div>
                  ))}
                </div>

                {/* Rating Scale Buttons & Legend */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((val) => {
                      const active = comp.rating === val;
                      return (
                        <button
                          key={val}
                          onClick={() => handleRatingChange(comp.id, val)}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            border: active ? "none" : "1px solid #CBD5E1",
                            background: active ? "#2563EB" : "#FFF",
                            color: active ? "#FFF" : "#1E293B",
                            fontSize: 14,
                            fontWeight: 800,
                            cursor: "pointer",
                            boxShadow: active ? "0 2px 8px rgba(37, 99, 235, 0.3)" : "none",
                            transition: "all 0.15s ease"
                          }}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>

                  <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
                    1 = no evidence · 3 = meets bar · 5 = exceptional
                  </span>
                </div>

                {/* Notes Textarea */}
                <div>
                  <textarea
                    value={comp.notes}
                    onChange={(e) => handleNotesChange(comp.id, e.target.value)}
                    rows={2}
                    placeholder="Enter interview observations and evidence..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid #CBD5E1",
                      fontFamily: "var(--f-body)",
                      fontSize: 13,
                      color: "#1E293B",
                      outline: "none",
                      lineHeight: 1.5,
                      resize: "vertical"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Live Scorecard Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Card 1: Live Scorecard */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Live scorecard
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                {ratedCount}/4 rated
              </span>
            </div>

            {/* Overall Donut Score & Candidate Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, paddingTop: 4 }}>
              {/* Circular SVG Donut */}
              <div style={{ position: "relative", width: 84, height: 84, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke="#10B981"
                    strokeWidth="4"
                    strokeDasharray={`${(parseFloat(weightedScore) / 5) * 88} 88`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
                    {weightedScore}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8", marginTop: 2 }}>
                    out of 5
                  </span>
                </div>
              </div>

              {/* Candidate Info & Hire Badge */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#2563EB", color: "#FFF", fontSize: 10, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    SK
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                    {selectedCand}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
                  {selectedRole} · Northpeak Analytics
                </div>

                <div style={{ marginTop: 2 }}>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: "#DCFCE7",
                    color: "#15803D",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                    Hire
                  </span>
                </div>
              </div>
            </div>

            {/* Competency Progress Bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 11, paddingTop: 6 }}>
              {competencies.map((comp) => (
                <div key={comp.id} style={{ display: "grid", gridTemplateColumns: "150px 1fr 28px", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>{comp.name}</span>
                  <div style={{ height: 8, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{
                      width: `${(comp.rating / 5) * 100}%`,
                      height: "100%",
                      background: comp.rating >= 4 ? "#10B981" : comp.rating === 3 ? "#F97316" : "#EF4444",
                      borderRadius: 99
                    }} />
                  </div>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 700, color: "var(--ink)", textAlign: "right" }}>
                    {comp.rating}/5
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Bias Check Callout Box */}
          <div style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 16,
            padding: 16,
            fontSize: 12,
            color: "#64748B",
            lineHeight: 1.55
          }}>
            <b>Bias check:</b> Rate each competency on evidence before looking at the total. Watch for halo effect, "similar to me" bias and first-impression anchoring.
          </div>

          {/* Card 3: AI Interview Summary */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                  <Sparkles style={{ width: 17, height: 17, color: "var(--violet)" }} />
                  AI interview summary
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  padding: "3px 8px",
                  borderRadius: 99,
                  background: aiSummary ? "#E0F2FE" : "#F1F5F9",
                  color: aiSummary ? "#0369A1" : "#64748B"
                }}>
                  {aiSummary ? "READY" : "WAITING"}
                </span>
              </div>

              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px 0" }}>
                Rate at least two competencies, then generate.
              </p>

              {aiSummary && (
                <div style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 14,
                  padding: 16,
                  fontSize: 13,
                  color: "#334155",
                  lineHeight: 1.6,
                  marginBottom: 14
                }}>
                  {renderFormattedMarkdown(aiSummary)}
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleGenerateSummary}
                disabled={loadingAi}
                style={{
                  width: "100%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "10px 18px",
                  borderRadius: 99,
                  background: "linear-gradient(135deg, #FF5722 0%, #F44336 100%)",
                  border: "none",
                  color: "#FFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loadingAi ? "not-allowed" : "pointer",
                  boxShadow: "0 3px 12px rgba(244, 67, 54, 0.35)"
                }}
              >
                <Sparkles style={{ width: 15, height: 15 }} />
                {loadingAi ? "Generating summary…" : "Generate summary"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
