"use client";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MOCK_GPS = {
  marketFitScore: 6.8,
  scoreBreakdown: { skills: 58, degree: 72, location: 45, salary: 81 },
  skillGaps: [
    { skill: "System Design", userLevel: 30, required: 75, priority: "high" },
    { skill: "Docker + K8s", userLevel: 10, required: 60, priority: "high" },
    { skill: "AWS Cloud", userLevel: 25, required: 65, priority: "medium" },
    { skill: "TypeScript", userLevel: 40, required: 70, priority: "medium" },
    { skill: "DSA", userLevel: 65, required: 80, priority: "low" },
  ],
  timeline: [
    { id: "t1", title: "Joined BridgeAI", status: "done", date: "Jan 2026" },
    { id: "t2", title: "Completed Profile", status: "done", date: "Jan 2026" },
    { id: "t3", title: "Learn DSA Fundamentals", status: "active", progress: 60, date: "In Progress", courseUrl: "https://www.neetcode.io" },
    { id: "t4", title: "AWS Cloud Practitioner", status: "upcoming", date: "Up Next", courseUrl: "https://aws.amazon.com/training" },
    { id: "t5", title: "Apply to Internships", status: "upcoming", date: "May 2026" },
  ],
  stageData: {
    "10th": {
      title: "Choose Your Stream",
      subtitle: "Based on market demand for 2030 when you'll graduate",
      streams: [
        { name: "Science (PCM)", avgSalary: "₹12.4L", demandScore: 92, careers: ["SDE", "Data Scientist", "ML Engineer"], trend: "↑ High demand" },
        { name: "Science (PCB)", avgSalary: "₹8.2L", demandScore: 74, careers: ["Biotech", "Healthcare AI", "Research"], trend: "↑ Growing" },
        { name: "Commerce", avgSalary: "₹9.1L", demandScore: 78, careers: ["FinTech", "Business Analytics", "CA"], trend: "↑ Stable" },
        { name: "Arts/Humanities", avgSalary: "₹6.8L", demandScore: 62, careers: ["UX Design", "Content AI", "Law"], trend: "→ Niche" },
      ],
    },
    "12th": {
      title: "Pick Your Degree",
      subtitle: "ROI-ranked by placement salary vs tuition fees",
      degrees: [
        { name: "B.Tech CSE", roi: "9.2x", avgSalary: "₹8.4L", fees: "₹6-12L total", topColleges: ["IITs", "NITs", "VIT", "BITS"] },
        { name: "B.Tech CS + AI/ML", roi: "11.4x", avgSalary: "₹11.2L", fees: "₹8-14L total", topColleges: ["IITs", "IIIT Hyderabad", "DTU"] },
        { name: "BCA + MCA", roi: "7.8x", avgSalary: "₹5.8L", fees: "₹2-4L total", topColleges: ["IP University", "Symbiosis"] },
        { name: "B.Sc CS", roi: "6.2x", avgSalary: "₹4.9L", fees: "₹1-3L total", topColleges: ["St. Xavier's", "Christ", "Loyola"] },
      ],
    },
    "graduation": { title: "Build Market Fit", subtitle: "Your personal Market Fit Score + skill roadmap" },
    "postgrad": {
      title: "MBA vs MS vs Job",
      subtitle: "ROI calculator based on your profile",
      paths: [
        { name: "Job Now", roi: "Immediate", earningAt3yr: "₹15-22L", risk: "Low", bestFor: "Strong DSA + projects" },
        { name: "MBA (IIM)", roi: "2yr break", earningAt3yr: "₹28-45L", risk: "High cost", bestFor: "Leadership + business roles" },
        { name: "MS Abroad", roi: "2yr + visa", earningAt3yr: "₹40-80L", risk: "Immigration risk", bestFor: "Research + SDE-3 fast track" },
        { name: "MS India (IIT)", roi: "2yr", earningAt3yr: "₹18-30L", risk: "Low", bestFor: "Deep tech + research" },
      ],
    },
  },
  recommendations: [
    { title: "Master System Design", reason: "Highest gap in your profile — 847 jobs require it this week", url: "/smart-interview", urgent: true },
    { title: "Get AWS Cloud Practitioner", reason: "₹2-3L salary boost + 6,234 open roles this week", url: "/jobs", urgent: true },
    { title: "Add a Gen AI project", reason: "60% of new JDs require AI exposure — zero cost to start", url: "/pulse", urgent: false },
  ],
};

export function useCareerGPS(userId) {
  const [gpsData, setGpsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isBypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  useEffect(() => {
    if (!userId && !isBypass) { setLoading(false); return; }
    if (isBypass) {
      setTimeout(() => { setGpsData(MOCK_GPS); setLoading(false); }, 600);
      return;
    }
    async function load() {
      try {
        const snap = await getDoc(doc(db, "user_insights", userId));
        if (snap.exists()) {
          const saved = snap.data();
          setGpsData({ ...MOCK_GPS, ...saved, stageData: MOCK_GPS.stageData });
        } else {
          await setDoc(doc(db, "user_insights", userId), {
            marketFitScore: MOCK_GPS.marketFitScore,
            scoreBreakdown: MOCK_GPS.scoreBreakdown,
            skillGaps: MOCK_GPS.skillGaps,
            timeline: MOCK_GPS.timeline,
            lastUpdated: new Date().toISOString(),
          });
          setGpsData(MOCK_GPS);
        }
      } catch (_) { setGpsData(MOCK_GPS); }
      finally { setLoading(false); }
    }
    load();
  }, [userId]);

  return { gpsData, loading };
}
