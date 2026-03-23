"use client";

import Link from "next/link";

const quickActions = [
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
    href: "#",
  },
  {
    icon: "💡",
    title: "Interview Insights",
    subtitle: "See real company questions",
    href: "#",
  },
  {
    icon: "📢",
    title: "Communication Coach",
    subtitle: "Improve fluency and confidence",
    href: "#",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] px-4 py-4 text-slate-900">
      <div className="mx-auto w-full max-w-[390px] rounded-[28px] border border-slate-100 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
        <header className="flex items-center justify-between px-5 pt-5">
          <h1 className="text-2xl font-black tracking-wide text-[#2B5CE6]">BRIDGE</h1>
          <button
            aria-label="Notifications"
            className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5" />
              <path d="M9 17a3 3 0 006 0" />
            </svg>
          </button>
        </header>

        <main className="px-5 pb-24 pt-4">
          <section className="rounded-2xl bg-gradient-to-br from-[#2B5CE6] via-[#3B6AFF] to-[#1E3FA8] p-5 text-white shadow-[0_10px_30px_rgba(43,92,230,0.35)]">
            <p className="text-sm font-medium text-blue-100">Hello, Future Achiever 👋</p>
            <h2 className="mt-2 text-2xl font-bold leading-tight">
              Your placement preparation starts here
            </h2>
          </section>

          <section className="mt-6">
            <h3 className="text-lg font-bold text-slate-900">What do you want to do today?</h3>
            <div className="mt-3 space-y-3">
              {quickActions.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.subtitle}</p>
                    </div>
                    <span className="text-lg text-slate-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
