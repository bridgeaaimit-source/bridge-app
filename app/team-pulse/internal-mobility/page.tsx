"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft, Sparkles, UserCheck } from "lucide-react";

export default function InternalMobilityPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState("Senior Data Analyst");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/team-pulse/employees");
        if (res.ok) {
          const list = await res.json();
          setEmployees(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const internalMatches = employees
    .filter((e) => e.role !== selectedRole && e.perf >= 3)
    .slice(0, 4)
    .map((e) => ({
      ...e,
      matchScore: Math.min(95, Math.max(60, Math.round(e.perf * 15 + e.potential * 10))),
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Internal Mobility & Referrals
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Internal Mobility Matcher</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Match internal employees to open job roles with reskilling paths before hiring externally, saving recruiting fees and ramp time.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        <div className="tp-panel stack">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Target Open Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line2)", marginTop: 4 }}
            >
              <option value="Senior Data Analyst">Senior Data Analyst (Data)</option>
              <option value="Backend Engineer (SDE II)">Backend Engineer (Engineering)</option>
              <option value="Product Designer">Product Designer (Product)</option>
              <option value="Enterprise Account Executive">Enterprise Account Executive (Sales)</option>
            </select>
          </div>

          <div style={{ padding: 12, borderRadius: 10, background: "var(--good-soft)", color: "var(--good-ink)", fontSize: 12.5 }}>
            <b>Cost Saving:</b> Filling this role internally saves ~₹4.2 L in agency fees & ~30 days of onboarding time.
          </div>
        </div>

        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Top Internal Candidates</h3>

          {loading ? (
            <div style={{ color: "var(--muted)" }}>Matching internal talent…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {internalMatches.map((e) => (
                <div key={e.id} style={{ padding: 12, borderRadius: 10, border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      Current: {e.role} ({e.dept}) | Performance: {e.perf}/5
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--good)" }}>{e.matchScore}%</div>
                    <button className="tp-btn" style={{ fontSize: 11, padding: "3px 8px", marginTop: 4 }}>
                      <UserCheck style={{ width: 12, height: 12 }} /> Nominate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
