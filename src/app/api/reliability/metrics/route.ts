import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      tasks_completed_24h,
      tasks_failed_24h,
      dead_task_count,
      current_queue_depth,
      avgRows
    ] = await Promise.all([
      prisma.job.count({
        where: {
          status: 'DONE',
          updatedAt: { gte: since24h }
        }
      }),
      prisma.job.count({
        where: {
          status: 'FAILED',
          updatedAt: { gte: since24h }
        }
      }),
      prisma.job.count({
        where: {
          status: 'BLOCKED'
        }
      }),
      prisma.job.count({
        where: {
          status: { in: ['QUEUED', 'CLAIMED'] }
        }
      }),
      prisma.$queryRaw<Array<{ avg_execution_ms: number | null }>>`
        SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) * 1000) AS avg_execution_ms
        FROM "Job"
        WHERE status = 'DONE'
          AND "updatedAt" >= ${since24h}
      `
    ]);

    return NextResponse.json({
      tasks_completed_24h,
      tasks_failed_24h,
      dead_task_count,
      avg_execution_ms: Math.round(avgRows?.[0]?.avg_execution_ms || 0),
      current_queue_depth,
      checked: new Date().toISOString()
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || 'metrics_failed' },
      { status: 500 }
    );
  }
}
