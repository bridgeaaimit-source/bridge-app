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
import { selectQuestions } from "@/lib/questionSelector";
import confetti from "canvas-confetti";
import {
  Canvas,
  SubtlePanel,
  Card,
  Button,
  Input,
  Select,
  typography
} from "@/components/DesignSystem";

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

function formatTime(seconds) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

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
            toast("Time Freeze expired!");
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
      setDbQuestionCount(0); // Show seeder banner on error as fallback
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
    // Bypass mode: use mock dashboard data instead of Firestore
    if (isBypassed) {
      setBestScore(80);
      setTotalXP(500);
      setStreakCount(3);
      setTopScorers([
        { name: "Test Student", college: "Test College", score: 750, xp: 500, photo: null },
        { name: "Alice Johnson", college: "MIT", score: 920, xp: 800, photo: null },
        { name: "Bob Smith", college: "Stanford", score: 680, xp: 400, photo: null },
      ]);
      return;
    }

    try {
      const uid = user.uid;
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

      // Bypass mode: load daily challenge from static data only, skip Firestore reads
      if (isBypassed) {
        let todayChallenge = null;
        try {
          const { loadAllStaticQuestions } = await import('@/lib/questionsData');
          const allStatic = loadAllStaticQuestions();
          const randomQ = allStatic[Math.floor(Math.random() * allStatic.length)];
          todayChallenge = {
            id: `static-daily-${todayStr}`,
            question: randomQ.question,
            options: randomQ.options,
            correct: randomQ.correct,
            explanation: randomQ.explanation,
            topic: randomQ.topic,
            section: randomQ.section,
            difficulty: randomQ.difficulty,
            date: todayStr
          };
        } catch (staticErr) {
          console.error("Failed to load static daily challenge fallback:", staticErr);
        }
        setDailyChallenge(todayChallenge);
        setDailyStatus("unattempted");
        // Mock streak calendar — show 3 of last 7 days completed
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();
        setStreakCalendar(last7Days.map((date, i) => ({ date, completed: i >= 4 })));
        return;
      }

      const uid = user.uid;

      // 1. Fetch or create Daily Challenge
      const challengeRef = doc(db, 'dailyChallenges', todayStr);
      let todayChallenge = null;
      try {
        const challengeSnap = await getDoc(challengeRef);
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
            try {
              await setDoc(challengeRef, newChallenge);
            } catch (writeErr) {
              console.warn("Firestore setDoc failed for daily challenge:", writeErr.message);
            }
            todayChallenge = { id: todayStr, ...newChallenge };
          }
        }
      } catch (e) {
        console.warn("Firestore error loading daily challenge:", e.message);
      }

      // Fallback if todayChallenge is still null (database empty or query failed)
      if (!todayChallenge) {
        try {
          const { loadAllStaticQuestions } = await import('@/lib/questionsData');
          const allStatic = loadAllStaticQuestions();
          const randomQ = allStatic[Math.floor(Math.random() * allStatic.length)];
          todayChallenge = {
            id: `static-daily-${todayStr}`,
            question: randomQ.question,
            options: randomQ.options,
            correct: randomQ.correct,
            explanation: randomQ.explanation,
            topic: randomQ.topic,
            section: randomQ.section,
            difficulty: randomQ.difficulty,
            date: todayStr
          };
        } catch (staticErr) {
          console.error("Failed to load static daily challenge fallback:", staticErr);
        }
      }

      setDailyChallenge(todayChallenge);

      // 2. Fetch User Submission for Today
      let dailySubExists = false;
      let dailySubCorrect = false;
      try {
        const subRef = doc(db, 'dailyChallengeSubmissions', `${uid}_${todayStr}`);
        const subSnap = await getDoc(subRef);
        if (subSnap.exists()) {
          dailySubExists = true;
          dailySubCorrect = subSnap.data().correct;
        }
      } catch (subErr) {
        console.warn("Firestore error loading user daily submission:", subErr.message);
      }
      setDailyStatus(dailySubExists ? (dailySubCorrect ? "correct" : "incorrect") : "unattempted");

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
        toast.success("BOSS DEFEATED! +50 XP Double Bounty!");
        setXp(prev => prev + 50);
      } else if (isDailyChallengeMode) {
        confetti({ particleCount: 80, spread: 80, colors: ['#0D9488', '#F59E0B'] });
        toast.success("Daily Challenge Completed! +100 XP!");
        setXp(100);
      } else {
        const baseXP = q.difficulty === 1 ? 10 : q.difficulty === 2 ? 20 : 30;
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        let bonusXP = 0;
        if (newStreak === 3) { bonusXP = 5; toast.success("3 Streaks! +5 Bonus XP"); }
        if (newStreak === 5) { bonusXP = 10; toast.success("5 Streaks! +10 Bonus XP"); }
        if (newStreak >= 10 && newStreak % 5 === 0) { 
          bonusXP = 20; 
          confetti({ particleCount: 30, spread: 40 });
          toast.success(`${newStreak} Streaks! +20 Bonus XP`); 
        }

        setXp(prev => prev + baseXP + bonusXP);
      }

      setScore(prev => prev + 4);
      setConsecutiveCorrect(prev => prev + 1);

      // Adaptive difficulty progression
      if (consecutiveCorrect + 1 >= 3 && currentDifficulty < 3) {
        setCurrentDifficulty(prev => prev + 1);
        setConsecutiveCorrect(0);
        toast("Difficulty Level Up!");
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
    toast.success("50/50 Used! Two incorrect options removed.");
  };

  const triggerTimeFreeze = () => {
    if (powerUps.timeFreeze || selectedOption !== null) return;
    setIsTimeFrozen(true);
    setFreezeDurationLeft(60); // 60 seconds freeze
    setPowerUps(prev => ({ ...prev, timeFreeze: true }));
    toast.success("Time Freeze! Clock stopped for 60 seconds.");
  };

  const triggerSkip = () => {
    if (powerUps.skip || selectedOption !== null) return;
    setPowerUps(prev => ({ ...prev, skip: true }));
    toast("Question skipped!");
    
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
      
      // Skip Firestore writes in bypass mode
      if (uid && !isBypassed) {
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

      toast(isCorrect ? "Challenge Solved! +100 XP Added!" : "Challenge complete. Check explanation!");
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

    // Save Score & updates to Firestore (skip in bypass mode)
    if (!isBypassed) {
      try {
        const uid = user?.uid;
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
    <Canvas>
      <AppShell hideNavigation={stage === "test" || stage === "loading-test"}>
        <div className="min-h-screen text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
          
          {/* Anti-Cheat Warning Modal */}
          {showWarningModal && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
              <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-500 to-amber-500"></div>
                <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-6 text-rose-500">
                  <AlertTriangleIcon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Tab Switch Detected!</h3>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  Warning <span className="text-rose-500 font-extrabold">{violations}</span> of <span className="text-slate-800 font-semibold">{maxViolations}</span>.
                  Leaving the screen or changing windows during the placement test is strictly monitored. Reaching {maxViolations} violations will trigger auto-submission!
                </p>
                <Button
                  onClick={resetWarning}
                  variant="red"
                  className="w-full justify-center"
                >
                  I Understand, Return to Test
                </Button>
              </div>
            </div>
          )}

          {/* ─── STAGE 1: HOME ─── */}
          {stage === "home" && (
            <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-10">
              
              {/* Database Empty Seeder Notice */}
              {dbQuestionCount === 0 && (
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200/50 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100/60 border border-teal-200/50 rounded-xl flex items-center justify-center shrink-0 text-teal-600">
                      <SparklesIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-teal-900">Database Initialization Required</h4>
                      <p className="text-sm text-teal-700">Local question bank is empty. Seed 510 unique placement-style questions to get started.</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSeedDatabase}
                    disabled={seeding}
                    variant="teal"
                    className="shrink-0 whitespace-nowrap"
                  >
                    {seeding ? "Seeding..." : "Seed 510 Questions"}
                  </Button>
                </div>
              )}

              {/* Header & Stats Dashboard */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6">
                <div>
                  <h1 className={typography.h1}>
                    Aptitude Arena
                  </h1>
                  <p className={typography.body}>
                    Master Indian campus placement reasoning and quantitative rounds with adaptive, gamified drills.
                    <button
                      onClick={handleSeedDatabase}
                      className="ml-2 text-xs text-teal-500 hover:underline font-semibold text-[#14B8A6]"
                    >
                      (Force Seed DB)
                    </button>
                  </p>
                </div>
                
                <div className="flex items-center gap-4 self-stretch md:self-auto bg-slate-50 border border-slate-200/60 p-3 px-5 rounded-2xl">
                  <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                    <FlameIcon className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Streak</div>
                      <div className="text-xs font-bold text-slate-800">{streakCount} Days</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
                    <AwardIcon className="w-5 h-5 text-teal-600" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total XP</div>
                      <div className="text-xs font-bold text-slate-800">{totalXP}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Best Score</div>
                      <div className="text-xs font-bold text-slate-800">{bestScore} pts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Challenge & Leaderboard Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Daily Challenge Card */}
                <Card className="lg:col-span-2 relative overflow-hidden flex flex-col justify-between p-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-amber-50 border border-amber-250 rounded-full text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1.5">
                        <SparklesIcon className="w-3 h-3 text-amber-500" /> Daily Bounty Challenge
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>

                    <div className="space-y-2 mb-6">
                      <h3 className="text-lg font-bold text-slate-900">{"Today's Reasoning Drill"}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                        {"Solve today's adaptive problem in under 60 seconds to extend your streak calendar and earn a +100 XP bounty."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 pt-6 border-t border-slate-100">
                    {/* Calendar streak map */}
                    <div className="flex items-center gap-1.5">
                      {streakCalendar.map((day, idx) => {
                        const dayLetter = ["S", "M", "T", "W", "T", "F", "S"][new Date(day.date).getDay()];
                        return (
                          <div key={day.date} className="flex flex-col items-center gap-1">
                            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                              day.completed 
                                ? "bg-teal-50 border-teal-500 text-teal-700 shadow-sm" 
                                : day.date === new Date().toISOString().split('T')[0]
                                  ? "bg-amber-50 border-amber-500 text-amber-700 font-bold"
                                  : "bg-slate-50 border-slate-200 text-slate-400"
                            }`}>
                              {day.completed ? <CheckIcon className="w-4 h-4 text-teal-600" /> : <span className="text-xs font-bold">{dayLetter}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {dailyStatus === "unattempted" ? (
                      <Button
                        onClick={() => handleStartTest(null, true)}
                        variant="teal"
                        className="flex items-center justify-center gap-2"
                      >
                        Start Challenge <ArrowRightIcon className="w-4 h-4" />
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 text-teal-600 bg-teal-50 border border-teal-200 px-4 py-2 rounded-xl text-xs font-bold self-center">
                        <CheckCircleIcon className="w-4 h-4" /> Challenge Done Today (+100 XP)
                      </div>
                    )}
                  </div>
                </Card>

                {/* Leaderboard Card */}
                <Card className="flex flex-col justify-between p-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-wider uppercase flex items-center gap-2 mb-4">
                      <TrophyIcon className="w-4 h-4 text-indigo-500" /> Leaderboard (Top 5 Today)
                    </h3>
                    
                    <div className="space-y-3">
                      {topScorers.length > 0 ? (
                        topScorers.map((scorer, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3 p-2 bg-slate-50/50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className={`w-4 text-center font-bold text-xs ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-indigo-400" : "text-slate-400"}`}>
                                {idx + 1}
                              </span>
                              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs overflow-hidden uppercase">
                                {scorer.photo ? <img src={scorer.photo} alt={scorer.name} /> : scorer.name.charAt(0)}
                              </div>
                              <div className="max-w-[110px] truncate">
                                <div className="text-xs font-bold text-slate-850 truncate">{scorer.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{scorer.college}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-bold text-teal-600">{scorer.score}</span>
                              <span className="text-[9px] text-slate-400 block leading-none">Bridge Score</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-xs font-medium">
                          No scores recorded today yet.
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

              </div>

              {/* Company selector Mode grid */}
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <BuildingIcon className="w-5 h-5 text-teal-600" /> Select Company Test Mode
                  </h2>
                  <span className="text-xs font-bold text-teal-600 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider">
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
                        className={`cursor-pointer rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 ${
                          selectedCompanyKey === key 
                            ? "bg-white border-teal-500 shadow-md scale-[1.02]" 
                            : "bg-white border-slate-200/70 hover:border-teal-500/30 hover:scale-[1.01]"
                        }`}
                      >
                        {comp.tag && (
                          <span className={`absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg text-[9px] font-bold uppercase tracking-wider ${
                            comp.tag === "Highest Hiring" 
                              ? "bg-teal-600 text-white" 
                              : "bg-amber-600 text-white"
                          }`}>
                            {comp.tag}
                          </span>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                            {hasLogoError ? (
                              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm uppercase">
                                {comp.name.charAt(0)}
                              </div>
                            ) : (
                              <img
                                src={`https://logo.clearbit.com/${domainName}`}
                                alt={comp.name}
                                className="w-6 h-6 object-contain"
                                onError={() => setLogoErrors(prev => ({ ...prev, [key]: true }))}
                              />
                            )}
                          </div>

                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{comp.name}</h4>
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest block font-bold">Mock Exam</span>
                          </div>
                        </div>

                        {/* Test pattern metrics */}
                        <div className="space-y-2 pt-3 border-t border-slate-100">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-400">Questions:</span>
                            <span className="font-semibold text-slate-800">
                              {Object.values(comp.sections).reduce((a, b) => a + b, 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-400">Duration:</span>
                            <span className="font-semibold text-slate-800">{comp.duration} Mins</span>
                          </div>
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-400">Difficulty:</span>
                            <span className="font-semibold text-teal-600">{comp.difficulty}</span>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1">
                          {Object.keys(comp.sections).map((sec) => (
                            <span key={sec} className="text-[8px] font-bold bg-slate-100 border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">
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
                  <Button
                    onClick={() => handleStartTest(selectedCompanyKey)}
                    variant="teal"
                    className="px-8 py-3.5 shadow-md"
                  >
                    Start {COMPANIES[selectedCompanyKey].name} Placement Test <PlayIcon className="w-4 h-4 text-white" />
                  </Button>
                </div>

              </div>

            </div>
          )}

          {/* ─── STAGE 2: LOADING TEST ─── */}
          {stage === "loading-test" && (
            <div className="min-h-[85vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-full border-4 border-slate-100 border-t-teal-600 animate-spin flex items-center justify-center">
                <BrainIcon className="w-6 h-6 text-teal-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Assembling Test Chamber...</h3>
                <p className="text-xs text-slate-450">
                  Selecting matching adaptive questions from the {COMPANIES[selectedCompanyKey]?.name || "Daily"} repository.
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
              <div className={`p-4 md:p-8 max-w-4xl mx-auto space-y-6 min-h-[90vh] transition-all duration-300 ${
                isBoss ? "bg-rose-50/20 rounded-3xl" : ""
              }`}>
                
                {/* HUD Bar */}
                <div className={`rounded-2xl border p-4 px-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 ${
                  isBoss 
                    ? "bg-rose-50 border-rose-100 text-rose-800" 
                    : "bg-white border-slate-200 text-slate-800"
                }`}>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
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
                      <h3 className="font-bold text-xs tracking-tight uppercase text-slate-808">
                        {isDailyChallengeMode ? "Daily Challenge" : COMPANIES[selectedCompanyKey].name}
                      </h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                        isBoss 
                          ? "bg-rose-100 border-rose-200 text-rose-600" 
                          : "bg-teal-50 border-teal-200 text-teal-600"
                      }`}>
                        {isBoss ? "BOSS CHALLENGE (2x XP)" : `Section: ${SECTION_LABELS[q?.section] || q?.section}`}
                      </span>
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                    
                    {/* Streak */}
                    {streak > 1 && !isDailyChallengeMode && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-bold text-amber-650">
                        <FlameIcon className="w-3.5 h-3.5 text-amber-500" /> {streak} Streak
                      </div>
                    )}

                    {/* XP Counter */}
                    <div className="text-xs font-bold bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-full text-teal-600">
                      +{xp} XP
                    </div>

                    {/* Power-ups Row */}
                    {!isDailyChallengeMode && (
                      <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                        
                        {/* Fifty Fifty */}
                        <button
                          onClick={triggerFiftyFifty}
                          disabled={powerUps.fiftyFifty || selectedOption !== null}
                          className={`p-2 rounded-lg border transition-all duration-200 ${
                            powerUps.fiftyFifty 
                              ? "bg-slate-100 border-slate-205 text-slate-350 cursor-not-allowed" 
                              : "bg-white border-slate-200 hover:border-teal-500 text-teal-600 hover:bg-teal-50/20"
                          }`}
                          title="50/50: Hides two incorrect options"
                        >
                          <HelpCircleIcon className="w-4 h-4" />
                        </button>

                        {/* Time Freeze */}
                        <button
                          onClick={triggerTimeFreeze}
                          disabled={powerUps.timeFreeze || selectedOption !== null}
                          className={`p-2 rounded-lg border relative transition-all duration-200 ${
                            powerUps.timeFreeze 
                              ? "bg-slate-100 border-slate-205 text-slate-355 cursor-not-allowed" 
                              : "bg-white border-slate-200 hover:border-teal-500 text-teal-600 hover:bg-teal-50/20"
                          }`}
                          title="Time Freeze: Stops clock for 60 seconds"
                        >
                          <ClockIcon className="w-4 h-4" />
                          {isTimeFrozen && (
                            <span className="absolute -top-1.5 -right-1.5 bg-cyan-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {freezeDurationLeft}
                            </span>
                          )}
                        </button>

                        {/* Skip */}
                        <button
                          onClick={triggerSkip}
                          disabled={powerUps.skip || selectedOption !== null}
                          className={`p-2 rounded-lg border transition-all duration-200 ${
                            powerUps.skip 
                              ? "bg-slate-100 border-slate-205 text-slate-355 cursor-not-allowed" 
                              : "bg-white border-slate-200 hover:border-teal-500 text-teal-600 hover:bg-teal-50/20"
                          }`}
                          title="Skip: Jump to next question instantly"
                        >
                          <SkipForwardIcon className="w-4 h-4" />
                        </button>

                      </div>
                    )}

                    {/* Section timer */}
                    <div className={`p-2 px-3 rounded-xl font-mono font-bold text-xs tracking-wider border ${
                      isBoss 
                        ? "bg-rose-105 border-rose-350 text-rose-700" 
                        : isTimeFrozen
                          ? "bg-cyan-50 border-cyan-300 text-cyan-600 animate-pulse"
                          : "bg-teal-50 border-teal-200 text-teal-600"
                    }`}>
                      {isTimeFrozen ? `FROZEN` : formatTime(timeLeft)}
                    </div>

                  </div>

                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isBoss ? "bg-gradient-to-r from-rose-600 to-rose-400" : "bg-gradient-to-r from-teal-500 to-cyan-500"
                    }`}
                    style={{ width: `${((currentIndex + 1) / testQuestions.length) * 100}%` }}
                  ></div>
                </div>

                {/* Question Card */}
                <Card className={`relative overflow-hidden transition-all duration-350 p-6 md:p-10 ${
                  isBoss ? "bg-rose-50/10 border-rose-200" : ""
                }`}>
                  {/* Topic breadcrumb */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                      Topic: {q?.topic || "General"}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      q?.difficulty === 1 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      q?.difficulty === 2 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}>
                      Diff: {q?.difficulty === 1 ? "Easy" : q?.difficulty === 2 ? "Medium" : "Hard"}
                    </span>
                  </div>

                  {/* Boss Battle visual cue */}
                  {isBoss && (
                    <div className="mb-6 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 animate-pulse">
                      <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                      <strong>ELITE BOSS:</strong> Ticking clock accelerates 1.5x. Double XP reward upon correct submission.
                    </div>
                  )}

                  {/* Question Text */}
                  <h2 className="text-base md:text-lg font-bold text-slate-800 leading-relaxed mb-8 whitespace-pre-line">
                    {currentIndex + 1}. {q?.question}
                  </h2>

                  {/* Options Box */}
                  <div className="grid grid-cols-1 gap-3.5">
                    {q?.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === q.correct;
                      const showCorrect = selectedOption !== null && isCorrect;
                      const showWrong = selectedOption !== null && isSelected && !isCorrect;
                      const isFiftyFiftyHidden = fiftyFiftyOptions.includes(idx);

                      if (isFiftyFiftyHidden) {
                        return (
                          <div
                            key={idx}
                            className="py-4 px-6 rounded-xl border border-dashed border-slate-200 text-slate-400 bg-slate-50/40 text-xs flex items-center gap-2 select-none"
                          >
                            <LockIcon className="w-3.5 h-3.5 text-slate-450" /> Option eliminated by 50/50
                          </div>
                        );
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswerOption(idx)}
                          disabled={selectedOption !== null}
                          className={`w-full py-4 px-6 text-left rounded-xl border text-sm transition-all duration-150 flex items-center justify-between ${
                            showCorrect 
                              ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold" 
                              : showWrong 
                                ? "bg-rose-50 border-rose-500 text-rose-700 font-semibold"
                                : selectedOption !== null 
                                  ? "bg-slate-50 border-slate-200 text-slate-400 cursor-default" 
                                  : "bg-slate-50/50 border-slate-200 hover:border-teal-500 text-slate-700 hover:bg-teal-50/10"
                          }`}
                        >
                          <span>{opt}</span>
                          {showCorrect && <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                          {showWrong && <XCircleIcon className="w-4 h-4 text-rose-600 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate Explanation Drawer */}
                  {showExplanation && (
                    <div className="mt-8 pt-6 border-t border-slate-100 space-y-3 animate-in slide-in-from-bottom duration-300">
                      <h4 className="text-xs font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircleIcon className="w-4 h-4" /> Explanation & Methodology
                      </h4>
                      <p className="text-xs md:text-sm text-slate-550 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl">
                        {q?.explanation}
                      </p>
                      <div className="pt-4 flex justify-end">
                        <Button
                          onClick={handleNextQuestion}
                          variant="teal"
                          className="!py-2 text-xs"
                        >
                          {isLast ? "Complete Paper" : "Next Question"} <ChevronRightIcon className="w-3.5 h-3.5 text-white" />
                        </Button>
                      </div>
                    </div>
                  )}

                </Card>

              </div>
            );
          })()}

          {/* ─── STAGE 4: RESULTS ─── */}
          {stage === "results" && results && (
            <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
              
              {/* Header banner */}
              <div className="text-center space-y-2 border-b border-slate-100 pb-6">
                <span className="px-3 py-0.5 bg-teal-50 border border-teal-200 text-teal-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Assessment Complete
                </span>
                <h2 className="text-2xl font-bold text-slate-900">Placement Assessment Report</h2>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                  Review your accuracy breakdowns, topic weaknesses, and targeted analytics.
                </p>
              </div>

              {/* Score Ring & Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* score circle */}
                <Card className="flex flex-col items-center justify-center text-center p-6">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-slate-100 stroke-[8] fill-none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="52"
                        className="stroke-teal-600 stroke-[8] fill-none transition-all duration-1000"
                        strokeDasharray={326}
                        strokeDashoffset={326 - (326 * results.accuracy) / 100}
                      />
                    </svg>
                    
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-extrabold text-slate-900">{results.accuracy}%</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Accuracy</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-800">Score: {results.score} / {results.maxScore}</h3>
                  <span className="text-[10px] font-bold text-slate-450 mt-1 uppercase tracking-wider">Tier: {results.level}</span>
                </Card>

                {/* Stats Summary Panel */}
                <Card className="md:col-span-2 grid grid-cols-2 gap-6 items-center p-6 bg-slate-50/50">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">XP Reward</span>
                    <div className="text-xl font-bold text-teal-600">+{results.xpEarned} XP</div>
                    <span className="text-[9px] text-slate-400 block leading-none">Bridge Score Impact</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">Benchmarking</span>
                    <div className="text-xl font-bold text-indigo-600">Top {100 - results.percentile}%</div>
                    <span className="text-[9px] text-slate-400 block leading-none">Beat {results.percentile}% candidates</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-450 block uppercase font-bold tracking-wider">Timing Check</span>
                    <div className="text-xl font-bold text-slate-800">
                      {Math.floor(results.timeTaken / 60)}m {results.timeTaken % 60}s
                    </div>
                    <span className="text-[9px] text-slate-400 block leading-none">Active minutes logged</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-455 block uppercase font-bold tracking-wider">Pacing Ratio</span>
                    <div className="text-xl font-bold text-slate-800">
                      <span className="text-emerald-600">{results.correct}</span> / <span className="text-rose-500">{results.wrong}</span>
                    </div>
                    <span className="text-[9px] text-slate-455 block leading-none">Skipped {results.skipped} questions</span>
                  </div>
                </Card>

              </div>

              {/* AI Insights & Weak Topic Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Weakest Topic Drill */}
                <Card className="space-y-4 p-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <TargetIcon className="w-4 h-4 text-rose-500" /> Targeted Remediation
                  </h3>

                  <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
                    <div className="text-[9px] text-rose-700 block uppercase font-bold tracking-wider">Identified Weakness Point</div>
                    <div className="text-base font-bold text-rose-700 mt-1">{results.weakestTopic}</div>
                  </div>

                  <div className="space-y-2.5">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Recommended actions:</span>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2 text-xs text-slate-555 leading-relaxed">
                        <div className="w-4 h-4 bg-teal-50 border border-teal-200 text-teal-700 rounded-full flex items-center justify-center shrink-0 font-bold text-[9px] mt-0.5">1</div>
                        <span>Review formula logic and base derivations for <strong>{results.weakestTopic}</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs text-slate-555 leading-relaxed">
                        <div className="w-4 h-4 bg-teal-50 border border-teal-200 text-teal-700 rounded-full flex items-center justify-center shrink-0 font-bold text-[9px] mt-0.5">2</div>
                        <span>Attempt 10 localized drills inside our mock modules.</span>
                      </li>
                    </ul>
                  </div>
                </Card>

                {/* AI Coach Insights */}
                <Card className="flex flex-col justify-between p-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <SparklesIcon className="w-4 h-4 text-teal-600" /> AI Coach Assessment
                    </h3>

                    {loadingInsight ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-xs text-slate-400 gap-2 font-medium">
                        <div className="w-5 h-5 border-2 border-teal-500/10 border-t-teal-500 rounded-full animate-spin"></div>
                        <span>Structuring feedback report...</span>
                      </div>
                    ) : (
                      <p className="text-xs md:text-sm text-slate-650 leading-relaxed italic bg-slate-50 border border-slate-100 p-4 rounded-xl">
                        &ldquo;{aiInsight}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => { setStage("home"); loadDashboardData(); }}
                      className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold rounded-lg text-xs transition-all"
                    >
                      Return to Arena
                    </button>
                    <button
                      onClick={() => handleStartTest(selectedCompanyKey)}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs transition-all"
                    >
                      Re-Attempt Mock
                    </button>
                  </div>
                </Card>

              </div>

              {/* Section Breakdown Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Section-wise Performance Breakdown</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(results.sectionScores).map(([sec, val]) => (
                    <Card key={sec} className="space-y-3 p-5">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-650 uppercase tracking-wider">{SECTION_LABELS[sec]}</span>
                        <span className="text-teal-600">{val}%</span>
                      </div>
                      
                      {/* Progress track */}
                      <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${val}%` }}></div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </AppShell>
    </Canvas>
  );
}

// Handcrafted SVG Icons (replacing Lucide/Emojis)
function AlertTriangleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function SparklesIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

function FlameIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function TrophyIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
    </svg>
  );
}

function AwardIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  );
}

function CalendarIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function CheckIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// CheckCircleIcon
function CheckCircleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

// XCircleIcon
function XCircleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

// HelpCircleIcon
function HelpCircleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ClockIcon
function ClockIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// SkipForwardIcon
function SkipForwardIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 4 15 12 5 20 5 4" />
      <line x1="19" y1="5" x2="19" y2="19" />
    </svg>
  );
}

// PlayIcon
function PlayIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

// ChevronRightIcon
function ChevronRightIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// BrainIcon
function BrainIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

// TargetIcon
function TargetIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

// LockIcon
function LockIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

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
