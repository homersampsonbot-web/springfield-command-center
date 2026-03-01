import { NextRequest, NextResponse } from 'next/server';
const HOMER_GATEWAY = 'http://3.131.96.117:3001';
const SPRINGFIELD_KEY = 'c4c75fe2065fb96842e3690a3a6397fb';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await fetch(`${HOMER_GATEWAY}/debate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-springfield-key': SPRINGFIELD_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: 'Gateway error', details: errText },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Debate proxy failed', details: err.message },
      { status: 500 }
    );
  }
}
