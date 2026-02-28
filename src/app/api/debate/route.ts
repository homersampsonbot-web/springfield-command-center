import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    console.log('[debate] topic:', topic);

    // Proxy via Homer gateway
    const gatewayRes = await fetch('http://3.131.96.117:3001/debate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-springfield-key': 'c4c75fe2065fb96842e3690a3a6397fb' },
      body: JSON.stringify({ topic })
    });
    const data = await gatewayRes.json();
    console.log('[debate] gateway status:', gatewayRes.status);

    return NextResponse.json({
      topic,
      responses: {
        marge: data?.marge || '[no response from gateway]',
        lisa: data?.lisa || '[no response from gateway]'
      }
    });
  } catch (error: any) {
    console.error('[debate] error:', error?.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
