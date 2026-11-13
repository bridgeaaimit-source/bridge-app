// Turns the live headlines into a placement brief: what happened, why it
// matters for a student's placements, the big running themes, a GD topic
// built from the day's actual news, and a short quiz. Every item points back
// to a real article so students can read the source.
import Anthropic from '@anthropic-ai/sdk';
import { extractJson } from '@/lib/extractJson';
import { trackTokensServer } from '@/lib/tokenTrackerServer';
import { getCategory } from '@/lib/newsFeeds';

const MODEL = 'claude-sonnet-4-5';
const MAX_ARTICLES = 60;

const CATEGORY_FOCUS = {
  All: 'all business, economy, technology and hiring news',
  World: 'world events and the economy — wars and conflicts, trade, tariffs, oil, global markets — and how they hit Indian business',
  Tech: 'technology and AI — big tech moves, AI investment and valuations, Indian IT services, startups',
  Finance: 'banking, markets, RBI and regulation, mutual funds, deals and results',
  Marketing: 'brands, advertising, retail, consumer behaviour, D2C and quick commerce',
  HR: 'hiring, layoffs, pay, workplace policy, labour codes and HR practice',
  Operations: 'supply chains, logistics, manufacturing, ports, aviation and retail operations',
  Analytics: 'data, AI adoption in companies, analytics and technology decisions',
};

function istNow() {
  return new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function articleList(articles) {
  return articles.map((a, i) => {
    const when = a.publishedAt
      ? new Date(a.publishedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'recent';
    return `[S${i + 1}] (${a.source}, ${when}) ${a.title}${a.summary ? ` — ${a.summary}` : ''}`;
  }).join('\n');
}

const RULES = `RULES
- Every number, name, date, company action or claim about recent events MUST come from the articles listed. Do not add statistics or recent facts from memory.
- Your training data is older than these articles. If they conflict, trust the articles.
- You may use general knowledge only to explain concepts (for example what an AT1 bond or a capex cycle is).
- Refer to articles only by their labels, like "S4". Never invent a label.
- Write in simple Indian English for a final-year MBA or engineering student. No jargon without a short explanation.
- Return ONLY valid JSON. No markdown, no text before or after.`;

function storiesPrompt(category, list) {
  return `You are a placement mentor for Indian MBA and engineering students. Today is ${istNow()} IST.
Focus: ${CATEGORY_FOCUS[category] || CATEGORY_FOCUS.All}.

LATEST ARTICLES
${list}

TASK: Pick the 8 stories a student preparing for placements, GDs and interviews should know today.
Prefer: big moves by major companies, economy and policy (RBI, government, trade), AI and technology shifts, hiring, layoffs and pay, results and deals, and global events that affect Indian business (wars, oil, tariffs).
Skip: crime, celebrity, sport, local party politics and foreign culture-war stories, unless they clearly affect business.

${RULES}

JSON shape:
{
  "stories": [
    {
      "ref": "S3",
      "headline": "plain-English headline, max 14 words",
      "what_happened": "1-2 sentences, only from the article text",
      "why_it_matters": "1-2 sentences: what this means for Indian companies, jobs or a sector, and which student roles should care",
      "interview_question": "one question an interviewer could ask a student about this",
      "talking_point": "one sentence the student could say: a clear view with a reason",
      "sector": "one or two words, e.g. Banking, IT services, Aviation, AI, Economy",
      "gd_worthy": true
    }
  ]
}`;
}

function picturePrompt(category, list) {
  return `You are a placement mentor for Indian MBA and engineering students. Today is ${istNow()} IST.
Focus: ${CATEGORY_FOCUS[category] || CATEGORY_FOCUS.All}.

LATEST ARTICLES
${list}

TASK
1. "in_60_seconds": the 5 most important things that happened, one short sentence each, so a student is up to date in one minute.
2. "big_themes": the 3 biggest running stories in these articles that a GD panel or interviewer could raise. Examples of the kind of theme: whether AI spending and valuations are a bubble, a war or conflict that moves oil prices and trade, tariffs, RBI rate moves, a big company crisis. Use a theme ONLY if the articles actually cover it. For each, explain what is going on, why it matters for India, and the two sides of the debate.
3. "interview_tip": one practical tip for using today's news in an interview.
4. "quiz": 3 multiple-choice questions that check the student read today's news. Four options each, exactly one correct, answer is the index 0-3. Questions must be answerable from the articles.

${RULES}

JSON shape:
{
  "in_60_seconds": [ { "text": "...", "ref": "S2" } ],
  "big_themes": [
    {
      "title": "short theme title, can be a question",
      "what_is_going_on": "2-3 sentences",
      "india_angle": "1-2 sentences on what it means for India, Indian companies or jobs",
      "one_side": "the case for one view, 1-2 sentences",
      "other_side": "the case for the opposite view, 1-2 sentences",
      "refs": ["S1", "S7"]
    }
  ],
  "interview_tip": { "text": "...", "ref": "S5" },
  "quiz": [ { "question": "...", "options": ["a", "b", "c", "d"], "answer": 1, "explanation": "...", "ref": "S9" } ]
}`;
}

function gdPrompt(category, list) {
  return `You are an expert on Indian campus group discussions (GDs) at companies like Deloitte, HUL, ICICI and Infosys. Today is ${istNow()} IST.
Focus: ${CATEGORY_FOCUS[category] || CATEGORY_FOCUS.All}.

LATEST ARTICLES
${list}

TASK: Create today's GD topic FROM these articles — the kind of topic a panel would set this week. It must be debatable (reasonable people disagree), not a plain fact. Give the student everything they need to speak well.

${RULES}

JSON shape:
{
  "topic": "the GD topic as a panel would phrase it",
  "why_now": "1-2 sentences on the news that makes this topical",
  "points_for": ["3 points, each with a concrete example from the articles where possible"],
  "points_against": ["3 points"],
  "facts": [ { "fact": "a fact or number taken from the articles", "ref": "S4" } ],
  "opening_line": "how to start speaking in the first 30 seconds",
  "closing_line": "how to summarise at the end",
  "power_phrase": "one memorable line",
  "interview_connection": "how an interviewer might bring this up",
  "difficulty": "Easy | Medium | Hard",
  "refs": ["S4", "S9"]
}`;
}

async function ask(client, prompt, maxTokens, uid) {
  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      });
      trackTokensServer(uid || 'system', 'news', message.usage?.input_tokens, message.usage?.output_tokens, MODEL).catch(() => {});
      if (message.stop_reason === 'max_tokens') throw new Error('reply was cut off');
      return extractJson(message.content?.[0]?.text || '');
    } catch (err) {
      lastErr = err;
      console.warn(`[news brief] attempt ${attempt} failed: ${err.message}`);
    }
  }
  throw lastErr;
}

// The model sometimes cites its article labels inline, e.g. "(S8)" or
// "(S7, S49)". Students should never see those.
export function stripRefs(text) {
  return String(text)
    .replace(/\s*[(\[]\s*S\d{1,3}(?:\s*(?:,|and|&)\s*S\d{1,3})*\s*[)\]]/gi, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const str = (v, max = 600) => (typeof v === 'string' ? stripRefs(v).slice(0, max) : '');

/** Clean every text field of an already-built brief (for briefs cached before the fix). */
export function cleanBrief(brief) {
  const skip = new Set(['id', 'ids', 'url', 'image', 'builtAt', 'publishedAt', 'category', 'sources']);
  const walk = (v, key) => {
    if (skip.has(key)) return v;
    if (typeof v === 'string') return stripRefs(v);
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  return brief ? walk(brief) : brief;
}

/**
 * Validate the model's answers against the real article list. Anything that
 * points at a label we did not send is dropped.
 */
export function assembleBrief({ category, articles, stories, picture, gd }) {
  const byRef = (ref) => {
    const m = /^S(\d+)$/i.exec(String(ref || '').trim());
    return m ? articles[Number(m[1]) - 1] || null : null;
  };
  const used = new Map();
  const cite = (ref) => {
    const a = byRef(ref);
    if (!a) return null;
    used.set(a.id, { title: a.title, url: a.url, source: a.source, publishedAt: a.publishedAt, image: a.image || null });
    return a.id;
  };

  const out = {
    category,
    builtAt: new Date().toISOString(),
    articleCount: articles.length,
    stories: [],
    in60: [],
    themes: [],
    tip: null,
    quiz: [],
    gd: null,
    parts: { stories: !!stories, picture: !!picture, gd: !!gd },
  };

  for (const s of stories?.stories || []) {
    const id = cite(s.ref);
    if (!id || !str(s.what_happened)) continue;
    out.stories.push({
      id,
      headline: str(s.headline, 140) || used.get(id).title,
      whatHappened: str(s.what_happened),
      whyItMatters: str(s.why_it_matters),
      interviewQuestion: str(s.interview_question, 300),
      talkingPoint: str(s.talking_point, 300),
      sector: str(s.sector, 40),
      gdWorthy: s.gd_worthy === true,
    });
  }

  for (const item of picture?.in_60_seconds || []) {
    const id = cite(item.ref);
    if (id && str(item.text)) out.in60.push({ text: str(item.text, 300), id });
  }
  for (const t of picture?.big_themes || []) {
    const ids = (Array.isArray(t.refs) ? t.refs : []).map(cite).filter(Boolean);
    if (!ids.length || !str(t.title)) continue;
    out.themes.push({
      title: str(t.title, 140),
      whatIsGoingOn: str(t.what_is_going_on, 800),
      indiaAngle: str(t.india_angle),
      oneSide: str(t.one_side),
      otherSide: str(t.other_side),
      ids: [...new Set(ids)],
    });
  }
  if (picture?.interview_tip && str(picture.interview_tip.text)) {
    out.tip = { text: str(picture.interview_tip.text, 400), id: cite(picture.interview_tip.ref) };
  }
  for (const q of picture?.quiz || []) {
    const options = Array.isArray(q.options) ? q.options.map(o => str(o, 160)).filter(Boolean) : [];
    const answer = Number(q.answer);
    if (!str(q.question) || options.length !== 4 || !(answer >= 0 && answer <= 3)) continue;
    out.quiz.push({ question: str(q.question, 300), options, answer, explanation: str(q.explanation, 400), id: cite(q.ref) });
  }

  if (gd && str(gd.topic)) {
    const list = (v) => (Array.isArray(v) ? v.map(x => str(x, 400)).filter(Boolean).slice(0, 4) : []);
    out.gd = {
      topic: str(gd.topic, 200),
      whyNow: str(gd.why_now),
      pointsFor: list(gd.points_for),
      pointsAgainst: list(gd.points_against),
      facts: (Array.isArray(gd.facts) ? gd.facts : [])
        .map(f => ({ fact: str(f?.fact, 300), id: cite(f?.ref) }))
        .filter(f => f.fact && f.id),
      openingLine: str(gd.opening_line),
      closingLine: str(gd.closing_line),
      powerPhrase: str(gd.power_phrase, 300),
      interviewConnection: str(gd.interview_connection),
      difficulty: ['Easy', 'Medium', 'Hard'].includes(str(gd.difficulty)) ? str(gd.difficulty) : 'Medium',
      ids: [...new Set((Array.isArray(gd.refs) ? gd.refs : []).map(cite).filter(Boolean))],
    };
  }

  out.sources = Object.fromEntries(used);
  return out;
}

/**
 * Build a fresh brief for a category from the given live articles.
 * Three model calls run in parallel; if one fails the others still ship.
 */
export async function buildBrief(categoryId, articles, uid) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing');
  const category = getCategory(categoryId).id;
  const input = articles.slice(0, MAX_ARTICLES);
  if (input.length < 5) throw new Error('Not enough fresh articles to analyse');

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const list = articleList(input);
  const [stories, picture, gd] = await Promise.allSettled([
    ask(client, storiesPrompt(category, list), 3000, uid),
    ask(client, picturePrompt(category, list), 3000, uid),
    ask(client, gdPrompt(category, list), 2000, uid),
  ]);

  const value = (r) => (r.status === 'fulfilled' ? r.value : null);
  if (!value(stories) && !value(picture) && !value(gd)) {
    throw new Error('News analysis failed');
  }
  return assembleBrief({ category, articles: input, stories: value(stories), picture: value(picture), gd: value(gd) });
}
