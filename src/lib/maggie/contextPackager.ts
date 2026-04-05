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
    take: 300
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

  // Check if Marge has approved anything recently
  const margeApproved = latestMarge && (
    latestMarge.includes("Approval state: APPROVED") ||
    latestMarge.includes("Ruling: Approved") ||
    latestMarge.includes("RULING: APPROVED") ||
    latestMarge.includes("APPROVED") ||
    latestMarge.includes("CONFIRMED") ||
    latestMarge.includes("authorized") ||
    latestMarge.includes("proceed")
  );

  const brief = [
    "MAGGIE REVIEW BRIEF",
    `requestId: ${requestId}`,
    `eventsRetrieved: ${pack.length}`,
    latestLisa ? `latestLisa: ${latestLisa}` : "latestLisa: none",
    latestMarge ? `latestMarge: ${latestMarge}` : "latestMarge: none",
    margeApproved ? "Approval state: APPROVED" : "Approval state: PENDING"
  ].join("\n\n");

  return {
    requestId,
    context: pack,
    brief
  };
}
