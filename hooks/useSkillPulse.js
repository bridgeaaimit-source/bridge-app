"use client";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const MOCK_DATA = {
  weekOf: "2026-05-12",
  stats: {
    skillsInDemand: 2847,
    companiesHiring: 1204,
    avgPackageLPA: 8.4,
    hottestSkill: "Gen AI",
    hottestSkillChange: 289,
  },
  risingSkills: [
    { rank: 1, skill: "Gen AI / Prompt Engineering", demandChange: 289, jobCount: 4832, category: "AI/ML", whyRising: "Generative AI tools now required in 60% of tech roles" },
    { rank: 2, skill: "Cybersecurity", demandChange: 156, jobCount: 2341, category: "Security", whyRising: "India cybercrime up 3x — every company hiring" },
    { rank: 3, skill: "React + Next.js", demandChange: 89, jobCount: 8923, category: "Frontend", whyRising: "Startup and MNC frontend stacks converging on Next.js" },
    { rank: 4, skill: "AWS Cloud", demandChange: 67, jobCount: 6234, category: "Cloud", whyRising: "AWS certification adds ₹2-3L to package instantly" },
    { rank: 5, skill: "Data Analytics", demandChange: 54, jobCount: 5123, category: "Data", whyRising: "Business analytics roles exploding in non-tech companies" },
    { rank: 6, skill: "Docker + Kubernetes", demandChange: 43, jobCount: 3421, category: "DevOps", whyRising: "Container skills now baseline expectation for SDE roles" },
    { rank: 7, skill: "TypeScript", demandChange: 38, jobCount: 7823, category: "Frontend", whyRising: "Replacing plain JS in all serious codebases" },
    { rank: 8, skill: "System Design", demandChange: 31, jobCount: 4231, category: "Architecture", whyRising: "SDE-2 and above mandatorily tested on system design" },
  ],
  dyingSkills: [
    { rank: 1, skill: "Manual Testing", demandChange: -67, jobCount: 432, warning: "AI test automation replacing manual QA at 3x speed", alternative: "Selenium + Playwright automation" },
    { rank: 2, skill: "Basic HTML/CSS only", demandChange: -43, jobCount: 821, warning: "Standalone HTML/CSS no longer a hireable skill", alternative: "React, Tailwind, Next.js" },
    { rank: 3, skill: "Legacy PHP", demandChange: -38, jobCount: 234, warning: "PHP codebases being migrated to Node/Python", alternative: "Node.js, Python FastAPI" },
    { rank: 4, skill: "Network Admin", demandChange: -34, jobCount: 341, warning: "Cloud networking replacing traditional network admin", alternative: "AWS Networking, DevOps" },
    { rank: 5, skill: "Basic Java Dev", demandChange: -28, jobCount: 923, warning: "Java alone without Spring Boot/microservices is weak", alternative: "Java + Spring Boot + Microservices" },
  ],
  liveFeed: [
    { type: "hiring", headline: "Amazon posted 234 SDE-1 roles in Bengaluru", detail: "Required: DSA + System Design + AWS basics. Hiring surge for Q3 2026.", timeAgo: "2h ago", actionLabel: "See roles" },
    { type: "trend", headline: "Gen AI skills now in 60% of tech JDs", detail: "Prompt engineering, LangChain, and RAG pipelines are the new SQL.", timeAgo: "4h ago", actionLabel: "Learn now" },
    { type: "salary", headline: "Average SDE-1 package hits ₹12.4L in Bengaluru", detail: "Up 18% YoY. Companies competing hard for quality freshers.", timeAgo: "6h ago", actionLabel: "See data" },
    { type: "opportunity", headline: "Flipkart opening 180 internship roles this month", detail: "React + Python interns getting ₹50k/month stipend.", timeAgo: "8h ago", actionLabel: "Apply now" },
    { type: "warning", headline: "Manual testing roles down 67% in last 6 months", detail: "AI test tools replacing QA at unprecedented speed. Upskill now.", timeAgo: "1d ago", actionLabel: "What to do" },
    { type: "trend", headline: "Cybersecurity demand up 156% — nobody's ready", detail: "Only 8% of CS grads have security skills. Massive gap = opportunity.", timeAgo: "1d ago", actionLabel: "Get started" },
    { type: "hiring", headline: "Google Hyderabad expanding ML infra team", detail: "PyTorch, distributed systems, and ML pipelines. 5+ roles open.", timeAgo: "2d ago", actionLabel: "See roles" },
    { type: "salary", headline: "₹8.4L average for freshers — up from ₹6.2L in 2024", detail: "Skills-based hiring shifting power to well-prepared students.", timeAgo: "3d ago", actionLabel: "See full data" },
  ],
  companySignals: [
    { company: "Amazon", signal: "hiring_surge", topSkills: ["DSA", "AWS", "System Design"], openRoles: 234 },
    { company: "Google", signal: "hiring_surge", topSkills: ["ML", "Python", "Distributed Systems"], openRoles: 89 },
    { company: "Flipkart", signal: "hiring_surge", topSkills: ["React", "Python", "Data"], openRoles: 180 },
    { company: "Infosys", signal: "stable", topSkills: ["Java", "SQL", "Angular"], openRoles: 1200 },
    { company: "TCS", signal: "stable", topSkills: ["Java", "SQL", "Testing"], openRoles: 2400 },
    { company: "Wipro", signal: "freeze", topSkills: ["Java", "SAP", "Testing"], openRoles: 120 },
  ],
};

export function useSkillPulse() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isBypass = process.env.NEXT_PUBLIC_BYPASS_AUTH === "true";

  useEffect(() => {
    if (isBypass) {
      setTimeout(() => { setData(MOCK_DATA); setLoading(false); }, 800);
      return;
    }
    const cached = typeof window !== "undefined" && localStorage.getItem("skillpulse_data");
    if (cached) {
      try {
        const { data: d, timestamp } = JSON.parse(cached);
        if ((Date.now() - timestamp) / 3600000 < 24) {
          setData(d); setLoading(false); return;
        }
      } catch (_) {}
    }
    async function fetch_() {
      try {
        const snap = await getDoc(doc(db, "skillpulse_weekly", "latest"));
        const fresh = snap.exists() ? snap.data() : MOCK_DATA;
        setData(fresh);
        typeof window !== "undefined" && localStorage.setItem("skillpulse_data", JSON.stringify({ data: fresh, timestamp: Date.now() }));
      } catch (_) { setData(MOCK_DATA); }
      finally { setLoading(false); }
    }
    fetch_();
  }, []);

  return { data, loading };
}
