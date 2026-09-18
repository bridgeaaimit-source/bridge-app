"use client";

import { useEffect, useState } from "react";
import { Scale, Sparkles, AlertCircle } from "lucide-react";

export default function FairnessAuditPage() {
  const [data, setData] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFairness() {
      try {
        const res = await fetch("/api/team-pulse/fairness");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadFairness();
  }, []);

  const handleGenerateAuditExplanation = async () => {
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Explain the four-fifths rule adverse impact findings on hiring, promotions, and pay parity for leadership.",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiAnalysis(json.reply);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--muted)" }}>Loading Fairness Audit metrics…</div>;
  }

  const shortlisting = data?.shortlisting || { femaleRate: 45, maleRate: 52, adverseImpactRatio: 0.86 };
  const promotions = data?.promotions || { femaleRate: 28, maleRate: 32, adverseImpactRatio: 0.88 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Fairness Audit
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Four-Fifths Adverse Impact Analysis</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Evaluate hiring, promotion rates, and pay parity across gender and age using the standard four-fifths (80%) rule to detect systemic bias.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <div className="tp-panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: shortlisting.adverseImpactRatio >= 0.8 ? "var(--good)" : "var(--crit)" }}>
            {shortlisting.adverseImpactRatio}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Hiring Shortlist Ratio</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Women {shortlisting.femaleRate}% vs Men {shortlisting.maleRate}%
          </div>
        </div>

        <div className="tp-panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: promotions.adverseImpactRatio >= 0.8 ? "var(--good)" : "var(--crit)" }}>
            {promotions.adverseImpactRatio}
          </div>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Promotion Ratio (2 Yrs)</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
            Women {promotions.femaleRate}% vs Men {promotions.maleRate}%
          </div>
        </div>

        <div className="tp-panel" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--good)" }}>0.96</div>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>Pay Parity Ratio</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Women's pay vs Men's (same level)</div>
        </div>
      </div>

      <div className="tp-panel stack">
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>Action Recommendations</h3>
        <ul style={{ paddingLeft: 20, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
          <li>
            <b>Review Shortlisting for Sales roles:</b> Ensure diverse candidate slates and structured resume review for Account Executive positions.
          </li>
          <li>
            <b>Promotion Calibration:</b> Review stalled promotion cases for senior women engineers before the current H1 appraisal cycle closes.
          </li>
          <li>
            <b>Diverse Panels:</b> Include at least one female interviewer on every final panel for Engineering & Product.
          </li>
        </ul>

        <button onClick={handleGenerateAuditExplanation} className="tp-btn tp-btn-ai" style={{ marginTop: 10, alignSelf: "flex-start" }}>
          <Sparkles style={{ width: 15, height: 15 }} /> Explain Audit Findings with AI
        </button>

        {aiAnalysis && (
          <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
            {aiAnalysis}
          </div>
        )}
      </div>
    </div>
  );
}
