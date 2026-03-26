import { NextResponse } from "next/server";

const SAFE_RE = /^[A-Za-z0-9 _.:/\-]+$/;
const ALLOWED_STATES = new Set(["EXECUTING", "COMPLETE", "FAILED"]);

function requireAuth(req: Request) {
  const key = req.headers.get("x-springfield-key");
  if (!key || key !== process.env.SPRINGFIELD_KEY) {
    throw new Error("Unauthorized");
  }
}

function validateString(value: unknown, field: string, maxLen: number): string {
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`Invalid ${field}`);
  if (trimmed.length > maxLen) throw new Error(`Invalid ${field}`);
  if (!SAFE_RE.test(trimmed)) throw new Error(`Invalid ${field}`);
  return trimmed;
}

function validateOptionalString(value: unknown, field: string, maxLen: number): string {
  if (value === undefined || value === null || value === "") return "";
  return validateString(value, field, maxLen);
}

function makeId(): number {
  return Date.now();
}

export async function POST(req: Request) {
  try {
    requireAuth(req);

    if (!process.env.ZILLIZ_URI || !process.env.ZILLIZ_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Zilliz configuration missing" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const taskId = validateString(body.taskId, "taskId", 128);
    const state = validateString(body.state, "state", 32);
    const threadId = validateString(body.threadId, "threadId", 64);
    const agent = validateString(body.agent, "agent", 32);
    const summary = validateOptionalString(body.summary, "summary", 1024);
    const error = validateOptionalString(body.error, "error", 2048);

    const retryCountRaw = body.retryCount ?? 0;
    const retryCount = Number(retryCountRaw);

    if (!ALLOWED_STATES.has(state)) {
      return NextResponse.json(
        { success: false, error: "Invalid state" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(retryCount) || retryCount < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid retryCount" },
        { status: 400 }
      );
    }

    const payload = {
      collectionName: "springfield_memory_v2",
      data: [
        {
          id: makeId(),
          vector: Array(3072).fill(0),
          type: "task_event",
          taskId,
          threadId,
          agent,
          state,
          timestamp: new Date().toISOString(),
          summary,
          error,
          retryCount,
          embedded: false
        }
      ]
    };

    const res = await fetch(
      `${process.env.ZILLIZ_URI.replace(/\/$/, "")}/v2/vectordb/entities/insert`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.ZILLIZ_TOKEN}`
        },
        body: JSON.stringify(payload),
        cache: "no-store"
      }
    );

    const json = await res.json();

    if (!res.ok || json?.code !== 0) {
      return NextResponse.json(
        { success: false, error: json?.message || json?.reason || "Insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      task: payload.data[0]
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
