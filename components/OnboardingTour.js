"use client";
import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthBypass } from '@/hooks/useAuthBypass';

export default function OnboardingTour() {
  const [started, setStarted] = useState(false);
  const { isBypassed } = useAuthBypass();

  useEffect(() => {
    if (started) return;

    if (isBypassed) {
      const done = typeof window !== 'undefined' && localStorage.getItem('bridge_tour_done') === 'true';
      if (!done) {
        setTimeout(() => { setStarted(true); startTour(null); }, 1800);
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && !snap.data().tourCompleted) {
          setTimeout(() => { setStarted(true); startTour(user.uid); }, 1800);
        }
      } catch (e) {
        console.error('Tour check error:', e);
      }
    });
    return () => unsubscribe();
  }, [isBypassed]);

  const startTour = (uid) => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: true,
      overlayOpacity: 0.75,
      stagePadding: 8,
      stageRadius: 16,
      popoverClass: 'bridge-tour-popover',

      onDestroyStarted: async () => {
        try {
          if (uid) {
            await updateDoc(doc(db, 'users', uid), { tourCompleted: true });
          } else {
            typeof window !== 'undefined' && localStorage.setItem('bridge_tour_done', 'true');
          }
        } catch (e) { console.error(e); }
        driverObj.destroy();
        setStarted(false);
      },

      steps: [
        {
          popover: {
            title: '👋 Welcome to BridgeAI!',
            description: `<div style="text-align:center;padding:8px 0"><img src="/images/logo_navbar_48h.png" style="height:48px;margin:0 auto 12px;display:block"/><p style="font-size:14px;color:#44445A;line-height:1.6">India's smartest AI-powered placement prep platform — built for students from Tier 2 &amp; 3 colleges.</p><p style="font-size:13px;color:#0D9488;margin-top:8px;font-weight:600">Let us show you around in 60 seconds 🚀</p></div>`,
            showButtons: ['next', 'close'],
            nextBtnText: "Let's Go! →",
            align: 'center',
          }
        },
        {
          element: '[data-tour="bridge-score"]',
          popover: {
            title: '🎯 Your BRIDGE Score',
            description: `<p style="font-size:13px;color:#44445A;line-height:1.6">This is your <strong>placement readiness score</strong> out of 1000.</p><div style="background:#F0FDFA;border-radius:8px;padding:10px;margin-top:8px"><p style="font-size:12px;color:#0D9488;margin:0">📈 Score improves every time you:<br/>• Complete a mock interview<br/>• Practice GD topics<br/>• Use communication coach</p></div><p style="font-size:12px;color:#8888A0;margin-top:8px">Recruiters can see your score!</p>`,
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-tour="smart-interview"]',
          popover: {
            title: '📄 Smart Interview',
            description: `<p style="font-size:13px;color:#44445A;line-height:1.6">Upload your <strong>resume + job description</strong> for a 100% personalized interview.</p><div style="background:#F0FDFA;border-radius:8px;padding:10px;margin-top:8px"><p style="font-size:12px;color:#0D9488;margin:0">✨ AI reads your resume and asks questions about YOUR projects, YOUR experience, YOUR skills.<br/><br/>Also gives your <strong>Placement Chance %</strong></p></div>`,
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-tour="gd-practice"]',
          popover: {
            title: '🗣️ GD Practice',
            description: `<p style="font-size:13px;color:#44445A;line-height:1.6">Practice <strong>Group Discussions</strong> with AI-generated talking points.</p><div style="background:#F0FDFA;border-radius:8px;padding:10px;margin-top:8px"><p style="font-size:12px;color:#0D9488;margin:0">🎯 For each GD topic you get:<br/>• Strong arguments (For &amp; Against)<br/>• Power phrases to impress<br/>• How to open the discussion<br/>• Example arguments to use</p></div>`,
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-tour="pulse"]',
          popover: {
            title: '⚡ PULSE Feed',
            description: `<p style="font-size:13px;color:#44445A;line-height:1.6">Real-time <strong>placement intelligence</strong> updated daily.</p><div style="background:#F0FDFA;border-radius:8px;padding:10px;margin-top:8px"><p style="font-size:12px;color:#0D9488;margin:0">📰 Every morning at 6 AM:<br/>• Fresh placement news by domain<br/>• Today's GD topic with pros/cons<br/>• AI interview tips<br/>• Company hiring trends</p></div>`,
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-tour="jobs"]',
          popover: {
            title: '💼 Jobs & Internships',
            description: `<p style="font-size:13px;color:#44445A;line-height:1.6">Get <strong>job recommendations</strong> matched to your resume profile.</p><div style="background:#F0FDFA;border-radius:8px;padding:10px;margin-top:8px"><p style="font-size:12px;color:#0D9488;margin:0">📊 Each job shows:<br/>• Your profile match %<br/>• Interview probability<br/>• AI-generated cover letter<br/>• Application tracker</p></div>`,
            side: 'right',
            align: 'start',
          }
        },
        {
          element: '[data-tour="leaderboard"]',
          popover: {
            title: '🏆 Leaderboard',
            description: `<p style="font-size:13px;color:#44445A;line-height:1.6">See where you stand among <strong>students across India</strong>.</p><div style="background:#F0FDFA;border-radius:8px;padding:10px;margin-top:8px"><p style="font-size:12px;color:#0D9488;margin:0">🎖️ Top performers get:<br/>• Featured to recruiters<br/>• Achievement badges<br/>• College ranking</p></div>`,
            side: 'right',
            align: 'start',
          }
        },
        {
          popover: {
            title: "🚀 You're all set!",
            description: `<div style="text-align:center;padding:8px 0"><div style="font-size:48px;margin-bottom:12px">🎯</div><p style="font-size:14px;color:#44445A;line-height:1.6;margin-bottom:12px">Start your first <strong>AI Mock Interview</strong> to get your BRIDGE Score!</p><div style="background:linear-gradient(135deg,#0D9488,#14B8A6);border-radius:10px;padding:12px;color:white"><p style="font-size:13px;margin:0">💡 Pro tip: Do 3 interviews this week<br/>to see massive improvement in your score</p></div></div>`,
            showButtons: ['previous', 'done'],
            doneBtnText: 'Start Practicing! 🚀',
            align: 'center',
          }
        }
      ]
    });

    driverObj.drive();
  };

  return null;
}
