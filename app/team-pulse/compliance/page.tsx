"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Bell, Sparkles, AlertCircle } from "lucide-react";

export default function ComplianceCenterPage() {
  const [data, setData] = useState<any>(null);
  const [reminded, setReminded] = useState(false);
  const [aiReport, setAiReport] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompliance() {
      try {
        const res = await fetch("/api/team-pulse/compliance");
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
    loadCompliance();
  }, []);

  const handleSendReminders = async () => {
    try {
      const res = await fetch("/api/team-pulse/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remind" }),
      });
      if (res.ok) {
        setReminded(true);
        alert("Compliance reminders sent to all overdue employees and their managers!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateRiskReport = async () => {
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Write a compliance risk report for leadership summarizing POSH, Fire Safety, and statutory filing obligations.",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiReport(json.reply);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, color: "var(--muted)" }}>Loading Compliance Center data…</div>;
  }

  const companyRecords = data?.companyRecords || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Compliance Center
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Statutory & Mandatory Training Compliance</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          POSH, Fire Safety, DPDP Data Privacy, Code of Conduct mandatory training rates, missing employee documents, and statutory filing readiness.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Statutory Checklist */}
        <div className="tp-panel stack">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Company Statutory Checklist</h3>
            <span style={{ fontSize: 12, color: "var(--good)", fontWeight: 700 }}>{data?.trainingRate || 84}% Rate</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {companyRecords.map((rec: any) => (
              <div key={rec.id} style={{ padding: 10, borderRadius: 10, border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{rec.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                    {rec.area} · {rec.dueDate}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 99,
                    background: rec.status === "done" ? "var(--good-soft)" : rec.status === "due" ? "var(--warn-soft)" : "var(--crit-soft)",
                    color: rec.status === "done" ? "var(--good-ink)" : rec.status === "due" ? "var(--warn)" : "var(--crit)",
                  }}
                >
                  {rec.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>

          <button onClick={handleSendReminders} disabled={reminded} className="tp-btn tp-btn-primary" style={{ marginTop: 10 }}>
            <Bell style={{ width: 15, height: 15 }} /> {reminded ? "Reminders Sent" : `Send Reminders to ${data?.overdueEmployeesCount || 4} Overdue Employees`}
          </button>
        </div>

        {/* Right Employee Compliance & AI Summary */}
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Mandatory Training Matrix</h3>

          <div style={{ fontSize: 13, color: "var(--ink2)" }}>
            • <b>POSH Awareness:</b> {data?.overdueEmployeesCount || 4} employees overdue (Sales & Eng).<br />
            • <b>Fire Safety Drill:</b> 18 days overdue (Bengaluru office).<br />
            • <b>DPDP Data Privacy:</b> {data?.missingDocsEmployeesCount || 3} employees missing signed privacy consent.
          </div>

          <button onClick={handleGenerateRiskReport} className="tp-btn tp-btn-ai" style={{ marginTop: 12 }}>
            <Sparkles style={{ width: 15, height: 15 }} /> Generate Executive Compliance Risk Report
          </button>

          {aiReport && (
            <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
              {aiReport}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
