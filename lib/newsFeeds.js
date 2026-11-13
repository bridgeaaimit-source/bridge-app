// Live Indian business news from publisher RSS feeds (Economic Times, Mint,
// BusinessLine, The Hindu). Business Standard is left out because it blocks
// non-browser readers. Free, no API key, updated
// within minutes, and every item links back to the publisher.
import crypto from 'crypto';

const ET = 'https://economictimes.indiatimes.com';
const FEEDS = {
  et_top_industry: { url: `${ET}/industry/rssfeeds/13352306.cms`, source: 'Economic Times' },
  et_economy: { url: `${ET}/news/economy/rssfeeds/1373380680.cms`, source: 'Economic Times' },
  et_tech: { url: `${ET}/tech/rssfeeds/13357270.cms`, source: 'Economic Times' },
  et_ai: { url: `${ET}/tech/artificial-intelligence/rssfeeds/119215726.cms`, source: 'Economic Times' },
  et_jobs: { url: `${ET}/jobs/rssfeeds/107115.cms`, source: 'Economic Times' },
  et_markets: { url: `${ET}/markets/rssfeeds/1977021501.cms`, source: 'Economic Times' },
  et_world: { url: `${ET}/news/international/world-news/rssfeeds/858478126.cms`, source: 'Economic Times' },
  et_defence: { url: `${ET}/news/defence/rssfeeds/46687796.cms`, source: 'Economic Times' },
  et_hr: { url: 'https://hr.economictimes.indiatimes.com/rss/topstories', source: 'ETHRWorld' },
  et_brand: { url: 'https://brandequity.economictimes.indiatimes.com/rss/topstories', source: 'ET BrandEquity' },
  et_bfsi: { url: 'https://bfsi.economictimes.indiatimes.com/rss/topstories', source: 'ETBFSI' },
  et_cio: { url: 'https://cio.economictimes.indiatimes.com/rss/topstories', source: 'ETCIO' },
  et_retail: { url: 'https://retail.economictimes.indiatimes.com/rss/topstories', source: 'ETRetail' },
  mint_companies: { url: 'https://www.livemint.com/rss/companies', source: 'Mint' },
  mint_economy: { url: 'https://www.livemint.com/rss/economy', source: 'Mint' },
  mint_tech: { url: 'https://www.livemint.com/rss/technology', source: 'Mint' },
  mint_money: { url: 'https://www.livemint.com/rss/money', source: 'Mint' },
  mint_industry: { url: 'https://www.livemint.com/rss/industry', source: 'Mint' },
  bl_top: { url: 'https://www.thehindubusinessline.com/feeder/default.rss', source: 'BusinessLine' },
  bl_it: { url: 'https://www.thehindubusinessline.com/info-tech/feeder/default.rss', source: 'BusinessLine' },
  bl_logistics: { url: 'https://www.thehindubusinessline.com/economy/logistics/feeder/default.rss', source: 'BusinessLine' },
  bl_companies: { url: 'https://www.thehindubusinessline.com/companies/feeder/default.rss', source: 'BusinessLine' },
  hindu_world: { url: 'https://www.thehindu.com/news/international/feeder/default.rss', source: 'The Hindu' },
  hindu_business: { url: 'https://www.thehindu.com/business/feeder/default.rss', source: 'The Hindu' },
};

export const NEWS_CATEGORIES = [
  { id: 'All', label: 'All', feeds: ['et_top_industry', 'et_economy', 'et_tech', 'et_jobs', 'mint_companies', 'mint_economy', 'bl_top', 'hindu_business', 'et_markets'] },
  { id: 'World', label: 'World & Economy', feeds: ['et_world', 'et_defence', 'hindu_world', 'et_economy', 'mint_economy'] },
  { id: 'Tech', label: 'Tech & AI', feeds: ['et_tech', 'et_ai', 'mint_tech', 'bl_it', 'et_cio'] },
  { id: 'Finance', label: 'Finance', feeds: ['et_markets', 'et_bfsi', 'mint_money', 'et_economy', 'bl_companies'] },
  { id: 'Marketing', label: 'Marketing', feeds: ['et_brand', 'et_retail', 'mint_industry', 'mint_companies'] },
  { id: 'HR', label: 'HR & Jobs', feeds: ['et_hr', 'et_jobs', 'mint_companies', 'et_top_industry'] },
  { id: 'Operations', label: 'Operations', feeds: ['bl_logistics', 'et_top_industry', 'et_retail', 'bl_companies'] },
  { id: 'Analytics', label: 'Analytics', feeds: ['et_cio', 'et_ai', 'et_tech', 'mint_tech'] },
];

export function getCategory(id) {
  return NEWS_CATEGORIES.find(c => c.id === id) || NEWS_CATEGORIES[0];
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#039': "'", rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', hellip: '…', rupee: '₹' };

function decode(text) {
  return String(text || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z0-9#]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function clean(html) {
  return decode(decode(html))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? m[1] : '';
}

function imageOf(item) {
  const m = item.match(/<(?:media:content|media:thumbnail|enclosure)[^>]*url="([^"]+)"/i)
    || decode(item).match(/<img[^>]*src="([^"]+)"/i);
  return m ? decode(m[1]) : null;
}

export function parseFeed(xml, source) {
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  return items.map(item => {
    const title = clean(tag(item, 'title'));
    const url = clean(tag(item, 'link')) || clean(tag(item, 'guid'));
    const date = new Date(clean(tag(item, 'pubDate')) || clean(tag(item, 'dc:date')));
    let summary = clean(tag(item, 'description'));
    if (summary.toLowerCase() === title.toLowerCase()) summary = '';
    if (summary.length > 320) summary = summary.slice(0, 317).replace(/\s+\S*$/, '') + '…';
    return {
      title,
      summary,
      url,
      source,
      publishedAt: isNaN(date) ? null : date.toISOString(),
      image: imageOf(item),
    };
  }).filter(a => a.title && /^https?:\/\//.test(a.url));
}

async function fetchFeed(key) {
  const feed = FEEDS[key];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(feed.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BridgeAI-NewsPulse/1.0; +https://www.appbridgeai.in)', Accept: 'application/rss+xml, application/xml, text/xml' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseFeed(await res.text(), feed.source);
  } catch (err) {
    console.warn(`[news] feed ${key} failed: ${err.message}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// Headlines that are not useful for placement awareness.
const NOISE = /\b(horoscope|astrology|zodiac|tarot|lottery|bigg boss|box office|wordle|crossword|recipe|weight loss|skin ?care|celebrity|bollywood|actress|actor|ipl auction|match (preview|report)|live score|letters to the editor|photos:|in pics|watch:|video:|miss universe|pageant|gta 6|netflix|ott release)\b/i;

function normTitle(t) {
  return t.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 2).slice(0, 8).join(' ');
}

const memoryCache = new Map(); // category -> { at, articles }
const FEED_TTL_MS = 10 * 60 * 1000;

/**
 * Latest articles for a category: all feeds in parallel, last 72 hours,
 * duplicates removed, newest first. Cached in memory for 10 minutes.
 */
export async function getLatestNews(categoryId, { fresh = false } = {}) {
  const category = getCategory(categoryId);
  const hit = memoryCache.get(category.id);
  if (!fresh && hit && Date.now() - hit.at < FEED_TTL_MS) return hit.articles;

  const lists = await Promise.all(category.feeds.map(fetchFeed));
  const now = Date.now();
  const cutoff = now - 72 * 60 * 60 * 1000;
  const usable = lists.map(list => list
    .filter(a => {
      const t = a.publishedAt ? new Date(a.publishedAt).getTime() : now;
      return t >= cutoff && t <= now + 60 * 60 * 1000 && !NOISE.test(a.title);
    })
    .sort((x, y) => (y.publishedAt || '').localeCompare(x.publishedAt || '')));

  // Take from each feed in turn so one busy feed can't crowd out the rest.
  const seenUrls = new Set();
  const seenTitles = new Set();
  const articles = [];
  for (let round = 0; articles.length < 80 && usable.some(l => l.length > round); round++) {
    for (const list of usable) {
      const a = list[round];
      if (!a || articles.length >= 80) continue;
      const t = normTitle(a.title);
      if (seenUrls.has(a.url) || seenTitles.has(t)) continue;
      seenUrls.add(a.url);
      seenTitles.add(t);
      articles.push({ id: crypto.createHash('sha1').update(a.url).digest('hex').slice(0, 10), ...a });
    }
  }
  articles.sort((x, y) => (y.publishedAt || '').localeCompare(x.publishedAt || ''));

  if (articles.length) memoryCache.set(category.id, { at: Date.now(), articles });
  else if (hit) return hit.articles; // all feeds failed: keep the last good list
  return articles;
}
