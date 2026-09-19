"use client";

import { useState } from "react";
import { Sparkles, Check, Calculator, FileText, AlertTriangle, RotateCcw } from "lucide-react";
import { renderFormattedMarkdown } from "@/lib/team-pulse/formatMarkdown";

export default function OfferStudioPage() {
  const [selectedCand, setSelectedCand] = useState("Sneha Kulkarni");
  const [selectedRole, setSelectedRole] = useState("Senior Data Analyst");
  const [experience, setExperience] = useState("5.5");
  const [city, setCity] = useState("Pune");
  const [curCtc, setCurCtc] = useState(15.0);
  const [expcCtc, setExpcCtc] = useState(22.0);
  const [notice, setNotice] = useState("90 days");
  const [otherOffers, setOtherOffers] = useState("2");
  const [isReferral, setIsReferral] = useState(false);

  // Offer slider value
  const [offerCtc, setOfferCtc] = useState(22.0);

  // Retention levers toggles
  const [levers, setLevers] = useState({
    bonus: false,
    buyout: false,
    checkIn: false,
    hybrid: false,
    relocation: false,
  });

  const [aiOutput, setAiOutput] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Dynamic Probabilities Calculation
  let leverBoost = 0;
  if (levers.bonus) leverBoost += 10;
  if (levers.buyout) leverBoost += 12;
  if (levers.checkIn) leverBoost += 5;
  if (levers.hybrid) leverBoost += 6;
  if (levers.relocation) leverBoost += 8;

  const baseAccept = Math.min(98, Math.max(20, Math.round(73 + ((offerCtc - 22.0) * 3) + (leverBoost * 0.5))));
  const baseJoin = Math.min(95, Math.max(15, Math.round(54 + ((offerCtc - 22.0) * 2) + leverBoost)));

  // CTC Breakup Computations based on offerCtc (LPA)
  // Total CTC = Fixed (90%) + Variable (10%)
  const totalAnnual = Math.round(offerCtc * 100000);
  const fixedAnnual = Math.round(totalAnnual * 0.90);
  const basicAnnual = Math.round(fixedAnnual * 0.40);
  const hraAnnual = Math.round(basicAnnual * 0.50);
  const pfAnnual = Math.round(basicAnnual * 0.12);
  const gratuityAnnual = Math.round(basicAnnual * 0.0481);
  const variableAnnual = Math.round(totalAnnual * 0.10);
  const specialAnnual = fixedAnnual - (basicAnnual + hraAnnual + pfAnnual + gratuityAnnual);

  const formatINR = (val: number) => "₹" + val.toLocaleString("en-IN");

  const toggleLever = (key: keyof typeof levers) => {
    setLevers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerateScript = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Draft an executive salary negotiation script for candidate ${selectedCand} applying for ${selectedRole}. Offered CTC: ₹${offerCtc} LPA (Current ₹${curCtc} LPA, Expected ₹${expcCtc} LPA). Include key talking points regarding total rewards, career growth, and retention levers.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiOutput(json.reply);
      } else {
        setAiOutput(
          `**AI Negotiation Script for ${selectedCand} (Offered: ₹${offerCtc} LPA):**\n\n` +
          `1. **Acknowledge & Validate:** "We are thrilled by your performance during the interview process for ${selectedRole}. We've structured a competitive package of ₹${offerCtc} LPA."\n` +
          `2. **Highlight Total Rewards:** "Beyond fixed compensation, this includes comprehensive health coverage, annual performance bonuses, and fast-track appraisal eligibility."\n` +
          `3. **Address Counter-Offers:** "We understand you have 2 competing offers. Our team offers rapid technical ownership and a clear path to Tech Lead within 18 months."`
        );
      }
    } catch {
      setAiOutput(
        `**AI Negotiation Script for ${selectedCand} (Offered: ₹${offerCtc} LPA):**\n\n` +
        `1. **Acknowledge & Validate:** "We are thrilled by your performance during the interview process for ${selectedRole}. We've structured a competitive package of ₹${offerCtc} LPA."\n` +
        `2. **Highlight Total Rewards:** "Beyond fixed compensation, this includes comprehensive health coverage, annual performance bonuses, and fast-track appraisal eligibility."\n` +
        `3. **Address Counter-Offers:** "We understand you have 2 competing offers. Our team offers rapid technical ownership and a clear path to Tech Lead within 18 months."`
      );
    } finally {
      setLoadingAi(false);
    }
  };

  const handleGenerateLetter = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Draft a formal employment offer letter for ${selectedCand} for the role of ${selectedRole} at Arcadia Softworks, Bengaluru. Total CTC: ₹${offerCtc} LPA (Monthly ₹${Math.round(totalAnnual / 12).toLocaleString("en-IN")}).`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiOutput(json.reply);
      } else {
        setAiOutput(
          `**FORMAL OFFER LETTER**\n\n` +
          `Date: ${new Date().toLocaleDateString("en-IN")}\n\n` +
          `Dear ${selectedCand},\n\n` +
          `Arcadia Softworks Pvt. Ltd. is pleased to offer you the position of **${selectedRole}** based in Bengaluru.\n\n` +
          `• **Total Annual CTC:** ₹${offerCtc} LPA (${formatINR(totalAnnual)})\n` +
          `• **Monthly Gross:** ${formatINR(Math.round(totalAnnual / 12))}\n` +
          `• **Work Mode:** Hybrid (3 days office, 2 days remote)\n` +
          `• **Joining Date:** Subject to notice period completion (${notice})\n\n` +
          `We look forward to welcoming you to our team!`
        );
      }
    } catch {
      setAiOutput(
        `**FORMAL OFFER LETTER**\n\n` +
        `Date: ${new Date().toLocaleDateString("en-IN")}\n\n` +
        `Dear ${selectedCand},\n\n` +
        `Arcadia Softworks Pvt. Ltd. is pleased to offer you the position of **${selectedRole}** based in Bengaluru.\n\n` +
        `• **Total Annual CTC:** ₹${offerCtc} LPA (${formatINR(totalAnnual)})\n` +
        `• **Monthly Gross:** ${formatINR(Math.round(totalAnnual / 12))}\n` +
        `• **Work Mode:** Hybrid (3 days office, 2 days remote)\n` +
        `• **Joining Date:** Subject to notice period completion (${notice})\n\n` +
        `We look forward to welcoming you to our team!`
      );
    } finally {
      setLoadingAi(false);
    }
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
            Offer Studio
          </h1>
          <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "3px 0 0 0" }}>
            Find the right CTC. Benchmark against market and internal pay bands, predict offer acceptance and joining, and pull levers to reduce drop-off risk.
          </p>
        </div>

        <button
          onClick={() => {
            setOfferCtc(22.0);
            setLevers({ bonus: false, buyout: false, checkIn: false, hybrid: false, relocation: false });
            setAiOutput("");
          }}
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

      {/* Main Grid: Left Inputs (30%) & Right Benchmarks + Breakup (70%) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2.3fr", gap: 20 }}>
        {/* Left Inputs Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Candidate
              </label>
              <select
                value={selectedCand}
                onChange={(e) => setSelectedCand(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
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
                <option value="Sneha Kulkarni">Sneha Kulkarni · Senior Data Analyst</option>
                <option value="Nandini Qureshi">Nandini Qureshi · Senior Data Analyst</option>
                <option value="Faizan Qureshi">Faizan Qureshi · Data Analyst</option>
                <option value="Ujjwal Fernandes">Ujjwal Fernandes · Business Analyst</option>
                <option value="Tanvi Deshmukh">Tanvi Deshmukh · Analytics Consultant</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{
                  width: "100%",
                  height: 40,
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
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Product Manager">Product Manager</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Experience (yrs)
                </label>
                <input
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Current city
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#FFF",
                    outline: "none"
                  }}
                >
                  <option value="Pune">Pune</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Current CTC (L)
                </label>
                <input
                  type="number"
                  value={curCtc}
                  onChange={(e) => setCurCtc(parseFloat(e.target.value) || 0)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Expected CTC (L)
                </label>
                <input
                  type="number"
                  value={expcCtc}
                  onChange={(e) => setExpcCtc(parseFloat(e.target.value) || 0)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                    fontWeight: 600,
                    outline: "none"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Notice period
                </label>
                <select
                  value={notice}
                  onChange={(e) => setNotice(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#FFF",
                    outline: "none"
                  }}
                >
                  <option value="90 days">90 days</option>
                  <option value="60 days">60 days</option>
                  <option value="30 days">30 days</option>
                  <option value="Immediate">Immediate</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                  Other offers
                </label>
                <select
                  value={otherOffers}
                  onChange={(e) => setOtherOffers(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    padding: "0 10px",
                    borderRadius: 10,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "#FFF",
                    outline: "none"
                  }}
                >
                  <option value="2">2</option>
                  <option value="1">1</option>
                  <option value="0">0</option>
                  <option value="3+">3+</option>
                </select>
              </div>
            </div>

            <div>
              <button
                onClick={() => setIsReferral(!isReferral)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 99,
                  background: isReferral ? "#EFF6FF" : "#F8FAFC",
                  border: isReferral ? "1px solid #BFDBFE" : "1px solid #E2E8F0",
                  color: isReferral ? "#2563EB" : "#64748B",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: isReferral ? "#2563EB" : "#94A3B8"
                }} />
                Came through employee referral
              </button>
            </div>

            {/* Offer Slider Box */}
            <div style={{ paddingTop: 8, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>
                  Your offer: <b>₹{offerCtc.toFixed(1)} L</b>
                </span>
              </div>
              <input
                type="range"
                min="12"
                max="35"
                step="0.5"
                value={offerCtc}
                onChange={(e) => setOfferCtc(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#2563EB", cursor: "pointer" }}
              />
              <button
                onClick={() => setOfferCtc(22.0)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 99,
                  background: "#F1F5F9",
                  border: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: 11.5,
                  fontWeight: 700,
                  marginTop: 10,
                  cursor: "pointer"
                }}
              >
                <RotateCcw style={{ width: 12, height: 12 }} />
                Reset to recommended ₹22.0 L
              </button>
            </div>
          </div>
        </div>

        {/* Right Analytics & Breakup Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Top Row: Recommended Offer & 2 Gauges Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 16 }}>
            {/* Card 1: Recommended Offer */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.08em", color: "#94A3B8", textTransform: "uppercase", marginBottom: 4 }}>
                RECOMMENDED OFFER
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", lineHeight: 1.1 }}>
                ₹22.0 <small style={{ fontSize: 15, fontWeight: 700, color: "var(--muted)" }}>LPA</small>
              </div>
              <div style={{ fontSize: 11.5, color: "#64748B", fontWeight: 500, marginTop: 4 }}>
                47% hike · within band ₹16–26 L
              </div>
            </div>

            {/* Card 2: Offer Acceptance Donut */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke="#2563EB"
                    strokeWidth="4"
                    strokeDasharray={`${(baseAccept / 100) * 88} 88`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{baseAccept}%</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: "#94A3B8" }}>accept</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Offer acceptance</div>
              </div>
            </div>

            {/* Card 3: Joining Probability Donut */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#F1F5F9" strokeWidth="4" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke="#F97316"
                    strokeWidth="4"
                    strokeDasharray={`${(baseJoin / 100) * 88} 88`}
                    strokeDashoffset="0"
                  />
                </svg>
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
                }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", lineHeight: 1 }}>{baseJoin}%</span>
                  <span style={{ fontSize: 8, fontWeight: 600, color: "#94A3B8" }}>will join</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>Joining probability</div>
              </div>
            </div>
          </div>

          {/* Benchmark Card: Where this offer sits */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                Where this offer sits
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                Indicative market benchmark · Senior Data Analyst · 5.5 yrs · Bengaluru
              </span>
            </div>

            {/* Visual Benchmark Diagram */}
            <div style={{ position: "relative", padding: "20px 0 10px", width: "100%" }}>
              {/* Background Band Bar */}
              <div style={{ height: 16, background: "#EFF6FF", borderRadius: 99, position: "relative" }}>
                {/* Market P25-P75 range bar */}
                <div style={{ position: "absolute", left: "20%", width: "45%", height: "100%", background: "#BFDBFE", borderRadius: 99 }} />
                {/* Internal Band dashed box */}
                <div style={{ position: "absolute", left: "25%", width: "65%", height: "100%", border: "2px dashed #10B981", borderRadius: 99 }} />
              </div>

              {/* Markers */}
              {/* Current */}
              <div style={{ position: "absolute", left: "18%", top: 0, transform: "translateX(-50%)", fontSize: 11, fontWeight: 600, color: "#64748B", textAlign: "center" }}>
                Current<br />
                <span style={{ display: "inline-block", width: 2, height: 16, background: "#64748B", marginTop: 4 }} />
              </div>

              {/* Peer median */}
              <div style={{ position: "absolute", left: "22%", bottom: 0, transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: "#10B981", textAlign: "center" }}>
                <span style={{ display: "inline-block", width: 2, height: 16, background: "#10B981", marginBottom: 2 }} /><br />
                Peer median
              </div>

              {/* Offer */}
              <div style={{ position: "absolute", left: "70%", bottom: 0, transform: "translateX(-50%)", fontSize: 11, fontWeight: 800, color: "var(--ink)", textAlign: "center" }}>
                <span style={{ display: "inline-block", width: 3, height: 18, background: "var(--ink)", marginBottom: 2 }} /><br />
                Offer
              </div>

              {/* Expected */}
              <div style={{ position: "absolute", left: "70%", top: 0, transform: "translateX(-50%)", fontSize: 11, fontWeight: 700, color: "#EF4444", textAlign: "center" }}>
                Expected<br />
                <span style={{ display: "inline-block", width: 2, height: 16, background: "#EF4444", marginTop: 4 }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 16, fontSize: 11.5, color: "#64748B", flexWrap: "wrap", paddingTop: 10 }}>
              <span>• Market P25–P75 (₹15.2 L–₹21.8 L)</span>
              <span style={{ color: "#10B981", fontWeight: 700 }}>-- Internal band</span>
              <span>Market P50 ₹18.2 L</span>
            </div>

            {/* Pay Equity Warning Banner */}
            <div style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 12.5,
              color: "#92400E",
              lineHeight: 1.5,
              display: "flex",
              alignItems: "flex-start",
              gap: 8
            }}>
              <AlertTriangle style={{ width: 16, height: 16, color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
              <div>
                <b>Pay-equity risk:</b> this offer is 53% above the median of 5 current Data peers at the same level. 5 of them earn less. Consider a sign-on bonus instead of higher fixed pay, or review their pay.
              </div>
            </div>
          </div>

          {/* Middle Row: Joining Risk Drivers & Retention Levers (2 Columns) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Card 1: Joining Risk Drivers */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                  Joining risk drivers
                </h3>
                <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                  Base 88%
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 500 }}>90-day notice period</span>
                  <span style={{ fontWeight: 800, color: "#EF4444", fontFamily: "var(--f-mono)" }}>-16</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 500 }}>2 other offers in hand</span>
                  <span style={{ fontWeight: 800, color: "#EF4444", fontFamily: "var(--f-mono)" }}>-14</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 500 }}>Relocating to Bengaluru</span>
                  <span style={{ fontWeight: 800, color: "#EF4444", fontFamily: "var(--f-mono)" }}>-8</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#334155", fontWeight: 500 }}>Offer meets expectation</span>
                  <span style={{ fontWeight: 800, color: "#10B981", fontFamily: "var(--f-mono)" }}>+4</span>
                </div>
              </div>
            </div>

            {/* Card 2: Retention Levers */}
            <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                  Retention levers
                </h3>
                <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>
                  Toggle to see the effect
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {[
                  { key: "bonus", label: "Joining bonus (₹1–2 L, clawback 12 mo)" },
                  { key: "buyout", label: "Notice-period buyout" },
                  { key: "checkIn", label: "Weekly check-in until joining" },
                  { key: "hybrid", label: "Hybrid / flexible work" },
                  { key: "relocation", label: "Relocation support" },
                ].map((item) => {
                  const active = levers[item.key as keyof typeof levers];
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleLever(item.key as keyof typeof levers)}
                      style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    >
                      <span style={{
                        width: 32,
                        height: 18,
                        borderRadius: 99,
                        background: active ? "#2563EB" : "#CBD5E1",
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
                          left: active ? 16 : 2,
                          transition: "all 0.15s ease"
                        }} />
                      </span>
                      <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? "var(--ink)" : "#475569" }}>
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Card 1: CTC Breakup Table */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
                CTC breakup
              </h3>
              <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}>
                Indicative · ₹{offerCtc.toFixed(1)} L · 47% hike on current
              </span>
            </div>

            {/* Component Table */}
            <div style={{ border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#64748B", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em" }}>
                    <th style={{ padding: "10px 16px" }}>COMPONENT</th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>ANNUAL</th>
                    <th style={{ padding: "10px 16px", textAlign: "right" }}>MONTHLY</th>
                  </tr>
                </thead>
                <tbody style={{ color: "#334155" }}>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 500 }}>Basic (40% of fixed)</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(basicAnnual)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(Math.round(basicAnnual / 12))}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 500 }}>HRA (50% of basic)</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(hraAnnual)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(Math.round(hraAnnual / 12))}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 500 }}>Special allowance</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(specialAnnual)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(Math.round(specialAnnual / 12))}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 500 }}>Employer PF (12% of basic)</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(pfAnnual)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(Math.round(pfAnnual / 12))}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 500 }}>Gratuity (4.81% of basic)</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(gratuityAnnual)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(Math.round(gratuityAnnual / 12))}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td style={{ padding: "10px 16px", fontWeight: 500 }}>Variable / bonus (10%)</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(variableAnnual)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--f-mono)", fontWeight: 600 }}>{formatINR(Math.round(variableAnnual / 12))}</td>
                  </tr>
                  <tr style={{ background: "#F8FAFC", fontWeight: 800 }}>
                    <td style={{ padding: "12px 16px", color: "var(--ink)" }}>Total CTC</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--f-mono)", color: "var(--ink)", fontSize: 13 }}>{formatINR(totalAnnual)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "var(--f-mono)", color: "var(--ink)", fontSize: 13 }}>{formatINR(Math.round(totalAnnual / 12))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Card 2: AI Offer Assistant */}
          <div className="tp-panel" style={{ borderRadius: 20, padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 15.5, fontWeight: 800, color: "var(--ink)" }}>
                <Sparkles style={{ width: 17, height: 17, color: "var(--violet)" }} />
                AI offer assistant
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                padding: "3px 8px",
                borderRadius: 99,
                background: aiOutput ? "#E0F2FE" : "#F1F5F9",
                color: aiOutput ? "#0369A1" : "#64748B"
              }}>
                {aiOutput ? "READY" : "WAITING"}
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>
              Generate a negotiation script or a draft offer letter.
            </p>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleGenerateScript}
                disabled={loadingAi}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 18px",
                  borderRadius: 99,
                  background: "linear-gradient(135deg, #A855F7 0%, #9333EA 100%)",
                  border: "none",
                  color: "#FFF",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: loadingAi ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(168, 85, 247, 0.3)"
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                Negotiation script
              </button>

              <button
                onClick={handleGenerateLetter}
                disabled={loadingAi}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "9px 18px",
                  borderRadius: 99,
                  background: "linear-gradient(135deg, #EC4899 0%, #D946EF 100%)",
                  border: "none",
                  color: "#FFF",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: loadingAi ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(236, 72, 153, 0.3)"
                }}
              >
                <Sparkles style={{ width: 14, height: 14 }} />
                Draft offer letter
              </button>
            </div>

            {aiOutput && (
              <div style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 14,
                padding: 16,
                fontSize: 13,
                color: "#334155",
                lineHeight: 1.6
              }}>
                {renderFormattedMarkdown(aiOutput)}
              </div>
            )}

            <div style={{ fontSize: 11.5, color: "#94A3B8", fontStyle: "italic", paddingTop: 4 }}>
              Market numbers are illustrative sample data for this demo, not live salary data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
