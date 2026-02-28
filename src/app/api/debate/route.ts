import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    
    // Call Marge
    const margePromise = fetch('http://18.190.203.220:3003/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `You are Marge, Chief Architect. Debate this topic: ${topic}`
      })
    }).then(r => r.json());

    // Call Lisa
    const lisaPromise = fetch('http://18.190.203.220:3004/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `You are Lisa, Strategist. Debate this topic: ${topic}`
      })
    }).then(r => r.json());

    const [margeData, lisaData] = await Promise.all([margePromise, lisaPromise]);

    return NextResponse.json({
      topic,
      responses: {
        marge: margeData.response,
        lisa: lisaData.response
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
