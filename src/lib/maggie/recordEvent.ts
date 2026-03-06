import { prisma } from "@/lib/prisma";

export async function recordEvent(opts: { type: string; message: string; jobId?: string | null; scope?: 'JOB' | 'DIRECTIVE' | 'SYSTEM' | 'AGENT' }) {
  return prisma.event.create({
    data: {
      scope: opts.scope || 'JOB',
      type: opts.type,
      level: 'INFO',
      message: opts.message,
      jobId: opts.jobId ?? null
    },
  });
}
