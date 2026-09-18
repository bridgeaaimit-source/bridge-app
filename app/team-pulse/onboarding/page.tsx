"use client";

import { useState } from "react";
import { Sparkles, Check, Info } from "lucide-react";

interface NewJoiner {
  id: string;
  initials: string;
  name: string;
  role: string;
  joinsIn: string;
  manager: string;
  buddy: {
    initials: string;
    name: string;
    role: string;
    mbti: string;
    engagement: string;
    note: string;
  };
  plan30: string[];
  plan60: string[];
  plan90: string[];
  learningPath: {
    num: number;
    title: string;
    subtitle: string;
    hours: string;
  }[];
}

const NEW_JOINERS: NewJoiner[] = [
  {
    id: "dev",
    initials: "DD",
    name: "Dev Dutta",
    role: "Backend Engineer (SDE II)",
    joinsIn: "joins in 33 days",
    manager: "Yash Verma",
    buddy: {
      initials: "DM",
      name: "Dev Mishra",
      role: "Software Engineer II",
      mbti: "ENTJ",
      engagement: "4.8/5",
      note: "Same team, highly engaged, and a complementary energy style.",
    },
    plan30: [
      "Set up the dev environment and ship a small fix in week 1",
      "Read architecture docs; pair with 3 engineers",
      "Join on-call as a shadow",
    ],
    plan60: [
      "Deliver one scoped feature to production",
      "Own a service's runbook",
      "Review 10 pull requests",
    ],
    plan90: [
      "Lead a design review for a medium feature",
      "Take primary on-call",
      "Suggest one reliability improvement",
    ],
    learningPath: [
      { num: 1, title: "AWS fundamentals → applied", subtitle: "Internal course + 1 shadowing session + a practice project", hours: "6 hrs" },
      { num: 2, title: "Kubernetes fundamentals → applied", subtitle: "Internal course + 1 shadowing session + a practice project", hours: "8 hrs" },
      { num: 3, title: "Go fundamentals → applied", subtitle: "Internal course + 1 shadowing session + a practice project", hours: "10 hrs" },
    ],
  },
  {
    id: "zoya",
    initials: "ZF",
    name: "Zoya Fernandes",
    role: "Product Designer",
    joinsIn: "joins in 12 days",
    manager: "Meera Iyer",
    buddy: {
      initials: "SK",
      name: "Sneha Kulkarni",
      role: "Senior Data Analyst",
      mbti: "INTJ",
      engagement: "4.9/5",
      note: "Cross-functional mentor, high empathy, strong design system collaborator.",
    },
    plan30: [
      "Audit existing design system component library",
      "Shadow 5 user research interviews",
      "Deliver v1 wireframes for new onboarding flow",
    ],
    plan60: [
      "Publish 4 new Figma design system components",
      "Run usability test with 8 external users",
      "Conduct UX peer review with product team",
    ],
    plan90: [
      "Lead end-to-end design for Checkout Revamp",
      "Establish design tokens documentation",
      "Present UX quarterly roadmap to leadership",
    ],
    learningPath: [
      { num: 1, title: "Design System Tokens → applied", subtitle: "Internal workshop + token mapping project", hours: "4 hrs" },
      { num: 2, title: "Usability Testing Protocols", subtitle: "Shadowing research lead + synthesis report", hours: "6 hrs" },
    ],
  },
  {
    id: "naveen",
    initials: "NB",
    name: "Naveen Bhat",
    role: "Senior Data Engineer",
    joinsIn: "joins in 19 days",
    manager: "Bhavesh Deshmukh",
    buddy: {
      initials: "RM",
      name: "Rohan Mehta",
      role: "Senior Data Analyst",
      mbti: "INTJ",
      engagement: "4.7/5",
      note: "Data peer, deep domain knowledge, great onboarding guide.",
    },
    plan30: [
      "Set up data pipeline dev environment & local Snowflake credentials",
      "Review ETL pipeline architecture and schema docs",
      "Ship first bug fix to analytics pipeline",
    ],
    plan60: [
      "Refactor real-time streaming ingestion service",
      "Implement data quality validation alerts",
      "Conduct dbt data model peer reviews",
    ],
    plan90: [
      "Lead migration to modern data stack lakehouse",
      "Optimize Snowflake query latency by 20%",
      "Mentor junior data engineers",
    ],
    learningPath: [
      { num: 1, title: "Snowflake Performance Tuning", subtitle: "Advanced internal course + query optimization spike", hours: "8 hrs" },
      { num: 2, title: "dbt Cloud Orchestration", subtitle: "Shadowing lead architect + pipeline deployment", hours: "6 hrs" },
    ],
  },
];

export default function OnboardingPage() {
  const [selectedJoinerId, setSelectedJoinerId] = useState("dev");

  // Checklist State for active joiner
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    "Offer letter signed": true,
    "Background verification started": true,
    "Laptop & accessories ordered": false,
    "Email, Slack & HRMS accounts": false,
    "PF / UAN transfer & nominations": false,
    "Buddy assigned": false,
    "Day-1 agenda sent": false,
    "Welcome kit dispatched": false,
  });

  const [aiWelcomeOutput, setAiWelcomeOutput] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  const selectedJoiner = NEW_JOINERS.find((j) => j.id === selectedJoinerId) || NEW_JOINERS[0];

  const totalItems = Object.keys(checklist).length;
  const completedItems = Object.values(checklist).filter(Boolean).length;
  const progressPercent = Math.round((completedItems / totalItems) * 100);

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateWelcomeEmail = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Write a warm, engaging, and professional welcome email to ${selectedJoiner.name} who is joining as ${selectedJoiner.role} reporting to ${selectedJoiner.manager}. Mention assigned buddy ${selectedJoiner.buddy.name}, Day-1 agenda starting at 10:00 AM, laptop delivery details, and team welcome lunch.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiWelcomeOutput(json.reply);
      } else {
        setAiWelcomeOutput(
          `Subject: Welcome to the team, ${selectedJoiner.name}! 🚀\n\n` +
          `Dear ${selectedJoiner.name},\n\n` +
          `We are thrilled to welcome you to Arcadia Softworks as our new **${selectedJoiner.role}**!\n\n` +
          `Here is what to expect on Day 1:\n` +
          `• **10:00 AM:** Virtual Welcome & IT Setup with ${selectedJoiner.manager}\n` +
          `• **11:30 AM:** Meet your Onboarding Buddy, **${selectedJoiner.buddy.name}**\n` +
          `• **1:00 PM:** Team Welcome Lunch\n\n` +
          `Your laptop and welcome kit have been dispatched. We can't wait to start working together!\n\n` +
          `Best regards,\n` +
          `People Operations Team`
        );
      }
    } catch {
      setAiWelcomeOutput(
        `Subject: Welcome to the team, ${selectedJoiner.name}! 🚀\n\n` +
        `Dear ${selectedJoiner.name},\n\n` +
        `We are thrilled to welcome you to Arcadia Softworks as our new **${selectedJoiner.role}**!\n\n` +
        `Here is what to expect on Day 1:\n` +
        `• **10:00 AM:** Virtual Welcome & IT Setup with ${selectedJoiner.manager}\n` +
        `• **11:30 AM:** Meet your Onboarding Buddy, **${selectedJoiner.buddy.name}**\n` +
        `• **1:00 PM:** Team Welcome Lunch\n\n` +
        `Your laptop and welcome kit have been dispatched. We can't wait to start working together!\n\n` +
        `Best regards,\n` +
        `People Operations Team`
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
            Onboarding
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Turn an accepted offer into a great first 90 days: pre-joining checklist, a role-specific 30-60-90 plan, a learning path from skill gaps and a buddy match.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedJoinerId("dev");
            setChecklist({
              "Offer letter signed": true,
              "Background verification started": true,
              "Laptop & accessories ordered": false,
              "Email, Slack & HRMS accounts": false,
              "PF / UAN transfer & nominations": false,
              "Buddy assigned": false,
              "Day-1 agenda sent": false,
              "Welcome kit dispatched": false,
            });
            setAiWelcomeOutput("");
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

      {/* New Joiners Navigation Tabs */}
      <div style={{ display: "flex", gap: 10 }}>
        {NEW_JOINERS.map((j) => {
          const active = selectedJoinerId === j.id;
          return (
            <button
              key={j.id}
              onClick={() => setSelectedJoinerId(j.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 99,
                border: active ? "none" : "1px solid #CBD5E1",
                background: active ? "#FF3B6B" : "#FFF",
                color: active ? "#FFF" : "#475569",
                fontSize: 12.5,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                boxShadow: active ? "0 2px 8px rgba(255, 59, 107, 0.3)" : "none"
              }}
            >
              {j.name} · <span style={{ opacity: 0.85 }}>{j.joinsIn}</span>
            </button>
          );
        })}
      </div>

      {/* Main Layout: Left Column (35%) & Right Column (65%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 20 }}>
        {/* Left Column: Summary, Pre-joining Checklist, Buddy Match */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Selected Joiner Header Summary Box */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              background: "#2563EB",
              color: "#FFF",
              fontSize: 15,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              {selectedJoiner.initials}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2 }}>
                {selectedJoiner.name}
              </div>
              <div style={{ fontSize: 12, color: "#64748B", fontWeight: 500, marginTop: 3 }}>
                {selectedJoiner.role} · {selectedJoiner.joinsIn} · reports to {selectedJoiner.manager}
              </div>
            </div>
          </div>

          {/* Pre-joining checklist Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Pre-joining checklist
              </h3>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#475569" }}>
                {progressPercent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ width: "100%", height: 6, borderRadius: 99, background: "#E2E8F0", overflow: "hidden" }}>
              <div style={{ width: `${progressPercent}%`, height: "100%", background: "#FF3B6B", transition: "width 0.3s ease" }} />
            </div>

            {/* Interactive Toggle Switches List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
              {[
                "Offer letter signed",
                "Background verification started",
                "Laptop & accessories ordered",
                "Email, Slack & HRMS accounts",
                "PF / UAN transfer & nominations",
                "Buddy assigned",
                "Day-1 agenda sent",
                "Welcome kit dispatched",
              ].map((itemKey) => {
                const checked = Boolean(checklist[itemKey]);
                return (
                  <div
                    key={itemKey}
                    onClick={() => toggleChecklist(itemKey)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  >
                    <span style={{ fontSize: 12.5, fontWeight: checked ? 700 : 500, color: checked ? "var(--ink)" : "#475569" }}>
                      {itemKey}
                    </span>

                    {/* Toggle Switch */}
                    <span style={{
                      width: 32,
                      height: 18,
                      borderRadius: 99,
                      background: checked ? "#FF3B6B" : "#CBD5E1",
                      position: "relative",
                      transition: "all 0.15s ease",
                      display: "inline-block"
                    }}>
                      <span style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#FFF",
                        position: "absolute",
                        top: 2,
                        left: checked ? 16 : 2,
                        transition: "all 0.15s ease"
                      }} />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Buddy match Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              Buddy match
            </h3>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#2563EB",
                color: "#FFF",
                fontSize: 12,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                {selectedJoiner.buddy.initials}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}>
                  {selectedJoiner.buddy.name}
                </div>
                <div style={{ fontSize: 11.5, color: "#64748B" }}>
                  {selectedJoiner.buddy.role} · {selectedJoiner.buddy.mbti} · engagement {selectedJoiner.buddy.engagement}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11.5, color: "#64748B", fontStyle: "italic", lineHeight: 1.4 }}>
              {selectedJoiner.buddy.note}
            </div>
          </div>
        </div>

        {/* Right Column: 30-60-90 Plan, Personal Learning Path, Welcome Email AI */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 30-60-90 Days Plan Row (3 Color Cards) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {/* 30 Days Card */}
            <div style={{
              background: "#FFF0F3",
              border: "1px solid #FBCFE8",
              borderRadius: 18,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                30 days <small style={{ fontSize: 12, fontWeight: 700, color: "#EC4899" }}>Learn</small>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                {selectedJoiner.plan30.map((bullet, idx) => (
                  <div key={idx}>• {bullet}</div>
                ))}
              </div>
            </div>

            {/* 60 Days Card */}
            <div style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 18,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                60 days <small style={{ fontSize: 12, fontWeight: 700, color: "#D97706" }}>Contribute</small>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                {selectedJoiner.plan60.map((bullet, idx) => (
                  <div key={idx}>• {bullet}</div>
                ))}
              </div>
            </div>

            {/* 90 Days Card */}
            <div style={{
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: 18,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>
                90 days <small style={{ fontSize: 12, fontWeight: 700, color: "#059669" }}>Lead</small>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "#334155", lineHeight: 1.4 }}>
                {selectedJoiner.plan90.map((bullet, idx) => (
                  <div key={idx}>• {bullet}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Personal Learning Path Card */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Personal learning path
              </h3>
              <span style={{ fontSize: 11.5, color: "#94A3B8", fontWeight: 500 }}>
                From the skills gap found at hiring
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {selectedJoiner.learningPath.map((item) => (
                <div key={item.num} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#FFEFEF",
                      color: "#FF3B6B",
                      fontSize: 12,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {item.num}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#64748B" }}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <span style={{
                    padding: "3px 10px",
                    borderRadius: 99,
                    background: "#F1F5F9",
                    color: "#475569",
                    fontSize: 11,
                    fontWeight: 700
                  }}>
                    {item.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Welcome Email AI Generator Box */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 17, height: 17, color: "#EC4899" }} />
                Welcome email
              </div>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 99,
                background: aiWelcomeOutput ? "#E0F2FE" : "#F1F5F9", color: aiWelcomeOutput ? "#0369A1" : "#64748B"
              }}>
                {aiWelcomeOutput ? "READY" : "WAITING"}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
              Generate a personalised welcome email.
            </p>

            <button
              onClick={handleGenerateWelcomeEmail}
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
              Write welcome email
            </button>

            {aiWelcomeOutput && (
              <div style={{
                background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16,
                fontSize: 13, color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap"
              }}>
                {aiWelcomeOutput}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
