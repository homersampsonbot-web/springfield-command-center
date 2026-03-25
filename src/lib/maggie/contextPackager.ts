import { prisma } from "@/lib/prisma";

export async function buildContextPack(requestId: string) {
  const events = await prisma.event.findMany({
    where: {
      scope: "SYSTEM",
      type: "THREAD_MESSAGE",
      payload: {
        path: ["requestId"],
        equals: requestId
      }
    },
    orderBy: { createdAt: "asc" }
  });

  const pack = events.map(e => ({
    participant: e.payload?.participant,
    message: e.message,
    createdAt: e.createdAt
  }));

  return {
    requestId,
    context: pack
  };
}
