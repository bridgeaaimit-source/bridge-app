import Anthropic from '@anthropic-ai/sdk';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'general';
  
  console.log('=== NEWS API CALLED ===');
  console.log('Category:', category);
  console.log('NewsAPI key exists:', !!process.env.NEWS_API_KEY);
  console.log('Claude API key exists:', !!process.env.ANTHROPIC_API_KEY);
  
  // Category to search keywords mapping
  const keywords = {
    'Marketing': 'marketing advertising brand management career india',
    'Finance': 'finance banking investment career freshers india',
    'HR': 'HR recruitment hiring human resources career india',
    'Analytics': 'data analytics business intelligence career india',
    'Tech': 'software engineering technology placement india',
    'MBA': 'MBA management consulting career placement india',
    'All': 'placement career interview job freshers india 2026'
  };

  const query = keywords[category] || keywords['All'];

  try {
    // Step 1: Fetch from NewsAPI
    const newsResponse = await fetch(
      `https://newsapi.org/v2/everything?` +
      `q=${encodeURIComponent(query)}&` +
      `language=en&` +
      `sortBy=publishedAt&` +
      `pageSize=15&` +
      `apiKey=${process.env.NEWS_API_KEY}` 
    );
    
    if (!newsResponse.ok) {
      throw new Error(`NewsAPI error: ${newsResponse.status}`);
    }
    
    const newsData = await newsResponse.json();
    const articles = newsData.articles || [];
    
    console.log(`Fetched ${articles.length} articles from NewsAPI`);

    // Step 2: Use Claude to filter and add insights
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultHeaders: {
        'anthropic-version': '2023-06-01'
      }
    });

    const articleList = articles.map((a, i) => 
      `${i+1}. Title: ${a.title}\nDescription: ${a.description}` 
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

    const text = message.content[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    console.log('Claude curation response:', text);
    const aiCuration = JSON.parse(text);

    // Step 3: Combine NewsAPI + Claude insights
    const curatedArticles = aiCuration.articles.map(item => {
      const article = articles[item.index];
      return {
        title: article?.title,
        description: article?.description,
        url: article?.url,
        urlToImage: article?.urlToImage,
        publishedAt: article?.publishedAt,
        source: article?.source?.name,
        placement_insight: item.placement_insight,
        gd_topic: item.gd_topic,
        relevance_score: item.relevance_score,
        why_relevant: item.why_relevant
      };
    }).filter(a => a.title);

    console.log(`Curated ${curatedArticles.length} articles for ${category}`);

    return Response.json({
      articles: curatedArticles,
      category_trend: aiCuration.category_trend,
      interview_tip: aiCuration.interview_tip,
      total: curatedArticles.length,
      cached_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('News API error:', error);
    // Fallback mock data
    return Response.json({
      articles: [
        {
          title: "Top Marketing Trends Shaping Placements in 2026",
          description: "Digital marketing skills are now mandatory for campus placements at top companies.",
          url: "#",
          urlToImage: null,
          source: "Economic Times",
          publishedAt: new Date().toISOString(),
          placement_insight: "Brush up on digital marketing tools before your interview",
          gd_topic: true,
          relevance_score: 9,
          why_relevant: "Directly impacts marketing role interviews"
        },
        {
          title: "Tech Giants Focus on AI Skills in Campus Recruitment",
          description: "Leading companies are prioritizing candidates with AI and machine learning knowledge.",
          url: "#",
          urlToImage: null,
          source: "Times of India",
          publishedAt: new Date().toISOString(),
          placement_insight: "Learn AI basics to stand out in technical interviews",
          gd_topic: true,
          relevance_score: 10,
          why_relevant: "AI skills are becoming essential for tech roles"
        }
      ],
      category_trend: "AI skills are trending in all domains",
      interview_tip: "Mention AI tools you know in every interview"
    });
  }
}
