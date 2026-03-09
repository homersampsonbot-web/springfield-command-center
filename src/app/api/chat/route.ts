import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { agent, message } = await req.json();
    
    let url = '';
    if (agent === 'marge') url = process.env.MARGE_RELAY_URL || 'disabled';
    else if (agent === 'lisa') url = process.env.LISA_RELAY_URL || 'disabled';
    else {
      return NextResponse.json({ reply: `Agent ${agent} not reachable via relay.` });
    }

    if (url === 'disabled') {
      return NextResponse.json({ reply: `Agent ${agent} relay is in maintenance.` }, { status: 503 });
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    return NextResponse.json({ reply: data.response });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
