import { NextResponse } from "next/server";

// Disabled — replaced by maggie-watchdog PM2 process on Homer EC2
export async function POST() {
  return NextResponse.json({ ok: true, disabled: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, disabled: true });
}
