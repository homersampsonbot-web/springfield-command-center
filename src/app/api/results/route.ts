import { NextResponse } from 'next/server';

let results: any[] = [];

export async function POST(req: Request) {
  const body = await req.json();
  results.unshift({ ...body, receivedAt: new Date().toISOString() });
  if (results.length > 100) results.pop();
  return NextResponse.json({ status: 'logged' });
}

export async function GET() {
  return NextResponse.json({ results: results.slice(0, 20) });
}
