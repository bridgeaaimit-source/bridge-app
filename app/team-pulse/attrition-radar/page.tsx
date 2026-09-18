"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, Sparkles, DollarSign } from "lucide-react";

export default function AttritionRadarPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [aiGuide, setAiGuide] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttrition() {
      try {
        const res = await fetch(`/api/team-pulse/attrition?level=${selectedLevel}`);
        if (res.ok) {
          const json = await res.json();
          setEmployees(json.employees || []);
          if (json.employees?.length > 0) setSelectedEmpId(json.employees[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadAttrition();
  }, [selectedLevel]);

  const emp = employees.find((e) => e.id === selectedEmpId);

  const handleGenerateStayGuide = async () => {
    if (!emp) return;
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a 4-question stay interview guide for employee ${emp.name} (${emp.role}, ${emp.dept}, Flight Risk: ${emp.riskScore}/100, Drivers: ${JSON.stringify(emp.drivers)}).`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiGuide(json.reply);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const highRiskCount = employees.filter((e) => e.riskLevel === "high").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Attrition Radar
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Flight Risk Intelligence</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Predict flight risk for every employee, identify primary risk drivers, calculate replacement cost, and generate retention stay-interview guides.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20 }}>
        {/* Left Employee Risk Table */}
        <div className="tp-panel stack">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Employee Flight Risk Ranking</h3>

            <div style={{ display: "flex", gap: 4, background: "var(--tint)", padding: 4, borderRadius: 8 }}>
              {["All", "high", "med", "low"].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  style={{
                    border: 0,
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    background: selectedLevel === lvl ? "#fff" : "transparent",
                    color: selectedLevel === lvl ? "var(--ink)" : "var(--muted)",
                    cursor: "pointer",
                  }}
                >
                  {lvl.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>Calculating flight risks…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {employees.map((e) => {
                const isSelected = e.id === selectedEmpId;
                return (
                  <div
                    key={e.id}
                    onClick={() => setSelectedEmpId(e.id)}
                    style={{
                      padding: 12,
                      borderRadius: 10,
                      border: isSelected ? "2px solid var(--indigo)" : "1px solid var(--line)",
                      background: isSelected ? "var(--indigo-soft)" : "#fff",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        {e.role} · {e.dept} | Rating: {e.perf}/5
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: e.riskLevel === "high" ? "var(--crit)" : "var(--warn)" }}>
                        {e.riskScore}/100
                      </div>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 99,
                          background: e.riskLevel === "high" ? "var(--crit-soft)" : "var(--warn-soft)",
                          color: e.riskLevel === "high" ? "var(--crit)" : "var(--warn)",
                        }}
                      >
                        {e.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Selected Employee Breakdown */}
        {emp && (
          <div className="tp-panel stack">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{emp.name}</h3>
                <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                  {emp.role} · {emp.dept}
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: emp.riskLevel === "high" ? "var(--crit)" : "var(--warn)" }}>
                  {emp.riskScore}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Flight Risk Score</div>
              </div>
            </div>

            <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />

            <h4 style={{ fontSize: 14, fontWeight: 700 }}>Risk Drivers Breakdown</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {emp.drivers.map((d: any, idx: number) => (
                <div key={idx} style={{ padding: 8, borderRadius: 8, background: "var(--tint2)", fontSize: 12.5, display: "flex", justifyContent: "space-between" }}>
                  <span>{d[1]}</span>
                  <b style={{ color: "var(--crit)" }}>+{d[2]} pts</b>
                </div>
              ))}
            </div>

            <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />

            <div style={{ fontSize: 12.5, display: "flex", flexDirection: "column", gap: 6 }}>
              <div>
                <b>Current CTC:</b> ₹{emp.ctc} LPA | <b>Market Rate:</b> ₹{emp.market} LPA
              </div>
              <div style={{ color: "var(--crit)" }}>
                <b>Estimated Replacement Cost:</b> ₹{emp.replCostLpa} LPA
              </div>
              <div style={{ color: "var(--good)" }}>
                <b>Cost to Fix Pay (to 95% market):</b> ₹{emp.fixPayCostLpa} LPA / yr
              </div>
            </div>

            <button onClick={handleGenerateStayGuide} className="tp-btn tp-btn-ai" style={{ marginTop: 12 }}>
              <Sparkles style={{ width: 15, height: 15 }} /> Generate Stay-Interview Guide
            </button>

            {aiGuide && (
              <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
                {aiGuide}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
