"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import TPOShell from "@/components/TPOShell";
import toast from "react-hot-toast";
import {
  Users, TrendingUp, TrendingDown, AlertTriangle, Award, Target,
  ChevronDown, ChevronUp, Send, Download,
  Plus, Edit3, Trash2, Sparkles,
  X, Check, BarChart2, RefreshCw,
} from "lucide-react";
import { getCompanyLogoUrl, getCompanyFallback, formatDate, formatCountdown, timeAgo } from "@/lib/driveUtils";

/* ─── Company Logo with Clearbit fallback ─── */
function CompanyLogo({ domain, name, size = 32 }) {
  const [imgError, setImgError] = useState(false);
  const fb = getCompanyFallback(name);
  const url = getCompanyLogoUrl(domain);

  if (!url || imgError) {
    return (
      <div
        className="rounded-lg flex items-center justify-center text-white font-bold shrink-0"
        style={{ width: size, height: size, backgroundColor: fb.color, fontSize: size * 0.4 }}
      >
        {fb.initial}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name}
      className="rounded-lg object-contain bg-white border border-gray-100 shrink-0"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
    />
  );
}

/* ─── Mini readiness ring ─── */
function MiniRing({ value, size = 40, stroke = 4, color = "#0D9488" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value, 100);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>
        {Math.round(value)}
      </span>
    </div>
  );
}

export default function TPODashboardPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Section data
  const [batchStats, setBatchStats] = useState(null);
  const [drives, setDrives] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [heatmapInsights, setHeatmapInsights] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [weeklyReport, setWeeklyReport] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [nudging, setNudging] = useState({});

  // Drive form state
  const [showDriveForm, setShowDriveForm] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [driveForm, setDriveForm] = useState({
    company: "", companyDomain: "", role: "", package: "",
    location: "", driveDate: "", lastApplyDate: "",
    minCGPA: "", minBridgeScore: "", superset_link: "",
    rounds: [],
  });
  const [savingDrive, setSavingDrive] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    overview: true, readiness: true, predictions: true, skills: true,
    leaders: true, atRisk: true, report: false, drives: true,
  });

  const roundOptions = ["Aptitude", "GD", "Technical", "HR", "Coding", "Case Study"];

  const toggleSection = (s) => setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));

  // ─── Data fetchers (declared before useEffect to avoid hoisting issues) ───
  async function fetchBatchStats(collegeId) {
    try {
      const res = await fetch(`/api/tpo/batch-stats?collegeId=${collegeId}`);
      const data = await res.json();
      if (data.error) { console.error(data.error); return; }

      setBatchStats(data);
      setAtRiskStudents(data.atRisk?.students || []);

      // Sort students by bridgeScore for leaderboard
      const sorted = [...(data.students || [])]
        .sort((a, b) => (b.bridgeScore || 0) - (a.bridgeScore || 0))
        .slice(0, 10);
      setTopPerformers(sorted);
    } catch (e) {
      console.error("Batch stats fetch error:", e);
    }
  }

  async function fetchDrives(collegeId) {
    try {
      const res = await fetch(`/api/tpo/drives?collegeId=${collegeId}`);
      const data = await res.json();
      setDrives(data.drives || []);
    } catch (e) {
      console.error("Drives fetch error:", e);
    }
  }

  async function fetchSkillGap(collegeId) {
    try {
      const res = await fetch(`/api/tpo/skill-gap?collegeId=${collegeId}`);
      const data = await res.json();
      setHeatmap(data.heatmap || []);
      setHeatmapInsights(data.insights || []);
    } catch (e) {
      console.error("Skill gap fetch error:", e);
    }
  }

  // ─── Load data ───
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "tpo") return;
      const data = userDoc.data();
      setUserData(data);
      setLoading(false);

      if (data.collegeId) {
        fetchBatchStats(data.collegeId);
        fetchDrives(data.collegeId);
        fetchSkillGap(data.collegeId);
      }
    });
    return () => unsubscribe();
  }, []);

  // ─── Drive CRUD ───
  const resetDriveForm = () => {
    setDriveForm({
      company: "", companyDomain: "", role: "", package: "",
      location: "", driveDate: "", lastApplyDate: "",
      minCGPA: "", minBridgeScore: "", superset_link: "", rounds: [],
    });
    setEditingDrive(null);
  };

  const handleSaveDrive = async () => {
    if (!driveForm.company || !driveForm.role) {
      toast.error("Company and role are required");
      return;
    }
    setSavingDrive(true);
    try {
      const payload = {
        ...driveForm,
        collegeId: userData.collegeId,
        tpoName: userData.name,
        collegeName: userData.college,
        eligibility: {
          minCGPA: parseFloat(driveForm.minCGPA) || 0,
          minBridgeScore: parseInt(driveForm.minBridgeScore) || 0,
          branches: [],
          year: "",
        },
      };

      if (editingDrive) {
        const res = await fetch("/api/tpo/drives", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ driveId: editingDrive.driveId, ...payload }),
        });
        if (res.ok) toast.success("Drive updated");
      } else {
        const res = await fetch("/api/tpo/drives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok) toast.success(`Drive added! ${data.notifiedCount || 0} students notified`);
      }

      resetDriveForm();
      setShowDriveForm(false);
      fetchDrives(userData.collegeId);
    } catch (e) {
      toast.error("Failed to save drive");
    }
    setSavingDrive(false);
  };

  const handleDeleteDrive = async (driveId) => {
    if (!confirm("Delete this drive?")) return;
    try {
      const res = await fetch(`/api/tpo/drives?driveId=${driveId}`, { method: "DELETE" });
      if (res.ok) { toast.success("Drive deleted"); fetchDrives(userData.collegeId); }
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleEditDrive = (drive) => {
    setEditingDrive(drive);
    setDriveForm({
      company: drive.company || "",
      companyDomain: drive.companyDomain || "",
      role: drive.role || "",
      package: drive.package || "",
      location: drive.location || "",
      driveDate: drive.driveDate ? new Date(drive.driveDate.seconds ? drive.driveDate.seconds * 1000 : drive.driveDate).toISOString().split("T")[0] : "",
      lastApplyDate: drive.lastApplyDate ? new Date(drive.lastApplyDate.seconds ? drive.lastApplyDate.seconds * 1000 : drive.lastApplyDate).toISOString().split("T")[0] : "",
      minCGPA: drive.eligibility?.minCGPA?.toString() || "",
      minBridgeScore: drive.eligibility?.minBridgeScore?.toString() || "",
      superset_link: drive.superset_link || "",
      rounds: drive.rounds || [],
    });
    setShowDriveForm(true);
  };

  // ─── Nudge ───
  const handleNudge = async (studentIds, company = "", driveDate = "") => {
    const key = studentIds.join(",");
    setNudging(prev => ({ ...prev, [key]: true }));
    try {
      const nearestDrive = drives.find(d => d.status !== "completed");
      const res = await fetch("/api/tpo/nudge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds,
          tpoName: userData?.name || "",
          college: userData?.college || "",
          company: company || nearestDrive?.company || "",
          driveDate: driveDate || (nearestDrive?.driveDate ? new Date(nearestDrive.driveDate.seconds ? nearestDrive.driveDate.seconds * 1000 : nearestDrive.driveDate).toISOString() : ""),
          collegeId: userData?.collegeId || "",
        }),
      });
      const data = await res.json();
      if (res.ok) toast.success(`Nudge sent to ${data.nudgedCount} student(s)`);
    } catch (e) {
      toast.error("Failed to send nudge");
    }
    setNudging(prev => ({ ...prev, [key]: "done" }));
    setTimeout(() => setNudging(prev => ({ ...prev, [key]: false })), 5000);
  };

  // ─── Weekly Report ───
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const topImprovers = topPerformers.slice(0, 5).map(s => ({
        name: s.name, bridgeScore: s.bridgeScore || 0,
      }));
      const upcomingDrives = drives
        .filter(d => d.status !== "completed")
        .slice(0, 5)
        .map(d => ({
          company: d.company, role: d.role, package: d.package,
          driveDate: d.driveDate ? formatDate(d.driveDate) : "TBD",
        }));

      const res = await fetch("/api/tpo/weekly-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchStats,
          topImprovers,
          upcomingDrives,
          previousWeekStats: {},
          collegeName: userData?.college || "",
        }),
      });
      const data = await res.json();
      if (data.report) setWeeklyReport(data.report);
      else toast.error("Report generation failed");
    } catch (e) {
      toast.error("Failed to generate report");
    }
    setGeneratingReport(false);
  };

  const handleDownloadPDF = async () => {
    try {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      document.body.appendChild(script);
      script.onload = () => {
        const el = document.getElementById("weekly-report-content");
        if (el && window.html2pdf) {
          window.html2pdf().set({
            margin: 1, filename: `BRIDGE_Weekly_Report_${new Date().toISOString().split("T")[0]}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2 }, jsPDF: { unit: "cm", format: "a4", orientation: "portrait" },
          }).from(el).save();
        }
      };
    } catch (e) {
      toast.error("PDF download failed");
    }
  };

  const toggleRound = (r) => {
    setDriveForm(prev => ({
      ...prev,
      rounds: prev.rounds.includes(r) ? prev.rounds.filter(x => x !== r) : [...prev.rounds, r],
    }));
  };

  if (loading) return null;

  const stats = batchStats || {};
  const batchPct = stats.batchReadiness || 0;
  const ringR = 70;
  const ringC = 2 * Math.PI * ringR;

  return (
    <TPOShell>
      <div className="max-w-[1300px] mx-auto px-4 md:px-8 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">TPO Dashboard</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {userData?.college || "College"} — Batch Overview
            </h1>
          </div>
          <button onClick={() => { fetchBatchStats(userData?.collegeId); fetchDrives(userData?.collegeId); fetchSkillGap(userData?.collegeId); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>

        {/* ══ SECTION A — Batch Overview Stats ══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total Students", value: stats.totalStudents || 0, icon: Users, color: "text-[#0D9488]", bg: "bg-[#CCFBF1]" },
            { label: "Placement Ready", value: `${stats.placementReady?.count || 0}`, sub: `${stats.placementReady?.percentage || 0}%`, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "At Risk", value: stats.atRisk?.count || 0, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", textColor: "text-red-600" },
            { label: "Avg BRIDGE Score", value: stats.averageBridgeScore || 0, icon: BarChart2, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Predicted Placements", value: stats.predictedPlacements || 0, icon: Award, color: "text-amber-600", bg: "bg-amber-50" },
          ].map(({ label, value, sub, icon: Icon, color, bg, textColor }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${textColor || "text-gray-900"}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}{sub ? ` (${sub})` : ""}</p>
            </div>
          ))}
        </div>

        {/* ══ SECTION B — Batch Readiness Meter ══ */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("readiness")}>
            <h2 className="text-lg font-bold text-gray-900">Batch Readiness Meter</h2>
            {expandedSections.readiness ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
          {expandedSections.readiness && (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative" style={{ width: 180, height: 180 }}>
                <svg className="-rotate-90" viewBox="0 0 180 180" width="180" height="180">
                  <circle cx="90" cy="90" r={ringR} fill="none" stroke="#E5E7EB" strokeWidth="12" />
                  <circle cx="90" cy="90" r={ringR} fill="none" stroke="#0D9488" strokeWidth="12"
                    strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC - (ringC * batchPct / 100)}
                    style={{ transition: "stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-[#0D9488]">{batchPct}%</span>
                  <span className="text-xs text-gray-400">Ready</span>
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  Your batch is <span className="text-[#0D9488]">{batchPct}%</span> placement ready
                </p>
                {stats.trend && stats.trend.direction !== "neutral" && (
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    stats.trend.direction === "up" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  }`}>
                    {stats.trend.direction === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {stats.trend.change}% vs last month
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Based on cumulative BRIDGE Scores of {stats.totalStudents || 0} students
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ══ SECTION C — Company-Wise Prediction Table ══ */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("predictions")}>
            <h2 className="text-lg font-bold text-gray-900">Company-Wise Predictions</h2>
            {expandedSections.predictions ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
          {expandedSections.predictions && (
            drives.filter(d => d.status !== "completed").length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 px-2 text-xs text-gray-400 font-semibold uppercase">Company</th>
                      <th className="text-left py-3 px-2 text-xs text-gray-400 font-semibold uppercase">Drive Date</th>
                      <th className="text-center py-3 px-2 text-xs text-gray-400 font-semibold uppercase">Eligible</th>
                      <th className="text-center py-3 px-2 text-xs text-gray-400 font-semibold uppercase">Apt. Ready</th>
                      <th className="text-center py-3 px-2 text-xs text-gray-400 font-semibold uppercase">Interview Ready</th>
                      <th className="text-center py-3 px-2 text-xs text-gray-400 font-semibold uppercase">Prediction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drives.filter(d => d.status !== "completed").map((d) => {
                      const eligible = (stats.students || []).filter(s => {
                        if (d.eligibility?.minCGPA && (s.cgpa || 0) < d.eligibility.minCGPA) return false;
                        return true;
                      }).length;
                      const aptReady = (stats.students || []).filter(s => (s.aptitudeBestScore || 0) >= 60).length;
                      const intReady = (stats.students || []).filter(s => (s.interviewAvgScore || 0) >= 65).length;
                      const prediction = stats.totalStudents > 0
                        ? Math.round((Math.min(aptReady, intReady, eligible) / stats.totalStudents) * 100) : 0;

                      return (
                        <tr key={d.driveId} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <CompanyLogo domain={d.companyDomain} name={d.company} size={28} />
                              <div>
                                <p className="font-semibold text-gray-900">{d.company}</p>
                                <p className="text-xs text-gray-400">{d.role} • {d.package || "TBD"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-gray-600">{formatCountdown(d.driveDate)}</td>
                          <td className="py-3 px-2 text-center font-semibold">{eligible}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              aptReady > eligible * 0.6 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            }`}>{aptReady}</span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              intReady > eligible * 0.5 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                            }`}>{intReady}</span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              prediction >= 60 ? "bg-emerald-50 text-emerald-700" : prediction >= 30 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                            }`}>{prediction}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">No active drives. Add one below.</p>
            )
          )}
        </div>

        {/* ══ SECTION D — Skill Gap Heatmap ══ */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("skills")}>
            <h2 className="text-lg font-bold text-gray-900">Skill Gap Heatmap</h2>
            {expandedSections.skills ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
          {expandedSections.skills && (
            heatmap.length > 0 ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                  {heatmap.map((h) => (
                    <div key={h.topic} className={`rounded-xl p-3 text-center border ${
                      h.level === "red" ? "bg-red-50 border-red-200" :
                      h.level === "amber" ? "bg-amber-50 border-amber-200" :
                      "bg-emerald-50 border-emerald-200"
                    }`}>
                      <p className="text-xs font-semibold text-gray-700 truncate mb-1">{h.topic}</p>
                      <p className={`text-2xl font-bold ${
                        h.level === "red" ? "text-red-600" : h.level === "amber" ? "text-amber-600" : "text-emerald-600"
                      }`}>{h.avgAccuracy}%</p>
                      <p className="text-[10px] text-gray-400">{h.studentCount} students</p>
                    </div>
                  ))}
                </div>
                {heatmapInsights.length > 0 && (
                  <div className="space-y-2">
                    {heatmapInsights.map((ins, i) => (
                      <p key={i} className={`text-sm px-3 py-2 rounded-lg ${
                        ins.level === "red" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        ⚠️ {ins.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">No aptitude data available yet.</p>
            )
          )}
        </div>

        {/* ══ SECTION E — Top Performers ══ */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("leaders")}>
            <h2 className="text-lg font-bold text-gray-900">🏆 Top Performers</h2>
            {expandedSections.leaders ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
          {expandedSections.leaders && (
            topPerformers.length > 0 ? (
              <div className="space-y-2">
                {topPerformers.map((s, i) => (
                  <div key={s.uid || i} className={`flex items-center gap-3 p-3 rounded-xl ${i < 3 ? "bg-amber-50/50 border border-amber-100" : "bg-gray-50/50"}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-white" : i === 2 ? "bg-amber-600 text-white" : "bg-gray-200 text-gray-600"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{s.name || "Student"}</p>
                      <p className="text-xs text-gray-400">{s.placementStatus === "placed" ? `Placed at ${s.placedAt}` : s.placementStatus || "Preparing"}</p>
                    </div>
                    <MiniRing value={(s.bridgeScore || 0) / 10} size={36} />
                    <span className="text-sm font-bold text-[#0D9488] min-w-[40px] text-right">{s.bridgeScore || 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">No student data yet.</p>
            )
          )}
        </div>

        {/* ══ SECTION F — At-Risk Students ══ */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("atRisk")}>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900">⚠️ At-Risk Students</h2>
              {atRiskStudents.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{atRiskStudents.length}</span>
              )}
            </div>
            {expandedSections.atRisk ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
          {expandedSections.atRisk && (
            atRiskStudents.length > 0 ? (
              <div>
                <div className="flex justify-end mb-3">
                  <button
                    onClick={() => handleNudge(atRiskStudents.map(s => s.uid))}
                    disabled={!!nudging[atRiskStudents.map(s => s.uid).join(",")]}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" /> Nudge All At-Risk
                  </button>
                </div>
                <div className="space-y-2">
                  {atRiskStudents.map((s) => {
                    const nudgeKey = s.uid;
                    const nearestDrive = drives.find(d => d.status !== "completed");
                    return (
                      <div key={s.uid} className="flex items-center gap-3 p-3 rounded-xl bg-red-50/50 border border-red-100">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm shrink-0">
                          {(s.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{s.name || "Student"}</p>
                          <p className="text-xs text-gray-400">
                            Score: {s.bridgeScore || 0} • Last active: {timeAgo(s.lastActive)}
                            {nearestDrive && ` • ${formatCountdown(nearestDrive.driveDate)} to ${nearestDrive.company}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleNudge([s.uid])}
                          disabled={!!nudging[nudgeKey]}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            nudging[nudgeKey] === "done"
                              ? "bg-green-100 text-green-700"
                              : "bg-white text-red-600 border border-red-200 hover:bg-red-50"
                          } disabled:opacity-60`}
                        >
                          {nudging[nudgeKey] === "done" ? (
                            <><Check className="w-3 h-3" /> Nudged</>
                          ) : nudging[nudgeKey] ? (
                            <><div className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" /> Sending</>
                          ) : (
                            <><Send className="w-3 h-3" /> Nudge</>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-emerald-600 text-sm text-center py-6">🎉 No at-risk students! Your batch is doing well.</p>
            )
          )}
        </div>

        {/* ══ SECTION G — Weekly Report ══ */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => toggleSection("report")}>
            <h2 className="text-lg font-bold text-gray-900">📊 Weekly Progress Report</h2>
            {expandedSections.report ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
          {expandedSections.report && (
            <div>
              {!weeklyReport ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm mb-4">Generate an AI-powered weekly analysis of your batch performance.</p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-200 disabled:opacity-60"
                  >
                    {generatingReport ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Weekly Report</>
                    )}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-end gap-2 mb-4">
                    <button onClick={handleGenerateReport} disabled={generatingReport}
                      className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                      <RefreshCw className="w-3 h-3" /> Regenerate
                    </button>
                    <button onClick={handleDownloadPDF}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#0D9488] text-white rounded-lg text-xs font-semibold hover:opacity-90">
                      <Download className="w-3 h-3" /> Download PDF
                    </button>
                  </div>
                  <div id="weekly-report-content"
                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-xl p-6 border border-gray-200"
                    dangerouslySetInnerHTML={{ __html: weeklyReport.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/#{1,3}\s(.*?)(?:<br>|$)/g, "<h3 class='text-base font-bold text-gray-900 mt-4 mb-2'>$1</h3>") }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ══ SECTION H — Manage Drives ══ */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">🏢 Campus Drives</h2>
            <button
              onClick={() => { resetDriveForm(); setShowDriveForm(true); }}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" /> Add Drive
            </button>
          </div>

          {/* Drive Form Modal */}
          {showDriveForm && (
            <div className="mb-6 border border-[#99F6E4] rounded-xl p-5 bg-[#F0FDFA]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">{editingDrive ? "Edit Drive" : "Add New Drive"}</h3>
                <button onClick={() => { setShowDriveForm(false); resetDriveForm(); }} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Company Name *" value={driveForm.company}
                  onChange={(e) => setDriveForm({ ...driveForm, company: e.target.value })}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                <input type="text" placeholder="Domain (e.g. tcs.com)" value={driveForm.companyDomain}
                  onChange={(e) => setDriveForm({ ...driveForm, companyDomain: e.target.value })}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                <input type="text" placeholder="Role *" value={driveForm.role}
                  onChange={(e) => setDriveForm({ ...driveForm, role: e.target.value })}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                <input type="text" placeholder="Package (e.g. 6.5 LPA)" value={driveForm.package}
                  onChange={(e) => setDriveForm({ ...driveForm, package: e.target.value })}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                <input type="text" placeholder="Location" value={driveForm.location}
                  onChange={(e) => setDriveForm({ ...driveForm, location: e.target.value })}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                <input type="url" placeholder="Superset Link" value={driveForm.superset_link}
                  onChange={(e) => setDriveForm({ ...driveForm, superset_link: e.target.value })}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Drive Date</label>
                  <input type="date" value={driveForm.driveDate}
                    onChange={(e) => setDriveForm({ ...driveForm, driveDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Last Apply Date</label>
                  <input type="date" value={driveForm.lastApplyDate}
                    onChange={(e) => setDriveForm({ ...driveForm, lastApplyDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                </div>
                <input type="number" step="0.1" placeholder="Min CGPA" value={driveForm.minCGPA}
                  onChange={(e) => setDriveForm({ ...driveForm, minCGPA: e.target.value })}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
                <input type="number" placeholder="Min BRIDGE Score" value={driveForm.minBridgeScore}
                  onChange={(e) => setDriveForm({ ...driveForm, minBridgeScore: e.target.value })}
                  className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]" />
              </div>

              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-2">Rounds</label>
                <div className="flex flex-wrap gap-2">
                  {roundOptions.map((r) => (
                    <button key={r} type="button" onClick={() => toggleRound(r)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        driveForm.rounds.includes(r) ? "bg-[#0D9488] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}>{r}</button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => { setShowDriveForm(false); resetDriveForm(); }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 font-semibold hover:bg-gray-50">Cancel</button>
                <button onClick={handleSaveDrive} disabled={savingDrive || !driveForm.company || !driveForm.role}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                  {savingDrive ? "Saving..." : editingDrive ? "Update Drive" : "Add Drive"}
                </button>
              </div>
            </div>
          )}

          {/* Drives List */}
          {drives.length > 0 ? (
            <div className="space-y-2">
              {drives.map((d) => (
                <div key={d.driveId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50 transition-colors">
                  <CompanyLogo domain={d.companyDomain} name={d.company} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{d.company} — {d.role}</p>
                    <p className="text-xs text-gray-400">
                      {d.package || ""} {d.location ? `• ${d.location}` : ""} • {formatCountdown(d.driveDate)} • {d.rounds?.join(", ") || ""}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    d.status === "active" ? "bg-emerald-50 text-emerald-600" :
                    d.status === "completed" ? "bg-gray-100 text-gray-500" :
                    "bg-blue-50 text-blue-600"
                  }`}>{d.status || "upcoming"}</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleEditDrive(d)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteDrive(d.driveId)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No drives yet. Add your first campus drive above.</p>
          )}
        </div>
      </div>
    </TPOShell>
  );
}
