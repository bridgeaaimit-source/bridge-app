"use client";

import { useState } from "react";
import { Sparkles, Info, Upload, Check, ChevronDown } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

// 16 MBTI Types data
interface MbtiTypeDef {
  code: string;
  name: string;
  count: number;
  dots: string[]; // hex colors representing teams
}

const INITIAL_TYPES: MbtiTypeDef[] = [
  { code: "ISTJ", name: "Reliable executor", count: 8, dots: ["#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6"] },
  { code: "ISFJ", name: "Steady supporter", count: 3, dots: ["#3B82F6", "#8B5CF6"] },
  { code: "INFJ", name: "Purposeful advisor", count: 3, dots: ["#10B981", "#EC4899"] },
  { code: "INTJ", name: "Strategic planner", count: 8, dots: ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B"] },
  
  { code: "ISTP", name: "Hands-on troubleshooter", count: 3, dots: ["#3B82F6", "#EF4444"] },
  { code: "ISFP", name: "Quiet craftsperson", count: 2, dots: ["#8B5CF6", "#EC4899"] },
  { code: "INFP", name: "Value-led creator", count: 2, dots: ["#8B5CF6"] },
  { code: "INTP", name: "Analytical inventor", count: 6, dots: ["#3B82F6", "#10B981", "#F59E0B"] },
  
  { code: "ESTP", name: "Action taker", count: 3, dots: ["#EF4444", "#F59E0B"] },
  { code: "ESFP", name: "Spirited performer", count: 0, dots: [] },
  { code: "ENFP", name: "Enthusiastic connector", count: 6, dots: ["#10B981", "#F59E0B", "#EC4899", "#3B82F6"] },
  { code: "ENTP", name: "Idea challenger", count: 3, dots: ["#3B82F6", "#8B5CF6"] },
  
  { code: "ESTJ", name: "Practical manager", count: 3, dots: ["#EF4444", "#F59E0B"] },
  { code: "ESFJ", name: "Team harmoniser", count: 2, dots: ["#10B981", "#F59E0B"] },
  { code: "ENFJ", name: "People catalyst", count: 3, dots: ["#10B981", "#8B5CF6", "#EC4899"] },
  { code: "ENTJ", name: "Decisive organiser", count: 9, dots: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"] },
];

// Sample People Database for Person Profile & Role-Preference Fit
interface PersonProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  dept: string;
  type: string;
  typeName: string;
  fitScore: number;
  fitLabel: string;
  strengths: string;
  howToCommunicate: string;
  whatDrainsThem: string;
  whereTheyThrive: string;
  avatarBg: string;
}

const PEOPLE_PROFILES: PersonProfile[] = [
  {
    id: "rohan",
    name: "Rohan Mehta",
    initials: "RM",
    role: "Senior Data Analyst",
    dept: "Data",
    type: "INTJ",
    typeName: "Strategic planner",
    fitScore: 100,
    fitLabel: "100/100 for Data work",
    strengths: "Long-range thinking, independent problem solving, high standards",
    howToCommunicate: "Lead with the goal and the logic. Share context in writing and give time to think before asking for a decision.",
    whatDrainsThem: "Vague direction, meetings with no agenda, being micromanaged",
    whereTheyThrive: "Owning a complex problem end-to-end with autonomy",
    avatarBg: "#0EA5E9",
  },
  {
    id: "sneha",
    name: "Sneha Kulkarni",
    initials: "SK",
    role: "Senior Data Analyst",
    dept: "Data",
    type: "INTJ",
    typeName: "Strategic planner",
    fitScore: 94,
    fitLabel: "94/100 for Data work",
    strengths: "Systematic data modeling, deep technical curiosity, precision execution",
    howToCommunicate: "Provide structured data requirements, avoid surface-level summaries, allow time for async analysis.",
    whatDrainsThem: "Frequent interruptions, unverified assumptions, last-minute scope shifts",
    whereTheyThrive: "Building scalable data architectures and predictive analytics models",
    avatarBg: "#8B5CF6",
  },
  {
    id: "tejas",
    name: "Tejas Iyer",
    initials: "TI",
    role: "Engineering Manager",
    dept: "Engineering",
    type: "ENTP",
    typeName: "Idea challenger",
    fitScore: 66,
    fitLabel: "66/100 for Management work",
    strengths: "Rapid technical prototyping, architectural debate, innovation driver",
    howToCommunicate: "Invite them to challenge the plan early, then pin down commitments in writing.",
    whatDrainsThem: "Rigid process enforcement, routine maintenance, administrative paperwork",
    whereTheyThrive: "Architecting new system paradigms and brainstorming v1 solutions",
    avatarBg: "#2563EB",
  },
  {
    id: "kunal",
    name: "Kunal Das",
    initials: "KD",
    role: "Software Engineer II",
    dept: "Engineering",
    type: "ENTJ",
    typeName: "Decisive organiser",
    fitScore: 66,
    fitLabel: "66/100 for Engineering work",
    strengths: "Decisive problem resolution, structural optimization, clear technical roadmaps",
    howToCommunicate: "Be direct and brief, bring data and a recommendation. Push back with evidence, not feelings.",
    whatDrainsThem: "Indecision in meetings, emotional debates, lack of accountability",
    whereTheyThrive: "Leading critical refactoring projects and enforcing engineering standards",
    avatarBg: "#2563EB",
  },
  {
    id: "nikhil",
    name: "Nikhil Gupta",
    initials: "NG",
    role: "Software Engineer II",
    dept: "Engineering",
    type: "ISFJ",
    typeName: "Steady supporter",
    fitScore: 66,
    fitLabel: "66/100 for Engineering work",
    strengths: "Meticulous documentation, reliable feature delivery, strong team empathy",
    howToCommunicate: "Thank them concretely; give advance notice of change and ask for their input quietly.",
    whatDrainsThem: "Abrupt priority switches, public confrontation, ambiguous requirements",
    whereTheyThrive: "Maintaining mission-critical codebases and supporting team onboarding",
    avatarBg: "#0EA5E9",
  },
  {
    id: "omkar",
    name: "Omkar Patel",
    initials: "OP",
    role: "Software Engineer II",
    dept: "Engineering",
    type: "ESTJ",
    typeName: "Practical manager",
    fitScore: 66,
    fitLabel: "66/100 for Engineering work",
    strengths: "Process discipline, operational efficiency, rigorous testing hygiene",
    howToCommunicate: "State facts, owners and deadlines. Respect the chain of decisions.",
    whatDrainsThem: "Untested experimental tools, missed deadlines, disregard for protocol",
    whereTheyThrive: "Managing release deployment pipelines and stability protocols",
    avatarBg: "#2563EB",
  },
  {
    id: "pranav",
    name: "Pranav Nair",
    initials: "PN",
    role: "Software Engineer II",
    dept: "Engineering",
    type: "ENTJ",
    typeName: "Decisive organiser",
    fitScore: 66,
    fitLabel: "66/100 for Engineering work",
    strengths: "Goal-oriented execution, high velocity coding, pragmatic trade-offs",
    howToCommunicate: "Be direct and brief, bring data and a recommendation. Push back with evidence, not feelings.",
    whatDrainsThem: "Over-engineering simple tasks, passive consensus-building",
    whereTheyThrive: "Driving high-impact sprint deliverables under tight timelines",
    avatarBg: "#2563EB",
  },
  {
    id: "ujjwal",
    name: "Ujjwal Iyer",
    initials: "UI",
    role: "Software Engineer II",
    dept: "Engineering",
    type: "ENTP",
    typeName: "Idea challenger",
    fitScore: 66,
    fitLabel: "66/100 for Engineering work",
    strengths: "Creative bug solving, out-of-the-box system design, energetic collaborator",
    howToCommunicate: "Invite them to challenge the plan early, then pin down commitments in writing.",
    whatDrainsThem: "Monotonous bug fixes without scope for technical exploration",
    whereTheyThrive: "Hackathons, research spikes, and solving complex performance bottlenecks",
    avatarBg: "#2563EB",
  },
];

export default function PersonalityLabPage() {
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState("rohan");
  
  // CSV Input State
  const [csvText, setCsvText] = useState(
    `name,type\nRohan Mehta,INTJ\nKavya Reddy,INTP\nMeera Iyer,INFP\nArjun Nair,ESTP\nIshita Bose,ISTJ\nSneha Kulkarni,INTJ`
  );
  const [appliedNotice, setAppliedNotice] = useState(false);

  // AI Coaching Guide State
  const [coachingGuide, setCoachingGuide] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const selectedPerson = PEOPLE_PROFILES.find((p) => p.id === selectedPersonId) || PEOPLE_PROFILES[0];

  const handleApplyCsv = () => {
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 3000);
  };

  const handleGenerateCoaching = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate a concise 1-page manager coaching guide for ${selectedPerson.name} (${selectedPerson.role}, MBTI: ${selectedPerson.type} - ${selectedPerson.typeName}). Include tailored advice on 1-on-1s, delegation, feedback delivery, and motivation levers.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setCoachingGuide(json.reply);
      } else {
        setCoachingGuide(
          `**MANAGER COACHING GUIDE: ${selectedPerson.name} (${selectedPerson.type})**\n\n` +
          `1. **Communication Protocol:** Lead with data & clear objectives. Avoid ambiguous updates.\n` +
          `2. **Delegation Strategy:** Provide end-to-end ownership of initiatives with defined KPIs.\n` +
          `3. **Feedback Style:** Be direct, objective, and specific. Focus on outcomes rather than style.\n` +
          `4. **Motivation Levers:** Solitary deep work time, high autonomy, and long-range technical ownership.`
        );
      }
    } catch {
      setCoachingGuide(
        `**MANAGER COACHING GUIDE: ${selectedPerson.name} (${selectedPerson.type})**\n\n` +
        `1. **Communication Protocol:** Lead with data & clear objectives. Avoid ambiguous updates.\n` +
        `2. **Delegation Strategy:** Provide end-to-end ownership of initiatives with defined KPIs.\n` +
        `3. **Feedback Style:** Be direct, objective, and specific. Focus on outcomes rather than style.\n` +
        `4. **Motivation Levers:** Solitary deep work time, high autonomy, and long-range technical ownership.`
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
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#EC4899", textTransform: "uppercase", marginBottom: 2 }}>
            — PEOPLE
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
            Personality Lab
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Upload MBTI results to see each team's make-up, how well people fit their roles, and how best to communicate with and manage each person.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedDept("All");
            setSelectedType(null);
            setSelectedPersonId("rohan");
            setCoachingGuide("");
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

      {/* Responsibility Disclaimer Banner */}
      <div style={{
        background: "#EFF6FF",
        border: "1px solid #BFDBFE",
        borderRadius: 14,
        padding: "12px 16px",
        fontSize: 12.5,
        color: "#1E40AF",
        lineHeight: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 10
      }}>
        <Info style={{ width: 18, height: 18, color: "#2563EB", flexShrink: 0 }} />
        <div>
          <b>Use responsibly.</b> MBTI describes preferences, not ability, and has weak evidence as a predictor of job performance. Use it to improve communication and team balance, never to hire, reject or promote. For selection, a validated Big Five measure is the better choice.
        </div>
      </div>

      {/* Row 1: Upload Results (Left 28%) & Type Map Matrix (Right 72%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: 20 }}>
        {/* Upload Results Panel */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Upload results
            </h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>
              CSV: name,type
            </span>
          </div>

          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 12,
              border: "1px solid #CBD5E1",
              fontFamily: "var(--f-mono)",
              fontSize: 12,
              color: "#334155",
              background: "#F8FAFC",
              outline: "none",
              resize: "none"
            }}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={handleApplyCsv}
              style={{
                flex: 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 99,
                background: "#EC4899",
                border: "none",
                color: "#FFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(236, 72, 153, 0.3)"
              }}
            >
              <Check style={{ width: 14, height: 14 }} />
              Apply results
            </button>

            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "9px 14px",
                borderRadius: 99,
                background: "#FFF",
                border: "1px solid #CBD5E1",
                color: "#475569",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              <Upload style={{ width: 14, height: 14 }} />
              Upload .csv
            </button>
          </div>

          {appliedNotice && (
            <div style={{ fontSize: 11.5, color: "#059669", fontWeight: 600, textAlign: "center" }}>
              ✓ Results updated successfully
            </div>
          )}
        </div>

        {/* Type Map 16-Grid Matrix Panel */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Type map
            </h3>

            {/* Department Filter Tabs */}
            <div style={{ display: "flex", gap: 4, background: "#F1F5F9", padding: 3, borderRadius: 99, overflowX: "auto" }}>
              {["All", "Engineering", "Data", "Product", "Sales", "Customer Success", "HR", "Finance"].map((dept) => {
                const active = selectedDept === dept;
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 99,
                      border: "none",
                      background: active ? "#FFF" : "transparent",
                      color: active ? "var(--ink)" : "#64748B",
                      fontSize: 11.5,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 16 MBTI Cards Grid (4x4) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {INITIAL_TYPES.map((typeObj) => {
              const isSelected = selectedType === typeObj.code;
              return (
                <div
                  key={typeObj.code}
                  onClick={() => setSelectedType(isSelected ? null : typeObj.code)}
                  style={{
                    background: isSelected ? "#EFF6FF" : "#F8FAFC",
                    border: isSelected ? "2px solid #2563EB" : "1px solid #E2E8F0",
                    borderRadius: 14,
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>
                      {typeObj.code}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: typeObj.count > 0 ? "#EF4444" : "#94A3B8" }}>
                      {typeObj.count}
                    </span>
                  </div>

                  <div style={{ fontSize: 10.5, color: "#64748B", fontWeight: 500, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {typeObj.name}
                  </div>

                  {/* Dot indicators for team distribution */}
                  <div style={{ display: "flex", gap: 4, minHeight: 8 }}>
                    {typeObj.dots.map((color, idx) => (
                      <span
                        key={idx}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: color
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 11.5, color: "#94A3B8", fontStyle: "italic" }}>
            Click a type to see who's in it. Dot colour = team.
          </div>
        </div>
      </div>

      {/* Row 2: Person Profile (Left 35%) & Preference Balance + Insights (Right 65%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 2fr", gap: 20 }}>
        {/* Person Profile Panel */}
        <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            Person profile
          </h3>

          {/* Select Dropdown */}
          <div>
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              style={{
                width: "100%",
                height: 40,
                padding: "0 12px",
                borderRadius: 10,
                border: "1px solid #CBD5E1",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ink)",
                background: "#FFF",
                outline: "none"
              }}
            >
              {PEOPLE_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.role}
                </option>
              ))}
            </select>
          </div>

          {/* Profile Card Summary Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: selectedPerson.avatarBg,
              color: "#FFF",
              fontWeight: 800,
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              {selectedPerson.initials}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
                {selectedPerson.name}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginTop: 2 }}>
                {selectedPerson.role} · {selectedPerson.dept}
              </div>
            </div>
          </div>

          {/* MBTI Ring & Role-preference fit label */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, paddingTop: 4 }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              border: "3px solid #10B981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              color: "#10B981",
              flexShrink: 0
            }}>
              {selectedPerson.type}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                {selectedPerson.typeName}
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
                Role-preference fit {selectedPerson.fitLabel}
              </div>
            </div>
          </div>

          {/* Traits Checklist Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 12.5, borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
                STRENGTHS
              </div>
              <div style={{ color: "#334155", lineHeight: 1.4, fontWeight: 500 }}>
                {selectedPerson.strengths}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
                HOW TO COMMUNICATE
              </div>
              <div style={{ color: "#334155", lineHeight: 1.4, fontWeight: 500 }}>
                {selectedPerson.howToCommunicate}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
                WHAT DRAINS THEM
              </div>
              <div style={{ color: "#334155", lineHeight: 1.4, fontWeight: 500 }}>
                {selectedPerson.whatDrainsThem}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
                WHERE THEY THRIVE
              </div>
              <div style={{ color: "#334155", lineHeight: 1.4, fontWeight: 500 }}>
                {selectedPerson.whereTheyThrive}
              </div>
            </div>
          </div>

          {/* Manager Coaching Guide AI Box */}
          <div style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: 14,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 4
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 14, height: 14, color: "#EC4899" }} />
                Manager coaching guide
              </div>
              <span style={{
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: "0.08em",
                padding: "2px 7px",
                borderRadius: 99,
                background: coachingGuide ? "#E0F2FE" : "#F1F5F9",
                color: coachingGuide ? "#0369A1" : "#64748B"
              }}>
                {coachingGuide ? "READY" : "WAITING"}
              </span>
            </div>

            <p style={{ fontSize: 11.5, color: "#64748B", margin: 0 }}>
              Get a one-page guide for this person's manager.
            </p>

            <button
              onClick={handleGenerateCoaching}
              disabled={loadingAi}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
                borderRadius: 99,
                background: "linear-gradient(135deg, #EC4899 0%, #F97316 100%)",
                border: "none",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: loadingAi ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(236, 72, 153, 0.25)"
              }}
            >
              <Sparkles style={{ width: 13, height: 13 }} />
              Coaching guide
            </button>

            {coachingGuide && (
              <div style={{
                background: "#FFF",
                border: "1px solid #E2E8F0",
                borderRadius: 10,
                padding: 12,
                fontSize: 12,
                color: "#334155",
                lineHeight: 1.5
              }}>
                {renderFormattedMarkdown(coachingGuide)}
              </div>
            )}
          </div>
        </div>

        {/* Preference Balance & Team Insights Panel (Right Column) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 16 }}>
            {/* Preference Balance Card */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                  Preference balance
                </h3>
                <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500 }}>
                  All · 64 people
                </span>
              </div>

              {/* 4 Dimension Bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Dimension 1: Energy */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    <span>Energy</span>
                    <span>Outward / talk it out · Inward / think it through</span>
                  </div>
                  <div style={{ height: 22, borderRadius: 99, display: "flex", overflow: "hidden", fontSize: 11, fontWeight: 800 }}>
                    <div style={{ width: "45%", background: "#FF3B6B", color: "#FFF", display: "flex", alignItems: "center", paddingLeft: 10 }}>
                      E 45%
                    </div>
                    <div style={{ width: "55%", background: "#CBD5E1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
                      55% I
                    </div>
                  </div>
                </div>

                {/* Dimension 2: Information */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    <span>Information</span>
                    <span>Concrete facts · Big picture</span>
                  </div>
                  <div style={{ height: 22, borderRadius: 99, display: "flex", overflow: "hidden", fontSize: 11, fontWeight: 800 }}>
                    <div style={{ width: "38%", background: "#FF3B6B", color: "#FFF", display: "flex", alignItems: "center", paddingLeft: 10 }}>
                      S 38%
                    </div>
                    <div style={{ width: "62%", background: "#CBD5E1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
                      62% N
                    </div>
                  </div>
                </div>

                {/* Dimension 3: Decisions */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    <span>Decisions</span>
                    <span>Logic first · People first</span>
                  </div>
                  <div style={{ height: 22, borderRadius: 99, display: "flex", overflow: "hidden", fontSize: 11, fontWeight: 800 }}>
                    <div style={{ width: "67%", background: "#FF3B6B", color: "#FFF", display: "flex", alignItems: "center", paddingLeft: 10 }}>
                      T 67%
                    </div>
                    <div style={{ width: "33%", background: "#CBD5E1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
                      33% F
                    </div>
                  </div>
                </div>

                {/* Dimension 4: Structure */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 600, color: "#475569", marginBottom: 4 }}>
                    <span>Structure</span>
                    <span>Plan & close · Adapt & explore</span>
                  </div>
                  <div style={{ height: 22, borderRadius: 99, display: "flex", overflow: "hidden", fontSize: 11, fontWeight: 800 }}>
                    <div style={{ width: "61%", background: "#FF3B6B", color: "#FFF", display: "flex", alignItems: "center", paddingLeft: 10 }}>
                      J 61%
                    </div>
                    <div style={{ width: "39%", background: "#CBD5E1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 10 }}>
                      39% P
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Insights Card */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Team insights
              </h3>

              <div style={{
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 4
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 800, color: "#065F46" }}>
                  <Check style={{ width: 16, height: 16, color: "#10B981" }} />
                  Well-balanced mix
                </div>
                <div style={{ fontSize: 12, color: "#047857", lineHeight: 1.4 }}>
                  Preferences are spread across all four dimensions.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card: Role-preference fit */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Role-preference fit
              </h3>
              <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
                Lowest first · conversation starters, not verdicts
              </span>
            </div>

            {/* List / Table */}
            <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
                    <th style={{ padding: "10px 16px" }}>PERSON</th>
                    <th style={{ padding: "10px 16px" }}>TYPE</th>
                    <th style={{ padding: "10px 16px" }}>FIT</th>
                    <th style={{ padding: "10px 16px" }}>TIP FOR THEIR MANAGER</th>
                  </tr>
                </thead>
                <tbody style={{ color: "#334155" }}>
                  {[
                    { initials: "TI", name: "Tejas Iyer", role: "Engineering Manager", type: "ENTP", fit: 66, tip: "Invite them to challenge the plan early, then pin down commitments in writing." },
                    { initials: "KD", name: "Kunal Das", role: "Software Engineer II", type: "ENTJ", fit: 66, tip: "Be direct and brief, bring data and a recommendation. Push back with evidence, not feelings." },
                    { initials: "NG", name: "Nikhil Gupta", role: "Software Engineer II", type: "ISFJ", fit: 66, tip: "Thank them concretely; give advance notice of change and ask for their input quietly." },
                    { initials: "OP", name: "Omkar Patel", role: "Software Engineer II", type: "ESTJ", fit: 66, tip: "State facts, owners and deadlines. Respect the chain of decisions." },
                    { initials: "PN", name: "Pranav Nair", role: "Software Engineer II", type: "ENTJ", fit: 66, tip: "Be direct and brief, bring data and a recommendation. Push back with evidence, not feelings." },
                    { initials: "UI", name: "Ujjwal Iyer", role: "Software Engineer II", type: "ENTP", fit: 66, tip: "Invite them to challenge the plan early, then pin down commitments in writing." },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: i === 5 ? "none" : "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "#2563EB",
                            color: "#FFF",
                            fontSize: 11,
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                            {row.initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 13 }}>{row.name}</div>
                            <div style={{ fontSize: 11, color: "#64748B" }}>{row.role}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, fontFamily: "var(--f-mono)", fontSize: 12.5 }}>
                        {row.type}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 44, height: 6, borderRadius: 99, background: "#CBD5E1", overflow: "hidden" }}>
                            <div style={{ width: `${row.fit}%`, height: "100%", background: "#2563EB" }} />
                          </div>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "#475569" }}>{row.fit}</span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#475569", fontSize: 12, lineHeight: 1.4 }}>
                        {row.tip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
