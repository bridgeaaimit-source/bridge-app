export async function GET(request) {
  // Verify secret to prevent abuse
  const secret = request.nextUrl.searchParams.get('secret');
  
  if (secret !== process.env.ADMIN_SECRET_KEY) {
    return Response.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }

  const categories = [
    'All', 'Marketing', 'Finance', 
    'HR', 'Analytics', 'Tech', 'MBA'
  ];

  const results = [];

  for (const category of categories) {
    try {
      // Force refresh each category
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/gd-insights?category=${category}&force=true&secret=${process.env.ADMIN_SECRET_KEY}` 
      );
      const data = await res.json();
      results.push({ category, status: 'refreshed' });
      
      // Small delay between calls
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      results.push({ category, status: 'failed', 
        error: err.message });
    }
  }

  return Response.json({ 
    refreshed: true, 
    results,
    timestamp: new Date().toISOString()
  });
}
