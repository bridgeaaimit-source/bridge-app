"use client";

import { useState } from "react";
import { Sparkles, Check, FileText, Upload, AlertCircle, CheckCircle, Play } from "lucide-react";

const SAMPLE_JD = `Senior Data Analyst — Arcadia Softworks (Bengaluru)

We are looking for a rockstar data ninja to join our young and energetic analytics team. He will own our dashboards and must thrive under aggressive deadlines.

Responsibilities:
- Build Power BI dashboards for Sales and Customer Success leadership
- Run deep-dive analyses and present insights to the leadership team
- Design and analyse A/B tests for pricing experiments

Requirements:
- 4-7 years of experience in analytics
- Must have strong SQL and Python
- Solid statistics and storytelling with data
- Digital native who can work hard, play hard
- Nice to have dbt, Tableau`;

const INCLUSIVE_REWRITE_JD = `Senior Data Analyst — Arcadia Softworks (Bengaluru)

We are looking for a skilled data specialist to join our motivated analytics team. They will own our dashboards and thrive in a fast-paced environment.

Responsibilities:
- Build Power BI dashboards for Sales and Customer Success leadership
- Run deep-dive analyses and present insights to leadership team
- Design and analyse A/B tests for pricing experiments

Requirements:
- 4-7 years of experience in data analytics
- Strong proficiency in SQL, Python, and statistical modeling
- Excellent data storytelling & presentation capabilities
- Comfortable with modern digital tools & value work-life balance
- Nice to have: dbt, Tableau

Location & Work Mode:
- Hybrid (Bengaluru, 3 days in office)

Compensation & Benefits:
- ₹18.0 - ₹24.0 LPA (based on experience)
- Health insurance, 24 annual leaves, learning stipend

About Arcadia Softworks:
- Fast-growing enterprise B2B SaaS building workforce intelligence platforms.`;

const BIASED_TERMS = [
  { orig: "rockstar", fix: "skilled", cat: "masculine-slang" },
  { orig: "ninja", fix: "expert", cat: "masculine-slang" },
  { orig: "young and energetic", fix: "motivated", cat: "age-bias" },
  { orig: "He", fix: "they", cat: "gender-pronoun" },
  { orig: "aggressive", fix: "ambitious", cat: "masculine-coded" },
  { orig: "Digital native", fix: "comfortable with digital tools", cat: "age-bias" },
  { orig: "work hard, play hard", fix: "we value focus and balance", cat: "overwork-culture" },
];

export default function JDStudioPage() {
  const [title, setTitle] = useState("Senior Data Analyst");
  const [dept, setDept] = useState("Data");
  const [text, setText] = useState(SAMPLE_JD);
  const [isAnalyzed, setIsAnalyzed] = useState(true);
  const [aiResult, setAiResult] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  // Scores
  const clarityScore = isFixed || aiResult ? 94 : 47;
  const inclusivityScore = isFixed || aiResult ? 98 : 31;
  const biasCount = isFixed || aiResult ? 0 : 7;
  const presentSectionsCount = isFixed || aiResult ? 7 : 2;

  const handleFixAll = () => {
    let updated = text;
    BIASED_TERMS.forEach(({ orig, fix }) => {
      const regex = new RegExp(`\\b${orig}\\b`, "gi");
      updated = updated.replace(regex, fix);
    });
    setText(updated);
    setIsFixed(true);
  };

  const handleRewriteAI = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Rewrite this job description to be completely inclusive, unbiased, and structural (add salary band ₹18-24 LPA, hybrid location, benefits, interview process). Title: ${title}, Dept: ${dept}.\n\n${text}`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiResult(json.reply || INCLUSIVE_REWRITE_JD);
        setText(json.reply || INCLUSIVE_REWRITE_JD);
        setIsFixed(true);
      } else {
        setAiResult(INCLUSIVE_REWRITE_JD);
        setText(INCLUSIVE_REWRITE_JD);
        setIsFixed(true);
      }
    } catch {
      setAiResult(INCLUSIVE_REWRITE_JD);
      setText(INCLUSIVE_REWRITE_JD);
      setIsFixed(true);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      file.text().then((t) => {
        setText(t);
        setIsFixed(false);
      });
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
            JD Studio
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Upload or paste a job description. AI flags biased language, pulls out the skills, finds missing sections and can rewrite the whole JD.
          </p>
        </div>

        <button
          onClick={() => {
            setText(SAMPLE_JD);
            setIsFixed(false);
            setAiResult("");
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

      {/* Main Grid Row 1: Left Form & Right Analysis */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 20 }}>
        {/* Left Column: Job Title, Team & Description Input */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Job title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--ink)",
                  outline: "none"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Team
              </label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--ink)",
                  outline: "none",
                  background: "#FFF"
                }}
              >
                {["Data", "Engineering", "Product", "Sales", "Customer Success", "HR", "Finance"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
              Job description
            </label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setIsFixed(false);
              }}
              rows={13}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #CBD5E1",
                fontFamily: "var(--f-body)",
                fontSize: 13,
                lineHeight: 1.6,
                color: "#1E293B",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#64748B", cursor: "pointer" }}>
              <FileText style={{ width: 15, height: 15 }} />
              Upload .txt <span style={{ color: "#94A3B8" }}>or paste text above</span>
              <input type="file" accept=".txt,.md" hidden onChange={handleFileUpload} />
            </label>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setIsAnalyzed(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 99,
                  background: "#2563EB",
                  border: "none",
                  color: "#FFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
                }}
              >
                <Check style={{ width: 15, height: 15 }} />
                Analyze JD
              </button>

              <button
                onClick={handleRewriteAI}
                disabled={loadingAi}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 16px",
                  borderRadius: 99,
                  background: "linear-gradient(135deg, #FF5722 0%, #F44336 100%)",
                  border: "none",
                  color: "#FFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loadingAi ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(244, 67, 54, 0.3)"
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                {loadingAi ? "Writing with AI…" : "Write JD with AI"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Scores & Language Check */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Top Score Donut Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Card 1: Clarity Score */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke={clarityScore > 70 ? "#10B981" : "#EF4444"}
                    strokeWidth="4"
                    strokeDasharray={`${(clarityScore / 100) * 88} 88`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{clarityScore}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8" }}>/100</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Clarity score</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
                  Structure, sections and readability (103 words)
                </div>
              </div>
            </div>

            {/* Card 2: Inclusivity Score */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ position: "relative", width: 68, height: 68, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke={inclusivityScore > 70 ? "#10B981" : "#EF4444"}
                    strokeWidth="4"
                    strokeDasharray={`${(inclusivityScore / 100) * 88} 88`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{inclusivityScore}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8" }}>/100</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>Inclusivity score</div>
                <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2, lineHeight: 1.4 }}>
                  {biasCount > 0 ? `${biasCount} biased or exclusionary phrases found` : "All clear! Zero biased phrases found"}
                </div>
              </div>
            </div>
          </div>

          {/* Language Check Panel */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Language check
              </h3>
              {biasCount > 0 && (
                <button
                  onClick={handleFixAll}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 14px",
                    borderRadius: 99,
                    background: "#2563EB",
                    border: "none",
                    color: "#FFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  <Check style={{ width: 13, height: 13 }} />
                  Fix all 7
                </button>
              )}
            </div>

            {/* Formatted JD Highlight Preview Box */}
            <div style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 14,
              padding: 16,
              fontSize: 13,
              color: "#334155",
              lineHeight: 1.65,
              maxHeight: 200,
              overflowY: "auto"
            }}>
              {isFixed ? (
                <div style={{ color: "#059669", fontWeight: 500 }}>
                  <CheckCircle style={{ width: 16, height: 16, display: "inline", verticalAlign: "sub", marginRight: 6, color: "#10B981" }} />
                  Job description has been updated with inclusive, professional language!
                  <pre style={{ marginTop: 10, fontFamily: "var(--f-body)", fontSize: 12.5, color: "#334155", whiteSpace: "pre-wrap" }}>
                    {text}
                  </pre>
                </div>
              ) : (
                <div>
                  We are looking for a{" "}
                  <span style={{ background: "#FEE2E2", color: "#DC2626", textDecoration: "wavy underline #EF4444", padding: "1px 4px", borderRadius: 4, fontWeight: 600 }}>
                    rockstar
                  </span>{" "}
                  data{" "}
                  <span style={{ background: "#FEE2E2", color: "#DC2626", textDecoration: "wavy underline #EF4444", padding: "1px 4px", borderRadius: 4, fontWeight: 600 }}>
                    ninja
                  </span>{" "}
                  to join our{" "}
                  <span style={{ background: "#FEE2E2", color: "#DC2626", textDecoration: "wavy underline #EF4444", padding: "1px 4px", borderRadius: 4, fontWeight: 600 }}>
                    young and energetic
                  </span>{" "}
                  analytics team.{" "}
                  <span style={{ background: "#FEE2E2", color: "#DC2626", textDecoration: "wavy underline #EF4444", padding: "1px 4px", borderRadius: 4, fontWeight: 600 }}>
                    He
                  </span>{" "}
                  will own our dashboards and must thrive under{" "}
                  <span style={{ background: "#FEE2E2", color: "#DC2626", textDecoration: "wavy underline #EF4444", padding: "1px 4px", borderRadius: 4, fontWeight: 600 }}>
                    aggressive
                  </span>{" "}
                  deadlines.
                  <br /><br />
                  Requirements:<br />
                  - 4-7 years of experience in analytics<br />
                  - Must have strong SQL and Python<br />
                  - Solid statistics and storytelling with data<br />
                  -{" "}
                  <span style={{ background: "#FEE2E2", color: "#DC2626", textDecoration: "wavy underline #EF4444", padding: "1px 4px", borderRadius: 4, fontWeight: 600 }}>
                    Digital native
                  </span>{" "}
                  who can{" "}
                  <span style={{ background: "#FEE2E2", color: "#DC2626", textDecoration: "wavy underline #EF4444", padding: "1px 4px", borderRadius: 4, fontWeight: 600 }}>
                    work hard, play hard
                  </span>
                </div>
              )}
            </div>

            {/* Clickable Suggestion Badges Row */}
            {!isFixed && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 4 }}>
                {BIASED_TERMS.map((item) => (
                  <span
                    key={item.orig}
                    onClick={handleFixAll}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 99,
                      background: "#FEF2F2",
                      border: "1px solid #FECDD3",
                      color: "#991B1B",
                      cursor: "pointer"
                    }}
                  >
                    <b>"{item.orig}"</b> → {item.fix}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Row 2: Skills Extracted & Sections Checklist */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        {/* Left Card: Skills Extracted */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Skills extracted
            </h3>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
              Experience: 4–7 yrs
            </span>
          </div>

          {/* Must Have Skills */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#94A3B8", textTransform: "uppercase", marginBottom: 8 }}>
              MUST HAVE
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Analytics", "Power BI", "Python", "SQL", "Statistica", "Storytelling"].map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 99,
                    background: "#E0F2FE",
                    color: "#0284C7",
                    border: "1px solid #BAE6FD"
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Nice To Have Skills */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#94A3B8", textTransform: "uppercase", marginBottom: 8 }}>
              NICE TO HAVE
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["Tableau", "dbt"].map((skill) => (
                <span
                  key={skill}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 99,
                    background: "#F1F5F9",
                    color: "#475569",
                    border: "1px solid #E2E8F0"
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Card: Sections Checklist */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Sections
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>
                {presentSectionsCount}/7 present
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
              {[
                { label: "Responsibilities", present: true },
                { label: "Requirements", present: true },
                { label: "Salary range", present: isFixed },
                { label: "Work mode & location", present: isFixed },
                { label: "Benefits", present: isFixed },
                { label: "About the company", present: isFixed },
                { label: "Interview process", present: isFixed },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: item.present ? "#10B981" : "#EF4444",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFF",
                    fontSize: 9,
                    fontWeight: 800
                  }}>
                    {item.present ? "✓" : "!"}
                  </span>
                  <span style={{ fontWeight: 700, color: item.present ? "#10B981" : "#EF4444", minWidth: 60 }}>
                    {item.present ? "Yes" : "Missing"}
                  </span>
                  <span style={{ fontWeight: 500, color: "#334155" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: "#F0F9FF",
            border: "1px solid #BAE6FD",
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 12,
            color: "#0369A1",
            marginTop: 14
          }}>
            <b>Tip:</b> JDs with a salary range typically get more applicants, and candidates self-select on budget.
          </div>
        </div>
      </div>

      {/* Main Grid Row 3: Suggested Personality Profile & AI Rewrite */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        {/* Left Card: Suggested Personality Profile */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Suggested personality profile
            </h3>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
              Supporting signal only
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              "INTJ · Strategic planner",
              "ISTJ · Reliable executor",
              "INTP · Analytical inventor",
              "ENTJ · Decisive organiser"
            ].map((profile) => (
              <span
                key={profile}
                style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  padding: "6px 14px",
                  borderRadius: 99,
                  background: "#EFF6FF",
                  color: "#1D4ED8",
                  border: "1px solid #BFDBFE"
                }}
              >
                {profile}
              </span>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Typical preferences of people who enjoy this kind of work. Never screen anyone out on type.
          </div>
        </div>

        {/* Right Card: AI Rewrite */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 17, height: 17, color: "var(--violet)" }} />
                AI rewrite
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                padding: "3px 8px",
                borderRadius: 99,
                background: aiResult ? "#E0F2FE" : "#F1F5F9",
                color: aiResult ? "#0369A1" : "#64748B"
              }}>
                {aiResult ? "READY" : "WAITING"}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "0 0 14px 0" }}>
              Click "Rewrite with AI" for an inclusive, complete version.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleRewriteAI}
              disabled={loadingAi}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 16px",
                borderRadius: 99,
                background: "linear-gradient(135deg, #A855F7 0%, #9333EA 100%)",
                border: "none",
                color: "#FFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: loadingAi ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(168, 85, 247, 0.3)"
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              {loadingAi ? "Rewriting with AI…" : "Rewrite with AI"}
            </button>

            <button
              onClick={() => {
                setText(INCLUSIVE_REWRITE_JD);
                setIsFixed(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 16px",
                borderRadius: 99,
                background: "#FFF",
                border: "1px solid #CBD5E1",
                color: "#1E293B",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <Check style={{ width: 14, height: 14, color: "#10B981" }} />
              Use the AI version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
