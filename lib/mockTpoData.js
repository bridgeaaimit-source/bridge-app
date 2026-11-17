// Comprehensive mock data for TPO Dashboard preview and demo mode

export const MOCK_TPO_USER = {
  name: "Dr. K. S. Sharma",
  college: "Apex Institute of Technology",
  collegeId: "test-college-001",
  role: "tpo",
};

export const MOCK_STUDENTS = [
  {
    uid: "s1",
    name: "Aarav Sharma",
    bridgeScore: 890,
    cgpa: 9.4,
    aptitudeBestScore: 92,
    interviewAvgScore: 88,
    placementStatus: "placed",
    placedAt: "Google",
    lastActive: Date.now() - 3600000 * 2,
  },
  {
    uid: "s2",
    name: "Priyanshu Verma",
    bridgeScore: 865,
    cgpa: 9.1,
    aptitudeBestScore: 88,
    interviewAvgScore: 85,
    placementStatus: "placed",
    placedAt: "Microsoft",
    lastActive: Date.now() - 3600000 * 5,
  },
  {
    uid: "s3",
    name: "Sneha Reddy",
    bridgeScore: 840,
    cgpa: 8.9,
    aptitudeBestScore: 86,
    interviewAvgScore: 82,
    placementStatus: "Preparing",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 8,
  },
  {
    uid: "s4",
    name: "Rohan Nair",
    bridgeScore: 815,
    cgpa: 8.7,
    aptitudeBestScore: 84,
    interviewAvgScore: 79,
    placementStatus: "Preparing",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 12,
  },
  {
    uid: "s5",
    name: "Ananya Iyer",
    bridgeScore: 795,
    cgpa: 8.6,
    aptitudeBestScore: 80,
    interviewAvgScore: 81,
    placementStatus: "Preparing",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 20,
  },
  {
    uid: "s6",
    name: "Vikram Malhotra",
    bridgeScore: 780,
    cgpa: 8.4,
    aptitudeBestScore: 78,
    interviewAvgScore: 76,
    placementStatus: "Preparing",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 26,
  },
  {
    uid: "s7",
    name: "Tanvi Patel",
    bridgeScore: 765,
    cgpa: 8.3,
    aptitudeBestScore: 75,
    interviewAvgScore: 77,
    placementStatus: "Preparing",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 30,
  },
  {
    uid: "s8",
    name: "Aditya Joshi",
    bridgeScore: 750,
    cgpa: 8.1,
    aptitudeBestScore: 76,
    interviewAvgScore: 74,
    placementStatus: "Preparing",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 48,
  },
  {
    uid: "s9",
    name: "Kavya Singhania",
    bridgeScore: 735,
    cgpa: 8.0,
    aptitudeBestScore: 72,
    interviewAvgScore: 75,
    placementStatus: "Preparing",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 54,
  },
  {
    uid: "s10",
    name: "Ishaan Gupta",
    bridgeScore: 710,
    cgpa: 7.9,
    aptitudeBestScore: 70,
    interviewAvgScore: 72,
    placementStatus: "Preparing",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 60,
  },
  // At-Risk students
  {
    uid: "s11",
    name: "Rahul Saxena",
    bridgeScore: 420,
    cgpa: 6.8,
    aptitudeBestScore: 45,
    interviewAvgScore: 42,
    placementStatus: "At Risk",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 24 * 9,
  },
  {
    uid: "s12",
    name: "Megha Sengupta",
    bridgeScore: 450,
    cgpa: 6.9,
    aptitudeBestScore: 48,
    interviewAvgScore: 46,
    placementStatus: "At Risk",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 24 * 8,
  },
  {
    uid: "s13",
    name: "Kunal Bose",
    bridgeScore: 465,
    cgpa: 7.0,
    aptitudeBestScore: 50,
    interviewAvgScore: 48,
    placementStatus: "At Risk",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 24 * 6,
  },
  {
    uid: "s14",
    name: "Divya Nair",
    bridgeScore: 480,
    cgpa: 7.1,
    aptitudeBestScore: 52,
    interviewAvgScore: 50,
    placementStatus: "At Risk",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 24 * 5,
  },
  {
    uid: "s15",
    name: "Arjun Mehra",
    bridgeScore: 495,
    cgpa: 7.2,
    aptitudeBestScore: 54,
    interviewAvgScore: 51,
    placementStatus: "At Risk",
    placedAt: null,
    lastActive: Date.now() - 3600000 * 24 * 7,
  },
];

export const MOCK_BATCH_STATS = {
  totalStudents: 142,
  placementReady: { count: 88, percentage: 62 },
  atRisk: {
    count: 18,
    students: MOCK_STUDENTS.filter((s) => s.bridgeScore < 500),
  },
  averageBridgeScore: 684,
  predictedPlacements: 104,
  batchReadiness: 68,
  trend: { change: 12, direction: "up" },
  students: MOCK_STUDENTS,
};

export const MOCK_DRIVES = [
  {
    driveId: "drive_google_01",
    company: "Google",
    companyDomain: "google.com",
    role: "Software Development Engineer",
    package: "24.5 LPA",
    location: "Bengaluru / Hyderabad",
    status: "upcoming",
    driveDate: new Date(Date.now() + 8 * 24 * 3600 * 1000).toISOString(),
    lastApplyDate: new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString(),
    eligibility: { minCGPA: 8.0, minBridgeScore: 700 },
    rounds: ["Aptitude", "Coding", "Technical", "HR"],
    superset_link: "https://app.joinsuperset.com/company/google",
  },
  {
    driveId: "drive_msft_02",
    company: "Microsoft",
    companyDomain: "microsoft.com",
    role: "Full Stack Engineer",
    package: "18.0 LPA",
    location: "Noida / Hyderabad",
    status: "upcoming",
    driveDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    lastApplyDate: new Date(Date.now() + 9 * 24 * 3600 * 1000).toISOString(),
    eligibility: { minCGPA: 7.5, minBridgeScore: 650 },
    rounds: ["Aptitude", "Coding", "Technical", "HR"],
    superset_link: "https://app.joinsuperset.com/company/microsoft",
  },
  {
    driveId: "drive_tcs_03",
    company: "TCS Digital",
    companyDomain: "tcs.com",
    role: "Systems Engineer — Digital",
    package: "7.5 LPA",
    location: "Pan India",
    status: "upcoming",
    driveDate: new Date(Date.now() + 21 * 24 * 3600 * 1000).toISOString(),
    lastApplyDate: new Date(Date.now() + 16 * 24 * 3600 * 1000).toISOString(),
    eligibility: { minCGPA: 6.5, minBridgeScore: 600 },
    rounds: ["Aptitude", "Coding", "HR"],
    superset_link: "https://app.joinsuperset.com/company/tcs",
  },
  {
    driveId: "drive_deloitte_04",
    company: "Deloitte",
    companyDomain: "deloitte.com",
    role: "Technology Analyst",
    package: "9.0 LPA",
    location: "Hyderabad / Mumbai",
    status: "upcoming",
    driveDate: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
    lastApplyDate: new Date(Date.now() + 22 * 24 * 3600 * 1000).toISOString(),
    eligibility: { minCGPA: 7.0, minBridgeScore: 620 },
    rounds: ["Aptitude", "GD", "Case Study", "HR"],
    superset_link: "https://app.joinsuperset.com/company/deloitte",
  },
];

export const MOCK_SKILL_GAP = {
  heatmap: [
    { topic: "Quantitative Aptitude", avgAccuracy: 78, studentCount: 135, level: "emerald" },
    { topic: "Logical Reasoning", avgAccuracy: 82, studentCount: 140, level: "emerald" },
    { topic: "Verbal Ability", avgAccuracy: 74, studentCount: 128, level: "emerald" },
    { topic: "Data Structures & Algos", avgAccuracy: 62, studentCount: 110, level: "amber" },
    { topic: "System Design", avgAccuracy: 46, studentCount: 95, level: "red" },
    { topic: "Group Discussion", avgAccuracy: 54, studentCount: 102, level: "amber" },
    { topic: "Technical Interviews", avgAccuracy: 68, studentCount: 116, level: "amber" },
    { topic: "HR Behavioral (STAR)", avgAccuracy: 81, studentCount: 124, level: "emerald" },
  ],
  insights: [
    { level: "red", message: "System Design average accuracy (46%) is significantly below the minimum threshold required for Tier-1 Product drives (Google, Microsoft)." },
    { level: "amber", message: "Group Discussion confidence and articulation scores (54%) lag behind technical abilities across 42% of candidates." },
    { level: "amber", message: "Data Structures & Algorithms consistency shows high variance across non-CS branches." },
  ],
};

export const MOCK_WEEKLY_REPORT = `### 📊 Batch Performance Summary
The current batch at **Apex Institute of Technology** demonstrates strong upward momentum with an overall **Batch Readiness of 68%** (↑ 12% vs last month). Out of 142 enrolled students, **88 candidates (62%)** have crossed the 700+ benchmark and are considered placement ready.

- **Average BRIDGE Score**: 684 / 1000 (↑ 38 points)
- **Top Domain Strength**: Logical Reasoning (82%) & Behavioral STAR (81%)
- **Predicted Cleared Placements**: 104 students across upcoming drives

---

### 🌟 Top Improvers
1. **Aarav Sharma** (Score: 890) — Successfully secured offer at **Google**
2. **Priyanshu Verma** (Score: 865) — Offer confirmed at **Microsoft**
3. **Sneha Reddy** (Score: 840, ↑ 65 pts) — Exceptional progress in Case Study & System Architecture
4. **Rohan Nair** (Score: 815, ↑ 50 pts) — Outstanding performance in Technical Mock Interviews

---

### 🏢 Upcoming Drives & Readiness Assessment
- **Google (8 Days)**: 92 eligible students. 74 candidates ready for online assessments, with a predicted clearance rate of **72%**.
- **Microsoft (14 Days)**: 110 eligible students. Coding consistency is strong; technical round clearance predicted at **65%**.
- **TCS Digital (21 Days)**: 135 eligible students. 112 aptitude ready; predicted clearance rate of **84%**.
- **Deloitte (28 Days)**: 120 eligible students. Recommended focus on GD rounds prior to drive day.

---

### ⚠️ Areas of Concern
- **18 students** are currently flagged **At-Risk** due to low activity (> 7 days inactivity) or BRIDGE scores below 500.
- **System Design** accuracy (46%) requires targeted remedial workshops before Tier-1 drives commence.

---

### ✅ Recommended Actions for TPO
1. **Trigger Nudge Reminders** for the 18 at-risk students ahead of the Google and Microsoft drive deadlines.
2. **Schedule 2 Dedicated Group Discussion Practice Battles** in the GD Arena for Deloitte candidates.
3. **Encourage Tier-1 aspirants** to complete the System Design diagnostic sprint on BridgeAI.`;
