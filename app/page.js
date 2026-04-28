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
            className="flex items-center h-full py-1"
          >
            <img
              src="/images/bridgeai-logo.png"
              alt="BridgeAI"
              className="h-full w-auto object-contain"
            />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-[#0D9488]">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-[#0D9488]">How it Works</a>
            <a href="#stories" className="text-sm font-medium text-gray-600 hover:text-[#0D9488]">Success Stories</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-[#0D9488]">Pricing</a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/login" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">Login</Link>
            <Link href="/login" className="rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-5 py-2 text-sm font-semibold text-white shadow-lg">
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
              <Link href="/login" className="mt-2 block rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F766E] px-4 py-2 text-center text-sm font-semibold text-white">
                Start Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D9488] to-[#0F766E] pt-32 pb-24 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="absolute -top-24 -right-28 h-72 w-72 rounded-full bg-[#CCFBF1]/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-28 h-72 w-72 rounded-full bg-[#F0FDFA]/20 blur-3xl" />

        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-16 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="fade-up">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
              Live <span className="h-2 w-2 rounded-full bg-emerald-400" /> 1,247 students practicing now
            </p>
            <h1 className="font-display text-6xl font-black leading-tight sm:text-7xl lg:text-8xl">
              Crack your <br /> dream job.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[#CCFBF1] sm:text-xl">
              Real questions. Live AI feedback. Daily GD battles. One score that proves you're ready.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-white text-[#0D9488] px-8 py-4 text-base font-bold shadow-lg hover:bg-[#F0FDFA]">
                Start free mock <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <button className="inline-flex items-center justify-center rounded-xl border border-white/30 px-8 py-4 text-base font-semibold text-white hover:bg-white/10">
                <Play className="mr-2 h-5 w-5" /> 90-sec demo
              </button>
            </div>
            <p className="mt-6 text-base text-[#CCFBF1]"><strong>2,500+</strong> students · ⭐ 4.9 rating</p>
          </div>

          <div className="fade-up" style={{ animationDelay: "120ms" }}>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-display text-2xl font-bold">BRIDGE Score</h3>
                <span className="rounded-full bg-[#F0FDFA]/20 px-4 py-2 text-sm font-semibold text-[#CCFBF1]">Live mock</span>
              </div>
              <div className="mb-6 text-center">
                <p className="font-display text-7xl font-black text-[#CCFBF1]">520</p>
                <p className="text-lg text-[#CCFBF1]">/ 1000 · Beginner</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                  <span className="text-base">Amazon SDE-1</span>
                  <span className="text-sm text-emerald-300">🔥 14 days</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3">
                  <span className="text-base">Rank #42 / 1,200</span>
                  <span className="text-sm text-[#CCFBF1]">Confidence 8.4/10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-y border-[#F0FDFA] bg-[#F0FDFA] py-3">
        <div className="ticker whitespace-nowrap">
          {[...liveFeed, ...liveFeed].map((item, idx) => (
            <span key={`${item}-${idx}`} className="mx-6 inline-flex items-center gap-2 text-sm font-medium text-[#0D9488]">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {item}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <article className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <p className="font-display text-4xl font-black text-[#0D9488]">{counters.students.toLocaleString()}+</p>
              <p className="mt-2 text-base text-gray-600">Students</p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <p className="font-display text-4xl font-black text-[#0D9488]">{counters.interviews.toLocaleString()}+</p>
              <p className="mt-2 text-base text-gray-600">Interviews Practiced</p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <p className="font-display text-4xl font-black text-[#0D9488]">{counters.confidence}%</p>
              <p className="mt-2 text-base text-gray-600">Confidence Boost</p>
            </article>
            <article className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <p className="font-display text-4xl font-black text-[#0D9488]">{counters.companies}+</p>
              <p className="mt-2 text-base text-gray-600">Companies Cracked</p>
            </article>
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#F0FDFA] py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-[#0D9488]">The Stack</p>
            <h2 className="font-display mt-4 text-5xl font-black text-[#0d0d1a] sm:text-6xl">
              Six weapons. One unfair advantage.
            </h2>
            <p className="mt-4 text-xl text-gray-600">Every block is built to push your BRIDGE Score closer to 1000.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Video className="h-7 w-7 text-[#0D9488]" />, title: "AI Video Interview", text: "Eye contact, posture, voice tremor, filler words. Real-time confidence detection." },
              { icon: <Trophy className="h-7 w-7 text-[#0D9488]" />, title: "BRIDGE Score", text: "Your placement readiness score out of 1000 across interviews and GDs." },
              { icon: <Users className="h-7 w-7 text-[#0D9488]" />, title: "GD Battles", text: "4 students. 5 minutes. AI judge. Practice like a real selection round." },
              { icon: <MessageSquare className="h-7 w-7 text-[#0D9488]" />, title: "500+ Real Questions", text: "Asked at Amazon, Google, TCS, Infosys and more." },
              { icon: <FileText className="h-7 w-7 text-[#0D9488]" />, title: "AI Resume Builder", text: "ATS-optimized and recruiter-approved, with instant suggestions." },
              { icon: <MapPin className="h-7 w-7 text-[#0D9488]" />, title: "Personal Roadmap", text: "A practical 7-day plan generated from your weak spots." },
            ].map((card) => (
              <article key={card.title} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-5 inline-flex rounded-xl bg-[#F0FDFA] p-4">{card.icon}</div>
                <h3 className="font-display text-2xl font-bold text-[#0d0d1a]">{card.title}</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-600">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display mb-16 text-center text-5xl font-black text-[#0d0d1a] sm:text-6xl">
            From signup to offer letter.
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "Sign up", "90 seconds. No card."],
              ["02", "Take a mock", "Real questions, AI feedback."],
              ["03", "Track score", "Watch it climb daily."],
              ["04", "Walk in confident", "You've practiced this."],
            ].map(([n, t, d]) => (
              <article key={n} className="rounded-2xl border border-gray-100 bg-[#F0FDFA] p-8 text-center">
                <p className="font-display text-4xl font-black text-[#0D9488]">{n}</p>
                <h3 className="font-display mt-4 text-2xl font-bold">{t}</h3>
                <p className="mt-2 text-base text-gray-600">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[#F0FDFA] py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="font-display text-5xl font-black text-[#0d0d1a] sm:text-6xl">
              Honest pricing. Built for students.
            </h2>
            <p className="mt-4 text-xl text-gray-600">Start free. Upgrade when you're hooked.</p>
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <article className="rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
              <p className="text-base font-semibold text-[#0D9488]">Starter</p>
              <h3 className="font-display mt-2 text-4xl font-black">Free Forever</h3>
              <p className="mt-2 text-lg text-gray-500">₹0 / forever</p>
              <ul className="mt-6 space-y-3 text-base text-gray-700">
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500" /> 4 AI mock interviews</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500" /> 1 GD battle</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-500" /> Basic BRIDGE score</li>
              </ul>
              <Link href="/login" className="mt-8 inline-flex rounded-xl border border-[#0D9488] px-6 py-3 text-base font-semibold text-[#0D9488]">
                Start Free
              </Link>
            </article>
            <article className="rounded-3xl border-2 border-[#F0FDFA] bg-gradient-to-br from-[#0D9488] to-[#0F766E] p-10 text-white shadow-lg">
              <p className="text-sm font-bold uppercase tracking-wider text-[#CCFBF1]">Most popular</p>
              <h3 className="font-display mt-2 text-4xl font-black">Placement Crusher</h3>
              <p className="mt-2 text-lg text-[#CCFBF1]">₹499 / month</p>
              <ul className="mt-6 space-y-3 text-base">
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-300" /> 20 AI video interviews / month</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-300" /> 20 GD battles / month</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-emerald-300" /> Unlimited improvement guides</li>
              </ul>
              <Link href="/login" className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 text-base font-bold text-[#0D9488]">
                Go Pro
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section id="stories" className="bg-white py-24">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-display mb-16 text-center text-5xl font-black text-[#0d0d1a] sm:text-6xl">
            They walked in. They got the offer.
          </h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {[
              ["Akhil Kumar", "VIT → Amazon", "Walked into Amazon already knowing the questions."],
              ["Priya Nair", "PSG → Infosys", "GD battles flipped my fear into leadership."],
              ["Rohan Sharma", "SRMIST → Wipro", "480 → 790 in 6 weeks. Insane clarity."],
              ["Sneha Patel", "Manipal → TCS", "80% question match. Got the offer day one."],
            ].map(([name, sub, quote]) => (
              <article key={name} className="rounded-2xl border border-gray-100 bg-[#F0FDFA] p-8 shadow-sm">
                <div className="mb-5 flex text-yellow-400">
                  {[...Array(5)].map((_, i) => <Star key={`${name}-${i}`} className="h-5 w-5 fill-current" />)}
                </div>
                <Quote className="mb-3 h-10 w-10 text-[#CCFBF1]" />
                <p className="text-lg text-gray-700">"{quote}"</p>
                <div className="mt-5">
                  <p className="font-semibold text-xl text-[#0d0d1a]">{name}</p>
                  <p className="text-base text-[#0D9488]">{sub}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] px-4 py-28 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[920px] rounded-3xl border border-white/20 bg-white/10 p-14 text-center backdrop-blur">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#CCFBF1]">Only 50 free spots this week</p>
          <h2 className="font-display text-5xl font-black sm:text-6xl">Your competition already started.</h2>
          <p className="mx-auto mt-6 max-w-xl text-xl text-[#CCFBF1]">Free forever. No card. 60-second signup.</p>
          <Link href="/login" className="mt-10 inline-flex items-center rounded-xl bg-white px-9 py-4 text-lg font-bold text-[#0D9488] shadow-lg hover:bg-[#F0FDFA]">
            Take your free mock now <ArrowRight className="ml-2 h-6 w-6" />
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
