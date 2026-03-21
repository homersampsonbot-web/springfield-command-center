import Link from "next/link";
import {
  DEFAULT_WINDOW_MINUTES
} from "@/lib/reliability/constants";

type AgentMetrics = {
  lastHeartbeat: string | null;
  heartbeatCount: number;
  taskStarts: number;
  noopCount: number;
  writeFileCount: number;
  commandCount: number;
  patchCount: number;
  maxRetryCount: number;
  failureCount: number;
  status: string;
};

type ReliabilityEvent = {
  id: string | null;
  type: string | null;
  eventType: string | null;
  taskId: string | null;
  agent: string | null;
  timestamp: string | null;
  message?: string | null;
  error?: string | null;
  details?: Record<string, unknown>;
};

type ReliabilityData = {
  success: boolean;
  windowMinutes: number;
  generatedAt: string;
  agents: Record<string, AgentMetrics>;
  totals: {
    heartbeatCount: number;
    taskStarts: number;
    successLikeEvents: number;
    maxRetryCount: number;
    failureCount: number;
  };
  recentEvents: ReliabilityEvent[];
};

function badgeClassForStatus(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "online":
      return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
    case "stale":
      return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
    case "offline":
    default:
      return "bg-red-500/15 text-red-300 ring-1 ring-red-500/30";
  }
}

function badgeClassForEvent(eventType: string | null | undefined, details?: Record<string, unknown>) {
  const value = (eventType || "").toLowerCase();
  const synthetic = details?.synthetic === true;

  if (synthetic) {
    return "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/30";
  }
  if (value.includes("failure") || value.includes("retry")) {
    return "bg-red-500/15 text-red-300 ring-1 ring-red-500/30";
  }
  if (value.includes("heartbeat")) {
    return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30";
  }
  if (value.includes("patch") || value.includes("write") || value.includes("command")) {
    return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30";
  }
  if (value.includes("task")) {
    return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30";
  }

  return "bg-neutral-700 text-neutral-200 ring-1 ring-neutral-600";
}

function metricTone(value: number, kind: "good" | "bad" | "neutral" = "neutral") {
  if (kind === "good") {
    return value > 0 ? "text-emerald-300" : "text-neutral-200";
  }
  if (kind === "bad") {
    return value > 0 ? "text-red-300" : "text-neutral-200";
  }
  return "text-neutral-200";
}

async function getReliabilityData(includeSynthetic: boolean): Promise<ReliabilityData> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/reliability/board?windowMinutes=${DEFAULT_WINDOW_MINUTES}${includeSynthetic ? "&includeSynthetic=true" : ""}`;

  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "x-springfield-key": process.env.SPRINGFIELD_KEY || ""
    }
  });

  const json = await res.json();
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || "Failed to load Reliability Board");
  }

  return json;
}

function formatTs(ts: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
}

export default async function ReliabilityPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const includeSynthetic = params.includeSynthetic === "true";
  const data = await getReliabilityData(includeSynthetic);

  const toggleHref = includeSynthetic
    ? "/reliability"
    : "/reliability?includeSynthetic=true";

  const sortedAgents = Object.entries(data.agents).sort(([a], [b]) => a.localeCompare(b));

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">Reliability Board</h1>
            <p className="text-sm text-neutral-400">
              Live memory-backed operations view for Springfield agent reliability.
            </p>
            <p className="text-xs text-neutral-500">
              Window: last {data.windowMinutes} minutes · Generated: {formatTs(data.generatedAt)}
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 px-4 py-3">
            <div className="text-sm text-neutral-400">Synthetic failures</div>
            <Link
              href={toggleHref}
              className={`mt-2 inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition ${
                includeSynthetic
                  ? "bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/30 hover:bg-fuchsia-500/20"
                  : "bg-neutral-800 text-neutral-200 ring-1 ring-neutral-700 hover:bg-neutral-700"
              }`}
            >
              {includeSynthetic ? "Included — click to hide" : "Excluded — click to show"}
            </Link>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Heartbeats</div>
            <div className={`mt-2 text-3xl font-semibold ${metricTone(data.totals.heartbeatCount, "good")}`}>
              {data.totals.heartbeatCount}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Task Starts</div>
            <div className="mt-2 text-3xl font-semibold text-neutral-100">{data.totals.taskStarts}</div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Success-like Events</div>
            <div className={`mt-2 text-3xl font-semibold ${metricTone(data.totals.successLikeEvents, "good")}`}>
              {data.totals.successLikeEvents}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Max Retries</div>
            <div className={`mt-2 text-3xl font-semibold ${metricTone(data.totals.maxRetryCount, "bad")}`}>
              {data.totals.maxRetryCount}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Failures</div>
            <div className={`mt-2 text-3xl font-semibold ${metricTone(data.totals.failureCount, "bad")}`}>
              {data.totals.failureCount}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Agents</h2>
            <p className="text-sm text-neutral-400">Current heartbeat health and execution counters.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedAgents.map(([agent, metrics]) => (
              <div key={agent} className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold capitalize">{agent}</div>
                    <div className="mt-1 text-xs text-neutral-500">
                      Last heartbeat: {formatTs(metrics.lastHeartbeat)}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${badgeClassForStatus(metrics.status)}`}>
                    {metrics.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                    <div className="text-neutral-500">Heartbeats</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-300">{metrics.heartbeatCount}</div>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                    <div className="text-neutral-500">Task Starts</div>
                    <div className="mt-1 text-lg font-semibold">{metrics.taskStarts}</div>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                    <div className="text-neutral-500">Writes / Patches</div>
                    <div className="mt-1 text-lg font-semibold text-sky-300">
                      {metrics.writeFileCount + metrics.patchCount}
                    </div>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                    <div className="text-neutral-500">Commands</div>
                    <div className="mt-1 text-lg font-semibold text-sky-300">{metrics.commandCount}</div>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                    <div className="text-neutral-500">Noops</div>
                    <div className="mt-1 text-lg font-semibold text-amber-300">{metrics.noopCount}</div>
                  </div>
                  <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
                    <div className="text-neutral-500">Failures</div>
                    <div className="mt-1 text-lg font-semibold text-red-300">{metrics.failureCount}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Recent Events</h2>
            <p className="text-sm text-neutral-400">
              Latest memory-backed events{includeSynthetic ? " including synthetic failures" : " excluding synthetic failures"}.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Agent</th>
                  <th className="px-3 py-2">Event</th>
                  <th className="px-3 py-2">Task</th>
                  <th className="px-3 py-2">Details</th>
                </tr>
              </thead>
              <tbody>
                {data.recentEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-neutral-500">
                      No events found in the active window.
                    </td>
                  </tr>
                ) : (
                  data.recentEvents.map((event) => (
                    <tr key={event.id || `${event.agent}-${event.timestamp}`} className="bg-neutral-950/60">
                      <td className="rounded-l-xl px-3 py-3 text-neutral-300">{formatTs(event.timestamp)}</td>
                      <td className="px-3 py-3 capitalize">{event.agent || "—"}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClassForEvent(event.eventType, event.details)}`}>
                          {event.eventType || event.type || "unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-neutral-400">{event.taskId || "—"}</td>
                      <td className="rounded-r-xl px-3 py-3 text-neutral-300">
                        {event.error || event.message || (event.details?.synthetic === true ? "Synthetic failure" : "—")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
