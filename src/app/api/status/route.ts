import { NextResponse } from 'next/server';

const timeout = (ms: number) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));

async function pingRelay(url: string) {
  if (url === 'disabled') return 'maintenance';
  try {
    const res = await Promise.race([
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'ping' }) }),
      timeout(3000)
    ]) as Response;
    const data = await res.json();
    return data?.response === 'pong' ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}

async function pingJson(url: string) {
  try {
    const res = await Promise.race([fetch(url, { method: 'GET' }), timeout(3000)]) as Response;
    if (!res.ok) return 'offline';
    return 'online';
  } catch {
    return 'offline';
  }
}

async function pingZilliz() {
  try {
    const res = await Promise.race([
      fetch('https://controller.api.gcp-us-west2.zillizcloud.com/v1/clusters', { method: 'GET' }),
      timeout(3000)
    ]) as Response;
    if (res.status === 401 || res.status === 403) return 'online';
    return res.ok ? 'online' : 'offline';
  } catch {
    return 'online';
  }
}

export async function GET() {
  const margeRelayUrl = process.env.MARGE_RELAY_URL || 'disabled';
  const lisaRelayUrl = process.env.LISA_RELAY_URL || 'disabled';
  const margeHealthUrl = margeRelayUrl === 'disabled' ? 'disabled' : margeRelayUrl.replace(/\/relay$/, '/health');

  const [homer, marge, lisa, bart, zilliz] = await Promise.all([
    pingJson('http://3.131.96.117:3001/health'),
    pingRelay(margeRelayUrl),
    pingRelay(lisaRelayUrl),
    margeHealthUrl === 'disabled' ? Promise.resolve('maintenance') : pingJson(margeHealthUrl),
    pingZilliz()
  ]);

  return NextResponse.json({ homer, marge, lisa, bart, zilliz });
}
