"use client";

import { useState } from "react";
import { Sparkles, Check, Upload, AlertCircle, CheckCircle } from "lucide-react";

const BIAS_RULES = [
  { re: /\brock ?stars?\b/gi, why: "Informal, male-coded slang", fix: "skilled candidate" },
  { re: /\bninjas?\b/gi, why: "Male-coded slang", fix: "expert practitioner" },
  { re: /\bgurus?\b/gi, why: "Informal slang", fix: "specialist" },
  { re: /\baggressive\b/gi, why: "Masculine-coded word, deters applicants", fix: "ambitious" },
  { re: /\byoung( and energetic)?\b/gi, why: "Age bias — breaches equal opportunity norms", fix: "motivated" },
  { re: /\bdigital natives?\b/gi, why: "Age-coded phrase", fix: "comfortable with digital tools" },
  { re: /\bwork hard,? play hard\b/gi, why: "Signals long hours; deters caregivers", fix: "we value focus and balance" },
  { re: /\bculture fit\b/gi, why: "Can mask affinity bias", fix: "values alignment" },
];

const SAMPLE_JD = `Senior Data Analyst — Rocket India (Bengaluru)

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
- Nice to have: dbt, Tableau`;

export default function JDStudioPage() {
  const [title, setTitle] = useState("Senior Data Analyst");
  const [dept, setDept] = useState("Data");
  const [text, setText] = useState(SAMPLE_JD);
  const [aiResult, setAiResult] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const analyze = () => {
    const hits: any[] = [];
    BIAS_RULES.forEach(({ re, why, fix }) => {
      const match = text.match(re);
      if (match) {
        match.forEach((w) => hits.push({ w, why, fix }));
      }
    });

    const hasSalary = /salary|ctc|lpa|compensation|₹|inr/i.test(text);
    const hasWorkMode = /hybrid|remote|office|location/i.test(text);
    const hasBenefits = /benefit|insurance|leave|perk/i.test(text);

    const clarity = Math.min(100, Math.max(20, (hasSalary ? 30 : 0) + (hasWorkMode ? 35 : 0) + (hasBenefits ? 35 : 15)));
    const inclusivity = Math.max(10, 100 - hits.length * 15);

    return { hits, clarity, inclusivity, hasSalary, hasWorkMode, hasBenefits };
  };

  const analysis = analyze();

  const handleRewriteAI = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Rewrite this job description to be inclusive, complete, and unbiased (no gendered or age-coded words). Title: ${title}, Department: ${dept}.\n\n${text}`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiResult(json.reply);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      file.text().then((t) => setText(t));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Job Description Intelligence
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>JD Studio</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Analyze job descriptions for biased language, skill requirements, missing structural sections, and generate inclusive AI rewrites.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Form */}
        <div className="tp-panel stack">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Job Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line2)" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>Team / Department</label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line2)" }}
              >
                {["Engineering", "Data", "Product", "Sales", "Customer Success", "HR", "Finance"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Job Description Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={14}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--line2)", fontFamily: "var(--f-body)", fontSize: 13 }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="tp-btn" style={{ fontSize: 12, padding: "6px 12px", cursor: "pointer" }}>
              <Upload style={{ width: 14, height: 14 }} /> Upload .txt
              <input type="file" accept=".txt,.md" hidden onChange={handleFileUpload} />
            </label>

            <button onClick={handleRewriteAI} disabled={loadingAi} className="tp-btn tp-btn-ai">
              <Sparkles style={{ width: 15, height: 15 }} />
              {loadingAi ? "Rewriting with AI…" : "Rewrite with AI"}
            </button>
          </div>
        </div>

        {/* Right Output & Analysis */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div className="tp-panel" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: analysis.clarity >= 70 ? "var(--good)" : "var(--warn)" }}>
                {analysis.clarity}/100
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Clarity & Structure</div>
            </div>

            <div className="tp-panel" style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: analysis.inclusivity >= 80 ? "var(--good)" : "var(--crit)" }}>
                {analysis.inclusivity}/100
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Inclusivity Rating</div>
            </div>
          </div>

          <div className="tp-panel stack">
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Biased & Exclusionary Language Found</h3>
            {analysis.hits.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {analysis.hits.map((h, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 8, background: "var(--crit-soft)", border: "1px solid #fecdca", fontSize: 12.5 }}>
                    <b style={{ color: "var(--crit)" }}>“{h.w}”</b> → {h.why}. <i>Try using “{h.fix}”</i>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--good)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle style={{ width: 16, height: 16 }} /> All clear! No gendered or age-coded bias detected.
              </div>
            )}
          </div>

          <div className="tp-panel stack">
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Structural Checklist</h3>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12.5 }}>
              <span style={{ padding: "4px 10px", borderRadius: 99, background: analysis.hasSalary ? "var(--good-soft)" : "var(--crit-soft)" }}>
                {analysis.hasSalary ? "✓ Salary Range Included" : "✗ Missing Salary Band"}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: 99, background: analysis.hasWorkMode ? "var(--good-soft)" : "var(--crit-soft)" }}>
                {analysis.hasWorkMode ? "✓ Hybrid / Location Mentioned" : "✗ Missing Work Location"}
              </span>
              <span style={{ padding: "4px 10px", borderRadius: 99, background: analysis.hasBenefits ? "var(--good-soft)" : "var(--warn-soft)" }}>
                {analysis.hasBenefits ? "✓ Benefits Outlined" : "! Perks Not Specified"}
              </span>
            </div>
          </div>

          {aiResult && (
            <div className="tp-panel" style={{ background: "var(--tint)", border: "1px solid var(--violet)" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--violet-ink)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                <Sparkles style={{ width: 16, height: 16 }} /> AI Inclusive Rewrite
              </div>
              <div style={{ fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{aiResult}</div>
              <button
                onClick={() => setText(aiResult)}
                className="tp-btn"
                style={{ marginTop: 12, fontSize: 12, padding: "5px 10px" }}
              >
                <Check style={{ width: 14, height: 14 }} /> Use AI Version
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
