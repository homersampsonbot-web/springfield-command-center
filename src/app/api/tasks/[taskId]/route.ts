import { NextResponse } from "next/server";

const SAFE_TASK_RE = /^[A-Za-z0-9._:-]+$/;

function requireAuth(req: Request) {
  const key = req.headers.get("x-springfield-key");
  if (!key || key !== process.env.SPRINGFIELD_KEY) {
    throw new Error("Unauthorized");
  }
}

function validateTaskId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Invalid taskId");
  if (trimmed.length > 128) throw new Error("Invalid taskId");
  if (!SAFE_TASK_RE.test(trimmed)) throw new Error("Invalid taskId");
  return trimmed;
}

type TaskEvent = {
  id: number;
  type: string;
  taskId: string;
  threadId: string;
  agent: string;
  state: string;
  timestamp: string;
  summary?: string;
  error?: string;
  retryCount?: number;
  embedded?: boolean;
};

export async function GET(
  req: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    requireAuth(req);

    if (!process.env.ZILLIZ_URI || !process.env.ZILLIZ_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Zilliz configuration missing" },
        { status: 500 }
      );
    }

    const { taskId: rawTaskId } = await context.params;
    const taskId = validateTaskId(rawTaskId);

    const res = await fetch(
      `${process.env.ZILLIZ_URI.replace(/\/$/, "")}/v2/vectordb/entities/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ZILLIZ_TOKEN}`
        },
        body: JSON.stringify({
          collectionName: "springfield_memory_v2",
          filter: `type == "task_event" && taskId == "${taskId}"`,
          limit: 100,
          outputFields: ["*"]
        }),
        cache: "no-store"
      }
    );

    const json = await res.json();

    if (!res.ok || json?.code !== 0) {
      return NextResponse.json(
        { success: false, error: json?.message || json?.reason || "Query failed" },
        { status: 500 }
      );
    }

    const events: TaskEvent[] = (json.data || []).sort((a: TaskEvent, b: TaskEvent) =>
      String(a.timestamp).localeCompare(String(b.timestamp))
    );

    if (events.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    const current = events[events.length - 1];

    return NextResponse.json({
      success: true,
      taskId,
      currentState: current.state,
      current: current,
      history: events
    });
  } catch (err: any) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { success: false, error: err.message || "Unknown error" },
      { status: 400 }
    );
  }
}
