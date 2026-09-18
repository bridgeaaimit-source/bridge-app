"use client";

import { useEffect, useState } from "react";
import { TrendingUp, AlertTriangle, CheckCircle, Sparkles, Award } from "lucide-react";

const BOX9 = [
  { label: "Enigma", pot: 3, perf: 1, color: "var(--warn-soft)" },
  { label: "Growth Talent", pot: 3, perf: 2, color: "var(--indigo-soft)" },
  { label: "Future Leaders", pot: 3, perf: 3, color: "var(--good-soft)" },
  { label: "Inconsistent", pot: 2, perf: 1, color: "var(--warn-soft)" },
  { label: "Core Players", pot: 2, perf: 2, color: "var(--tint2)" },
  { label: "High Performers", pot: 2, perf: 3, color: "var(--indigo-soft)" },
  { label: "Underperformers", pot: 1, perf: 1, color: "var(--crit-soft)" },
  { label: "Effective", pot: 1, perf: 2, color: "var(--tint2)" },
  { label: "Trusted Experts", pot: 1, perf: 3, color: "var(--sky-soft)" },
];

export default function PerformancePage() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("9-box");
  const [selectedDept, setSelectedDept] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPerf() {
      try {
        const res = await fetch(`/api/team-pulse/performance?dept=${selectedDept}`);
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
    loadPerf();
  }, [selectedDept]);

  if (loading) {
    return <div style={{ padding: 40, color: "var(--muted)" }}>Loading performance control room…</div>;
  }

  const employees = data?.employees || [];
  const promoReady = data?.promoReady || [];
  const pipWatchlist = data?.pipWatchlist || [];

  const getPerfBand = (rating: number) => (rating <= 2 ? 1 : rating === 3 ? 2 : 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Performance & Promotions
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Appraisal Control Room</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          9-Box talent grid, promotion readiness ranking, PIP watchlist, and rating distribution calibration.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
        <div className="tp-kpi">
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <Award style={{ width: 16, height: 16, color: "var(--good)" }} /> Promotion Ready
          </div>
          <div className="tp-kpi-val" style={{ color: "var(--good)" }}>{promoReady.length}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>of {employees.length} employees reviewed</div>
        </div>

        <div className="tp-kpi">
          <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "var(--crit)" }} /> PIP Watchlist
          </div>
          <div className="tp-kpi-val" style={{ color: "var(--crit)" }}>{pipWatchlist.length}</div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>Low ratings 2 cycles running</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "var(--tint)", padding: 4, borderRadius: 10 }}>
          {["9-box", "Promotion Ready", "PIP Watchlist"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                border: 0,
                padding: "6px 12px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "var(--ink)" : "var(--muted)",
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{ padding: 6, borderRadius: 8, border: "1px solid var(--line2)", fontSize: 12.5 }}
        >
          {["All", "Engineering", "Data", "Product", "Sales", "Customer Success", "HR", "Finance"].map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* 9-Box Grid View */}
      {activeTab === "9-box" && (
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>9-Box Talent Matrix</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 10 }}>
            {[3, 2, 1].flatMap((pot) =>
              [1, 2, 3].map((perf) => {
                const box = BOX9.find((b) => b.pot === pot && b.perf === perf);
                const count = employees.filter((e: any) => getPerfBand(e.perf) === perf && e.potential === pot).length;
                return (
                  <div
                    key={`${pot}-${perf}`}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: box?.color || "var(--tint)",
                      minHeight: 110,
                      border: "1px solid var(--line)",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, display: "flex", justifyContent: "space-between" }}>
                      <span>{box?.label}</span>
                      <span style={{ fontFamily: "var(--f-mono)" }}>{count}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>
                      Pot: {pot === 3 ? "High" : pot === 2 ? "Mid" : "Low"} | Perf: {perf === 3 ? "High" : perf === 2 ? "Mid" : "Low"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Promotion Ready Table */}
      {activeTab === "Promotion Ready" && (
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Promotion-Ready Candidates</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", background: "var(--tint)", textAlign: "left" }}>
                <th style={{ padding: 10 }}>Employee</th>
                <th style={{ padding: 10 }}>Role</th>
                <th style={{ padding: 10 }}>Ratings</th>
                <th style={{ padding: 10 }}>Time in Level</th>
                <th style={{ padding: 10 }}>Suggested Hike</th>
              </tr>
            </thead>
            <tbody>
              {promoReady.map((e: any) => (
                <tr key={e.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: 10, fontWeight: 700 }}>{e.name}</td>
                  <td style={{ padding: 10 }}>
                    {e.role} ({e.dept})
                  </td>
                  <td style={{ padding: 10 }}>
                    {e.perfPrev} → {e.perf} / 5
                  </td>
                  <td style={{ padding: 10 }}>{e.timeInLevel} yrs</td>
                  <td style={{ padding: 10, fontWeight: 700, color: "var(--good)" }}>+{e.suggestedHike}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PIP Watchlist View */}
      {activeTab === "PIP Watchlist" && (
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Supportive PIP Watchlist</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {pipWatchlist.map((e: any) => (
              <div key={e.id} style={{ padding: 14, borderRadius: 12, border: "1px solid var(--line)", background: "var(--crit-soft)" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "var(--crit)" }}>{e.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                  {e.role} · {e.dept}
                </div>
                <div style={{ fontSize: 12, marginTop: 8 }}>
                  <b>Rating History:</b> {e.perfPrev} → {e.perf}/5 | <b>Goals Achieved:</b> {e.goals}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
