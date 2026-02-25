import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { pin, password } = await request.json();

  const correctPin = process.env.COMMAND_CENTER_PIN;
  const correctPassword = process.env.COMMAND_CENTER_PASSWORD;

  if (pin === correctPin || password === correctPassword) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
