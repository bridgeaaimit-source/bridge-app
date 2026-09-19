"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, Wallet, Users, Info, Check } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

interface EmployeeRisk {
  id: string;
  initials: string;
  name: string;
  role: string;
  dept: string;
  riskScore: number;
  riskLevel: "high" | "med" | "low";
  tenure: string;
  reasons: string[];
  rating: string;
  avatarBg: string;
  whyDrivers: { label: string; pts: number; color: string }[];
  ctc: string;
  marketCtc: string;
  costToReplace: string;
  costToFixPay: string;
}

const EMPLOYEES_RISK: EmployeeRisk[] = [
  {
    id: "kavya",
    initials: "KR",
    name: "Kavya Reddy",
    role: "Senior Software Engineer",
    dept: "Engineering",
    riskScore: 85,
    riskLevel: "high",
    tenure: "2.8 yrs tenure",
    reasons: ["Low engagement (2.6/5)", "Paid 17% below market"],
    rating: "4/5",
    avatarBg: "#2563EB",
    whyDrivers: [
      { label: "Low engagement (2.6/5)", pts: 22, color: "#EF4444" },
      { label: "Paid 17% below market", pts: 18, color: "#F59E0B" },
      { label: "Overtime 48 hrs/week", pts: 12, color: "#F59E0B" },
      { label: "High performer, likely poaching target", pts: 8, color: "#10B981" },
    ],
    ctc: "₹18.0 L",
    marketCtc: "₹21.5 L",
    costToReplace: "₹9.0 L",
    costToFixPay: "₹2.4 L / yr",
  },
  {
    id: "rohan",
    initials: "RM",
    name: "Rohan Mehta",
    role: "Senior Data Analyst",
    dept: "Data",
    riskScore: 81,
    riskLevel: "high",
    tenure: "3.9 yrs tenure",
    reasons: ["Low engagement (2.4/5)", "No promotion in 3.4 yrs"],
    rating: "5/5",
    avatarBg: "#0EA5E9",
    whyDrivers: [
      { label: "Low engagement (2.4/5)", pts: 20, color: "#EF4444" },
      { label: "No promotion in 3.4 yrs", pts: 16, color: "#F59E0B" },
      { label: "Paid 17% below market", pts: 15, color: "#F59E0B" },
      { label: "Overtime 52 hrs/week", pts: 12, color: "#F59E0B" },
      { label: "High performer, likely poaching target", pts: 8, color: "#10B981" },
      { label: "New manager this year", pts: 4, color: "#10B981" },
    ],
    ctc: "₹12.4 L",
    marketCtc: "₹15.0 L",
    costToReplace: "₹6.2 L",
    costToFixPay: "₹1.8 L / yr",
  },
  {
    id: "arjun",
    initials: "AN",
    name: "Arjun Nair",
    role: "Sales Development Rep",
    dept: "Sales",
    riskScore: 88,
    riskLevel: "high",
    tenure: "3.0 yrs tenure",
    reasons: ["Paid 18% below market", "No promotion in 3.0 yrs"],
    rating: "5/5",
    avatarBg: "#EF4444",
    whyDrivers: [
      { label: "Paid 18% below market", pts: 24, color: "#EF4444" },
      { label: "No promotion in 3.0 yrs", pts: 18, color: "#F59E0B" },
      { label: "Overtime 54 hrs/week", pts: 14, color: "#F59E0B" },
      { label: "Low engagement (2.5/5)", pts: 12, color: "#F59E0B" },
    ],
    ctc: "₹8.5 L",
    marketCtc: "₹10.4 L",
    costToReplace: "₹4.2 L",
    costToFixPay: "₹1.3 L / yr",
  },
  {
    id: "aditya",
    initials: "AP",
    name: "Aditya Patel",
    role: "Associate Product Manager",
    dept: "Product",
    riskScore: 76,
    riskLevel: "high",
    tenure: "3.3 yrs tenure",
    reasons: ["Paid 23% below market", "Low engagement (2.4/5)"],
    rating: "5/5",
    avatarBg: "#8B5CF6",
    whyDrivers: [
      { label: "Paid 23% below market", pts: 26, color: "#EF4444" },
      { label: "Low engagement (2.4/5)", pts: 20, color: "#F59E0B" },
      { label: "No promotion in 3.3 yrs", pts: 15, color: "#F59E0B" },
    ],
    ctc: "₹11.0 L",
    marketCtc: "₹14.3 L",
    costToReplace: "₹5.5 L",
    costToFixPay: "₹2.5 L / yr",
  },
  {
    id: "gaurav",
    initials: "GS",
    name: "Gaurav Sharma",
    role: "Sales Development Rep",
    dept: "Sales",
    riskScore: 68,
    riskLevel: "med",
    tenure: "1.8 yrs tenure",
    reasons: ["Paid 22% below market", "Low engagement (2.6/5)"],
    rating: "2/5",
    avatarBg: "#EC4899",
    whyDrivers: [
      { label: "Paid 22% below market", pts: 22, color: "#F59E0B" },
      { label: "Low engagement (2.6/5)", pts: 18, color: "#F59E0B" },
    ],
    ctc: "₹7.5 L",
    marketCtc: "₹9.6 L",
    costToReplace: "₹3.8 L",
    costToFixPay: "₹1.6 L / yr",
  },
  {
    id: "karan",
    initials: "KG",
    name: "Karan Ghosh",
    role: "Sales Development Rep",
    dept: "Sales",
    riskScore: 66,
    riskLevel: "med",
    tenure: "1.5 yrs tenure",
    reasons: ["Paid 22% below market", "Low engagement (2.6/5)"],
    rating: "4/5",
    avatarBg: "#EC4899",
    whyDrivers: [
      { label: "Paid 22% below market", pts: 22, color: "#F59E0B" },
      { label: "Low engagement (2.6/5)", pts: 16, color: "#F59E0B" },
    ],
    ctc: "₹7.8 L",
    marketCtc: "₹10.0 L",
    costToReplace: "₹3.9 L",
    costToFixPay: "₹1.7 L / yr",
  },
  {
    id: "faizan",
    initials: "FM",
    name: "Faizan Mishra",
    role: "Senior CSM",
    dept: "Customer Success",
    riskScore: 64,
    riskLevel: "med",
    tenure: "2.1 yrs tenure",
    reasons: ["Paid 19% below market", "2 manager changes this year"],
    rating: "4/5",
    avatarBg: "#10B981",
    whyDrivers: [
      { label: "Paid 19% below market", pts: 20, color: "#F59E0B" },
      { label: "2 manager changes this year", pts: 16, color: "#F59E0B" },
    ],
    ctc: "₹14.0 L",
    marketCtc: "₹17.3 L",
    costToReplace: "₹7.0 L",
    costToFixPay: "₹2.4 L / yr",
  },
  {
    id: "tejas_q",
    initials: "TQ",
    name: "Tejas Qureshi",
    role: "Engineering Manager",
    dept: "Engineering",
    riskScore: 68,
    riskLevel: "med",
    tenure: "2.0 yrs tenure",
    reasons: ["Paid 22% below market", "Low engagement (2.7/5)"],
    rating: "5/5",
    avatarBg: "#2563EB",
    whyDrivers: [
      { label: "Paid 22% below market", pts: 22, color: "#F59E0B" },
      { label: "Low engagement (2.7/5)", pts: 18, color: "#F59E0B" },
    ],
    ctc: "₹32.0 L",
    marketCtc: "₹41.0 L",
    costToReplace: "₹16.0 L",
    costToFixPay: "₹6.9 L / yr",
  },
  {
    id: "jyoti",
    initials: "JD",
    name: "Jyoti Dutta",
    role: "Enterprise Account Executive",
    dept: "Sales",
    riskScore: 68,
    riskLevel: "med",
    tenure: "3.0 yrs tenure",
    reasons: ["Low engagement (2.4/5)", "No promotion in 3.0 yrs"],
    rating: "2/5",
    avatarBg: "#EC4899",
    whyDrivers: [
      { label: "Low engagement (2.4/5)", pts: 20, color: "#F59E0B" },
      { label: "No promotion in 3.0 yrs", pts: 18, color: "#F59E0B" },
    ],
    ctc: "₹18.5 L",
    marketCtc: "₹22.0 L",
    costToReplace: "₹9.2 L",
    costToFixPay: "₹2.4 L / yr",
  },
  {
    id: "gayatri",
    initials: "GB",
    name: "Gayatri Bhat",
    role: "Head of CS",
    dept: "Customer Success",
    riskScore: 68,
    riskLevel: "med",
    tenure: "2.5 yrs tenure",
    reasons: ["Paid 19% below market", "Overtime 51 hrs/week"],
    rating: "4/5",
    avatarBg: "#10B981",
    whyDrivers: [
      { label: "Paid 19% below market", pts: 20, color: "#F59E0B" },
      { label: "Overtime 51 hrs/week", pts: 18, color: "#F59E0B" },
    ],
    ctc: "₹24.0 L",
    marketCtc: "₹29.6 L",
    costToReplace: "₹12.0 L",
    costToFixPay: "₹4.1 L / yr",
  },
];

export default function AttritionRadarPage() {
  const [filterLevel, setFilterLevel] = useState<"All" | "High" | "Medium" | "Low">("High");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedEmpId, setSelectedEmpId] = useState("rohan");

  // Recommended actions toggles for selected employee
  const [actionsToggle, setActionsToggle] = useState({
    stayInterview: true,
    careerConv: false,
    marketCorr: false,
  });

  const [aiGuideOutput, setAiGuideOutput] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const filteredEmployees = EMPLOYEES_RISK.filter((emp) => {
    if (filterLevel === "High" && emp.riskLevel !== "high") return false;
    if (filterLevel === "Medium" && emp.riskLevel !== "med") return false;
    if (filterLevel === "Low" && emp.riskLevel !== "low") return false;
    if (selectedDept !== "All" && emp.dept !== selectedDept) return false;
    return true;
  });

  const selectedEmp = EMPLOYEES_RISK.find((e) => e.id === selectedEmpId) || EMPLOYEES_RISK[1];

  const handleGenerateStayGuide = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a 4-question stay-interview guide tailored to ${selectedEmp.name} (${selectedEmp.role}, ${selectedEmp.dept}, Flight Risk: ${selectedEmp.riskScore}/100). Primary risk drivers: ${selectedEmp.reasons.join(", ")}. Include advice on addressing their pay gap (${selectedEmp.ctc} vs ${selectedEmp.marketCtc}) and tenure (${selectedEmp.tenure}).`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiGuideOutput(json.reply);
      } else {
        setAiGuideOutput(
          `**STAY-INTERVIEW GUIDE FOR ${selectedEmp.name.toUpperCase()}**\n\n` +
          `1. **Engagement & Workload:** "You've been putting in significant hours (${selectedEmp.reasons[0] || 'Overtime'}). What tasks can we offload or streamline for you?"\n` +
          `2. **Career Growth:** "It's been ${selectedEmp.tenure} in your current trajectory. Where do you want your role to evolve over the next 12 months?"\n` +
          `3. **Compensation Alignment:** "We are reviewing market pay bands for ${selectedEmp.role} (Market: ${selectedEmp.marketCtc}). Let's discuss an interim correction plan."\n` +
          `4. **Manager Support:** "How can leadership better support your day-to-day autonomy?"`
        );
      }
    } catch {
      setAiGuideOutput(
        `**STAY-INTERVIEW GUIDE FOR ${selectedEmp.name.toUpperCase()}**\n\n` +
        `1. **Engagement & Workload:** "You've been putting in significant hours (${selectedEmp.reasons[0] || 'Overtime'}). What tasks can we offload or streamline for you?"\n` +
        `2. **Career Growth:** "It's been ${selectedEmp.tenure} in your current trajectory. Where do you want your role to evolve over the next 12 months?"\n` +
        `3. **Compensation Alignment:** "We are reviewing market pay bands for ${selectedEmp.role} (Market: ${selectedEmp.marketCtc}). Let's discuss an interim correction plan."\n` +
        `4. **Manager Support:** "How can leadership better support your day-to-day autonomy?"`
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
            Attrition Radar
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            A flight-risk score for every employee, with the reasons behind it, the cost of losing them and the retention move to make.
          </p>
        </div>

        <button
          onClick={() => {
            setFilterLevel("High");
            setSelectedDept("All");
            setSelectedEmpId("rohan");
            setAiGuideOutput("");
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

      {/* Top 4 Summary KPI Metric Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {/* Card 1: High risk */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#DC2626" }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#EF4444" }} />
            High risk
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>11</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            9 are high performers
          </div>
        </div>

        {/* Card 2: Medium risk */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#D97706" }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#F59E0B" }} />
            Medium risk
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>21</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            Monitor monthly
          </div>
        </div>

        {/* Card 3: Cost if high-risk leave */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#F97316" }}>
            <Wallet style={{ width: 16, height: 16, color: "#F97316" }} />
            Cost if high-risk leave
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>₹124.1 <small style={{ fontSize: 15, fontWeight: 700, color: "#64748B" }}>L</small></span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            Hiring, ramp-up and lost output (est.)
          </div>
        </div>

        {/* Card 4: Predicted attrition */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#EC4899" }}>
            <Users style={{ width: 16, height: 16, color: "#EC4899" }} />
            Predicted attrition
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>15%</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            Next 12 months
          </div>
        </div>
      </div>

      {/* Middle Section: Table Left (60%) & Selected Employee Breakdown Right (40%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* Left Column: Risk Ranking Table */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Header Controls: Filter Tabs & Department Selector */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 4, background: "#F1F5F9", padding: 3, borderRadius: 99 }}>
              {(["All", "High", "Medium", "Low"] as const).map((lvl) => {
                const active = filterLevel === lvl;
                return (
                  <button
                    key={lvl}
                    onClick={() => setFilterLevel(lvl)}
                    style={{
                      padding: "4px 12px",
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
                    {lvl}
                  </button>
                );
              })}
            </div>

            {/* Department Dropdown */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                height: 32,
                padding: "0 10px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--ink)",
                background: "#FFF",
                outline: "none"
              }}
            >
              {["All", "Engineering", "Data", "Product", "Sales", "Customer Success", "HR", "Finance"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Risk Table */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em" }}>
                  <th style={{ padding: "10px 14px" }}>EMPLOYEE</th>
                  <th style={{ padding: "10px 14px" }}>FLIGHT RISK</th>
                  <th style={{ padding: "10px 14px" }}>TOP REASONS</th>
                  <th style={{ padding: "10px 14px", textAlign: "right" }}>RATING</th>
                </tr>
              </thead>
              <tbody style={{ color: "#334155" }}>
                {filteredEmployees.map((emp) => {
                  const isSelected = emp.id === selectedEmpId;
                  return (
                    <tr
                      key={emp.id}
                      onClick={() => setSelectedEmpId(emp.id)}
                      style={{
                        background: isSelected ? "#FEF3C7" : "#FFF",
                        borderBottom: "1px solid #F1F5F9",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: "50%", background: emp.avatarBg, color: "#FFF",
                            fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                          }}>
                            {emp.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{emp.name}</div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>{emp.role}</div>
                          </div>
                        </div>
                      </td>

                      {/* Flight Risk Score Bar */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 50, height: 6, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                            <div style={{ width: `${emp.riskScore}%`, height: "100%", background: "#EF4444", borderRadius: 99 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#EF4444", fontFamily: "var(--f-mono)" }}>
                            {emp.riskScore}
                          </span>
                        </div>
                      </td>

                      {/* Top Reasons Pills */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {emp.reasons.map((r, idx) => (
                            <span key={idx} style={{
                              padding: "2px 8px", borderRadius: 99, background: "#F1F5F9", color: "#475569", fontSize: 11, fontWeight: 600
                            }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, fontFamily: "var(--f-mono)", fontSize: 12 }}>
                        {emp.rating}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Selected Employee Breakdown & Action Levers */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Flight Risk Breakdown Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header: Donut Ring & Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", width: 62, height: 62, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke="#EF4444"
                    strokeWidth="4"
                    strokeDasharray={`${(selectedEmp.riskScore / 100) * 88} 88`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{selectedEmp.riskScore}</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: "#94A3B8" }}>risk</span>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", background: selectedEmp.avatarBg, color: "#FFF",
                    fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    {selectedEmp.initials}
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{selectedEmp.name}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  {selectedEmp.role} · {selectedEmp.dept}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#EF4444", marginTop: 2 }}>
                  ● High · {selectedEmp.tenure}
                </div>
              </div>
            </div>

            {/* WHY (POINTS ADDED) Section */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                WHY (POINTS ADDED)
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedEmp.whyDrivers.map((driver, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11.5, color: "#334155", fontWeight: 500, width: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {driver.label}
                      </span>
                      <div style={{ flex: 1, height: 6, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                        <div style={{ width: `${driver.pts * 4}%`, height: "100%", background: driver.color, borderRadius: 99 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--f-mono)", width: 24, textAlign: "right" }}>
                      +{driver.pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Metrics Box */}
            <div style={{ background: "#F8FAFC", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                <span>CTC vs market</span>
                <b style={{ color: "var(--ink)", fontFamily: "var(--f-mono)" }}>{selectedEmp.ctc} / {selectedEmp.marketCtc}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                <span>Cost to replace (est.)</span>
                <b style={{ color: "#EF4444", fontFamily: "var(--f-mono)" }}>{selectedEmp.costToReplace}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                <span>Cost to fix pay (to 95% of market)</span>
                <b style={{ color: "#10B981", fontFamily: "var(--f-mono)" }}>{selectedEmp.costToFixPay}</b>
              </div>
            </div>

            {/* Recommended Actions Toggles */}
            <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)", marginBottom: 10 }}>
                Recommended actions
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { key: "stayInterview", label: "Stay interview within 2 weeks" },
                  { key: "careerConv", label: "Career conversation + promotion case" },
                  { key: "marketCorr", label: "Market correction in this cycle" },
                ].map((item) => {
                  const active = actionsToggle[item.key as keyof typeof actionsToggle];
                  return (
                    <div
                      key={item.key}
                      onClick={() => setActionsToggle((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof actionsToggle] }))}
                      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    >
                      <span style={{
                        width: 30, height: 16, borderRadius: 99, background: active ? "#F97316" : "#CBD5E1",
                        position: "relative", transition: "all 0.15s ease", display: "inline-block"
                      }}>
                        <span style={{
                          width: 12, height: 12, borderRadius: "50%", background: "#FFF",
                          position: "absolute", top: 2, left: active ? 16 : 2, transition: "all 0.15s ease"
                        }} />
                      </span>
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "var(--ink)" : "#475569" }}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Risk Drivers Company-Wide (Left 60%) & Stay-Interview AI Box (Right 40%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* Company-Wide Risk Drivers Panel */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              What's driving risk company-wide
            </h3>
            <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
              People at medium or high risk
            </span>
          </div>

          {/* Horizontal Orange Bars List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
            {[
              { label: "Below-market pay", count: 25 },
              { label: "Overtime", count: 24 },
              { label: "Low engagement", count: 22 },
              { label: "Manager change", count: 15 },
              { label: "1–3 yr window", count: 15 },
              { label: "Poaching target", count: 14 },
              { label: "Stalled promotion", count: 11 },
            ].map((driver) => (
              <div key={driver.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", width: 130 }}>
                  {driver.label}
                </span>
                <div style={{ flex: 1, height: 14, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                  <div style={{ width: `${(driver.count / 30) * 100}%`, height: "100%", background: "#F97316", borderRadius: 99 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--f-mono)", width: 20, textAlign: "right" }}>
                  {driver.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stay-Interview AI Guide Box */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
              <Sparkles style={{ width: 17, height: 17, color: "#F97316" }} />
              Stay-Interview guide
            </div>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
              background: aiGuideOutput ? "#E0F2FE" : "#F1F5F9", color: aiGuideOutput ? "#0369A1" : "#64748B"
            }}>
              {aiGuideOutput ? "READY" : "WAITING"}
            </span>
          </div>

          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
            Generate questions tailored to this person's risk drivers.
          </p>

          <button
            onClick={handleGenerateStayGuide}
            disabled={loadingAi}
            style={{
              alignSelf: "flex-start",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 18px",
              borderRadius: 99,
              background: "linear-gradient(135deg, #F97316 0%, #EF4444 100%)",
              border: "none",
              color: "#FFF",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: loadingAi ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(249, 115, 22, 0.3)"
            }}
          >
            <Sparkles style={{ width: 14, height: 14 }} />
            Stay-interview guide
          </button>

          {aiGuideOutput && (
            <div style={{
              background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
              fontSize: 13, color: "#334155", lineHeight: 1.6
            }}>
              {renderFormattedMarkdown(aiGuideOutput)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
