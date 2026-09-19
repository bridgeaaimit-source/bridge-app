"use client";

import { useState } from "react";
import { Sparkles, Info, CheckCircle } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

export default function FairnessAuditPage() {
  const [aiNarrativeOutput, setAiNarrativeOutput] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGenerateAiNarrative = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Write an executive Four-Fifths Rule Fairness Audit report for leadership. Highlights: Hiring ratio 0.52 (Women 27% vs Men 53%), Promotion ratio 0.72 (Women 38% vs Men 53%), Pay parity 1.09 (Equal). Shortlisting adverse impact flags in Senior Data Analyst (0.67), Backend Engineer (0.56), Enterprise AE (0.00), HRBP (0.33). Include recommended remediation actions.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiNarrativeOutput(json.reply);
      } else {
        setAiNarrativeOutput(
          `**EXECUTIVE FAIRNESS AUDIT REPORT**\n\n` +
          `1. **Hiring Shortlisting Impact (Ratio 0.52):** The four-fifths rule indicates potential adverse impact during initial resume screening for technical and sales roles (Women 27% vs Men 53% shortlist rate).\n` +
          `2. **Promotion Parity (Ratio 0.72):** Over a 2-year window, female employees exhibit a 38% promotion rate compared to 53% for male peers, particularly in Engineering.\n` +
          `3. **Pay Parity (Ratio 1.09):** Pay equity across all 4 levels is strong, with women earning at or slightly above market median relative to men in identical tiers.\n\n` +
          `**RECOMMENDED LEADERSHIP ACTIONS:**\n` +
          `• Enforce blind CV reviews for first-round shortlisting.\n` +
          `• Require diverse interview panels (≥1 female interviewer per panel).\n` +
          `• Conduct a calibration audit on stalled promotion cases in Engineering.`
        );
      }
    } catch {
      setAiNarrativeOutput(
        `**EXECUTIVE FAIRNESS AUDIT REPORT**\n\n` +
        `1. **Hiring Shortlisting Impact (Ratio 0.52):** The four-fifths rule indicates potential adverse impact during initial resume screening for technical and sales roles (Women 27% vs Men 53% shortlist rate).\n` +
        `2. **Promotion Parity (Ratio 0.72):** Over a 2-year window, female employees exhibit a 38% promotion rate compared to 53% for male peers, particularly in Engineering.\n` +
        `3. **Pay Parity (Ratio 1.09):** Pay equity across all 4 levels is strong, with women earning at or slightly above market median relative to men in identical tiers.\n\n` +
        `**RECOMMENDED LEADERSHIP ACTIONS:**\n` +
        `• Enforce blind CV reviews for first-round shortlisting.\n` +
        `• Require diverse interview panels (≥1 female interviewer per panel).\n` +
        `• Conduct a calibration audit on stalled promotion cases in Engineering.`
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
            Fairness Audit
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Check hiring, promotions and pay for bias across gender and age, using the four-fifths (adverse impact) rule.
          </p>
        </div>

        <button
          onClick={() => {
            setAiNarrativeOutput("");
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

      {/* Four-fifths Rule Explanation Banner */}
      <div style={{
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        borderRadius: 14,
        padding: "12px 16px",
        fontSize: 12.5,
        color: "#1E40AF",
        lineHeight: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 10
      }}>
        <Info style={{ width: 18, height: 18, color: "#2563EB", flexShrink: 0 }} />
        <div>
          <b>Four-fifths rule:</b> if one group's selection rate is below 80% of the most-selected group's rate, that's a sign of possible adverse impact worth investigating. It's a screening heuristic, not proof of bias, and small numbers can swing it.
        </div>
      </div>

      {/* Top 3 Ratio Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {/* Card 1: Hiring ratio */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#EF4444"
                strokeWidth="4"
                strokeDasharray="46 88" // 0.52
                strokeDashoffset="0"
              />
            </svg>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>0.52</span>
              <span style={{ fontSize: 7.5, fontWeight: 600, color: "#94A3B8" }}>hiring ratio</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Shortlisting</div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
              women 27% vs men 53%
            </div>
          </div>
        </div>

        {/* Card 2: Promotion ratio */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#EF4444"
                strokeWidth="4"
                strokeDasharray="63 88" // 0.72
                strokeDashoffset="0"
              />
            </svg>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>0.72</span>
              <span style={{ fontSize: 7.5, fontWeight: 600, color: "#94A3B8" }}>promotion ratio</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Promoted in 2 yrs</div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
              women 38% vs men 53%
            </div>
          </div>
        </div>

        {/* Card 3: Pay parity */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
            <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
              <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeDasharray="88 88" // 1.09
                strokeDashoffset="0"
              />
            </svg>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>1.09</span>
              <span style={{ fontSize: 7.5, fontWeight: 600, color: "#94A3B8" }}>pay parity</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Pay equity</div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 4 }}>
              Women's median pay-to-market vs men's, same level
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Shortlisting by Role (55%) & Promotion by Age + Pay Parity (45%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        {/* Shortlisting by Role Table Panel */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Shortlisting by role
            </h3>
            <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
              Reached interview stage or beyond
            </span>
          </div>

          <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em" }}>
                  <th style={{ padding: "10px 14px" }}>ROLE</th>
                  <th style={{ padding: "10px 14px" }}>WOMEN</th>
                  <th style={{ padding: "10px 14px" }}>MEN</th>
                  <th style={{ padding: "10px 14px" }}>RATIO</th>
                  <th style={{ padding: "10px 14px" }}>FLAG</th>
                </tr>
              </thead>
              <tbody style={{ color: "#334155" }}>
                {[
                  { role: "Senior Data Analyst", women: "33% (6)", men: "50% (2)", ratio: "0.67", impact: true },
                  { role: "Backend Engineer (SDE II)", women: "33% (3)", men: "60% (5)", ratio: "0.56", impact: true },
                  { role: "Product Designer", women: "33% (3)", men: "33% (3)", ratio: "1.00", impact: false },
                  { role: "Enterprise Account Executive", women: "0% (5)", men: "100% (1)", ratio: "0.00", impact: true },
                  { role: "HR Business Partner", women: "33% (3)", men: "100% (2)", ratio: "0.33", impact: true },
                  { role: "Customer Success Manager", women: "50% (2)", men: "50% (4)", ratio: "1.00", impact: false },
                ].map((row, idx) => (
                  <tr key={row.role} style={{ borderBottom: idx === 5 ? "none" : "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--ink)" }}>{row.role}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--f-mono)" }}>{row.women}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--f-mono)" }}>{row.men}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--f-mono)", fontWeight: 800 }}>{row.ratio}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: "3px 8px",
                        borderRadius: 99,
                        background: row.impact ? "#FEF2F2" : "#ECFDF5",
                        color: row.impact ? "#DC2626" : "#059669",
                        border: row.impact ? "1px solid #FECACA" : "1px solid #A7F3D0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        ● {row.impact ? "Adverse impact" : "OK"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Stack: Promotion Rate by Age & Pay Parity by Level */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Promotion Rate by Age Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Promotion rate by age
              </h3>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>
                Tenure ≥ 1.5 yrs
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
              {[
                { group: "Under 30 (49)", pct: 43 },
                { group: "30–39 (93)", pct: 59 },
                { group: "40+ (58)", pct: 60 },
              ].map((item) => (
                <div key={item.group} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", width: 100 }}>
                    {item.group}
                  </span>
                  <div style={{ flex: 1, height: 12, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                    <div style={{ width: `${item.pct}%`, height: "100%", background: "#F97316", borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--f-mono)", width: 28, textAlign: "right" }}>
                    {item.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pay Parity by Level Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Pay parity by level
              </h3>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>
                1.00 = equal
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
              {[
                { level: "Level 1 (24F / 28M)", ratio: "1.07" },
                { level: "Level 2 (53F / 42M)", ratio: "1.10" },
                { level: "Level 3 (14F / 18M)", ratio: "1.13" },
                { level: "Level 4 (10F / 7M)", ratio: "1.07" },
              ].map((item) => (
                <div key={item.level} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "#475569", width: 120 }}>
                    {item.level}
                  </span>
                  <div style={{ flex: 1, height: 12, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                    <div style={{ width: `${parseFloat(item.ratio) * 75}%`, height: "100%", background: "#10B981", borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--f-mono)", width: 28, textAlign: "right" }}>
                    {item.ratio}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recommended Actions (60%) & AI Fairness Narrative (40%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        {/* Recommended Actions Card */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            Recommended actions
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5, color: "#334155", lineHeight: 1.5 }}>
            <div>
              <b>1. Review shortlisting for Senior Data Analyst, Backend Engineer (SDE II), Enterprise Account Executive, HR Business Partner.</b> Use structured screening criteria and blind CV review for the first pass.
            </div>
            <div>
              <b>2. Promotion gap in Engineering;</b> check whether women's promotion cases stalled in calibration; publish the promotion criteria.
            </div>
            <div>
              <b>3.</b> Add at least one woman to every interview panel for Sales and Engineering roles.
            </div>
            <div>
              <b>4.</b> Re-run this audit after each hiring and appraisal cycle, and track trends rather than single snapshots.
            </div>
          </div>
        </div>

        {/* AI Fairness Narrative Card */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
              <Sparkles style={{ width: 17, height: 17, color: "#8B5CF6" }} />
              AI fairness narrative
            </div>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
              background: aiNarrativeOutput ? "#E0F2FE" : "#F1F5F9", color: aiNarrativeOutput ? "#0369A1" : "#64748B"
            }}>
              {aiNarrativeOutput ? "READY" : "WAITING"}
            </span>
          </div>

          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
            Generate an explanation suitable for the leadership team.
          </p>

          <button
            onClick={handleGenerateAiNarrative}
            disabled={loadingAi}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 99,
              background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
              border: "none",
              color: "#FFF",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: loadingAi ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)"
            }}
          >
            <Sparkles style={{ width: 14, height: 14 }} />
            Explain findings
          </button>

          {aiNarrativeOutput && (
            <div style={{
              background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
              fontSize: 13, color: "#334155", lineHeight: 1.6
            }}>
              {renderFormattedMarkdown(aiNarrativeOutput)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
