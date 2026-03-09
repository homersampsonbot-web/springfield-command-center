import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

export async function GET() {
  const execAsync = promisify(exec);
  try {
    const { stdout } = await execAsync('pm2 describe bart-browser --no-color');
    const isOnline = /status\s*:\s*online/i.test(stdout);
    if (isOnline) {
      return NextResponse.json({ agent: 'bart', status: 'online', runtime: 'homer', service: 'bart-browser' });
    }
    return NextResponse.json({ agent: 'bart', status: 'offline' });
  } catch (e: any) {
    return NextResponse.json({ agent: 'bart', status: 'offline', error: e?.message }, { status: 200 });
  }
}
