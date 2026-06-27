import Anthropic from '@anthropic-ai/sdk';
import { trackTokensServer } from '@/lib/tokenTrackerServer';

const MOCK_NEWS_CURATION = {
  articles: [
    {
      title: "TCS Announces 40,000 New Hires for FY2025",
      description: "Tata Consultancy Services plans to hire 40,000 fresh graduates focused on AI and cloud technologies.",
      url: "https://www.tcs.com/careers",
      urlToImage: null,
      publishedAt: new Date().toISOString(),
      source: "TCS News",
      placement_insight: "Excellent opportunity for graduates with cloud and AI skill sets.",
      gd_topic: true,
      relevance_score: 9,
      why_relevant: "Directly relates to hiring and jobs in India's largest IT employer."
    },
    {
      title: "Top Skills Employers Want in 2025",
      description: "AI literacy, communication, and adaptability top the list of most sought-after skills by Indian recruiters.",
      url: "https://india.linkedin.com",
      urlToImage: null,
      publishedAt: new Date().toISOString(),
      source: "LinkedIn India",
      placement_insight: "Focus on soft skills alongside coding to stand out in interviews.",
      gd_topic: true,
      relevance_score: 8,
      why_relevant: "Helps candidates understand the key skills being tested in recruiter rounds."
    },
    {
      title: "India Startup Ecosystem Hits $150B Valuation",
      description: "Indian startups raised record funding in 2024 with fintech and edtech leading growth.",
      url: "https://inc42.com",
      urlToImage: null,
      publishedAt: new Date().toISOString(),
      source: "Inc42",
      placement_insight: "Increased funding means more startup hiring for product development.",
      gd_topic: false,
      relevance_score: 7,
      why_relevant: "Indicates market expansion and job growth in the startup sector."
    }
  ],
  category_trend: "IT hiring is rebounding, specifically focused on cloud, data, and generative AI skills.",
  interview_tip: "Prepare questions demonstrating your knowledge of how your domain is adopting AI tools and services."
};






export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'All';
  const userId = searchParams.get('userId') || searchParams.get('uid');
  
  console.log('NEWS_API_KEY exists:', !!process.env.NEWS_API_KEY);
  console.log('ANTHROPIC_KEY exists:', !!process.env.ANTHROPIC_API_KEY);

  if (!process.env.NEWS_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️ News API key or Anthropic key is missing. Returning mock curated news articles.');
    return Response.json({
      ...MOCK_NEWS_CURATION,
      cached_at: new Date().toISOString()
    });
  }
  
  const keywords = {
    'All': 'india AND (jobs OR hiring OR careers)',
    'Marketing': 'india AND (marketing OR advertising) AND (jobs OR hiring)',
    'Finance': 'india AND (finance OR banking) AND (jobs OR hiring)',
    'HR': 'india AND (HR OR recruitment OR human resources) AND (jobs OR hiring)',
    'Analytics': 'india AND (data OR analytics) AND (jobs OR hiring)',
    'Tech': 'india AND (technology OR software OR IT) AND (jobs OR hiring)',
    'MBA': 'india AND (business OR management OR MBA) AND (jobs OR hiring)'
  };

  const query = keywords[category] || keywords['All'];
  console.log('1. Fetching NewsAPI with query:', query);

  try {
    // Step 1: Fetch from NewsAPI
    console.log('2. Calling NewsAPI...');
    const d = new Date();
    d.setDate(d.getDate() - 14); // Limit to last 14 days for freshness
    const fromDate = d.toISOString().split('T')[0];

    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&from=${fromDate}&pageSize=50&apiKey=${process.env.NEWS_API_KEY}`;
    console.log('NewsAPI URL:', newsUrl);
    
    const newsResponse = await fetch(newsUrl);
    
    console.log('3. NewsAPI response status:', newsResponse.status);
    
    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      console.error('NewsAPI error:', errorText);
      throw new Error(`NewsAPI error ${newsResponse.status}: ${errorText}`);
    }
    
    const newsData = await newsResponse.json();
    console.log('4. NewsAPI full response:', newsData);
    
    let articles = newsData.articles || [];
    console.log('5. Original articles count:', articles.length);

    // Shuffle and pick 15 to ensure daily variety (client caches daily)
    if (articles.length > 0) {
      articles = articles.sort(() => Math.random() - 0.5).slice(0, 15);
    }

    if (articles.length === 0) {
      console.log('6. No articles found, trying fallback query...');
      // Try fallback query
      const fallbackQuery = 'india AND (career OR startup OR corporate)';
      console.log('6.1. Trying fallback query:', fallbackQuery);
      
      const fallbackResponse = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(fallbackQuery)}&sortBy=publishedAt&from=${fromDate}&pageSize=50&apiKey=${process.env.NEWS_API_KEY}`
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        let fallbackArticles = fallbackData.articles || [];
        console.log('6.2. Fallback articles count:', fallbackArticles.length);
        
        if (fallbackArticles.length > 0) {
          fallbackArticles = fallbackArticles.sort(() => Math.random() - 0.5).slice(0, 15);
          // Use fallback articles
          return processArticles(fallbackArticles, category, fallbackQuery, userId);
        }
      }
      
      throw new Error(`No articles found for query: "${query}" and fallback: "india career"`);
    }

    return processArticles(articles, category, query, userId);

  } catch (error) {
    console.warn('⚠️ News API error or key missing, returning mock news articles:', error.message);
    
    return Response.json({
      ...MOCK_NEWS_CURATION,
      cached_at: new Date().toISOString()
    });
  }
}

async function processArticles(articles, category, query, userId) {
  console.log('7. Processing articles with Claude...');
  
  // Step 2: Use Claude to filter and add insights
  console.log('8. Calling Claude...');
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });

  const articleList = articles.map((a, i) => 
    `${i+1}. Title: ${a.title}\nDescription: ${a.description || 'No description'}` 
  ).join('\n\n');

  const prompt = `You are a placement advisor for Indian college students.
  
Here are ${articles.length} news articles. 
Student category interest: ${category}

${articleList}

Task:
1. Pick the 5 most relevant articles for ${category} placement preparation
2. Reject any articles about war, politics, crime, sports unrelated to career
3. For each selected article, add a "placement_insight" - 
   one sentence on how this news affects placements/interviews
4. Add a "gd_topic" - could this be a GD topic? true/false
5. Add "relevance_score" 1-10

Return ONLY valid JSON, no markdown:
{
  "articles": [
    {
      "index": (original article index 0-based),
      "placement_insight": "How this affects your placement prep",
      "gd_topic": true/false,
      "relevance_score": 8,
      "why_relevant": "one line why this matters for ${category} students"
    }
  ],
  "category_trend": "One key trend in ${category} this week based on news",
  "interview_tip": "One interview tip based on current ${category} news"
}`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  // Track token usage
  await trackTokensServer(userId || 'anonymous', 'news', message.usage?.input_tokens, message.usage?.output_tokens, 'claude-sonnet-4-5');

  const text = message.content[0].text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  
  console.log('9. Claude response:', text);
  
  if (!text) {
    throw new Error('Claude returned empty response');
  }
  
  let aiCuration;
  try {
    aiCuration = JSON.parse(text);
  } catch (parseError) {
    console.error('JSON parse error in news API:', parseError);
    console.error('Raw text:', text);
    throw new Error('Invalid JSON response from Claude');
  }
  console.log('10. Parsed Claude curation:', aiCuration);

  // Step 3: Combine NewsAPI + Claude insights
  const curatedArticles = aiCuration.articles.map(item => {
    const article = articles[item.index];
    if (!article) return null;
    
    return {
      title: article.title,
      description: article.description || 'No description available',
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source?.name || 'Unknown',
      placement_insight: item.placement_insight,
      gd_topic: item.gd_topic,
      relevance_score: item.relevance_score,
      why_relevant: item.why_relevant
    };
  }).filter(a => a && a.title);

  console.log('11. Final curated articles count:', curatedArticles.length);

  return Response.json({
    articles: curatedArticles,
    category_trend: aiCuration.category_trend,
    interview_tip: aiCuration.interview_tip,
    total: curatedArticles.length,
    cached_at: new Date().toISOString()
  });
}
