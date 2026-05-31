import { NextResponse } from 'next/server';

// Helper to shuffle options and track correct index
function shuffleOptions(opts, correctIdx) {
  const indexed = opts.map((opt, idx) => ({ opt, isCorrect: idx === correctIdx }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  const options = indexed.map(item => item.opt);
  const correct = indexed.findIndex(item => item.isCorrect);
  return { options, correct };
}

// ─── SECTION 1: QUANTITATIVE APTITUDE (120 Questions) ─────────────────
function generateQuant() {
  const list = [];
  
  // Topic 1: Time and Work (24 questions)
  const twPairs = [
    {x: 10, y: 15, ans: 6}, {x: 12, y: 18, ans: 7.2}, {x: 20, y: 30, ans: 12},
    {x: 15, y: 30, ans: 10}, {x: 8, y: 24, ans: 6}, {x: 12, y: 24, ans: 8},
    {x: 12, y: 6, ans: 4}, {x: 15, y: 10, ans: 6}, {x: 9, y: 18, ans: 6},
    {x: 10, y: 40, ans: 8}, {x: 24, y: 48, ans: 16}, {x: 30, y: 60, ans: 20}
  ];
  const names = ["Amit", "Rahul", "Priya", "Rohan", "Sneha", "Vikram", "Anjali", "Karan", "Neha", "Siddharth", "Pooja", "Arjun"];
  for (let i = 0; i < 24; i++) {
    const pair = twPairs[i % twPairs.length];
    const nameA = names[i % names.length];
    const nameB = names[(i + 1) % names.length];
    const diff = (i % 3) + 1;
    const isTogether = i % 2 === 0;

    if (isTogether) {
      const question = `${nameA} can complete a piece of work in ${pair.x} days, and ${nameB} can complete the same work in ${pair.y} days. If they work together, how many days will they take to complete the work?`;
      const ansVal = pair.ans;
      const opts = [
        `${ansVal} days`,
        `${(ansVal + 2.5).toFixed(1)} days`,
        `${(ansVal - 1.5 > 0 ? ansVal - 1.5 : ansVal + 4).toFixed(1)} days`,
        `${(ansVal * 1.5).toFixed(1)} days`
      ];
      const { options, correct } = shuffleOptions(opts, 0);
      list.push({
        section: 'quant',
        difficulty: diff,
        companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
        question,
        options,
        correct,
        topic: 'Time and Work',
        explanation: `Together, they complete 1/${pair.x} + 1/${pair.y} = (${pair.x + pair.y})/(${pair.x * pair.y}) of the work in one day. Thus, the total time required is (${pair.x * pair.y})/(${pair.x + pair.y}) = ${ansVal} days.`,
        timesSeen: 0,
        timesCorrect: 0
      });
    } else {
      const workDoneByB = Math.round(pair.x / 2);
      const remainingWork = 1 - (workDoneByB / pair.y);
      const remainingDays = Number((remainingWork * pair.x).toFixed(1));
      
      const question = `${nameA} can do a work in ${pair.x} days and ${nameB} in ${pair.y} days. If ${nameB} works for ${workDoneByB} days and leaves, how many days will ${nameA} take to finish the remaining work?`;
      const opts = [
        `${remainingDays} days`,
        `${(remainingDays + 3).toFixed(1)} days`,
        `${(remainingDays - 2 > 0 ? remainingDays - 2 : remainingDays + 5).toFixed(1)} days`,
        `${(remainingDays * 1.3).toFixed(1)} days`
      ];
      const { options, correct } = shuffleOptions(opts, 0);
      list.push({
        section: 'quant',
        difficulty: diff,
        companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
        question,
        options,
        correct,
        topic: 'Time and Work',
        explanation: `${nameB}'s 1-day work = 1/${pair.y}. Work done by ${nameB} in ${workDoneByB} days = ${workDoneByB}/${pair.y}. Remaining work = 1 - ${workDoneByB}/${pair.y}. Time taken by ${nameA} to finish the remaining work = (${1 - (workDoneByB / pair.y)}) * ${pair.x} = ${remainingDays} days.`,
        timesSeen: 0,
        timesCorrect: 0
      });
    }
  }

  // Topic 2: Speed, Distance & Time (24 questions)
  const sdtPairs = [
    {L: 150, T: 15, speedKmH: 36}, {L: 200, T: 10, speedKmH: 72}, {L: 180, T: 12, speedKmH: 54},
    {L: 150, T: 12, speedKmH: 45}, {L: 250, T: 15, speedKmH: 60}, {L: 300, T: 18, speedKmH: 60},
    {L: 200, T: 15, speedKmH: 48}, {L: 100, T: 8, speedKmH: 45}, {L: 120, T: 12, speedKmH: 36},
    {L: 240, T: 12, speedKmH: 72}, {L: 160, T: 8, speedKmH: 72}, {L: 360, T: 18, speedKmH: 72}
  ];
  for (let i = 0; i < 24; i++) {
    const pair = sdtPairs[i % sdtPairs.length];
    const diff = (i % 3) + 1;
    const isPassingPole = i % 2 === 0;

    if (isPassingPole) {
      const question = `A train ${pair.L} meters long passes a telegraph pole in ${pair.T} seconds. What is the speed of the train in km/h?`;
      const opts = [
        `${pair.speedKmH} km/h`,
        `${pair.speedKmH + 10} km/h`,
        `${pair.speedKmH - 8 > 0 ? pair.speedKmH - 8 : pair.speedKmH + 15} km/h`,
        `${Math.round(pair.speedKmH * 1.2)} km/h`
      ];
      const { options, correct } = shuffleOptions(opts, 0);
      list.push({
        section: 'quant',
        difficulty: diff,
        companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
        question,
        options,
        correct,
        topic: 'Speed Distance Time',
        explanation: `Speed = Distance / Time = ${pair.L} / ${pair.T} m/s. Convert to km/h by multiplying with 18/5: (${pair.L}/${pair.T}) * 18/5 = ${pair.speedKmH} km/h.`,
        timesSeen: 0,
        timesCorrect: 0
      });
    } else {
      const platLength = pair.L;
      const totalDist = pair.L + platLength;
      const totalTime = pair.T * 2;
      const question = `A train ${pair.L} meters long crosses a platform of length ${platLength} meters in ${totalTime} seconds. What is the speed of the train in km/h?`;
      const opts = [
        `${pair.speedKmH} km/h`,
        `${pair.speedKmH + 12} km/h`,
        `${pair.speedKmH - 6 > 0 ? pair.speedKmH - 6 : pair.speedKmH + 20} km/h`,
        `${Math.round(pair.speedKmH * 1.15)} km/h`
      ];
      const { options, correct } = shuffleOptions(opts, 0);
      list.push({
        section: 'quant',
        difficulty: diff,
        companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
        question,
        options,
        correct,
        topic: 'Speed Distance Time',
        explanation: `Total distance = Train length + Platform length = ${pair.L} + ${platLength} = ${totalDist} m. Speed = ${totalDist} / ${totalTime} m/s. Convert to km/h: (${totalDist}/${totalTime}) * 18/5 = ${pair.speedKmH} km/h.`,
        timesSeen: 0,
        timesCorrect: 0
      });
    }
  }

  // Topic 3: Profit and Loss (24 questions)
  const plPairs = [
    {x: 20, y: 25, profit: 25}, {x: 15, y: 18, profit: 20}, {x: 16, y: 20, profit: 25},
    {x: 10, y: 12, profit: 20}, {x: 8, y: 10, profit: 25}, {x: 25, y: 30, profit: 20},
    {x: 12, y: 15, profit: 25}, {x: 20, y: 16, profit: -20}, {x: 25, y: 20, profit: -20},
    {x: 10, y: 8, profit: -20}, {x: 5, y: 4, profit: -20}, {x: 50, y: 40, profit: -20}
  ];
  for (let i = 0; i < 24; i++) {
    const pair = plPairs[i % plPairs.length];
    const diff = (i % 3) + 1;
    const isSPCP = i % 2 === 0;

    if (isSPCP) {
      const isProfit = pair.profit > 0;
      const pct = Math.abs(pair.profit);
      const question = `If the cost price of ${pair.x} articles is equal to the selling price of ${pair.y} articles, what is the ${isProfit ? 'profit' : 'loss'} percentage?`;
      const opts = [
        `${pct}%`,
        `${pct + 5}%`,
        `${pct - 5 > 0 ? pct - 5 : pct + 10}%`,
        `${pct * 1.5}%`
      ];
      const { options, correct } = shuffleOptions(opts, 0);
      list.push({
        section: 'quant',
        difficulty: diff,
        companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
        question,
        options,
        correct,
        topic: 'Profit and Loss',
        explanation: `Let cost price of 1 article = ₹1. CP of ${pair.x} articles = SP of ${pair.y} articles = ₹${pair.x}. CP of ${pair.y} articles = ₹${pair.y}. Gain/Loss % = |${pair.x} - ${pair.y}| / ${pair.y} * 100 = ${pct}%.`,
        timesSeen: 0,
        timesCorrect: 0
      });
    } else {
      const cp = 200 + (i * 50);
      const profitPct = (i % 4 + 1) * 5;
      const sp = Math.round(cp * (1 + profitPct/100));
      const question = `An article is bought for ₹${cp} and sold at a profit of ${profitPct}%. What is the selling price of the article?`;
      const opts = [
        `₹${sp}`,
        `₹${sp + 20}`,
        `₹${sp - 15}`,
        `₹${Math.round(sp * 1.1)}`
      ];
      const { options, correct } = shuffleOptions(opts, 0);
      list.push({
        section: 'quant',
        difficulty: diff,
        companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
        question,
        options,
        correct,
        topic: 'Profit and Loss',
        explanation: `Selling Price = Cost Price * (100 + Profit%)/100 = ${cp} * (100 + ${profitPct})/100 = ₹${sp}.`,
        timesSeen: 0,
        timesCorrect: 0
      });
    }
  }

  // Topic 4: Averages (16 questions)
  for (let i = 0; i < 16; i++) {
    const n = 5 + i;
    const avg = 30 + i * 2;
    const drop = 2 + (i % 3);
    const newAvg = avg - drop;
    const excluded = n * avg - (n - 1) * newAvg;
    const diff = (i % 3) + 1;

    const question = `The average weight of a group of ${n} students is ${avg} kg. If one student is excluded, the average weight drops by ${drop} kg. What is the weight of the excluded student?`;
    const opts = [
      `${excluded} kg`,
      `${excluded + 10} kg`,
      `${excluded - 5 > 0 ? excluded - 5 : excluded + 12} kg`,
      `${Math.round(excluded * 1.15)} kg`
    ];
    const { options, correct } = shuffleOptions(opts, 0);
    list.push({
      section: 'quant',
      difficulty: diff,
      companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
      question,
      options,
      correct,
      topic: 'Averages',
      explanation: `Total weight of ${n} students = ${n} * ${avg} = ${n * avg} kg. Total weight of ${n-1} students = ${n-1} * ${newAvg} = ${(n-1) * newAvg} kg. Excluded student weight = ${n * avg} - ${(n-1) * newAvg} = ${excluded} kg.`,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 5: Simple & Compound Interest (16 questions)
  for (let i = 0; i < 16; i++) {
    const p = 5000 + i * 1000;
    const r = 5 + (i % 3) * 5;
    const diff = (i % 3) + 1;
    const isCI = i % 2 === 0;

    if (isCI) {
      const amt = Math.round(p * Math.pow(1 + r/100, 2));
      const ci = amt - p;
      const question = `Find the compound interest on a sum of ₹${p} invested at ${r}% p.a. compound interest for 2 years.`;
      const opts = [
        `₹${ci}`,
        `₹${ci + 150}`,
        `₹${ci - 100 > 0 ? ci - 100 : ci + 200}`,
        `₹${Math.round(ci * 1.2)}`
      ];
      const { options, correct } = shuffleOptions(opts, 0);
      list.push({
        section: 'quant',
        difficulty: diff,
        companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
        question,
        options,
        correct,
        topic: 'Simple and Compound Interest',
        explanation: `Amount after 2 years = Principal * (1 + R/100)^2 = ${p} * (1 + ${r}/100)^2 = ₹${amt}. Compound Interest = Amount - Principal = ${amt} - ${p} = ₹${ci}.`,
        timesSeen: 0,
        timesCorrect: 0
      });
    } else {
      const si = Math.round((p * r * 3) / 100);
      const question = `Find the simple interest on a sum of ₹${p} invested at ${r}% p.a. for 3 years.`;
      const opts = [
        `₹${si}`,
        `₹${si + 100}`,
        `₹${si - 80 > 0 ? si - 80 : si + 150}`,
        `₹${Math.round(si * 1.1)}`
      ];
      const { options, correct } = shuffleOptions(opts, 0);
      list.push({
        section: 'quant',
        difficulty: diff,
        companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
        question,
        options,
        correct,
        topic: 'Simple and Compound Interest',
        explanation: `Simple Interest = (Principal * Rate * Time) / 100 = (${p} * ${r} * 3) / 100 = ₹${si}.`,
        timesSeen: 0,
        timesCorrect: 0
      });
    }
  }

  // Topic 6: Ratios & Mixtures (16 questions)
  for (let i = 0; i < 16; i++) {
    const diff = (i % 3) + 1;
    const x = 10 + i * 2;
    const v = 4 * x;
    const milk = 3 * x;
    const water = x;
    const addedWater = x;

    const question = `A mixture of ${v} liters contains milk and water in the ratio 3:1. How much water must be added to this mixture so that the ratio of milk to water becomes 3:2?`;
    const opts = [
      `${addedWater} liters`,
      `${addedWater + 5} liters`,
      `${addedWater - 3 > 0 ? addedWater - 3 : addedWater + 8} liters`,
      `${addedWater * 2} liters`
    ];
    const { options, correct } = shuffleOptions(opts, 0);
    list.push({
      section: 'quant',
      difficulty: diff,
      companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
      question,
      options,
      correct,
      topic: 'Ratios and Mixtures',
      explanation: `Milk = ${milk} liters, Water = ${water} liters. Let W liters of water be added. Milk/Water = ${milk}/(${water} + W) = 3/2. Solving gives W = ${addedWater} liters.`,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  return list;
}

// ─── SECTION 2: LOGICAL REASONING (120 Questions) ────────────────────
function generateLR() {
  const list = [];

  // Topic 1: Number Series (24 questions)
  for (let i = 0; i < 24; i++) {
    const start = 2 + i * 2;
    const step = 2 + (i % 4);
    const diff = (i % 3) + 1;
    
    // Pattern: start, start+step, start+2*step, start+3*step, start+4*step, ?
    const a = start;
    const b = a + step;
    const c = b + step;
    const d = c + step;
    const e = d + step;
    const nextVal = e + step;

    const question = `Find the next number in the series: ${a}, ${b}, ${c}, ${d}, ${e}, ?`;
    const opts = [
      `${nextVal}`,
      `${nextVal + step}`,
      `${nextVal - 2}`,
      `${nextVal * 2}`
    ];
    const { options, correct } = shuffleOptions(opts, 0);
    list.push({
      section: 'lr',
      difficulty: diff,
      companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
      question,
      options,
      correct,
      topic: 'Number Series',
      explanation: `The difference between consecutive terms is constant (+${step}). The next term is ${e} + ${step} = ${nextVal}.`,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 2: Letter Coding (24 questions)
  const coderWords = [
    "CODER", "PYTHON", "REACT", "NEXTJS", "ROBOT", "LOGIC", "HEART", "PEACH",
    "GRAPE", "CHIPS", "MOUSE", "BOARD", "LIGHT", "SOUND", "SMART", "PLANT"
  ];
  for (let i = 0; i < 24; i++) {
    const wordA = coderWords[i % coderWords.length];
    const wordB = coderWords[(i + 1) % coderWords.length];
    const offset = 1; // shift +1
    const diff = (i % 3) + 1;

    const shiftStr = (w) => w.split('').map(char => String.fromCharCode(char.charCodeAt(0) + offset)).join('');
    const codedA = shiftStr(wordA);
    const codedB = shiftStr(wordB);

    const question = `If '${wordA}' is coded as '${codedA}', how will '${wordB}' be coded in the same language?`;
    const opts = [
      codedB,
      codedB.slice(0, -1) + 'X',
      shiftStr(wordB).split('').reverse().join(''),
      codedB.replace(/./, 'A')
    ];
    const { options, correct } = shuffleOptions(opts, 0);
    list.push({
      section: 'lr',
      difficulty: diff,
      companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
      question,
      options,
      correct,
      topic: 'Letter Coding',
      explanation: `Each letter of the word is shifted forward by ${offset} letter in the alphabet. Thus, '${wordB}' becomes '${codedB}'.`,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 3: Blood Relations (24 questions)
  const relationsPool = [
    { q: "Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?", ans: "Mother", opts: ["Mother", "Aunt", "Sister", "Daughter"], exp: "Only daughter of my mother is the woman herself. So, she is the man's mother." },
    { q: "A is B's brother. C is B's sister. D is A's mother. E is C's father. How is E related to D?", ans: "Husband", opts: ["Husband", "Brother", "Son", "Father-in-law"], exp: "A, B, C are siblings. D is their mother and E is their father. Thus, E is D's husband." },
    { q: "Introducing a girl, Vipin said, 'Her mother is the only daughter of my mother-in-law.' How is Vipin related to the girl?", ans: "Father", opts: ["Father", "Uncle", "Brother", "Husband"], exp: "Only daughter of Vipin's mother-in-law is Vipin's wife. Her mother is Vipin's wife, making Vipin the girl's father." },
    { q: "Pointing to a photograph of a boy, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to that boy?", ans: "Father", opts: ["Father", "Uncle", "Brother", "Grandfather"], exp: "Only son of Suresh's mother is Suresh himself. So, the boy is Suresh's son." },
    { q: "If A + B means A is the brother of B; A - B means A is the sister of B; A * B means A is the father of B. Which means P is the uncle of Q?", ans: "P + R * Q", opts: ["P + R * Q", "P - R * Q", "P * R + Q", "P + R - Q"], exp: "P + R means P is brother of R. R * Q means R is father of Q. So, P is Q's uncle." }
  ];
  for (let i = 0; i < 24; i++) {
    const item = relationsPool[i % relationsPool.length];
    const diff = (i % 3) + 1;
    const { options, correct } = shuffleOptions(item.opts, item.opts.indexOf(item.ans));
    list.push({
      section: 'lr',
      difficulty: diff,
      companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
      question: item.q + ` (${i + 1})`,
      options,
      correct,
      topic: 'Blood Relations',
      explanation: item.exp,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 4: Directions (24 questions)
  const dirNames = ["Amit", "Rohan", "Sneha", "Karan", "Pooja", "Vikram"];
  const directions = ["North", "East", "South", "West"];
  for (let i = 0; i < 24; i++) {
    const name = dirNames[i % dirNames.length];
    const distA = 5 + (i % 4) * 3;
    const distB = 4 + (i % 3) * 2;
    const diff = (i % 3) + 1;
    
    // Walks distA North, turns right walks distB, turns right walks distA => He is distB km East of starting point.
    const startDir = directions[i % 4];
    const question = `${name} walks ${distA} km ${startDir}, turns right and walks ${distB} km, then turns right again and walks ${distA} km. How far is ${name} from the starting point?`;
    const opts = [
      `${distB} km`,
      `${distA} km`,
      `${distA + distB} km`,
      `${Math.sqrt(distA * distA + distB * distB).toFixed(1)} km`
    ];
    const { options, correct } = shuffleOptions(opts, 0);
    list.push({
      section: 'lr',
      difficulty: diff,
      companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
      question,
      options,
      correct,
      topic: 'Directions',
      explanation: `The path forms a rectangle. Walking ${distA} km forward, turning right twice, and walking ${distA} km back brings the person in line with the start, exactly ${distB} km away.`,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 5: Syllogisms (24 questions)
  const sylSubjects = [
    { a: "cats", b: "dogs", c: "animals" },
    { a: "pens", b: "pencils", c: "stationery" },
    { a: "apples", b: "fruits", c: "foods" },
    { a: "cars", b: "vehicles", c: "machines" }
  ];
  for (let i = 0; i < 24; i++) {
    const item = sylSubjects[i % sylSubjects.length];
    const diff = (i % 3) + 1;
    const question = `Statements:\n1. All ${item.a} are ${item.b}.\n2. All ${item.b} are ${item.c}.\n\nConclusions:\nI. All ${item.a} are ${item.c}.\nII. Some ${item.c} are ${item.a}.`;
    const opts = [
      "Both I and II follow",
      "Only I follows",
      "Only II follows",
      "Neither follows"
    ];
    const { options, correct } = shuffleOptions(opts, 0);
    list.push({
      section: 'lr',
      difficulty: diff,
      companies: ['tcs', 'infosys', 'wipro', 'deloitte', 'cognizant', 'accenture', 'capgemini', 'techmahindra'],
      question,
      options,
      correct,
      topic: 'Syllogism',
      explanation: `All ${item.a} are ${item.b} and All ${item.b} are ${item.c} implies ${item.a} is a subset of ${item.c}. Hence, All ${item.a} are ${item.c} follows. Also, since ${item.a} is inside ${item.c}, there are some elements of ${item.c} that are ${item.a}, so Some ${item.c} are ${item.a} follows.`,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  return list;
}

// ─── SECTION 3: VERBAL / ENGLISH (90 Questions) ──────────────────────
function generateVerbal() {
  const list = [];
  const verbCompanies = ['tcs', 'infosys', 'wipro', 'cognizant', 'accenture', 'capgemini', 'techmahindra'];

  // Topic 1: Synonyms (25 questions)
  const synonyms = [
    { w: "BENEVOLENT", s: "Kind", o: ["Kind", "Cruel", "Greedy", "Indifferent"], e: "Benevolent means well-meaning, kind, or generous." },
    { w: "LUCID", s: "Clear", o: ["Clear", "Confusing", "Vague", "Dark"], e: "Lucid means expressed clearly or easy to understand." },
    { w: "FRUGAL", s: "Economical", o: ["Economical", "Spendthrift", "Generous", "Rich"], e: "Frugal means sparing or economical with regard to money or food." },
    { w: "AMBIGUOUS", s: "Vague", o: ["Vague", "Clear", "Certain", "Defined"], e: "Ambiguous means open to more than one interpretation or double-meaning." },
    { w: "CANDID", s: "Frank", o: ["Frank", "Deceitful", "Shy", "Evasive"], e: "Candid means truthful and straightforward; frank." }
  ];
  for (let i = 0; i < 25; i++) {
    const item = synonyms[i % synonyms.length];
    const diff = (i % 3) + 1;
    const { options, correct } = shuffleOptions(item.o, item.o.indexOf(item.s));
    list.push({
      section: 'verbal',
      difficulty: diff,
      companies: verbCompanies,
      question: `Choose the synonym for the word: '${item.w}' (${i + 1})`,
      options,
      correct,
      topic: 'Synonyms',
      explanation: item.e,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 2: Antonyms (25 questions)
  const antonyms = [
    { w: "LETHARGIC", a: "Energetic", o: ["Energetic", "Sluggish", "Sleepy", "Lazy"], e: "Lethargic means sluggish or lacking energy. The antonym is energetic." },
    { w: "DEARTH", a: "Abundance", o: ["Abundance", "Scarcity", "Shortage", "Lack"], e: "Dearth means a scarcity or lack of something. The antonym is abundance." },
    { w: "EPHEMERAL", a: "Permanent", o: ["Permanent", "Short-lived", "Fleeting", "Temporary"], e: "Ephemeral means lasting for a very short time. The antonym is permanent." },
    { w: "HARMONY", a: "Discord", o: ["Discord", "Agreement", "Peace", "Unity"], e: "Harmony means agreement or concord. The antonym is discord." },
    { w: "VOLATILE", a: "Stable", o: ["Stable", "Unstable", "Explosive", "Changing"], e: "Volatile means liable to change rapidly and unpredictably. The antonym is stable." }
  ];
  for (let i = 0; i < 25; i++) {
    const item = antonyms[i % antonyms.length];
    const diff = (i % 3) + 1;
    const { options, correct } = shuffleOptions(item.o, item.o.indexOf(item.a));
    list.push({
      section: 'verbal',
      difficulty: diff,
      companies: verbCompanies,
      question: `Choose the antonym for the word: '${item.w}' (${i + 1})`,
      options,
      correct,
      topic: 'Antonyms',
      explanation: item.e,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 3: Spotting Errors (20 questions)
  const errors = [
    { q: "Identify the error: 'Each of the boys have completed their homework.'", a: "have completed", o: ["Each of", "the boys", "have completed", "their homework"], e: "'Each' is singular, so it must take a singular verb ('has completed')." },
    { q: "Identify the error: 'Neither the teacher nor the students was present.'", a: "was present", o: ["Neither the", "teacher nor", "students", "was present"], e: "When subject parts are connected by 'neither... nor', the verb agrees with the closer subject ('students', which is plural, so 'were present')." },
    { q: "Identify the error: 'He is senior than me in the department.'", a: "senior than", o: ["He is", "senior than", "in the", "department"], e: "Words like senior, junior, superior are followed by 'to', not 'than'." },
    { q: "Identify the error: 'I look forward to meet you next week.'", a: "to meet", o: ["I look", "forward", "to meet", "next week"], e: "The phrase 'look forward to' is followed by a gerund, so it should be 'to meeting'." }
  ];
  for (let i = 0; i < 20; i++) {
    const item = errors[i % errors.length];
    const diff = (i % 3) + 1;
    const { options, correct } = shuffleOptions(item.o, item.o.indexOf(item.a));
    list.push({
      section: 'verbal',
      difficulty: diff,
      companies: verbCompanies,
      question: item.q + ` (${i + 1})`,
      options,
      correct,
      topic: 'Spotting Errors',
      explanation: item.e,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 4: Idioms (20 questions)
  const idioms = [
    { q: "What does the idiom 'to burn the midnight oil' mean?", a: "To study or work late into the night", o: ["To study or work late into the night", "To waste fuel", "To sleep early", "To create trouble"], e: "'Burning the midnight oil' means working or studying late into the night." },
    { q: "What does the idiom 'spill the beans' mean?", a: "To reveal a secret prematurely", o: ["To reveal a secret prematurely", "To drop food", "To work hard", "To play a game"], e: "'Spill the beans' means to let out secret information, usually by accident." },
    { q: "What does the idiom 'bite the bullet' mean?", a: "To face a difficult situation with courage", o: ["To face a difficult situation with courage", "To get hurt", "To be aggressive", "To make excuses"], e: "'Bite the bullet' means to face a tough situation bravely and get it over with." },
    { q: "What does the idiom 'a piece of cake' mean?", a: "Something very easy", o: ["Something very easy", "A delicious dessert", "An expensive item", "A complex task"], e: "'Piece of cake' refers to something that is exceptionally easy to do." }
  ];
  for (let i = 0; i < 20; i++) {
    const item = idioms[i % idioms.length];
    const diff = (i % 3) + 1;
    const { options, correct } = shuffleOptions(item.o, item.o.indexOf(item.a));
    list.push({
      section: 'verbal',
      difficulty: diff,
      companies: verbCompanies,
      question: item.q + ` (${i + 1})`,
      options,
      correct,
      topic: 'Idioms and Phrases',
      explanation: item.e,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  return list;
}

// ─── SECTION 4: DATA INTERPRETATION (90 Questions) ───────────────────
function generateDI() {
  const list = [];
  const diCompanies = ['infosys', 'deloitte', 'accenture'];

  // Topic 1: Pie Charts (30 questions)
  for (let i = 0; i < 30; i++) {
    const income = 40000 + i * 2000;
    const rentPct = 25;
    const foodPct = 30;
    const rentAmt = (income * rentPct) / 100;
    const diff = (i % 3) + 1;

    const question = `A family spends income on: Food 30%, Rent 25%, Transport 15%, Savings 20%, others 10%. If their total income is ₹${income}, how much is spent on Rent?`;
    const opts = [
      `₹${rentAmt}`,
      `₹${rentAmt + 1000}`,
      `₹${rentAmt - 800}`,
      `₹${rentAmt * 1.2}`
    ];
    const { options, correct } = shuffleOptions(opts, 0);
    list.push({
      section: 'di',
      difficulty: diff,
      companies: diCompanies,
      question,
      options,
      correct,
      topic: 'Pie Chart Interpretation',
      explanation: `Rent expenditure is 25% of total income. Thus, Rent = ${rentPct}% of ₹${income} = (25/100) * ${income} = ₹${rentAmt}.`,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 2: Bar Graphs (30 questions)
  for (let i = 0; i < 30; i++) {
    const mon = 20 + i;
    const tue = 30 + i;
    const wed = 25 + i;
    const thu = 35 + i;
    const fri = 40 + i;
    const total = mon + tue + wed + thu + fri;
    const avg = total / 5;
    const diff = (i % 3) + 1;

    const question = `A bar graph shows sales of laptops: Mon: ${mon}, Tue: ${tue}, Wed: ${wed}, Thu: ${thu}, Fri: ${fri}. What are the average daily laptop sales?`;
    const opts = [
      `${avg}`,
      `${avg + 2}`,
      `${avg - 1.5}`,
      `${avg * 1.1}`
    ];
    const { options, correct } = shuffleOptions(opts, 0);
    list.push({
      section: 'di',
      difficulty: diff,
      companies: diCompanies,
      question,
      options,
      correct,
      topic: 'Bar Graph Analysis',
      explanation: `Total sales = ${mon} + ${tue} + ${wed} + ${thu} + ${fri} = ${total}. Average sales = ${total} / 5 = ${avg}.`,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  // Topic 3: Table Calculations (30 questions)
  for (let i = 0; i < 30; i++) {
    const m = 70 + (i % 6) * 5;
    const s = 65 + (i % 5) * 6;
    const e = 80 + (i % 4) * 4;
    const h = 75 + (i % 3) * 5;
    const total = m + s + e + h;
    const percentage = total / 4;
    const diff = (i % 3) + 1;

    const question = `A student's score in 4 subjects (each out of 100 max) is: Mathematics: ${m}, Science: ${s}, English: ${e}, Social Studies: ${h}. What is the student's aggregate percentage?`;
    const opts = [
      `${percentage}%`,
      `${(percentage + 3.5).toFixed(1)}%`,
      `${(percentage - 2.5).toFixed(1)}%`,
      `${(percentage * 1.05).toFixed(1)}%`
    ];
    const { options, correct } = shuffleOptions(opts, 0);
    list.push({
      section: 'di',
      difficulty: diff,
      companies: diCompanies,
      question,
      options,
      correct,
      topic: 'Table Interpretation',
      explanation: `Total marks obtained = ${m} + ${s} + ${e} + ${h} = ${total}. Total max marks = 400. Aggregate % = (${total} / 400) * 100 = ${percentage}%.`,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  return list;
}

// ─── SECTION 5: GENERAL AWARENESS (90 Questions) ─────────────────────
function generateGA() {
  const list = [];
  const gaCompanies = ['deloitte', 'cognizant'];

  const gaPool = [
    { q: "Which Indian company acquired Jaguar Land Rover from Ford?", a: "Tata Motors", o: ["Tata Motors", "Mahindra", "Reliance Industries", "Infosys"], e: "Tata Motors acquired Jaguar Land Rover in 2008 for $2.3 billion." },
    { q: "What does GDP stand for?", a: "Gross Domestic Product", o: ["Gross Domestic Product", "Gross Demand Price", "General Domestic Product", "Gross Development Plan"], e: "GDP is Gross Domestic Product, representing the value of goods and services produced." },
    { q: "Which programming language is most widely used for AI and Machine Learning?", a: "Python", o: ["Python", "Java", "C++", "PHP"], e: "Python dominates AI/ML because of rich ecosystems like TensorFlow, PyTorch, Scikit-learn, etc." },
    { q: "Which Indian city is known as the 'Silicon Valley of India'?", a: "Bengaluru", o: ["Bengaluru", "Hyderabad", "Pune", "Chennai"], e: "Bengaluru is the primary hub of information technology in India, hence the name." },
    { q: "What is a 'unicorn' in startup terminology?", a: "A private startup valued at $1 Billion+", o: ["A private startup valued at $1 Billion+", "A failed tech company", "A public listing", "A blockchain platform"], e: "A unicorn is a term for a privately-held startup with a valuation of over $1 billion." },
    { q: "What does HTTPS stand for in secure web browsing?", a: "Hypertext Transfer Protocol Secure", o: ["Hypertext Transfer Protocol Secure", "Hypertext Transfer Policy Safe", "Hyper Transfer Protocol System", "High Tech Protocol Secure"], e: "HTTPS stands for Hypertext Transfer Protocol Secure, using encryption (TLS/SSL)." },
    { q: "Who is the regulator of monetary policy in India?", a: "Reserve Bank of India", o: ["Reserve Bank of India", "SEBI", "Ministry of Finance", "State Bank of India"], e: "The RBI (Reserve Bank of India) acts as the central bank and controls monetary policy." },
    { q: "In Agile software development, what is a daily 15-minute sync-up meeting called?", a: "Daily Standup", o: ["Daily Standup", "Sprint Review", "Retrospective", "Backlog Grooming"], e: "A daily standup is a short daily synchronization meeting used in Scrum/Agile." },
    { q: "Which global tech company developed the Android Operating System?", a: "Google", o: ["Google", "Apple", "Microsoft", "Samsung"], e: "Google leads the development of the Android operating system under the Open Handset Alliance." },
    { q: "What is the primary purpose of a database index?", a: "To speed up data retrieval operations", o: ["To speed up data retrieval operations", "To encrypt data", "To backup records", "To ensure unique rows only"], e: "A database index speeds up SELECT queries at the cost of writes and storage." }
  ];

  for (let i = 0; i < 90; i++) {
    const item = gaPool[i % gaPool.length];
    const diff = (i % 3) + 1;
    const { options, correct } = shuffleOptions(item.o, item.o.indexOf(item.a));
    list.push({
      section: 'ga',
      difficulty: diff,
      companies: gaCompanies,
      question: item.q + ` (${i + 1})`,
      options,
      correct,
      topic: 'General Placement GK',
      explanation: item.e,
      timesSeen: 0,
      timesCorrect: 0
    });
  }

  return list;
}

export async function GET(request) {
  try {
    const q1 = generateQuant(); // 120
    const q2 = generateLR();    // 120
    const q3 = generateVerbal(); // 90
    const q4 = generateDI();     // 90
    const q5 = generateGA();     // 90
    
    const allQuestions = [...q1, ...q2, ...q3, ...q4, ...q5]; // 510 total

    return NextResponse.json({
      message: `Generated ${allQuestions.length} questions successfully.`,
      questions: allQuestions
    });

  } catch (error) {
    console.error('Seed Questions Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to seed questions' }, { status: 500 });
  }
}
