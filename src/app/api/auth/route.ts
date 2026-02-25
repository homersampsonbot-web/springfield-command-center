import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { pin, password } = await request.json();

  const correctPin = process.env.COMMAND_CENTER_PIN;
  const correctPassword = process.env.COMMAND_CENTER_PASSWORD;

  console.log('Auth Attempt:', { 
    receivedPin: pin, 
    receivedPassword: password, 
    expectedPin: correctPin ? 'SET' : 'MISSING',
    expectedPassword: correctPassword ? 'SET' : 'MISSING'
  });

  if ((pin && pin === correctPin) || (password && password === correctPassword)) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false, debug: { pinSet: !!correctPin } }, { status: 401 });
}
