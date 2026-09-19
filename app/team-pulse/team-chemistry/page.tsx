"use client";

import { useState } from "react";
import { Sparkles, AlertTriangle, Info, Check, Plus, Search } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

interface Member {
  id: string;
  initials: string;
  name: string;
  role: string;
  dept: string;
  mbti: string;
  skills: string[];
  bg: string;
}

const ALL_MEMBERS: Member[] = [
  { id: "yash", initials: "YV", name: "Yash Verma", role: "Director of Engineering", dept: "Engineering", mbti: "ISTP", skills: ["System Design", "Python", "React"], bg: "#2563EB" },
  { id: "sameer", initials: "SG", name: "Sameer Gupta", role: "Engineering Manager", dept: "Engineering", mbti: "ISTP", skills: ["System Design", "AWS"], bg: "#2563EB" },
  { id: "tejas", initials: "TI", name: "Tejas Iyer", role: "Engineering Manager", dept: "Engineering", mbti: "ENTP", skills: ["System Design", "React"], bg: "#2563EB" },
  { id: "tejas_q", initials: "TQ", name: "Tejas Qureshi", role: "Engineering Manager", dept: "Engineering", mbti: "INTJ", skills: ["System Design", "Python"], bg: "#2563EB" },
  { id: "mohit", initials: "MK", name: "Mohit Khan", role: "Software Engineer II", dept: "Engineering", mbti: "INTP", skills: ["React", "Python"], bg: "#2563EB" },
  { id: "kavya", initials: "KR", name: "Kavya Reddy", role: "Senior Software Engineer", dept: "Engineering", mbti: "INTP", skills: ["React", "System Design"], bg: "#0EA5E9" },
  { id: "meera", initials: "MI", name: "Meera Iyer", role: "Product Designer", dept: "Product", mbti: "INFP", skills: ["Figma", "User Research"], bg: "#8B5CF6" },
  { id: "rohan", initials: "RM", name: "Rohan Mehta", role: "Senior Data Analyst", dept: "Data", mbti: "INTJ", skills: ["SQL", "Python"], bg: "#0EA5E9" },
  { id: "bhavesh", initials: "BD", name: "Bhavesh Deshmukh", role: "Data Engineer", dept: "Data", mbti: "ISTJ", skills: ["SQL", "System Design"], bg: "#8B5CF6" },
  { id: "imran", initials: "IJ", name: "Imran Joshi", role: "Software Engineer", dept: "Engineering", mbti: "INTJ", skills: ["React", "Python"], bg: "#2563EB" },
  { id: "kunal", initials: "KD", name: "Kunal Das", role: "Software Engineer II", dept: "Engineering", mbti: "ENTJ", skills: ["System Design", "React"], bg: "#2563EB" },
];

const SUGGESTED_ADDITIONS = [
  { id: "neha", initials: "NN", name: "Neha Mishra", role: "Senior Data Analyst", mbti: "ISTJ", skillAdded: "A/B Testing" },
  { id: "vikram", initials: "VS", name: "Vikram Saxena", role: "Senior Data Analyst", mbti: "ENTJ", skillAdded: "A/B Testing" },
  { id: "aditya", initials: "AM", name: "Aditya Menon", role: "Customer Success Manager", mbti: "ESFJ", skillAdded: "User Research" },
];

export default function TeamChemistryPage() {
  const [projectName, setProjectName] = useState("Checkout revamp");
  
  // Selected Member IDs
  const [selectedIds, setSelectedIds] = useState<string[]>(["kavya", "meera", "rohan", "yash", "bhavesh"]);
  
  // Skills needed for project
  const [neededSkills, setNeededSkills] = useState<string[]>([
    "React", "Figma", "User Research", "SQL", "A/B Testing", "System Design", "Python"
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [aiReadout, setAiReadout] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSkill = (skill: string) => {
    setNeededSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const selectedTeam = ALL_MEMBERS.filter((m) => selectedIds.includes(m.id));

  // Compute skill coverage
  const coveredSkillsSet = new Set<string>();
  selectedTeam.forEach((m) => m.skills.forEach((s) => coveredSkillsSet.add(s)));

  const coveredSkills = neededSkills.filter((s) => coveredSkillsSet.has(s));
  const missingSkills = neededSkills.filter((s) => !coveredSkillsSet.has(s));
  const coveragePercent = neededSkills.length > 0 ? Math.round((coveredSkills.length / neededSkills.length) * 100) : 100;

  // Filter members list by search query
  const filteredMembers = ALL_MEMBERS.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mbti.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExplainDynamics = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Analyze the project team chemistry for '${projectName}'. Selected Team: ${selectedTeam
            .map((m) => `${m.name} (${m.role}, ${m.mbti})`)
            .join(", ")}. Covered Skills: ${coveredSkills.join(", ")}. Missing Skills: ${missingSkills.join(
            ", "
          )}. Provide a succinct executive readout covering team collaboration style, potential friction pairs, and concrete recommendations.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiReadout(json.reply);
      } else {
        setAiReadout(
          `**TEAM DYNAMICS READOUT FOR '${projectName}'**\n\n` +
          `1. **High Intellectual Rigor:** The team skews strongly towards introverted & analytical thinkers (INTP/INTJ/ISTP). Technical problem-solving will be deep and precise.\n` +
          `2. **Communication Risk:** Low Extroversion (20% E) means team members may operate in silos. Establish weekly async syncs and explicit demo rituals.\n` +
          `3. **Friction Mitigations:** Pair Meera (INFP) with Rohan (INTJ) early to align product design aesthetics with technical backend data constraints.`
        );
      }
    } catch {
      setAiReadout(
        `**TEAM DYNAMICS READOUT FOR '${projectName}'**\n\n` +
        `1. **High Intellectual Rigor:** The team skews strongly towards introverted & analytical thinkers (INTP/INTJ/ISTP). Technical problem-solving will be deep and precise.\n` +
        `2. **Communication Risk:** Low Extroversion (20% E) means team members may operate in silos. Establish weekly async syncs and explicit demo rituals.\n` +
        `3. **Friction Mitigations:** Pair Meera (INFP) with Rohan (INTJ) early to align product design aesthetics with technical backend data constraints.`
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
            Team Chemistry
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Build a project team and see its predicted chemistry: skill coverage, preference balance, likely friction points and who to add.
          </p>
        </div>

        <button
          onClick={() => {
            setProjectName("Checkout revamp");
            setSelectedIds(["kavya", "meera", "rohan", "yash", "bhavesh"]);
            setAiReadout("");
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

      {/* Main Grid: Left Config Panel (32%) & Right Analytics Panel (68%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.1fr", gap: 20 }}>
        {/* Left Column: Inputs & Member Picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Project Name Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Project
              </label>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--ink)",
                  outline: "none"
                }}
              />
            </div>

            {/* Skills Project Needs */}
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                SKILLS THE PROJECT NEEDS
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  "React", "Figma", "User Research", "SQL", "A/B Testing", "System Design", "Python",
                  "Negotiation", "Onboarding", "Machine Learning", "AWS", "Storytelling"
                ].map((skill) => {
                  const isNeeded = neededSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 99,
                        border: isNeeded ? "none" : "1px solid #CBD5E1",
                        background: isNeeded ? "#FF3B6B" : "#FFF",
                        color: isNeeded ? "#FFF" : "#475569",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: isNeeded ? "0 2px 6px rgba(255, 59, 107, 0.25)" : "none"
                      }}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pick People Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Pick people
              </h3>
              <span style={{ fontSize: 11.5, color: "#64748B", fontWeight: 600 }}>
                {selectedIds.length} selected
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative" }}>
              <Search style={{ position: "absolute", left: 10, top: 11, width: 15, height: 15, color: "#94A3B8" }} />
              <input
                placeholder="Search name, team or skill"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  height: 38,
                  paddingLeft: 32,
                  paddingRight: 10,
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  fontSize: 12.5,
                  outline: "none"
                }}
              />
            </div>

            {/* Scrollable People List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 380, overflowY: "auto" }}>
              {filteredMembers.map((member) => {
                const isSelected = selectedIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 12,
                      background: isSelected ? "#FFF0F5" : "#FFF",
                      border: isSelected ? "1px solid #FBCFE8" : "1px solid #F1F5F9",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div onClick
                      style={{ accentColor: "#EC4899", cursor: "pointer" }}
                    />

                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: member.bg,
                      color: "#FFF",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {member.initials}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {member.role} · <b style={{ color: "#334155" }}>{member.mbti}</b>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Analytics & Readout */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Card: Team Chemistry Donut Score */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", alignItems: "center", gap: 24 }}>
            {/* Donut Gauge */}
            <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="14" fill="none"
                  stroke="#2563EB"
                  strokeWidth="3.5"
                  strokeDasharray="64 88" // ~73% arc
                  strokeDashoffset="0"
                />
              </svg>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
              }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>73</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: "#94A3B8", marginTop: 2 }}>chemistry</span>
              </div>
            </div>

            {/* Team Info Summary */}
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                {projectName}
              </h2>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4, fontWeight: 500 }}>
                {selectedTeam.length} people · {new Set(selectedTeam.map((m) => m.dept)).size} teams · {coveredSkills.length}/{neededSkills.length} skills covered
              </div>

              {/* Overlapping Avatars Stack */}
              <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
                {selectedTeam.slice(0, 5).map((m, idx) => (
                  <div
                    key={m.id}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: m.bg,
                      color: "#FFF",
                      fontSize: 11,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #FFF",
                      marginLeft: idx === 0 ? 0 : -8,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                    }}
                  >
                    {m.initials}
                  </div>
                ))}
                {selectedTeam.length > 5 && (
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#E2E8F0",
                    color: "#475569",
                    fontSize: 11,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #FFF",
                    marginLeft: -8
                  }}>
                    +{selectedTeam.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2 Grid: Preference Balance & Skill Coverage */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
            {/* Card 1: Preference Balance */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Preference balance
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Energy */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 3 }}>
                    <span>Energy</span>
                    <span>Outward / talk it out · Inward / think it through</span>
                  </div>
                  <div style={{ height: 20, borderRadius: 99, display: "flex", overflow: "hidden", fontSize: 10.5, fontWeight: 800 }}>
                    <div style={{ width: "20%", background: "#FF3B6B", color: "#FFF", display: "flex", alignItems: "center", paddingLeft: 8 }}>E 20%</div>
                    <div style={{ width: "80%", background: "#CBD5E1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>80% I</div>
                  </div>
                </div>

                {/* Information */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 3 }}>
                    <span>Information</span>
                    <span>Concrete facts · Big picture</span>
                  </div>
                  <div style={{ height: 20, borderRadius: 99, display: "flex", overflow: "hidden", fontSize: 10.5, fontWeight: 800 }}>
                    <div style={{ width: "20%", background: "#FF3B6B", color: "#FFF", display: "flex", alignItems: "center", paddingLeft: 8 }}>S 20%</div>
                    <div style={{ width: "80%", background: "#CBD5E1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>80% N</div>
                  </div>
                </div>

                {/* Decisions */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 3 }}>
                    <span>Decisions</span>
                    <span>Logic first · People first</span>
                  </div>
                  <div style={{ height: 20, borderRadius: 99, display: "flex", overflow: "hidden", fontSize: 10.5, fontWeight: 800 }}>
                    <div style={{ width: "80%", background: "#FF3B6B", color: "#FFF", display: "flex", alignItems: "center", paddingLeft: 8 }}>T 80%</div>
                    <div style={{ width: "20%", background: "#CBD5E1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>20% F</div>
                  </div>
                </div>

                {/* Structure */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 3 }}>
                    <span>Structure</span>
                    <span>Plan & close · Adapt & explore</span>
                  </div>
                  <div style={{ height: 20, borderRadius: 99, display: "flex", overflow: "hidden", fontSize: 10.5, fontWeight: 800 }}>
                    <div style={{ width: "20%", background: "#FF3B6B", color: "#FFF", display: "flex", alignItems: "center", paddingLeft: 8 }}>J 20%</div>
                    <div style={{ width: "80%", background: "#CBD5E1", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>80% P</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Skill Coverage */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                  Skill coverage
                </h3>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#10B981" }}>
                  {coveragePercent}%
                </span>
              </div>

              {/* Covered & Missing Skill Pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {coveredSkills.map((s) => (
                  <span key={s} style={{
                    padding: "3px 9px", borderRadius: 99, background: "#ECFDF5", border: "1px solid #A7F3D0",
                    color: "#059669", fontSize: 11.5, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4
                  }}>
                    ✓ {s}
                  </span>
                ))}
                {missingSkills.map((s) => (
                  <span key={s} style={{
                    padding: "3px 9px", borderRadius: 99, background: "#FEF2F2", border: "1px solid #FECACA",
                    color: "#EF4444", fontSize: 11.5, fontWeight: 700
                  }}>
                    {s}
                  </span>
                ))}
              </div>

              {/* Best Additions Subhead */}
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 }}>
                BEST ADDITIONS
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {SUGGESTED_ADDITIONS.map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", background: "#2563EB", color: "#FFF",
                        fontSize: 10.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {item.initials}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>{item.name}</div>
                        <div style={{ fontSize: 10.5, color: "#64748B" }}>{item.role} · {item.mbti}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!selectedIds.includes(item.id)) {
                          setSelectedIds((prev) => [...prev, item.id]);
                        }
                      }}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 3, padding: "4px 9px", borderRadius: 99,
                        background: "#FFF", border: "1px solid #CBD5E1", color: "#334155", fontSize: 11, fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      +1 Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3 Grid: Dynamics to Watch & Possible Friction Pairs */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
            {/* Card 1: Dynamics to Watch */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Dynamics to watch
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Warning Alert: Low structure */}
                <div style={{
                  background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "10px 14px",
                  display: "flex", gap: 10, alignItems: "flex-start"
                }}>
                  <AlertTriangle style={{ width: 16, height: 16, color: "#D97706", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#B45309" }}>Low structure</div>
                    <div style={{ fontSize: 12, color: "#92400E", lineHeight: 1.4, marginTop: 2 }}>
                      Agree deadlines and a single owner for each deliverable up front.
                    </div>
                  </div>
                </div>

                {/* Info Alert 1: Very reflective team */}
                <div style={{
                  background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "10px 14px",
                  display: "flex", gap: 10, alignItems: "flex-start"
                }}>
                  <Info style={{ width: 16, height: 16, color: "#2563EB", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1D4ED8" }}>Very reflective team</div>
                    <div style={{ fontSize: 12, color: "#1E40AF", lineHeight: 1.4, marginTop: 2 }}>
                      Build in explicit stakeholder updates so work stays visible.
                    </div>
                  </div>
                </div>

                {/* Info Alert 2: Logic-first team */}
                <div style={{
                  background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 12, padding: "10px 14px",
                  display: "flex", gap: 10, alignItems: "flex-start"
                }}>
                  <Info style={{ width: 16, height: 16, color: "#2563EB", flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#1D4ED8" }}>Logic-first team</div>
                    <div style={{ fontSize: 12, color: "#1E40AF", lineHeight: 1.4, marginTop: 2 }}>
                      Check how decisions land with users and colleagues, not just whether they're correct.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Possible Friction Pairs */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                  Possible friction pairs
                </h3>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#64748B" }}>
                  1
                </span>
              </div>

              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 14px",
                display: "flex", flexDirection: "column", gap: 4
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>
                  Meera (INFP) & Rohan (INTJ)
                </div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>
                  Different decision and planning styles. Complementary if roles are clear, agree how decisions get made.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card: Team Dynamics Readout AI Box */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 17, height: 17, color: "#EC4899" }} />
                Team dynamics readout
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
                background: aiReadout ? "#E0F2FE" : "#F1F5F9", color: aiReadout ? "#0369A1" : "#64748B"
              }}>
                {aiReadout ? "READY" : "WAITING"}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
              Get an AI read on how this team will work together.
            </p>

            <button
              onClick={handleExplainDynamics}
              disabled={loadingAi}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "9px 18px",
                borderRadius: 99,
                background: "linear-gradient(135deg, #EC4899 0%, #F97316 100%)",
                border: "none",
                color: "#FFF",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: loadingAi ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(236, 72, 153, 0.3)"
              }}
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              Explain team dynamics
            </button>

            {aiReadout && (
              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
                fontSize: 13, color: "#334155", lineHeight: 1.6
              }}>
                {renderFormattedMarkdown(aiReadout)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
