export async function GET() {
  return Response.json({
    status: 'alive',
    agents: {
      homer: { ip: '3.131.96.117', port: 3001 },
      bart: { ip: process.env.BART_IP, port: 3001 }
    },
    zilliz: process.env.ZILLIZ_URI ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  });
}
