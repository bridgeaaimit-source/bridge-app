import Anthropic from '@anthropic-ai/sdk';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
let db = null;
try {
  if (!admin.apps.length && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  }
  db = admin.firestore();
} catch (error) {
  console.warn('Firebase Admin init failed:', error.message);
}

// Track token usage
async function trackTokens(userId, feature, inputTokens, outputTokens) {
  if (!db) return;
  const total = (inputTokens || 0) + (outputTokens || 0);
  const today = new Date().toISOString().split('T')[0];
  
  try {
    await db.collection('tokenUsage').doc('daily').collection(today).doc(userId || 'anonymous').set({
      userId: userId || 'anonymous',
      [feature]: admin.firestore.FieldValue.increment(total),
      total: admin.firestore.FieldValue.increment(total),
      lastUsed: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log(`📊 ${userId || 'anonymous'} | ${feature}: ${total} tokens`);
  } catch (e) {
    console.error('Token tracking failed:', e);
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'All';
  
  console.log('NEWS_API_KEY exists:', !!process.env.NEWS_API_KEY);
  console.log('ANTHROPIC_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
  
  // Category to search keywords mapping
  const keywords = {
    'All': 'india jobs hiring 2026',
    'Marketing': 'marketing india 2026',
    'Finance': 'finance india banking 2026',
    'HR': 'hiring recruitment india 2026',
    'Analytics': 'data analytics india 2026',
    'Tech': 'technology software india 2026',
    'MBA': 'business management india 2026'
  };

  const query = keywords[category] || keywords['All'];
  console.log('1. Fetching NewsAPI with query:', query);

  try {
    // Step 1: Fetch from NewsAPI
    console.log('2. Calling NewsAPI...');
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`;
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
    
    const articles = newsData.articles || [];
    console.log('5. Articles count:', articles.length);

    if (articles.length === 0) {
      console.log('6. No articles found, trying fallback query...');
      // Try fallback query
      const fallbackQuery = 'india career';
      console.log('6.1. Trying fallback query:', fallbackQuery);
      
      const fallbackResponse = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(fallbackQuery)}&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`
      );
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const fallbackArticles = fallbackData.articles || [];
        console.log('6.2. Fallback articles count:', fallbackArticles.length);
        
        if (fallbackArticles.length > 0) {
          // Use fallback articles
          return processArticles(fallbackArticles, category, 'india career');
        }
      }
      
      throw new Error(`No articles found for query: "${query}" and fallback: "india career"`);
    }

    return processArticles(articles, category, query);

  } catch (error) {
    console.error('=== NEWS API ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    return Response.json({
      error: error.message,
      articles: [],
      category_trend: null,
      interview_tip: null,
      total: 0,
      cached_at: new Date().toISOString()
    }, { status: 500 });
  }
}

async function processArticles(articles, category, query) {
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
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  // Track token usage
  await trackTokens('system', 'news-curation', message.usage?.input_tokens, message.usage?.output_tokens);

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
