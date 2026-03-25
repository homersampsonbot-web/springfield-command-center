import { prisma } from "@/lib/prisma";

export async function buildContextPack(requestId: string) {
  const events = await prisma.event.findMany({
    where: {
      scope: "SYSTEM",
      type: "THREAD_MESSAGE",
      payload: {
        path: ["thread"],
        equals: "team"
      }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const filtered = events
    .filter((e) => {
      const payload = (e.payload ?? {}) as any;
      const participant = payload.participant;
      return participant === "LISA" || participant === "MARGE" || participant === "SMS";
    })
    .reverse();

  const pack = filtered.map((e) => {
    const payload = (e.payload ?? {}) as any;
    return {
      participant: payload.participant ?? null,
      message: e.message,
      createdAt: e.createdAt
    };
  });

  return {
    requestId,
    context: pack
  };
}
