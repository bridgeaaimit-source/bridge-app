import { NextResponse } from 'next/server';

// Simple toggle endpoint to disable/enable auth bypass
export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (action === 'status') {
      // Return current bypass status
      return NextResponse.json({ 
        bypass: process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true',
        message: process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' 
          ? 'Auth bypass is ENABLED' 
          : 'Auth bypass is DISABLED'
      });
    }
    
    return NextResponse.json({ 
      message: 'Auth bypass API endpoint working',
      currentStatus: process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' ? 'enabled' : 'disabled'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Invalid request',
      message: 'Please provide valid action parameter'
    }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    bypass: process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true',
    message: process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true' 
      ? 'Auth bypass is ENABLED - Testing mode active' 
      : 'Auth bypass is DISABLED - Normal auth required',
    instructions: 'Set NEXT_PUBLIC_BYPASS_AUTH=true in .env.local to enable bypass'
  });
}
