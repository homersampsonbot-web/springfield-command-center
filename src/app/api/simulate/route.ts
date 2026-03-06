import { NextResponse } from "next/server";
import { simulateDirective } from "@/lib/maggieProvider";
import { recordEvent } from "@/lib/maggie/recordEvent";
import { requireAppAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const body = await req.json().catch(() => ({}));
    const { text, title, contextFlags, attachments } = body || {};

    if (!text) {
      return NextResponse.json({ mode: "simulate", error: "Missing text" }, { status: 400 });
    }

    await recordEvent({
      scope: 'DIRECTIVE',
      type: 'SIMULATION_STARTED',
      message: `Maggie started simulation for ${title || text.slice(0, 50)}...`
    });

    // NOTE: contextFlags + attachments reserved for future; no side effects.
    const simulation = await simulateDirective(text);

    await recordEvent({
      scope: 'DIRECTIVE',
      type: 'SIMULATION_COMPLETED',
      message: `Maggie completed simulation with ${simulation.projects?.length || 0} projects and ${simulation.proposedJobs?.length || 0} proposed jobs`
    });

    return NextResponse.json({
      mode: "simulate",
      ...simulation
    });

  } catch (e: any) {
    console.error("[SIMULATE ERROR]", e);
    
    await recordEvent({
      scope: 'DIRECTIVE',
      type: 'SIMULATION_FAILED',
      message: `Maggie simulation failed: ${e.message}`
    });

    return NextResponse.json({ 
      mode: "simulate",
      error: "Simulation failed",
      message: "Simulation failed. Please retry." 
    }, { status: 500 });
  }
}
