"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc, getDoc, collection, query, where, getDocs, updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppShell from "@/components/AppShell";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Building2, Calendar, MapPin, DollarSign, ChevronDown, ChevronUp,
  ExternalLink, CheckCircle, XCircle, Clock, Brain, Mic, Users as UsersIcon,
  BarChart2, Sparkles, ChevronRight, Target,
} from "lucide-react";
import {
  calculateDriveReadiness, getReadinessBreakdown, checkEligibility,
  getCompanyLogoUrl, getCompanyFallback, formatCountdown, formatDate,
} from "@/lib/driveUtils";

/* ─── Company Logo ─── */
function CompanyLogo({ domain, name, size = 40 }) {
  const [err, setErr] = useState(false);
  const fb = getCompanyFallback(name);
  const url = getCompanyLogoUrl(domain);

  if (!url || err) {
    return (
      <div className="rounded-xl flex items-center justify-center text-white font-bold shrink-0"
        style={{ width: size, height: size, backgroundColor: fb.color, fontSize: size * 0.4 }}>
        {fb.initial}
      </div>
    );
  }
  return <img src={url} alt={name} className="rounded-xl object-contain bg-white border border-gray-100 shrink-0"
    style={{ width: size, height: size }} onError={() => setErr(true)} />;
}

/* ─── Readiness Ring ─── */
function ReadinessRing({ value, size = 80 }) {
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value, 100);
  const color = pct >= 75 ? "#059669" : pct >= 50 ? "#D97706" : "#DC2626";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct / 100)}
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{Math.round(value)}%</span>
      </div>
    </div>
  );
}

/* ─── Breakdown Bar ─── */
function BreakdownBar({ label, value, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${color.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          <span className="text-xs font-bold text-gray-800">{value}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${color.bar}`}
            style={{ width: `${Math.min(value, 100)}%` }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Feature icon helper ─── */
const featureIcons = {
  aptitude: { icon: Brain, color: "text-purple-600", bg: "bg-purple-50" },
  interview: { icon: Mic, color: "text-blue-600", bg: "bg-blue-50" },
  gd: { icon: UsersIcon, color: "text-green-600", bg: "bg-green-50" },
  pulse: { icon: BarChart2, color: "text-amber-600", bg: "bg-amber-50" },
  "career-intelligence": { icon: Sparkles, color: "text-teal-600", bg: "bg-teal-50" },
};

export default function DrivesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDrive, setExpandedDrive] = useState(null);
  const [prepPlans, setPrepPlans] = useState({});
  const [loadingPlan, setLoadingPlan] = useState({});
  const [completedTasks, setCompletedTasks] = useState({});
  const [previousReadiness, setPreviousReadiness] = useState({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.replace("/login"); return; }
      setUser(u);

      // Load student data
      const userDoc = await getDoc(doc(db, "users", u.uid));
      if (!userDoc.exists()) { setLoading(false); return; }

      const data = userDoc.data();
      setStudentData(data);
      setCompletedTasks(data.prepTasks || {});

      // Fetch drives for student's college
      if (data.collegeId) {
        try {
          const drivesSnap = await getDocs(
            query(
              collection(db, "drives"),
              where("collegeId", "==", data.collegeId),
            )
          );

          const now = new Date();
          const drivesData = [];
          drivesSnap.forEach(d => {
            const drive = { driveId: d.id, ...d.data() };
            // Only show drives with lastApplyDate in the future or no date
            const lastApply = drive.lastApplyDate
              ? new Date(drive.lastApplyDate.seconds ? drive.lastApplyDate.seconds * 1000 : drive.lastApplyDate)
              : null;
            if (!lastApply || lastApply >= now) {
              drivesData.push(drive);
            }
          });

          // Sort by drive date (soonest first)
          drivesData.sort((a, b) => {
            const ad = a.driveDate ? (a.driveDate.seconds || 0) : 0;
            const bd = b.driveDate ? (b.driveDate.seconds || 0) : 0;
            return ad - bd;
          });

          setDrives(drivesData);
        } catch (e) {
          console.error("Fetch drives error:", e);
        }
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleViewPrepPlan = async (drive) => {
    const driveId = drive.driveId;
    if (expandedDrive === driveId) {
      setExpandedDrive(null);
      return;
    }
    setExpandedDrive(driveId);

    if (prepPlans[driveId]) return; // Already loaded

    setLoadingPlan(prev => ({ ...prev, [driveId]: true }));

    try {
      const breakdown = getReadinessBreakdown(studentData, drive);
      const driveDate = drive.driveDate
        ? new Date(drive.driveDate.seconds ? drive.driveDate.seconds * 1000 : drive.driveDate)
        : new Date(Date.now() + 14 * 86400000);
      const daysRemaining = Math.max(1, Math.ceil((driveDate - Date.now()) / 86400000));

      const res = await fetch("/api/drives/prep-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentScores: {
            aptitude: breakdown.aptitude,
            communication: breakdown.communication,
            gd: breakdown.gd,
            bridgeScore: studentData?.bridgeScore || 0,
          },
          company: drive.company,
          driveDate: formatDate(drive.driveDate),
          daysRemaining,
        }),
      });

      const data = await res.json();
      if (data.plan) {
        setPrepPlans(prev => ({ ...prev, [driveId]: data.plan }));
      }
    } catch (e) {
      console.error("Prep plan error:", e);
      toast.error("Failed to generate prep plan");
    }

    setLoadingPlan(prev => ({ ...prev, [driveId]: false }));
  };

  const handleTaskToggle = async (driveId, dayIndex, taskIndex) => {
    const key = `${driveId}_${dayIndex}_${taskIndex}`;
    const drive = drives.find(d => d.driveId === driveId);
    const oldReadiness = calculateDriveReadiness(studentData, drive);

    setPreviousReadiness(prev => ({ ...prev, [driveId]: oldReadiness }));

    const updated = { ...completedTasks };
    if (!updated[driveId]) updated[driveId] = [];

    if (updated[driveId].includes(key)) {
      updated[driveId] = updated[driveId].filter(k => k !== key);
    } else {
      updated[driveId] = [...updated[driveId], key];
    }

    setCompletedTasks(updated);

    // Save to Firestore
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { prepTasks: updated });

        // Check if readiness improved
        const newReadiness = calculateDriveReadiness(studentData, drive);
        if (newReadiness > oldReadiness && updated[driveId]?.includes(key)) {
          toast.success(`🎯 ${drive?.company || "Drive"} Readiness improved from ${oldReadiness}% to ${newReadiness}%! Keep going!`);
        }
      } catch (e) {
        console.error("Task save error:", e);
      }
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-[#0D9488] border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (!studentData?.collegeId) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-[#CCFBF1] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8 text-[#0D9488]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Join Your College First</h2>
          <p className="text-gray-500 text-sm mb-6">
            Ask your TPO for the BRIDGE join link to see campus drives and track your readiness.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-[900px] mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Campus Placements</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Your Drives</h1>
          <p className="text-sm text-gray-500 mt-1">Track your readiness for upcoming campus drives</p>
        </div>

        {/* Drive Cards */}
        {drives.length > 0 ? (
          <div className="space-y-4">
            {drives.map((drive) => {
              const elig = checkEligibility(studentData, drive);
              const readiness = calculateDriveReadiness(studentData, drive);
              const breakdown = getReadinessBreakdown(studentData, drive);
              const plan = prepPlans[drive.driveId];
              const isExpanded = expandedDrive === drive.driveId;
              const driveTasksDone = completedTasks[drive.driveId] || [];
              const totalPlanTasks = plan ? plan.reduce((sum, day) => sum + (day.tasks?.length || 0), 0) : 0;

              return (
                <div key={drive.driveId}
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] overflow-hidden transition-shadow hover:shadow-[0_4px_24px_rgba(13,148,136,0.12)]">

                  {/* Drive Header */}
                  <div className="p-5 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Logo + Info */}
                      <div className="flex items-start gap-3 flex-1">
                        <CompanyLogo domain={drive.companyDomain} name={drive.company} size={48} />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900">{drive.company}</h3>
                          <p className="text-sm text-gray-500">{drive.role} {drive.package ? `• ${drive.package}` : ""}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                            {drive.driveDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {formatCountdown(drive.driveDate)}
                              </span>
                            )}
                            {drive.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {drive.location}
                              </span>
                            )}
                            {drive.rounds?.length > 0 && (
                              <span>{drive.rounds.join(" → ")}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Readiness Ring */}
                      <div className="flex items-center gap-4 md:flex-col md:items-end">
                        <ReadinessRing value={readiness} size={72} />
                        <div className="md:text-right">
                          <p className="text-xs text-gray-400">Your Readiness</p>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility */}
                    <div className="mt-4 flex items-center gap-2">
                      {elig.eligible ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5" /> You qualify ✅
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3.5 h-3.5" /> You don't qualify ❌ ({elig.reasons.join(", ")})
                        </span>
                      )}
                    </div>

                    {/* Readiness Breakdown */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <BreakdownBar label="Aptitude" value={breakdown.aptitude}
                        icon={Brain} color={{ bg: "bg-purple-50", text: "text-purple-600", bar: "bg-purple-500" }} />
                      <BreakdownBar label="Communication" value={breakdown.communication}
                        icon={Mic} color={{ bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" }} />
                      <BreakdownBar label="GD Performance" value={breakdown.gd}
                        icon={UsersIcon} color={{ bg: "bg-green-50", text: "text-green-600", bar: "bg-green-500" }} />
                      <BreakdownBar label="BRIDGE Score" value={breakdown.bridgeScore}
                        icon={Target} color={{ bg: "bg-[#CCFBF1]", text: "text-[#0D9488]", bar: "bg-[#0D9488]" }} />
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewPrepPlan(drive)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                          isExpanded
                            ? "bg-[#0D9488] text-white"
                            : "bg-[#F0FDFA] text-[#0D9488] border border-[#99F6E4] hover:bg-[#CCFBF1]"
                        }`}
                      >
                        <Sparkles className="w-4 h-4" />
                        {isExpanded ? "Hide Prep Plan" : "View Prep Plan"}
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      {drive.superset_link && (
                        <a href={drive.superset_link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                          Apply on Superset <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Prep Plan (Expanded) */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-[#FAFFFE] px-5 md:px-6 py-5">
                      {loadingPlan[drive.driveId] ? (
                        <div className="flex items-center justify-center py-10">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-[#0D9488]/30 border-t-[#0D9488] rounded-full animate-spin" />
                            <p className="text-sm text-gray-500">AI is creating your prep plan...</p>
                          </div>
                        </div>
                      ) : plan ? (
                        <div>
                          {/* Progress bar */}
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-semibold text-gray-700">
                              {driveTasksDone.length}/{totalPlanTasks} prep tasks completed
                            </p>
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0D9488] rounded-full transition-all"
                                style={{ width: `${totalPlanTasks > 0 ? (driveTasksDone.length / totalPlanTasks * 100) : 0}%` }} />
                            </div>
                          </div>

                          {/* Day-by-day timeline */}
                          <div className="space-y-4">
                            {plan.map((day, di) => (
                              <div key={di} className="relative pl-6 border-l-2 border-[#CCFBF1]">
                                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
                                <p className="text-xs font-bold text-[#0D9488] uppercase tracking-wider mb-2">
                                  {day.date || `Day ${day.day}`}
                                </p>
                                <div className="space-y-2">
                                  {(day.tasks || []).map((task, ti) => {
                                    const taskKey = `${drive.driveId}_${di}_${ti}`;
                                    const isDone = driveTasksDone.includes(taskKey);
                                    const feat = featureIcons[task.feature] || featureIcons.aptitude;
                                    const FeatIcon = feat.icon;

                                    return (
                                      <div key={ti} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                        isDone ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-gray-100"
                                      }`}>
                                        <button
                                          onClick={() => handleTaskToggle(drive.driveId, di, ti)}
                                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                            isDone ? "bg-[#0D9488] border-[#0D9488] text-white" : "border-gray-300 hover:border-[#0D9488]"
                                          }`}
                                        >
                                          {isDone && <CheckCircle className="w-3 h-3" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-sm font-semibold ${isDone ? "text-gray-400 line-through" : "text-gray-900"}`}>
                                            {task.title}
                                          </p>
                                          <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                          {task.estimatedMins && (
                                            <span className="flex items-center gap-1 text-[10px] text-gray-400">
                                              <Clock className="w-3 h-3" /> {task.estimatedMins}m
                                            </span>
                                          )}
                                          <Link href={task.link || "/dashboard"}
                                            className={`p-1.5 rounded-lg ${feat.bg} hover:opacity-80 transition-opacity`}>
                                            <FeatIcon className={`w-3.5 h-3.5 ${feat.color}`} />
                                          </Link>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm text-center py-6">Failed to load prep plan. Try again.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Upcoming Drives</h3>
            <p className="text-gray-500 text-sm">Your TPO hasn't added any drives yet. Keep practicing in the meantime!</p>
            <Link href="/smart-interview"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] text-white rounded-xl font-semibold text-sm shadow-lg shadow-teal-200">
              Practice Interview <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
