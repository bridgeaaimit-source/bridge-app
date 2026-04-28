"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  Trophy,
  Zap,
  Flame,
  Star,
  Users,
  Briefcase,
  TrendingUp,
  Menu,
  X,
  CheckCircle,
  Play,
  Quote,
  Video,
  MessageSquare,
  FileText,
  MapPin,
} from "lucide-react";
import Link from 'next/link';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [counters, setCounters] = useState({
    students: 1200,
    interviews: 340,
    confidence: 89,
    companies: 50,
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const start = { students: 960, interviews: 260, confidence: 78, companies: 32 };
    const target = { students: 1200, interviews: 340, confidence: 89, companies: 50 };
    const duration = 1600;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      setCounters({
        students: Math.floor(start.students + (target.students - start.students) * easeOutCubic),
        interviews: Math.floor(start.interviews + (target.interviews - start.interviews) * easeOutCubic),
        confidence: Math.floor(start.confidence + (target.confidence - start.confidence) * easeOutCubic),
        companies: Math.floor(start.companies + (target.companies - start.companies) * easeOutCubic),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }, []);

  const liveFeed = [
    "Aarav from VIT just scored 812 on Amazon mock",
    "Live GD Battle starting · 3 seats left",
    "Priya cleared Infosys round 2 today",
    "New questions added: Google SDE-1",
    "Karan's BRIDGE Score: 612 → 748 in 4 weeks",
    "Top of leaderboard this hour: Meera (PSG)",
    "Sneha just finished 50th mock interview",
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7FAFF] text-[#0D0D1A]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap");
        * { font-family: "DM Sans", sans-serif; }
        .font-display { font-family: "Syne", sans-serif; }
        .gradient-text {
          background: linear-gradient(135deg, #0891b2 0%, #0d9488 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ticker { animation: ticker 28s linear infinite; }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .fade-up { animation: fadeUp 600ms ease both; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "border-b border-gray-100 bg-white/90 backdrop-blur-md" : "bg-white"
      }`}>
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center rounded-xl bg-white px-2 py-1 shadow-sm ring-1 ring-black/5"
          >
            <img
              src="/images/bridgeai-logo.png"
              alt="BridgeAI"
              className="h-9 w-auto max-w-[170px] object-contain sm:h-10"
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-cyan-700">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-cyan-700">How it Works</a>
            <a href="#stories" className="text-sm font-medium text-gray-600 hover:text-cyan-700">Success Stories</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-cyan-700">Pricing</a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Login</Link>
            <Link href="/login" className="rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-lg">
              Start Free
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-gray-100 bg-white md:hidden">
            <div className="space-y-2 px-4 py-4">
              <a href="#features" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Features</a>
              <a href="#how-it-works" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">How it Works</a>
              <a href="#stories" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Success Stories</a>
              <a href="#pricing" className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">Pricing</a>
              <Link href="/login" className="mt-2 block rounded-lg bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2 text-center text-sm font-semibold text-white">
                Start Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden bg-[#0f1221] pt-24 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="absolute -top-24 -right-28 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-28 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />

        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 px-4 pb-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="fade-up">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold">
              Live <span className="h-2 w-2 rounded-full bg-emerald-400" /> 1,247 students practicing now
            </p>
            <h1 className="font-display text-5xl font-black leading-tight sm:text-6xl">
              Crack your <br /> dream job.
            </h1>
            <p className="mt-4 max-w-xl text-base text-cyan-100 sm:text-lg">
              Real questions. Live AI feedback. Daily GD battles. One score that proves you're ready.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 text-sm font-bold text-white shadow-lg">
                Start free mock <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <button className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
                <Play className="mr-2 h-4 w-4" /> 90-sec demo
              </button>
            </div>
            <p className="mt-4 text-sm text-cyan-100"><strong>2,500+</strong> students · ⭐ 4.9 rating</p>
          </div>

          <div className="fade-up" style={{ animationDelay: "120ms" }}>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold">BRIDGE Score</h3>
                <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-200">Live mock</span>
              </div>
              <div className="mb-4 text-center">
                <p className="font-display text-6xl font-black text-cyan-300">520</p>
                <p className="text-sm text-cyan-100">/ 1000 · Beginner</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                  <span className="text-sm">Amazon SDE-1</span>
                  <span className="text-xs text-emerald-300">🔥 14 days</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                  <span className="text-sm">Rank #42 / 1,200</span>
                  <span className="text-xs text-cyan-200">Confidence 8.4/10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-cyan-100 bg-cyan-50 py-3">
        <div className="ticker whitespace-nowrap">
          {[...liveFeed, ...liveFeed].map((item, idx) => (
            <span key={`${item}-${idx}`} className="mx-6 inline-flex items-center gap-2 text-sm font-medium text-cyan-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {item}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <article className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
              <p className="font-display text-3xl font-black text-cyan-700">{counters.students.toLocaleString()}+</p>
              <p className="mt-1 text-sm text-gray-600">Students</p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
              <p className="font-display text-3xl font-black text-cyan-700">{counters.interviews.toLocaleString()}+</p>
              <p className="mt-1 text-sm text-gray-600">Interviews Practiced</p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
              <p className="font-display text-3xl font-black text-cyan-700">{counters.confidence}%</p>
              <p className="mt-1 text-sm text-gray-600">Confidence Boost</p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm">
              <p className="font-display text-3xl font-black text-cyan-700">{counters.companies}+</p>
              <p className="mt-1 text-sm text-gray-600">Companies Cracked</p>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#f4f8ff] py-20">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">The Stack</p>
            <h2 className="font-display mt-3 text-4xl font-black text-[#0d0d1a] sm:text-5xl">
              Six weapons. One unfair advantage.
            </h2>
            <p className="mt-3 text-lg text-gray-600">Every block is built to push your BRIDGE Score closer to 1000.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Video className="h-6 w-6 text-cyan-700" />, title: "AI Video Interview", text: "Eye contact, posture, voice tremor, filler words. Real-time confidence detection." },
              { icon: <Trophy className="h-6 w-6 text-cyan-700" />, title: "BRIDGE Score", text: "Your placement readiness score out of 1000 across interviews and GDs." },
              { icon: <Users className="h-6 w-6 text-cyan-700" />, title: "GD Battles", text: "4 students. 5 minutes. AI judge. Practice like a real selection round." },
              { icon: <MessageSquare className="h-6 w-6 text-cyan-700" />, title: "500+ Real Questions", text: "Asked at Amazon, Google, TCS, Infosys and more." },
              { icon: <FileText className="h-6 w-6 text-cyan-700" />, title: "AI Resume Builder", text: "ATS-optimized and recruiter-approved, with instant suggestions." },
              { icon: <MapPin className="h-6 w-6 text-cyan-700" />, title: "Personal Roadmap", text: "A practical 7-day plan generated from your weak spots." },
            ].map((card) => (
              <article key={card.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 inline-flex rounded-xl bg-cyan-50 p-3">{card.icon}</div>
                <h3 className="font-display text-xl font-bold text-[#0d0d1a]">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display mb-12 text-center text-4xl font-black text-[#0d0d1a] sm:text-5xl">
            From signup to offer letter.
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Sign up", "90 seconds. No card."],
              ["02", "Take a mock", "Real questions, AI feedback."],
              ["03", "Track score", "Watch it climb daily."],
              ["04", "Walk in confident", "You've practiced this."],
            ].map(([n, t, d]) => (
              <article key={n} className="rounded-2xl border border-gray-100 bg-[#f9fbff] p-6 text-center">
                <p className="font-display text-3xl font-black text-cyan-700">{n}</p>
                <h3 className="font-display mt-3 text-xl font-bold">{t}</h3>
                <p className="mt-1 text-sm text-gray-600">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#f4f8ff] py-20">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-4xl font-black text-[#0d0d1a] sm:text-5xl">
              Honest pricing. Built for students.
            </h2>
            <p className="mt-3 text-gray-600">Start free. Upgrade when you're hooked.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold text-cyan-700">Starter</p>
              <h3 className="font-display mt-2 text-3xl font-black">Free Forever</h3>
              <p className="mt-1 text-gray-500">₹0 / forever</p>
              <ul className="mt-5 space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> 4 AI mock interviews</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> 1 GD battle</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" /> Basic BRIDGE score</li>
              </ul>
              <Link href="/login" className="mt-6 inline-flex rounded-xl border border-cyan-600 px-5 py-2 text-sm font-semibold text-cyan-700">
                Start Free
              </Link>
            </article>
            <article className="rounded-3xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-600 to-teal-600 p-8 text-white shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-100">Most popular</p>
              <h3 className="font-display mt-2 text-3xl font-black">Placement Crusher</h3>
              <p className="mt-1 text-cyan-100">₹499 / month</p>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-300" /> 20 AI video interviews / month</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-300" /> 20 GD battles / month</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-300" /> Unlimited improvement guides</li>
              </ul>
              <Link href="/login" className="mt-6 inline-flex rounded-xl bg-white px-5 py-2 text-sm font-bold text-cyan-700">
                Go Pro
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section id="stories" className="bg-white py-20">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display mb-12 text-center text-4xl font-black text-[#0d0d1a] sm:text-5xl">
            They walked in. They got the offer.
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              ["Akhil Kumar", "VIT → Amazon", "Walked into Amazon already knowing the questions."],
              ["Priya Nair", "PSG → Infosys", "GD battles flipped my fear into leadership."],
              ["Rohan Sharma", "SRMIST → Wipro", "480 → 790 in 6 weeks. Insane clarity."],
              ["Sneha Patel", "Manipal → TCS", "80% question match. Got the offer day one."],
            ].map(([name, sub, quote]) => (
              <article key={name} className="rounded-2xl border border-gray-100 bg-[#f9fbff] p-6 shadow-sm">
                <div className="mb-4 flex text-yellow-400">
                  {[...Array(5)].map((_, i) => <Star key={`${name}-${i}`} className="h-4 w-4 fill-current" />)}
                </div>
                <Quote className="mb-2 h-8 w-8 text-cyan-300" />
                <p className="text-gray-700">"{quote}"</p>
                <div className="mt-4">
                  <p className="font-semibold text-[#0d0d1a]">{name}</p>
                  <p className="text-sm text-cyan-700">{sub}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0f1221] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[920px] rounded-3xl border border-white/20 bg-white/10 p-10 text-center backdrop-blur">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Only 50 free spots this week</p>
          <h2 className="font-display text-4xl font-black sm:text-5xl">Your competition already started.</h2>
          <p className="mx-auto mt-4 max-w-xl text-cyan-100">Free forever. No card. 60-second signup.</p>
          <Link href="/login" className="mt-7 inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-7 py-3 text-sm font-bold text-white shadow-lg">
            Take your free mock now <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-[#0b0f1f] px-4 py-14 text-gray-400 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="inline-flex w-fit items-center rounded-xl bg-white px-2 py-1 ring-1 ring-white/20">
              <img
                src="/images/bridgeai-logo.png"
                alt="BridgeAI"
                className="h-9 w-auto max-w-[170px] object-contain"
              />
            </div>
            <p className="mt-3 text-sm">AI placement prep for ambitious Indian students.</p>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Product</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How it works</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#">BRIDGE Score</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Company</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>About</li>
              <li>Blog</li>
              <li>Careers</li>
              <li>Press</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold text-white">Contact</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>hello@bridgeai.in</li>
              <li>Pune, India</li>
              <li>For Recruiters</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 w-full max-w-[1200px] border-t border-white/10 pt-5 text-center text-xs">
          © 2026 BridgeAI · Crafted with intent in India
        </div>
      </footer>
    </div>
  );
}
