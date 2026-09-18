"use client";

import { useEffect, useState } from "react";
import { Search, ExternalLink, Filter, Sparkles, UserPlus } from "lucide-react";

export default function CandidateSourcingPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [candRes, jobRes] = await Promise.all([
          fetch("/api/team-pulse/candidates"),
          fetch("/api/team-pulse/jobs"),
        ]);
        if (candRes.ok && jobRes.ok) {
          const c = await candRes.json();
          const j = await jobRes.json();
          setCandidates(c);
          setJobs(j);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = candidates.filter((c) => {
    if (selectedJob !== "All" && c.jobId !== selectedJob) return false;
    if (stageFilter !== "All" && c.stage !== stageFilter) return false;
    return true;
  });

  const activeJobObj = jobs.find((j) => j.id === selectedJob);
  const searchString = activeJobObj
    ? `("Senior Data Analyst" OR "Data Specialist") AND ("SQL" OR "Python") AND "Bengaluru" AND "SaaS"`
    : `("Software Engineer" OR "Developer") AND ("Java" OR "Microservices") AND "Bengaluru"`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--indigo-ink)", letterSpacing: ".1em" }}>
          Candidate Sourcing
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Sourcing Studio</h1>
        <p style={{ color: "var(--muted)", marginTop: 4 }}>
          Source candidates, build targeted LinkedIn/Naukri search strings with AI, and track pipeline status.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
        {/* Left Filter & Search Builder */}
        <div className="tp-panel stack">
          <div style={{ fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Filter style={{ width: 16, height: 16 }} /> Filter Pipeline
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Target Job Opening</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line2)", marginTop: 4 }}
            >
              <option value="All">All Job Openings</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.dept})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Pipeline Stage</label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              style={{ width: "100%", padding: 9, borderRadius: 8, border: "1px solid var(--line2)", marginTop: 4 }}
            >
              {["All", "Sourced", "Screening", "Interview", "Offer", "Accepted"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={{ margin: "8px 0", height: 1, background: "var(--line)" }} />

          <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles style={{ width: 15, height: 15, color: "var(--violet)" }} /> AI Search Boolean String
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Use this generated Boolean search string on LinkedIn Recruiter or Naukri Resdex:
          </div>

          <div style={{ padding: 12, borderRadius: 10, background: "var(--tint2)", fontFamily: "var(--f-mono)", fontSize: 12, lineHeight: 1.5, wordBreak: "break-all" }}>
            {searchString}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(searchString)}`}
              target="_blank"
              rel="noreferrer"
              className="tp-btn"
              style={{ flex: 1, fontSize: 12 }}
            >
              Search Google <ExternalLink style={{ width: 13, height: 13 }} />
            </a>
          </div>
        </div>

        {/* Right Candidate List */}
        <div className="tp-panel stack">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Candidates ({filtered.length})</h3>
            <button className="tp-btn tp-btn-primary" style={{ fontSize: 12, padding: "6px 12px" }}>
              <UserPlus style={{ width: 14, height: 14 }} /> Add Candidate
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>Loading candidates…</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filtered.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      {c.title} · {c.company} · {c.exp} yrs exp · {c.city}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--ink2)", marginTop: 4 }}>
                      CTC: ₹{c.curCtc} L → Expects ₹{c.expcCtc} L · Notice: {c.notice}d
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--indigo)" }}>{c.fitScore}%</div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 99,
                        background: c.stage === "Offer" || c.stage === "Accepted" ? "var(--good-soft)" : "var(--indigo-soft)",
                        color: c.stage === "Offer" || c.stage === "Accepted" ? "var(--good-ink)" : "var(--indigo-ink)",
                      }}
                    >
                      {c.stage}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
