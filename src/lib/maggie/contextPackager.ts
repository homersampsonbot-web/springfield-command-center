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
    take: 100
  });

  const pack = events
    .map((e) => {
      const payload = (e.payload ?? {}) as any;
      return {
        participant: payload.participant ?? null,
        source: payload.source ?? null,
        message: e.message,
        createdAt: e.createdAt
      };
    })
    .filter((e) => e.participant === "LISA" || e.participant === "MARGE");

  const latestLisa =
    pack.find((e) => e.participant === "LISA" && typeof e.message === "string" && e.message.trim())?.message ?? null;

  const latestMarge =
    pack.find(
      (e) =>
        e.participant === "MARGE" &&
        typeof e.message === "string" &&
        (e.message.includes("Approval state: APPROVED") ||
          e.message.includes("Ruling: Approved") ||
          e.message.includes("RULING: APPROVED"))
    )?.message ??
    pack.find((e) => e.participant === "MARGE" && typeof e.message === "string" && e.message.trim())?.message ??
    null;

  const brief = [
    "MAGGIE REVIEW BRIEF",
    `requestId: ${requestId}`,
    `eventsRetrieved: ${pack.length}`,
    latestLisa ? `latestLisa: ${latestLisa}` : "latestLisa: none",
    latestMarge ? `latestMarge: ${latestMarge}` : "latestMarge: none"
  ].join("\n\n");

  return {
    requestId,
    context: pack,
    brief
  };
}
