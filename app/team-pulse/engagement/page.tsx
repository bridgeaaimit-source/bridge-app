"use client";

import { useState } from "react";
import { Sparkles, Flame, Check, RefreshCw } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

export default function EngagementPage() {
  const [commentsText, setCommentsText] = useState(
    `Engineering: On-call has been brutal this quarter, I'm working most weekends and feel exhausted.\n` +
    `Engineering: Great team and I love the tech stack, but release deadlines keep slipping onto us.\n` +
    `Engineering: My manager changed twice this year, no clarity on my growth path.\n` +
    `Engineering: Hybrid policy is excellent, flexibility helps a lot.\n` +
    `Engineering: Too many meetings, hardly any focus time left for deep work.\n` +
    `Engineering: Learning budget is great, I did two certifications this year!\n` +
    `Engineering: Burnout is real. Overtime is expected, not appreciated.`
  );

  const [aiSummaryOutput, setAiSummaryOutput] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const handleSummarizeAI = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Summarize overall workforce sentiment and key themes from these pulse survey comments:\n\n${commentsText}\n\nProvide 3 key theme takeaways and 3 immediate HR action items to reduce burnout and improve retention.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiSummaryOutput(json.reply);
      } else {
        setAiSummaryOutput(
          `**SURVEY SENTIMENT SUMMARY & ACTION PLAN**\n\n` +
          `1. **Primary Burnout Driver (Engineering):** Heavy on-call rotations and weekend overtime are leading to fatigue in core engineering.\n` +
          `2. **Positive Retention Anchor:** High appreciation for the flexible hybrid work model and learning budget allowance.\n` +
          `3. **Management Continuity:** Frequent manager changes in Engineering create growth path uncertainty.\n\n` +
          `**RECOMMENDED ACTION ITEMS:**\n` +
          `• Re-architect Engineering on-call rotations to cap weekend coverage.\n` +
          `• Institute "Focus Fridays" with no meetings.\n` +
          `• Conduct 1-on-1 career path clarity sessions for team members with recent manager changes.`
        );
      }
    } catch {
      setAiSummaryOutput(
        `**SURVEY SENTIMENT SUMMARY & ACTION PLAN**\n\n` +
        `1. **Primary Burnout Driver (Engineering):** Heavy on-call rotations and weekend overtime are leading to fatigue in core engineering.\n` +
        `2. **Positive Retention Anchor:** High appreciation for the flexible hybrid work model and learning budget allowance.\n` +
        `3. **Management Continuity:** Frequent manager changes in Engineering create growth path uncertainty.\n\n` +
        `**RECOMMENDED ACTION ITEMS:**\n` +
        `• Re-architect Engineering on-call rotations to cap weekend coverage.\n` +
        `• Institute "Focus Fridays" with no meetings.\n` +
        `• Conduct 1-on-1 career path clarity sessions for team members with recent manager changes.`
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#F97316", textTransform: "uppercase", marginBottom: 2 }}>
            — RETAIN & COMPLY
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
            Engagement & Sentiment
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Is the workforce on the happier side? Happiness index by team, eNPS trend, AI themes from survey comments, burnout early warnings and exit patterns.
          </p>
        </div>

        <button
          onClick={() => {
            setCommentsText(
              `Engineering: On-call has been brutal this quarter, I'm working most weekends and feel exhausted.\n` +
              `Engineering: Great team and I love the tech stack, but release deadlines keep slipping onto us.\n` +
              `Engineering: My manager changed twice this year, no clarity on my growth path.\n` +
              `Engineering: Hybrid policy is excellent, flexibility helps a lot.\n` +
              `Engineering: Too many meetings, hardly any focus time left for deep work.\n` +
              `Engineering: Learning budget is great, I did two certifications this year!\n` +
              `Engineering: Burnout is real. Overtime is expected, not appreciated.`
            );
            setAiSummaryOutput("");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 99,
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            color: "#D97706",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <Sparkles style={{ width: 14, height: 14, color: "#D97706" }} />
          Try with demo data
        </button>
      </div>

      {/* Row 1: Happiness Index Donut (35%) & eNPS Trend Line Chart (65%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 20 }}>
        {/* Card 1: Happiness Index Sep */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", alignItems: "center", gap: 20 }}>
          {/* Donut Score */}
          <div style={{ position: "relative", width: 90, height: 90, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeDasharray="62 88" // ~70%
                strokeDashoffset="0"
              />
            </svg>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>70</span>
              <span style={{ fontSize: 8.5, fontWeight: 700, color: "#94A3B8", marginTop: 2 }}>happiness</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              HAPPINESS INDEX · SEP
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: "2px 0" }}>
              Mostly happy
            </div>
            <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500, marginBottom: 10 }}>
              Up 3 pts vs Aug · eNPS +18
            </div>

            {/* Comment Breakdown Pills */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "#ECFDF5", color: "#059669", fontSize: 11, fontWeight: 800 }}>
                14
              </span>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "#F1F5F9", color: "#64748B", fontSize: 11, fontWeight: 800 }}>
                2
              </span>
              <span style={{ padding: "3px 9px", borderRadius: 99, background: "#FEF2F2", color: "#EF4444", fontSize: 11, fontWeight: 800 }}>
                12
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 4 }}>
              Positive · neutral · negative comments
            </div>
          </div>
        </div>

        {/* Card 2: eNPS Trend Line Chart */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              eNPS trend
            </h3>
            <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
              Monthly pulse
            </span>
          </div>

          {/* SVG Trendline Chart */}
          <div style={{ position: "relative", width: "100%", height: 120 }}>
            <svg viewBox="0 0 300 90" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="45" x2="300" y2="45" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="70" x2="300" y2="70" stroke="#F1F5F9" strokeWidth="1" />

              {/* Area Gradient Under Line */}
              <polygon
                points="10,25 65,35 120,55 175,65 230,50 285,30 285,90 10,90"
                fill="url(#enpsGradient)"
                opacity="0.25"
              />

              <defs>
                <linearGradient id="enpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EC4899" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Trendline */}
              <path
                d="M 10,25 L 65,35 L 120,55 L 175,65 L 230,50 L 285,30"
                fill="none"
                stroke="#EC4899"
                strokeWidth="2.5"
              />

              {/* Dots */}
              <circle cx="10" cy="25" r="3.5" fill="#EC4899" />
              <circle cx="65" cy="35" r="3.5" fill="#EC4899" />
              <circle cx="120" cy="55" r="3.5" fill="#EC4899" />
              <circle cx="175" cy="65" r="3.5" fill="#EC4899" />
              <circle cx="230" cy="50" r="3.5" fill="#EC4899" />
              <circle cx="285" cy="30" r="4.5" fill="#EC4899" stroke="#FFF" strokeWidth="2" />
            </svg>

            {/* X-axis Month Labels */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", fontWeight: 600, marginTop: 4 }}>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
              <span style={{ color: "#EC4899", fontWeight: 800 }}>Sep (+18)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Mood Map Heatmap (60%) & Burnout Early Warnings (40%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* Mood Map Heatmap Card */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Mood map
            </h3>
            <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
              Happiness index by team and month
            </span>
          </div>

          {/* Heatmap Table */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "center" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 10.5, fontWeight: 800 }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>TEAM</th>
                  <th style={{ padding: "8px" }}>APR</th>
                  <th style={{ padding: "8px" }}>MAY</th>
                  <th style={{ padding: "8px" }}>JUN</th>
                  <th style={{ padding: "8px" }}>JUL</th>
                  <th style={{ padding: "8px" }}>AUG</th>
                  <th style={{ padding: "8px" }}>SEP</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { team: "Engineering", scores: [70, 66, 58, 52, 55, 57] },
                  { team: "Data", scores: [74, 71, 68, 63, 60, 62] },
                  { team: "Product", scores: [68, 70, 72, 71, 74, 76] },
                  { team: "Sales", scores: [72, 69, 61, 50, 63, 66] },
                  { team: "Customer Success", scores: [76, 74, 71, 78, 72, 75] },
                  { team: "HR", scores: [80, 78, 74, 76, 79, 81] },
                  { team: "Finance", scores: [71, 72, 70, 69, 68, 70] },
                ].map((row, idx) => (
                  <tr key={row.team} style={{ borderBottom: idx === 6 ? "none" : "1px solid #F1F5F9" }}>
                    <td style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "var(--ink)" }}>
                      {row.team}
                    </td>
                    {row.scores.map((score, sIdx) => {
                      let cellBg = "#ECFDF5";
                      let cellColor = "#059669";
                      if (score < 55) { cellBg = "#FEF2F2"; cellColor = "#EF4444"; }
                      else if (score < 65) { cellBg = "#FEF3C7"; cellColor = "#D97706"; }

                      return (
                        <td key={sIdx} style={{ padding: "6px" }}>
                          <span style={{
                            display: "inline-block",
                            width: 32,
                            padding: "4px 0",
                            borderRadius: 6,
                            background: cellBg,
                            color: cellColor,
                            fontWeight: 800,
                            fontFamily: "var(--f-mono)"
                          }}>
                            {score}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#64748B", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#ECFDF5", border: "1px solid #A7F3D0" }} /> 72+ happy
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#FEF3C7", border: "1px solid #FDE68A" }} /> 55–71
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: "#FEF2F2", border: "1px solid #FECACA" }} /> below 55
            </span>
          </div>
        </div>

        {/* Burnout Early Warning Card */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Burnout early warning
            </h3>
            <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99, background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA" }}>
              ● 4 teams
            </span>
          </div>

          {/* Warning Callout Boxes */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px",
              display: "flex", gap: 10, alignItems: "flex-start"
            }}>
              <Flame style={{ width: 16, height: 16, color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.4 }}>
                <b>Engineering:</b> 48 hrs/week average, happiness down 13 pts since April, 3 negative workload comments.
              </div>
            </div>

            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "10px 14px",
              display: "flex", gap: 10, alignItems: "flex-start"
            }}>
              <Flame style={{ width: 16, height: 16, color: "#EF4444", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: "#991B1B", lineHeight: 1.4 }}>
                <b>Data:</b> 50 hrs/week average, happiness down 12 pts since April.
              </div>
            </div>

            <div style={{
              background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 14px",
              display: "flex", gap: 10, alignItems: "flex-start"
            }}>
              <Flame style={{ width: 16, height: 16, color: "#D97706", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.4 }}>
                <b>Customer Success:</b> 48 hrs/week average, happiness down 1 pts since April, 1 negative workload comment.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Pulse Survey Comments (35%) & Sentiment + Themes (65%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 20 }}>
        {/* Pulse Survey Comments Textarea Panel */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Pulse survey comments
            </h3>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              One per line "Team: comment"
            </span>
          </div>

          <textarea
            value={commentsText}
            onChange={(e) => setCommentsText(e.target.value)}
            rows={8}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 12,
              border: "1px solid #CBD5E1",
              fontFamily: "var(--f-body)",
              fontSize: 12,
              color: "#334155",
              background: "#F8FAFC",
              outline: "none",
              resize: "none"
            }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleSummarizeAI}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 99,
                background: "#F97316",
                border: "none",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(249, 115, 22, 0.25)"
              }}
            >
              <Check style={{ width: 14, height: 14 }} />
              Analyze comments
            </button>

            <button
              onClick={() => setCommentsText("")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 14px",
                borderRadius: 99,
                background: "#FFF",
                border: "1px solid #CBD5E1",
                color: "#475569",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Sentiment by Team & Themes Grid Panel */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          {/* Sentiment by Team Diverged Bars Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Sentiment by team
              </h3>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>
                -3 to +3
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
              {[
                { team: "Engineering", score: "-3.4", positive: false },
                { team: "Data", score: "+3.8", positive: true },
                { team: "Sales", score: "-0.4", positive: false },
                { team: "Customer Success", score: "+3.5", positive: true },
                { team: "Product", score: "+1.0", positive: true },
                { team: "HR", score: "+1.0", positive: true },
                { team: "Finance", score: "+0.7", positive: true },
              ].map((item) => (
                <div key={item.team} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", width: 110, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.team}
                  </span>
                  <div style={{ flex: 1, height: 10, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                    <div style={{
                      width: `${Math.min(100, Math.abs(parseFloat(item.score)) * 25)}%`,
                      height: "100%",
                      background: item.positive ? "#10B981" : "#EF4444",
                      borderRadius: 99
                    }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: item.positive ? "#10B981" : "#EF4444", fontFamily: "var(--f-mono)", width: 28, textAlign: "right" }}>
                    {item.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Themes Tags Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Themes
              </h3>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>
                Mentions · tone
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { label: "Workload", count: 7, isNegative: true },
                { label: "Growth", count: 5, isNegative: false },
                { label: "Manager", count: 5, isNegative: false },
                { label: "Recognition", count: 4, isNegative: false },
                { label: "Flexibility", count: 4, isNegative: false },
                { label: "Tools", count: 4, isNegative: true },
                { label: "Pay", count: 3, isNegative: true },
                { label: "Planning", count: 2, isNeutral: true },
              ].map((theme, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 99,
                    background: theme.isNegative ? "#FEF2F2" : theme.isNeutral ? "#F1F5F9" : "#ECFDF5",
                    color: theme.isNegative ? "#EF4444" : theme.isNeutral ? "#64748B" : "#059669",
                    border: theme.isNegative ? "1px solid #FECACA" : theme.isNeutral ? "1px solid #CBD5E1" : "1px solid #A7F3D0",
                    fontSize: 11.5,
                    fontWeight: 700
                  }}
                >
                  {theme.label} {theme.count}
                </span>
              ))}
            </div>

            <div style={{ fontSize: 10.5, color: "#94A3B8", fontStyle: "italic", marginTop: 6 }}>
              Red = mostly negative, green = mostly positive.
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Loudest Voices & AI Themes Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* Loudest Voices Card */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            Loudest voices
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Most Negative */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                MOST NEGATIVE
              </div>
              {[
                `"Burnout is real. Overtime is expected, not appreciated." · Engineering`,
                `"CRM is slow and clunky, wastes a lot of time." · Sales`,
                `"On-call has been brutal this quarter, I'm working most weekends and feel exhausted." · Engineering`,
              ].map((q, idx) => (
                <div key={idx} style={{ background: "#F8FAFC", borderRadius: 10, padding: 10, fontSize: 11.5, color: "#334155", lineHeight: 1.4 }}>
                  {q}
                </div>
              ))}
            </div>

            {/* Most Positive */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                MOST POSITIVE
              </div>
              {[
                `"Hybrid policy is excellent, flexibility helps a lot." · Engineering`,
                `"Interesting problems and supportive lead, I feel valued." · Data`,
                `"Recognition for big wins is good, love the monthly awards." · Sales`,
              ].map((q, idx) => (
                <div key={idx} style={{ background: "#F8FAFC", borderRadius: 10, padding: 10, fontSize: 11.5, color: "#334155", lineHeight: 1.4 }}>
                  {q}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Themes & Action Plan Generator Box */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
              <Sparkles style={{ width: 17, height: 17, color: "#6366F1" }} />
              AI themes & action plan
            </div>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
              background: aiSummaryOutput ? "#E0F2FE" : "#F1F5F9", color: aiSummaryOutput ? "#0369A1" : "#64748B"
            }}>
              {aiSummaryOutput ? "READY" : "WAITING"}
            </span>
          </div>

          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
            Summarise what people are saying and what to do about it
          </p>

          <button
            onClick={handleSummarizeAI}
            disabled={loadingAi}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 99,
              background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
              border: "none",
              color: "#FFF",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: loadingAi ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)"
            }}
          >
            <Sparkles style={{ width: 14, height: 14 }} />
            Summarise with AI
          </button>

          {aiSummaryOutput && (
            <div style={{
              background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
              fontSize: 13, color: "#334155", lineHeight: 1.6
            }}>
              {renderFormattedMarkdown(aiSummaryOutput)}
            </div>
          )}
        </div>
      </div>

      {/* Row 5: Why People Left (40%) & In Their Words Exit Quotes (60%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>
        {/* Why People Left Horizontal Bars */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Why people left
            </h3>
            <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
              12 exit interviews, Apr–Sep
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
            {[
              { label: "Better offer", count: 3 },
              { label: "Manager", count: 2 },
              { label: "Compensation", count: 2 },
              { label: "Workload", count: 2 },
              { label: "Growth", count: 2 },
              { label: "Relocation", count: 1 },
            ].map((reason) => (
              <div key={reason.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", width: 110 }}>
                  {reason.label}
                </span>
                <div style={{ flex: 1, height: 14, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                  <div style={{ width: `${(reason.count / 4) * 100}%`, height: "100%", background: "#F97316", borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--f-mono)", width: 14, textAlign: "right" }}>
                  {reason.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* In Their Words Exit Quotes */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            In their words
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { quote: `"Got a 45% hike elsewhere; I'd have stayed for a market correction."`, meta: "Senior Software Engineer, Engineering · 2.4 yrs · Better offer" },
              { quote: `"Third manager in 18 months, nobody knew my work."`, meta: "Software Engineer II, Engineering · 1.6 yrs · Manager" },
              { quote: `"Incentive structure changed mid-year."`, meta: "Account Executive, Sales · 1.1 yrs · Compensation" },
              { quote: `"Ticket load was unsustainable."`, meta: "CS Associate, Customer Success · 0.9 yrs · Workload" },
            ].map((item, idx) => (
              <div key={idx} style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155", lineHeight: 1.4 }}>
                  {item.quote}
                </div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>
                  {item.meta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
