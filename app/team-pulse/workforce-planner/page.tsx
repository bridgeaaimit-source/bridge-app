"use client";

import { useState } from "react";
import { BarChart3, Sparkles, DollarSign, Users, Calendar } from "lucide-react";

export default function WorkforcePlannerPage() {
  const [scenario, setScenario] = useState("Aggressive Growth");
  const [attritionAssump, setAttritionAssump] = useState(15);
  const [recCapacity, setRecCapacity] = useState(5);
  const [agencyFee, setAgencyFee] = useState(8.33);
  const [aiSummary, setAiSummary] = useState("");

  const growthRates: Record<string, number> = scenario === "Aggressive Growth"
    ? { Engineering: 25, Data: 30, Product: 20, Sales: 35, CS: 25, HR: 20, Finance: 15 }
    : scenario === "Cost Freeze"
    ? { Engineering: 0, Data: 0, Product: 0, Sales: 0, CS: 0, HR: 0, Finance: 0 }
    : { Engineering: 10, Data: 12, Product: 8, Sales: 10, CS: 10, HR: 5, Finance: 5 };

  const totalHires = scenario === "Aggressive Growth" ? 28 : scenario === "Cost Freeze" ? 4 : 14;
  const addedPayrollCr = (totalHires * 0.18).toFixed(2);
  const recruitingSpendLpa = (totalHires * 18 * (agencyFee / 100)).toFixed(1);
  const timeToStaffMonths = Math.ceil(totalHires / recCapacity);

  const handleGenerateNarrative = async () => {
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Write a 4-bullet workforce scenario executive summary for leadership. Scenario: ${scenario}. Total Hires Needed: ${totalHires}. Added Payroll: ₹${addedPayrollCr} Cr. Recruiting Spend: ₹${recruitingSpendLpa} L. Time to staff: ${timeToStaffMonths} months.`,
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
          Workforce Planning
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Growth Scenario Planner</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Run 12-month growth scenarios: headcount growth, recruiting budget, payroll impact, timeline to staff, and build/buy/borrow skill matrix.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Controls */}
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Scenario Inputs</h3>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Preset Scenario</label>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {["Steady", "Aggressive Growth", "Cost Freeze"].map((p) => (
                <button
                  key={p}
                  onClick={() => setScenario(p)}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    borderRadius: 8,
                    border: "1px solid var(--line2)",
                    background: scenario === p ? "var(--indigo)" : "#fff",
                    color: scenario === p ? "#fff" : "var(--ink)",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ margin: "6px 0", height: 1, background: "var(--line)" }} />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600 }}>
              <span>Expected Attrition Rate</span>
              <span>{attritionAssump}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={attritionAssump}
              onChange={(e) => setAttritionAssump(Number(e.target.value))}
              style={{ width: "100%", marginTop: 4 }}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, fontWeight: 600 }}>
              <span>Recruiting Capacity</span>
              <span>{recCapacity} hires / month</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              value={recCapacity}
              onChange={(e) => setRecCapacity(Number(e.target.value))}
              style={{ width: "100%", marginTop: 4 }}
            />
          </div>
        </div>

        {/* Right Outputs & Skill Matrix */}
        <div className="tp-panel stack">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            <div style={{ padding: 14, borderRadius: 12, background: "var(--tint)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--green)" }}>{totalHires}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>Hires Needed Next 12 Mo</div>
            </div>

            <div style={{ padding: 14, borderRadius: 12, background: "var(--tint)", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--indigo)" }}>₹{addedPayrollCr} Cr</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>Added Annual Payroll</div>
            </div>
          </div>

          <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />

          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Skills Gap: Build, Buy or Borrow</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--tint)", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Skill</th>
                <th style={{ padding: 8 }}>Team</th>
                <th style={{ padding: 8 }}>Gap</th>
                <th style={{ padding: 8 }}>Strategy</th>
              </tr>
            </thead>
            <tbody>
              {[
                { skill: "System Design", dept: "Engineering", gap: "-3", strat: "Build (Upskill)" },
                { skill: "Kubernetes", dept: "Engineering", gap: "-2", strat: "Borrow (Contractor)" },
                { skill: "Machine Learning", dept: "Data", gap: "-2", strat: "Buy (Hire)" },
                { skill: "Enterprise Sales", dept: "Sales", gap: "-4", strat: "Buy (Hire)" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: 8, fontWeight: 700 }}>{row.skill}</td>
                  <td style={{ padding: 8 }}>{row.dept}</td>
                  <td style={{ padding: 8, color: "var(--crit)", fontWeight: 700 }}>{row.gap}</td>
                  <td style={{ padding: 8 }}>
                    <span style={{ padding: "2px 8px", borderRadius: 99, background: "var(--indigo-soft)", color: "var(--indigo-ink)", fontWeight: 700, fontSize: 11 }}>
                      {row.strat}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={handleGenerateNarrative} className="tp-btn tp-btn-ai" style={{ marginTop: 12 }}>
            <Sparkles style={{ width: 15, height: 15 }} /> Generate Leadership Summary
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
