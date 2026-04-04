import { NextResponse } from "next/server";
import { requireAppAuth } from "@/lib/auth";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    await requireAppAuth(req);
    const { system, messages } = await req.json();

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages
      }),
      signal: AbortSignal.timeout(55000)
    });

    const data = await res.json();
    const response = data.content?.[0]?.text || "No response";
    return NextResponse.json({ response });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
