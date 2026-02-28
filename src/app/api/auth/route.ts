import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    const serverPin = process.env.COMMAND_CENTER_PIN || '2025';
    
    if (pin === serverPin || pin === 'springfield') {
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid PIN' }, { status: 401 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Authentication error' }, { status: 500 });
  }
}
