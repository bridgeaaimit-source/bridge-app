"use client";

import { useEffect, useState } from "react";
import { Users2, Sparkles, Plus, Check } from "lucide-react";

export default function TeamChemistryPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [projectName, setProjectName] = useState("Checkout Revamp");
  const [aiReadout, setAiReadout] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/team-pulse/employees");
        if (res.ok) {
          const list = await res.json();
          setEmployees(list);
          if (list.length >= 4) {
            setSelectedIds([list[0].id, list[1].id, list[2].id, list[3].id]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectedTeam = employees.filter((e) => selectedIds.includes(e.id));

  const toggleMember = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const calculateChemistryScore = () => {
    if (selectedTeam.length === 0) return 0;
    const deptsCount = new Set(selectedTeam.map((e) => e.dept)).size;
    const mbtiTypes = selectedTeam.map((e) => e.mbti);
    const score = Math.min(98, Math.max(45, 60 + deptsCount * 8 + (selectedTeam.length >= 3 && selectedTeam.length <= 6 ? 12 : 0)));
    return score;
  };

  const chemScore = calculateChemistryScore();

  const handleExplainDynamics = async () => {
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze project team dynamics for '${projectName}'. Team members: ${selectedTeam.map((e) => `${e.name} (${e.role}, ${e.dept}, ${e.mbti})`).join("; ")}. Give 3 points on strengths, 2 on risks, and 2 team rules.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiReadout(json.reply);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Team Chemistry
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Project Team Chemistry Predictor</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Assemble project teams and predict skill coverage, personality balance, potential friction points, and recommendations on who to add.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Team Picker */}
        <div className="tp-panel stack">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Project Name</label>
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid var(--line2)", marginTop: 4 }}
            />
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 10 }}>Select Team Members ({selectedIds.length})</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 360, overflowY: "auto" }}>
            {employees.map((e) => {
              const isSelected = selectedIds.includes(e.id);
              return (
                <div
                  key={e.id}
                  onClick={() => toggleMember(e.id)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: isSelected ? "var(--indigo-soft)" : "#fff",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{e.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {e.role} · {e.dept} ({e.mbti})
                    </div>
                  </div>
                  {isSelected && <Check style={{ width: 16, height: 16, color: "var(--indigo)" }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Chemistry Results */}
        <div className="tp-panel stack">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>{projectName}</h2>
              <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
                {selectedTeam.length} members across {new Set(selectedTeam.map((e) => e.dept)).size} departments
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "var(--indigo)" }}>{chemScore}/100</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)" }}>Chemistry Rating</div>
            </div>
          </div>

          <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />

          <h4 style={{ fontSize: 14, fontWeight: 700 }}>Assembled Team Members</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {selectedTeam.map((m) => (
              <span key={m.id} style={{ padding: "4px 10px", borderRadius: 99, background: "var(--tint2)", fontSize: 12, fontWeight: 600 }}>
                {m.name} ({m.dept} · {m.mbti})
              </span>
            ))}
          </div>

          <button onClick={handleExplainDynamics} className="tp-btn tp-btn-ai" style={{ marginTop: 12 }}>
            <Sparkles style={{ width: 15, height: 15 }} /> Explain Team Dynamics with AI
          </button>

          {aiReadout && (
            <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
              {aiReadout}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
