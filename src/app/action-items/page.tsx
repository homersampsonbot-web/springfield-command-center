"use client";

import { useEffect, useState } from "react";

type ApprovalEntry = {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  status: string;
  createdAt: string;
};

type ArtifactEntry = {
  id: string;
  message: string;
  payload: {
    title: string;
    artifactType: string;
    proposingAgent: string;
    stageReference: string;
    status: string;
    content: string;
    recommendedAction?: string;
  };
  createdAt: string;
};

type SystemAlertEntry = {
  id: string;
  jobId: string;
  title: string;
  detail: string;
  level: string;
  createdAt?: string;
};

type HeartbeatEntry = {
  id: string;
  label: string;
  status: string;
  detail: string;
};

export default function ActionItemsPage() {
  const [approvals, setApprovals] = useState<ApprovalEntry[]>([]);
  const [artifacts, setArtifacts] = useState<ArtifactEntry[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlertEntry[]>([]);
  const [heartbeats, setHeartbeats] = useState<HeartbeatEntry[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const refreshAll = () => {
      fetch("/api/governance/approvals?status=PENDING", {
        headers: { "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb" },
      })
        .then((r) => r.json())
        .then((d) => {
          if (mounted && d.entries) setApprovals(d.entries);
        })
        .catch(() => {});

      fetch("/api/thread/artifact?status=PENDING_REVIEW", {
        headers: { "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb" },
      })
        .then((r) => r.json())
        .then((d) => {
          if (mounted && d.entries) setArtifacts(d.entries);
        })
        .catch(() => {});

      Promise.all([
        fetch("/api/jobs?limit=20", {
          headers: { "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb" },
        }).then((r) => r.json()).catch(() => ({ jobs: [] })),
        fetch("/api/system-health", {
          headers: { "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb" },
        }).then((r) => r.json()).catch(() => ({})),
      ]).then(([jobsData, healthData]) => {
        if (!mounted) return;

        const alerts: SystemAlertEntry[] = [];

        const jobs = Array.isArray(jobsData)
          ? jobsData
          : Array.isArray(jobsData?.jobs)
          ? jobsData.jobs
          : [];

        jobs
          .filter((job: any) => job.status === "FAILED")
          .slice(0, 10)
          .forEach((job: any) => {
            const errorText = String(job.lastError || job.status || "Job failure");
            const normalized = errorText.toLowerCase();
            alerts.push({
              id: job.id,
              jobId: job.id,
              title: errorText,
              detail: `${job.owner || "UNKNOWN"} · ${job.title || "UNTITLED"}`,
              level: normalized.includes("disabled") ? "WARN" : "ERROR",
              createdAt: job.updatedAt || job.createdAt,
            });
          });

        const systemHealth = healthData?.systemHealth || healthData;
        if (systemHealth?.status && String(systemHealth.status).toLowerCase() !== "healthy") {
          alerts.unshift({
            id: "system-health",
            jobId: "system-health",
            title: `SYSTEM HEALTH · ${String(systemHealth.status).toUpperCase()}`,
            detail: "System health endpoint reports non-healthy status.",
            level: "ERROR",
          });
        }

      fetch("/api/system-health", {
        headers: { "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb" },
      })
        .then((r) => r.json())
        .then((healthData) => {
          if (!mounted) return;

          const h = healthData?.systemHealth || healthData || {};
          const nextHeartbeats: HeartbeatEntry[] = [
            {
              id: "homer",
              label: "HOMER",
              status: String(h?.agents?.homer || "UNKNOWN").toUpperCase(),
              detail: "Execution / orchestration",
            },
            {
              id: "marge",
              label: "MARGE",
              status: String(h?.agents?.marge || h?.relays?.marge || "UNKNOWN").toUpperCase(),
              detail: `Relay: ${String(h?.relays?.marge || "unknown")} · Session: ${String(h?.sessions?.marge?.status || "unknown")}`,
            },
            {
              id: "lisa",
              label: "LISA",
              status: String(h?.agents?.lisa || h?.relays?.lisa || "UNKNOWN").toUpperCase(),
              detail: `Relay: ${String(h?.relays?.lisa || "unknown")} · Session: ${String(h?.sessions?.lisa?.status || "unknown")}`,
            },
            {
              id: "bart",
              label: "BART",
              status: String(h?.agents?.bart || h?.bartAgent?.status || "UNKNOWN").toUpperCase(),
              detail: "Browser relay / QA",
            },
          ];

          setHeartbeats(nextHeartbeats);
        })
        .catch(() => {});

        setSystemAlerts(alerts);
      });
    };

    refreshAll();
    const interval = setInterval(refreshAll, 15000);



return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  async function resolveApproval(id: string, action: "APPROVE" | "REJECT") {
    try {
      setBusyId(id);

      const res = await fetch(`/api/governance/approvals/${id}/action`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb",
        },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to resolve approval");
        return;
      }

      setApprovals((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert("Failed to resolve approval");
    } finally {
      setBusyId(null);
    }
  }

  const sections = [
    { title: "READY FOR TEST", description: "Changes that are ready for operator validation.", empty: "No test-ready items yet." },
    { title: "SYSTEM ALERTS", description: "Operational issues requiring attention.", empty: "No system alerts yet." },
    { title: "DELEGATION LIMITS", description: "Items blocked by delegation guardrails.", empty: "Delegation layer not active yet." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0B0F19", color: "#fff", padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ padding: 16, borderRadius: 16, border: "1px solid rgba(255,217,15,0.2)", background: "rgba(255,255,255,0.03)" }}>
          <div style={{ fontFamily: "Permanent Marker", fontSize: 24, color: "#FFD90F", marginBottom: 6 }}>ACTION ITEMS</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}>
            Operator interaction hub. APPROVALS is live. REVIEW REQUESTED now surfaces pending artifacts.
          </div>
        </div>

        {heartbeats.length > 0 && (
          <div style={{
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(0,255,140,0.2)",
            background: "rgba(0,255,140,0.05)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            <div style={{ fontFamily: "Permanent Marker", fontSize: 18, color: "#7CFFB2" }}>
              AGENT HEARTBEAT
            </div>
            {heartbeats.map((h) => (
              <div
                key={h.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.18)",
                  border: "1px solid rgba(0,255,140,0.12)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{h.label}</span>
                  <span style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>{h.detail}</span>
                </div>
                <span style={{ color: "#7CFFB2", fontWeight: 700 }}>{h.status}</span>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(255,217,15,0.15)",
            background: "rgba(255,255,255,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontFamily: "Permanent Marker", fontSize: 18, color: "#FFD90F" }}>APPROVALS</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}>
            Pending approval requests that require SMS action.
          </div>

          {approvals.length > 0 ? (
            approvals.map((item) => (
              <div
                key={item.id}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,217,15,0.2)",
                  padding: 14,
                  background: "rgba(0,0,0,0.18)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ fontFamily: "Permanent Marker", fontSize: 16, color: "#FFD90F" }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)" }}>{item.description}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Requested by: {item.requestedBy} · Status: {item.status} · {new Date(item.createdAt).toLocaleString()}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => resolveApproval(item.id, "APPROVE")}
                    disabled={busyId === item.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,255,140,0.25)",
                      background: "rgba(0,255,140,0.08)",
                      color: "#7CFFB2",
                      cursor: "pointer",
                      opacity: busyId === item.id ? 0.6 : 1,
                    }}
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => resolveApproval(item.id, "REJECT")}
                    disabled={busyId === item.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,90,90,0.25)",
                      background: "rgba(255,90,90,0.08)",
                      color: "#FF9A9A",
                      cursor: "pointer",
                      opacity: busyId === item.id ? 0.6 : 1,
                    }}
                  >
                    REJECT
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                borderRadius: 12,
                border: "1px dashed rgba(255,217,15,0.2)",
                padding: 14,
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                background: "rgba(0,0,0,0.15)",
              }}
            >
              No approval items yet.
            </div>
          )}
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 16,
            border: "1px solid rgba(255,217,15,0.15)",
            background: "rgba(255,255,255,0.03)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ fontFamily: "Permanent Marker", fontSize: 18, color: "#FFD90F" }}>REVIEW REQUESTED</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}>
            Artifacts and plans awaiting review.
          </div>

          {artifacts.length > 0 ? (
            artifacts.map((item) => (
              <div
                key={item.id}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,217,15,0.2)",
                  padding: 14,
                  background: "rgba(0,0,0,0.18)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ fontFamily: "Permanent Marker", fontSize: 16, color: "#FFD90F" }}>
                  {item.payload?.title || item.message}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Type: {item.payload?.artifactType} · Proposing Agent: {item.payload?.proposingAgent} · Stage: {item.payload?.stageReference}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)" }}>
                  {item.payload?.content}
                </div>
                {item.payload?.recommendedAction ? (
                  <div style={{ fontSize: 12, color: "#FFD90F" }}>
                    Recommended action: {item.payload.recommendedAction}
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <button
                    onClick={async () => {
                      await fetch(`/api/thread/artifact/${item.id}/action`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb",
                        },
                        body: JSON.stringify({ action: "APPROVE" }),
                      });
                      setArtifacts((prev) => prev.filter((a) => a.id !== item.id));
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(0,255,140,0.25)",
                      background: "rgba(0,255,140,0.08)",
                      color: "#7CFFB2",
                      cursor: "pointer",
                    }}
                  >
                    APPROVE
                  </button>

                  <button
                    onClick={async () => {
                      await fetch(`/api/thread/artifact/${item.id}/action`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb",
                        },
                        body: JSON.stringify({ action: "REJECT" }),
                      });
                      setArtifacts((prev) => prev.filter((a) => a.id !== item.id));
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,90,90,0.25)",
                      background: "rgba(255,90,90,0.08)",
                      color: "#FF9A9A",
                      cursor: "pointer",
                    }}
                  >
                    REJECT
                  </button>
                </div>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            <div
              style={{
                borderRadius: 12,
                border: "1px dashed rgba(255,217,15,0.2)",
                padding: 14,
                color: "rgba(255,255,255,0.6)",
                fontSize: 13,
                background: "rgba(0,0,0,0.15)",
              }}
            >
              No review items yet.
            </div>
          )}
        </div>

        {sections.map((section) => {
          if (section.title === "SYSTEM ALERTS") {
            return (
              <div
                key={section.title}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid rgba(255,217,15,0.15)",
                  background: "rgba(255,255,255,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ fontFamily: "Permanent Marker", fontSize: 18, color: "#FFD90F" }}>{section.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}>{section.description}</div>

                {systemAlerts.length > 0 ? (
                  systemAlerts.map((alert) => {
                    const accent =
                      alert.level === "ERROR"
                        ? "rgba(255,90,90,0.55)"
                        : alert.level === "WARN"
                        ? "rgba(255,170,60,0.55)"
                        : "rgba(255,217,15,0.35)";

                    return (
                      <div
                        key={alert.id}
                        style={{
                          borderRadius: 12,
                          border: "1px solid rgba(255,217,15,0.2)",
                          padding: 14,
                          background: "rgba(0,0,0,0.18)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                          boxShadow: `inset 4px 0 0 ${accent}`,
                        }}
                      >
                        <div style={{ fontFamily: "Permanent Marker", fontSize: 16, color: "#FFD90F" }}>
                          {alert.title}
                        </div>
                        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.82)" }}>
                          {alert.detail}
                        </div>
                        {alert.createdAt ? (
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                            {new Date(alert.createdAt).toLocaleString()}
                          </div>
                        ) : null}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                          <button
                            onClick={async () => {
  try {
    const res = await fetch(`/api/jobs/move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-springfield-key": "c4c75fe2065fb96842e3690a3a6397fb"
      },
      body: JSON.stringify({ jobId: alert.jobId, toStatus: "QUEUED" })
    });
    if (!res.ok) throw new Error("retry failed");
    window.alert("Retry requested");
    location.reload();
  } catch (e) {
    window.alert("Retry failed");
  }
}}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: "1px solid rgba(0,255,140,0.25)",
                              background: "rgba(0,255,140,0.08)",
                              color: "#7CFFB2",
                              cursor: "pointer",
                            }}
                          >
                            RETRY JOB
                          </button>
                          <button
                            onClick={() => {
  window.open(`/api/jobs/${alert.jobId}/events`, "_blank");
}}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: "1px solid rgba(120,170,255,0.25)",
                              background: "rgba(120,170,255,0.08)",
                              color: "#9FC0FF",
                              cursor: "pointer",
                            }}
                          >
                            VIEW TRACE
                          </button>
                          <button
                            onClick={async () => {
  try {
    const res = await fetch(`/api/directive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Escalated alert",
        description: alert.title,
        sourceJob: alert.jobId
      })
    });
    if (!res.ok) throw new Error("directive failed");
    window.alert("Escalation sent to Marge");
  } catch (e) {
    window.alert("Escalation failed");
  }
}}
                            style={{
                              padding: "8px 12px",
                              borderRadius: 10,
                              border: "1px solid rgba(255,170,60,0.25)",
                              background: "rgba(255,170,60,0.08)",
                              color: "#FFC37A",
                              cursor: "pointer",
                            }}
                          >
                            ESCALATE
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div
                    style={{
                      borderRadius: 12,
                      border: "1px dashed rgba(255,217,15,0.2)",
                      padding: 14,
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 13,
                      background: "rgba(0,0,0,0.15)",
                    }}
                  >
                    {section.empty}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={section.title}
              style={{
                padding: 16,
                borderRadius: 16,
                border: "1px solid rgba(255,217,15,0.15)",
                background: "rgba(255,255,255,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ fontFamily: "Permanent Marker", fontSize: 18, color: "#FFD90F" }}>{section.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.72)" }}>{section.description}</div>
              <div
                style={{
                  borderRadius: 12,
                  border: "1px dashed rgba(255,217,15,0.2)",
                  padding: 14,
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 13,
                  background: "rgba(0,0,0,0.15)",
                }}
              >
                {section.empty}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
