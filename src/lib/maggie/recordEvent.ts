import { prisma } from "@/lib/prisma";

export async function recordEvent(opts: { type: string; message: string; jobId?: string | null }) {
  return prisma.jobEvent.create({
    data: {
      type: opts.type,
      message: opts.message,
      jobId: opts.jobId ?? null
    },
  });
}
