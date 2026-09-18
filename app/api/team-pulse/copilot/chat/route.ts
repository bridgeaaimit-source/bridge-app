import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt, history } = await req.json();
    const l = (prompt || "").toLowerCase();

    let reply = "";

    if (/candidate|shortlist|best fit|top 3|hire for/.test(l)) {
      reply = `**Top 3 Candidates for Senior Data Analyst**
1. **Sneha Kulkarni**: Fit score **94/100**, 6 yrs experience at AnalyticsCo, current CTC ₹18.0 L, expected ₹22.0 L, 30-day notice period.
2. **Rahul Varma**: Fit score **88/100**, 5 yrs experience at TechCorp, current ₹16.5 L, expected ₹20.0 L, 60-day notice period.
3. **Ananya Sharma**: Fit score **82/100**, 4 yrs experience at DataGrid, current ₹15.0 L, expected ₹18.5 L, 45-day notice period.

**Recommended Offer for Sneha Kulkarni:**
- **Base CTC:** **₹21.5 L** (19.4% hike, perfectly aligned within the ₹18.0–₹24.0 L band).
- **Joining Bonus:** **₹1.5 L** (to compensate for competing offers).
- **Notice Period:** 30 days — offer a ₹50k buyout if early onboarding is needed.`;
    } else if (/attrition|leave|flight|risk|quit/.test(l)) {
      reply = `**Highest Flight Risk Employees (Top 5)**
- **Vikram Malhotra** (Senior Frontend Dev): Flight Risk **84/100** — *Drivers: Below market pay (-22%), 3.2 yrs in current role.*
- **Neha Gupta** (Product Designer): Flight Risk **79/100** — *Drivers: Below market pay (-18%), high overtime.*
- **Rohan Mehta** (Backend Engineer): Flight Risk **76/100** — *Drivers: Manager transition, below market pay (-15%).*
- **Priya Sundaram** (QA Lead): Flight Risk **71/100** — *Drivers: Stagnant promotion score, high on-call stress.*
- **Amitabh Sen** (DevOps Engineer): Flight Risk **68/100** — *Drivers: Below market pay (-12%).*

**Financial Impact Analysis:**
- Correcting compensation for these 5 key individuals costs approximately **₹8.4 L/yr**.
- Total replacement cost if all 5 leave: **₹48.2 L** (recruiting fees + onboarding loss + lost momentum).
- **Action:** Schedule stay interviews with Vikram and Neha immediately.`;
    } else if (/promot/.test(l)) {
      reply = `**Promotion-Ready Employees (Appraisal Cycle 2026)**
- **Arjun Nair** (Senior SDE II → Staff SDE): Rating **4.8/5**, 24 months in role. Suggested Hike: **18%** (₹32.0 L → ₹37.8 L).
- **Kavita Krishnan** (Product Manager → Lead PM): Rating **4.7/5**, 20 months in role. Suggested Hike: **16%** (₹26.0 L → ₹30.1 L).
- **Sanjay Rao** (Data Scientist → Senior Data Scientist): Rating **4.6/5**, 18 months in role. Suggested Hike: **15%** (₹22.0 L → ₹25.3 L).
- **Meera Joshi** (HR Business Partner → Senior HRBP): Rating **4.5/5**, 22 months in role. Suggested Hike: **14%** (₹18.0 L → ₹20.5 L).

*All 4 candidates meet internal latency, performance calibration thresholds, and have strong manager endorsement.*`;
    } else if (/pip|under.?perform|low perform/.test(l)) {
      reply = `**Performance Improvement Plan (PIP) Watchlist (3 Employees)**
1. **Rajesh Kumar** (Fullstack Dev): Rating **2.1/5**, Goal completion **48%**.
2. **Pooja Verma** (Sales Executive): Rating **2.3/5**, Target achievement **52%**.
3. **Deepak Sharma** (Support Engineer): Rating **2.4/5**, SLA breach rate **18%**.

**Recommended Pre-PIP Checklist:**
- [ ] Confirm role expectations and recent OKRs were formally communicated.
- [ ] Rule out recent manager changes (Rajesh had a manager swap 45 days ago).
- [ ] Check workload allocation and personal/health factors before formal PIP issuance.`;
    } else if (/posh|complian|fire|training|overdue/.test(l)) {
      reply = `**Statutory Compliance & Training Status**
- **POSH Awareness Training:** **14 employees overdue** (88% company completion).
- **Fire Safety & Evacuation Drill:** **18 days overdue**; Fire NOC expires in 21 days (Bengaluru Office).
- **Code of Conduct Sign-off:** **5 employees pending**.
- **DPDP Data Privacy Module:** **9 employees pending**.

**Instant Action:** Use the **Compliance Center** module to trigger bulk email reminders to all 14 POSH-overdue employees.`;
    } else if (/headcount|plan|how many|people do we/.test(l)) {
      reply = `**Current Workforce Snapshot**
- **Total Active Headcount:** **64 employees**
  - Engineering & Product: **32**
  - Sales & Marketing: **14**
  - Customer Success & Operations: **11**
  - HR & Finance: **7**

- **Open Recruiting Requisitions:** **8 roles**
- Longest open role: *Backend Engineer (SDE II)* — open for **52 days**.`;
    } else if (/happy|mood|sentiment|engag|burnout/.test(l)) {
      reply = `**Employee Engagement & Sentiment Analysis (September 2026)**
- **Overall Happiness Index:** **70/100** (Company eNPS: **+18**)
- **Department Mood Heatmap:**
  - HR & People: **78/100** (Up +4)
  - Sales: **74/100** (Up +2)
  - Product Design: **72/100** (Stable)
  - Engineering: **61/100** (*Warning: Down -8 since June*)

**Burnout Risk Drivers in Engineering:**
- Weekend deployments & high on-call frequency reported in 12 exit/pulse comments.
- Recommendation: Introduce rotation for on-call duties and mandatory comp-offs.`;
    } else if (/offer letter/.test(l)) {
      reply = `**Arcadia Softworks Pvt Ltd — Formal Offer of Employment**

**Date:** September 19, 2026
**Candidate Name:** Sneha Kulkarni

Dear **Sneha**,

We are pleased to offer you the full-time position of **Senior Data Analyst** at **Arcadia Softworks Pvt Ltd**, reporting to **Karan Malhotra, Director of Analytics**.

1. **Compensation & CTC:** Your Total Target Annual CTC will be **₹21,500,000** (Rupees Twenty-One Lakh Fifty Thousand only), split as 90% Fixed Base and 10% Annual Performance Variable.
2. **Joining Bonus:** A one-time joining bonus of **₹1,500,000** will be disbursed with your first month's salary, subject to a 12-month clawback clause.
3. **Location & Work Model:** Bengaluru Headquarters (Hybrid model — 3 anchor days in office).
4. **Target Joining Date:** October 20, 2026.

Please confirm your acceptance by signing and returning a copy of this letter within 5 business days.

Warm regards,
**HR Team — Arcadia Softworks**`;
    } else if (/rejection|reject/.test(l)) {
      reply = `**Subject: Your Application for Senior Data Analyst at Arcadia Softworks**

Dear Candidate,

Thank you very much for taking the time to interview with our team for the **Senior Data Analyst** position.

While our interview panel was thoroughly impressed with your technical capabilities and problem-solving domain expertise, we have decided to proceed with another applicant whose experience aligns slightly more closely with our immediate infrastructure requirements.

We truly appreciate your engagement with Arcadia Softworks and would love to retain your profile for upcoming senior roles in our pipeline.

Wishing you great success in your career search!

Best regards,
**Talent Acquisition Team**
Arcadia Softworks Pvt Ltd`;
    } else if (/policy|wfh|hybrid/.test(l)) {
      reply = `**Arcadia Softworks — Hybrid Work Policy Framework**

1. **Purpose & Scope:** Establish clear hybrid work standards while maximizing collaborative synergy across all India offices.
2. **Work Arrangement:**
   - **3 Anchor In-Office Days:** Tuesday, Wednesday, Thursday.
   - **2 Flexible WFH Days:** Monday, Friday.
3. **Core Collaboration Hours:** 11:00 AM – 4:00 PM IST for cross-functional syncs.
4. **Home Office Allowance:** One-time stipend of **₹10,000** for ergonomic desk setup.
5. **Data Security & Compliance:** All employees must connect via corporate VPN (Zscaler) and strictly comply with DPDP data handling norms.
6. **Exceptions:** Short-term medical or caregiving exceptions require Manager & HRBP approval.`;
    } else if (/appraisal letter/.test(l)) {
      reply = `**Arcadia Softworks — Annual Performance Appraisal Letter**

**Date:** October 1, 2026
**Employee Name:** Arjun Nair
**Employee ID:** AS-1042
**Role:** Senior SDE II

Dear **Arjun**,

Following our annual 2026 performance calibration review, we are delighted to congratulate you on achieving an overall performance rating of **4.8 / 5.0 (Exceeds All Expectations)**.

In recognition of your exceptional contributions to the core architecture:
- **Promoted Role:** **Staff Software Engineer (L6)**
- **Revised Annual Base CTC:** **₹37,80,000** (an 18.1% salary revision, effective October 1, 2026).

Thank you for your outstanding dedication and engineering leadership!

Warm regards,
**Chief Human Resources Officer**
Arcadia Softworks Pvt Ltd`;
    } else if (/warning letter/.test(l)) {
      reply = `**CONFIDENTIAL — Written Warning Notice**

**Date:** September 19, 2026
**To:** Employee Confidential Record
**Subject:** First Written Warning regarding Unexplained Absences

Dear Employee,

This letter serves as a formal **First Written Warning** regarding repeated unexcused absences on September 5, September 11, and September 14, 2026, without prior notification or manager authorization, violating Section 4.2 of the Arcadia Softworks Attendance & Leave Policy.

**Required Remedial Actions:**
1. Maintain regular attendance and adhere strictly to standard shift timing.
2. Submit all leave applications in advance via the HR Portal.
3. Attend a mandatory 1-on-1 counseling session with your HRBP on September 22, 2026.

Failure to improve attendance or repeated unauthorized absences may lead to further disciplinary action in accordance with applicable Indian labor standards.

Sincerely,
**HR Compliance & Employee Relations**`;
    } else {
      reply = `Here is how I can assist you with workforce intelligence and HR actions:

- **Hiring & Candidates:** *"Who are my top 3 candidates for Senior Data Analyst, and what should I offer the best one?"*
- **Attrition Risk:** *"Who is most likely to leave in the next 6 months and why?"*
- **Promotions & PIP:** *"Who is ready for promotion this cycle?"* or *"Who should be on a PIP?"*
- **Compliance:** *"Which employees are overdue on mandatory POSH training?"*
- **Documents & Policy:** Click any document button on the right to generate offer letters, rejection emails, hybrid policies, appraisal letters, or warning letters.`;
    }

    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
