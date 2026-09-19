"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, AlertTriangle, UserCheck, Clock, Info, Check, FileText } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

// Promotion Ready Row Definition
interface PromoCandidate {
  id: string;
  initials: string;
  name: string;
  role: string;
  dept: string;
  readiness: number;
  ratingPrev: number;
  ratingCur: number;
  timeInLevel: string;
  payVsMkt: number;
  promoteTo: string;
  suggestedHike: number;
  avatarBg: string;
}

const PROMO_CANDIDATES: PromoCandidate[] = [
  { id: "pn", initials: "PN", name: "Pranav Nair", role: "Software Engineer II", dept: "Engineering", readiness: 132, ratingPrev: 5, ratingCur: 5, timeInLevel: "2.6 yrs", payVsMkt: 89, promoteTo: "Senior Software Engineer", suggestedHike: 22, avatarBg: "#2563EB" },
  { id: "rm", initials: "RM", name: "Rohan Mehta", role: "Senior Data Analyst", dept: "Data", readiness: 126, ratingPrev: 4, ratingCur: 5, timeInLevel: "3.4 yrs", payVsMkt: 83, promoteTo: "Data Scientist", suggestedHike: 22, avatarBg: "#0EA5E9" },
  { id: "an", initials: "AN", name: "Arjun Nair", role: "Sales Development Rep", dept: "Sales", readiness: 126, ratingPrev: 4, ratingCur: 5, timeInLevel: "3.0 yrs", payVsMkt: 82, promoteTo: "Account Executive", suggestedHike: 22, avatarBg: "#EF4444" },
  { id: "ap", initials: "AP", name: "Aditya Patel", role: "Associate Product Manager", dept: "Product", readiness: 125, ratingPrev: 4, ratingCur: 5, timeInLevel: "3.3 yrs", payVsMkt: 77, promoteTo: "Product Designer", suggestedHike: 22, avatarBg: "#8B5CF6" },
  { id: "tq", initials: "TQ", name: "Tejas Qureshi", role: "Engineering Manager", dept: "Engineering", readiness: 123, ratingPrev: 5, ratingCur: 5, timeInLevel: "2.0 yrs", payVsMkt: 78, promoteTo: "Director of Engineering", suggestedHike: 22, avatarBg: "#2563EB" },
  { id: "kr", initials: "KR", name: "Kavya Reddy", role: "Senior Software Engineer", dept: "Engineering", readiness: 114, ratingPrev: 4, ratingCur: 4, timeInLevel: "2.8 yrs", payVsMkt: 83, promoteTo: "Engineering Manager", suggestedHike: 22, avatarBg: "#2563EB" },
  { id: "mi", initials: "MI", name: "Meera Iyer", role: "Product Designer", dept: "Product", readiness: 106, ratingPrev: 3, ratingCur: 4, timeInLevel: "2.2 yrs", payVsMkt: 239, promoteTo: "Product Manager", suggestedHike: 14, avatarBg: "#8B5CF6" },
  { id: "kd", initials: "KD", name: "Kritika Das", role: "Sales Manager", dept: "Sales", readiness: 105, ratingPrev: 4, ratingCur: 4, timeInLevel: "3.2 yrs", payVsMkt: 102, promoteTo: "VP Sales", suggestedHike: 14, avatarBg: "#EC4899" },
  { id: "ui", initials: "UI", name: "Ujjwal Iyer", role: "Software Engineer II", dept: "Engineering", readiness: 100, ratingPrev: 5, ratingCur: 4, timeInLevel: "3.4 yrs", payVsMkt: 98, promoteTo: "Senior Software Engineer", suggestedHike: 18, avatarBg: "#2563EB" },
  { id: "kg", initials: "KG", name: "Karan Ghosh", role: "Sales Development Rep", dept: "Sales", readiness: 97, ratingPrev: 4, ratingCur: 4, timeInLevel: "1.5 yrs", payVsMkt: 78, promoteTo: "Account Executive", suggestedHike: 22, avatarBg: "#EC4899" },
  { id: "mk", initials: "MK", name: "Mohit Khan", role: "Software Engineer II", dept: "Engineering", readiness: 92, ratingPrev: 3, ratingCur: 4, timeInLevel: "1.8 yrs", payVsMkt: 92, promoteTo: "Senior Software Engineer", suggestedHike: 18, avatarBg: "#2563EB" },
  { id: "bs", initials: "BS", name: "Bhavna Singh", role: "HR Head", dept: "HR", readiness: 89, ratingPrev: 4, ratingCur: 4, timeInLevel: "1.9 yrs", payVsMkt: 96, promoteTo: "CHRO", suggestedHike: 22, avatarBg: "#F97316" },
  { id: "mm", initials: "MM", name: "Manasi Mishra", role: "Enterprise Account Executive", dept: "Sales", readiness: 83, ratingPrev: 3, ratingCur: 4, timeInLevel: "1.8 yrs", payVsMkt: 104, promoteTo: "Sales Manager", suggestedHike: 14, avatarBg: "#EC4899" },
];

// PIP Watchlist Definition
interface PipWatchItem {
  id: string;
  initials: string;
  name: string;
  role: string;
  dept: string;
  ratingPrev: number;
  ratingCur: number;
  goalsPercent: number;
  engagement: number;
  hoursPerWk?: number;
  avatarBg: string;
}

const PIP_WATCHLIST: PipWatchItem[] = [
  { id: "ij", initials: "IJ", name: "Imran Joshi", role: "Software Engineer", dept: "Engineering", ratingPrev: 2, ratingCur: 2, goalsPercent: 40, engagement: 3.7, hoursPerWk: 51, avatarBg: "#2563EB" },
  { id: "ng", initials: "NG", name: "Nikhil Gupta", role: "Software Engineer II", dept: "Engineering", ratingPrev: 2, ratingCur: 2, goalsPercent: 48, engagement: 2.9, avatarBg: "#2563EB" },
  { id: "jd", initials: "JD", name: "Jyoti Dutta", role: "Enterprise Account Executive", dept: "Sales", ratingPrev: 2, ratingCur: 2, goalsPercent: 35, engagement: 2.4, hoursPerWk: 51, avatarBg: "#EC4899" },
  { id: "ya", initials: "YA", name: "Yash Agarwal", role: "Account Executive", dept: "Sales", ratingPrev: 2, ratingCur: 2, goalsPercent: 37, engagement: 3.1, hoursPerWk: 49, avatarBg: "#EC4899" },
  { id: "is", initials: "IS", name: "Imran Sharma", role: "Senior Financial Analyst", dept: "Finance", ratingPrev: 2, ratingCur: 2, goalsPercent: 43, engagement: 4.2, avatarBg: "#64748B" },
];

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState<"9-box" | "Promotion ready" | "PIP watchlist" | "Rating calibration">("Rating calibration");
  const [selectedDept, setSelectedDept] = useState("All");

  // AI Output States
  const [selectedLetterPerson, setSelectedLetterPerson] = useState<PromoCandidate | null>(null);
  const [promoLetterOutput, setPromoLetterOutput] = useState("");
  const [loadingPromoLetter, setLoadingPromoLetter] = useState(false);

  const [selectedPipPerson, setSelectedPipPerson] = useState<PipWatchItem | null>(null);
  const [pipPlanOutput, setPipPlanOutput] = useState("");
  const [loadingPipPlan, setLoadingPipPlan] = useState(false);

  const handleGeneratePromoLetter = async (person: PromoCandidate) => {
    setSelectedLetterPerson(person);
    setLoadingPromoLetter(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Draft an executive promotion letter for ${person.name} promoting them from ${person.role} to ${person.promoteTo}. Include a suggested salary revision hike of +${person.suggestedHike}% and praise for their performance rating history (${person.ratingPrev} -> ${person.ratingCur}/5).`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setPromoLetterOutput(json.reply);
      } else {
        setPromoLetterOutput(
          `**OFFICIAL PROMOTION LETTER**\n\n` +
          `Date: ${new Date().toLocaleDateString("en-IN")}\n\n` +
          `Dear ${person.name},\n\n` +
          `We are delighted to formally confirm your promotion to **${person.promoteTo}** in the ${person.dept} department.\n\n` +
          `• **New Designation:** ${person.promoteTo}\n` +
          `• **Compensation Revision:** +${person.suggestedHike}% adjustment\n` +
          `• **Performance Rating:** ${person.ratingCur} / 5 (Exceeds Expectations)\n\n` +
          `Thank you for your outstanding dedication and leadership over the past ${person.timeInLevel}. We look forward to your continued success!`
        );
      }
    } catch {
      setPromoLetterOutput(
        `**OFFICIAL PROMOTION LETTER**\n\n` +
        `Date: ${new Date().toLocaleDateString("en-IN")}\n\n` +
        `Dear ${person.name},\n\n` +
        `We are delighted to formally confirm your promotion to **${person.promoteTo}** in the ${person.dept} department.\n\n` +
        `• **New Designation:** ${person.promoteTo}\n` +
        `• **Compensation Revision:** +${person.suggestedHike}% adjustment\n` +
        `• **Performance Rating:** ${person.ratingCur} / 5 (Exceeds Expectations)\n\n` +
        `Thank you for your outstanding dedication and leadership over the past ${person.timeInLevel}. We look forward to your continued success!`
      );
    } finally {
      setLoadingPromoLetter(false);
    }
  };

  const handleGeneratePipPlan = async (person: PipWatchItem) => {
    setSelectedPipPerson(person);
    setLoadingPipPlan(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Draft a supportive 60-day Performance Improvement Plan (PIP) draft for ${person.name} (${person.role}, ${person.dept}). Current goal completion: ${person.goalsPercent}%, rating ${person.ratingCur}/5. Focus on clear SMART goals, workload rebalancing, and weekly 1-on-1 check-ins.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setPipPlanOutput(json.reply);
      } else {
        setPipPlanOutput(
          `**SUPPORTIVE 60-DAY PERFORMANCE IMPROVEMENT PLAN (PIP)**\n\n` +
          `Employee: ${person.name} | Role: ${person.role}\n\n` +
          `1. **Root Cause Diagnosis:** Evaluate workload capacity (${person.hoursPerWk ? person.hoursPerWk + " hrs/wk" : "Standard"}) and rule out manager or personal blockers.\n` +
          `2. **SMART 30-Day Goal:** Achieve ${person.goalsPercent + 25}% target completion on core deliverables.\n` +
          `3. **Support Rituals:** Weekly 30-min 1-on-1 check-in with manager to unblock technical barriers.`
        );
      }
    } catch {
      setPipPlanOutput(
        `**SUPPORTIVE 60-DAY PERFORMANCE IMPROVEMENT PLAN (PIP)**\n\n` +
        `Employee: ${person.name} | Role: ${person.role}\n\n` +
        `1. **Root Cause Diagnosis:** Evaluate workload capacity (${person.hoursPerWk ? person.hoursPerWk + " hrs/wk" : "Standard"}) and rule out manager or personal blockers.\n` +
        `2. **SMART 30-Day Goal:** Achieve ${person.goalsPercent + 25}% target completion on core deliverables.\n` +
        `3. **Support Rituals:** Weekly 30-min 1-on-1 check-in with manager to unblock technical barriers.`
      );
    } finally {
      setLoadingPipPlan(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      {/* Sub-Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#EC4899", textTransform: "uppercase", marginBottom: 2 }}>
            — PEOPLE
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
            Performance & Promotions
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Appraisal-season control room: 9-box talent grid, who's ready for promotion, a supportive PIP watchlist and rating calibration across teams.
          </p>
        </div>

        <button
          onClick={() => {
            setActiveTab("Rating calibration");
            setSelectedDept("All");
            setPromoLetterOutput("");
            setPipPlanOutput("");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 99,
            background: "#FCE7F3",
            border: "1px solid #FBCFE8",
            color: "#DB2777",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <Sparkles style={{ width: 14, height: 14, color: "#DB2777" }} />
          Try with demo data
        </button>
      </div>

      {/* Top 4 KPI Cards Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {/* Card 1: Promotion-ready */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#059669" }}>
            <TrendingUp style={{ width: 16, height: 16, color: "#10B981" }} />
            Promotion-ready
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>17</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            of 64 reviewed
          </div>
        </div>

        {/* Card 2: PIP watchlist */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#DC2626" }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#EF4444" }} />
            PIP watchlist
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>7</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            Low rating 2 cycles running
          </div>
        </div>

        {/* Card 3: Future leaders */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#2563EB" }}>
            <UserCheck style={{ width: 16, height: 16, color: "#3B82F6" }} />
            Future leaders
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>12</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            High performance & potential
          </div>
        </div>

        {/* Card 4: Cycle closes in */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#D97706" }}>
            <Clock style={{ width: 16, height: 16, color: "#F59E0B" }} />
            Cycle closes in
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>19 <small style={{ fontSize: 14, fontWeight: 700, color: "#64748B" }}>days</small></span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            FY26 H1 appraisal
          </div>
        </div>
      </div>

      {/* Tabs Row & Department Dropdown Filter */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: 4, background: "#F1F5F9", padding: 4, borderRadius: 99 }}>
          {(["9-box", "Promotion ready", "PIP watchlist", "Rating calibration"] as const).map((tab) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  border: "none",
                  background: active ? "#FFF" : "transparent",
                  color: active ? "var(--ink)" : "#64748B",
                  fontSize: 12.5,
                  fontWeight: active ? 800 : 600,
                  cursor: "pointer",
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.06)" : "none"
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Department Select */}
        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid #CBD5E1",
              fontSize: 12.5,
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
      </div>

      {/* TAB 1: 9-BOX TALENT MATRIX */}
      {activeTab === "9-box" && (
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            9-Box Talent Matrix
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Enigma", pot: "High Potential", perf: "Low Perf", count: 3, bg: "#FEF3C7", border: "#FDE68A" },
              { label: "Growth Talent", pot: "High Potential", perf: "Mid Perf", count: 8, bg: "#EFF6FF", border: "#BFDBFE" },
              { label: "Future Leaders", pot: "High Potential", perf: "High Perf", count: 12, bg: "#ECFDF5", border: "#A7F3D0" },
              
              { label: "Dilemma", pot: "Mid Potential", perf: "Low Perf", count: 4, bg: "#FEF3C7", border: "#FDE68A" },
              { label: "Core Players", pot: "Mid Potential", perf: "Mid Perf", count: 18, bg: "#F8FAFC", border: "#E2E8F0" },
              { label: "High Performers", pot: "Mid Potential", perf: "High Perf", count: 10, bg: "#EFF6FF", border: "#BFDBFE" },
              
              { label: "Underperformers", pot: "Low Potential", perf: "Low Perf", count: 5, bg: "#FEF2F2", border: "#FECACA" },
              { label: "Effective", pot: "Low Potential", perf: "Mid Perf", count: 3, bg: "#F8FAFC", border: "#E2E8F0" },
              { label: "Trusted Experts", pot: "Low Potential", perf: "High Perf", count: 6, bg: "#E0F2FE", border: "#BAE6FD" },
            ].map((box, idx) => (
              <div
                key={idx}
                style={{
                  background: box.bg,
                  border: `1px solid ${box.border}`,
                  borderRadius: 14,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 100
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>{box.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", fontFamily: "var(--f-mono)" }}>{box.count}</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginTop: 12 }}>
                  {box.pot} · {box.perf}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PROMOTION READY */}
      {activeTab === "Promotion ready" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Promotion ready
            </h3>

            {/* Candidate Table */}
            <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em" }}>
                    <th style={{ padding: "10px 14px" }}>PERSON</th>
                    <th style={{ padding: "10px 14px" }}>READINESS</th>
                    <th style={{ padding: "10px 14px" }}>RATING</th>
                    <th style={{ padding: "10px 14px" }}>TIME IN LEVEL</th>
                    <th style={{ padding: "10px 14px" }}>PAY VS MKT</th>
                    <th style={{ padding: "10px 14px" }}>PROMOTE TO</th>
                    <th style={{ padding: "10px 14px" }}>SUGGESTED HIKE</th>
                    <th style={{ padding: "10px 14px" }}>ACTION</th>
                  </tr>
                </thead>
                <tbody style={{ color: "#334155" }}>
                  {PROMO_CANDIDATES.map((row, idx) => (
                    <tr key={row.id} style={{ borderBottom: idx === PROMO_CANDIDATES.length - 1 ? "none" : "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", background: row.avatarBg, color: "#FFF",
                            fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center"
                          }}>
                            {row.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{row.name}</div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>{row.role}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--ink)", width: 24, textAlign: "right" }}>{row.readiness}</span>
                          <div style={{ width: 60, height: 6, borderRadius: 99, background: "#CBD5E1", overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, row.readiness / 1.4)}%`, height: "100%", background: "#10B981" }} />
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "10px 14px", fontWeight: 700, fontFamily: "var(--f-mono)", fontSize: 12 }}>
                        {row.ratingPrev} → {row.ratingCur}
                      </td>

                      <td style={{ padding: "10px 14px", color: "#475569", fontSize: 12 }}>
                        {row.timeInLevel}
                      </td>

                      <td style={{ padding: "10px 14px", fontWeight: 700, color: row.payVsMkt < 90 ? "#EF4444" : "#475569", fontFamily: "var(--f-mono)" }}>
                        {row.payVsMkt}%
                      </td>

                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#334155", fontSize: 12 }}>
                        {row.promoteTo}
                      </td>

                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--f-mono)" }}>
                        {row.suggestedHike}%
                      </td>

                      <td style={{ padding: "10px 14px" }}>
                        <button
                          onClick={() => handleGeneratePromoLetter(row)}
                          style={{
                            display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 99,
                            background: "#FFF", border: "1px solid #CBD5E1", color: "#334155", fontSize: 11.5, fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          Letter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>
              Rule used: rating ≥ 4 this cycle, ≥ 3 last cycle, ≥ 1.5 yrs in level. Readiness = ratings, potential, goals and time in level. Suggested hike is higher for people paid below market.
            </div>
          </div>

          {/* Promotion Letter AI Generator Box */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 17, height: 17, color: "#EC4899" }} />
                Promotion letter
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
                background: promoLetterOutput ? "#E0F2FE" : "#F1F5F9", color: promoLetterOutput ? "#0369A1" : "#64748B"
              }}>
                {promoLetterOutput ? "READY" : "WAITING"}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
              Click "Letter" on any row.
            </p>

            {promoLetterOutput && (
              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
                fontSize: 13, color: "#334155", lineHeight: 1.6
              }}>
                {renderFormattedMarkdown(promoLetterOutput)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PIP WATCHLIST */}
      {activeTab === "PIP watchlist" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Supportive Banner */}
          <div style={{
            background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 14, padding: "12px 16px",
            fontSize: 12.5, color: "#1E40AF", lineHeight: 1.5, display: "flex", alignItems: "center", gap: 10
          }}>
            <Info style={{ width: 18, height: 18, color: "#2563EB", flexShrink: 0 }} />
            <div>
              <b>Supportive by design.</b> Before a PIP, rule out causes that aren't about the person: workload, a manager change, unclear goals, health or personal circumstances. A PIP should be 60–90 days, with SMART goals, weekly check-ins and real support.
            </div>
          </div>

          {/* Cards Grid for PIP Watchlist */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {PIP_WATCHLIST.map((item) => (
              <div key={item.id} className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", background: item.avatarBg, color: "#FFF",
                      fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      {item.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{item.name}</div>
                      <div style={{ fontSize: 11.5, color: "#64748B" }}>{item.role} · {item.dept}</div>
                    </div>
                  </div>

                  {/* Rating Badge */}
                  <span style={{
                    fontSize: 11, fontWeight: 800, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FECACA",
                    padding: "3px 8px", borderRadius: 99, display: "inline-flex", alignItems: "center", gap: 4
                  }}>
                    ● Rating {item.ratingPrev} → {item.ratingCur}
                  </span>
                </div>

                {/* Stat Badges Row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ padding: "4px 10px", borderRadius: 99, background: "#F1F5F9", color: "#475569", fontSize: 11.5, fontWeight: 700 }}>
                    Goals {item.goalsPercent}%
                  </span>
                  <span style={{ padding: "4px 10px", borderRadius: 99, background: "#F1F5F9", color: "#475569", fontSize: 11.5, fontWeight: 700 }}>
                    Engagement {item.engagement}/5
                  </span>
                  {item.hoursPerWk && (
                    <span style={{ padding: "4px 10px", borderRadius: 99, background: "#FEF3C7", color: "#B45309", fontSize: 11.5, fontWeight: 700 }}>
                      {item.hoursPerWk} hrs/wk
                    </span>
                  )}
                </div>

                {/* CHECK FIRST checklist */}
                <div style={{ background: "#F8FAFC", borderRadius: 10, padding: 12, fontSize: 11.5, color: "#475569" }}>
                  <div style={{ fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", fontSize: 10, textTransform: "uppercase", marginBottom: 6 }}>
                    CHECK FIRST
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div>• Are goals clear and written down?</div>
                    <div>• Any workload, health or personal factors?</div>
                  </div>
                </div>

                {/* Draft PIP Plan Action Button */}
                <button
                  onClick={() => handleGeneratePipPlan(item)}
                  disabled={loadingPipPlan}
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 99,
                    background: "linear-gradient(135deg, #A855F7 0%, #EC4899 100%)",
                    border: "none",
                    color: "#FFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: loadingPipPlan ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(168, 85, 247, 0.25)"
                  }}
                >
                  <Sparkles style={{ width: 13, height: 13 }} />
                  Draft PIP plan
                </button>
              </div>
            ))}
          </div>

          {/* PIP Plan AI Box */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 17, height: 17, color: "#EC4899" }} />
                PIP plan
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
                background: pipPlanOutput ? "#E0F2FE" : "#F1F5F9", color: pipPlanOutput ? "#0369A1" : "#64748B"
              }}>
                {pipPlanOutput ? "READY" : "WAITING"}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
              Click "Draft PIP plan" on a card.
            </p>

            {pipPlanOutput && (
              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
                fontSize: 13, color: "#334155", lineHeight: 1.6
              }}>
                {renderFormattedMarkdown(pipPlanOutput)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: RATING CALIBRATION */}
      {activeTab === "Rating calibration" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20 }}>
          {/* Left Panel: Rating distribution vs guideline */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Rating distribution vs guideline
              </h3>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8" }}>
                All
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 6 }}>
              {[
                { rating: "Rating 1", pct: 2, guide: 5, barColor: "#EC4899", isAmber: false },
                { rating: "Rating 2", pct: 19, guide: 15, barColor: "#EC4899", isAmber: false },
                { rating: "Rating 3", pct: 30, guide: 50, barColor: "#D97706", isAmber: true },
                { rating: "Rating 4", pct: 36, guide: 28, barColor: "#D97706", isAmber: true },
                { rating: "Rating 5", pct: 14, guide: 10, barColor: "#EC4899", isAmber: false },
              ].map((item) => (
                <div key={item.rating} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                    <span>{item.rating}</span>
                    <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
                      {item.pct}% · guide {item.guide}%
                    </span>
                  </div>

                  {/* Relative Bar Container with Black Tick Guideline Marker */}
                  <div style={{ position: "relative", height: 12, borderRadius: 99, background: "#F1F5F9", width: "100%" }}>
                    {/* Actual Rating Bar */}
                    <div style={{
                      width: `${item.pct * 2}%`, // scale factor for visual width
                      height: "100%",
                      borderRadius: 99,
                      background: item.barColor,
                      transition: "width 0.3s ease"
                    }} />

                    {/* Black Guideline Tick Mark */}
                    <div style={{
                      position: "absolute",
                      left: `${item.guide * 2}%`,
                      top: -2,
                      width: 2,
                      height: 16,
                      background: "#0F172A"
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic", paddingTop: 8 }}>
              Black tick = guideline. Amber bars differ from the guideline by more than 12 points.
            </div>
          </div>

          {/* Right Panel: Calibration flags by team */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Calibration flags by team
            </h3>

            <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em" }}>
                    <th style={{ padding: "10px 14px" }}>TEAM</th>
                    <th style={{ padding: "10px 14px" }}>AVG RATING</th>
                    <th style={{ padding: "10px 14px" }}>RATED 4–5</th>
                    <th style={{ padding: "10px 14px" }}>FLAG</th>
                  </tr>
                </thead>
                <tbody style={{ color: "#334155" }}>
                  {[
                    { team: "Engineering", avg: "3.32", rated45: "41%", flag: "In range", isLenient: false },
                    { team: "Data", avg: "3.75", rated45: "50%", flag: "Lenient?", isLenient: true },
                    { team: "Product", avg: "3.83", rated45: "83%", flag: "Lenient?", isLenient: true },
                    { team: "Sales", avg: "3.17", rated45: "50%", flag: "In range", isLenient: false },
                    { team: "Customer Success", avg: "3.43", rated45: "57%", flag: "In range", isLenient: false },
                    { team: "HR", avg: "3.25", rated45: "25%", flag: "In range", isLenient: false },
                    { team: "Finance", avg: "3.60", rated45: "60%", flag: "In range", isLenient: false },
                  ].map((row, idx) => (
                    <tr key={row.team} style={{ borderBottom: idx === 6 ? "none" : "1px solid #F1F5F9" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--ink)" }}>
                        {row.team}
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: "var(--f-mono)", fontWeight: 600 }}>
                        {row.avg}
                      </td>
                      <td style={{ padding: "10px 14px", fontFamily: "var(--f-mono)", fontWeight: 600 }}>
                        {row.rated45}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: 99,
                          background: row.isLenient ? "#FEF3C7" : "#ECFDF5",
                          color: row.isLenient ? "#D97706" : "#059669",
                          border: row.isLenient ? "1px solid #FDE68A" : "1px solid #A7F3D0",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4
                        }}>
                          ● {row.flag}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>
              Use as prompts for the calibration meeting. Guidelines are not forced quotas.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
