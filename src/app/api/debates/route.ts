import { prisma } from "@/lib/prisma";

function dbUnavailable(err: any) {
  const msg = err?.message || "";
  return msg.includes("P1001") || msg.includes("Can't reach database server");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const state = searchParams.get("state");
    const debates = await prisma.debate.findMany({
      where: state ? { state: state as any } : undefined,
      orderBy: { updatedAt: "desc" },
    });
    return Response.json(debates);
  } catch (e: any) {
    if (dbUnavailable(e)) return Response.json({ error: "db_unreachable" }, { status: 503 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const debate = await prisma.debate.create({
      data: {
        title: body.title,
        trigger: body.trigger || "PLAN_APPROVAL",
        context: body.context || null,
        options: body.options || null,
        recommendation: body.recommendation || null,
        events: {
          create: {
            type: "CREATED",
            message: `Debate created: ${body.title}`,
          },
        },
      },
      include: { events: true },
    });
    return Response.json(debate);
  } catch (e: any) {
    if (dbUnavailable(e)) return Response.json({ error: "db_unreachable" }, { status: 503 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
