import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { agent, message } = await req.json();
    
    let url = '';
    if (agent === 'marge') url = 'http://18.190.203.220:3003/relay';
    else if (agent === 'lisa') url = 'http://18.190.203.220:3004/relay';
    else {
      return NextResponse.json({ reply: `Agent ${agent} not reachable via relay.` });
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
