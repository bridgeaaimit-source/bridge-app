"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  doc, getDoc, setDoc, updateDoc, addDoc,
  collection, query, orderBy, limit, getDocs,
  serverTimestamp, increment, where
} from "firebase/firestore";
import { useAuthBypass } from "@/hooks/useAuthBypass";
import { useScreenLock } from "@/hooks/useScreenLock";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import {
  Brain, Clock, Zap, Trophy, ChevronRight, BarChart2,
  CheckCircle, XCircle, SkipForward, Target, Flame, Award,
  Play, RotateCcw, Shield, AlertTriangle, HelpCircle, Lock,
  RefreshCw, Check, ArrowRight, User, AlertCircle, Calendar, Sparkles
} from "lucide-react";

// ─── COMPANY CONFIGURATIONS ──────────────────────────────────────────
const COMPANIES = {
  tcs: {
    name: "TCS",
    domain: "tcs.com",
    duration: 50, // mins
    sections: { quant: 10, lr: 10, verbal: 6 },
    difficulty: "Easy-Medium",
    tag: "Highest Hiring",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20"
  },
  infosys: {
    name: "Infosys",
    domain: "infosys.com",
    duration: 35,
    sections: { quant: 8, lr: 8, verbal: 5, di: 3 },
    difficulty: "Medium",
    tag: "Popular",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
  },
  wipro: {
    name: "Wipro",
    domain: "wipro.com",
    duration: 40,
    sections: { quant: 8, lr: 8, verbal: 4 },
    difficulty: "Easy-Medium",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  deloitte: {
    name: "Deloitte",
    domain: "deloitte.com",
    duration: 45,
    sections: { quant: 8, lr: 8, di: 5, ga: 4 },
    difficulty: "Medium-Hard",
    tag: "Popular",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  cognizant: {
    name: "Cognizant",
    domain: "cognizant.com",
    duration: 40,
    sections: { quant: 8, lr: 8, verbal: 5, ga: 4 },
    difficulty: "Medium",
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20"
  },
  accenture: {
    name: "Accenture",
    domain: "accenture.com",
    duration: 45,
    sections: { quant: 10, lr: 10, verbal: 6, di: 4 },
    difficulty: "Medium",
    tag: "Highest Hiring",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  },
  capgemini: {
    name: "Capgemini",
    domain: "capgemini.com",
    duration: 35,
    sections: { quant: 10, lr: 10, verbal: 5 },
    difficulty: "Medium",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
  },
  techmahindra: {
    name: "Tech Mahindra",
    domain: "techmahindra.com",
    duration: 30,
    sections: { quant: 8, lr: 8, verbal: 4 },
    difficulty: "Easy-Medium",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  }
};

const SECTION_LABELS = {
  quant: "Quantitative Aptitude",
  lr: "Logical Reasoning",
  verbal: "Verbal / English",
  di: "Data Interpretation",
  ga: "General Awareness",
};

export default function AptitudePage() {
  const { isBypassed, mockUserData } = useAuthBypass();
  const [user, setUser] = useState(null);
  
  // Stages: home | loading-test | test | results
  const [stage, setStage] = useState("home"); 
  const [selectedCompanyKey, setSelectedCompanyKey] = useState("tcs");
  
  // Seeder State
  const [dbQuestionCount, setDbQuestionCount] = useState(null);
  const [seeding, setSeeding] = useState(false);
  
  // Dashboard / Leaderboard state
  const [bestScore, setBestScore] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [topScorers, setTopScorers] = useState([]);
  
  // Daily Challenge State
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [dailyStatus, setDailyStatus] = useState("unattempted"); // unattempted | correct | incorrect
  const [streakCalendar, setStreakCalendar] = useState([]); // Array of { date, completed }
  const [streakCount, setStreakCount] = useState(0);

  // Test state
  const [testQuestions, setTestQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]); // { selected, correct, skipped, section }
  const [selectedOption, setSelectedOption] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [currentDifficulty, setCurrentDifficulty] = useState(1);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(1800); // in seconds
  const [isTimeFrozen, setIsTimeFrozen] = useState(false);
  const [freezeDurationLeft, setFreezeDurationLeft] = useState(0);
  const timerRef = useRef(null);
  
  // Power-Ups States (Used once per session)
  const [powerUps, setPowerUps] = useState({
    fiftyFifty: false,
    timeFreeze: false,
    skip: false
  });
  const [fiftyFiftyOptions, setFiftyFiftyOptions] = useState([]); // indices of options to hide/disable

  // Daily Challenge Flow State
  const [isDailyChallengeMode, setIsDailyChallengeMode] = useState(false);

  // Results state
  const [results, setResults] = useState(null);
  const [aiInsight, setAiInsight] = useState("");
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Clearbit Logo error fallback helper
  const [logoErrors, setLogoErrors] = useState({});

  // Screen lock anti-cheat
  const handleTerminate = useCallback((reason) => {
    toast.error("Test terminated: " + reason);
    endTest(true);
  }, [answers, score, xp, testQuestions, timeLeft]);

  const {
    violations,
    showWarningModal,
    warningReason,
    resetWarning,
    maxViolations,
  } = useScreenLock({
    isActive: stage === "test",
    onTerminate: handleTerminate,
    maxViolations: 3,
  });

  // Auth setup
  useEffect(() => {
    if (isBypassed && mockUserData) {
      setUser(mockUserData.user);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
  }, [isBypassed, mockUserData]);

  // Main initializations
  useEffect(() => {
    if (!user) return;
    checkQuestionCount();
    loadDashboardData();
    loadDailyChallenge();
  }, [user]);

  // Timer loop for Test Stage
  useEffect(() => {
    if (stage !== "test") return;
    
    // Calculate tick speed based on Boss Battle
    const isBoss = (currentIndex + 1) % 10 === 0 && !isDailyChallengeMode;
    const intervalMs = isBoss ? 666 : 1000; // 1.5x tick speed on Boss Battle

    timerRef.current = setInterval(() => {
      // Manage Time Freeze
      if (isTimeFrozen) {
        setFreezeDurationLeft((prev) => {
          if (prev <= 1) {
            setIsTimeFrozen(false);
            toast("❄️ Time Freeze expired!", { icon: "⏳" });
            return 0;
          }
          return prev - 1;
        });
        return; // Skip ticking main clock
      }

      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          endTest(false);
          return 0;
        }
        return prev - 1;
      });
    }, intervalMs);

    return () => clearInterval(timerRef.current);
  }, [stage, currentIndex, isTimeFrozen, isDailyChallengeMode]);

  // Database helper: check if question bank is seeded
  const checkQuestionCount = async () => {
    try {
      const qRef = collection(db, 'questionBank');
      const qSnap = await getDocs(query(qRef, limit(10)));
      if (qSnap.empty) {
        setDbQuestionCount(0);
      } else {
        setDbQuestionCount(510);
      }
    } catch (e) {
      console.error("Failed to check question count:", e);
    }
  };

  // Seeder function
  const handleSeedDatabase = async () => {
    setSeeding(true);
    toast.loading("Generating 510 placement questions...", { id: "seeding" });
    try {
      const res = await fetch('/api/seed-questions');
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      
      if (data.questions && data.questions.length > 0) {
        toast.loading(`Writing 510 questions to Firestore...`, { id: "seeding" });
        const { writeBatch, doc: fsDoc } = await import('firebase/firestore');
        
        const batchLimit = 200;
        let batch = writeBatch(db);
        let count = 0;

        for (const q of data.questions) {
          const docRef = fsDoc(collection(db, 'questionBank'));
          batch.set(docRef, q);
          count++;
          
          if (count % batchLimit === 0) {
            await batch.commit();
            batch = writeBatch(db);
          }
        }

        if (count % batchLimit !== 0) {
          await batch.commit();
        }

        toast.success(`Successfully seeded ${count} questions!`, { id: "seeding" });
        setDbQuestionCount(count);
      } else {
        throw new Error("No questions returned");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to seed question bank.", { id: "seeding" });
    } finally {
      setSeeding(false);
    }
  };

  // Dashboard Loader
  const loadDashboardData = async () => {
    try {
      const uid = isBypassed ? "bypass-user" : user.uid;
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setBestScore(data.aptitudeBestScore || 0);
        setTotalXP(data.totalXP || 0);
        setStreakCount(data.streak || 0);
      }

      // Leaderboard: Fetch top 5 students in memory to avoid Firestore Index errors
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = [];
      usersSnap.forEach((doc) => {
        const u = doc.data();
        if (u.role === "student" || u.bridgeScore) {
          usersList.push({
            name: u.name || "Anonymous",
            college: u.college || "Unknown College",
            score: u.bridgeScore || 0,
            xp: u.totalXP || 0,
            photo: u.photo
          });
        }
      });
      // Sort and slice top 5
      const sorted = usersList
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      setTopScorers(sorted);
    } catch (e) {
      console.error("Load dashboard data error:", e);
    }
  };

  // Daily Challenge Loader
  const loadDailyChallenge = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const uid = isBypassed ? "bypass-user" : user.uid;

      // 1. Fetch or create Daily Challenge
      const challengeRef = doc(db, 'dailyChallenges', todayStr);
      const challengeSnap = await getDoc(challengeRef);
      let todayChallenge = null;

      if (challengeSnap.exists()) {
        todayChallenge = { id: challengeSnap.id, ...challengeSnap.data() };
      } else {
        // Fetch a random question from questionBank
        const qSnap = await getDocs(query(collection(db, 'questionBank'), limit(30)));
        if (!qSnap.empty) {
          const questions = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          const randomQ = questions[Math.floor(Math.random() * questions.length)];
          const newChallenge = {
            question: randomQ.question,
            options: randomQ.options,
            correct: randomQ.correct,
            explanation: randomQ.explanation,
            topic: randomQ.topic,
            section: randomQ.section,
            difficulty: randomQ.difficulty,
            date: todayStr
          };
          await setDoc(challengeRef, newChallenge);
          todayChallenge = { id: todayStr, ...newChallenge };
        }
      }

      setDailyChallenge(todayChallenge);

      // 2. Fetch User Submission for Today
      const subRef = doc(db, 'dailyChallengeSubmissions', `${uid}_${todayStr}`);
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        setDailyStatus(subSnap.data().correct ? "correct" : "incorrect");
      } else {
        setDailyStatus("unattempted");
      }

      // 3. Load 7-Day Streak Calendar
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const calendarData = [];
      for (const dateStr of last7Days) {
        const daySubRef = doc(db, 'dailyChallengeSubmissions', `${uid}_${dateStr}`);
        const daySubSnap = await getDoc(daySubRef);
        calendarData.push({
          date: dateStr,
          completed: daySubSnap.exists() && daySubSnap.data().correct
        });
      }
      setStreakCalendar(calendarData);

    } catch (e) {
      console.error("Load daily challenge error:", e);
    }
  };

  // ─── START TEST ───
  const handleStartTest = async (companyKey, isDaily = false) => {
    setStage("loading-test");
    setIsDailyChallengeMode(isDaily);
    
    try {
      if (isDaily) {
        if (!dailyChallenge) {
          toast.error("Daily challenge not available yet.");
          setStage("home");
          return;
        }
        setTestQuestions([dailyChallenge]);
        setCurrentIndex(0);
        setAnswers([]);
        setSelectedOption(null);
        setShowExplanation(false);
        setScore(0);
        setXp(0);
        setStreak(0);
        setTimeLeft(60); // 60 seconds limit
        setStage("test");
        return;
      }

      // Load company paper using questionSelector
      const companyConfig = COMPANIES[companyKey];
      const { selectQuestions } = await import('@/lib/questionSelector');
      
      const loadedQs = [];
      const seenIds = []; // we can retrieve seen IDs from user history if desired, starting empty for now

      for (const [secName, secCount] of Object.entries(companyConfig.sections)) {
        const sectionQs = await selectQuestions(companyKey, secName, secCount, seenIds);
        loadedQs.push(...sectionQs);
      }

      if (loadedQs.length === 0) {
        toast.error("Failed to fetch questions. Please make sure the database is seeded.");
        setStage("home");
        return;
      }

      setTestQuestions(loadedQs);
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedOption(null);
      setShowExplanation(false);
      setScore(0);
      setXp(0);
      setStreak(0);
      setCurrentDifficulty(1);
      setConsecutiveCorrect(0);
      setResults(null);
      setAiInsight("");
      setPowerUps({ fiftyFifty: false, timeFreeze: false, skip: false });
      setFiftyFiftyOptions([]);
      setIsTimeFrozen(false);
      setFreezeDurationLeft(0);
      setTimeLeft(companyConfig.duration * 60);
      setStage("test");

    } catch (error) {
      console.error("Start test error:", error);
      toast.error("Error building test paper.");
      setStage("home");
    }
  };

  // ─── ANSWER TRIGGER ───
  const handleAnswerOption = (optIdx) => {
    if (selectedOption !== null) return;
    const q = testQuestions[currentIndex];
    const isCorrect = optIdx === q.correct;
    setSelectedOption(optIdx);
    setShowExplanation(true);

    const newAnswers = [...answers, { selected: optIdx, correct: isCorrect, skipped: false, section: q.section }];
    setAnswers(newAnswers);

    if (isCorrect) {
      // Visual feedback
      if ((currentIndex + 1) % 10 === 0 && !isDailyChallengeMode) {
        // Boss battle victory confetti!
        confetti({ particleCount: 60, spread: 60, colors: ['#EF4444', '#0D9488', '#F59E0B'] });
        toast.success("💥 BOSS DEFEATED! +50 XP Double Bounty!");
        setXp(prev => prev + 50);
      } else if (isDailyChallengeMode) {
        confetti({ particleCount: 80, spread: 80, colors: ['#0D9488', '#F59E0B'] });
        toast.success("🎉 Daily Challenge Completed! +100 XP!");
        setXp(100);
      } else {
        const baseXP = q.difficulty === 1 ? 10 : q.difficulty === 2 ? 20 : 30;
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        let bonusXP = 0;
        if (newStreak === 3) { bonusXP = 5; toast.success("🔥 3 Streaks! +5 Bonus XP"); }
        if (newStreak === 5) { bonusXP = 10; toast.success("🔥 5 Streaks! +10 Bonus XP"); }
        if (newStreak >= 10 && newStreak % 5 === 0) { 
          bonusXP = 20; 
          confetti({ particleCount: 30, spread: 40 });
          toast.success(`🔥 ${newStreak} Streaks! +20 Bonus XP`); 
        }

        setXp(prev => prev + baseXP + bonusXP);
      }

      setScore(prev => prev + 4);
      setConsecutiveCorrect(prev => prev + 1);

      // Adaptive difficulty progression
      if (consecutiveCorrect + 1 >= 3 && currentDifficulty < 3) {
        setCurrentDifficulty(prev => prev + 1);
        setConsecutiveCorrect(0);
        toast("📈 Difficulty Level Up!", { icon: "🚀" });
      }
    } else {
      // Incorrect Answer
      setScore(prev => Math.max(0, prev - 1));
      setStreak(0);
      setConsecutiveCorrect(0);
      
      if (currentDifficulty > 1) {
        setCurrentDifficulty(prev => prev - 1);
      }
    }
  };

  // ─── POWER UP ACTIONS ───
  const triggerFiftyFifty = () => {
    if (powerUps.fiftyFifty || selectedOption !== null) return;
    const q = testQuestions[currentIndex];
    
    // Gather incorrect option indices
    const incorrectIndices = q.options
      .map((_, idx) => idx)
      .filter(idx => idx !== q.correct);
      
    // Randomly pick two incorrect ones to hide
    const shuffleIncorrect = incorrectIndices.sort(() => Math.random() - 0.5);
    const toDisable = [shuffleIncorrect[0], shuffleIncorrect[1]];
    
    setFiftyFiftyOptions(toDisable);
    setPowerUps(prev => ({ ...prev, fiftyFifty: true }));
    toast.success("🔮 50/50 Used! Two incorrect options removed.");
  };

  const triggerTimeFreeze = () => {
    if (powerUps.timeFreeze || selectedOption !== null) return;
    setIsTimeFrozen(true);
    setFreezeDurationLeft(60); // 60 seconds freeze
    setPowerUps(prev => ({ ...prev, timeFreeze: true }));
    toast.success("❄️ Time Freeze! Clock stopped for 60 seconds.");
  };

  const triggerSkip = () => {
    if (powerUps.skip || selectedOption !== null) return;
    setPowerUps(prev => ({ ...prev, skip: true }));
    toast("⏭️ Question skipped!", { icon: "💨" });
    
    setAnswers([...answers, { selected: -1, correct: false, skipped: true, section: testQuestions[currentIndex].section }]);
    setStreak(0);
    setConsecutiveCorrect(0);
    
    handleNextQuestion();
  };

  // ─── NEXT QUESTION ───
  const handleNextQuestion = () => {
    if (currentIndex + 1 >= testQuestions.length) {
      endTest(false);
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setFiftyFiftyOptions([]);
    }
  };

  // ─── END TEST & RESULT PROCESSING ───
  const endTest = useCallback(async (terminated = false) => {
    clearInterval(timerRef.current);
    
    const totalAnswered = answers.filter((a) => !a.skipped).length;
    const correctCount = answers.filter((a) => a.correct).length;
    const wrongCount = answers.filter((a) => !a.correct && !a.skipped).length;
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    const timeTaken = isDailyChallengeMode ? (60 - timeLeft) : (COMPANIES[selectedCompanyKey].duration * 60 - timeLeft);
    
    // Save Daily Challenge outcome separately
    if (isDailyChallengeMode) {
      const isCorrect = answers[0]?.correct || false;
      const todayStr = new Date().toISOString().split('T')[0];
      const uid = isBypassed ? "bypass-user" : user?.uid;
      
      if (uid) {
        try {
          const subRef = doc(db, 'dailyChallengeSubmissions', `${uid}_${todayStr}`);
          await setDoc(subRef, {
            uid,
            date: todayStr,
            correct: isCorrect,
            timestamp: serverTimestamp()
          });

          // Update Streak and XP in user profile
          const userRef = doc(db, "users", uid);
          await updateDoc(userRef, {
            totalXP: increment(isCorrect ? 100 : 10),
            streak: increment(isCorrect ? 1 : 0)
          });
        } catch (err) {
          console.error("Daily challenge save error:", err);
        }
      }

      toast(isCorrect ? "🎯 Challenge Solved! +100 XP Added!" : "💡 Challenge complete. Check explanation!", { icon: "✨" });
      setStage("home");
      loadDashboardData();
      loadDailyChallenge();
      return;
    }

    // Process Regular Company Test Results
    const sectionScores = {};
    Object.keys(COMPANIES[selectedCompanyKey].sections).forEach((sec) => {
      const secAnswers = answers.filter((a) => a.section === sec && !a.skipped);
      const secCorrect = secAnswers.filter((a) => a.correct).length;
      sectionScores[sec] = secAnswers.length > 0 ? Math.round((secCorrect / secAnswers.length) * 100) : 0;
    });

    // Identify Weakest Topic based on wrong answers
    const wrongQs = testQuestions.filter((q, idx) => answers[idx] && !answers[idx].correct && !answers[idx].skipped);
    const topicMisses = {};
    wrongQs.forEach(q => {
      topicMisses[q.topic] = (topicMisses[q.topic] || 0) + 1;
    });
    
    let weakestTopic = "Quantitative Ratios";
    let maxMisses = 0;
    Object.entries(topicMisses).forEach(([topic, count]) => {
      if (count > maxMisses) {
        maxMisses = count;
        weakestTopic = topic;
      }
    });

    const level = accuracy >= 85 ? "Expert" : accuracy >= 65 ? "Intermediate" : "Beginner";
    const percentiles = [87, 91, 93, 94, 96, 98];
    const userPercentile = percentiles[Math.min(5, Math.floor(accuracy / 18))];

    const resultData = {
      score: Math.max(0, score),
      maxScore: testQuestions.length * 4,
      correct: correctCount,
      wrong: wrongCount,
      skipped: answers.filter((a) => a.skipped).length,
      accuracy,
      timeTaken,
      xpEarned: xp,
      sectionScores,
      level,
      percentile: userPercentile,
      weakestTopic,
      terminated,
      totalQuestions: testQuestions.length,
    };

    setResults(resultData);
    setStage("results");
    
    // Confetti on test success
    if (accuracy >= 60) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    // Save Score & updates to Firestore
    try {
      const uid = isBypassed ? "bypass-user" : user?.uid;
      if (uid) {
        await addDoc(collection(db, "aptitudeScores"), {
          uid,
          name: user?.displayName || "Test User",
          company: selectedCompanyKey,
          score: resultData.score,
          correct: correctCount,
          wrong: wrongCount,
          accuracy,
          xpEarned: xp,
          timeTaken,
          sectionsAttempted: Object.keys(COMPANIES[selectedCompanyKey].sections),
          completedAt: serverTimestamp(),
        });

        // Update User Doc Profile
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const newBest = Math.max(userData.aptitudeBestScore || 0, resultData.score);
          const newXP = (userData.totalXP || 0) + xp;
          const interviewAvg = userData.avgScore || 0;
          const userStreak = userData.streak || 0;
          const bridgeScore = Math.min(1000, Math.round(newBest * 0.3 + interviewAvg * 0.5 + userStreak * 2));
          
          await updateDoc(userRef, {
            aptitudeBestScore: newBest,
            totalXP: newXP,
            bridgeScore,
            lastAptitudeDate: new Date().toISOString(),
          });
          setBestScore(newBest);
          setTotalXP(newXP);
        }
      }
    } catch (e) {
      console.error("Score save error:", e);
    }

    // Fetch AI insights from Claude API
    setLoadingInsight(true);
    try {
      const res = await fetch("/api/aptitude-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionScores, accuracy, level, userId: user?.uid }),
      });
      const data = await res.json();
      setAiInsight(data.insight);
    } catch (e) {
      setAiInsight("Excellent focus on details. Keep practicing daily to reinforce concepts and decrease time per question.");
    } finally {
      setLoadingInsight(false);
    }
  }, [answers, score, xp, testQuestions, timeLeft, user, isBypassed, selectedCompanyKey, isDailyChallengeMode]);

  return (
    <AppShell>
      <div className="min-h-screen bg-[#0B1315] text-[#F3F4F6] font-sans selection:bg-teal-500 selection:text-white">
        
        {/* Anti-Cheat Warning Modal */}
        {showWarningModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#121E21] border border-red-500/40 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-amber-500"></div>
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mb-6">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Tab Switch Detected!</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Warning <span className="text-red-500 font-bold">{violations}</span> of <span className="text-gray-200 font-semibold">{maxViolations}</span>.
                Leaving the screen or changing windows during the placement test is strictly monitored. Reaching {maxViolations} violations will trigger auto-submission!
              </p>
              <button
                id="btn-anti-cheat-dismiss"
                onClick={resetWarning}
                className="w-full py-3 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-red-600/20 transition duration-150"
              >
                I Understand, Return to Test
              </button>
            </div>
          </div>
        )}

        {/* ─── STAGE 1: HOME ─── */}
        {stage === "home" && (
          <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
            
            {/* Database Empty Seeder Notice */}
            {dbQuestionCount === 0 && (
              <div className="bg-gradient-to-r from-teal-950/40 to-cyan-950/40 border border-teal-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-36 h-36 bg-teal-500/5 rounded-full blur-3xl"></div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Database Initialization Required</h4>
                    <p className="text-sm text-teal-300/80">Local question bank is empty. Seed 510 unique placement-style questions to get started.</p>
                  </div>
                </div>
                <button
                  id="btn-seed-db"
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-teal-600/35 transition duration-150 shrink-0 whitespace-nowrap"
                >
                  {seeding ? "Seeding..." : "Seed 510 Questions"}
                </button>
              </div>
            )}

            {/* Header & Stats Dashboard */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Aptitude <span className="text-teal-400">Arena</span>
                </h1>
                <p className="text-gray-400 text-sm mt-1">Crushing Indian placement rounds, gamified & adaptive.</p>
              </div>
              
              <div className="flex items-center gap-4 self-stretch md:self-auto bg-[#121E21] border border-teal-500/10 p-3 px-5 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 border-r border-teal-500/15 pr-4">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <div>
                    <div className="text-xs text-gray-500">Streak</div>
                    <div className="text-sm font-bold text-white">{streakCount} Days</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-r border-teal-500/15 pr-4">
                  <Award className="w-5 h-5 text-teal-400" />
                  <div>
                    <div className="text-xs text-gray-500">Total XP</div>
                    <div className="text-sm font-bold text-white">{totalXP}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  <div>
                    <div className="text-xs text-gray-500">Best Score</div>
                    <div className="text-sm font-bold text-white">{bestScore} pts</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Challenge & Leaderboard Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Daily Challenge Card */}
              <div className="lg:col-span-2 bg-[#121E21] border border-teal-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-full blur-2xl pointer-events-none"></div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs font-semibold text-amber-400 tracking-wider uppercase flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 fill-amber-400" /> Daily Bounty Challenge
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <h3 className="text-xl font-bold text-white">Daily Aptitude Challenge</h3>
                    <p className="text-sm text-gray-400 max-w-xl">
                      Solve today's adaptive question in 60 seconds to lock in your daily streak and earn a double XP bounty (+100 XP).
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 pt-4 border-t border-teal-500/5">
                  {/* Calendar streak map */}
                  <div className="flex items-center gap-2">
                    {streakCalendar.map((day, idx) => {
                      const dayLetter = ["S", "M", "T", "W", "T", "F", "S"][new Date(day.date).getDay()];
                      return (
                        <div key={day.date} className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                            day.completed 
                              ? "bg-teal-500/20 border-teal-500 text-teal-400 shadow-md shadow-teal-500/10" 
                              : day.date === new Date().toISOString().split('T')[0]
                                ? "bg-amber-500/15 border-amber-500/50 text-amber-500"
                                : "bg-[#0B1315] border-gray-800 text-gray-600"
                          }`}>
                            {day.completed ? <Check className="w-4 h-4 stroke-[3px]" /> : <span className="text-xs font-bold">{dayLetter}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {dailyStatus === "unattempted" ? (
                    <button
                      id="btn-start-daily-challenge"
                      onClick={() => handleStartTest(null, true)}
                      className="px-6 py-3 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-teal-600/30 transition duration-150 flex items-center justify-center gap-2"
                    >
                      Attempt Daily Challenge <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-teal-400 font-semibold bg-teal-500/10 border border-teal-500/20 px-4 py-2.5 rounded-xl text-sm self-center">
                      <CheckCircle className="w-4 h-4" /> Challenge Done Today (+100 XP)
                    </div>
                  )}
                </div>

              </div>

              {/* Leaderboard Card */}
              <div className="bg-[#121E21] border border-teal-500/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-amber-400" /> Leaderboard (Top 5 Today)
                  </h3>
                  
                  <div className="space-y-3.5">
                    {topScorers.length > 0 ? (
                      topScorers.map((scorer, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-3 p-2 bg-[#0B1315]/40 rounded-xl border border-teal-500/5">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 text-center font-bold text-sm ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-gray-400" : "text-gray-500"}`}>
                              {idx + 1}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-teal-600/15 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-sm overflow-hidden uppercase">
                              {scorer.photo ? <img src={scorer.photo} alt={scorer.name} /> : scorer.name.charAt(0)}
                            </div>
                            <div className="max-w-[120px] md:max-w-none">
                              <div className="text-sm font-bold text-white truncate">{scorer.name}</div>
                              <div className="text-xs text-gray-500 truncate">{scorer.college}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-teal-400">{scorer.score}</span>
                            <span className="text-[10px] text-gray-500 block">Bridge Rating</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No scores recorded yet today. Be the first!
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Company selector Mode grid */}
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-teal-500/10 pb-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BuildingIcon className="w-5 h-5 text-teal-400" /> Select Company Test Mode
                </h2>
                <span className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1 rounded-full">
                  Adaptive Mock Tests
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(COMPANIES).map(([key, comp]) => {
                  const hasLogoError = logoErrors[key];
                  const domainName = comp.domain;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedCompanyKey(key)}
                      className={`cursor-pointer rounded-2xl p-5 border relative overflow-hidden transition-all duration-200 ${
                        selectedCompanyKey === key 
                          ? "bg-[#142629] border-teal-400 shadow-teal-500/10 shadow-2xl scale-[1.02]" 
                          : "bg-[#121E21] border-teal-500/10 hover:border-teal-500/25 hover:scale-[1.01]"
                      }`}
                    >
                      {comp.tag && (
                        <span className={`absolute top-0 right-0 px-3 py-0.5 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider ${
                          comp.tag === "Highest Hiring" 
                            ? "bg-teal-600 text-white" 
                            : "bg-amber-600 text-white"
                        }`}>
                          {comp.tag}
                        </span>
                      )}

                      <div className="flex items-center gap-3.5 mb-4">
                        {/* Company Logo Image or initials */}
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-gray-800/20">
                          {hasLogoError ? (
                            <div className="w-full h-full bg-teal-800 flex items-center justify-center text-white font-bold text-base uppercase">
                              {comp.name.charAt(0)}
                            </div>
                          ) : (
                            <img
                              src={`https://logo.clearbit.com/${domainName}`}
                              alt={comp.name}
                              className="w-7 h-7 object-contain"
                              onError={() => setLogoErrors(prev => ({ ...prev, [key]: true }))}
                            />
                          )}
                        </div>

                        <div>
                          <h4 className="font-bold text-white text-base">{comp.name}</h4>
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest block">Placement Mock</span>
                        </div>
                      </div>

                      {/* Test pattern metrics */}
                      <div className="space-y-3 pt-3 border-t border-teal-500/5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Questions:</span>
                          <span className="font-semibold text-white">
                            {Object.values(comp.sections).reduce((a, b) => a + b, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Duration:</span>
                          <span className="font-semibold text-white">{comp.duration} Mins</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Difficulty:</span>
                          <span className="font-semibold text-teal-400">{comp.difficulty}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1">
                        {Object.keys(comp.sections).map((sec) => (
                          <span key={sec} className="text-[9px] font-medium bg-[#0B1315] border border-teal-500/5 text-teal-300 px-2 py-0.5 rounded-md uppercase">
                            {sec}
                          </span>
                        ))}
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Start CTA Button */}
              <div className="pt-4 flex justify-center">
                <button
                  id="btn-start-placement-test"
                  onClick={() => handleStartTest(selectedCompanyKey)}
                  className="px-10 py-4 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-extrabold text-base rounded-xl shadow-xl shadow-teal-600/30 transition duration-150 flex items-center gap-3 animate-pulse hover:animate-none"
                >
                  Start {COMPANIES[selectedCompanyKey].name} Placement Test <Play className="w-5 h-5 fill-white" />
                </button>
              </div>

            </div>

          </div>
        )}

        {/* ─── STAGE 2: LOADING TEST ─── */}
        {stage === "loading-test" && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-teal-500/10 border-t-teal-400 animate-spin"></div>
              <Brain className="w-10 h-10 text-teal-400 animate-bounce" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-lg font-bold text-white">Assembling Placement Paper...</h3>
              <p className="text-sm text-gray-500">
                Fetching matching questions from the {COMPANIES[selectedCompanyKey]?.name || "Daily"} question pool.
              </p>
            </div>
          </div>
        )}

        {/* ─── STAGE 3: TEST SCREEN ─── */}
        {stage === "test" && (() => {
          const q = testQuestions[currentIndex];
          const isBoss = (currentIndex + 1) % 10 === 0 && !isDailyChallengeMode;
          const isLast = currentIndex + 1 === testQuestions.length;

          return (
            <div className={`p-4 md:p-8 max-w-4xl mx-auto space-y-6 min-h-[90vh] transition-all duration-500 ${
              isBoss ? "bg-gradient-to-b from-[#1E0909] to-[#0B0909]" : ""
            }`}>
              
              {/* HUD Bar */}
              <div className={`rounded-2xl border p-4 px-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                isBoss 
                  ? "bg-[#2A1010] border-red-500/40 text-red-100 shadow-red-500/5" 
                  : "bg-[#121E21] border-teal-500/10 text-white"
              }`}>
                
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {!isDailyChallengeMode && (
                      <img
                        src={`https://logo.clearbit.com/${COMPANIES[selectedCompanyKey].domain}`}
                        alt="logo"
                        className="w-5 h-5 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-tight uppercase">
                      {isDailyChallengeMode ? "Daily Challenge" : COMPANIES[selectedCompanyKey].name}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold border ${
                      isBoss 
                        ? "bg-red-500/20 border-red-500/30 text-red-400" 
                        : "bg-teal-500/10 border-teal-500/20 text-teal-400"
                    }`}>
                      {isBoss ? "BOSS BATTLE (2x XP)" : `Section: ${SECTION_LABELS[q?.section] || q?.section}`}
                    </span>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                  
                  {/* Streak */}
                  {streak > 1 && !isDailyChallengeMode && (
                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 p-1 px-3 rounded-full text-xs font-bold text-amber-400 animate-pulse">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" /> {streak} Streak
                    </div>
                  )}

                  {/* XP Counter */}
                  <div className="text-xs font-bold bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-full text-teal-400">
                    +{xp} XP
                  </div>

                  {/* Power-ups Row */}
                  {!isDailyChallengeMode && (
                    <div className="flex items-center gap-1.5 border-l border-gray-800 pl-4">
                      
                      {/* Fifty Fifty */}
                      <button
                        id="btn-power-fifty"
                        onClick={triggerFiftyFifty}
                        disabled={powerUps.fiftyFifty || selectedOption !== null}
                        className={`p-2 rounded-lg border transition ${
                          powerUps.fiftyFifty 
                            ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed" 
                            : "bg-[#0B1315] border-teal-500/20 hover:border-teal-400 text-teal-400 hover:bg-[#121E21]"
                        }`}
                        title="🔮 50/50: Hides two incorrect options"
                      >
                        <HelpCircle className="w-4 h-4" />
                      </button>

                      {/* Time Freeze */}
                      <button
                        id="btn-power-freeze"
                        onClick={triggerTimeFreeze}
                        disabled={powerUps.timeFreeze || selectedOption !== null}
                        className={`p-2 rounded-lg border relative transition ${
                          powerUps.timeFreeze 
                            ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed" 
                            : "bg-[#0B1315] border-teal-500/20 hover:border-teal-400 text-teal-400 hover:bg-[#121E21]"
                        }`}
                        title="❄️ Time Freeze: Stops clock for 60 seconds"
                      >
                        <Clock className="w-4 h-4" />
                        {isTimeFrozen && (
                          <span className="absolute -top-1 -right-1 bg-cyan-500 text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {freezeDurationLeft}
                          </span>
                        )}
                      </button>

                      {/* Skip */}
                      <button
                        id="btn-power-skip"
                        onClick={triggerSkip}
                        disabled={powerUps.skip || selectedOption !== null}
                        className={`p-2 rounded-lg border transition ${
                          powerUps.skip 
                            ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed" 
                            : "bg-[#0B1315] border-teal-500/20 hover:border-teal-400 text-teal-400 hover:bg-[#121E21]"
                        }`}
                        title="⏭️ Skip: Jump to next question instantly"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                    </div>
                  )}

                  {/* Section timer */}
                  <div className={`p-2 px-4 rounded-xl font-mono font-bold text-sm tracking-widest border ${
                    isBoss 
                      ? "bg-red-500/10 border-red-500/40 text-red-500 shadow-md shadow-red-500/10" 
                      : isTimeFrozen
                        ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse"
                        : "bg-[#0B1315] border-teal-500/20 text-teal-400"
                  }`}>
                    {isTimeFrozen ? `FROZEN` : formatTime(timeLeft)}
                  </div>

                </div>

              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-900 h-2.5 rounded-full overflow-hidden border border-gray-800 relative">
                <div
                  className={`h-full transition-all duration-300 ${
                    isBoss ? "bg-gradient-to-r from-red-600 to-rose-500" : "bg-gradient-to-r from-teal-500 to-cyan-400"
                  }`}
                  style={{ width: `${((currentIndex + 1) / testQuestions.length) * 100}%` }}
                ></div>
              </div>

              {/* Question Card */}
              <div className={`rounded-3xl border p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
                isBoss 
                  ? "bg-[#1A0E0E] border-red-500/20 shadow-red-950/20" 
                  : "bg-[#121E21] border-teal-500/10 shadow-black/40"
              }`}>
                {/* Topic breadcrumb */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    Topic: {q?.topic || "General"}
                  </span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    q?.difficulty === 1 ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                    q?.difficulty === 2 ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                    "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    Diff: {q?.difficulty === 1 ? "Easy" : q?.difficulty === 2 ? "Medium" : "Hard"}
                  </span>
                </div>

                {/* Boss Battle visual cue */}
                {isBoss && (
                  <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-xs text-red-400 animate-pulse">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <strong>ELITE CHALLENGE:</strong> Ticking 1.5x speed. Defeat Goliath for a double XP reward!
                  </div>
                )}

                {/* Question Text */}
                <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed mb-8 whitespace-pre-line">
                  {currentIndex + 1}. {q?.question}
                </h2>

                {/* Options Box */}
                <div className="grid grid-cols-1 gap-4">
                  {q?.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === q.correct;
                    const showCorrect = selectedOption !== null && isCorrect;
                    const showWrong = selectedOption !== null && isSelected && !isCorrect;
                    
                    // 50/50 power-up hides/disables options
                    const isFiftyFiftyHidden = fiftyFiftyOptions.includes(idx);

                    if (isFiftyFiftyHidden) {
                      return (
                        <div
                          key={idx}
                          className="py-4 px-6 rounded-xl border border-dashed border-gray-800 text-gray-700 bg-transparent text-sm flex items-center gap-2 select-none"
                        >
                          <Lock className="w-3.5 h-3.5 text-gray-800" /> Option eliminated by 50/50
                        </div>
                      );
                    }

                    return (
                      <button
                        key={idx}
                        id={`opt-btn-${idx}`}
                        onClick={() => handleAnswerOption(idx)}
                        disabled={selectedOption !== null}
                        className={`w-full py-4 px-6 text-left rounded-2xl border text-sm md:text-base transition duration-150 flex items-center justify-between ${
                          showCorrect 
                            ? "bg-green-500/10 border-green-500 text-green-400 font-semibold" 
                            : showWrong 
                              ? "bg-red-500/10 border-red-500 text-red-400 font-semibold"
                              : selectedOption !== null 
                                ? "bg-gray-900/40 border-gray-800 text-gray-500 cursor-default" 
                                : "bg-[#0B1315] border-teal-500/10 hover:border-teal-400 text-gray-200 hover:bg-[#121E21]"
                        }`}
                      >
                        <span>{opt}</span>
                        {showCorrect && <CheckCircle className="w-5 h-5 text-green-500 shrink-0 ml-2" />}
                        {showWrong && <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>

                {/* Immediate Explanation Drawer */}
                {showExplanation && (
                  <div className="mt-8 pt-6 border-t border-teal-500/10 space-y-3 animate-in slide-in-from-bottom duration-300">
                    <h4 className="text-sm font-bold text-teal-400 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4" /> Explanation & Methodology
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
                      {q?.explanation}
                    </p>
                    
                    <div className="pt-4 flex justify-end">
                      <button
                        id="btn-next-question"
                        onClick={handleNextQuestion}
                        className="px-6 py-3 bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-bold rounded-xl shadow-md shadow-teal-600/25 transition duration-150 flex items-center gap-1.5 text-sm"
                      >
                        {isLast ? "Finish Test" : "Next Question"} <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

              </div>

            </div>
          );
        })()}

        {/* ─── STAGE 4: RESULTS ─── */}
        {stage === "results" && results && (
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            
            {/* Header banner */}
            <div className="text-center space-y-2">
              <span className="px-3.5 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full text-xs font-semibold uppercase tracking-wider">
                Assessment Complete
              </span>
              <h2 className="text-3xl font-extrabold text-white">Placement Analysis Report</h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                Review your accuracy breakdown, weaknesses, and actionable placement checkpoints.
              </p>
            </div>

            {/* Score Ring & Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* score circle */}
              <div className="bg-[#121E21] border border-teal-500/10 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
                
                <div className="relative w-36 h-36 flex items-center justify-center mb-4">
                  {/* Outer circle track */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="stroke-[#0B1315] stroke-[10] fill-none"
                    />
                    <circle
                      cx="72"
                      cy="72"
                      r="60"
                      className="stroke-teal-500 stroke-[10] fill-none transition-all duration-1000"
                      strokeDasharray={377}
                      strokeDashoffset={377 - (377 * results.accuracy) / 100}
                    />
                  </svg>
                  
                  <div className="absolute flex flex-col items-center">
                    <span className="text-4xl font-black text-white">{results.accuracy}%</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Accuracy</span>
                  </div>
                </div>

                <h3 className="font-extrabold text-lg text-white">Score: {results.score} / {results.maxScore}</h3>
                <span className="text-xs text-gray-400 mt-1 block">Level Earned: {results.level}</span>
              </div>

              {/* Stats Summary Panel */}
              <div className="md:col-span-2 bg-[#121E21] border border-teal-500/10 rounded-3xl p-6 shadow-xl grid grid-cols-2 gap-6 items-center">
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 block uppercase font-semibold">XP Earned</span>
                  <div className="text-2xl font-black text-teal-400">+{results.xpEarned} XP</div>
                  <span className="text-[10px] text-gray-400 block">Total Rating Boost</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 block uppercase font-semibold">Percentile Rating</span>
                  <div className="text-2xl font-black text-cyan-400">Top {100 - results.percentile}%</div>
                  <span className="text-[10px] text-gray-400 block">Better than {results.percentile}% of applicants</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 block uppercase font-semibold">Time Performance</span>
                  <div className="text-2xl font-black text-white">
                    {Math.floor(results.timeTaken / 60)}m {results.timeTaken % 60}s
                  </div>
                  <span className="text-[10px] text-gray-400 block">Total active minutes</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-500 block uppercase font-semibold">Correct / Wrong</span>
                  <div className="text-2xl font-black text-white">
                    <span className="text-green-400">{results.correct}</span> / <span className="text-red-400">{results.wrong}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 block">Excludes {results.skipped} skips</span>
                </div>
              </div>

            </div>

            {/* AI Insights & Weak Topic Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Weakest Topic Drill */}
              <div className="bg-[#121E21] border border-teal-500/10 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-500" /> Target Weak Area
                </h3>

                <div className="p-4 bg-red-500/5 border border-red-500/15 rounded-2xl">
                  <div className="text-xs text-gray-500 block uppercase font-semibold">Weakest Identified Topic</div>
                  <div className="text-lg font-bold text-red-400 mt-1">{results.weakestTopic}</div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs text-gray-400 block font-bold uppercase">Recommended Drill Checklist:</span>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2.5 text-xs text-gray-300">
                      <div className="w-5 h-5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full flex items-center justify-center shrink-0 font-bold">1</div>
                      <span>Revise the fundamental ratios and formulas for <strong>{results.weakestTopic}</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-300">
                      <div className="w-5 h-5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full flex items-center justify-center shrink-0 font-bold">2</div>
                      <span>Attempt at least 15 medium-difficulty practice drills.</span>
                    </li>
                    <li className="flex items-start gap-2.5 text-xs text-gray-300">
                      <div className="w-5 h-5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-full flex items-center justify-center shrink-0 font-bold">3</div>
                      <span>Take a timed section quiz specifically in {SECTION_LABELS[Object.keys(results.sectionScores)[0]] || "Aptitude"}.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* AI Coach Insights */}
              <div className="bg-[#121E21] border border-teal-500/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-teal-400" /> AI Coach Assessment
                  </h3>

                  {loadingInsight ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-gray-500 gap-3">
                      <div className="w-6 h-6 border-2 border-teal-500/10 border-t-teal-400 rounded-full animate-spin"></div>
                      <span>Consulting LLM Coach...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 leading-relaxed italic bg-[#0B1315]/50 border border-teal-500/5 p-4 rounded-2xl">
                      "{aiInsight}"
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-teal-500/5 flex justify-end gap-3 mt-4">
                  <button
                    id="btn-return-home"
                    onClick={() => { setStage("home"); loadDashboardData(); }}
                    className="px-6 py-3 bg-[#0B1315] hover:bg-[#121E21] border border-teal-500/10 text-white font-bold rounded-xl text-sm transition"
                  >
                    Return to Arena
                  </button>
                  <button
                    id="btn-re-attempt"
                    onClick={() => handleStartTest(selectedCompanyKey)}
                    className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-teal-600/25 transition"
                  >
                    Re-Attempt Test
                  </button>
                </div>
              </div>

            </div>

            {/* Section Breakdown Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Section-wise Performance Breakdown</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(results.sectionScores).map(([sec, val]) => (
                  <div key={sec} className="bg-[#121E21] border border-teal-500/10 rounded-2xl p-5 shadow-lg space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white uppercase">{SECTION_LABELS[sec]}</span>
                      <span className="font-extrabold text-teal-400">{val}%</span>
                    </div>
                    
                    {/* Progress track */}
                    <div className="w-full bg-[#0B1315] h-2 rounded-full overflow-hidden border border-teal-500/5">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${val}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}

// Custom components
function BuildingIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="2" ry="2" />
      <path d="M10 22V14h4v8" />
      <path d="M6 6h2" />
      <path d="M6 10h2" />
      <path d="M16 6h2" />
      <path d="M16 10h2" />
    </svg>
  );
}
