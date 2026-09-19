"use client";

import { useState } from "react";
import { Sparkles, Check, ArrowRight, AlertTriangle, FileText, UserCheck } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

const CANDIDATES_DATA: Record<string, any> = {
  "c_tanvi": {
    id: "c_tanvi",
    name: "Tanvi Deshmukh",
    fitScore: 74,
    fitLabel: "Strong fit",
    avatar: "TD",
    title: "Analytics Consultant",
    company: "Cobalt Ridge Consulting",
    exp: "6.2 yrs",
    city: "Mumbai",
    source: "LinkedIn",
    curCtc: "18.0",
    expcCtc: "26.0",
    notice: "60 days",
    mbti: "ENTJ",
    fitBreakdown: [
      { label: "Skills (40%)", value: 64, color: "#F97316" },
      { label: "Experience (20%)", value: 100, color: "#10B981" },
      { label: "Culture add (15%)", value: 74, color: "#2563EB" },
      { label: "Retention (15%)", value: 49, color: "#EF4444" },
      { label: "Personality (10%)", value: 100, color: "#10B981" },
    ],
    skillsHas: ["SQL", "Python", "Power BI", "Storytelling"],
    skillsMissing: ["Statistics"],
    skillsOptional: ["A/B Testing", "dbt", "Tableau"],
    retentionPrediction: "unlikely (49/100)",
    redFlags: [
      {
        type: "warn",
        title: "Career gap of 8 months",
        desc: "Ask neutrally — could be study, caregiving or health. Not a rejection reason on its own."
      },
      {
        type: "danger",
        title: "Overlapping employment: Cobalt Ridge Consulting & Monsoon Media",
        desc: "About 4 months overlap. Verify with relieving letters / background check."
      },
      {
        type: "warn",
        title: "3 job changes in ~6 yrs",
        desc: "Average tenure 1.6 yrs. Probe reasons for each move."
      }
    ],
    questions: [
      {
        tag: "Gap · Statistics",
        q: "An A/B test shows +4% conversion with p = 0.06. What do you tell the product manager?"
      },
      {
        tag: "Depth · SQL",
        q: "Write the query you'd use to find customers whose spend dropped more than 30% month-on-month. How would you make it fast on 50M rows?"
      },
      {
        tag: "Depth · Python",
        q: "Tell me about a Python script or notebook that saved your team real time. What would you refactor today?"
      },
      {
        tag: "Red flag",
        q: "Tell me about the time between your last two roles. What did you focus on?"
      },
      {
        tag: "Red flag",
        q: "Your CV shows Cobalt Ridge Consulting & Monsoon Media at the same time. Can you walk me through that period?"
      }
    ]
  },
  "c_sneha": {
    id: "c_sneha",
    name: "Sneha Kulkarni",
    fitScore: 91,
    fitLabel: "Exceptional fit",
    avatar: "SK",
    title: "Senior Data Analyst",
    company: "Northpeak Analytics",
    exp: "5.5 yrs",
    city: "Pune",
    source: "LinkedIn",
    curCtc: "15.3",
    expcCtc: "22.0",
    notice: "90 days",
    mbti: "INTJ",
    fitBreakdown: [
      { label: "Skills (40%)", value: 95, color: "#10B981" },
      { label: "Experience (20%)", value: 90, color: "#10B981" },
      { label: "Culture add (15%)", value: 88, color: "#2563EB" },
      { label: "Retention (15%)", value: 72, color: "#F59E0B" },
      { label: "Personality (10%)", value: 98, color: "#10B981" },
    ],
    skillsHas: ["SQL", "Python", "Power BI", "Statistics", "Storytelling"],
    skillsMissing: [],
    skillsOptional: ["dbt", "Tableau"],
    retentionPrediction: "likely (72/100)",
    redFlags: [
      {
        type: "warn",
        title: "High competing offer risk",
        desc: "Candidate has 2 other active offers. Notice period buyout needed."
      }
    ],
    questions: [
      {
        tag: "System Design",
        q: "How would you architect a real-time analytics pipeline for 10M daily events?"
      },
      {
        tag: "Retention & Buyout",
        q: "What factors would make you accept our offer over competing offers?"
      }
    ]
  },
  "c_nandini": {
    id: "c_nandini",
    name: "Nandini Qureshi",
    fitScore: 90,
    fitLabel: "Exceptional fit",
    avatar: "NQ",
    title: "Senior Data Analyst",
    company: "Saffron Retail Tech",
    exp: "6.4 yrs",
    city: "Pune",
    source: "LinkedIn",
    curCtc: "18.3",
    expcCtc: "27.5",
    notice: "90 days",
    mbti: "ENTJ",
    fitBreakdown: [
      { label: "Skills (40%)", value: 92, color: "#10B981" },
      { label: "Experience (20%)", value: 95, color: "#10B981" },
      { label: "Culture add (15%)", value: 85, color: "#2563EB" },
      { label: "Retention (15%)", value: 78, color: "#10B981" },
      { label: "Personality (10%)", value: 95, color: "#10B981" },
    ],
    skillsHas: ["SQL", "Python", "Power BI", "Statistics", "Storytelling"],
    skillsMissing: [],
    skillsOptional: ["dbt"],
    retentionPrediction: "likely (78/100)",
    redFlags: [],
    questions: [
      {
        tag: "Leadership",
        q: "Tell us about a time you led cross-departmental data initiatives."
      }
    ]
  },
  "c_tanvijoshi": {
    id: "c_tanvijoshi",
    name: "Tanvi Joshi",
    fitScore: 87,
    fitLabel: "Strong fit",
    avatar: "TJ",
    title: "Data Specialist",
    company: "Acme Data",
    exp: "5.0 yrs",
    city: "Bengaluru",
    source: "Naukri",
    curCtc: "14.5",
    expcCtc: "20.0",
    notice: "30 days",
    mbti: "INFJ",
    fitBreakdown: [
      { label: "Skills (40%)", value: 88, color: "#10B981" },
      { label: "Experience (20%)", value: 85, color: "#10B981" },
      { label: "Culture add (15%)", value: 90, color: "#2563EB" },
      { label: "Retention (15%)", value: 82, color: "#10B981" },
      { label: "Personality (10%)", value: 90, color: "#10B981" },
    ],
    skillsHas: ["SQL", "Python", "Power BI"],
    skillsMissing: ["Statistics"],
    skillsOptional: ["Tableau"],
    retentionPrediction: "very likely (82/100)",
    redFlags: [],
    questions: [
      {
        tag: "SQL & Indexing",
        q: "How do you optimize slow query execution plans in PostgreSQL?"
      }
    ]
  },
  "c_faizan": {
    id: "c_faizan",
    name: "Faizan Qureshi",
    fitScore: 78,
    fitLabel: "Moderate fit",
    avatar: "FQ",
    title: "Data Analyst",
    company: "Kestrel Payments",
    exp: "4.2 yrs",
    city: "Bengaluru",
    source: "Naukri",
    curCtc: "13.5",
    expcCtc: "19.0",
    notice: "30 days",
    mbti: "ISTJ",
    fitBreakdown: [
      { label: "Skills (40%)", value: 75, color: "#2563EB" },
      { label: "Experience (20%)", value: 80, color: "#2563EB" },
      { label: "Culture add (15%)", value: 82, color: "#2563EB" },
      { label: "Retention (15%)", value: 75, color: "#10B981" },
      { label: "Personality (10%)", value: 85, color: "#10B981" },
    ],
    skillsHas: ["SQL", "Python", "Power BI"],
    skillsMissing: ["Statistics"],
    skillsOptional: ["Storytelling"],
    retentionPrediction: "likely (75/100)",
    redFlags: [],
    questions: [
      {
        tag: "Data Modeling",
        q: "Walk us through your approach to star-schema database design."
      }
    ]
  },
  "c_ujjwal": {
    id: "c_ujjwal",
    name: "Ujjwal Fernandes",
    fitScore: 77,
    fitLabel: "Moderate fit",
    avatar: "UF",
    title: "Business Analyst",
    company: "Lumen Edge Systems",
    exp: "6.9 yrs",
    city: "Bengaluru",
    source: "LinkedIn",
    curCtc: "16.1",
    expcCtc: "19.6",
    notice: "30 days",
    mbti: "INTP",
    fitBreakdown: [
      { label: "Skills (40%)", value: 74, color: "#2563EB" },
      { label: "Experience (20%)", value: 88, color: "#10B981" },
      { label: "Culture add (15%)", value: 75, color: "#2563EB" },
      { label: "Retention (15%)", value: 68, color: "#F59E0B" },
      { label: "Personality (10%)", value: 85, color: "#10B981" },
    ],
    skillsHas: ["Python", "SQL", "Power BI"],
    skillsMissing: ["Statistics"],
    skillsOptional: ["dbt"],
    retentionPrediction: "neutral (68/100)",
    redFlags: [],
    questions: [
      {
        tag: "Stakeholder Management",
        q: "How do you handle conflicting business requirements from product and sales leads?"
      }
    ]
  }
};

const LEADERBOARD_LIST = [
  { id: "c_sneha", name: "Sneha Kulkarni", avatar: "SK", score: 91, color: "#10B981" },
  { id: "c_nandini", name: "Nandini Qureshi", avatar: "NQ", score: 90, color: "#10B981" },
  { id: "c_tanvijoshi", name: "Tanvi Joshi", avatar: "TJ", score: 87, color: "#10B981" },
  { id: "c_faizan", name: "Faizan Qureshi", avatar: "FQ", score: 78, color: "#2563EB" },
  { id: "c_ujjwal", name: "Ujjwal Fernandes", avatar: "UF", score: 77, color: "#2563EB" },
  { id: "c_tanvi", name: "Tanvi Deshmukh", avatar: "TD", score: 74, color: "#2563EB" },
];

export default function JobFitPage() {
  const [selectedRole, setSelectedRole] = useState("Senior Data Analyst");
  const [selectedCandId, setSelectedCandId] = useState("c_tanvi");
  const [sourceTab, setSourceTab] = useState("pool");
  const [aiAssessment, setAiAssessment] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const activeCand = CANDIDATES_DATA[selectedCandId] || CANDIDATES_DATA["c_tanvi"];

  const handleDeeperAssessment = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a comprehensive hiring assessment for ${activeCand.name} applying for ${selectedRole}. Summarize key strengths, red flag risks (career gaps/overlaps), and give a clear recommendation.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiAssessment(json.reply);
      }
    } catch {
      setAiAssessment(`**AI Hiring Recommendation for ${activeCand.name}:**\n\n- **Strengths:** Strong experience (${activeCand.exp}) with deep mastery of SQL, Python & Power BI.\n- **Risks:** 8-month career gap & overlapping employment require verification.\n- **Recommendation:** Proceed to technical interview round; conduct reference checks.`);
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
            Candidate Fit
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Person–job fit in one view: skills, experience, personality, culture and retention outlook, plus resume red flags and interview questions aimed at the gaps.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedCandId("c_tanvi");
            setAiAssessment("");
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

      {/* Main Grid: Left Selectors & Leaderboard (35%) | Right Deep Fit Analysis (65%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 20 }}>
        {/* Left Column: Role Selector & Leaderboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Role & Candidate Selectors Panel */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
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

            {/* Source Tabs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#F1F5F9", padding: 3, borderRadius: 10 }}>
              <button
                onClick={() => setSourceTab("pool")}
                style={{
                  padding: "6px 0",
                  borderRadius: 8,
                  border: "none",
                  background: sourceTab === "pool" ? "#FFF" : "transparent",
                  color: sourceTab === "pool" ? "var(--ink)" : "#64748B",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: sourceTab === "pool" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                From talent pool
              </button>

              <button
                onClick={() => setSourceTab("paste")}
                style={{
                  padding: "6px 0",
                  borderRadius: 8,
                  border: "none",
                  background: sourceTab === "paste" ? "#FFF" : "transparent",
                  color: sourceTab === "paste" ? "var(--ink)" : "#64748B",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: sourceTab === "paste" ? "0 1px 3px rgba(0,0,0,0.1)" : "none"
                }}
              >
                Paste a resume
              </button>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Candidate
              </label>
              <select
                value={selectedCandId}
                onChange={(e) => setSelectedCandId(e.target.value)}
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
                {LEADERBOARD_LIST.map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    {cand.name} · {cand.score}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leaderboard Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Leaderboard
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                {selectedRole}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {LEADERBOARD_LIST.map((item, idx) => {
                const isActive = item.id === selectedCandId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedCandId(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: isActive ? "#EFF6FF" : "#FFF",
                      border: isActive ? "1.5px solid #2563EB" : "1px solid var(--line)",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", width: 12 }}>
                        {idx + 1}
                      </span>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: isActive ? "#2563EB" : "#3B82F6",
                        color: "#FFF",
                        fontSize: 11,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {item.avatar}
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: isActive ? 800 : 600, color: "var(--ink)" }}>
                        {item.name}
                      </span>
                    </div>

                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 14, fontWeight: 800, color: item.color }}>
                      {item.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Deep Fit Analysis */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Candidate Profile Summary Header Card */}
          <div className="tp-panel" style={{
            borderRadius: 20,
            padding: 24,
            display: "grid",
            gridTemplateColumns: "100px 1fr",
            alignItems: "center",
            gap: 20
          }}>
            {/* Left Circular Donut Ring */}
            <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="3.8" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke={activeCand.fitScore >= 85 ? "#10B981" : "#2563EB"}
                  strokeWidth="3.8"
                  strokeDasharray={`${(activeCand.fitScore / 100) * 88} 88`}
                  strokeDashoffset="0"
                />
              </svg>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>
                  {activeCand.fitScore}
                </span>
                <span style={{ fontSize: 9, fontWeight: 600, color: "#94A3B8", marginTop: 2 }}>
                  fit score
                </span>
              </div>
            </div>

            {/* Right Candidate Meta Info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                    {activeCand.name}
                  </h2>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: "#EFF6FF",
                    color: "#2563EB",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2563EB" }} />
                    {activeCand.fitLabel}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => alert(`Building formal offer package for ${activeCand.name}...`)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 99,
                      background: "#2563EB",
                      border: "none",
                      color: "#FFF",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Build offer <ArrowRight style={{ width: 14, height: 14 }} />
                  </button>

                  <button
                    onClick={() => alert(`Opening structured interview kit for ${activeCand.name}...`)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 99,
                      background: "#FFF",
                      border: "1px solid #CBD5E1",
                      color: "#1E293B",
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Interview kit
                  </button>
                </div>
              </div>

              <div style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
                {activeCand.title} at {activeCand.company} · {activeCand.exp} · {activeCand.city}{" "}
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: "#EFF6FF", color: "#2563EB" }}>
                  {activeCand.source}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12.5, color: "#64748B", fontWeight: 500 }}>
                <span>CTC <b>₹{activeCand.curCtc} L</b> → <b>₹{activeCand.expcCtc} L</b></span>
                <span>Notice <b>{activeCand.notice}</b></span>
                <span>MBTI <b>{activeCand.mbti}</b></span>
              </div>
            </div>
          </div>

          {/* Fit Breakdown & Skills Match Grid Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Left Card: Fit Breakdown */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                  Fit breakdown
                </h3>
                <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                  Weighted
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {activeCand.fitBreakdown.map((item: any) => (
                  <div key={item.label} style={{ display: "grid", gridTemplateColumns: "140px 1fr 30px", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>{item.label}</span>
                    <div style={{ height: 8, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${item.value}%`, height: "100%", background: item.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 700, color: "var(--ink)", textAlign: "right" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card: Skills Match */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                    Skills match
                  </h3>
                  <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                    {activeCand.skillsHas.length}/5 must-haves
                  </span>
                </div>

                {/* HAS Section */}
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>
                    HAS
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {activeCand.skillsHas.map((skill: string) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 99,
                          background: "#DCFCE7",
                          color: "#166534",
                          border: "1px solid #BBF7D0"
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* MISSING Section */}
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>
                    MISSING
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {activeCand.skillsMissing.map((skill: string) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 99,
                          background: "#FEE2E2",
                          color: "#DC2626",
                          border: "1px solid #FCA5A5"
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {activeCand.skillsOptional.map((skill: string) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: 99,
                          background: "#F8FAFC",
                          color: "#64748B",
                          border: "1px dashed #CBD5E1"
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Retention Callout Box */}
              <div style={{
                background: "#F5F3FF",
                border: "1px solid #DDD6FE",
                borderRadius: 12,
                padding: "10px 14px",
                fontSize: 12,
                color: "#6D28D9",
                marginTop: 10
              }}>
                Predicted to stay 2+ years: <b>{activeCand.retentionPrediction}</b>
              </div>
            </div>
          </div>

          {/* Resume Red Flags Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Resume red flags
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                {activeCand.redFlags.length} to check
              </span>
            </div>

            {activeCand.redFlags.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {activeCand.redFlags.map((flag: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 14,
                      background: flag.type === "danger" ? "#FEF2F2" : "#FFFBEB",
                      border: flag.type === "danger" ? "1px solid #FECDD3" : "1px solid #FDE68A",
                      fontSize: 13,
                      lineHeight: 1.5
                    }}
                  >
                    <div style={{ fontWeight: 700, color: flag.type === "danger" ? "#991B1B" : "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle style={{ width: 16, height: 16, color: flag.type === "danger" ? "#EF4444" : "#F59E0B" }} />
                      {flag.title}
                    </div>
                    <div style={{ color: flag.type === "danger" ? "#B91C1C" : "#B45309", marginTop: 3 }}>
                      {flag.desc}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: "#10B981", fontWeight: 600, padding: "8px 0" }}>
                ✓ No major resume red flags detected.
              </div>
            )}
          </div>

          {/* Interview Questions Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Interview questions for this candidate
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                Targeted at gaps and flags
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeCand.questions.map((item: any, idx: number) => (
                <div key={idx} style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontWeight: 800, color: "var(--ink)" }}>{idx + 1}.</span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: item.tag.includes("Red flag") ? "#FEF2F2" : "#EFF6FF",
                      color: item.tag.includes("Red flag") ? "#DC2626" : "#2563EB"
                    }}>
                      {item.tag}
                    </span>
                  </div>
                  <div style={{ paddingLeft: 22, color: "#475569", fontWeight: 500 }}>
                    {item.q}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Hiring Assessment Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                  <Sparkles style={{ width: 17, height: 17, color: "var(--violet)" }} />
                  AI hiring assessment
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  padding: "3px 8px",
                  borderRadius: 99,
                  background: aiAssessment ? "#E0F2FE" : "#F1F5F9",
                  color: aiAssessment ? "#0369A1" : "#64748B"
                }}>
                  {aiAssessment ? "READY" : "WAITING"}
                </span>
              </div>

              <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px 0" }}>
                Get a written assessment with strengths, risks and a recommendation.
              </p>

              {aiAssessment && (
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
                  {renderFormattedMarkdown(aiAssessment)}
                </div>
              )}
            </div>

            <div>
              <button
                onClick={handleDeeperAssessment}
                disabled={loadingAi}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 18px",
                  borderRadius: 99,
                  background: "linear-gradient(135deg, #A855F7 0%, #F97316 100%)",
                  border: "none",
                  color: "#FFF",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: loadingAi ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(168, 85, 247, 0.3)"
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                {loadingAi ? "Generating assessment…" : "Deeper AI assessment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
