"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, Info, Users, Sparkles } from "lucide-react";

const MBTI_TYPES = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
];

export default function PersonalityLabPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [coachingGuide, setCoachingGuide] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/team-pulse/employees");
        if (res.ok) {
          const list = await res.json();
          setEmployees(list);
          if (list.length > 0) setSelectedEmpId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredEmps = employees.filter((e) => {
    if (selectedDept !== "All" && e.dept !== selectedDept) return false;
    if (selectedType && e.mbti !== selectedType) return false;
    return true;
  });

  const selectedEmp = employees.find((e) => e.id === selectedEmpId);

  const handleGenerateCoaching = async () => {
    if (!selectedEmp) return;
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a manager coaching guide for employee ${selectedEmp.name} (${selectedEmp.role}, ${selectedEmp.dept}, MBTI: ${selectedEmp.mbti}). Include how to communicate, motivate, and handle feedback.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setCoachingGuide(json.reply);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Personality Lab
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>MBTI & Team Preference Distribution</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Analyze team personality composition, role preference fit, and generate manager coaching guides. (Used for communication aid, never for hiring/rejecting).
        </p>
      </div>

      <div style={{ padding: 12, borderRadius: 12, background: "var(--indigo-soft)", color: "var(--indigo-ink)", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
        <Info style={{ width: 18, height: 18, flexShrink: 0 }} />
        <span><b>Ethical Guideline:</b> MBTI describes work style preferences, not capability. Use it to foster team communication, never to decide hiring or promotions.</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        {/* Left 16-type grid */}
        <div className="tp-panel stack">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>16-Type Distribution Map</h3>
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {MBTI_TYPES.map((type) => {
              const count = employees.filter((e) => e.mbti === type && (selectedDept === "All" || e.dept === selectedDept)).length;
              const isSelected = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(isSelected ? null : type)}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    border: isSelected ? "2px solid var(--indigo)" : "1px solid var(--line2)",
                    background: isSelected ? "var(--indigo-soft)" : "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 14, color: isSelected ? "var(--indigo-ink)" : "var(--ink)" }}>{type}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{count} people</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Employee Profile & Coaching */}
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Person Coaching Profile</h3>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Select Employee</label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line2)", marginTop: 4 }}
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.role} ({e.dept}) - {e.mbti}
                </option>
              ))}
            </select>
          </div>

          {selectedEmp && (
            <div style={{ padding: 14, borderRadius: 10, background: "var(--tint)", display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedEmp.name}</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                {selectedEmp.role} · {selectedEmp.dept} | MBTI: <b>{selectedEmp.mbti}</b>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink2)", marginTop: 4 }}>
                <b>Performance Rating:</b> {selectedEmp.perf}/5 | <b>Flight Risk:</b> {selectedEmp.flightRiskScore}/100 ({selectedEmp.flightRiskLevel})
              </div>
            </div>
          )}

          <button onClick={handleGenerateCoaching} className="tp-btn tp-btn-ai" style={{ marginTop: 8 }}>
            <Sparkles style={{ width: 15, height: 15 }} /> Generate Coaching Guide with AI
          </button>

          {coachingGuide && (
            <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
              {coachingGuide}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
