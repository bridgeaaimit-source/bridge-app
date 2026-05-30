"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, Building2, Users, IndianRupee, ArrowUpRight, ArrowDownRight, ExternalLink, RefreshCw, AlertTriangle, Briefcase, Flame } from "lucide-react";
import AppShell from "@/components/AppShell";
import { useSkillPulse } from "@/hooks/useSkillPulse";

const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } };

function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setCount(Math.floor(eased * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.disconnect();
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return { count, ref };
}

function StatCard({ icon: Icon, label, value, suffix = "", prefix = "", color, index, loading }) {
  const numeric = typeof value === "number" ? value : 0;
  const { count, ref } = useCountUp(numeric);
  const display = typeof value === "string" ? value : `${count.toLocaleString()}`;

  return (
    <motion.div
      ref={ref}
      variants={item}
      animate={{ scale: [1, 1.003, 1] }}
      transition={{ duration: 3, repeat: Infinity, delay: index * 0.75, repeatType: "loop" }}
      whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(13,148,136,0.15)", borderColor: "#0D9488" }}
      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] cursor-default"
    >
      {loading ? (
        <div className="space-y-3">
          <div className="skeleton h-8 w-20 rounded-lg" />
          <div className="skeleton h-4 w-28 rounded" />
        </div>
      ) : (
        <>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>
            {prefix}{display}{suffix}
          </div>
          <div className="text-xs text-gray-500 mt-1">{label}</div>
        </>
      )}
    </motion.div>
  );
}

function SkillBar({ skill, index, type }) {
  const isRising = type === "rising";
  const pct = Math.min(Math.abs(skill.demandChange), 100);
  return (
    <motion.div
      variants={item}
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(13,148,136,0.12)" }}
      className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm"
    >
      <span className="text-sm font-bold text-gray-400 w-5 shrink-0">#{skill.rank}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{skill.skill}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${pct}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
              className={`h-full rounded-full ${isRising ? "bg-[#0D9488]" : "bg-red-400"}`}
            />
          </div>
          <span className="text-xs text-gray-400 shrink-0">{skill.jobCount?.toLocaleString()} jobs</span>
        </div>
      </div>
      <motion.span
        initial={{ background: "#f3f4f6", color: "#6b7280" }}
        whileInView={{ background: isRising ? "#CCFBF1" : "#fee2e2", color: isRising ? "#0D9488" : "#dc2626" }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.06 + 0.3 }}
        className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
      >
        {isRising ? "+" : ""}{skill.demandChange}%
      </motion.span>
    </motion.div>
  );
}

const feedTypeConfig = {
  hiring:      { bg: "bg-[#CCFBF1]", text: "text-[#0D9488]", label: "Hiring" },
  trend:       { bg: "bg-blue-50",    text: "text-blue-600",  label: "Trend"  },
  salary:      { bg: "bg-purple-50",  text: "text-purple-600",label: "Salary" },
  opportunity: { bg: "bg-amber-50",   text: "text-amber-600", label: "Opportunity" },
  warning:     { bg: "bg-red-50",     text: "text-red-600",   label: "Warning" },
};

function FeedItem({ item: fi }) {
  const cfg = feedTypeConfig[fi.type] || feedTypeConfig.trend;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex gap-3 items-start">
      <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">{fi.headline}</p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{fi.detail}</p>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs text-gray-400">{fi.timeAgo}</div>
      </div>
    </div>
  );
}

function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full rounded-xl" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}

export default function SkillPulsePage() {
  const { data, loading } = useSkillPulse();

  const feedItems = data?.liveFeed || [];
  const doubled = [...feedItems, ...feedItems];

  return (
    <AppShell>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10"
      >
        {/* Header */}
        <motion.div variants={item} className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>
              SkillPulse
            </h1>
            <span className="flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-bold px-3 py-1 rounded-full border border-red-100">
              <span className="live-dot" />
              LIVE
            </span>
          </div>
          <p className="text-gray-500 text-sm">The live heartbeat of India's job market — updated every Monday by AI</p>
        </motion.div>

        {/* Stat Cards */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Zap}        label="Skills in Demand"    value={data?.stats?.skillsInDemand}  color="bg-[#CCFBF1] text-[#0D9488]"  index={0} loading={loading} />
          <StatCard icon={Building2}  label="Companies Hiring"    value={data?.stats?.companiesHiring} color="bg-blue-50 text-blue-600"      index={1} loading={loading} />
          <StatCard icon={IndianRupee}label="Avg Fresher Package"  value={data?.stats?.avgPackageLPA}   suffix="L"  prefix="₹" color="bg-purple-50 text-purple-600" index={2} loading={loading} />
          <StatCard icon={Flame}      label="Hottest Skill"        value={data?.stats?.hottestSkill}    color="bg-amber-50 text-amber-600"    index={3} loading={loading} />
        </motion.div>

        {/* Main 3-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rising Fast */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#0D9488]" />
              <h2 className="font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Rising Fast</h2>
              <span className="ml-auto text-xs text-gray-400">This week</span>
            </div>
            <div className="p-4 space-y-2">
              {loading ? <SkeletonList count={5} /> : (data?.risingSkills || []).map((s, i) => (
                <SkillBar key={s.skill} skill={s} index={i} type="rising" />
              ))}
            </div>
          </motion.div>

          {/* Live Feed */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <span className="live-dot" />
              <h2 className="font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Live Feed</h2>
              <span className="ml-auto text-xs text-gray-400">Market signals</span>
            </div>
            <div className="relative h-[520px] overflow-hidden">
              {loading ? (
                <div className="p-4 space-y-3">
                  <SkeletonList count={4} />
                </div>
              ) : (
                <div className="feed-scroll p-4 space-y-3 cursor-default">
                  {doubled.map((fi, i) => <FeedItem key={`${fi.headline}-${i}`} item={fi} />)}
                </div>
              )}
            </div>
          </motion.div>

          {/* Cooling Down */}
          <motion.div variants={item} className="bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h2 className="font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Cooling Down</h2>
              <span className="ml-auto text-xs text-gray-400">Avoid these</span>
            </div>
            <div className="p-4 space-y-2">
              {loading ? <SkeletonList count={4} /> : (data?.dyingSkills || []).map((s, i) => (
                <SkillBar key={s.skill} skill={s} index={i} type="dying" />
              ))}
            </div>
            {/* Alternatives callout */}
            {!loading && data?.dyingSkills?.length > 0 && (
              <div className="mx-4 mb-4 p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs text-red-700 font-semibold mb-2">💡 What to learn instead:</p>
                <ul className="space-y-1">
                  {data.dyingSkills.slice(0, 3).map(s => (
                    <li key={s.skill} className="text-xs text-gray-600 flex gap-1">
                      <span className="text-[#0D9488] font-bold shrink-0">→</span>
                      <span>{s.alternative}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>

        {/* Company Radar */}
        {!loading && data?.companySignals?.length > 0 && (
          <motion.div variants={item} className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-[0_4px_20px_rgba(13,148,136,0.06)] overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#0D9488]" />
              <h2 className="font-bold text-gray-900" style={{ fontFamily: "Syne, sans-serif" }}>Company Radar</h2>
              <span className="ml-auto text-xs text-gray-400">Hiring signals this week</span>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.companySignals.map((co, i) => {
                const signalCfg = {
                  hiring_surge: { bg: "bg-[#F0FDFA]", border: "border-[#CCFBF1]", badge: "bg-[#CCFBF1] text-[#0D9488]", label: "Surge" },
                  stable:       { bg: "bg-blue-50",   border: "border-blue-100",   badge: "bg-blue-100 text-blue-600",   label: "Stable" },
                  freeze:       { bg: "bg-red-50",    border: "border-red-100",    badge: "bg-red-100 text-red-600",    label: "Freeze" },
                }[co.signal] || {};
                return (
                  <motion.div
                    key={co.company}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(13,148,136,0.15)" }}
                    className={`p-3 rounded-xl border ${signalCfg.bg} ${signalCfg.border} text-center`}
                  >
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm font-bold text-gray-700 text-sm">
                      {co.company.charAt(0)}
                    </div>
                    <div className="text-xs font-bold text-gray-900">{co.company}</div>
                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${signalCfg.badge}`}>{signalCfg.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{co.openRoles} roles</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Footer note */}
        <motion.p variants={item} className="text-center text-xs text-gray-400 mt-8 pb-4">
          Market data refreshes every Monday at 3AM IST · AI-analyzed from live job postings across India
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
