// Domain Foundations — lesson content for the Domain Training page.
// Written for Indian campus placements. Every real-world example below is a
// well-known, publicly reported fact; keep it that way when editing (no invented
// statistics). Labour-code facts checked against EY / India Briefing, Nov 2025.

export const TRACKS = [
  {
    id: 'answer-skills',
    title: 'Interview Answer Skills',
    tagline: 'Structure every answer so the panel remembers it.',
    forDomains: ['all'],
    interviewDomain: 'MBA General',
    lessons: [
      {
        id: 'tell-me-about-yourself',
        title: 'Tell me about yourself',
        minutes: 6,
        whyItMatters:
          'It is the first question in almost every Indian campus interview, and the panel decides in the first minute whether you are structured and self-aware.',
        concepts: [
          'Use Present → Past → Future: who you are now, what you have done that proves it, and why this role is the next step.',
          'Keep it to 60–90 seconds. It is a trailer, not your full resume.',
          'Pick two achievements with a result you can explain, not a list of everything.',
          'End with a link to the company or role so the conversation moves forward.',
        ],
        interviewerAsks: [
          'Tell me about yourself.',
          'Walk me through your resume.',
          'Introduce yourself in one minute.',
        ],
        standoutAnswer: {
          question: 'Tell me about yourself.',
          framework: 'Present (1 line) → Past (2 proof points with results) → Future (why this role).',
          answer:
            "I'm an MBA student specialising in [your specialisation] at [your college]. Before my MBA I worked as [role] at [company], where I [one task] and it led to [result you can explain]. During my summer internship at [company] I [project] for [team], which [outcome]. I want to build a career in [function], and this role interests me because [one specific reason about the company or role].",
          whyItWorks:
            'It is short, structured, and every claim is something the panel can ask a follow-up on — which is exactly where you want them to go.',
        },
        realExample:
          'Large recruiters such as TCS run common entry tests (the TCS National Qualifier Test) and then a short interview; with many candidates per day, panels value a crisp, structured introduction.',
        mistakes: [
          'Repeating the resume line by line.',
          'Starting with your childhood or hometown.',
          'Ending without saying why you want this role.',
        ],
        quiz: [
          {
            q: 'What is a good length for "Tell me about yourself"?',
            options: ['15 seconds', '60–90 seconds', '4–5 minutes', 'As long as the panel allows'],
            answer: 1,
            explain: 'Long enough to show two proof points, short enough to leave room for follow-up questions.',
          },
          {
            q: 'Which structure works best?',
            options: ['Past → Present → Hobbies', 'Present → Past → Future', 'Hobbies → Family → Goals', 'Future → Salary → Past'],
            answer: 1,
            explain: 'Present–Past–Future gives context, proof and direction in that order.',
          },
          {
            q: 'How should the answer end?',
            options: ['With your hobbies', 'With a link to this role or company', 'With your salary expectation', 'With a question about leave policy'],
            answer: 1,
            explain: 'Ending on why this role moves the conversation to your fit for the job.',
          },
        ],
      },
      {
        id: 'star-method',
        title: 'The STAR method for behavioural questions',
        minutes: 7,
        whyItMatters:
          'Questions like "Tell me about a time you handled conflict" test judgement. Without structure, answers become stories with no point.',
        concepts: [
          'Situation: one or two lines of context.',
          'Task: what you specifically had to achieve.',
          'Action: what YOU did (say "I", not "we") — this should be the longest part.',
          'Result: the outcome, ideally measurable, plus what you learnt.',
        ],
        interviewerAsks: [
          'Tell me about a time you led a team.',
          'Describe a failure and what you learnt.',
          'Give an example of handling a difficult person.',
        ],
        standoutAnswer: {
          question: 'Tell me about a time you handled a conflict in a team.',
          framework: 'S (context) → T (your responsibility) → A (2–3 specific actions) → R (result + learning).',
          answer:
            'In my [course/club/internship], our team of [number] had to deliver [project] in [timeframe] (S). As coordinator, I had to get two members who disagreed on [issue] to agree on one plan (T). I met each of them separately to understand their concern, put both options side by side with the deadline and effort for each, and suggested we test the faster option for two days (A). We agreed on one approach, submitted on time and [result]. I learnt that most conflicts are about unclear criteria, not people (R).',
          whyItWorks: 'The actions are specific and personal, and the learning shows maturity.',
        },
        realExample:
          "Google's Project Oxygen studied what makes its managers effective and found that behaviours like good coaching and clear communication mattered more than technical expertise — which is why panels ask how you handle people.",
        mistakes: [
          'Saying "we did" throughout, so the panel cannot see your role.',
          'Spending most of the time on the situation.',
          'Choosing an example with no clear result.',
        ],
        quiz: [
          {
            q: 'Which part of STAR should usually be the longest?',
            options: ['Situation', 'Task', 'Action', 'Result'],
            answer: 2,
            explain: 'The panel is assessing what you did, so Action carries the most weight.',
          },
          {
            q: 'Why should you say "I" more than "we" in the Action part?',
            options: ['It sounds confident', 'The panel needs to see your personal contribution', 'Team work is not valued', 'It is shorter'],
            answer: 1,
            explain: 'Teamwork is valued, but the panel is evaluating you, not the team.',
          },
          {
            q: 'A strong Result includes…',
            options: ['Only how you felt', 'An outcome and what you learnt', 'Praise from your friends', 'Nothing — results are optional'],
            answer: 1,
            explain: 'Outcome plus learning shows impact and self-awareness.',
          },
        ],
      },
      {
        id: 'standout-answers',
        title: 'Answers nobody else gives',
        minutes: 6,
        whyItMatters:
          'Panels hear the same textbook answers all day. A real, current example and one sharp insight make you memorable.',
        concepts: [
          'Point → Example → Insight: make the point, prove it with a real example, then add what most people miss.',
          'Use examples from Indian business news you can explain in two lines (UPI, quick commerce, the new labour codes).',
          'Use numbers only if you are sure of them; a wrong statistic destroys credibility.',
          'Connect the example back to the role you are applying for.',
        ],
        interviewerAsks: [
          'What is a recent business development you found interesting?',
          'How would you apply this concept in practice?',
          'Why does this matter for our company?',
        ],
        standoutAnswer: {
          question: 'What is a recent business development you found interesting?',
          framework: 'Point → Example → Insight → Link to role.',
          answer:
            "Quick commerce. Companies like Blinkit and Zepto deliver groceries from small 'dark stores' placed close to customers. The insight most people miss is that this is an inventory problem, not a delivery problem: a dark store can only stock limited items, so deciding which items to keep, and how much, decides both speed and profit. That is why I'm interested in operations roles — the competitive edge is in planning, not just in riders.",
          whyItWorks: 'It uses a real model everyone knows, then adds an operations insight and links it to the role.',
        },
        realExample:
          "India's four labour codes came into force on 21 November 2025, replacing 29 central labour laws — a strong, current example for any HR or operations discussion.",
        mistakes: [
          'Quoting numbers you are not sure about.',
          'Picking an example you cannot explain if asked a follow-up.',
          'Giving the example but no insight of your own.',
        ],
        quiz: [
          {
            q: 'What makes an example "standout"?',
            options: ['It is very long', 'It is real, current, and you add your own insight', 'It uses many statistics', 'It is about a foreign company'],
            answer: 1,
            explain: 'Real + current + your own insight is what panels remember.',
          },
          {
            q: 'You are not sure of an exact statistic. You should…',
            options: ['Guess confidently', 'Make the point without the number, or say it is approximate', 'Change the topic', 'Quote a famous report anyway'],
            answer: 1,
            explain: 'A wrong number damages credibility more than no number.',
          },
          {
            q: 'When did India’s four labour codes come into force?',
            options: ['1 April 2024', '21 November 2025', '15 August 2023', 'They have not come into force'],
            answer: 1,
            explain: 'The four codes were brought into effect from 21 November 2025.',
          },
        ],
      },
    ],
  },

  {
    id: 'hr',
    title: 'HR Foundations',
    tagline: 'The HR basics every interviewer expects you to know.',
    forDomains: ['HR', 'MBA General'],
    interviewDomain: 'MBA General',
    lessons: [
      {
        id: 'recruitment-funnel',
        title: 'Recruitment and selection',
        minutes: 7,
        whyItMatters: 'Every HR interview starts here: how a company finds, tests and hires people, and how it measures that process.',
        concepts: [
          'The funnel: workforce planning → sourcing → screening → assessment → interviews → offer → onboarding.',
          'Sourcing channels: campus hiring, job portals, employee referrals, consultants, internal mobility.',
          'Key metrics: time-to-hire, cost-per-hire, offer-acceptance rate, quality of hire, early attrition.',
          'Assessment tools: aptitude tests, group discussions, case interviews, technical and HR interviews.',
        ],
        interviewerAsks: [
          'Walk me through a recruitment process.',
          'How would you reduce time-to-hire?',
          'How do you measure the quality of a hire?',
        ],
        standoutAnswer: {
          question: 'How would you improve a campus hiring process?',
          framework: 'Diagnose with a metric → find the bottleneck stage → fix that stage → measure again.',
          answer:
            "I'd first measure each funnel stage — applications, test pass rate, GD and interview conversion, offer acceptance. If acceptance is low, the problem is the offer or employer brand, not sourcing; if many drop after the test, the test may not match the role. Large IT employers already standardise the first filter — TCS, for example, uses its National Qualifier Test as a common entry test — which saves interview time. I'd keep a common test, then track 6-month retention of each campus to judge quality of hire, not just numbers.",
          whyItWorks: 'It is metric-led, uses a real example, and measures quality — not only speed.',
        },
        realExample: 'TCS uses the TCS National Qualifier Test (NQT) as a common entry test for fresher hiring across many campuses.',
        mistakes: [
          'Describing only interviews and forgetting planning and onboarding.',
          'Talking about speed without quality.',
          'No metrics at all.',
        ],
        quiz: [
          {
            q: 'Which metric best reflects "quality of hire"?',
            options: ['Number of applications', 'Performance and retention of new hires after some months', 'Cost of job ads', 'Number of interview rounds'],
            answer: 1,
            explain: 'Quality shows up in how new hires perform and whether they stay.',
          },
          {
            q: 'Offer acceptance is low but interviews go well. Where is the likely problem?',
            options: ['Sourcing', 'The offer or employer brand', 'The aptitude test', 'Onboarding'],
            answer: 1,
            explain: 'Candidates are qualified but saying no — look at pay, role clarity and brand.',
          },
          {
            q: 'Which comes first in a recruitment funnel?',
            options: ['Offer', 'Onboarding', 'Workforce planning', 'Interview'],
            answer: 2,
            explain: 'You decide how many people and which roles you need before sourcing.',
          },
        ],
      },
      {
        id: 'compensation-ctc',
        title: 'Compensation: CTC vs in-hand',
        minutes: 7,
        whyItMatters: 'Freshers are often asked to explain a salary structure, and HR roles deal with it every day.',
        concepts: [
          'CTC (cost to company) is the total yearly cost of an employee: fixed pay, variable pay, and employer contributions such as PF and gratuity.',
          'Gross salary is CTC minus employer-side items like the employer PF contribution and gratuity; in-hand (net) pay is gross minus deductions such as employee PF, professional tax and income tax.',
          'Under EPF, the employer and the employee each typically contribute 12% of basic wages.',
          'Gratuity is paid under the Payment of Gratuity Act; under the new labour codes, fixed-term employees become eligible after one year of service.',
        ],
        interviewerAsks: [
          'What is the difference between CTC and in-hand salary?',
          'Why might two offers with the same CTC have different take-home pay?',
          'What is variable pay?',
        ],
        standoutAnswer: {
          question: 'Why can two offers with the same CTC have different take-home pay?',
          framework: 'Define CTC → name what sits inside it → show how the split changes take-home.',
          answer:
            'CTC includes items you never receive monthly: the employer PF contribution, gratuity, and variable pay that depends on performance. If one offer has a larger variable component or a higher basic (which raises PF on both sides), the monthly in-hand pay will be lower even with the same CTC. So I compare fixed monthly pay, variable pay and its payout history, and long-term benefits — not just the CTC number.',
          whyItWorks: 'It shows practical understanding and a decision rule, not just definitions.',
        },
        realExample:
          "India's labour codes, in force since 21 November 2025, introduced a uniform definition of wages and one-year gratuity eligibility for fixed-term employees — changes payroll teams across India had to plan for.",
        mistakes: [
          'Treating CTC as the monthly salary × 12.',
          'Forgetting variable pay depends on performance.',
          'Mixing up employer and employee PF.',
        ],
        quiz: [
          {
            q: 'Which of these is part of CTC but not monthly in-hand pay?',
            options: ['Basic salary', 'Employer PF contribution', 'HRA', 'Special allowance'],
            answer: 1,
            explain: 'The employer PF contribution goes into your PF account, not your monthly pay.',
          },
          {
            q: 'Under the new labour codes, fixed-term employees are eligible for gratuity after…',
            options: ['5 years', '3 years', '1 year', '6 months'],
            answer: 2,
            explain: 'Eligibility for fixed-term employees was reduced from five years to one year.',
          },
          {
            q: 'Typical EPF contribution by the employer is…',
            options: ['5% of CTC', '12% of basic wages', '20% of gross', 'Nothing'],
            answer: 1,
            explain: 'Both employer and employee typically contribute 12% of basic wages.',
          },
        ],
      },
      {
        id: 'performance-management',
        title: 'Performance management',
        minutes: 7,
        whyItMatters: 'Appraisal systems decide pay, promotion and retention — a favourite interview topic and a common GD topic.',
        concepts: [
          'KRAs (key result areas) define what a role is responsible for; KPIs measure progress on them.',
          'Methods: Management by Objectives, 360-degree feedback, bell curve / forced ranking, OKRs, continuous check-ins.',
          'Forced ranking pushes differentiation but can hurt teamwork; continuous feedback improves development but needs manager time.',
          'Good systems separate development conversations from pay decisions and use clear, measurable goals.',
        ],
        interviewerAsks: [
          'What is the bell curve appraisal and is it fair?',
          'KRA vs KPI — what is the difference?',
          'How would you design an appraisal for a sales team?',
        ],
        standoutAnswer: {
          question: 'Is the bell curve a fair appraisal method?',
          framework: 'Explain → one benefit → one harm → when it fits → better alternative.',
          answer:
            "The bell curve forces managers to differentiate, which stops everyone being rated 'excellent'. But it assumes every team has the same spread of talent, which is rarely true for small or high-performing teams, and it can make colleagues compete instead of collaborate. That is partly why firms such as Accenture and Deloitte publicly moved away from annual rankings around 2015 towards more frequent check-ins. I'd use clear goals with regular feedback, and keep relative ranking only for large populations where it makes statistical sense.",
          whyItWorks: 'Balanced, uses real companies, and ends with a practical recommendation.',
        },
        realExample:
          'In 2015 Deloitte described redesigning its performance management in Harvard Business Review, and Accenture announced it was dropping annual rankings in favour of ongoing feedback.',
        mistakes: [
          'Only defining terms without an opinion.',
          'Saying one method is perfect for every company.',
          'Ignoring the manager effort a system needs.',
        ],
        quiz: [
          {
            q: 'KRA vs KPI: which is correct?',
            options: ['They are the same', 'KRA is the area of responsibility; KPI measures performance in it', 'KPI is the job title', 'KRA is only for managers'],
            answer: 1,
            explain: 'KRAs define what you own; KPIs tell you how well you are doing.',
          },
          {
            q: 'A key weakness of forced ranking is…',
            options: ['It is too easy', 'It assumes the same talent spread in every team', 'It needs no data', 'It always increases pay'],
            answer: 1,
            explain: 'Small or strong teams get unfairly forced into low ratings.',
          },
          {
            q: 'OKRs stand for…',
            options: ['Objectives and Key Results', 'Operational Key Ratios', 'Organised Knowledge Reviews', 'Output and Key Rewards'],
            answer: 0,
            explain: 'Objectives and Key Results — a goal-setting method popularised by Intel and Google.',
          },
        ],
      },
      {
        id: 'labour-law-basics',
        title: 'Labour law basics for HR',
        minutes: 8,
        whyItMatters: 'HR interviewers check that you know the legal basics, and the new labour codes are the biggest change in decades.',
        concepts: [
          'Four labour codes came into force on 21 November 2025: Code on Wages (2019), Industrial Relations Code (2020), Code on Social Security (2020), and Occupational Safety, Health and Working Conditions Code (2020).',
          'Together they replace 29 central labour laws.',
          'Highlights reported at launch: mandatory appointment letters, social security coverage extended to gig and platform workers, and one-year gratuity eligibility for fixed-term employees.',
          'Separate laws still matter: the POSH Act, 2013 requires an Internal Committee in workplaces with 10 or more employees; the Maternity Benefit (Amendment) Act, 2017 provides up to 26 weeks of paid maternity leave.',
        ],
        interviewerAsks: [
          'What are the new labour codes?',
          'What does the POSH Act require from employers?',
          'How do the labour codes affect gig workers?',
        ],
        standoutAnswer: {
          question: 'What do the new labour codes mean for an HR team?',
          framework: 'What changed → who is affected → what HR must do now.',
          answer:
            'Since 21 November 2025, four codes have replaced 29 central labour laws. For HR, three things change in practice: every worker must get an appointment letter, payroll has to follow a uniform definition of wages, and fixed-term employees now become eligible for gratuity after one year. The codes also bring gig and platform workers under social security. So HR teams need to audit employee classifications, update salary structures and contracts, and plan for state rules, which are still being notified.',
          whyItWorks: 'It is current, accurate, and turns law into concrete HR actions.',
        },
        realExample:
          'The labour codes took effect across India from 21 November 2025, replacing 29 central labour laws.',
        mistakes: [
          'Saying the labour codes are "still proposed" — they are in force.',
          'Listing laws without explaining what HR must do.',
          'Confusing the POSH Internal Committee threshold (10 or more employees).',
        ],
        quiz: [
          {
            q: 'How many central labour laws do the four codes replace?',
            options: ['4', '12', '29', '44'],
            answer: 2,
            explain: 'The four codes consolidate 29 central labour laws.',
          },
          {
            q: 'Under the POSH Act, an Internal Committee is required when a workplace has…',
            options: ['5 or more employees', '10 or more employees', '50 or more employees', '100 or more employees'],
            answer: 1,
            explain: 'Workplaces with 10 or more employees must constitute an Internal Committee.',
          },
          {
            q: 'Paid maternity leave under the 2017 amendment is up to…',
            options: ['12 weeks', '18 weeks', '26 weeks', '52 weeks'],
            answer: 2,
            explain: 'The Maternity Benefit (Amendment) Act, 2017 raised it to up to 26 weeks.',
          },
        ],
      },
    ],
  },

  {
    id: 'operations',
    title: 'Operations Foundations',
    tagline: 'Process, inventory, supply chain and quality — explained with Indian examples.',
    forDomains: ['Operations'],
    interviewDomain: 'Operations',
    lessons: [
      {
        id: 'process-capacity',
        title: 'Process, capacity and bottlenecks',
        minutes: 7,
        whyItMatters: 'Operations interviews almost always test whether you can find the bottleneck in a process.',
        concepts: [
          'Capacity is the maximum output of a step per unit time; the slowest step (the bottleneck) limits the whole process.',
          'Throughput = units completed per unit time; cycle time = time between two completed units; lead time = total time one unit spends in the system.',
          "Little's Law: average work-in-progress = throughput × average lead time.",
          'Improving any step other than the bottleneck does not increase output.',
        ],
        interviewerAsks: [
          'How do you find a bottleneck?',
          'Our output is low though everyone is busy. Why?',
          "Explain Little's Law with an example.",
        ],
        standoutAnswer: {
          question: 'A restaurant kitchen is always busy but orders are slow. What would you do?',
          framework: 'Map the steps → time each step → find the slowest → fix it → recheck.',
          answer:
            "I'd map the steps — order taking, prep, cooking, plating, delivery to table — and time each. If cooking takes 6 minutes per order but every other step takes 2, the kitchen can't do better than 10 orders an hour no matter how fast the waiters are. So I'd add capacity at that step: a second burner station, pre-prepping ingredients, or a smaller menu at peak hours. Then I'd re-measure, because the bottleneck usually moves to the next slowest step.",
          whyItWorks: 'Clear method, simple arithmetic, and the insight that bottlenecks move.',
        },
        realExample:
          "Mumbai's dabbawalas deliver lakhs of home-cooked lunches every working day using a simple colour-and-number coding system and fixed handover points — a famous example of a low-tech, high-reliability process.",
        mistakes: [
          'Adding people to steps that are not the bottleneck.',
          'Confusing cycle time with lead time.',
          'Not re-checking after the fix.',
        ],
        quiz: [
          {
            q: 'A process has steps of 4, 9 and 5 minutes per unit. What limits output?',
            options: ['The 4-minute step', 'The 9-minute step', 'The 5-minute step', 'All equally'],
            answer: 1,
            explain: 'The slowest step (9 minutes) is the bottleneck.',
          },
          {
            q: "Little's Law states…",
            options: ['WIP = throughput × lead time', 'Cost = price × volume', 'Capacity = demand', 'Lead time = cycle time'],
            answer: 0,
            explain: 'Average inventory in the system equals throughput times average time in the system.',
          },
          {
            q: 'Speeding up a non-bottleneck step usually…',
            options: ['Doubles output', 'Does not increase total output', 'Removes the bottleneck', 'Reduces quality'],
            answer: 1,
            explain: 'Output is limited by the bottleneck, so other improvements do not raise throughput.',
          },
        ],
      },
      {
        id: 'inventory',
        title: 'Inventory management',
        minutes: 8,
        whyItMatters: 'Inventory ties up cash and decides service levels — a core topic for operations, supply chain and even finance roles.',
        concepts: [
          'Economic Order Quantity: EOQ = √(2DS / H), where D = annual demand, S = ordering cost per order, H = holding cost per unit per year.',
          'Reorder point = average daily demand × lead time (days) + safety stock.',
          'ABC analysis: A items are few but high value (control tightly); C items are many but low value.',
          'Just-in-time reduces stock but needs reliable suppliers; too little safety stock causes stock-outs.',
        ],
        interviewerAsks: [
          'What is EOQ and when does it fail?',
          'How do you set a reorder point?',
          'Too much stock or too little — which is worse?',
        ],
        standoutAnswer: {
          question: 'How should a quick-commerce dark store decide what to stock?',
          framework: 'Demand data → ABC classification → reorder points → review.',
          answer:
            "A dark store has very limited shelf space, so it can't stock everything. I'd classify items by sales velocity and margin — fast-moving essentials like milk, bread and vegetables are 'A' items that must never run out, so they get frequent replenishment and safety stock. Slow movers get minimal stock or are removed. Reorder points come from daily demand × supplier lead time plus a buffer for peaks like weekends and festivals. Then I'd review weekly, because neighbourhood demand shifts.",
          whyItWorks: 'Applies textbook tools to a current Indian business model.',
        },
        realExample:
          'Maruti Suzuki adopted Japanese production practices from its partner Suzuki, including just-in-time supply from nearby vendors — a classic Indian example of lean inventory.',
        mistakes: [
          'Writing the EOQ formula without saying what each letter means.',
          'Ignoring lead time variability when setting safety stock.',
          'Treating all items the same.',
        ],
        quiz: [
          {
            q: 'D = 1,000 units/year, S = ₹50/order, H = ₹10/unit/year. EOQ is…',
            options: ['50 units', '100 units', '200 units', '1,000 units'],
            answer: 1,
            explain: '√(2 × 1000 × 50 / 10) = √10,000 = 100 units.',
          },
          {
            q: 'Daily demand 20 units, lead time 5 days, safety stock 30. Reorder point is…',
            options: ['100', '130', '150', '25'],
            answer: 1,
            explain: '20 × 5 + 30 = 130 units.',
          },
          {
            q: "In ABC analysis, 'A' items are…",
            options: ['Many and cheap', 'Few but high value', 'Always perishable', 'Ordered once a year'],
            answer: 1,
            explain: 'A small share of items usually accounts for most of the value, so they get tight control.',
          },
        ],
      },
      {
        id: 'supply-chain',
        title: 'Supply chain and logistics',
        minutes: 7,
        whyItMatters: 'Supply chain questions test whether you see the whole system — suppliers to customers — not just one warehouse.',
        concepts: [
          'A supply chain links suppliers → manufacturing → distribution → retail → customer, with flows of goods, information and money.',
          'Bullwhip effect: small changes in customer demand get amplified as orders move up the chain; sharing real demand data reduces it.',
          'Hub-and-spoke networks consolidate goods at hubs; last-mile delivery is often the most expensive leg.',
          'Third-party logistics (3PL) partners handle warehousing or transport so a company can focus on its core business.',
        ],
        interviewerAsks: [
          'What is the bullwhip effect?',
          'How would you reduce last-mile delivery cost?',
          'How do e-commerce companies prepare for festive sales?',
        ],
        standoutAnswer: {
          question: 'How should an e-commerce company prepare for a festive sale?',
          framework: 'Forecast → position inventory → scale capacity → monitor live.',
          answer:
            "Start from a demand forecast using past sales and pre-sale wishlists, then move stock closer to customers in regional warehouses before the sale, so delivery distances shrink. Scale people and partners early — Flipkart, for example, announces seasonal hiring ahead of its Big Billion Days sale. During the sale, track live order and delivery data by region and shift capacity where backlogs build. The goal is to avoid both stock-outs in hot regions and excess stock elsewhere.",
          whyItWorks: 'End-to-end thinking with a well-known Indian example.',
        },
        realExample:
          "Amul's cooperative model links village milk societies to district unions and a state federation (GCMMF), which markets the Amul brand — a widely studied Indian supply chain.",
        mistakes: [
          'Talking only about transport.',
          'Ignoring information flow between partners.',
          'Not mentioning demand forecasting.',
        ],
        quiz: [
          {
            q: 'The bullwhip effect means…',
            options: ['Delivery delays at the last mile', 'Demand changes get amplified up the supply chain', 'Products are damaged in transit', 'Prices fall during sales'],
            answer: 1,
            explain: 'Each level over-reacts to orders from the next, so variability grows upstream.',
          },
          {
            q: 'A common way to reduce the bullwhip effect is…',
            options: ['Hide sales data from suppliers', 'Share real end-customer demand data along the chain', 'Order in bigger batches', 'Add more middlemen'],
            answer: 1,
            explain: 'Visibility of real demand stops each level from guessing and over-ordering.',
          },
          {
            q: "Amul's structure is best described as…",
            options: ['A single private factory', 'A three-tier cooperative: village societies, district unions, state federation', 'A foreign franchise', 'An online-only brand'],
            answer: 1,
            explain: 'Village cooperatives feed district unions, which are federated at the state level under GCMMF.',
          },
        ],
      },
      {
        id: 'quality',
        title: 'Quality management',
        minutes: 7,
        whyItMatters: 'Quality tools like Six Sigma and Kaizen come up in manufacturing, operations and consulting interviews.',
        concepts: [
          'Total Quality Management: quality is everyone’s job, with continuous improvement and customer focus.',
          'Six Sigma uses DMAIC — Define, Measure, Analyse, Improve, Control — to reduce variation and defects.',
          'Kaizen means small, continuous improvements; 5S (Sort, Set in order, Shine, Standardise, Sustain) organises the workplace.',
          'PDCA (Plan-Do-Check-Act) is the basic cycle behind most improvement methods.',
        ],
        interviewerAsks: [
          'Explain DMAIC with an example.',
          'Kaizen vs Six Sigma — when would you use each?',
          'How would you reduce defects on a production line?',
        ],
        standoutAnswer: {
          question: 'Defects on a packaging line have increased. What would you do?',
          framework: 'DMAIC, one line per step, with a concrete action.',
          answer:
            "Define: the defect — say, poorly sealed packs — and its cost. Measure: the defect rate by shift, machine and material batch for a week. Analyse: if defects cluster on one machine during the night shift, check settings and changeover practices there. Improve: fix the root cause, for example a standard setting checklist at every changeover. Control: a simple daily chart so the rate is watched and any rise is caught early.",
          whyItWorks: 'It turns a framework into specific steps and ends with control, which many candidates forget.',
        },
        realExample:
          'The Toyota Production System, the origin of many lean and Kaizen practices, strongly influenced Indian manufacturers — Maruti Suzuki brought many of these practices to Indian car making.',
        mistakes: [
          'Naming DMAIC without an example.',
          'Jumping to a solution before measuring.',
          'Forgetting the Control step.',
        ],
        quiz: [
          {
            q: 'What does DMAIC stand for?',
            options: ['Design, Make, Assess, Install, Check', 'Define, Measure, Analyse, Improve, Control', 'Decide, Monitor, Act, Inform, Close', 'Define, Manage, Audit, Improve, Certify'],
            answer: 1,
            explain: 'Define, Measure, Analyse, Improve, Control.',
          },
          {
            q: 'Kaizen is best described as…',
            options: ['One large redesign', 'Small, continuous improvements', 'A quality certificate', 'An inspection department'],
            answer: 1,
            explain: 'Kaizen means continuous, incremental improvement involving everyone.',
          },
          {
            q: 'Which step is most often forgotten?',
            options: ['Define', 'Measure', 'Improve', 'Control'],
            answer: 3,
            explain: 'Without Control, improvements fade and defects return.',
          },
        ],
      },
    ],
  },
];

export function getTrack(trackId) {
  return TRACKS.find((t) => t.id === trackId) || null;
}

/**
 * Picks training for a finished interview: the student's weakest area decides
 * the lesson. Communication/clarity/confidence gaps → answer skills; content
 * gaps → the domain track when one exists.
 */
export function recommendTraining({ domain, metrics = {} }) {
  const entries = Object.entries(metrics).filter(([, v]) => Number.isFinite(Number(v)));
  if (entries.length === 0) return null;
  const [weakest, score] = entries.sort((a, b) => Number(a[1]) - Number(b[1]))[0];
  if (Number(score) >= 8) return null; // strong everywhere — no remedial training needed

  const domainTrack = TRACKS.find((t) => t.id !== 'answer-skills' && t.forDomains.includes(domain));
  if (weakest === 'content' && domainTrack) {
    return {
      trackId: domainTrack.id,
      lessonId: domainTrack.lessons[0].id,
      reason: `Your answers needed more ${domain} depth (content ${score}/10).`,
    };
  }
  const lessonByMetric = {
    clarity: 'tell-me-about-yourself',
    communication: 'star-method',
    confidence: 'star-method',
    content: 'standout-answers',
  };
  return {
    trackId: 'answer-skills',
    lessonId: lessonByMetric[weakest] || 'star-method',
    reason: `Your weakest area was ${weakest} (${score}/10).`,
  };
}

/**
 * Same idea for the Smart Interview report, which scores different things
 * (communication, technical_knowledge, confidence, answer_quality,
 * problem_solving ...). Maps its weakest score to a lesson.
 */
export function recommendTrainingFromSmartInterview({ jobRole = '', scores = {} }) {
  const value = (v) => Number(typeof v === 'object' && v !== null ? v.score : v);
  const pick = (...keys) => {
    const found = keys.map((k) => value(scores[k])).filter(Number.isFinite);
    return found.length ? Math.min(...found) : undefined;
  };
  const metrics = {
    communication: pick('communication'),
    confidence: pick('confidence'),
    clarity: pick('answer_quality'),
    content: pick('technical_knowledge', 'problem_solving'),
  };
  Object.keys(metrics).forEach((k) => metrics[k] === undefined && delete metrics[k]);

  const role = String(jobRole).toLowerCase();
  const domain = /operat|supply|logistic|procure|plant|manufactur/.test(role) ? 'Operations'
    : /\bhr\b|human resource|talent|recruit|people/.test(role) ? 'HR'
    : jobRole;

  const rec = recommendTraining({ domain, metrics });
  if (!rec) return null;
  // Use the Smart Interview's own wording for the weak area.
  const labels = { clarity: 'answer quality', content: 'subject knowledge', communication: 'communication', confidence: 'confidence' };
  const [weakest, score] = Object.entries(metrics).sort((a, b) => a[1] - b[1])[0];
  const domainTrack = rec.trackId !== 'answer-skills';
  return {
    ...rec,
    reason: domainTrack
      ? `Your answers needed more ${domain} depth (${labels[weakest]} ${score}/10).`
      : `Your weakest area was ${labels[weakest]} (${score}/10).`,
  };
}
