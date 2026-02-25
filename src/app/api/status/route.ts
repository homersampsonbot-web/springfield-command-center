export async function GET() {
  const checks = await Promise.allSettled([
    fetch(`http://${process.env.HOMER_IP}:3001/health`),
    fetch(`http://${process.env.BART_IP}:3001/health`)
  ]);

  const [homer, bart] = checks.map((c, i) => ({
    agent: i === 0 ? 'homer' : 'bart',
    status: c.status === 'fulfilled' ? 'alive' : 'unreachable'
  }));

  return Response.json({
    homer,
    bart,
    timestamp: new Date().toISOString()
  });
}
