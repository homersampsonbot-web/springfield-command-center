import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAGGIE_TOKEN = process.env.MAGGIE_TELEGRAM_TOKEN;
const CHAT_ID = process.env.MAGGIE_TELEGRAM_CHAT_ID;
const COOLDOWN_MINUTES = 15;

async function sendMaggieTelegram(text: string) {
  if (!MAGGIE_TOKEN) return;
  await fetch(
    `https://api.telegram.org/bot${MAGGIE_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'HTML'
      })
    }
  );
}

export async function GET() {
  const alerts: string[] = [];

  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT last_seen FROM agent_heartbeats
      WHERE agent_id = 'homer'
    `;
    if (rows.length === 0) {
      alerts.push('⚠️ <b>Homer</b>: No heartbeat recorded');
    } else {
      const mins = (Date.now() - new Date(rows[0].last_seen).getTime()) / 60000;
      if (mins > 3) {
        alerts.push(`🚨 <b>Homer silent</b>: Last seen ${Math.round(mins)}m ago`);
      }
    }
  } catch(e: any) {
    alerts.push(`⚠️ <b>Heartbeat check failed</b>: ${e.message}`);
  }

  try {
    const failed = await prisma.job.count({
      where: {
        status: 'FAILED',
        updatedAt: { gte: new Date(Date.now() - 3600000) }
      }
    });
    if (failed > 0) {
      alerts.push(`⚠️ <b>${failed} failed task(s)</b> in last hour`);
    }
  } catch(e) {}

  try {
    const stuck = await prisma.job.count({
      where: {
        status: { in: ['CLAIMED', 'IN_PROGRESS'] },
        updatedAt: { lte: new Date(Date.now() - 600000) }
      }
    });
    if (stuck > 0) {
      alerts.push(`⚠️ <b>${stuck} stuck job(s)</b>: not progressing 10m+`);
    }
  } catch(e) {}

  const alertText = alerts.join('\n\n');

  if (alerts.length > 0) {
    let shouldSend = true;

    try {
      const rows = await prisma.$queryRaw<any[]>`
        SELECT last_alert_at, last_alert_text
        FROM maggie_alert_state
        WHERE id = 'global'
      `;

      if (rows.length > 0) {
        const lastAt = rows[0].last_alert_at ? new Date(rows[0].last_alert_at) : null;
        const lastText = rows[0].last_alert_text || '';
        const minsSince = lastAt ? (Date.now() - lastAt.getTime()) / 60000 : 999;

        if (lastText === alertText && minsSince < COOLDOWN_MINUTES) {
          shouldSend = false;
        }
      }
    } catch(e) {}

    if (shouldSend) {
      await sendMaggieTelegram(
        `🔔 <b>Maggie Monitor</b> — ${new Date().toLocaleTimeString()}\n\n` +
        alertText
      );

      try {
        await prisma.$executeRaw`
          INSERT INTO maggie_alert_state (id, last_alert_at, last_alert_text)
          VALUES ('global', NOW(), ${alertText})
          ON CONFLICT (id) DO UPDATE
          SET last_alert_at = NOW(),
              last_alert_text = ${alertText}
        `;
      } catch(e) {}
    }
  }

  return NextResponse.json({
    checked: new Date().toISOString(),
    alerts: alerts.length,
    messages: alerts,
    cooldownMinutes: COOLDOWN_MINUTES
  });
}
