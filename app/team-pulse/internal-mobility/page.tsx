"use client";

import { useState } from "react";
import { Sparkles, Check, ArrowRightLeft, UserPlus, Info } from "lucide-react";

interface InternalCandidate {
  id: string;
  name: string;
  role: string;
  dept: string;
  rating: string;
  score: number;
  scoreColor: string;
  wantsToMove: boolean;
  reskillPath: string;
  nominated?: boolean;
}

interface ReferralEmployee {
  id: string;
  initials: string;
  name: string;
  role: string;
  networkNote: string;
}

const INTERNAL_CANDIDATES: InternalCandidate[] = [
  {
    id: "ishita",
    name: "Ishita Bose",
    role: "Financial Analyst",
    dept: "Finance",
    rating: "4/5",
    score: 76,
    scoreColor: "#2563EB",
    wantsToMove: true,
    reskillPath: "Python, Storytelling · about 8 weeks",
  },
  {
    id: "imran",
    name: "Imran Joshi",
    role: "Software Engineer",
    dept: "Engineering",
    rating: "2/5",
    score: 53,
    scoreColor: "#2563EB",
    wantsToMove: true,
    reskillPath: "Power BI, Statistics, Storytelling · about 12 weeks",
  },
  {
    id: "faizan",
    name: "Faizan Mishra",
    role: "Senior CSM",
    dept: "Customer Success",
    rating: "4/5",
    score: 50,
    scoreColor: "#D97706",
    wantsToMove: true,
    reskillPath: "Python, Power BI, Statistics, Storytelling · about 16 weeks",
  },
  {
    id: "rohan",
    name: "Rohan Bhat",
    role: "Finance Controller",
    dept: "Finance",
    rating: "4/5",
    score: 50,
    scoreColor: "#D97706",
    wantsToMove: false,
    reskillPath: "Python, Statistics, Storytelling · about 12 weeks",
  },
  {
    id: "radhika",
    name: "Radhika Gupta",
    role: "Software Engineer",
    dept: "Engineering",
    rating: "3/5",
    score: 42,
    scoreColor: "#EF4444",
    wantsToMove: false,
    reskillPath: "Power BI, Statistics, Storytelling · about 12 weeks",
  },
];

const REFERRAL_MATCHERS: ReferralEmployee[] = [
  { id: "yash", initials: "YV", name: "Yash Verma", role: "Director of Engineering", networkNote: "Ex-Kestrel Payments: 1 candidate(s) worked there" },
  { id: "sameer", initials: "SG", name: "Sameer Gupta", role: "Engineering Manager", networkNote: "Ex-Indus Mobility, Monsoon Media: 2 candidate(s) worked there" },
  { id: "tejas", initials: "TI", name: "Tejas Iyer", role: "Engineering Manager", networkNote: "Ex-Indus Mobility, Kestrel Payments: 3 candidate(s) worked there" },
  { id: "tejas_q", initials: "TQ", name: "Tejas Qureshi", role: "Engineering Manager", networkNote: "Ex-Brightwater EdTech: 2 candidate(s) worked there" },
  { id: "mohit", initials: "MK", name: "Mohit Khan", role: "Software Engineer II", networkNote: "Ex-Cobalt Ridge Consulting, Brightwater EdTech: 3 candidate(s) worked there" },
];

export default function InternalMobilityPage() {
  const [selectedRole, setSelectedRole] = useState("Senior Data Analyst");
  const [nominatedIds, setNominatedIds] = useState<string[]>([]);
  const [aiJobPost, setAiJobPost] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const toggleNomination = (id: string) => {
    setNominatedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGenerateJobPost = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Draft an internal job opportunity announcement post for current employees for the role of '${selectedRole}'. Highlight internal career growth, reskilling support, cross-functional transition paths, and employee referral bonus program.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiJobPost(json.reply);
      } else {
        setAiJobPost(
          `**INTERNAL CAREER OPPORTUNITY: ${selectedRole.toUpperCase()}**\n\n` +
          `Are you ready for your next career chapter at Arcadia Softworks?\n\n` +
          `• **Role:** ${selectedRole}\n` +
          `• **Department:** Data & Analytics\n` +
          `• **Reskilling Support:** Fully funded 8–12 week Python & SQL certification\n` +
          `• **Eligibility:** 1+ years in current role with rating ≥ 3/5\n\n` +
          `**Employee Referrals:** Know an exceptional external candidate? Refer them now to earn a **₹50,000** referral bonus!`
        );
      }
    } catch {
      setAiJobPost(
        `**INTERNAL CAREER OPPORTUNITY: ${selectedRole.toUpperCase()}**\n\n` +
        `Are you ready for your next career chapter at Arcadia Softworks?\n\n` +
        `• **Role:** ${selectedRole}\n` +
        `• **Department:** Data & Analytics\n` +
        `• **Reskilling Support:** Fully funded 8–12 week Python & SQL certification\n` +
        `• **Eligibility:** 1+ years in current role with rating ≥ 3/5\n\n` +
        `**Employee Referrals:** Know an exceptional external candidate? Refer them now to earn a **₹50,000** referral bonus!`
      );
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      {/* Sub-Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#10B981", textTransform: "uppercase", marginBottom: 2 }}>
            — PLAN
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
            Internal Mobility
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Before hiring outside, match current employees to open roles with a reskilling path, and find who can refer strong candidates.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedRole("Senior Data Analyst");
            setNominatedIds([]);
            setAiJobPost("");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 99,
            background: "#ECFDF5",
            border: "1px solid #A7F3D0",
            color: "#059669",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <Sparkles style={{ width: 14, height: 14, color: "#059669" }} />
          Try with demo data
        </button>
      </div>

      {/* Role Selector & Savings Subhead Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          style={{
            height: 40,
            padding: "0 14px",
            borderRadius: 10,
            border: "1px solid #CBD5E1",
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--ink)",
            background: "#FFF",
            outline: "none"
          }}
        >
          <option value="Senior Data Analyst">Senior Data Analyst</option>
          <option value="Backend Engineer">Backend Engineer</option>
          <option value="Product Manager">Product Manager</option>
          <option value="Sales Manager">Sales Manager</option>
        </select>

        <div style={{ fontSize: 12.5, color: "#64748B", fontWeight: 500 }}>
          <b>32 days open</b> · hiring internally saves about <b>₹7.0 L</b> in agency fees and ramp-up, and <b>~23 days</b>
        </div>
      </div>

      {/* Main Grid Layout: Left Matches (62%) & Right Referral Matcher + AI (38%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        {/* Left Column: Internal Matches */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Internal matches
            </h3>
            <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
              Skills, performance, potential, aspiration
            </span>
          </div>

          {/* Internal Match Candidate Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {INTERNAL_CANDIDATES.map((cand) => {
              const isNominated = nominatedIds.includes(cand.id);
              return (
                <div
                  key={cand.id}
                  style={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 16,
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: isNominated ? "#ECFDF5" : "#FFF",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Donut Score Circular Gauge */}
                    <div style={{ position: "relative", width: 50, height: 50, flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
                        <circle
                          cx="18" cy="18" r="14" fill="none"
                          stroke={cand.scoreColor}
                          strokeWidth="3.5"
                          strokeDasharray={`${(cand.score / 100) * 88} 88`}
                          strokeDashoffset="0"
                        />
                      </svg>
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 800, color: "var(--ink)"
                      }}>
                        {cand.score}
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14.5, fontWeight: 800, color: "var(--ink)" }}>{cand.name}</span>
                        {cand.wantsToMove && (
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "#ECFDF5",
                            color: "#059669",
                            border: "1px solid #A7F3D0",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}>
                            ● Wants to move to Data
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 2, fontWeight: 500 }}>
                        {cand.role} · {cand.dept} · rating {cand.rating}
                      </div>

                      <div style={{ fontSize: 11.5, color: "#475569", marginTop: 6 }}>
                        <b style={{ color: "#334155" }}>Reskill:</b> {cand.reskillPath}
                      </div>
                    </div>
                  </div>

                  {/* Nominate Action Button */}
                  <button
                    onClick={() => toggleNomination(cand.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 18px",
                      borderRadius: 99,
                      background: isNominated ? "#059669" : "#059669",
                      border: "none",
                      color: "#FFF",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)"
                    }}
                  >
                    {isNominated ? <Check style={{ width: 14, height: 14 }} /> : null}
                    {isNominated ? "Nominated" : "Nominate"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Referral Matcher & AI Copilot */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Referral Matcher Panel */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Referral matcher
              </h3>
              <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
                Who knows the talent pool
              </span>
            </div>

            {/* List of Referral Matchers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {REFERRAL_MATCHERS.map((ref) => (
                <div key={ref.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", background: "#2563EB", color: "#FFF",
                    fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    {ref.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
                      {ref.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      {ref.role}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                      {ref.networkNote}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip Callout Box */}
            <div style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              padding: 12,
              fontSize: 11.5,
              color: "#475569",
              lineHeight: 1.4,
              marginTop: 4
            }}>
              <b>Tip:</b> referred hires usually join faster and stay longer. A ₹50k referral bonus costs less than an agency fee of ₹1.7 L.
            </div>
          </div>

          {/* Internal Job Post AI Generator Box */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 17, height: 17, color: "#EC4899" }} />
                Internal job post
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
                background: aiJobPost ? "#E0F2FE" : "#F1F5F9", color: aiJobPost ? "#0369A1" : "#64748B"
              }}>
                {aiJobPost ? "READY" : "WAITING"}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
              Draft an internal posting that encourages movers.
            </p>

            <button
              onClick={handleGenerateJobPost}
              disabled={loadingAi}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 18px",
                borderRadius: 99,
                background: "linear-gradient(135deg, #EC4899 0%, #D946EF 100%)",
                border: "none",
                color: "#FFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: loadingAi ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(236, 72, 153, 0.3)"
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              Draft internal job post
            </button>

            {aiJobPost && (
              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
                fontSize: 13, color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap"
              }}>
                {aiJobPost}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
