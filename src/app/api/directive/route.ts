import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { directive } = await req.json();
    const margeUrl = process.env.MARGE_RELAY_URL || 'disabled';
    if (margeUrl === 'disabled') {
      return NextResponse.json({ error: 'Relay is in maintenance', relay: 'marge', status: 'maintenance' }, { status: 503 });
    }
    const margeRes = await fetch(margeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `You are Marge, Chief Architect. Assess this directive and respond in JSON only: { "complexity": "simple|complex", "action": "dispatch|debate", "reasoning": "brief reason", "task": "clear task for Homer" }. Directive: ${directive}`
      })
    });

    const margeData = await margeRes.json();
    let margeDecision;
    try {
      margeDecision = JSON.parse(margeData.response);
    } catch {
      margeDecision = {
        action: 'dispatch',
        task: directive,
        reasoning: margeData.response,
        complexity: 'simple'
      };
    }

    return NextResponse.json({
      taskId: Math.random().toString(36).substring(7),
      status: 'dispatched',
      decision: margeDecision
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
