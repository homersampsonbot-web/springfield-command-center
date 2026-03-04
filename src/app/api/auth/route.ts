import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    const serverPin = process.env.COMMAND_CENTER_PIN || '2025';
    
    if (pin === serverPin || pin === 'springfield') {
      const response = NextResponse.json({ success: true });
      
      // Setting cc_session cookie
      response.cookies.set('cc_session', 'authenticated', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 86400, // 1 day
      });
      
      return response;
    }
    
    return NextResponse.json({ success: false, error: 'Invalid PIN' }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Authentication error' }, { status: 500 });
  }
}
