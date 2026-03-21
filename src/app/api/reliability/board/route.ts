import { NextResponse } from "next/server";
import {
  DEFAULT_WINDOW_MINUTES,
  MAX_WINDOW_MINUTES,
  MEMORY_SEARCH_LIMIT,
  RECENT_EVENTS_LIMIT,
  HEARTBEAT_STALE_THRESHOLD_S,
  HEARTBEAT_OFFLINE_THRESHOLD_S
} from "@/lib/reliability/constants";

type MemoryRecord = {
  id: string | null;
  type?: string | null;
  eventType?: string | null;
  taskId?: string | null;
  agent?: string | null;
  timestamp?: string | null;
  message?: string | null;
  error?: string | null;
  details?: Record<string, any>;
};

function parseWindowMinutes(value: string | null): number {
  if (!value) return DEFAULT_WINDOW_MINUTES;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0 || num > MAX_WINDOW_MINUTES) {
    throw new Error("Invalid windowMinutes");
  }
  return num;
}

function getTimestampMs(record: MemoryRecord): number {
  if (!record) return 0;
  if (typeof record.timestamp === "string") {
    const n = Date.parse(record.timestamp);
    if (!Number.isNaN(n)) return n;
  }
  const details = record.details || {};
  if (typeof details.timestamp === "number") return details.timestamp;
  if (typeof details.timestamp === "string") {
    const n = Date.parse(details.timestamp);
    if (!Number.isNaN(n)) return n;
  }
  if (typeof details.createdAt === "string") {
    const n = Date.parse(details.createdAt);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function getAgent(record: MemoryRecord): string | null {
  const details = record.details || {};
  return (
    record.agent ||
    details.agent ||
    details.executorHost ||
    null
  );
}

function getTaskId(record: MemoryRecord): string | null {
  const details = record.details || {};
  return record.taskId || details.taskId || null;
}

function getEventType(record: MemoryRecord): string | null {
  const details = record.details || {};
  return record.eventType || details.eventType || null;
}

function isSynthetic(record: MemoryRecord): boolean {
  return record?.details?.synthetic === true;
}

async function callMemorySearch(origin: string, key: string, payload: Record<string, any>) {
  const res = await fetch(`${origin}/api/memory/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-springfield-key": key
    },
    body: JSON.stringify(payload)
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Memory search failed");
  }
  return Array.isArray(json.records) ? json.records : [];
}

export async function GET(req: Request) {
  try {
    const key = req.headers.get("x-springfield-key");
    if (!key || key !== process.env.SPRINGFIELD_KEY) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const windowMinutes = parseWindowMinutes(searchParams.get("windowMinutes"));
    const includeSynthetic = searchParams.get("includeSynthetic") === "true";

    const nowMs = Date.now();
    const windowStartMs = nowMs - windowMinutes * 60 * 1000;

    const origin = new URL(req.url).origin;

    const [
      heartbeatEvents,
      taskStartEvents,
      noopEvents,
      writeFileEvents,
      commandEvents,
      patchEvents,
      maxRetryEvents,
      failureEvents
    ] = await Promise.all([
      callMemorySearch(origin, key, { eventType: "heartbeat_sent", limit: MEMORY_SEARCH_LIMIT, minTs: windowStartMs }),
      callMemorySearch(origin, key, { eventType: "task_execution_start", limit: MEMORY_SEARCH_LIMIT, minTs: windowStartMs }),
      callMemorySearch(origin, key, { eventType: "task_noop", limit: MEMORY_SEARCH_LIMIT, minTs: windowStartMs }),
      callMemorySearch(origin, key, { eventType: "task_write_file", limit: MEMORY_SEARCH_LIMIT, minTs: windowStartMs }),
      callMemorySearch(origin, key, { eventType: "task_command", limit: MEMORY_SEARCH_LIMIT, minTs: windowStartMs }),
      callMemorySearch(origin, key, { eventType: "task_patch", limit: MEMORY_SEARCH_LIMIT, minTs: windowStartMs }),
      callMemorySearch(origin, key, { eventType: "task_max_retries_exceeded", limit: MEMORY_SEARCH_LIMIT, minTs: windowStartMs }),
      callMemorySearch(origin, key, { type: "failure", limit: MEMORY_SEARCH_LIMIT, minTs: windowStartMs })
    ]);

    const normalize = (records: MemoryRecord[]) =>
      records
        .map((record) => {
          const timestampMs = getTimestampMs(record);
          return {
            ...record,
            eventType: getEventType(record),
            agent: getAgent(record),
            taskId: getTaskId(record),
            timestamp: timestampMs ? new Date(timestampMs).toISOString() : null,
            details: record.details || {}
          };
        })
        .filter((record) => {
          const ts = record.timestamp ? Date.parse(record.timestamp) : 0;
          if (!ts || ts < windowStartMs) return false;
          if (!includeSynthetic && isSynthetic(record)) return false;
          return true;
        });

    const heartbeatWindow = normalize(heartbeatEvents);
    const taskStartWindow = normalize(taskStartEvents);
    const noopWindow = normalize(noopEvents);
    const writeFileWindow = normalize(writeFileEvents);
    const commandWindow = normalize(commandEvents);
    const patchWindow = normalize(patchEvents);
    const maxRetryWindow = normalize(maxRetryEvents);
    const failureWindow = normalize(failureEvents);

    const agents: Record<string, any> = {
      homer: { lastHeartbeat: null, heartbeatCount: 0, taskStarts: 0, noopCount: 0, writeFileCount: 0, commandCount: 0, patchCount: 0, maxRetryCount: 0, failureCount: 0, status: "offline" },
      bart: { lastHeartbeat: null, heartbeatCount: 0, taskStarts: 0, noopCount: 0, writeFileCount: 0, commandCount: 0, patchCount: 0, maxRetryCount: 0, failureCount: 0, status: "offline" },
      lisa: { lastHeartbeat: null, heartbeatCount: 0, taskStarts: 0, noopCount: 0, writeFileCount: 0, commandCount: 0, patchCount: 0, maxRetryCount: 0, failureCount: 0, status: "offline" },
      marge: { lastHeartbeat: null, heartbeatCount: 0, taskStarts: 0, noopCount: 0, writeFileCount: 0, commandCount: 0, patchCount: 0, maxRetryCount: 0, failureCount: 0, status: "offline" },
      maggie: { lastHeartbeat: null, heartbeatCount: 0, taskStarts: 0, noopCount: 0, writeFileCount: 0, commandCount: 0, patchCount: 0, maxRetryCount: 0, failureCount: 0, status: "offline" }
    };

    for (const record of heartbeatWindow) {
      const agent = record.agent || "homer";
      if (!agents[agent]) continue;
      agents[agent].heartbeatCount += 1;
      if (!agents[agent].lastHeartbeat || Date.parse(record.timestamp!) > Date.parse(agents[agent].lastHeartbeat)) {
        agents[agent].lastHeartbeat = record.timestamp;
      }
    }

    for (const record of taskStartWindow) {
      const agent = record.agent || "homer";
      if (agents[agent]) agents[agent].taskStarts += 1;
    }
    for (const record of noopWindow) {
      const agent = record.agent || "homer";
      if (agents[agent]) agents[agent].noopCount += 1;
    }
    for (const record of writeFileWindow) {
      const agent = record.agent || "homer";
      if (agents[agent]) agents[agent].writeFileCount += 1;
    }
    for (const record of commandWindow) {
      const agent = record.agent || "homer";
      if (agents[agent]) agents[agent].commandCount += 1;
    }
    for (const record of patchWindow) {
      const agent = record.agent || "homer";
      if (agents[agent]) agents[agent].patchCount += 1;
    }
    for (const record of maxRetryWindow) {
      const agent = record.agent || "homer";
      if (agents[agent]) agents[agent].maxRetryCount += 1;
    }
    for (const record of failureWindow) {
      const agent = record.agent || "homer";
      if (agents[agent]) agents[agent].failureCount += 1;
    }

    for (const agent of Object.keys(agents)) {
      const last = agents[agent].lastHeartbeat ? Date.parse(agents[agent].lastHeartbeat) : 0;
      if (!last) {
        agents[agent].status = "offline";
        continue;
      }
      const ageS = (nowMs - last) / 1000;
      if (ageS <= HEARTBEAT_STALE_THRESHOLD_S) agents[agent].status = "online";
      else if (ageS <= HEARTBEAT_OFFLINE_THRESHOLD_S) agents[agent].status = "stale";
      else agents[agent].status = "offline";
    }

    const recentEvents = [
      ...heartbeatWindow,
      ...taskStartWindow,
      ...noopWindow,
      ...writeFileWindow,
      ...commandWindow,
      ...patchWindow,
      ...maxRetryWindow,
      ...failureWindow
    ]
      .filter((record) => record.timestamp)
      .sort((a, b) => Date.parse(b.timestamp as string) - Date.parse(a.timestamp as string))
      .slice(0, RECENT_EVENTS_LIMIT)
      .map((record) => ({
        id: record.id ?? null,
        type: record.type ?? null,
        eventType: record.eventType ?? null,
        taskId: record.taskId ?? null,
        agent: record.agent ?? null,
        timestamp: record.timestamp ?? null,
        message: record.message ?? null,
        error: record.error ?? null,
        details: record.details ?? {}
      }));

    return NextResponse.json({
      success: true,
      windowMinutes,
      generatedAt: new Date(nowMs).toISOString(),
      agents,
      totals: {
        heartbeatCount: heartbeatWindow.length,
        taskStarts: taskStartWindow.length,
        successLikeEvents: noopWindow.length + writeFileWindow.length + commandWindow.length + patchWindow.length,
        maxRetryCount: maxRetryWindow.length,
        failureCount: failureWindow.length
      },
      recentEvents
    });
  } catch (err: any) {
    const message = err?.message || "Unknown error";
    const status = message.startsWith("Invalid windowMinutes") ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
