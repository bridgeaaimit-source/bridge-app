"use client";

import { useEffect, useState } from "react";
import { Smile, Heart, Flame, Sparkles, Send } from "lucide-react";

export default function EngagementPage() {
  const [data, setData] = useState<any>(null);
  const [commentsText, setCommentsText] = useState("");
  const [newComment, setNewComment] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/team-pulse/engagement");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          setCommentsText((json.comments || []).join("\n"));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSummarizeAI = async () => {
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze these pulse survey comments and summarize overall mood, top 3 themes, and 3 key actions:\n\n${commentsText}`,
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

  if (loading) {
    return <div style={{ padding: 40, color: "var(--muted)" }}>Loading Engagement & Sentiment data…</div>;
  }

  const moodByDept = data?.moodByDept || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Engagement & Sentiment
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Pulse Survey Analytics</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Happiness index by department, eNPS trend, AI sentiment themes, burnout early warnings, and exit interview insights.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Metrics & Burnout Warnings */}
        <div className="tp-panel stack">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 12, background: "var(--tint)", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--good)" }}>71</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>Happiness Index</div>
            </div>

            <div style={{ padding: 16, borderRadius: 12, background: "var(--tint)", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--rose)" }}>+18</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>eNPS Score</div>
            </div>
          </div>

          <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />

          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Happiness by Team</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(moodByDept).map(([dept, score]: any) => (
              <div key={dept} style={{ display: "grid", gridTemplateColumns: "140px 1fr 40px", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{dept}</span>
                <div style={{ height: 8, background: "var(--tint2)", borderRadius: 4, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${score}%`,
                      height: "100%",
                      background: score >= 70 ? "var(--good)" : score >= 62 ? "var(--amber)" : "var(--crit)",
                      borderRadius: 4,
                    }}
                  />
                </div>
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 700, textAlign: "right" }}>{score}</span>
              </div>
            ))}
          </div>

          <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />

          <h3 style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <Flame style={{ width: 16, height: 16, color: "var(--crit)" }} /> Burnout Early Warnings
          </h3>
          <div style={{ padding: 12, borderRadius: 10, background: "var(--crit-soft)", border: "1px solid #fecdca", fontSize: 12.5 }}>
            <b>Engineering Team:</b> 51 hrs/week average overtime. Happiness dropped 13 pts since April.
          </div>
        </div>

        {/* Right Pulse Comments & AI Summary */}
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Pulse Survey Comments</h3>

          <textarea
            value={commentsText}
            onChange={(e) => setCommentsText(e.target.value)}
            rows={10}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--line2)", fontFamily: "var(--f-body)", fontSize: 12.5 }}
          />

          <button onClick={handleSummarizeAI} className="tp-btn tp-btn-ai" style={{ marginTop: 8 }}>
            <Sparkles style={{ width: 15, height: 15 }} /> Summarize Themes with AI
          </button>

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
