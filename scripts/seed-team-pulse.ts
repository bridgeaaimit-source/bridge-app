import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20260919);
const R = {
  f: (a: number, b: number) => a + rnd() * (b - a),
  i: (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1)),
  pick: <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)],
  chance: (p: number) => rnd() < p,
  sample: <T>(arr: T[], n: number): T[] => {
    const c = [...arr],
      o: T[] = [];
    while (o.length < n && c.length) {
      o.push(c.splice(Math.floor(rnd() * c.length), 1)[0]);
    }
    return o;
  },
  wpick: <T>(pairs: [T, number][]): T => {
    const t = pairs.reduce((s, p) => s + p[1], 0);
    let x = rnd() * t;
    for (const p of pairs) {
      if ((x -= p[1]) <= 0) return p[0];
    }
    return pairs[0][0];
  },
};

const FEMALE = [
  "Priya", "Ananya", "Kavya", "Meera", "Sneha", "Aditi", "Riya", "Nisha",
  "Pooja", "Shreya", "Divya", "Ishita", "Neha", "Tanvi", "Aisha", "Farah",
  "Lakshmi", "Swati", "Sana", "Radhika", "Nandini", "Kritika", "Manasi", "Zoya",
  "Bhavna", "Gayatri", "Harini", "Jyoti", "Madhuri", "Pallavi", "Rekha", "Sonal",
  "Vaishnavi", "Tara", "Deepika", "Shalini", "Sunita", "Anita", "Smriti", "Preeti",
  "Kalyani", "Vidya", "Shruti", "Archana", "Rupal", "Neelam", "Geeta", "Charu"
];

const MALE = [
  "Arjun", "Rohan", "Vikram", "Aditya", "Karan", "Rahul", "Siddharth", "Nikhil",
  "Amit", "Varun", "Rajesh", "Imran", "Harsh", "Kunal", "Manish", "Pranav",
  "Suresh", "Yash", "Abhishek", "Gaurav", "Sameer", "Tejas", "Vivek", "Faizan",
  "Ravi", "Anil", "Dev", "Irfan", "Mohit", "Naveen", "Omkar", "Sandeep",
  "Tarun", "Ujjwal", "Alok", "Chirag", "Deepak", "Hemant", "Jitendra", "Kartik",
  "Mayank", "Pankaj", "Raman", "Sachin", "Tushar", "Utkarsh", "Vishal", "Yogesh"
];

const SURN = [
  "Sharma", "Iyer", "Reddy", "Nair", "Gupta", "Menon", "Patel", "Singh",
  "Rao", "Das", "Kulkarni", "Joshi", "Khan", "Bose", "Mehta", "Pillai",
  "Chatterjee", "Verma", "Shetty", "Banerjee", "Desai", "Agarwal", "Kapoor",
  "Naidu", "Mishra", "Fernandes", "Hegde", "Ghosh", "Bhat", "Saxena", "Qureshi", "Dutta",
  "Bhardwaj", "Choudhury", "Gowda", "Kashyap", "Mahajan", "Nambiar", "Pandey", "Sen"
];

const usedNames = new Set<string>();
function makeName(gender: "F" | "M"): string {
  for (let k = 0; k < 500; k++) {
    const n = (gender === "F" ? R.pick(FEMALE) : R.pick(MALE)) + " " + R.pick(SURN);
    if (!usedNames.has(n)) {
      usedNames.add(n);
      return n;
    }
  }
  return `Employee ${R.i(100, 999)}`;
}

const FAKE_COS = [
  "Zentrix Labs", "Northpeak Analytics", "Kestrel Payments", "Orbitline Logistics",
  "Saffron Retail Tech", "Tidewell Health", "Quillsoft", "Banyan Fintech",
  "Lumen Edge Systems", "Cobalt Ridge Consulting", "Monsoon Media", "Vertex Cloudworks"
];

const DEPTS: Record<string, { n: number; color: string; roles: string[]; market: number[]; skills: string[]; mbti: [string, number][] }> = {
  Engineering: {
    n: 70,
    color: "#3A5BFF",
    roles: ["Software Engineer", "Software Engineer II", "Senior Software Engineer", "Engineering Manager", "Director of Engineering"],
    market: [9, 16, 26, 42, 70],
    skills: ["Java", "Python", "Node.js", "React", "AWS", "Kubernetes", "SQL", "System Design", "Microservices", "CI/CD", "Go", "TypeScript"],
    mbti: [["INTJ", 5], ["INTP", 6], ["ISTJ", 6], ["ISTP", 4], ["ENTJ", 2], ["ENTP", 3], ["INFP", 2]]
  },
  Sales: {
    n: 35,
    color: "#E8436A",
    roles: ["Sales Development Rep", "Account Executive", "Enterprise Account Executive", "Sales Manager", "VP Sales"],
    market: [6, 11, 18, 30, 50],
    skills: ["Negotiation", "CRM (Salesforce)", "Prospecting", "Enterprise Sales", "Forecasting", "Presentation", "SaaS", "Cold Outreach"],
    mbti: [["ESTP", 5], ["ENTJ", 4], ["ESTJ", 4], ["ENFJ", 3]]
  },
  Data: {
    n: 25,
    color: "#0B94D1",
    roles: ["Data Analyst", "Senior Data Analyst", "Data Scientist", "Lead Data Scientist", "Head of Data"],
    market: [8, 15, 24, 38, 60],
    skills: ["SQL", "Python", "Power BI", "Tableau", "Statistics", "Machine Learning", "Excel", "A/B Testing", "dbt", "Storytelling"],
    mbti: [["INTJ", 5], ["INTP", 5], ["ISTJ", 5], ["ENTJ", 2], ["ENTP", 2]]
  },
  "Customer Success": {
    n: 22,
    color: "#0CA678",
    roles: ["CS Associate", "Customer Success Manager", "Senior CSM", "CS Lead", "Head of CS"],
    market: [5.5, 10, 14, 22, 34],
    skills: ["Account Management", "Onboarding", "Churn Analysis", "Communication", "Zendesk", "Upselling", "SaaS"],
    mbti: [["ESFJ", 5], ["ENFJ", 4], ["ISFJ", 4]]
  },
  Product: {
    n: 20,
    color: "#8B5CF6",
    roles: ["Associate Product Manager", "Product Designer", "Product Manager", "Senior Product Manager", "Head of Product"],
    market: [11, 18, 28, 42, 65],
    skills: ["Roadmapping", "Figma", "User Research", "Analytics", "Prototyping", "Stakeholder Management", "Design Systems", "SQL"],
    mbti: [["ENFP", 4], ["INFP", 3], ["ENTJ", 3], ["INFJ", 3]]
  },
  Finance: {
    n: 14,
    color: "#5E6687",
    roles: ["Accountant", "Financial Analyst", "Senior Financial Analyst", "Finance Controller", "CFO"],
    market: [6, 10, 16, 26, 42],
    skills: ["Excel", "FP&A", "Taxation", "Tally", "Financial Modeling", "Audit", "SQL"],
    mbti: [["ISTJ", 6], ["ESTJ", 4], ["INTJ", 3]]
  },
  HR: {
    n: 14,
    color: "#E8890C",
    roles: ["HR Executive", "HR Business Partner", "Talent Acquisition Lead", "HR Head"],
    market: [5, 10, 15, 24],
    skills: ["Talent Acquisition", "Employee Relations", "HR Analytics", "Labour Law", "Compensation", "L&D"],
    mbti: [["ENFJ", 4], ["ESFJ", 4], ["INFJ", 3]]
  }
};

async function main() {
  console.log("🌱 Seeding Team Pulse database with 200 mock employees...");

  // 1. Upsert Organization
  const org = await prisma.organization.upsert({
    where: { slug: "rocket-india" },
    update: {},
    create: {
      id: "org_rocket_india",
      name: "Rocket India",
      legalName: "Rocket India Private Limited",
      slug: "rocket-india",
      city: "Bengaluru",
      industry: "Enterprise SaaS",
    },
  });

  console.log(`✅ Organization verified: ${org.name} (${org.id})`);

  // 2. Upsert Users
  const passwordHash = await bcrypt.hash("password123", 10);
  const usersData = [
    {
      email: "hr@rocketindia.com",
      name: "Ananya Sharma",
      role: "ORG_ADMIN",
      organizationId: org.id,
      passwordHash,
    },
    {
      email: "manager@rocketindia.com",
      name: "Rohan Mehta",
      role: "HIRING_MANAGER",
      organizationId: org.id,
      passwordHash,
    },
    {
      email: "admin@bridgeai.com",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      organizationId: org.id,
      passwordHash,
    },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: u.passwordHash },
      create: u,
    });
  }

  // 3. Populate 200 Employees
  await prisma.employee.deleteMany({ where: { organizationId: org.id } });

  const deptList = Object.keys(DEPTS);
  let empCount = 0;

  for (const dept of deptList) {
    const dConfig = DEPTS[dept];
    for (let i = 0; i < dConfig.n; i++) {
      const gender: "F" | "M" = R.chance(0.44) ? "F" : "M";
      const name =
        empCount === 0
          ? "Rohan Mehta"
          : empCount === 1
          ? "Kavya Reddy"
          : empCount === 2
          ? "Meera Iyer"
          : empCount === 3
          ? "Vikram Malhotra"
          : empCount === 4
          ? "Neha Gupta"
          : empCount === 5
          ? "Arjun Nair"
          : makeName(gender);

      const lvl = R.wpick([
        [1, 0.32],
        [2, 0.42],
        [3, 0.18],
        [4, 0.06],
        [5, 0.02],
      ]);

      const roleName = dConfig.roles[Math.min(lvl - 1, dConfig.roles.length - 1)];
      const baseMkt = dConfig.market[Math.min(lvl - 1, dConfig.market.length - 1)];

      const tenure = Math.round(R.f(0.4, 6.5) * 10) / 10;
      const timeInLevel = Math.min(tenure, Math.round(R.f(0.3, 3.5) * 10) / 10);
      const ctc = Math.round(baseMkt * R.f(0.78, 1.25) * 10) / 10;
      const market = Math.round(baseMkt * R.f(0.95, 1.1) * 10) / 10;

      const perf = R.wpick([[3, 0.5], [4, 0.28], [5, 0.1], [2, 0.09], [1, 0.03]]);
      const perfPrev = R.wpick([[3, 0.52], [4, 0.26], [5, 0.08], [2, 0.11], [1, 0.03]]);
      const potential = R.wpick([[2, 0.5], [3, 0.3], [1, 0.2]]);
      const goals = R.i(55, 100);
      const engagement = Math.round(R.f(2.8, 4.9) * 10) / 10;
      const overtime = R.i(38, 58);
      const mgrChanges = R.chance(0.25) ? 1 : R.chance(0.08) ? 2 : 0;
      const mbti = R.pick(dConfig.mbti.map((x) => x[0]));

      const skills = R.sample(dConfig.skills, R.i(3, 6));
      const prevCompanies = R.sample(FAKE_COS, R.i(1, 3));

      // Calculate risk
      let riskScore = 15;
      const drivers: [string, string, number][] = [];
      if (ctc / market < 0.88) {
        drivers.push(["pay", `Salary ${Math.round((1 - ctc / market) * 100)}% below market`, 22]);
        riskScore += 24;
      }
      if (perf >= 4 && timeInLevel >= 2.2) {
        drivers.push(["promo", "High performer, 2+ yrs in level", 16]);
        riskScore += 16;
      }
      if (engagement <= 3.3) {
        drivers.push(["eng", `Engagement dipping (${engagement}/5)`, 9]);
        riskScore += 12;
      }
      if (overtime >= 51) {
        drivers.push(["ot", `Overtime ${overtime} hrs/wk`, 12]);
        riskScore += 15;
      }
      if (mgrChanges >= 2) {
        drivers.push(["mgr", `Multiple manager changes (${mgrChanges})`, 10]);
        riskScore += 10;
      }

      riskScore = Math.min(95, Math.max(12, riskScore));
      const flightRiskLevel = riskScore >= 65 ? "high" : riskScore >= 40 ? "med" : "low";

      const trainings = {
        posh: R.chance(0.14) ? "over" : R.chance(0.18) ? "due" : "done",
        fire: R.chance(0.1) ? "over" : "done",
        coc: "done",
        dpdp: R.chance(0.2) ? "due" : "done",
        infosec: "done",
        abac: "done",
      };

      const documents = {
        PAN: "ok",
        Aadhaar: "ok",
        "Bank details": "ok",
        NDA: "ok",
        "Background check": R.chance(0.06) ? "missing" : "ok",
      };

      await prisma.employee.create({
        data: {
          organizationId: org.id,
          name,
          email: `${name.toLowerCase().replace(/\s+/g, ".")}@rocketindia.com`,
          role: roleName,
          dept,
          level: lvl,
          gender,
          age: R.i(23, 46),
          ctc,
          market,
          perf,
          perfPrev,
          potential,
          goals,
          engagement,
          overtime,
          mgrChanges,
          tenure,
          timeInLevel,
          lastPromo: Math.round(R.f(0.5, 3.0) * 10) / 10,
          mbti,
          managerName: `Director of ${dept}`,
          skills: JSON.stringify(skills),
          prevCompanies: JSON.stringify(prevCompanies),
          trainings: JSON.stringify(trainings),
          documents: JSON.stringify(documents),
          flightRiskScore: riskScore,
          flightRiskLevel,
          flightRiskDrivers: JSON.stringify(drivers),
        },
      });

      empCount++;
    }
  }

  console.log(`✅ ${empCount} employees seeded successfully into database.`);

  // 4. Create Open Jobs
  await prisma.job.deleteMany({ where: { organizationId: org.id } });
  const jobsData = [
    {
      id: "job_r1",
      organizationId: org.id,
      title: "Senior Data Analyst",
      dept: "Data",
      level: 2,
      expMin: 4.0,
      expMax: 7.0,
      reqSkills: JSON.stringify(["SQL", "Python", "Power BI", "Statistics", "Storytelling"]),
      niceSkills: JSON.stringify(["A/B Testing", "dbt", "Tableau"]),
      idealMbti: JSON.stringify(["INTJ", "ISTJ", "INTP", "ENTJ"]),
      bandMin: 16.0,
      bandMax: 26.0,
      daysOpen: 38,
      hiringManager: "Head of Data",
      competencies: JSON.stringify([
        ["Analytical thinking", 0.3],
        ["SQL & Python depth", 0.25],
        ["Business storytelling", 0.25],
        ["Stakeholder management", 0.2],
      ]),
    },
    {
      id: "job_r2",
      organizationId: org.id,
      title: "Backend Engineer (SDE II)",
      dept: "Engineering",
      level: 2,
      expMin: 3.0,
      expMax: 6.0,
      reqSkills: JSON.stringify(["Java", "Microservices", "SQL", "AWS", "System Design"]),
      niceSkills: JSON.stringify(["Kubernetes", "Go", "CI/CD"]),
      idealMbti: JSON.stringify(["INTP", "ISTJ", "INTJ", "ISTP"]),
      bandMin: 16.0,
      bandMax: 28.0,
      daysOpen: 52,
      hiringManager: "VP Engineering",
      competencies: JSON.stringify([
        ["Coding & problem solving", 0.35],
        ["System design", 0.25],
        ["Ownership", 0.2],
        ["Collaboration", 0.2],
      ]),
    },
    {
      id: "job_r3",
      organizationId: org.id,
      title: "Product Designer",
      dept: "Product",
      level: 2,
      expMin: 3.0,
      expMax: 6.0,
      reqSkills: JSON.stringify(["Figma", "User Research", "Prototyping", "Design Systems"]),
      niceSkills: JSON.stringify(["Analytics", "Motion Design"]),
      idealMbti: JSON.stringify(["INFP", "ENFP", "ISFP", "INFJ"]),
      bandMin: 14.0,
      bandMax: 24.0,
      daysOpen: 21,
      hiringManager: "Head of Product",
      competencies: JSON.stringify([
        ["Craft & visual design", 0.3],
        ["User research", 0.25],
        ["Product thinking", 0.25],
        ["Communication", 0.2],
      ]),
    },
    {
      id: "job_r4",
      organizationId: org.id,
      title: "Enterprise Account Executive",
      dept: "Sales",
      level: 3,
      expMin: 5.0,
      expMax: 9.0,
      reqSkills: JSON.stringify(["Enterprise Sales", "Negotiation", "CRM (Salesforce)", "Forecasting", "SaaS"]),
      niceSkills: JSON.stringify(["Presentation", "Prospecting"]),
      idealMbti: JSON.stringify(["ENTJ", "ESTP", "ENFJ", "ESTJ"]),
      bandMin: 18.0,
      bandMax: 32.0,
      daysOpen: 47,
      hiringManager: "VP Sales",
      competencies: JSON.stringify([
        ["Deal closing", 0.3],
        ["Discovery & qualification", 0.25],
        ["Negotiation", 0.25],
        ["Forecast discipline", 0.2],
      ]),
    },
  ];

  for (const j of jobsData) {
    await prisma.job.create({ data: j });
  }
  console.log("✅ 4 Open Job Openings created.");

  // 5. Seed Candidates
  await prisma.candidate.deleteMany({ where: { organizationId: org.id } });
  const candsData = [
    {
      id: "cand_1",
      organizationId: org.id,
      jobId: "job_r1",
      name: "Sneha Kulkarni",
      company: "Kestrel Payments",
      title: "Senior Data Analyst",
      stage: "Interview",
      exp: 5.5,
      curCtc: 16.5,
      expcCtc: 22.0,
      city: "Bengaluru",
      notice: 30,
      offers: 2,
      gender: "F",
      age: 29,
      mbti: "INTJ",
      source: "LinkedIn",
      skills: JSON.stringify(["SQL", "Python", "Power BI", "Statistics", "A/B Testing", "Storytelling"]),
      cultureScore: 88,
      hops: 2,
      careerGap: 0,
      fitScore: 84,
      fitDetails: JSON.stringify({ overall: 84, skills: 90, exp: 95, pers: 85, retention: 70 }),
      redFlags: JSON.stringify([["info", "Expecting a 33% hike", "Above typical 20-25% range."]]),
    },
    {
      id: "cand_2",
      organizationId: org.id,
      jobId: "job_r3",
      name: "Zoya Fernandes",
      company: "Monsoon Media",
      title: "UI/UX Designer",
      stage: "Accepted",
      exp: 4.0,
      curCtc: 13.0,
      expcCtc: 17.5,
      city: "Bengaluru",
      notice: 30,
      offers: 0,
      gender: "F",
      age: 26,
      mbti: "INFP",
      source: "Referral",
      skills: JSON.stringify(["Figma", "User Research", "Prototyping", "Design Systems", "Analytics"]),
      cultureScore: 92,
      hops: 1,
      careerGap: 0,
      joinInDays: 12,
      fitScore: 88,
      fitDetails: JSON.stringify({ overall: 88, skills: 95, exp: 90, pers: 90, retention: 85 }),
      redFlags: JSON.stringify([]),
    },
    {
      id: "cand_3",
      organizationId: org.id,
      jobId: "job_r2",
      name: "Rohan Gupta",
      company: "Vertex Cloudworks",
      title: "SDE II",
      stage: "Screening",
      exp: 4.5,
      curCtc: 17.0,
      expcCtc: 23.0,
      city: "Bengaluru",
      notice: 60,
      offers: 1,
      gender: "M",
      age: 28,
      mbti: "INTP",
      source: "Naukri",
      skills: JSON.stringify(["Java", "Microservices", "SQL", "AWS", "Kubernetes"]),
      cultureScore: 78,
      hops: 2,
      careerGap: 0,
      fitScore: 78,
      fitDetails: JSON.stringify({ overall: 78, skills: 85, exp: 80, pers: 75, retention: 70 }),
      redFlags: JSON.stringify([]),
    },
    {
      id: "cand_4",
      organizationId: org.id,
      jobId: "job_r4",
      name: "Priya Nair",
      company: "Orbitline Logistics",
      title: "Enterprise AE",
      stage: "Offer",
      exp: 7.0,
      curCtc: 20.0,
      expcCtc: 26.0,
      city: "Bengaluru",
      notice: 30,
      offers: 1,
      gender: "F",
      age: 31,
      mbti: "ENTJ",
      source: "LinkedIn",
      skills: JSON.stringify(["Enterprise Sales", "Negotiation", "CRM (Salesforce)", "Forecasting", "SaaS"]),
      cultureScore: 85,
      hops: 2,
      careerGap: 0,
      fitScore: 81,
      fitDetails: JSON.stringify({ overall: 81, skills: 90, exp: 85, pers: 80, retention: 75 }),
      redFlags: JSON.stringify([]),
    },
  ];

  for (const c of candsData) {
    await prisma.candidate.create({ data: c });
  }
  console.log("✅ Candidate pipeline seeded.");

  // 6. Seed Compliance Records
  await prisma.complianceRecord.deleteMany({ where: { organizationId: org.id } });
  const compData = [
    {
      organizationId: org.id,
      title: "Internal Committee (POSH) constituted & notice displayed",
      area: "POSH",
      status: "done",
      dueDate: "Reviewed Jul 2026",
    },
    {
      organizationId: org.id,
      title: "Annual POSH report filed with District Officer",
      area: "POSH",
      status: "due",
      dueDate: "Due in 112 days",
    },
    {
      organizationId: org.id,
      title: "Fire NOC renewal - Bengaluru office",
      area: "Safety",
      status: "due",
      dueDate: "Expires in 21 days",
    },
    {
      organizationId: org.id,
      title: "Half-yearly fire drill conducted",
      area: "Safety",
      status: "over",
      dueDate: "Overdue by 18 days",
    },
    {
      organizationId: org.id,
      title: "Shops & Establishments registration",
      area: "Registrations",
      status: "done",
      dueDate: "Valid to Mar 2028",
    },
    {
      organizationId: org.id,
      title: "PF & ESI monthly returns (Aug 2026)",
      area: "Statutory",
      status: "done",
      dueDate: "Filed 12 Aug",
    },
    {
      organizationId: org.id,
      title: "Professional Tax - Karnataka (Aug 2026)",
      area: "Statutory",
      status: "done",
      dueDate: "Filed 18 Aug",
    },
  ];

  for (const c of compData) {
    await prisma.complianceRecord.create({ data: c });
  }
  console.log("✅ Compliance records seeded.");

  console.log("🚀 Seeding completed successfully for 200 employees!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
