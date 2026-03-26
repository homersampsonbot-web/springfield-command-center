import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { agent, status } = await req.json();
    await prisma.$executeRaw`
      INSERT INTO agent_heartbeats (agent_id, last_seen, status)
      VALUES (${agent}, NOW(), ${status || 'online'})
      ON CONFLICT (agent_id) DO UPDATE
      SET last_seen = NOW(), status = ${status || 'online'}
    `;
    return NextResponse.json({ ok: true });
  } catch(e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
