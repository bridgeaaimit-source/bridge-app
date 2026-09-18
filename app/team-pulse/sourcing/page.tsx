"use client";

import { useState } from "react";
import { Sparkles, Search, Copy, ExternalLink, Filter, Check, ArrowRight } from "lucide-react";

const INITIAL_CANDIDATES = [
  {
    id: "c1",
    name: "Sneha Kulkarni",
    fitScore: 91,
    source: "LinkedIn",
    openToWork: true,
    stage: "Interview",
    title: "Senior Data Analyst",
    company: "Northpeak Analytics",
    exp: "5.5 yrs",
    city: "Pune",
    curCtc: "15.3",
    expcCtc: "22.0",
    ctcHike: "+47%",
    notice: "90-day notice",
    mbti: "INTJ",
    matchedSkills: ["SQL", "Python", "Power BI", "Statistica", "Storytelling"],
    otherSkills: ["dbt", "Tableau"],
  },
  {
    id: "c2",
    name: "Nandini Qureshi",
    fitScore: 90,
    source: "LinkedIn",
    openToWork: true,
    stage: "Interview",
    title: "Senior Data Analyst",
    company: "Saffron Retail Tech",
    exp: "6.4 yrs",
    city: "Pune",
    curCtc: "18.3",
    expcCtc: "27.5",
    ctcHike: "+50%",
    notice: "90-day notice",
    mbti: "ENTJ",
    matchedSkills: ["SQL", "Python", "Power BI", "Statistica", "Storytelling"],
    otherSkills: ["dbt"],
  },
  {
    id: "c3",
    name: "Faizan Qureshi",
    fitScore: 78,
    source: "Naukri",
    openToWork: true,
    stage: "Interview",
    title: "Data Analyst",
    company: "Kestrel Payments",
    exp: "4.2 yrs",
    city: "Bengaluru",
    curCtc: "13.5",
    expcCtc: "19.0",
    ctcHike: "+41%",
    notice: "30-day notice",
    mbti: "ISTJ",
    matchedSkills: ["SQL", "Python", "Statistica", "Power BI", "Storytelling"],
    otherSkills: ["Tableau"],
  },
  {
    id: "c4",
    name: "Ujjwal Fernandes",
    fitScore: 77,
    source: "LinkedIn",
    openToWork: true,
    stage: "Screening",
    title: "Business Analyst",
    company: "Lumen Edge Systems",
    exp: "6.9 yrs",
    city: "Bengaluru",
    curCtc: "16.1",
    expcCtc: "19.6",
    ctcHike: "+22%",
    notice: "30-day notice",
    mbti: "INTP",
    matchedSkills: ["Python", "Statistica", "Storytelling", "SQL", "Power BI"],
    otherSkills: ["dbt", "Tableau"],
  },
  {
    id: "c5",
    name: "Aditi Desai",
    fitScore: 74,
    source: "LinkedIn",
    openToWork: true,
    stage: "Screening",
    title: "Business Analyst",
    company: "Indus Mobility",
    exp: "5.1 yrs",
    city: "Bengaluru",
    curCtc: "17.8",
    expcCtc: "25.7",
    ctcHike: "+44%",
    notice: "60-day notice",
    mbti: "ISTJ",
    matchedSkills: ["SQL", "Python", "Storytelling", "Power BI", "Statistica"],
    otherSkills: ["dbt"],
  },
  {
    id: "c6",
    name: "Madhuri Fernandes",
    fitScore: 68,
    source: "Referral",
    openToWork: true,
    stage: "Interview",
    title: "Data Analyst",
    company: "Brightwater EdTech",
    exp: "7 yrs",
    city: "Bengaluru",
    curCtc: "15.4",
    expcCtc: "20.1",
    ctcHike: "+31%",
    notice: "60-day notice",
    mbti: "ENTP",
    matchedSkills: ["Python", "Power BI", "Storytelling", "SQL", "Statistica"],
    otherSkills: ["Tableau"],
  },
];

export default function CandidateSourcingPage() {
  const [selectedRole, setSelectedRole] = useState("Senior Data Analyst");
  const [maxNotice, setMaxNotice] = useState("Any (≤ 90 days)");
  const [maxCtc, setMaxCtc] = useState(28.0);
  const [openToWorkOnly, setOpenToWorkOnly] = useState(true);
  const [selectedSource, setSelectedSource] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [copiedBoolean, setCopiedBoolean] = useState(false);

  const booleanQuery = `("Data Analyst" OR "Analytics" OR "Business Analyst") AND ("SQL" AND "Python" AND "Power BI") AND ("Bengaluru" OR "Bangalore")`;
  const xrayQuery = `site:linkedin.com/in ("open to work" OR "#opentowork") ("Data Analyst" OR "Analytics" OR "Business Analyst") "SQL" "Python" Bengaluru`;

  const filteredCandidates = INITIAL_CANDIDATES.filter((c) => {
    if (openToWorkOnly && !c.openToWork) return false;
    if (parseFloat(c.expcCtc) > maxCtc) return false;
    if (selectedSource !== "All" && c.source.toLowerCase() !== selectedSource.toLowerCase()) return false;
    if (selectedCity !== "All" && c.city.toLowerCase() !== selectedCity.toLowerCase()) return false;
    return true;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(booleanQuery);
    setCopiedBoolean(true);
    setTimeout(() => setCopiedBoolean(false), 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* Sub-Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 2 }}>
            — HIRE
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em", margin: 0 }}>
            Talent Sourcing
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Find the best candidates for an open role. Filter by open-to-work, notice period and expected CTC, and search real LinkedIn and Naukri profiles with AI-built queries.
          </p>
        </div>

        <button
          onClick={() => alert("Loaded Rocket India candidate sourcing pipeline!")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 14px",
            borderRadius: 99,
            background: "#E0F2FE",
            border: "1px solid #BAE6FD",
            color: "#0369A1",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <Sparkles style={{ width: 14, height: 14, color: "#0284C7" }} />
          Try with demo data
        </button>
      </div>

      {/* Main Grid: Left Filters & List (65%) | Right Live Profile Search (35%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: 20 }}>
        {/* Left Column: Filter Controls & Candidate List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Filter Controls Box */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Row 1: Open role, Max notice, Max CTC slider, Open to work toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1.2fr auto", alignItems: "end", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Open role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    background: "#FFF",
                    outline: "none"
                  }}
                >
                  <option value="Senior Data Analyst">Senior Data Analyst</option>
                  <option value="Backend Engineer (SDE II)">Backend Engineer (SDE II)</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Product Manager">Product Manager</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Max notice period
                </label>
                <select
                  value={maxNotice}
                  onChange={(e) => setMaxNotice(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    background: "#FFF",
                    outline: "none"
                  }}
                >
                  <option value="Any (≤ 90 days)">Any (≤ 90 days)</option>
                  <option value="30 days">30 days</option>
                  <option value="60 days">60 days</option>
                  <option value="Immediate">Immediate</option>
                </select>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  <span>Max expected CTC:</span>
                  <span style={{ color: "#2563EB" }}>₹{maxCtc.toFixed(1)} L</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="40"
                  step="0.5"
                  value={maxCtc}
                  onChange={(e) => setMaxCtc(parseFloat(e.target.value))}
                  style={{ width: "100%", accentColor: "#2563EB", cursor: "pointer" }}
                />
              </div>

              <div>
                <button
                  onClick={() => setOpenToWorkOnly(!openToWorkOnly)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 99,
                    background: openToWorkOnly ? "#2563EB" : "#F1F5F9",
                    border: "none",
                    color: openToWorkOnly ? "#FFF" : "#64748B",
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: openToWorkOnly ? "#FFF" : "#94A3B8"
                  }} />
                  Open to work only
                </button>
              </div>
            </div>

            {/* Row 2: SOURCE Tags */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8", textTransform: "uppercase" }}>
                SOURCE
              </span>
              {["All", "LinkedIn", "Naukri", "Referral", "Careers page"].map((src) => {
                const active = selectedSource === src;
                return (
                  <button
                    key={src}
                    onClick={() => setSelectedSource(src)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: active ? "#EFF6FF" : "#F8FAFC",
                      border: active ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
                      color: active ? "#1D4ED8" : "#475569",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {src}
                  </button>
                );
              })}
            </div>

            {/* Row 3: CITY Tags */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8", textTransform: "uppercase" }}>
                CITY
              </span>
              {["All", "Bengaluru", "Mumbai", "Delhi NCR", "Hyderabad", "Pune", "Chennai", "Remote"].map((city) => {
                const active = selectedCity === city;
                return (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: active ? "#EFF6FF" : "#F8FAFC",
                      border: active ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
                      color: active ? "#1D4ED8" : "#475569",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Candidate List Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
              {filteredCandidates.length} candidates · ranked by AI fit
            </h3>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
              Sample pool
            </span>
          </div>

          {/* Candidates Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filteredCandidates.map((cand) => (
              <div
                key={cand.id}
                className="tp-panel"
                style={{
                  borderRadius: 20,
                  padding: 20,
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 110px",
                  alignItems: "center",
                  gap: 16,
                  transition: "all 0.15s ease",
                  boxShadow: "0 2px 8px -2px rgba(15, 21, 51, 0.04)"
                }}
              >
                {/* Left Circular Gauge */}
                <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                  <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="3.8" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={cand.fitScore >= 85 ? "#10B981" : "#2563EB"}
                      strokeWidth="3.8"
                      strokeDasharray={`${(cand.fitScore / 100) * 88} 88`}
                      strokeDashoffset="0"
                    />
                  </svg>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
                      {cand.fitScore}
                    </span>
                  </div>
                </div>

                {/* Middle Info Details */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {/* Row 1: Name, Source Badge, Open to work badge, Stage badge */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
                      {cand.name}
                    </span>

                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: cand.source === "LinkedIn" ? "#EFF6FF" : cand.source === "Naukri" ? "#ECFDF5" : "#FFF7ED",
                      color: cand.source === "LinkedIn" ? "#2563EB" : cand.source === "Naukri" ? "#059669" : "#D97706"
                    }}>
                      {cand.source}
                    </span>

                    {cand.openToWork && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: "#DCFCE7",
                        color: "#166534",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} />
                        Open to work
                      </span>
                    )}

                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "#F1F5F9",
                      color: "#475569"
                    }}>
                      {cand.stage}
                    </span>
                  </div>

                  {/* Row 2: Title, Company, Exp, City */}
                  <div style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
                    {cand.title} at {cand.company} · {cand.exp} · {cand.city}
                  </div>

                  {/* Row 3: CTC, Notice, MBTI */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12.5, color: "#64748B", fontWeight: 500 }}>
                    <span>
                      <b>₹{cand.curCtc} L</b> → <b>₹{cand.expcCtc} L</b> <span style={{ color: "#10B981", fontWeight: 700 }}>({cand.ctcHike})</span>
                    </span>
                    <span>⏱ {cand.notice}</span>
                    <span style={{ fontWeight: 700, color: "#475569" }}>{cand.mbti}</span>
                  </div>

                  {/* Row 4: Skill Pills */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                    {cand.matchedSkills.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: 99,
                          background: "#E0F2FE",
                          color: "#0369A1",
                          border: "1px solid #BAE6FD"
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {cand.otherSkills?.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: 99,
                          background: "#F8FAFC",
                          color: "#64748B",
                          border: "1px dashed #CBD5E1"
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                  <button
                    onClick={() => alert(`Opening AI fit report for ${cand.name}...`)}
                    style={{
                      width: "100%",
                      padding: "7px 0",
                      borderRadius: 99,
                      background: "#2563EB",
                      border: "none",
                      color: "#FFF",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Fit report
                  </button>

                  <button
                    onClick={() => alert(`Drafting outreach email to ${cand.name}...`)}
                    style={{
                      width: "100%",
                      padding: "7px 0",
                      borderRadius: 99,
                      background: "#FFF",
                      border: "1px solid #CBD5E1",
                      color: "#1E293B",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    ✉ Outreach
                  </button>

                  <button
                    onClick={() => alert(`Generating offer letter proposal for ${cand.name}...`)}
                    style={{
                      width: "100%",
                      padding: "7px 0",
                      borderRadius: 99,
                      background: "#FFF",
                      border: "1px solid #CBD5E1",
                      color: "#1E293B",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Offer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Search Live Profiles & Role Specs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Card 1: Search Live Profiles */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Search live profiles
              </h3>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", background: "#EFF6FF", padding: "2px 8px", borderRadius: 99 }}>
                ● Real search
              </span>
            </div>

            <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
              Built from the role's must-have skills. Opens a real search in a new tab.
            </p>

            {/* Boolean String Box */}
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>
                BOOLEAN STRING · LINKEDIN / NAUKRI RESDEX
              </div>
              <div style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: 12,
                fontFamily: "var(--f-mono)",
                fontSize: 11.5,
                color: "#334155",
                lineHeight: 1.5,
                wordBreak: "break-word"
              }}>
                {booleanQuery}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: "#FFF",
                  border: "1px solid #CBD5E1",
                  color: "#1E293B",
                  fontSize: 12,
                  fontWeight: 700,
                  marginTop: 8,
                  cursor: "pointer"
                }}
              >
                {copiedBoolean ? <Check style={{ width: 13, height: 13, color: "#10B981" }} /> : <Copy style={{ width: 13, height: 13 }} />}
                {copiedBoolean ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Google X-Ray Box */}
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "#64748B", textTransform: "uppercase", marginBottom: 6 }}>
                GOOGLE X-RAY · OPEN-TO-WORK PROFILES
              </div>
              <div style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 12,
                padding: 12,
                fontFamily: "var(--f-mono)",
                fontSize: 11.5,
                color: "#334155",
                lineHeight: 1.5,
                wordBreak: "break-word"
              }}>
                {xrayQuery}
              </div>
            </div>

            {/* External Search Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
              <a
                href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent('("Data Analyst" OR "Analytics") AND ("SQL" AND "Python")')}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "10px",
                  borderRadius: 12,
                  background: "#2563EB",
                  color: "#FFF",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                <Search style={{ width: 14, height: 14 }} />
                Search on LinkedIn <ExternalLink style={{ width: 13, height: 13 }} />
              </a>

              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(xrayQuery)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "10px",
                  borderRadius: 12,
                  background: "#FFF",
                  border: "1px solid #CBD5E1",
                  color: "#1E293B",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                <Search style={{ width: 14, height: 14 }} />
                Google X-ray search <ExternalLink style={{ width: 13, height: 13 }} />
              </a>

              <a
                href="https://resdex.naukri.com"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "10px",
                  borderRadius: 12,
                  background: "#FFF",
                  border: "1px solid #CBD5E1",
                  color: "#1E293B",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                <Search style={{ width: 14, height: 14 }} />
                Market check on Naukri <ExternalLink style={{ width: 13, height: 13 }} />
              </a>
            </div>

            <div style={{
              background: "#F0F9FF",
              border: "1px solid #BAE6FD",
              borderRadius: 12,
              padding: "10px 12px",
              fontSize: 11.5,
              color: "#0369A1",
              lineHeight: 1.5
            }}>
              <b>Why a demo pool?</b> LinkedIn and Naukri don't offer open APIs. A live version connects through LinkedIn Recruiter or Naukri Resdex (paid).
            </div>
          </div>

          {/* Card 2: Role Specs */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                {selectedRole}
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                38 days open
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>Budget band</span>
                <span style={{ fontWeight: 800, color: "var(--ink)" }}>₹16–26 L</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>Experience</span>
                <span style={{ fontWeight: 800, color: "var(--ink)" }}>4–7 yrs</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>Hiring manager</span>
                <span style={{ fontWeight: 800, color: "var(--ink)" }}>Rahul Rao</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>Market P50 (at 4 yrs)</span>
                <span style={{ fontWeight: 800, color: "var(--ink)" }}>₹15.0 L</span>
              </div>
            </div>

            {/* Skill Requirements */}
            <div style={{ paddingTop: 8, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["SQL", "Python", "Power BI", "Statistics", "Storytelling", "A/B Testing", "dbt", "Tableau"].map((skill) => (
                  <span
                    key={skill}
                    style={{
                      fontSize: 11.5,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 99,
                      background: "#E0F2FE",
                      color: "#0284C7",
                      border: "1px solid #BAE6FD"
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
