"use client";

import { useEffect, useState } from "react";
import { UserCheck, Sparkles, CheckSquare } from "lucide-react";

export default function OnboardingPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandId, setSelectedCandId] = useState("");
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    "Offer letter signed": true,
    "Background verification started": true,
    "Laptop & accessories ordered": true,
    "Email & Slack accounts": false,
    "Buddy assigned": true,
    "Day-1 agenda sent": false,
  });
  const [aiWelcome, setAiWelcome] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/team-pulse/candidates?stage=Accepted");
        if (res.ok) {
          const list = await res.json();
          setCandidates(list);
          if (list.length > 0) setSelectedCandId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const cand = candidates.find((c) => c.id === selectedCandId) || { name: "Zoya Fernandes", title: "Product Designer", dept: "Product", notice: 30 };

  const handleGenerateWelcome = async () => {
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Write a warm, concise welcome email to ${cand.name} joining as ${cand.title}. Mention Day-1 10am welcome, laptop setup, team lunch, and documents to bring (PAN, Aadhaar, relieving letter).`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiWelcome(json.reply);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Onboarding Studio
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>30-60-90 Onboarding Plans</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Turn accepted offers into successful 90-day journeys: pre-joining checklists, role-specific plans, buddy matching, and personalized welcome emails.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Pre-joining checklist */}
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Pre-joining Checklist</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(checklist).map(([task, done]) => (
              <label
                key={task}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid var(--line)",
                  background: done ? "var(--good-soft)" : "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => setChecklist({ ...checklist, [task]: !done })}
                />
                {task}
              </label>
            ))}
          </div>

          <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />

          <div style={{ padding: 12, borderRadius: 10, background: "var(--indigo-soft)", fontSize: 12.5, color: "var(--indigo-ink)" }}>
            <b>Assigned Buddy:</b> Ananya Sharma (Senior Product Designer, highly engaged, ENFP).
          </div>
        </div>

        {/* Right 30-60-90 Plan */}
        <div className="tp-panel stack">
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>30-60-90 Day Roadmap for {cand.name}</h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 10, background: "var(--rose-soft)", border: "1px solid #fcecee" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--rose-ink)" }}>30 Days: Learn</div>
              <ul style={{ paddingLeft: 16, margin: "6px 0 0", fontSize: 12, color: "var(--ink2)" }}>
                <li>Meet 12 stakeholders</li>
                <li>Audit design system</li>
                <li>Shadow customer calls</li>
              </ul>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: "var(--amber-soft)", border: "1px solid #fef3d6" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--amber-ink)" }}>60 Days: Contribute</div>
              <ul style={{ paddingLeft: 16, margin: "6px 0 0", fontSize: 12, color: "var(--ink2)" }}>
                <li>Own feature design end-to-end</li>
                <li>Run usability testing</li>
                <li>Propose 3 design updates</li>
              </ul>
            </div>

            <div style={{ padding: 12, borderRadius: 10, background: "var(--green-soft)", border: "1px solid #d1f7c4" }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "var(--green-ink)" }}>90 Days: Lead</div>
              <ul style={{ paddingLeft: 16, margin: "6px 0 0", fontSize: 12, color: "var(--ink2)" }}>
                <li>Ship feature & measure adoption</li>
                <li>Present research to leadership</li>
                <li>Mentor junior designer</li>
              </ul>
            </div>
          </div>

          <button onClick={handleGenerateWelcome} className="tp-btn tp-btn-ai" style={{ marginTop: 12 }}>
            <Sparkles style={{ width: 15, height: 15 }} /> Generate Personal Welcome Email with AI
          </button>

          {aiWelcome && (
            <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
              {aiWelcome}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
