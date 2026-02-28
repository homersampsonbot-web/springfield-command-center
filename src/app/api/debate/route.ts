import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    console.log('[debate] topic:', topic);

    // Call Marge
    const margePromise = fetch('http://18.190.203.220:3003/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `You are Marge, Chief Architect. Debate this topic: ${topic}`
      })
    }).then(async r => {
      const data = await r.json();
      console.log('[debate] marge status:', r.status, data?.response?.slice?.(0, 80));
      return data;
    });

    // Call Lisa
    const lisaPromise = fetch('http://18.190.203.220:3004/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `You are Lisa, Strategist. Debate this topic: ${topic}`
      })
    }).then(async r => {
      const data = await r.json();
      console.log('[debate] lisa status:', r.status, data?.response?.slice?.(0, 80));
      return data;
    });

    const [margeData, lisaData] = await Promise.all([margePromise, lisaPromise]);

    const margeText = margeData?.response || margeData?.message || '[no response from Marge relay]';
    const lisaText = lisaData?.response || lisaData?.message || '[no response from Lisa relay]';

    return NextResponse.json({
      topic,
      responses: {
        marge: margeText,
        lisa: lisaText
      }
    });
  } catch (error: any) {
    console.error('[debate] error:', error?.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
