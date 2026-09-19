"use client";

import { useState } from "react";
import { Sparkles, Users, Wallet, Tag, Clock, ArrowUpRight } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

interface DeptGrowth {
  name: string;
  pct: number;
  today: number;
  newRoles: number;
  backfills: number;
  target: number;
  addedPayroll: string;
  barColor: string;
}

interface SkillGapItem {
  skill: string;
  team: string;
  need: number;
  have: number;
  gap: number;
  advice: "Buy" | "Build" | "Borrow";
}

const INITIAL_SKILLS_GAP: SkillGapItem[] = [
  { skill: "Enterprise Sales", team: "Sales", need: 9, have: 3, gap: -6, advice: "Buy" },
  { skill: "Machine Learning", team: "Data", need: 5, have: 1, gap: -4, advice: "Buy" },
  { skill: "AWS", team: "Engineering", need: 10, have: 7, gap: -3, advice: "Buy" },
  { skill: "Python", team: "Data", need: 8, have: 5, gap: -3, advice: "Build" },
  { skill: "FP&A", team: "Finance", need: 4, have: 1, gap: -3, advice: "Buy" },
  { skill: "A/B Testing", team: "Data", need: 4, have: 2, gap: -2, advice: "Build" },
  { skill: "Negotiation", team: "Sales", need: 8, have: 6, gap: -2, advice: "Build" },
  { skill: "Go", team: "Engineering", need: 5, have: 4, gap: -1, advice: "Build" },
  { skill: "dbt", team: "Data", need: 4, have: 3, gap: -1, advice: "Build" },
];

export default function WorkforcePlannerPage() {
  const [scenario, setScenario] = useState<"Steady" | "Aggressive growth" | "Cost freeze">("Aggressive growth");

  // Department Sliders (% growth)
  const [engPct, setEngPct] = useState(25);
  const [dataPct, setDataPct] = useState(30);
  const [prodPct, setProdPct] = useState(20);
  const [salesPct, setSalesPct] = useState(35);
  const [csPct, setCsPct] = useState(25);
  const [hrPct, setHrPct] = useState(25);
  const [finPct, setFinPct] = useState(20);

  // Global sliders
  const [attritionRate, setAttritionRate] = useState(15);
  const [agencyFee, setAgencyFee] = useState(8.33);
  const [recCapacity, setRecCapacity] = useState(3);

  const [aiNarrative, setAiNarrative] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Apply Scenario presets
  const applyPreset = (preset: "Steady" | "Aggressive growth" | "Cost freeze") => {
    setScenario(preset);
    if (preset === "Aggressive growth") {
      setEngPct(25); setDataPct(30); setProdPct(20); setSalesPct(35); setCsPct(25); setHrPct(25); setFinPct(20);
    } else if (preset === "Steady") {
      setEngPct(10); setDataPct(12); setProdPct(10); setSalesPct(15); setCsPct(10); setHrPct(10); setFinPct(10);
    } else {
      setEngPct(0); setDataPct(0); setProdPct(0); setSalesPct(0); setCsPct(0); setHrPct(0); setFinPct(0);
    }
  };

  // Departments Data Calculation based on Sliders
  const departments: DeptGrowth[] = [
    { name: "Engineering", pct: engPct, today: 70, newRoles: Math.round(70 * (engPct / 100)), backfills: 6, target: 70 + Math.round(70 * (engPct / 100)), addedPayroll: "₹2.80 Cr", barColor: "#2563EB" },
    { name: "Sales", pct: salesPct, today: 35, newRoles: Math.round(35 * (salesPct / 100)), backfills: 4, target: 35 + Math.round(35 * (salesPct / 100)), addedPayroll: "₹1.10 Cr", barColor: "#EC4899" },
    { name: "Data", pct: dataPct, today: 25, newRoles: Math.round(25 * (dataPct / 100)), backfills: 2, target: 25 + Math.round(25 * (dataPct / 100)), addedPayroll: "₹85.0 L", barColor: "#0EA5E9" },
    { name: "Customer Success", pct: csPct, today: 22, newRoles: Math.round(22 * (csPct / 100)), backfills: 2, target: 22 + Math.round(22 * (csPct / 100)), addedPayroll: "₹60.0 L", barColor: "#10B981" },
    { name: "Product", pct: prodPct, today: 20, newRoles: Math.round(20 * (prodPct / 100)), backfills: 2, target: 20 + Math.round(20 * (prodPct / 100)), addedPayroll: "₹72.0 L", barColor: "#8B5CF6" },
    { name: "Finance", pct: finPct, today: 14, newRoles: Math.round(14 * (finPct / 100)), backfills: 1, target: 14 + Math.round(14 * (finPct / 100)), addedPayroll: "₹35.0 L", barColor: "#64748B" },
    { name: "HR", pct: hrPct, today: 14, newRoles: Math.round(14 * (hrPct / 100)), backfills: 1, target: 14 + Math.round(14 * (hrPct / 100)), addedPayroll: "₹35.0 L", barColor: "#F97316" },
  ];

  const totalNewRoles = departments.reduce((acc, d) => acc + d.newRoles, 0);
  const totalBackfills = departments.reduce((acc, d) => acc + d.backfills, 0);
  const totalHires = totalNewRoles + totalBackfills;
  const totalCurrentPeople = departments.reduce((acc, d) => acc + d.today, 0);
  const totalTargetPeople = totalCurrentPeople + totalNewRoles;
  const addedPayrollCr = ((totalNewRoles * 14.5) / 100).toFixed(2);
  const recruitingSpendL = ((totalHires * 14.5 * (agencyFee / 100))).toFixed(1);

  const handleGenerateNarrative = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Draft a 1-page executive workforce plan narrative for leadership. Scenario: ${scenario}. Total Hires Needed: ${totalHires} (${totalNewRoles} new + ${totalBackfills} backfills). Total Headcount Growth: ${totalCurrentPeople} -> ${totalTargetPeople} people. Added Annual Payroll: ₹${addedPayrollCr} Cr. Recruiting Spend: ₹${recruitingSpendL} L (agency fee ${agencyFee}%). Time to staff: 6 months. Include strategic priorities for key skill gaps (Enterprise Sales, Machine Learning, AWS).`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiNarrative(json.reply);
      } else {
        setAiNarrative(
          `**EXECUTIVE WORKFORCE PLAN — ${scenario.toUpperCase()}**\n\n` +
          `1. **Headcount & Capacity:** Total workforce targets expanding from **${totalCurrentPeople} to ${totalTargetPeople} people** (+${totalNewRoles} new positions, +${totalBackfills} backfills).\n` +
          `2. **Financial Investment:** Added annual payroll commitment of **₹${addedPayrollCr} Cr**, with estimated recruiting expenditure of **₹${recruitingSpendL} L** across 6 months.\n` +
          `3. **Key Strategic Gap Focus:** Prioritize hiring for Enterprise Sales and Machine Learning while building internal capability for Python and FP&A.`
        );
      }
    } catch {
      setAiNarrative(
        `**EXECUTIVE WORKFORCE PLAN — ${scenario.toUpperCase()}**\n\n` +
        `1. **Headcount & Capacity:** Total workforce targets expanding from **${totalCurrentPeople} to ${totalTargetPeople} people** (+${totalNewRoles} new positions, +${totalBackfills} backfills).\n` +
        `2. **Financial Investment:** Added annual payroll commitment of **₹${addedPayrollCr} Cr**, with estimated recruiting expenditure of **₹${recruitingSpendL} L** across 6 months.\n` +
        `3. **Key Strategic Gap Focus:** Prioritize hiring for Enterprise Sales and Machine Learning while building internal capability for Python and FP&A.`
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#3B82F6", textTransform: "uppercase", marginBottom: 2 }}>
            — PLAN & BUDGET
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
            Workforce Planner
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Model headcount, payroll and recruiting capacity for the next 4 quarters.
          </p>
        </div>

        <button
          onClick={() => applyPreset("Aggressive growth")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 99,
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            color: "#1D4ED8",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <Sparkles style={{ width: 14, height: 14, color: "#2563EB" }} />
          Try with demo data
        </button>
      </div>

      {/* Top 4 KPI Metric Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {/* Card 1: Hires needed */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#10B981" }}>
            <Users style={{ width: 16, height: 16, color: "#10B981" }} />
            Hires needed
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{totalHires}</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            {totalNewRoles} new + {totalBackfills} backfills
          </div>
        </div>

        {/* Card 2: Added annual payroll */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#2563EB" }}>
            <Wallet style={{ width: 16, height: 16, color: "#3B82F6" }} />
            Added annual payroll
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>₹{addedPayrollCr} <small style={{ fontSize: 15, fontWeight: 700, color: "#64748B" }}>Cr</small></span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            New roles only
          </div>
        </div>

        {/* Card 3: Recruiting spend */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#D97706" }}>
            <Tag style={{ width: 16, height: 16, color: "#F59E0B" }} />
            Recruiting spend
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>₹{recruitingSpendL} <small style={{ fontSize: 15, fontWeight: 700, color: "#64748B" }}>L</small></span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            At {agencyFee}% agency fee
          </div>
        </div>

        {/* Card 4: Time to staff */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#EC4899" }}>
            <Clock style={{ width: 16, height: 16, color: "#EC4899" }} />
            Time to staff
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>6 <small style={{ fontSize: 14, fontWeight: 700, color: "#64748B" }}>months</small></span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            {totalCurrentPeople} → {totalTargetPeople} people
          </div>
        </div>
      </div>

      {/* Main Grid: Left Scenario Inputs (30%) & Right Charts/Tables (70%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.3fr", gap: 20 }}>
        {/* Left Column: Preset & Department Sliders */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>
                Scenario
              </label>

              {/* Preset Scenario Pills */}
              <div style={{ display: "flex", gap: 4, background: "#F1F5F9", padding: 3, borderRadius: 99 }}>
                {(["Steady", "Aggressive growth", "Cost freeze"] as const).map((p) => {
                  const active = scenario === p;
                  return (
                    <button
                      key={p}
                      onClick={() => applyPreset(p)}
                      style={{
                        flex: 1,
                        padding: "5px 8px",
                        borderRadius: 99,
                        border: "none",
                        background: active ? "#FFF" : "transparent",
                        color: active ? "var(--ink)" : "#64748B",
                        fontSize: 11.5,
                        fontWeight: active ? 800 : 500,
                        cursor: "pointer",
                        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none"
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Growth By Team Sliders */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                GROWTH BY TEAM (NEXT 12 MONTHS)
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Engineering", val: engPct, setter: setEngPct },
                  { label: "Data", val: dataPct, setter: setDataPct },
                  { label: "Product", val: prodPct, setter: setProdPct },
                  { label: "Sales", val: salesPct, setter: setSalesPct },
                  { label: "Customer Success", val: csPct, setter: setCsPct },
                  { label: "HR", val: hrPct, setter: setHrPct },
                  { label: "Finance", val: finPct, setter: setFinPct },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
                      <span>{item.label}</span>
                      <span style={{ color: "#10B981", fontWeight: 700, fontFamily: "var(--f-mono)" }}>+{item.val}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      step="5"
                      value={item.val}
                      onChange={(e) => item.setter(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#10B981", cursor: "pointer" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Global Parameters */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Expected Attrition */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
                  <span>Expected attrition</span>
                  <span style={{ fontWeight: 700, fontFamily: "var(--f-mono)" }}>{attritionRate}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={attritionRate}
                  onChange={(e) => setAttritionRate(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#10B981", cursor: "pointer" }}
                />
                <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2 }}>
                  Default 15% comes from the attrition model
                </div>
              </div>

              {/* Agency Fee */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
                  <span>Agency fee (% of CTC)</span>
                  <span style={{ fontWeight: 700, fontFamily: "var(--f-mono)" }}>{agencyFee}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="0.5"
                  value={agencyFee}
                  onChange={(e) => setAgencyFee(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#10B981", cursor: "pointer" }}
                />
              </div>

              {/* Recruiting Capacity */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "var(--ink)" }}>
                  <span>Recruiting capacity</span>
                  <span style={{ fontWeight: 700, fontFamily: "var(--f-mono)" }}>{recCapacity} hires / month</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={recCapacity}
                  onChange={(e) => setRecCapacity(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#10B981", cursor: "pointer" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Headcount Plan Chart, Breakdown Table, Skills Matrix */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Row: Headcount Plan Line Chart & Hires by Team Bars */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
            {/* Card 1: Headcount Plan Line Chart */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                  Headcount plan
                </h3>
                <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500 }}>
                  Solid = actual · dashed = plan
                </span>
              </div>

              {/* SVG Line Chart */}
              <div style={{ position: "relative", width: "100%", height: 140 }}>
                <svg viewBox="0 0 300 120" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="300" y2="30" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="60" x2="300" y2="60" stroke="#F1F5F9" strokeWidth="1" />
                  <line x1="0" y1="90" x2="300" y2="90" stroke="#F1F5F9" strokeWidth="1" />

                  {/* Area Fill Under Actual Curve */}
                  <polygon
                    points="0,95 40,88 80,78 120,60 120,120 0,120"
                    fill="url(#greenGradient)"
                    opacity="0.2"
                  />

                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Solid Actual Line */}
                  <path
                    d="M 0,95 L 40,88 L 80,78 L 120,60"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                  />

                  {/* Current Active Dot */}
                  <circle cx="120" cy="60" r="4" fill="#10B981" stroke="#FFF" strokeWidth="2" />

                  {/* Dashed Planned Line */}
                  <path
                    d="M 120,60 L 160,52 L 200,44 L 240,36 L 280,26"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <circle cx="280" cy="26" r="3" fill="#10B981" />
                </svg>

                {/* X Axis Labels */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "#94A3B8", fontWeight: 600, marginTop: 4 }}>
                  <span>Q3'25</span>
                  <span>Q4'25</span>
                  <span>Q1'26</span>
                  <span>Q2'26</span>
                  <span>Q3'26</span>
                  <span>Q4'26</span>
                  <span>Q1'27</span>
                  <span>Q2'27</span>
                </div>
              </div>
            </div>

            {/* Card 2: Hires by Team Breakdown */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Hires by team
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  { name: "Engineering", hires: 9, color: "#2563EB" },
                  { name: "Sales", hires: 6, color: "#EC4899" },
                  { name: "Data", hires: 3, color: "#0EA5E9" },
                  { name: "Customer Success", hires: 3, color: "#10B981" },
                  { name: "Product", hires: 2, color: "#8B5CF6" },
                  { name: "HR", hires: 2, color: "#F97316" },
                  { name: "Finance", hires: 2, color: "#64748B" },
                ].map((item) => (
                  <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#475569", width: 90, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </span>
                    <div style={{ flex: 1, height: 10, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                      <div style={{ width: `${(item.hires / 10) * 100}%`, height: "100%", background: item.color, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--ink)", width: 14, textAlign: "right" }}>
                      {item.hires}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Department Headcount Breakdown Table */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em" }}>
                    <th style={{ padding: "10px 14px" }}>TEAM</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>TODAY</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>NEW ROLES</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>BACKFILLS</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>TARGET</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>ADDED PAYROLL</th>
                  </tr>
                </thead>
                <tbody style={{ color: "#334155" }}>
                  {departments.map((row, idx) => (
                    <tr key={row.name} style={{ borderBottom: idx === departments.length - 1 ? "none" : "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--ink)" }}>{row.name}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{row.today}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{row.newRoles}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{row.backfills}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 800, color: "var(--ink)" }}>{row.target}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 700 }}>{row.addedPayroll}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Table: Skills gap → build, buy or borrow */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Skills gap → build, buy or borrow
              </h3>
              <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
                Demand next year vs people who have the skill today
              </span>
            </div>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em" }}>
                    <th style={{ padding: "10px 14px" }}>SKILL</th>
                    <th style={{ padding: "10px 14px" }}>TEAM</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>NEED</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>HAVE</th>
                    <th style={{ padding: "10px 14px" }}>GAP</th>
                    <th style={{ padding: "10px 14px" }}>ADVICE</th>
                  </tr>
                </thead>
                <tbody style={{ color: "#334155" }}>
                  {INITIAL_SKILLS_GAP.map((row, idx) => (
                    <tr key={row.skill} style={{ borderBottom: idx === INITIAL_SKILLS_GAP.length - 1 ? "none" : "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--ink)" }}>{row.skill}</td>
                      <td style={{ padding: "10px 14px", color: "#64748B" }}>{row.team}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{row.need}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{row.have}</td>
                      
                      {/* Gap Visual Bar Column */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: row.gap <= -4 ? "#EF4444" : "#D97706", width: 18, textAlign: "right" }}>
                            {row.gap}
                          </span>
                          <div style={{ width: 80, height: 6, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                            <div style={{
                              width: `${Math.min(100, Math.abs(row.gap) * 15)}%`,
                              height: "100%",
                              background: row.gap <= -3 ? "#EF4444" : "#F59E0B",
                              borderRadius: 99
                            }} />
                          </div>
                        </div>
                      </td>

                      {/* Strategy Advice Pill */}
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 99,
                          background: row.advice === "Buy" ? "#FEF2F2" : "#EFF6FF",
                          color: row.advice === "Buy" ? "#DC2626" : "#2563EB",
                          border: row.advice === "Buy" ? "1px solid #FECACA" : "1px solid #BFDBFE",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}>
                          ● {row.advice}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plan Narrative AI Copilot Generator Box */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 17, height: 17, color: "#EC4899" }} />
                Plan narrative for leadership
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
                background: aiNarrative ? "#E0F2FE" : "#F1F5F9", color: aiNarrative ? "#0369A1" : "#64748B"
              }}>
                {aiNarrative ? "READY" : "WAITING"}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
              Generate a one-page summary of this scenario.
            </p>

            <button
              onClick={handleGenerateNarrative}
              disabled={loadingAi}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 18px",
                borderRadius: 99,
                background: "linear-gradient(135deg, #EC4899 0%, #F97316 100%)",
                border: "none",
                color: "#FFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: loadingAi ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(236, 72, 153, 0.3)"
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              Write leadership summary
            </button>

            {aiNarrative && (
              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
                fontSize: 13, color: "#334155", lineHeight: 1.6
              }}>
                {renderFormattedMarkdown(aiNarrative)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
