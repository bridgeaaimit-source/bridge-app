"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { BookOpen, CheckCircle, ChevronLeft, Lightbulb, MessageSquare, Target, AlertCircle, Sparkles } from "lucide-react";
import AppShell from "@/components/AppShell";
import { auth, db } from "@/lib/firebase";
import { TRACKS, getTrack } from "@/lib/trainingContent";

const LOCAL_KEY = "bridge_training_progress";

function readLocalProgress() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalProgress(progress) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(progress));
  } catch {
    // storage unavailable — progress still lives in Firestore when signed in
  }
}

function TrainingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [uid, setUid] = useState(null);
  const [progress, setProgress] = useState({}); // { lessonId: { score, total, completedAt } }
  const [trackId, setTrackId] = useState(searchParams.get("track") || null);
  const [lessonId, setLessonId] = useState(searchParams.get("lesson") || null);
  const [answers, setAnswers] = useState({});
  const recommendedReason = searchParams.get("reason");

  useEffect(() => {
    setProgress(readLocalProgress());
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "users", user.uid, "training_progress", "main"));
        if (snap.exists()) {
          const remote = snap.data().lessons || {};
          setProgress((prev) => ({ ...prev, ...remote }));
        }
      } catch (err) {
        console.error("Could not load training progress:", err.message);
      }
    });
    return () => unsubscribe();
  }, []);

  const track = trackId ? getTrack(trackId) : null;
  const lesson = track && lessonId ? track.lessons.find((l) => l.id === lessonId) : null;

  useEffect(() => {
    setAnswers({});
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [lessonId]);

  const openLesson = (tId, lId) => {
    setTrackId(tId);
    setLessonId(lId);
    router.replace(`/training?track=${tId}&lesson=${lId}`, { scroll: false });
  };

  const openTrack = (tId) => {
    setTrackId(tId);
    setLessonId(null);
    router.replace(`/training?track=${tId}`, { scroll: false });
  };

  const backToTracks = () => {
    setTrackId(null);
    setLessonId(null);
    router.replace("/training", { scroll: false });
  };

  const quizDone = lesson ? lesson.quiz.every((_, i) => answers[i] !== undefined) : false;
  const quizScore = lesson ? lesson.quiz.filter((q, i) => answers[i] === q.answer).length : 0;

  useEffect(() => {
    if (!lesson || !quizDone) return;
    const entry = { score: quizScore, total: lesson.quiz.length, completedAt: new Date().toISOString() };
    setProgress((prev) => {
      const next = { ...prev, [lesson.id]: entry };
      writeLocalProgress(next);
      return next;
    });
    if (uid) {
      setDoc(doc(db, "users", uid, "training_progress", "main"), { lessons: { [lesson.id]: entry }, updatedAt: new Date().toISOString() }, { merge: true })
        .catch((err) => console.error("Could not save training progress:", err.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizDone]);

  const trackStats = useMemo(
    () =>
      Object.fromEntries(
        TRACKS.map((t) => [t.id, t.lessons.filter((l) => progress[l.id]).length])
      ),
    [progress]
  );

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Domain Training</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1] px-2 py-0.5 rounded-full">Beta</span>
          </div>
          <p className="text-gray-600">Learn what interviewers expect, with real Indian examples. Then prove it in a mock interview.</p>
        </div>

        {recommendedReason && (
          <div className="mb-6 p-4 rounded-2xl bg-[#F0FDFA] border border-[#CCFBF1] flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#0D9488] mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[#0F766E]">Recommended from your last mock interview</p>
              <p className="text-sm text-gray-700">{recommendedReason}</p>
            </div>
          </div>
        )}

        {/* Track list */}
        {!track && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openTrack(t.id)}
                className="text-left bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:border-[#0D9488] hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] flex items-center justify-center text-[#0D9488] mb-4">
                  {t.id === "answer-skills" ? <MessageSquare className="w-5 h-5" /> : t.id === "hr" ? <BookOpen className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                </div>
                <h2 className="font-bold text-gray-900 mb-1">{t.title}</h2>
                <p className="text-sm text-gray-600 mb-4">{t.tagline}</p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                  <div className="bg-[#0D9488] h-1.5 rounded-full" style={{ width: `${(trackStats[t.id] / t.lessons.length) * 100}%` }} />
                </div>
                <p className="text-xs text-gray-500">{trackStats[t.id]} of {t.lessons.length} lessons done</p>
              </button>
            ))}
          </div>
        )}

        {/* Lesson list for a track */}
        {track && !lesson && (
          <div>
            <button type="button" onClick={backToTracks} className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#0D9488] mb-4">
              <ChevronLeft className="w-4 h-4" /> All tracks
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{track.title}</h2>
            <p className="text-gray-600 mb-6">{track.tagline}</p>
            <div className="space-y-3">
              {track.lessons.map((l, i) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => openLesson(track.id, l.id)}
                  className="w-full text-left bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-[#0D9488] transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-[#F0FDFA] text-[#0D9488] text-sm font-bold flex items-center justify-center">{i + 1}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{l.title}</p>
                      <p className="text-xs text-gray-500">{l.minutes} min · {l.quiz.length}-question check</p>
                    </div>
                  </div>
                  {progress[l.id] ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#0D9488]">
                      <CheckCircle className="w-4 h-4" /> {progress[l.id].score}/{progress[l.id].total}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Not started</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lesson */}
        {lesson && (
          <article className="space-y-6">
            <button type="button" onClick={() => openTrack(track.id)} className="flex items-center gap-1 text-sm text-gray-600 hover:text-[#0D9488]">
              <ChevronLeft className="w-4 h-4" /> {track.title}
            </button>

            <header>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0D9488] mb-1">{track.title} · {lesson.minutes} min</p>
              <h2 className="text-2xl font-bold text-gray-900">{lesson.title}</h2>
              <p className="text-gray-600 mt-2">{lesson.whyItMatters}</p>
            </header>

            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Key concepts</h3>
              <ul className="space-y-2">
                {lesson.concepts.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-[#0D9488] mt-1 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">How interviewers ask it</h3>
              <ul className="space-y-1 text-gray-700">
                {lesson.interviewerAsks.map((q, i) => (
                  <li key={i}>“{q}”</li>
                ))}
              </ul>
            </section>

            <section className="bg-[#F0FDFA] rounded-2xl p-6 border border-[#CCFBF1]">
              <h3 className="font-semibold text-[#0F766E] mb-1">Answer like a standout candidate</h3>
              <p className="text-sm text-gray-700 mb-3"><span className="font-semibold">Q:</span> {lesson.standoutAnswer.question}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-1">Structure</p>
              <p className="text-sm text-gray-700 mb-3">{lesson.standoutAnswer.framework}</p>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0F766E] mb-1">Model answer</p>
              <p className="text-gray-800 leading-relaxed mb-3">{lesson.standoutAnswer.answer}</p>
              <p className="text-sm text-gray-600"><span className="font-semibold">Why it works:</span> {lesson.standoutAnswer.whyItWorks}</p>
            </section>

            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" /> Real-world example</h3>
              <p className="text-gray-700">{lesson.realExample}</p>
            </section>

            <section className="bg-orange-50 rounded-2xl p-6 border border-orange-200">
              <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Common mistakes</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {lesson.mistakes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </section>

            {/* Quiz */}
            <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Quick check</h3>
              <div className="space-y-6">
                {lesson.quiz.map((q, qi) => {
                  const chosen = answers[qi];
                  return (
                    <div key={qi}>
                      <p className="font-medium text-gray-900 mb-2">{qi + 1}. {q.q}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => {
                          const isChosen = chosen === oi;
                          const isCorrect = q.answer === oi;
                          const style = chosen === undefined
                            ? "border-gray-200 hover:border-[#0D9488]"
                            : isCorrect
                            ? "border-green-500 bg-green-50"
                            : isChosen
                            ? "border-red-400 bg-red-50"
                            : "border-gray-200 opacity-60";
                          return (
                            <button
                              key={oi}
                              type="button"
                              disabled={chosen !== undefined}
                              onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                              className={`text-left text-sm px-4 py-2.5 rounded-xl border transition-all ${style}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {chosen !== undefined && (
                        <p className={`text-sm mt-2 ${chosen === q.answer ? "text-green-700" : "text-red-600"}`}>
                          {chosen === q.answer ? "Correct. " : "Not quite. "}{q.explain}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {quizDone && (
                <div className="mt-6 p-4 rounded-xl bg-[#F0FDFA] border border-[#CCFBF1] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="font-semibold text-[#0F766E]">You scored {quizScore}/{lesson.quiz.length}. Lesson saved.</p>
                  <Link
                    href={`/interview?domain=${encodeURIComponent(track.interviewDomain)}`}
                    className="text-center bg-[#0D9488] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#0F766E]"
                  >
                    Prove it in a mock interview →
                  </Link>
                </div>
              )}
            </section>

            {/* Next lesson */}
            {(() => {
              const idx = track.lessons.findIndex((l) => l.id === lesson.id);
              const next = track.lessons[idx + 1];
              return next ? (
                <button
                  type="button"
                  onClick={() => openLesson(track.id, next.id)}
                  className="w-full text-left bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-[#0D9488] transition-all"
                >
                  <p className="text-xs text-gray-500">Next lesson</p>
                  <p className="font-semibold text-gray-900">{next.title} →</p>
                </button>
              ) : null;
            })()}
          </article>
        )}
      </div>
    </AppShell>
  );
}

export default function TrainingPage() {
  return (
    <Suspense fallback={null}>
      <TrainingContent />
    </Suspense>
  );
}
