"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const actionCards = [
  {
    icon: "🎤",
    title: "AI Mock Interview",
    subtitle: "Practice with instant AI feedback",
    href: "/interview",
  },
  {
    icon: "🗣️",
    title: "GD Practice",
    subtitle: "Simulate real group discussions",
    href: "/gd",
  },
  {
    icon: "🔥",
    title: "PULSE Intelligence",
    subtitle: "Track real-time company trends",
    href: "/pulse",
  },
  {
    icon: "📢",
    title: "Communication Coach",
    subtitle: "Improve fluency and confidence",
    href: "/coach",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        document.cookie = "bridge_auth=; path=/; max-age=0; samesite=lax";
        router.replace("/login");
        return;
      }
      document.cookie = "bridge_auth=1; path=/; max-age=2592000; samesite=lax";
      setIsCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white px-4 py-4 text-slate-900">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-[390px] items-center justify-center rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#2B5CE6]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2B5CE6]/30 border-t-[#2B5CE6]" />
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-4 text-slate-900">
      <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="flex items-center justify-between px-5 pb-3 pt-5">
          <div>
            <p className="text-sm font-semibold text-slate-500">Good Morning 👋</p>
            <h1 className="text-lg font-bold text-slate-900">Ready to level up?</h1>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#2B5CE6]/20 bg-[#EEF3FF] text-sm font-bold text-[#2B5CE6]">
            SM
          </div>
        </header>

        <main className="px-5 pb-24 pt-4">
          <section className="rounded-2xl bg-gradient-to-br from-[#2B5CE6] via-[#3B6AFF] to-[#1E3FA8] p-5 text-white shadow-[0_10px_30px_rgba(43,92,230,0.35)]">
            <p className="text-sm font-medium text-blue-100">Welcome back, Sid 👋</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight">
              Your placement preparation starts here
            </h2>
            <p className="mt-2 text-xs text-blue-100">Keep your streak alive and complete today&apos;s challenge.</p>
          </section>

          <section className="mt-4 grid grid-cols-3 gap-2.5">
            <article className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">Interviews</p>
              <p className="mt-1 text-base font-bold text-slate-900">12</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">Avg Score</p>
              <p className="mt-1 text-base font-bold text-slate-900">7.4</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-xs text-slate-500">Streak</p>
              <p className="mt-1 text-base font-bold text-slate-900">5 days</p>
            </article>
          </section>

          <section className="mt-6">
            <h3 className="text-lg font-bold text-slate-900">What do you want to do today?</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {actionCards.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <div className="mt-2 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-[#FF6B35]/20 bg-[#FFF5F1] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#FF6B35]">Today&apos;s Challenge</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Record a 60-second self-introduction</p>
            <button className="mt-3 rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95">
              Start Challenge
            </button>
          </section>
        </main>

        <nav className="fixed bottom-4 left-1/2 z-10 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
          <ul className="grid grid-cols-4">
            <li className="text-center text-[#2B5CE6]">
              <Link href="/dashboard" className="text-[11px] font-semibold">
                Home
              </Link>
            </li>
            <li className="text-center text-slate-500">
              <Link href="/interview" className="text-[11px]">
                Practice
              </Link>
            </li>
            <li className="text-center text-slate-500">
              <Link href="/pulse" className="text-[11px]">
                PULSE
              </Link>
            </li>
            <li className="text-center text-slate-500">
              <Link href="/profile" className="text-[11px]">
                Profile
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
