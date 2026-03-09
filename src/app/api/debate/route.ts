import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    console.log('[debate] topic:', topic);

    const margeUrl = process.env.MARGE_RELAY_URL || 'disabled';
    const lisaUrl = process.env.LISA_RELAY_URL || 'disabled';

    const callRelay = async (url: string, agent: 'marge' | 'lisa', message: string) => {
      if (url === 'disabled') {
        return { response: 'maintenance', status: 'maintenance' };
      }
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const data = await r.json();
      console.log(`[debate] ${agent} status:`, r.status, data?.response?.slice?.(0, 80));
      return data;
    };

    const margePromise = callRelay(margeUrl, 'marge', `You are Marge, Chief Architect. Debate this topic: ${topic}`);
    const lisaPromise = callRelay(lisaUrl, 'lisa', `You are Lisa, Strategist. Debate this topic: ${topic}`);

    const [margeData, lisaData] = await Promise.all([margePromise, lisaPromise]);

    return NextResponse.json({
      topic,
      responses: {
        marge: margeData.response,
        lisa: lisaData.response
      }
    });
  } catch (error: any) {
    console.error('[debate] error:', error?.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
