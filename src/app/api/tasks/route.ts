import { NextResponse } from "next/server";

function requireAuth(req: Request) {
  const key = req.headers.get("x-springfield-key");
  if (!key || key !== process.env.SPRINGFIELD_KEY) {
    throw new Error("Unauthorized");
  }
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

export async function GET(req: Request) {
  try {
    requireAuth(req);

    if (!process.env.ZILLIZ_URI || !process.env.ZILLIZ_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Zilliz configuration missing" },
        { status: 500 }
      );
    }

    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit") ?? "50";
    const limit = Number(limitParam);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid limit (1-100 allowed)" },
        { status: 400 }
      );
    }

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
          filter: `type == "task_event"`,
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

    const rows: TaskEvent[] = json.data || [];
    const latestByTask = new Map<string, TaskEvent>();

    for (const row of rows) {
      const existing = latestByTask.get(row.taskId);
      if (!existing || String(row.timestamp).localeCompare(String(existing.timestamp)) > 0) {
        latestByTask.set(row.taskId, row);
      }
    }

    const tasks = Array.from(latestByTask.values())
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, limit)
      .map((row) => ({
        taskId: row.taskId,
        threadId: row.threadId,
        agent: row.agent,
        state: row.state,
        timestamp: row.timestamp,
        summary: row.summary ?? "",
        error: row.error ?? "",
        retryCount: row.retryCount ?? 0
      }));

    return NextResponse.json({
      success: true,
      tasks
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
