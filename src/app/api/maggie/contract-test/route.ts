import { NextResponse } from "next/server";
import { parseDirectiveToJobs } from "@/lib/maggieProvider";
import { requireAppAuth } from "@/lib/auth";

export async function POST(req: Request) {
  await requireAppAuth(req);
  const { text } = await req.json().catch(() => ({ text: "Homer verify Maggie contract parsing and generate 3 jobs" }));
  
  const providers = ["gemini", "local"];
  const results = [];

  for (const provider of providers) {
    const start = Date.now();
    try {
      const result = await parseDirectiveToJobs(text, { provider });
      const ms = Date.now() - start;
      
      // Validate contract
      const contractOk = result.jobs.length > 0 && result.jobs.every(j => j.title && j.owner && j.status);

      results.push({
        provider,
        ok: true,
        ms,
        contractOk,
        sampleJobs: result.jobs
      });
    } catch (e: any) {
      results.push({
        provider,
        ok: false,
        ms: Date.now() - start,
        error: e.message
      });
    }
  }

  return NextResponse.json({ ok: true, providers: results });
}
