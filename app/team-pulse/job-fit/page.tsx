"use client";

import { useEffect, useState } from "react";
import { Sparkles, Target, AlertTriangle, CheckCircle } from "lucide-react";

export default function JobFitPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandId, setSelectedCandId] = useState("");
  const [aiQuestions, setAiQuestions] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await fetch("/api/team-pulse/candidates");
        if (res.ok) {
          const list = await res.json();
          setCandidates(list);
          if (list.length > 0) setSelectedCandId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadCandidates();
  }, []);

  const cand = candidates.find((c) => c.id === selectedCandId);

  const generateInterviewQuestions = async () => {
    if (!cand) return;
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate 4 tailored interview questions for candidate ${cand.name} applying for ${cand.title}. Current CTC: ₹${cand.curCtc} L, Expected: ₹${cand.expcCtc} L, Notice: ${cand.notice} days, competing offers: ${cand.offers}. Focus on missing skills and retention.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiQuestions(json.reply);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--muted)" }}>Loading Person-Job Fit analysis…</div>;
  }

  const fitDetails = cand?.fitDetails || { overall: 84, skills: 90, exp: 95, pers: 85, retention: 70 };
  const redFlags = cand?.redFlags || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Person–Job Fit
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Candidate Fit Matrix</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Evaluate candidate suitability across skills, experience, personality, culture, retention outlook, and resume red flags.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Candidate Selector */}
        <div className="tp-panel stack">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Select Candidate</label>
            <select
              value={selectedCandId}
              onChange={(e) => setSelectedCandId(e.target.value)}
              style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line2)", marginTop: 4 }}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.title} ({c.company})
                </option>
              ))}
            </select>
          </div>

          {cand && (
            <div style={{ padding: 16, borderRadius: 12, background: "var(--tint)", border: "1px solid var(--line)" }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{cand.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                {cand.title} at {cand.company}
              </div>
              <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />
              <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                <div>
                  <b>Experience:</b> {cand.exp} years
                </div>
                <div>
                  <b>Current Pay:</b> ₹{cand.curCtc} LPA | <b>Expected:</b> ₹{cand.expcCtc} LPA
                </div>
                <div>
                  <b>Notice Period:</b> {cand.notice} days | <b>Competing Offers:</b> {cand.offers}
                </div>
                <div>
                  <b>MBTI Type:</b> {cand.mbti} | <b>Source:</b> {cand.source}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Fit Score Breakdown */}
        {cand && (
          <div className="tp-panel stack">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Fit Score Breakdown</h3>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--indigo)" }}>{cand.fitScore}%</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {[
                { label: "Skills Match (40%)", value: fitDetails.skills || 85, color: "var(--indigo)" },
                { label: "Experience Alignment (20%)", value: fitDetails.exp || 90, color: "var(--sky)" },
                { label: "Personality Preference (10%)", value: fitDetails.pers || 80, color: "var(--violet)" },
                { label: "Culture Alignment (15%)", value: 88, color: "var(--rose)" },
                { label: "Retention Outlook (15%)", value: fitDetails.retention || 70, color: "var(--amber)" },
              ].map((item) => (
                <div key={item.label} style={{ display: "grid", gridTemplateColumns: "180px 1fr 40px", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600 }}>{item.label}</span>
                  <div style={{ height: 8, background: "var(--tint2)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${item.value}%`, height: "100%", background: item.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 700, textAlign: "right" }}>{item.value}%</span>
                </div>
              ))}
            </div>

            <div style={{ margin: "14px 0 6px", height: 1, background: "var(--line)" }} />

            <h4 style={{ fontSize: 14, fontWeight: 700 }}>Red Flags & Risk Signals</h4>
            {redFlags.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {redFlags.map((rf: any, idx: number) => (
                  <div key={idx} style={{ padding: 10, borderRadius: 8, background: "var(--warn-soft)", fontSize: 12.5, border: "1px solid #fedf89" }}>
                    <div style={{ fontWeight: 700, color: "#8a5300" }}>{rf[1] || rf.title || "Retention Risk"}</div>
                    <div style={{ color: "#6b4300", marginTop: 2 }}>{rf[2] || rf.details || "Probe during interview."}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12.5, color: "var(--good)", display: "flex", alignItems: "center", gap: 6 }}>
                <CheckCircle style={{ width: 16, height: 16 }} /> No major resume red flags detected.
              </div>
            )}

            <button onClick={generateInterviewQuestions} className="tp-btn tp-btn-ai" style={{ marginTop: 12 }}>
              <Sparkles style={{ width: 15, height: 15 }} /> Generate Tailored Interview Questions
            </button>

            {aiQuestions && (
              <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
                {aiQuestions}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
