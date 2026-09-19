"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Users,
  Briefcase,
  AlertTriangle,
  Clock,
  Wallet,
  Heart,
  ArrowRight,
  Play,
  TrendingUp,
  ShieldAlert,
  Search,
  ChevronRight
} from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

export default function CommandCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiBriefing, setAiBriefing] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/team-pulse/dashboard");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleRewriteBriefing = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "Write a crisp morning briefing (5 bullets, bold key numbers) for the HR head of Rocket India." }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiBriefing(json.reply);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "var(--muted)" }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>Loading Command Center analytics…</div>
      </div>
    );
  }

  // Headcount growth chart SVG data points
  // Quarters: Q3'24, Q4'24, Q1'25, Q2'25, Q3'25, Q4'25, Q1'26, Q2'26, Q3'26, Q4'26
  // Chart dimensions: W=520, H=160
  const count = data?.headcount || 200;
  const yMin = 100, yMax = 260;
  const getY = (val: number) => 150 - ((val - yMin) / (yMax - yMin)) * 120;
  const getX = (idx: number) => 25 + idx * 53;

  const historicalVals = [110, 125, 140, 155, 170, 182, 192, count]; // idx 0 to 7
  const projectionVals = [count, Math.round(count * 1.10), Math.round(count * 1.25)]; // idx 7, 8, 9

  const solidPoints = historicalVals.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const projectedPoints = projectionVals.map((v, i) => `${getX(i + 7)},${getY(v)}`).join(" ");
  const areaPoints = `25,150 ${solidPoints} ${getX(7)},150`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* Overview Sub-Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 2 }}>
            — OVERVIEW
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
            Command Center
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Your whole workforce at a glance, plus an AI briefing of what needs attention today.
          </p>
        </div>

        <button
          onClick={() => alert("Loaded Rocket India live workforce metrics!")}
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

      {/* Hero Section: 2 Columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "stretch" }}>
        {/* Left Hero Card */}
        <div className="tp-panel" style={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px -6px rgba(15, 21, 51, 0.06)"
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 10 }}>
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })} · {data?.organization?.city || "Bengaluru"}
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.15, color: "var(--ink)", letterSpacing: "-0.025em", margin: "0 0 12px 0" }}>
              {getTimeGreeting()}. Here's your workforce today.
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13.5, color: "var(--ink2)", fontWeight: 500 }}>
                <b>{data?.organization?.legalName || "Arcadia Softworks Pvt Ltd"}</b> · {count} people · 7 teams · {data?.openRolesCount || 4} open roles
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 99,
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                color: "#64748B"
              }}>
                Live data
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => alert("Starting guided tour of Team Pulse Command Center...")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 99,
                background: "linear-gradient(135deg, #FF5722 0%, #F44336 100%)",
                border: "none",
                color: "#FFFFFF",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(244, 67, 54, 0.35)"
              }}
            >
              <Play style={{ width: 14, height: 14, fill: "#FFF" }} />
              Start the demo tour
            </button>

            <Link
              href="/team-pulse/copilot"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 18px",
                borderRadius: 99,
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#1E293B",
                fontSize: 13.5,
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
              }}
            >
              <Sparkles style={{ width: 15, height: 15, color: "var(--violet)" }} />
              Ask HR Copilot
            </Link>
          </div>
        </div>

        {/* Right Hero Card ("Today's briefing") */}
        <div className="tp-panel" style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,243,255,0.85) 100%)",
          border: "1px solid #E9D5FF",
          borderRadius: 20,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 4px 20px -4px rgba(139, 92, 246, 0.1)"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 17, height: 17, color: "var(--violet)" }} />
                Today's briefing
              </div>
              <span style={{ fontFamily: "var(--f-mono)", fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em" }}>
                AUTO SUMMARY
              </span>
            </div>

            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: 8 }}>
              {aiBriefing ? (
                renderFormattedMarkdown(aiBriefing)
              ) : (
                renderFormattedMarkdown(
                  `• **Headcount & Open Requisitions:** Current headcount is **${count} employees** with **${data?.openRolesCount || 4} open roles** across Engineering, Product, Data, and Sales.\n` +
                  `• **High Flight Risk:** **${data?.highRiskCount || 13} employees** flagged as high flight risk. Targeted pay correction recommended for critical staff.\n` +
                  `• **Internal Mobility:** **3 internal nominations** pending review for Senior Data Analyst & Customer Success.\n` +
                  `• **Statutory Compliance:** **26 employees overdue on POSH training**; Bengaluru fire drill overdue 18 days.\n` +
                  `• **Team Sentiment:** Overall Happiness Index is **70/100** (eNPS +18), with Engineering on-call burnout needing manager intervention.`
                )
              )}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <button
              onClick={handleRewriteBriefing}
              disabled={aiLoading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                borderRadius: 99,
                background: "linear-gradient(135deg, #A855F7 0%, #9333EA 100%)",
                border: "none",
                color: "#FFFFFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: aiLoading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 10px rgba(168, 85, 247, 0.3)"
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              {aiLoading ? "Generating AI briefing…" : "Rewrite with AI"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (6 Cards) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 14 }}>
        {/* Card 1: Headcount */}
        <div className="tp-kpi" style={{ borderRadius: 16, padding: "16px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}>
            <Users style={{ width: 16, height: 16, color: "#06B6D4" }} /> Headcount
          </div>
          <div className="tp-kpi-val" style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            {data?.headcount || 200}
          </div>
          <div style={{ fontSize: 12, color: "#10B981", fontWeight: 700, marginTop: 2 }}>
            <b>+18</b> this quarter
          </div>
        </div>

        {/* Card 2: Open roles */}
        <div className="tp-kpi" style={{ borderRadius: 16, padding: "16px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}>
            <Search style={{ width: 16, height: 16, color: "#3B82F6" }} /> Open roles
          </div>
          <div className="tp-kpi-val" style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            {data?.openRolesCount || 4}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            {data?.funnel?.[0]?.value || 39} candidates in pipeline
          </div>
        </div>

        {/* Card 3: High flight risk */}
        <div className="tp-kpi" style={{ borderRadius: 16, padding: "16px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#EF4444" }} /> High flight risk
          </div>
          <div className="tp-kpi-val" style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: "#EF4444" }}>
            {data?.highRiskCount || 13}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            ₹{data?.highRiskCostCr || "1.33"} Cr replacement cost
          </div>
        </div>

        {/* Card 4: Avg time to fill */}
        <div className="tp-kpi" style={{ borderRadius: 16, padding: "16px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}>
            <Clock style={{ width: 16, height: 16, color: "#F97316" }} /> Avg time to fill
          </div>
          <div className="tp-kpi-val" style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            {data?.avgTimeToFillDays || 34} <small style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>days</small>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Longest: 52 days
          </div>
        </div>

        {/* Card 5: Monthly payroll */}
        <div className="tp-kpi" style={{ borderRadius: 16, padding: "16px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}>
            <Wallet style={{ width: 16, height: 16, color: "#10B981" }} /> Monthly payroll
          </div>
          <div className="tp-kpi-val" style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            ₹{data?.payrollMonthlyCr || "2.65"} <small style={{ fontSize: 14, fontWeight: 600, color: "var(--muted)" }}>Cr</small>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Annual CTC ₹{data?.payrollAnnualCr || "31.78"} Cr
          </div>
        </div>

        {/* Card 6: eNPS */}
        <div className="tp-kpi" style={{ borderRadius: 16, padding: "16px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", display: "flex", alignItems: "center", gap: 7 }}>
            <Heart style={{ width: 16, height: 16, color: "#EC4899" }} /> eNPS
          </div>
          <div className="tp-kpi-val" style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
            {data?.eNPS || "+18"}
          </div>
          <div style={{ fontSize: 12, color: "#10B981", fontWeight: 700, marginTop: 2 }}>
            <b>+3</b> vs last month
          </div>
        </div>
      </div>

      {/* Middle Section: Headcount Growth & People by Team (Grid 1.6fr 1fr) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* Headcount Growth Line Chart Card */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>Headcount growth</h3>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
              Quarterly — dashed = hiring plan
            </span>
          </div>

          {/* Pure SVG Line Chart */}
          <div style={{ width: "100%", height: 210, position: "relative" }}>
            <svg viewBox="0 0 540 180" style={{ width: "100%", height: "100%", overflow: "visible" }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y Axis Grid Lines */}
              {[250, 210, 175, 140, 100].map((val) => {
                const y = getY(val);
                return (
                  <g key={val}>
                    <line x1="25" y1={y} x2="510" y2={y} stroke="#F1F5F9" strokeWidth="1" />
                    <text x="18" y={y + 4} textAnchor="end" fontSize="10" fill="#94A3B8" fontWeight="500">
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area Under Solid Curve */}
              <polygon points={areaPoints} fill="url(#chartGradient)" />

              {/* Solid Line (Historical) */}
              <polyline
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={solidPoints}
              />

              {/* Dashed Line (Projection) */}
              <polyline
                fill="none"
                stroke="#0EA5E9"
                strokeWidth="2.5"
                strokeDasharray="5,5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={projectedPoints}
              />

              {/* Historical Nodes */}
              {historicalVals.map((v, i) => (
                <circle
                  key={i}
                  cx={getX(i)}
                  cy={getY(v)}
                  r={i === 7 ? 6 : 3.5}
                  fill={i === 7 ? "#0284C7" : "#0EA5E9"}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              ))}

              {/* Highlighted Value Badge at Q2 '26 */}
              <g transform={`translate(${getX(7) - 16}, ${getY(count) - 26})`}>
                <rect width="36" height="18" rx="5" fill="#0284C7" />
                <text x="18" y="13" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFF">
                  {count}
                </text>
              </g>

              {/* Projected Nodes (Hollow) */}
              {projectionVals.slice(1).map((v, i) => (
                <circle
                  key={i}
                  cx={getX(i + 8)}
                  cy={getY(v)}
                  r="4.5"
                  fill="#FFFFFF"
                  stroke="#0EA5E9"
                  strokeWidth="2.5"
                />
              ))}

              {/* X Axis Labels */}
              {[
                "Q3 '24", "Q4 '24", "Q1 '25", "Q2 '25", "Q3 '25",
                "Q4 '25", "Q1 '26", "Q2 '26", "Q3 '26", "Q4 '26"
              ].map((label, idx) => (
                <text
                  key={label}
                  x={getX(idx)}
                  y="170"
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight={idx === 7 ? "700" : "500"}
                  fill={idx === 7 ? "#0284C7" : "#64748B"}
                >
                  {label}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* People by Team Progress Bar Card */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>People by team</h3>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{data?.headcount || 200} total</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {[
              { team: "Engineering", count: data?.departmentCounts?.["Engineering"] || 70, color: "#3B82F6" },
              { team: "Sales", count: data?.departmentCounts?.["Sales"] || 35, color: "#EC4899" },
              { team: "Data", count: data?.departmentCounts?.["Data"] || 25, color: "#06B6D4" },
              { team: "Customer Success", count: data?.departmentCounts?.["Customer Success"] || 22, color: "#10B981" },
              { team: "Product", count: data?.departmentCounts?.["Product"] || 20, color: "#8B5CF6" },
              { team: "Finance", count: data?.departmentCounts?.["Finance"] || 14, color: "#64748B" },
              { team: "HR", count: data?.departmentCounts?.["HR"] || 14, color: "#F97316" },
            ].map((item) => {
              const total = data?.headcount || 200;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={item.team} style={{ display: "grid", gridTemplateColumns: "130px 1fr 30px", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{item.team}</span>
                  <div style={{ height: 9, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ width: `${Math.min(100, pct * 2.2)}%`, height: "100%", background: item.color, borderRadius: 99 }} />
                  </div>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: 12.5, fontWeight: 700, color: "var(--ink)", textAlign: "right" }}>
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower Section: 3 Columns Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {/* Card 1: Flight Risk Donut */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>Flight risk</h3>
            <Link href="/team-pulse/attrition-radar" style={{ fontSize: 12, color: "#0284C7", fontWeight: 700, textDecoration: "none" }}>
              Open radar →
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
            {/* SVG Donut Chart */}
            <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
              {(() => {
                const total = data?.headcount || 200;
                const high = data?.highRiskCount || 13;
                const med = data?.medRiskCount || 51;
                const low = data?.lowRiskCount || 136;
                const lowArc = (low / total) * 88;
                const medArc = (med / total) * 88;
                const highArc = (high / total) * 88;

                return (
                  <>
                    <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                      {/* Background Ring */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4.5" />
                      {/* Low Risk Segment */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#10B981" strokeWidth="4.5" strokeDasharray={`${lowArc} 88`} strokeDashoffset="0" />
                      {/* Medium Risk Segment */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#F97316" strokeWidth="4.5" strokeDasharray={`${medArc} 88`} strokeDashoffset={`-${lowArc}`} />
                      {/* High Risk Segment */}
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#EF4444" strokeWidth="4.5" strokeDasharray={`${highArc} 88`} strokeDashoffset={`-${lowArc + medArc}`} />
                    </svg>
                    <div style={{
                      position: "absolute",
                      top: 0, left: 0, right: 0, bottom: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center"
                    }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{high}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", marginTop: 2 }}>high risk</span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, color: "#334155" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: "#EF4444" }} />
                  High risk
                </span>
                <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700 }}>{data?.highRiskCount || 13}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, color: "#334155" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: "#F97316" }} />
                  Medium
                </span>
                <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700 }}>{data?.medRiskCount || 51}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 600, color: "#334155" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: "#10B981" }} />
                  Low
                </span>
                <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700 }}>{data?.lowRiskCount || 136}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Hiring Funnel */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>Hiring funnel</h3>
            <Link href="/team-pulse/sourcing" style={{ fontSize: 12, color: "#0284C7", fontWeight: 700, textDecoration: "none" }}>
              Source →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {[
              { label: "Sourced", count: 39, percent: 100 },
              { label: "Screening", count: 27, percent: 69 },
              { label: "Interview", count: 15, percent: 38 },
              { label: "Offer", count: 7, percent: 18 },
              { label: "Accepted", count: 3, percent: 8 },
            ].map((stage) => (
              <div key={stage.label} style={{ display: "grid", gridTemplateColumns: "80px 1fr 24px", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "#475569" }}>{stage.label}</span>
                <div style={{ height: 9, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${stage.percent}%`, height: "100%", background: "#2563EB", borderRadius: 99 }} />
                </div>
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 700, color: "var(--ink)", textAlign: "right" }}>
                  {stage.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Happiness by Team */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>Happiness by team</h3>
            <Link href="/team-pulse/personality" style={{ fontSize: 12, color: "#0284C7", fontWeight: 700, textDecoration: "none" }}>
              Details →
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { team: "Engineering", score: 57, color: "#EF4444" },
              { team: "Data", score: 62, color: "#F97316" },
              { team: "Product", score: 76, color: "#10B981" },
              { team: "Sales", score: 66, color: "#F59E0B" },
              { team: "Customer Success", score: 75, color: "#10B981" },
              { team: "HR", score: 81, color: "#059669" },
              { team: "Finance", score: 70, color: "#10B981" },
            ].map((item) => (
              <div key={item.team} style={{ display: "grid", gridTemplateColumns: "115px 1fr 24px", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{item.team}</span>
                <div style={{ height: 8, background: "#F1F5F9", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${item.score}%`, height: "100%", background: item.color, borderRadius: 99 }} />
                </div>
                <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 700, color: "var(--ink)", textAlign: "right" }}>
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: "Needs your attention" Action List */}
      <div className="tp-panel" style={{ borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>Needs your attention</h3>
          <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>Click any item to act on it</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Action Item 1 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderRadius: 14,
            background: "#FFFFFF",
            border: "1px solid var(--line)",
            transition: "all 0.15s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#FEF2F2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EF4444",
                flexShrink: 0
              }}>
                <AlertTriangle style={{ width: 19, height: 19 }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  9 high performers at high flight risk
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                  Kavya Reddy, Rohan Mehta, Arjun Nair. Mostly underpaid vs market.
                </div>
              </div>
            </div>
            <Link
              href="/team-pulse/attrition-radar"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: 99,
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "var(--ink)",
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              Review <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          {/* Action Item 2 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderRadius: 14,
            background: "#FFFFFF",
            border: "1px solid var(--line)",
            transition: "all 0.15s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#FDF2F8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EC4899",
                flexShrink: 0
              }}>
                <TrendingUp style={{ width: 19, height: 19 }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  17 people are promotion-ready
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                  Appraisal cycle closes in 19 days. 7 people on the PIP watchlist.
                </div>
              </div>
            </div>
            <Link
              href="/team-pulse/performance"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: 99,
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "var(--ink)",
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              Review <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          {/* Action Item 3 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderRadius: 14,
            background: "#FFFFFF",
            border: "1px solid var(--line)",
            transition: "all 0.15s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#FFF7ED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#F97316",
                flexShrink: 0
              }}>
                <ShieldAlert style={{ width: 19, height: 19 }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  26 employees have overdue mandatory training
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                  POSH overdue for 12 · fire drill 18 days overdue · fire NOC expires in 21 days
                </div>
              </div>
            </div>
            <Link
              href="/team-pulse/compliance"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: 99,
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "var(--ink)",
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              Fix <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          {/* Action Item 4 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderRadius: 14,
            background: "#FFFFFF",
            border: "1px solid var(--line)",
            transition: "all 0.15s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#3B82F6",
                flexShrink: 0
              }}>
                <Search style={{ width: 19, height: 19 }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  Backend Engineer open for 52 days
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                  Pipeline is thin at Interview stage. Try internal mobility or widen notice-period filter.
                </div>
              </div>
            </div>
            <Link
              href="/team-pulse/sourcing"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: 99,
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "var(--ink)",
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              Source <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>

          {/* Action Item 5 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderRadius: 14,
            background: "#FFFFFF",
            border: "1px solid var(--line)",
            transition: "all 0.15s ease"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#F5F3FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#8B5CF6",
                flexShrink: 0
              }}>
                <Heart style={{ width: 19, height: 19 }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                  Burnout signal in Engineering
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>
                  Happiness 70 → 57 since April; on-call and weekend work are the top themes.
                </div>
              </div>
            </div>
            <Link
              href="/team-pulse/personality"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 14px",
                borderRadius: 99,
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "var(--ink)",
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              See why <ArrowRight style={{ width: 13, height: 13 }} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
