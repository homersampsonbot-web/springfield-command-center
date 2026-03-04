export type MaggieJob = {
  title: string;
  description?: string;
  owner?: "homer" | "bart" | "lisa" | "marge" | "maggie" | "sms";
  priority?: "low" | "medium" | "high";
  status?: "QUEUED" | "IN_PROGRESS" | "BLOCKED" | "QA" | "DONE";
  tags?: string[];
  dependsOnTitles?: string[];
  requiresApproval?: boolean;
};

export type MaggiePlan = {
  summary: string;
  jobs: MaggieJob[];
};

export function buildPrompt(directiveText: string) {
  return `
You are Maggie, a task-orchestration agent. 
Convert the directive into a structured plan and job list. 
Return STRICT JSON ONLY with this shape:

{
  "summary": "string",
  "jobs": [
    {
      "title": "string (short, unique)",
      "description": "string (optional)",
      "owner": "homer|bart|lisa|marge|maggie|sms (optional)",
      "priority": "low|medium|high (optional)",
      "status": "QUEUED|IN_PROGRESS|BLOCKED|QA|DONE (optional; default QUEUED)",
      "tags": ["string"] (optional),
      "dependsOnTitles": ["string"] (optional),
      "requiresApproval": boolean (optional)
    }
  ]
}

Rules:
- Default status = "QUEUED"
- Prefer owner "homer" for backend/code, "bart" for Windows/GUI/browser, "lisa" for review/spec, "marge" for decisions, "sms" for approvals.
- Mark requiresApproval=true for any secrets, DNS/tunnel, firewall, production deploy, billing, or destructive actions.
- Use dependsOnTitles only when needed; reference titles exactly.

Directive: ${JSON.stringify(directiveText)}
`.trim();
}

export function safeParsePlan(jsonText: string): MaggiePlan {
  let obj: any;
  try {
    obj = JSON.parse(jsonText);
  } catch {
    throw new Error("Invalid JSON from Gemini");
  }

  if (!obj || typeof obj.summary !== "string" || !Array.isArray(obj.jobs)) {
    throw new Error("Bad plan shape");
  }

  obj.jobs.forEach((j: any, i: number) => {
    if (!j?.title || typeof j.title !== "string") {
      throw new Error(`Job[${i}] missing title`);
    }
  });

  return obj as MaggiePlan;
}
