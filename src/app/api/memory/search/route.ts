import { NextResponse } from "next/server";

const SAFE_FILTER_RE = /^[A-Za-z0-9_-]+$/;

function validateFilterValue(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}`);
  }
  if (!SAFE_FILTER_RE.test(value)) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

type ParsedRecord = {
  id: string;
  type: string | null;
  eventType: string | null;
  agent: string | null;
  taskId: string | null;
  details: Record<string, unknown>;
  timestamp: string | null;
};

export async function POST(req: Request) {
  try {
    const key = req.headers.get("x-springfield-key");
    if (!key || key !== process.env.SPRINGFIELD_KEY) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    let type: string | null;
    let taskId: string | null;
    let eventType: string | null;

    try {
      type = validateFilterValue(body.type, "type");
      taskId = validateFilterValue(body.taskId, "taskId");
      eventType = validateFilterValue(body.eventType, "eventType");
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 400 });
    }

    if (!type && !taskId && !eventType) {
      return NextResponse.json(
        { success: false, error: "At least one filter required" },
        { status: 400 }
      );
    }

    let { limit, minTs } = body;

    if (limit === undefined) limit = 20;
    limit = Number(limit);

    if (Number.isNaN(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid limit (1–100 allowed)" },
        { status: 400 }
      );
    }

    let minTsNum: number | null = null;
    if (minTs !== undefined && minTs !== null && minTs !== "") {
      minTsNum = Number(minTs);
      if (Number.isNaN(minTsNum) || minTsNum <= 0) {
        return NextResponse.json(
          { success: false, error: "Invalid minTs" },
          { status: 400 }
        );
      }
    }

    if (!process.env.ZILLIZ_URI || !process.env.ZILLIZ_TOKEN) {
      return NextResponse.json(
        { success: false, error: "Zilliz configuration missing" },
        { status: 500 }
      );
    }

    const collectionName = process.env.ZILLIZ_COLLECTION || "homer_memory";
    const base = process.env.ZILLIZ_URI.replace(/\/+$/, "");

    const filterParts: string[] = [];
    if (minTsNum !== null) {
      filterParts.push(`ts >= ${Math.floor(minTsNum)}`);
    }
    const filter = filterParts.length ? filterParts.join(" and ") : undefined;

    const res = await fetch(`${base}/v2/vectordb/entities/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.ZILLIZ_TOKEN}`
      },
      body: JSON.stringify({
        collectionName,
        filter,
        limit: 1000,
        outputFields: ["id", "ts", "text"]
      })
    });

    const result = await res.json();

    if (!res.ok || (result?.code && result.code !== 0)) {
      return NextResponse.json(
        { success: false, error: result?.message || result?.msg || "Zilliz REST query failed" },
        { status: 500 }
      );
    }

    const parsed: ParsedRecord[] = (result.data || []).map((r: any) => {
      let payload: any = {};
      try {
        payload = JSON.parse(r.text || "{}");
      } catch {
        payload = {};
      }

      const details =
        payload.details && typeof payload.details === "object" ? payload.details : {};

      const payloadTimestamp =
        typeof payload.timestamp === "number"
          ? payload.timestamp
          : typeof payload.timestamp === "string"
            ? Date.parse(payload.timestamp)
            : null;

      const tsValue =
        payloadTimestamp && !Number.isNaN(payloadTimestamp)
          ? payloadTimestamp
          : typeof r.ts === "number"
            ? r.ts
            : null;

      return {
        id: String(r.id),
        type: payload.type || null,
        eventType:
          payload.eventType ||
          (typeof details.eventType === "string" ? details.eventType : null),
        agent: payload.agent || null,
        taskId: payload.taskId || null,
        details,
        timestamp: tsValue ? new Date(tsValue).toISOString() : null
      };
    });

    const filtered = parsed
      .filter((r) => (type ? r.type === type : true))
      .filter((r) => (taskId ? r.taskId === taskId : true))
      .filter((r) => (eventType ? r.eventType === eventType : true))
      .filter((r) => {
        if (minTsNum === null) return true;
        const t = r.timestamp ? Date.parse(r.timestamp) : 0;
        return t >= minTsNum;
      })
      .sort((a, b) => {
        const am = a.timestamp ? Date.parse(a.timestamp) : 0;
        const bm = b.timestamp ? Date.parse(b.timestamp) : 0;
        return bm - am;
      })
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      records: filtered
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
