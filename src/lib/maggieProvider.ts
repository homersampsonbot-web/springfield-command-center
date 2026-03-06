import { geminiJSON } from "./maggie/gemini";
import { buildPrompt, buildSimulationPrompt, safeParsePlan, safeParseSimulation, MaggieJob } from "./maggie/parser";

export type NormalizedJob = {
  title: string;
  owner: "HOMER" | "BART" | "LISA" | "MARGE" | "MAGGIE" | "SMS";
  status: "QUEUED" | "IN_PROGRESS" | "BLOCKED" | "QA" | "DONE";
  priority: "LOW" | "MED" | "HIGH";
  dependsOn: string[];
  notes?: string;
  requiresApproval?: boolean;
  tags?: string[];
};

export type ParseResult = {
  summary: string;
  jobs: NormalizedJob[];
  meta?: any;
};

export async function parseDirectiveToJobs(
  text: string, 
  opts?: { provider?: string }
): Promise<ParseResult> {
  const provider = opts?.provider || process.env.MAGGIE_PROVIDER || "gemini";
  
  if (provider === "local") {
    const localUrl = process.env.MAGGIE_LOCAL_URL || "http://maggie.local:8080";
    const r = await fetch(`${localUrl}/v1/parse-directive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) throw new Error(`Local provider error: ${r.status}`);
    const data = await r.json();
    return normalize(data);
  }

  // Gemini (default)
  const prompt = buildPrompt(text);
  const out = await geminiJSON(prompt);
  const plan = safeParsePlan(out.text);
  
  return {
    summary: plan.summary,
    jobs: plan.jobs.map(j => ({
      title: j.title,
      owner: (j.owner?.toUpperCase() || "MAGGIE") as any,
      status: (j.status?.toUpperCase() || "QUEUED") as any,
      priority: (j.priority?.toUpperCase() === "HIGH" ? "HIGH" : j.priority?.toUpperCase() === "MEDIUM" || j.priority?.toUpperCase() === "MED" ? "MED" : "LOW") as any,
      dependsOn: j.dependsOnTitles || [],
      notes: j.description,
      requiresApproval: j.requiresApproval,
      tags: j.tags
    })),
    meta: { model: process.env.MAGGIE_MODEL || "gemini-1.5-flash" }
  };
}

export async function simulateDirective(
  text: string,
  opts?: { provider?: string }
) {
  const prompt = buildSimulationPrompt(text);
  const out = await geminiJSON(prompt);
  return safeParseSimulation(out.text);
}

function normalize(data: any): ParseResult {
  // Add normalization logic for local provider if needed
  return {
    summary: data.summary || "Parsed from local provider",
    jobs: (data.jobs || []).map((j: any) => ({
      title: j.title,
      owner: (j.owner?.toUpperCase() || "MAGGIE") as any,
      status: (j.status?.toUpperCase() || "QUEUED") as any,
      priority: (j.priority === 3 || j.priority === "HIGH" ? "HIGH" : j.priority === 2 || j.priority === "MED" ? "MED" : "LOW") as any,
      dependsOn: j.dependsOn || j.dependsOnTitles || [],
      notes: j.notes || j.description,
      requiresApproval: j.requiresApproval,
      tags: j.tags
    })),
    meta: data.meta || {}
  };
}
