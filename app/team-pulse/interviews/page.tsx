"use client";

import { useEffect, useState } from "react";
import { MessageSquareCheck, Check, Sparkles } from "lucide-react";

export default function StructuredInterviewsPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandId, setSelectedCandId] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({
    "Analytical thinking": 4,
    "SQL & Python depth": 4,
    "Business storytelling": 4,
    "Stakeholder management": 3,
  });
  const [verdict, setVerdict] = useState("Recommend Hire");
  const [submitting, setSubmitting] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/team-pulse/candidates");
        if (res.ok) {
          const list = await res.json();
          setCandidates(list);
          if (list.length > 0) setSelectedCandId(list[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  const cand = candidates.find((c) => c.id === selectedCandId);

  const handleSubmitScorecard = async () => {
    if (!cand) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/team-pulse/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: cand.id,
          jobId: cand.jobId || "job_r1",
          ratings,
          verdict,
        }),
      });
      if (res.ok) {
        alert(`Scorecard saved! Verdict '${verdict}' recorded for ${cand.name}.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiEvaluation = async () => {
    if (!cand) return;
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Summarise candidate ${cand.name}'s interview scorecard. Ratings: ${JSON.stringify(ratings)}. Verdict: ${verdict}. Provide a 3-bullet evaluation summary.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiSummary(json.reply);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Structured Interviews
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Interview Scorecard</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Evaluate candidates using structured competency criteria to reduce bias and record AI hire / no-hire summaries.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Candidate & Role Selector */}
        <div className="tp-panel stack">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Select Candidate for Evaluation</label>
            <select
              value={selectedCandId}
              onChange={(e) => setSelectedCandId(e.target.value)}
              style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line2)", marginTop: 4 }}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.title} ({c.stage})
                </option>
              ))}
            </select>
          </div>

          {cand && (
            <div style={{ padding: 14, borderRadius: 10, background: "var(--tint)" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{cand.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                Role: {cand.title} | Current Pay: ₹{cand.curCtc} L
              </div>
            </div>
          )}
        </div>

        {/* Right Competency Scorecard Form */}
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Competency Scorecard</h3>

          {Object.entries(ratings).map(([competency, score]) => (
            <div key={competency} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                <span>{competency}</span>
                <span>{score} / 5</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setRatings({ ...ratings, [competency]: val })}
                    style={{
                      flex: 1,
                      padding: "8px 0",
                      borderRadius: 8,
                      border: "1px solid var(--line2)",
                      background: score === val ? "var(--indigo)" : "#fff",
                      color: score === val ? "#fff" : "var(--ink)",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />

          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Hiring Verdict</label>
            <select
              value={verdict}
              onChange={(e) => setVerdict(e.target.value)}
              style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line2)", marginTop: 4, fontWeight: 700 }}
            >
              <option value="Strong Hire">Strong Hire</option>
              <option value="Recommend Hire">Recommend Hire</option>
              <option value="Hold">Hold</option>
              <option value="Rejection">Rejection</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button onClick={handleSubmitScorecard} disabled={submitting} className="tp-btn tp-btn-primary" style={{ flex: 1 }}>
              <Check style={{ width: 15, height: 15 }} /> Submit Scorecard
            </button>
            <button onClick={handleAiEvaluation} className="tp-btn tp-btn-ai">
              <Sparkles style={{ width: 15, height: 15 }} /> AI Summary
            </button>
          </div>

          {aiSummary && (
            <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
              {aiSummary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
