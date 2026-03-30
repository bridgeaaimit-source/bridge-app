"use client";

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Trophy, Zap, Target, Flame, Star, Users, Briefcase, TrendingUp, Menu, X, CheckCircle, Play, Quote, GraduationCap, Building, Award, MessageSquare, BarChart3, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [counters, setCounters] = useState({ students: 0, interviews: 0, companies: 0, confidence: 0 });
  
  // Intersection Observer refs
  const statsRef = useRef(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Count-up animation for stats
  useEffect(() => {
    if (statsRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              startCountUp();
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );
      observer.observe(statsRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const startCountUp = () => {
    const duration = 2000;
    const startTime = Date.now();
    const targets = { students: 25000, interviews: 500, companies: 98, confidence: 98 };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      setCounters({
        students: Math.floor(targets.students * easeOutCubic),
        interviews: Math.floor(targets.interviews * easeOutCubic),
        companies: Math.floor(targets.companies * easeOutCubic),
        confidence: Math.floor(targets.confidence * easeOutCubic)
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  };

  // Scroll reveal animations
  useEffect(() => {
    const observerOptions = { threshold: 0.15 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-reveal');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Custom styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

        :root {
          --brand-primary: #0891B2;
          --brand-secondary: #0D9488;
          --brand-gradient: linear-gradient(135deg, #0891B2 0%, #0D9488 100%);
          --bg-white: #FFFFFF;
          --bg-soft: #F0FDFA;
          --bg-gray: #F4F4F6;
          --text-heading: #0D0D1A;
          --text-body: #44445A;
          --text-muted: #8888A0;
          --border: #E8E8F0;
          --card-shadow: 0 4px 24px rgba(8, 145, 178, 0.08);
          --card-shadow-hover: 0 12px 40px rgba(8, 145, 178, 0.18);
        }

        * {
          font-family: 'DM Sans', sans-serif;
        }

        .font-display {
          font-family: 'Syne', sans-serif;
        }

        .animate-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .scroll-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .scroll-reveal.animate-reveal {
          opacity: 1;
          transform: translateY(0);
        }

        .float-animation {
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .gradient-text {
          background: var(--brand-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .card-hover {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: var(--card-shadow-hover);
        }
      `}</style>

      {/* NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/92 backdrop-blur-lg border-b border-gray-100' : 'bg-white border-b border-gray-100'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.svg" alt="BRIDGE" className="w-8 h-8" />
                <span className="font-display text-2xl font-bold gradient-text">BRIDGE</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-9">
              <Link href="#features" className="text-gray-600 hover:text-cyan-600 text-sm font-medium transition-colors">Features</Link>
              <Link href="#how-it-works" className="text-gray-600 hover:text-cyan-600 text-sm font-medium transition-colors">How it Works</Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-cyan-600 text-sm font-medium transition-colors">Success Stories</Link>
              <Link href="#pricing" className="text-gray-600 hover:text-cyan-600 text-sm font-medium transition-colors">Pricing</Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Login
              </Link>
              <Link href="/login" className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-lg hover:opacity-90 transition-opacity shadow-lg">
                Start Free
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-6 py-4 space-y-3">
              <Link href="#features" className="block py-2 text-gray-600 hover:text-cyan-600 font-medium">Features</Link>
              <Link href="#how-it-works" className="block py-2 text-gray-600 hover:text-cyan-600 font-medium">How it Works</Link>
              <Link href="#testimonials" className="block py-2 text-gray-600 hover:text-cyan-600 font-medium">Success Stories</Link>
              <Link href="#pricing" className="block py-2 text-gray-600 hover:text-cyan-600 font-medium">Pricing</Link>
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <Link href="/login" className="block py-2 text-center text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Login</Link>
                <Link href="/login" className="block py-2 text-center text-white bg-gradient-to-r from-cyan-600 to-cyan-700 rounded-lg font-semibold">Start Free</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="min-h-screen flex items-center pt-16 relative">
        {/* Background gradient blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100 rounded-full filter blur-3xl opacity-30"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-100 animate-fade-up" style={{ animationDelay: '0ms' }}>
              <span className="text-lg">🇮🇳</span>
              <span className="text-sm font-semibold text-cyan-700">Built for Bharat</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl lg:text-6xl font-bold leading-tight animate-fade-up" style={{ animationDelay: '100ms' }}>
              Land Your <span className="gradient-text">Dream Job</span>
              <br />
              from Any College
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg animate-fade-up" style={{ animationDelay: '200ms' }}>
              India's AI-powered placement prep platform. Practice real interview questions, win GD battles, and track your BRIDGE Score — built for students from Tier 2 colleges.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
              <Link href="/login" className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white font-semibold rounded-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 inline-flex items-center justify-center">
                Start for Free <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="px-7 py-4 bg-white text-cyan-600 font-semibold rounded-lg border-2 border-cyan-600 hover:bg-cyan-50 transition-colors inline-flex items-center justify-center">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-500 animate-fade-up" style={{ animationDelay: '400ms' }}>
              <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-green-500" /> Free to join</span>
              <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-green-500" /> No credit card</span>
              <span className="flex items-center"><CheckCircle className="w-4 h-4 mr-1 text-green-500" /> 1,200+ students</span>
            </div>

            {/* College logos */}
            <div className="animate-fade-up" style={{ animationDelay: '500ms' }}>
              <p className="text-xs text-gray-500 mb-3">Trusted by students from</p>
              <div className="flex flex-wrap gap-2">
                {['VIT', 'PSG', 'SRMIST', 'Manipal', 'LPU', 'Amity'].map((college) => (
                  <span key={college} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg">
                    {college}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Mockup */}
          <div className="relative">
            {/* Main Dashboard Card */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl float-animation">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display text-xl font-bold">Your BRIDGE Score</h3>
                <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded-full">Today</span>
              </div>
　　 　 　 　
              <div className="text-center mb-6">
                <div className="font-display text-6xl font-black gradient-text mb-2">742</div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">Placement Ready</span>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-900 font-semibold">74%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#0891B2] to-[#0D9488] h-2 rounded-full" style={{ width: '74%' }}></div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-cyan-600" />
                    <span className="text-sm font-medium">Mock Interviews</span>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">12 done</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-cyan-600" />
                    <span className="text-sm font-medium">GD Battles</span>
                  </div>
                  <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-semibold rounded">5 won</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-cyan-600" />
                    <span className="text-sm font-medium">Improvement</span>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded">+23%</span>
                </div>
              </div>

              <div className="p-4 bg-cyan-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-cyan-900">Next Challenge:</span>
                  <span className="text-xs text-cyan-600">Amazon SDE Mock</span>
                </div>
                <button className="w-full px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:bg-cyan-700 transition-colors">
                  Start Now →
                </button>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute top-8 -left-8 bg-white rounded-2xl p-4 shadow-lg float-animation" style={{ animationDelay: '1s' }}>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-sm font-bold">Ranked #4 in your college</span>
              </div>
            </div>
            <div className="absolute bottom-8 -right-8 bg-white rounded-2xl p-4 shadow-lg float-animation" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-bold">Interview score: 91%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section ref={statsRef} className="bg-gradient-to-r from-purple-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <GraduationCap className="w-8 h-8" />, value: counters.students, suffix: '+', label: 'Students Trained' },
              { icon: <MessageSquare className="w-8 h-8" />, value: counters.interviews, suffix: '+', label: 'Mock Interviews Done' },
              { icon: <Building className="w-8 h-8" />, value: counters.companies, suffix: '+', label: 'Companies Cracked' },
              { icon: <BarChart3 className="w-8 h-8" />, value: counters.confidence, suffix: '%', label: 'Confidence Boost' }
            ].map((stat, index) => (
              <div key={index} className="text-center text-white">
                <div className="flex justify-center mb-4">{stat.icon}</div>
                <div className="font-display text-5xl font-bold mb-2">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-purple-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section ref={featuresRef} id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <p className="text-sm font-semibold text-purple-600 tracking-wider uppercase mb-4">WHAT WE OFFER</p>
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">
              Three tools that get you <span className="gradient-text">placed</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg card-hover scroll-reveal" style={{ animationDelay: '0ms' }}>
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">AI Mock Interviews</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Practice with real questions from Amazon, Infosys, TCS and more. Get instant AI feedback on your answers, body language score, and areas to improve.
              </p>
              <div className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 text-sm font-semibold rounded-full">
                Most Popular
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg card-hover scroll-reveal" style={{ animationDelay: '80ms' }}>
              <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">GD Battles</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Join live group discussions with students across India. Learn to lead, make your point, and win — scored by AI in real time.
              </p>
              <div className="inline-flex items-center px-3 py-1 bg-orange-50 text-orange-700 text-sm font-semibold rounded-full">
                Unique Feature
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg card-hover scroll-reveal" style={{ animationDelay: '160ms' }}>
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-6">
                <Trophy className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">BRIDGE Score</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Your personal placement readiness score updated after every session. Know exactly where you stand and what to improve next.
              </p>
              <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full">
                Track Progress
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section ref={howItWorksRef} id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">
              Get placed in <span className="gradient-text">3 steps</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="text-center scroll-reveal" style={{ animationDelay: '0ms' }}>
              <div className="font-display text-3xl font-black gradient-text mb-4">01</div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">Create Your Profile</h3>
              <p className="text-gray-600 leading-relaxed">
                Sign up free in 60 seconds. Tell us your college, target companies, and placement timeline.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center scroll-reveal" style={{ animationDelay: '80ms' }}>
              <div className="font-display text-3xl font-black gradient-text mb-4">02</div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">Practice Every Day</h3>
              <p className="text-gray-600 leading-relaxed">
                Take AI mock interviews and join GD battles daily. Your BRIDGE Score updates after every session.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center scroll-reveal" style={{ animationDelay: '160ms' }}>
              <div className="font-display text-3xl font-black gradient-text mb-4">03</div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-4">Walk In Confident</h3>
              <p className="text-gray-600 leading-relaxed">
                Enter your placement interviews knowing exactly what to say, how to say it, and how to win.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section ref={testimonialsRef} id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 scroll-reveal">
            <h2 className="font-display text-4xl lg:text-5xl font-bold mb-6">
              Students who made it
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg card-hover scroll-reveal" style={{ animationDelay: '0ms' }}>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <Quote className="w-12 h-12 text-purple-200 mb-4" />
              <p className="text-gray-700 italic text-lg leading-relaxed mb-6">
                "BRIDGE completely changed how I prepare. The AI feedback after every mock interview told me exactly what I was doing wrong. I went from freezing up to confidently answering every question."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                    AK
                  </div>
                  <div>
                    <div className="font-semibold">Akhil Kumar</div>
                    <div className="text-sm text-gray-500">VIT Vellore</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg">
                  Amazon
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg card-hover scroll-reveal" style={{ animationDelay: '80ms' }}>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <Quote className="w-12 h-12 text-purple-200 mb-4" />
              <p className="text-gray-700 italic text-lg leading-relaxed mb-6">
                "I used to go completely silent in group discussions. After 10 GD Battles on BRIDGE, I was the one leading the conversation. That confidence got me through 3 rounds at Infosys."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                    PN
                  </div>
                  <div>
                    <div className="font-semibold">Priya Nair</div>
                    <div className="text-sm text-gray-500">PSG College of Technology</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg">
                  Infosys
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg card-hover scroll-reveal" style={{ animationDelay: '160ms' }}>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <Quote className="w-12 h-12 text-purple-200 mb-4" />
              <p className="text-gray-700 italic text-lg leading-relaxed mb-6">
                "My BRIDGE Score went from 480 to 790 in 6 weeks. I could literally see myself getting better. That kind of feedback doesn't exist anywhere else."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                    RS
                  </div>
                  <div>
                    <div className="font-semibold">Rohan Sharma</div>
                    <div className="text-sm text-gray-500">SRMIST</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg">
                  Wipro
                </div>
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg card-hover scroll-reveal" style={{ animationDelay: '240ms' }}>
              <div className="flex mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <Quote className="w-12 h-12 text-purple-200 mb-4" />
              <p className="text-gray-700 italic text-lg leading-relaxed mb-6">
                "The questions in the AI mock interviews were EXACTLY what they asked me in the real interview. It felt like I had already been there before."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold">
                    SP
                  </div>
                  <div>
                    <div className="font-semibold">Sneha Patel</div>
                    <div className="text-sm text-gray-500">Manipal University</div>
                  </div>
                </div>
                <div className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg">
                  TCS
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section ref={ctaRef} className="py-24 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-600 to-purple-700 rounded-3xl p-12 lg:p-16 text-center shadow-2xl scroll-reveal">
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-white mb-6">
            Your placement starts today
          </h2>
          <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
            Join 1,200+ students already on BRIDGE. Free forever for students.
          </p>
          <Link href="/login" className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            Create Your Free Account <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Column 1 */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.svg" alt="BRIDGE" className="w-8 h-8" />
                <span className="font-display text-2xl font-bold text-white">BRIDGE</span>
              </div>
              <p className="text-sm mb-4">India's AI-powered placement prep platform</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <MapPin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">BRIDGE Score</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Column 4 */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p> 2025 BRIDGE. Made with in India</p>
          </div>
        </div>
      </footer>

      {/* Recruiter Link */}
      <div className="fixed bottom-8 right-8 z-40">
        <Link href="/recruiter" className="bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors text-sm font-medium">
          For Recruiters 
        </Link>
      </div>
    </div>
  );
}
