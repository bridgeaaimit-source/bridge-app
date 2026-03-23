"use client";

export default function Home() {
  const quickActions = [
    {
      icon: "🎤",
      title: "AI Mock Interview",
      subtitle: "Practice with instant AI feedback",
    },
    {
      icon: "🗣️",
      title: "GD Practice",
      subtitle: "Simulate real group discussions",
    },
    {
      icon: "💡",
      title: "Interview Insights",
      subtitle: "See real company questions",
    },
    {
      icon: "📢",
      title: "Communication Coach",
      subtitle: "Improve fluency & confidence",
    },
  ];

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
            <div className="mt-5 rounded-xl bg-white/20 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-blue-50">
                <span>Profile 20% complete</span>
                <span>20%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/30">
                <div className="h-full w-1/5 rounded-full bg-white" />
              </div>
            </div>
          </section>

          <section className="mt-4 grid grid-cols-3 gap-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-lg">🎯</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-600">12 Interviews</p>
              <p className="text-xs text-slate-500">Practiced</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-lg">📈</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-600">Score</p>
              <p className="text-xs text-slate-500">7.2/10</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
              <p className="text-lg">🔥</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-600">3 Day</p>
              <p className="text-xs text-slate-500">Streak</p>
            </article>
          </section>

          <section className="mt-6">
            <h3 className="text-lg font-bold text-slate-900">What do you want to do today?</h3>
            <div className="mt-3 space-y-3">
              {quickActions.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.subtitle}</p>
                    </div>
                    <span className="text-lg text-slate-400">→</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-[#FF6B35]/20 bg-[#FFF5F1] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#FF6B35]">Today&apos;s Challenge</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">Introduce yourself in 60 seconds</p>
            <button className="mt-3 rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95">
              Tap to Start
            </button>
          </section>
        </main>

        <nav className="fixed bottom-4 left-1/2 z-10 w-[calc(100%-2rem)] max-w-[360px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
          <ul className="grid grid-cols-4">
            <li>
              <a href="#" className="flex flex-col items-center gap-1 py-1 text-[#2B5CE6]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z" />
                </svg>
                <span className="text-[11px] font-semibold">Home</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex flex-col items-center gap-1 py-1 text-slate-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M4 4h16v10H4zM4 16h6v4H4zM12 16h8v4h-8z" />
                </svg>
                <span className="text-[11px]">Practice</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex flex-col items-center gap-1 py-1 text-slate-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7-4h4v18h-4V3z" />
                </svg>
                <span className="text-[11px]">Insights</span>
              </a>
            </li>
            <li>
              <a href="#" className="flex flex-col items-center gap-1 py-1 text-slate-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5z" />
                </svg>
                <span className="text-[11px]">Profile</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
