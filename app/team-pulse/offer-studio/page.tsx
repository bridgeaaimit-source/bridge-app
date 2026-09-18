"use client";

import { useEffect, useState } from "react";
import { Sparkles, Calculator, Check, FileText } from "lucide-react";

export default function OfferStudioPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandId, setSelectedCandId] = useState("");
  const [offerCtc, setOfferCtc] = useState(19.5);
  const [bonusToggle, setBonusToggle] = useState(false);
  const [buyoutToggle, setBuyoutToggle] = useState(false);
  const [aiLetter, setAiLetter] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await fetch("/api/team-pulse/candidates");
        if (res.ok) {
          const list = await res.json();
          setCandidates(list);
          if (list.length > 0) {
            setSelectedCandId(list[0].id);
            setOfferCtc(list[0].expcCtc || 19.5);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCandidates();
  }, []);

  const cand = candidates.find((c) => c.id === selectedCandId);

  const calculateProbability = () => {
    if (!cand) return { acceptProb: 75, joinProb: 70 };
    let base = 85;
    if (cand.notice >= 60) base -= 15;
    if (cand.offers > 0) base -= cand.offers * 8;
    if (offerCtc >= cand.expcCtc) base += 10;
    if (bonusToggle) base += 7;
    if (buyoutToggle) base += 8;
    const joinProb = Math.min(96, Math.max(10, base));
    const acceptProb = Math.min(98, Math.max(15, base + 5));
    return { acceptProb, joinProb };
  };

  const probs = calculateProbability();

  const handleGenerateLetter = async () => {
    if (!cand) return;
    setLoadingAi(true);
    try {
      const res = await fetch("/api/team-pulse/copilot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Draft a formal offer letter for candidate ${cand.name} for the position of ${cand.title}. Offere CTC: ₹${offerCtc} LPA, Hybrid Bengaluru, joining in ${cand.notice} days. Include 6-month probation and standard background check clause.`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiLetter(json.reply);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Offer & Joining Prediction
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Offer Studio</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Benchmark pay against market & internal bands, predict offer acceptance and joining probability, and toggle retention levers.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Inputs */}
        <div className="tp-panel stack">
          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Select Candidate</label>
            <select
              value={selectedCandId}
              onChange={(e) => {
                setSelectedCandId(e.target.value);
                const target = candidates.find((c) => c.id === e.target.value);
                if (target) setOfferCtc(target.expcCtc);
              }}
              style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line2)", marginTop: 4 }}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.title}
                </option>
              ))}
            </select>
          </div>

          {cand && (
            <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 12.5 }}>
              <div>
                <b>Current Pay:</b> ₹{cand.curCtc} LPA | <b>Expected:</b> ₹{cand.expcCtc} LPA
              </div>
              <div>
                <b>Notice Period:</b> {cand.notice} days | <b>Other Offers:</b> {cand.offers}
              </div>
            </div>
          )}

          <div style={{ margin: "6px 0", height: 1, background: "var(--line)" }} />

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700 }}>
              <span>Offered CTC</span>
              <span style={{ fontFamily: "var(--f-mono)", color: "var(--indigo)" }}>₹{offerCtc.toFixed(1)} LPA</span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="0.5"
              value={offerCtc}
              onChange={(e) => setOfferCtc(parseFloat(e.target.value))}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={bonusToggle} onChange={(e) => setBonusToggle(e.target.checked)} />
              Include Joining Bonus (₹1.5 L)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
              <input type="checkbox" checked={buyoutToggle} onChange={(e) => setBuyoutToggle(e.target.checked)} />
              Offer Notice Period Buyout
            </label>
          </div>
        </div>

        {/* Right Benchmarks & Predictors */}
        <div className="tp-panel stack">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 12, background: "var(--tint)", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--good)" }}>{probs.acceptProb}%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>Offer Acceptance Probability</div>
            </div>

            <div style={{ padding: 16, borderRadius: 12, background: "var(--tint)", textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "var(--indigo)" }}>{probs.joinProb}%</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>Joining Probability</div>
            </div>
          </div>

          <div style={{ margin: "10px 0", height: 1, background: "var(--line)" }} />

          <h3 style={{ fontSize: 15, fontWeight: 700 }}>CTC Component Breakup</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Basic Pay (40%)</span>
              <b style={{ fontFamily: "var(--f-mono)" }}>₹{(offerCtc * 0.4).toFixed(2)} LPA</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>HRA (50% of basic)</span>
              <b style={{ fontFamily: "var(--f-mono)" }}>₹{(offerCtc * 0.2).toFixed(2)} LPA</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Special Allowance</span>
              <b style={{ fontFamily: "var(--f-mono)" }}>₹{(offerCtc * 0.3).toFixed(2)} LPA</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Performance Variable (10%)</span>
              <b style={{ fontFamily: "var(--f-mono)" }}>₹{(offerCtc * 0.1).toFixed(2)} LPA</b>
            </div>
          </div>

          <button onClick={handleGenerateLetter} disabled={loadingAi} className="tp-btn tp-btn-ai" style={{ marginTop: 12 }}>
            <Sparkles style={{ width: 15, height: 15 }} />
            {loadingAi ? "Drafting Offer Letter…" : "Draft Offer Letter with AI"}
          </button>

          {aiLetter && (
            <div style={{ padding: 12, borderRadius: 10, background: "var(--tint)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.6, marginTop: 10 }}>
              {aiLetter}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
