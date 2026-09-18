"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, Users, AlertTriangle, Clock, Send, Info } from "lucide-react";

interface MatrixRow {
  id: string;
  initials: string;
  name: string;
  avatarBg: string;
  posh: "done" | "late" | "due";
  fire: "done" | "late" | "due";
  code: "done" | "late" | "due";
  data: "done" | "late" | "due";
  infosec: "done" | "late" | "due";
  abac: "done" | "none";
  docs: "done" | "1 missing" | "2 missing";
  hasGap: boolean;
}

const MATRIX_DATA: MatrixRow[] = [
  { id: "sd", initials: "SD", name: "Sameer Das", avatarBg: "#10B981", posh: "done", fire: "done", code: "late", data: "late", infosec: "done", abac: "none", docs: "2 missing", hasGap: true },
  { id: "am", initials: "AM", name: "Aditya Menon", avatarBg: "#10B981", posh: "done", fire: "late", code: "done", data: "due", infosec: "done", abac: "none", docs: "done", hasGap: true },
  { id: "bs", initials: "BS", name: "Bhavna Singh", avatarBg: "#F97316", posh: "due", fire: "done", code: "done", data: "done", infosec: "done", abac: "none", docs: "done", hasGap: true },
  { id: "nv", initials: "NV", name: "Nisha Verma", avatarBg: "#F97316", posh: "done", fire: "due", code: "done", data: "done", infosec: "late", abac: "none", docs: "done", hasGap: true },
  { id: "ak", initials: "AK", name: "Ananya Kulkarni", avatarBg: "#F97316", posh: "done", fire: "done", code: "done", data: "done", infosec: "done", abac: "none", docs: "1 missing", hasGap: true },
  { id: "mb", initials: "MB", name: "Madhuri Bose", avatarBg: "#F97316", posh: "done", fire: "done", code: "due", data: "done", infosec: "done", abac: "none", docs: "done", hasGap: true },
  { id: "tg", initials: "TG", name: "Tejas Ghosh", avatarBg: "#2563EB", posh: "late", fire: "done", code: "done", data: "done", infosec: "done", abac: "done", docs: "done", hasGap: true },
  { id: "rb", initials: "RB", name: "Rohan Bhat", avatarBg: "#2563EB", posh: "done", fire: "done", code: "done", data: "late", infosec: "done", abac: "none", docs: "1 missing", hasGap: true },
  { id: "ib", initials: "IB", name: "Ishita Bose", avatarBg: "#2563EB", posh: "done", fire: "done", code: "done", data: "done", infosec: "done", abac: "none", docs: "1 missing", hasGap: true },
  { id: "is", initials: "IS", name: "Imran Sharma", avatarBg: "#2563EB", posh: "done", fire: "done", code: "done", data: "done", infosec: "late", abac: "done", docs: "done", hasGap: true },
  { id: "rv", initials: "RV", name: "Rohan Verma", avatarBg: "#2563EB", posh: "late", fire: "done", code: "done", data: "due", infosec: "late", abac: "done", docs: "done", hasGap: true },
  { id: "sg", initials: "SG", name: "Sameer Gupta", avatarBg: "#2563EB", posh: "done", fire: "done", code: "done", data: "done", infosec: "done", abac: "none", docs: "1 missing", hasGap: true },
  { id: "tq", initials: "TQ", name: "Tejas Qureshi", avatarBg: "#2563EB", posh: "done", fire: "late", code: "done", data: "done", infosec: "due", abac: "none", docs: "done", hasGap: true },
  { id: "mk", initials: "MK", name: "Mohit Khan", avatarBg: "#2563EB", posh: "done", fire: "late", code: "done", data: "done", infosec: "done", abac: "none", docs: "done", hasGap: true },
  { id: "kr", initials: "KR", name: "Kavya Reddy", avatarBg: "#2563EB", posh: "done", fire: "late", code: "done", data: "done", infosec: "done", abac: "none", docs: "done", hasGap: true },
  { id: "ij", initials: "IJ", name: "Imran Joshi", avatarBg: "#2563EB", posh: "done", fire: "done", code: "done", data: "done", infosec: "due", abac: "none", docs: "done", hasGap: true },
];

export default function ComplianceCenterPage() {
  const [onlyGaps, setOnlyGaps] = useState(true);
  const [selectedDept, setSelectedDept] = useState("All");
  const [remindersSent, setRemindersSent] = useState(false);

  const [aiOutput, setAiOutput] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const filteredMatrix = MATRIX_DATA.filter((row) => {
    if (onlyGaps && !row.hasGap) return false;
    return true;
  });

  const handleSendReminders = () => {
    setRemindersSent(true);
    setTimeout(() => setRemindersSent(false), 4000);
  };

  const handleGenerateAi = async (type: "reminder" | "risk") => {
    setLoadingAi(true);
    try {
      const promptText = type === "reminder"
        ? "Draft a gentle but firm email reminder to 26 employees with overdue POSH, Fire Safety, and Code of Conduct compliance items."
        : "Draft an executive compliance risk summary for leadership covering mandatory training rates (76%) and company-level statutory filing readiness.";

      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiOutput(json.reply);
      } else {
        setAiOutput(
          type === "reminder"
            ? `**COMPLIANCE REMINDER NOTICE**\n\n` +
              `Subject: Mandatory Compliance & Training Action Required\n\n` +
              `Dear Team,\n\n` +
              `This is a reminder that you have 1 or more pending statutory compliance training items (POSH, Fire Safety, or Code of Conduct).\n\n` +
              `Please log in to the portal and complete your assigned modules before the end of the week.\n\n` +
              `Thank you,\nCompliance Operations`
            : `**EXECUTIVE COMPLIANCE RISK SUMMARY**\n\n` +
              `1. **Training Completion:** Overall mandatory course completion stands at 76% (10 of 64 employees fully compliant).\n` +
              `2. **Overdue Items:** 26 employees have 1+ overdue items (POSH overdue: 12 employees).\n` +
              `3. **Statutory Filings:** Half-yearly fire drill is 10 days overdue for the Bengaluru office. Professional Tax and PF/ESI monthly returns are up to date.`
        );
      }
    } catch {
      setAiOutput(
        type === "reminder"
          ? `**COMPLIANCE REMINDER NOTICE**\n\n` +
            `Subject: Mandatory Compliance & Training Action Required\n\n` +
            `Dear Team,\n\n` +
            `This is a reminder that you have 1 or more pending statutory compliance training items (POSH, Fire Safety, or Code of Conduct).\n\n` +
            `Please log in to the portal and complete your assigned modules before the end of the week.\n\n` +
            `Thank you,\nCompliance Operations`
          : `**EXECUTIVE COMPLIANCE RISK SUMMARY**\n\n` +
            `1. **Training Completion:** Overall mandatory course completion stands at 76% (10 of 64 employees fully compliant).\n` +
            `2. **Overdue Items:** 26 employees have 1+ overdue items (POSH overdue: 12 employees).\n` +
            `3. **Statutory Filings:** Half-yearly fire drill is 10 days overdue for the Bengaluru office. Professional Tax and PF/ESI monthly returns are up to date.`
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
            Compliance Center
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Stay audit-ready: POSH, fire safety, data privacy and code-of-conduct training for every employee, missing documents and company-level statutory items.
          </p>
        </div>

        <button
          onClick={() => {
            setOnlyGaps(true);
            setSelectedDept("All");
            setAiOutput("");
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
        {/* Card 1: Training compliance */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#059669" }}>
            <CheckCircle style={{ width: 16, height: 16, color: "#10B981" }} />
            Training compliance
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>76%</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            All mandatory courses
          </div>
        </div>

        {/* Card 2: Fully compliant people */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#2563EB" }}>
            <Users style={{ width: 16, height: 16, color: "#3B82F6" }} />
            Fully compliant people
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>10</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            of 64 employees
          </div>
        </div>

        {/* Card 3: People with overdue items */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#DC2626" }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#EF4444" }} />
            People with overdue items
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>26</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            POSH overdue: 12
          </div>
        </div>

        {/* Card 4: Company items due */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 700, color: "#D97706" }}>
            <Clock style={{ width: 16, height: 16, color: "#F59E0B" }} />
            Company items due
          </div>
          <div style={{ margin: "10px 0 2px 0" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>5</span>
          </div>
          <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
            2 overdue
          </div>
        </div>
      </div>

      {/* Row 1: Completion by Course (45%) & Company-level Checklist (55%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 20 }}>
        {/* Completion by Course Card */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            Completion by course
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
            {[
              { label: "POSH awareness", pct: 73, color: "#EF4444" },
              { label: "Fire safety & evacuation", pct: 78, color: "#EF4444" },
              { label: "Code of conduct", pct: 78, color: "#EF4444" },
              { label: "Data privacy (DPDP)", pct: 69, color: "#EF4444" },
              { label: "Information security", pct: 80, color: "#EF4444" },
              { label: "Anti-bribery", pct: 83, color: "#D97706" },
            ].map((course) => (
              <div key={course.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 3 }}>
                  <span>{course.label}</span>
                  <span style={{ fontFamily: "var(--f-mono)", fontWeight: 700, color: "var(--ink)" }}>{course.pct}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 99, background: "#F1F5F9", overflow: "hidden" }}>
                  <div style={{ width: `${course.pct}%`, height: "100%", background: course.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic", paddingTop: 4 }}>
            Hover a bar to see why the course is required.
          </div>
        </div>

        {/* Company-level Checklist Card */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Company-level checklist
            </h3>
            <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
              Bengaluru office
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto" }}>
            {[
              { title: "Internal Committee (POSH) constituted & notice displayed", sub: "POSH · Reviewed Jul 2026", status: "Done", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
              { title: "Annual POSH report filed with District Officer", sub: "POSH · Due in 112 days", status: "Due soon", color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
              { title: "Fire NOC renewal — Bengaluru office", sub: "Safety · Expires in 21 days", status: "Due soon", color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
              { title: "Half-yearly fire drill conducted", sub: "Safety · Overdue by 10 days", status: "Overdue", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
              { title: "Shops & Establishments registration", sub: "Registrations · Valid to Mar 2028", status: "Done", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
              { title: "PF & ESI monthly returns (Aug 2026)", sub: "Statutory · Filed 12 Aug", status: "Done", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
              { title: "Professional Tax — Karnataka (Aug 2026)", sub: "Statutory · Filed 18 Aug", status: "Done", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
              { title: "Statutory registers updated (wages, attendance)", sub: "Statutory · Due in 9 days", status: "Due soon", color: "#D97706", bg: "#FEF3C7", border: "#FDE68A" },
              { title: "Employee privacy notice (DPDP) issued", sub: "Data · Issued Mar 2026", status: "Done", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
              { title: "Maternity benefit & leave policy published", sub: "Policy · Updated Jan 2026", status: "Done", color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" },
              { title: "First-aid kits & certified first-aiders (2)", sub: "Safety · 1 certificate expired", status: "Overdue", color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
            ].map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #F1F5F9" }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)" }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{item.sub}</div>
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 800, padding: "3px 8px", borderRadius: 99,
                  background: item.bg, color: item.color, border: `1px solid ${item.border}`, flexShrink: 0
                }}>
                  ● {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Employee Compliance Matrix Table */}
      <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            Employee compliance matrix
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Toggle Switch: Only people with gaps */}
            <div
              onClick={() => setOnlyGaps(!onlyGaps)}
              style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
            >
              <span style={{
                width: 32, height: 18, borderRadius: 99, background: onlyGaps ? "#F97316" : "#CBD5E1",
                position: "relative", transition: "all 0.15s ease", display: "inline-block"
              }}>
                <span style={{
                  width: 14, height: 14, borderRadius: "50%", background: "#FFF",
                  position: "absolute", top: 2, left: onlyGaps ? 16 : 2, transition: "all 0.15s ease"
                }} />
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
                Only people with gaps
              </span>
            </div>

            {/* Department Select */}
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                height: 32, padding: "0 10px", borderRadius: 8, border: "1px solid #CBD5E1",
                fontSize: 12, fontWeight: 600, color: "var(--ink)", background: "#FFF", outline: "none"
              }}
            >
              {["All", "Engineering", "Data", "Product", "Sales", "Customer Success", "HR", "Finance"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Matrix Table */}
        <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "center" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em" }}>
                <th style={{ padding: "10px 14px", textAlign: "left" }}>EMPLOYEE</th>
                <th style={{ padding: "10px 12px" }}>POSH</th>
                <th style={{ padding: "10px 12px" }}>FIRE</th>
                <th style={{ padding: "10px 12px" }}>CODE</th>
                <th style={{ padding: "10px 12px" }}>DATA</th>
                <th style={{ padding: "10px 12px" }}>INFOSEC</th>
                <th style={{ padding: "10px 12px" }}>ABAC</th>
                <th style={{ padding: "10px 12px" }}>DOCS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatrix.map((row, idx) => {
                const renderCell = (val: "done" | "late" | "due" | "none") => {
                  if (val === "done") {
                    return <span style={{ padding: "4px 10px", borderRadius: 6, background: "#ECFDF5", color: "#059669", fontWeight: 800 }}>✓</span>;
                  }
                  if (val === "late") {
                    return <span style={{ padding: "4px 10px", borderRadius: 6, background: "#FEF2F2", color: "#DC2626", fontWeight: 800 }}>Late</span>;
                  }
                  if (val === "due") {
                    return <span style={{ padding: "4px 10px", borderRadius: 6, background: "#FEF3C7", color: "#D97706", fontWeight: 800 }}>Due</span>;
                  }
                  return <span style={{ color: "#94A3B8" }}>—</span>;
                };

                const renderDocsCell = (val: string) => {
                  if (val === "done") {
                    return <span style={{ padding: "4px 10px", borderRadius: 6, background: "#ECFDF5", color: "#059669", fontWeight: 800 }}>✓</span>;
                  }
                  return <span style={{ padding: "4px 10px", borderRadius: 6, background: "#FEF2F2", color: "#DC2626", fontWeight: 800 }}>{val}</span>;
                };

                return (
                  <tr key={row.id} style={{ borderBottom: idx === filteredMatrix.length - 1 ? "none" : "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 14px", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", background: row.avatarBg, color: "#FFF",
                          fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                          {row.initials}
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--ink)", fontSize: 12.5 }}>{row.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 6px" }}>{renderCell(row.posh)}</td>
                    <td style={{ padding: "8px 6px" }}>{renderCell(row.fire)}</td>
                    <td style={{ padding: "8px 6px" }}>{renderCell(row.code)}</td>
                    <td style={{ padding: "8px 6px" }}>{renderCell(row.data)}</td>
                    <td style={{ padding: "8px 6px" }}>{renderCell(row.infosec)}</td>
                    <td style={{ padding: "8px 6px" }}>{renderCell(row.abac)}</td>
                    <td style={{ padding: "8px 6px" }}>{renderDocsCell(row.docs)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Button: Send reminders to 26 people */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={handleSendReminders}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              borderRadius: 99,
              background: "#F97316",
              border: "none",
              color: "#FFF",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(249, 115, 22, 0.3)"
            }}
          >
            <Send style={{ width: 14, height: 14 }} />
            {remindersSent ? "Reminders sent!" : "Send reminders to 26 people & their managers"}
          </button>

          <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
            17 people have missing documents
          </span>
        </div>
      </div>

      {/* Row 3: Compliance Assistant (40%) & About Checklist (60%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>
        {/* Compliance Assistant AI Box */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
              <Sparkles style={{ width: 17, height: 17, color: "#6366F1" }} />
              Compliance assistant
            </div>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
              background: aiOutput ? "#E0F2FE" : "#F1F5F9", color: aiOutput ? "#0369A1" : "#64748B"
            }}>
              {aiOutput ? "READY" : "WAITING"}
            </span>
          </div>

          <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
            Draft a reminder or a risk summary for leadership.
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => handleGenerateAi("reminder")}
              disabled={loadingAi}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 99,
                background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)",
                border: "none",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: loadingAi ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(99, 102, 241, 0.25)"
              }}
            >
              <Sparkles style={{ width: 13, height: 13 }} />
              Draft reminder email
            </button>

            <button
              onClick={() => handleGenerateAi("risk")}
              disabled={loadingAi}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 99,
                background: "linear-gradient(135deg, #EC4899 0%, #F97316 100%)",
                border: "none",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: loadingAi ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(236, 72, 153, 0.25)"
              }}
            >
              <Sparkles style={{ width: 13, height: 13 }} />
              Risk summary
            </button>
          </div>

          {aiOutput && (
            <div style={{
              background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
              fontSize: 13, color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap"
            }}>
              {aiOutput}
            </div>
          )}
        </div>

        {/* About this checklist Info Panel */}
        <div style={{
          background: "#F8FAFC",
          border: "1px solid #E2E8F0",
          borderRadius: 20,
          padding: 22,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          fontSize: 12.5,
          color: "#475569",
          lineHeight: 1.6
        }}>
          <div>
            <b style={{ color: "var(--ink)" }}>About this checklist:</b> It's an illustrative set of common Indian workplace obligations: the POSH Act 2013 Internal Committee and annual report, fire NOC and drills, DPDP Act 2023 privacy notices, PF/ESI/PT filings, and Shops & Establishments registration. Confirm exact obligations for your state and headcount with legal counsel.
          </div>
        </div>
      </div>
    </div>
  );
}
