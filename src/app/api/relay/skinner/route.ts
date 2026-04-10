import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const key = req.headers.get('x-springfield-key');
  const body = await req.json();
  try {
    const res = await fetch('https://homer.margebot.com/api/skinner-relay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-springfield-key': key || process.env.SPRINGFIELD_KEY || 'c4c75fe2065fb96842e3690a3a6397fb'
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
