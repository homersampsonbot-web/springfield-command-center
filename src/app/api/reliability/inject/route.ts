import { NextResponse } from "next/server";
import { requireAppAuth } from "@/lib/auth";

async function insertMemoryToZilliz(collectionName: string, memoryData: any) {
  const base = (process.env.ZILLIZ_URI || "").replace(/\/+$/, "");
  const token = process.env.ZILLIZ_TOKEN || "";

  if (!base || !token) {
    throw new Error("Zilliz configuration missing");
  }

  const response = await fetch(`${base}/v2/vectordb/entities/insert`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      collectionName,
      data: [memoryData]
    })
  });

  const rawBody = await response.text();
  let parsed: any = null;

  try {
    parsed = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    throw new Error(`Zilliz insert returned non-JSON body: ${rawBody}`);
  }

  if (!response.ok) {
    throw new Error(`Zilliz insert HTTP ${response.status}: ${rawBody}`);
  }

  if (parsed?.code && parsed.code !== 0) {
    throw new Error(`Zilliz insert application error (${parsed.code}): ${parsed.message || rawBody}`);
  }

  return parsed;
}

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const body = await req.json().catch(() => ({}));

    const timestamp = Date.now();
    const taskId = null;

    const storedPayload = {
      type: "failure",
      agent: body.agent || "homer",
      taskId,
      message: body.message || "Synthetic failure injected",
      error: body.error || "Synthetic failure injected",
      details: {
        synthetic: true,
        eventType: body.eventType || "synthetic_failure"
      },
      timestamp
    };

    const memoryData = {
      id: `synthetic-failure-${timestamp}`,
      ts: timestamp,
      text: JSON.stringify(storedPayload),
      embedding: Array(8).fill(0)
    };

    const result = await insertMemoryToZilliz(
      process.env.ZILLIZ_COLLECTION || "homer_memory",
      memoryData
    );

    return NextResponse.json({
      success: true,
      injected: storedPayload,
      zilliz: result ?? null
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || "Injection failed" },
      { status: 500 }
    );
  }
}
