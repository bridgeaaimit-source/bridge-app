"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search, ArrowUpRight, Bookmark, Newspaper, ArrowRight, CheckCircle, AlertCircle,
  TrendingUp, Sparkles, Lightbulb, MessageSquare, Target, BarChart2, Clock, RefreshCw,
  Zap, Globe, HelpCircle, XCircle, Mic, ShieldCheck,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import toast from "react-hot-toast";

const DEFAULT_CATEGORIES = [
  { id: "All", label: "All" },
  { id: "World", label: "World & Economy" },
  { id: "Tech", label: "Tech & AI" },
  { id: "Finance", label: "Finance" },
  { id: "Marketing", label: "Marketing" },
  { id: "HR", label: "HR & Jobs" },
  { id: "Operations", label: "Operations" },
  { id: "Analytics", label: "Analytics" },
];

const CACHE_PREFIX = "newsPulse_v2_";
const SAVED_KEY = "newsPulse_saved";
const POLL_MS = 6000;
const MAX_POLLS = 30;

function readLocal(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function timeAgo(iso) {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function clockIST(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });
}

function Card({ className = "", children }) {
  return <div className={`bg-white/80 backdrop-blur-md border border-slate-200/70 rounded-3xl shadow-sm ${className}`}>{children}</div>;
}

function SectionTitle({ icon: Icon, children, hint }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-4">
      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "Syne,sans-serif" }}>
        <Icon className="w-5 h-5 text-[#0D9488]" /> {children}
      </h2>
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

function SourceChip({ src }) {
  if (!src) return null;
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={src.title}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0D9488] bg-[#CCFBF1]/70 hover:bg-[#CCFBF1] px-2 py-0.5 rounded-full transition-colors max-w-full"
    >
      <span className="truncate">{src.source}</span>
      {src.publishedAt && <span className="text-teal-600/70 font-medium shrink-0">· {timeAgo(src.publishedAt)}</span>}
      <ArrowUpRight className="w-3 h-3 shrink-0" />
    </a>
  );
}

function Skeleton({ lines = 3, className = "" }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="h-3.5 bg-slate-200/80 rounded" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export default function NewsPulsePage() {
  const [category, setCategory] = useState("All");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [answers, setAnswers] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const pollRef = useRef({ timer: null, count: 0, category: null });
  const categoryRef = useRef("All");

  useEffect(() => {
    setSaved(readLocal(SAVED_KEY) || []);
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setIsAdmin(false); return; }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        setIsAdmin(snap.exists() && snap.data().role === "admin");
      } catch { setIsAdmin(false); }
    });
    return () => unsub();
  }, []);

  const stopPolling = () => {
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    pollRef.current = { timer: null, count: 0, category: null };
  };

  const fetchNews = useCallback(async (cat, { refresh = false, rebuild = false, poll = false } = {}) => {
    const params = new URLSearchParams({ category: cat });
    if (refresh) params.set("refresh", "1");
    if (rebuild) params.set("rebuild", "1");
    if (poll) params.set("poll", "1");
    if (auth.currentUser?.uid) params.set("userId", auth.currentUser.uid);
    const headers = {};
    if (rebuild && auth.currentUser) headers.Authorization = `Bearer ${await auth.currentUser.getIdToken()}`;
    const res = await fetch(`/api/news?${params}`, { headers, cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Could not load news (HTTP ${res.status})`);
    return json;
  }, []);

  const apply = useCallback((cat, json) => {
    if (categoryRef.current !== cat) return;
    setData(json);
    setError(null);
    writeLocal(CACHE_PREFIX + cat, { savedAt: Date.now(), data: json });
  }, []);

  const schedulePoll = useCallback((cat, previousBuiltAt) => {
    if (pollRef.current.timer) clearTimeout(pollRef.current.timer);
    if (pollRef.current.category !== cat) pollRef.current = { timer: null, count: 0, category: cat };
    if (pollRef.current.count >= MAX_POLLS) return;
    pollRef.current.timer = setTimeout(async () => {
      pollRef.current.count += 1;
      try {
        const json = await fetchNews(cat, { poll: true });
        if (categoryRef.current !== cat) return;
        apply(cat, json);
        const builtAt = json.brief?.builtAt || null;
        if (builtAt && builtAt !== previousBuiltAt && previousBuiltAt) {
          toast.success("AI analysis updated with the latest news");
        }
        if (json.briefStatus === "building" || json.briefStatus === "updating") {
          schedulePoll(cat, builtAt || previousBuiltAt);
        } else {
          stopPolling();
        }
      } catch {
        schedulePoll(cat, previousBuiltAt);
      }
    }, POLL_MS);
  }, [fetchNews, apply]);

  const load = useCallback(async (cat, opts = {}) => {
    categoryRef.current = cat;
    stopPolling();
    const cached = readLocal(CACHE_PREFIX + cat);
    if (cached?.data && !opts.refresh && !opts.rebuild) {
      setData(cached.data);
      setLoading(false);
    } else if (!opts.refresh && !opts.rebuild) {
      setData(null);
      setLoading(true);
    }
    try {
      const json = await fetchNews(cat, opts);
      apply(cat, json);
      if (json.briefStatus === "building" || json.briefStatus === "updating") {
        schedulePoll(cat, json.brief?.builtAt || null);
      }
      return json;
    } catch (err) {
      if (categoryRef.current === cat) setError(err.message);
      throw err;
    } finally {
      if (categoryRef.current === cat) setLoading(false);
    }
  }, [fetchNews, apply, schedulePoll]);

  useEffect(() => {
    load("All").catch(() => {});
    return () => stopPolling();
  }, [load]);

  const changeCategory = (cat) => {
    if (cat === category) return;
    setCategory(cat);
    setAnswers({});
    setSearch("");
    load(cat).catch(() => {});
  };

  const refreshHeadlines = async () => {
    setRefreshing(true);
    try {
      await load(category, { refresh: true });
      toast.success("Latest headlines loaded");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const rebuildAnalysis = async () => {
    setRefreshing(true);
    try {
      const json = await load(category, { rebuild: true });
      if (json.briefStatus === "updating" || json.briefStatus === "building") {
        toast.success("Rebuilding the AI analysis — about a minute");
      } else {
        toast("Analysis was rebuilt in the last 10 minutes", { icon: "ℹ️" });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSave = (article) => {
    setSaved((prev) => {
      const next = prev.some((a) => a.url === article.url)
        ? prev.filter((a) => a.url !== article.url)
        : [{ title: article.title, url: article.url, source: article.source, publishedAt: article.publishedAt }, ...prev].slice(0, 50);
      writeLocal(SAVED_KEY, next);
      return next;
    });
  };

  const brief = data?.brief || null;
  const status = data?.briefStatus || (loading ? "building" : "unavailable");
  const articles = useMemo(() => data?.articles || [], [data]);
  const categories = data?.categories?.length ? data.categories : DEFAULT_CATEGORIES;

  const sourceFor = useCallback((id) => {
    if (!id) return null;
    return brief?.sources?.[id] || articles.find((a) => a.id === id) || null;
  }, [brief, articles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => `${a.title} ${a.summary} ${a.source}`.toLowerCase().includes(q));
  }, [articles, search]);

  const gd = brief?.gd;
  const practiceHref = gd ? `/gd/ai/setup?category=current_affairs&topic=${encodeURIComponent(gd.topic)}` : "/gd/ai/setup";
  const analysisPending = !brief && (status === "building" || loading);
  const score = brief?.quiz?.length ? brief.quiz.filter((q, i) => answers[i] === q.answer).length : 0;
  const answeredAll = brief?.quiz?.length && Object.keys(answers).length === brief.quiz.length;

  return (
    <AppShell>
      <div className="min-h-screen">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 pt-8 pb-16 space-y-8">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-4">
              <div className="w-[76px] h-[76px] shrink-0 select-none hidden sm:block">
                <img src="/images/3d-icons/newspaper-clipping.png" alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: "Syne,sans-serif" }}>News Pulse</h1>
                  <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Live headlines
                  </span>
                </div>
                <p className="text-slate-500 text-sm mt-1">
                  What happened, why it matters for your placements, and what to say about it in a GD or interview.
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  From Economic Times, Mint, BusinessLine and The Hindu
                  {data?.fetchedAt && <> · headlines checked {clockIST(data.fetchedAt)}</>}
                  {brief?.builtAt && <> · AI analysis from {clockIST(brief.builtAt)} ({timeAgo(brief.builtAt)})</>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={refreshHeadlines}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:border-[#0D9488] hover:text-[#0D9488] text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh headlines
              </button>
              {isAdmin && (
                <button
                  onClick={rebuildAnalysis}
                  disabled={refreshing}
                  title="Admin only — uses AI tokens"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white rounded-xl hover:bg-[#0F766E] text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" /> Rebuild analysis
                </button>
              )}
            </div>
          </div>

          {/* ── Categories ── */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mt-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => changeCategory(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                  category === c.id
                    ? "bg-[#0D9488] text-white border-[#0D9488] shadow-sm"
                    : "bg-white text-slate-500 border-slate-200 hover:border-[#0D9488] hover:text-[#0D9488]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {error && !data && (
            <Card className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <p className="text-slate-700 font-medium">{error}</p>
              <button onClick={() => load(category).catch(() => {})} className="mt-4 text-sm font-semibold text-[#0D9488]">Try again</button>
            </Card>
          )}

          {analysisPending && articles.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-teal-50 border border-teal-100 text-sm text-teal-800">
              <div className="w-4 h-4 border-2 border-teal-300 border-t-teal-700 rounded-full animate-spin shrink-0" />
              Reading today&apos;s news and preparing your brief. This takes about a minute. The latest headlines are already below.
            </div>
          )}
          {status === "unavailable" && !loading && articles.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              The AI analysis isn&apos;t ready for this section yet. The latest headlines are below. Please check back later.
            </div>
          )}

          {/* ── In 60 seconds + Quiz ── */}
          {(analysisPending || brief?.in60?.length > 0 || brief?.quiz?.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="p-6 lg:col-span-2">
                <SectionTitle icon={Zap} hint={brief?.builtAt ? `as of ${clockIST(brief.builtAt)}` : null}>Today in 60 seconds</SectionTitle>
                {analysisPending ? <Skeleton lines={5} /> : (
                  <ol className="space-y-3">
                    {(brief?.in60 || []).map((item, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="mt-0.5 w-6 h-6 rounded-full bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800 leading-relaxed">{item.text}</p>
                          <div className="mt-1"><SourceChip src={sourceFor(item.id)} /></div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Card>

              <Card className="p-6">
                <SectionTitle icon={HelpCircle}>Test yourself</SectionTitle>
                {analysisPending ? <Skeleton lines={6} /> : brief?.quiz?.length ? (
                  <div className="space-y-5">
                    {brief.quiz.map((q, qi) => {
                      const picked = answers[qi];
                      return (
                        <div key={qi}>
                          <p className="text-sm font-semibold text-slate-800 mb-2">{qi + 1}. {q.question}</p>
                          <div className="space-y-1.5">
                            {q.options.map((opt, oi) => {
                              const done = picked !== undefined;
                              const correct = oi === q.answer;
                              const style = !done
                                ? "border-slate-200 hover:border-[#0D9488] text-slate-700"
                                : correct
                                  ? "border-green-300 bg-green-50 text-green-800"
                                  : picked === oi ? "border-red-300 bg-red-50 text-red-700" : "border-slate-100 text-slate-400";
                              return (
                                <button
                                  key={oi}
                                  disabled={done}
                                  onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                                  className={`w-full text-left text-xs px-3 py-2 rounded-xl border transition-colors flex items-center gap-2 ${style}`}
                                >
                                  {done && correct && <CheckCircle className="w-3.5 h-3.5 shrink-0" />}
                                  {done && !correct && picked === oi && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {picked !== undefined && (
                            <div className="mt-2 text-xs text-slate-500 leading-relaxed">
                              {q.explanation} <SourceChip src={sourceFor(q.id)} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {answeredAll && (
                      <div className="text-sm font-bold text-[#0D9488] bg-teal-50 rounded-xl px-3 py-2 text-center">
                        You got {score} of {brief.quiz.length}{score === brief.quiz.length ? " — you're up to date!" : " — read the stories below to catch up."}
                      </div>
                    )}
                  </div>
                ) : <p className="text-sm text-slate-400">No quiz for this section yet.</p>}
              </Card>
            </div>
          )}

          {/* ── Big themes ── */}
          {(analysisPending || brief?.themes?.length > 0) && (
            <div>
              <SectionTitle icon={Globe} hint="the debates a panel can raise">Big stories you must understand</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analysisPending
                  ? [...Array(3)].map((_, i) => <Card key={i} className="p-5"><Skeleton lines={6} /></Card>)
                  : brief.themes.map((t, i) => (
                    <Card key={i} className="p-5 flex flex-col">
                      <h3 className="font-bold text-slate-900 leading-snug mb-2">{t.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{t.whatIsGoingOn}</p>
                      {t.indiaAngle && (
                        <p className="text-sm text-slate-700 mt-3"><span className="font-semibold text-[#0D9488]">For India: </span>{t.indiaAngle}</p>
                      )}
                      {(t.oneSide || t.otherSide) && (
                        <div className="mt-3 space-y-2">
                          {t.oneSide && <div className="text-xs rounded-xl bg-green-50 border border-green-100 text-green-900 px-3 py-2"><span className="font-bold">One view: </span>{t.oneSide}</div>}
                          {t.otherSide && <div className="text-xs rounded-xl bg-rose-50 border border-rose-100 text-rose-900 px-3 py-2"><span className="font-bold">The other view: </span>{t.otherSide}</div>}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
                        {t.ids.slice(0, 3).map((id) => <SourceChip key={id} src={sourceFor(id)} />)}
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* ── GD topic from the news ── */}
          {(analysisPending || gd) && (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-[#00C4A7] to-[#0891B2] px-6 py-5">
                {analysisPending ? <Skeleton lines={2} /> : (
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-teal-50 uppercase tracking-widest">GD topic from today&apos;s news</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">{gd.difficulty}</span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">{gd.topic}</h2>
                      {gd.whyNow && (
                        <p className="text-teal-50 text-sm mt-2 flex items-start gap-1.5"><TrendingUp className="w-4 h-4 mt-0.5 shrink-0" />{gd.whyNow}</p>
                      )}
                    </div>
                    <Link
                      href={practiceHref}
                      className="shrink-0 bg-white text-[#0D9488] font-bold px-5 py-3 rounded-xl hover:bg-teal-50 transition-colors flex items-center gap-2 shadow-md"
                    >
                      <Mic className="w-4 h-4" /> Practise this GD
                    </Link>
                  </div>
                )}
              </div>
              {!analysisPending && (
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50/60 rounded-2xl p-4 border border-green-100">
                      <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Points for</h3>
                      <ul className="space-y-2">
                        {gd.pointsFor.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-green-900">
                            <span className="mt-0.5 w-5 h-5 rounded-full bg-green-200 text-green-800 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100">
                      <h3 className="text-sm font-bold text-rose-800 mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Points against</h3>
                      <ul className="space-y-2">
                        {gd.pointsAgainst.map((p, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-rose-900">
                            <span className="mt-0.5 w-5 h-5 rounded-full bg-rose-200 text-rose-800 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gd.facts.length > 0 && (
                      <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
                        <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2"><BarChart2 className="w-4 h-4" /> Facts from the news (quote these)</h3>
                        <ul className="space-y-2.5">
                          {gd.facts.map((f, i) => (
                            <li key={i} className="text-sm text-blue-900">
                              <span className="text-blue-400 mr-1">•</span>{f.fact}
                              <div className="mt-1 ml-3"><SourceChip src={sourceFor(f.id)} /></div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="space-y-4">
                      {gd.openingLine && (
                        <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100">
                          <h3 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2"><Target className="w-4 h-4" /> How to open</h3>
                          <p className="text-sm text-purple-900 italic leading-relaxed">&ldquo;{gd.openingLine}&rdquo;</p>
                        </div>
                      )}
                      {gd.closingLine && (
                        <div className="bg-teal-50/60 rounded-2xl p-4 border border-teal-100">
                          <h3 className="text-sm font-bold text-teal-800 mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> How to summarise</h3>
                          <p className="text-sm text-teal-900 italic leading-relaxed">&ldquo;{gd.closingLine}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gd.powerPhrase && (
                      <div className="bg-yellow-50/60 rounded-2xl p-4 border border-yellow-100 flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-yellow-800 mb-1">Power phrase</div>
                          <p className="text-sm text-yellow-900 font-medium italic">&ldquo;{gd.powerPhrase}&rdquo;</p>
                        </div>
                      </div>
                    )}
                    {gd.interviewConnection && (
                      <div className="bg-orange-50/60 rounded-2xl p-4 border border-orange-100 flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-orange-800 mb-1">In your interview</div>
                          <p className="text-sm text-orange-900">{gd.interviewConnection}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {gd.ids.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs text-slate-400 mr-1">Read the news behind this topic:</span>
                      {gd.ids.slice(0, 4).map((id) => <SourceChip key={id} src={sourceFor(id)} />)}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* ── Top stories with analysis ── */}
          {(analysisPending || brief?.stories?.length > 0) && (
            <div>
              <SectionTitle icon={Sparkles} hint="picked and explained for placements">Top stories for your placements</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysisPending
                  ? [...Array(4)].map((_, i) => <Card key={i} className="p-5"><Skeleton lines={5} /></Card>)
                  : brief.stories.map((s) => {
                    const src = sourceFor(s.id);
                    const isSaved = saved.some((a) => a.url === src?.url);
                    return (
                      <Card key={s.id} className="p-5 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {s.sector && <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{s.sector}</span>}
                          {s.gdWorthy && <span className="text-[11px] font-bold uppercase tracking-wide text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">GD-worthy</span>}
                          <span className="ml-auto" />
                          {src && (
                            <button onClick={() => toggleSave(src)} title={isSaved ? "Remove from saved" : "Save"} className="p-1 text-slate-400 hover:text-yellow-500">
                              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-yellow-400 text-yellow-500" : ""}`} />
                            </button>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 leading-snug" style={{ fontFamily: "Syne,sans-serif" }}>{s.headline}</h3>
                        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{s.whatHappened}</p>
                        {s.whyItMatters && (
                          <div className="mt-3 text-sm bg-teal-50/70 border border-teal-100 rounded-xl px-3 py-2 text-teal-900">
                            <span className="font-bold">Why it matters for you: </span>{s.whyItMatters}
                          </div>
                        )}
                        {s.interviewQuestion && (
                          <div className="mt-2 text-sm text-slate-700">
                            <span className="font-semibold text-orange-700">Could be asked: </span>&ldquo;{s.interviewQuestion}&rdquo;
                          </div>
                        )}
                        {s.talkingPoint && (
                          <div className="mt-1.5 text-sm text-slate-700">
                            <span className="font-semibold text-purple-700">You could say: </span>{s.talkingPoint}
                          </div>
                        )}
                        <div className="mt-auto pt-3"><SourceChip src={src} /></div>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {brief?.tip?.text && (
            <Card className="p-5 flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Interview tip from today&apos;s news</div>
                <p className="text-sm text-slate-800">{brief.tip.text}</p>
                <div className="mt-1.5"><SourceChip src={sourceFor(brief.tip.id)} /></div>
              </div>
            </Card>
          )}

          {/* ── All latest headlines ── */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-4">
              <SectionTitle icon={Newspaper} hint={articles.length ? `${articles.length} stories · last 72 hours` : null}>
                {showSaved ? "Saved stories" : "All latest headlines"}
              </SectionTitle>
              <div className="flex items-center gap-2 -mt-3 sm:mt-0 sm:mb-4">
                <button
                  onClick={() => setShowSaved((v) => !v)}
                  className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-colors flex items-center gap-1.5 ${showSaved ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-white border-slate-200 text-slate-600"}`}
                >
                  <Bookmark className="w-3.5 h-3.5" /> Saved ({saved.length})
                </button>
                {!showSaved && (
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search headlines, e.g. RBI, AI, Tata"
                      className="w-full bg-white border border-slate-200 focus:border-[#0D9488] rounded-xl pl-9 pr-3 py-2 text-sm outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            </div>

            {loading && !articles.length ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <Card key={i} className="p-4"><Skeleton lines={2} /></Card>)}</div>
            ) : (showSaved ? saved : filtered).length === 0 ? (
              <Card className="p-10 text-center">
                <Newspaper className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">{showSaved ? "No saved stories yet" : search ? "No headlines match your search" : "No headlines right now"}</p>
                <p className="text-slate-400 text-sm mt-1">{showSaved ? "Tap the bookmark on a story to keep it here." : search ? "Try another word." : "Tap Refresh headlines in a few minutes."}</p>
              </Card>
            ) : (
              <Card className="divide-y divide-slate-100">
                {(showSaved ? saved : filtered.slice(0, 60)).map((a) => {
                  const isSaved = saved.some((s) => s.url === a.url);
                  return (
                    <div key={a.url} className="flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50/60 transition-colors">
                      {a.image ? (
                        <img src={a.image} alt="" loading="lazy" className="w-16 h-16 rounded-xl object-cover shrink-0 hidden sm:block bg-slate-100" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : null}
                      <div className="flex-1 min-w-0">
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-900 hover:text-[#0D9488] leading-snug line-clamp-2">
                          {a.title}
                        </a>
                        {a.summary && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.summary}</p>}
                        <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                          <span className="font-semibold text-slate-500">{a.source}</span>
                          {a.publishedAt && <><Clock className="w-3 h-3" /> {timeAgo(a.publishedAt)}</>}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <button onClick={() => toggleSave(a)} title={isSaved ? "Remove from saved" : "Save"} className="p-1.5 text-slate-400 hover:text-yellow-500 rounded-lg hover:bg-yellow-50">
                          <Bookmark className={`w-4 h-4 ${isSaved ? "fill-yellow-400 text-yellow-500" : ""}`} />
                        </button>
                        <a href={a.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-[#0D9488]" title="Read on the publisher's site">
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 text-sm bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4">
            <span className="text-slate-600">Ready to use this? Practise speaking on today&apos;s news with the AI panel.</span>
            <Link href={practiceHref} className="font-semibold text-[#0D9488] flex items-center gap-1.5">Start GD practice <ArrowRight className="w-4 h-4" /></Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
