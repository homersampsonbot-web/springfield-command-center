export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true });
  const { directive } = req.body;
  
  try {
    const margeRes = await fetch('http://18.190.203.220:3003/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `You are Marge, Chief Architect. Assess this directive and respond in JSON only: { "complexity": "simple|complex", "action": "dispatch|debate", "reasoning": "brief reason", "task": "clear task for Homer" }. Directive: ${directive}`
      })
    });

    const margeData = await margeRes.json();
    let margeDecision;
    try {
      margeDecision = JSON.parse(margeData.response);
    } catch {
      margeDecision = {
        action: 'dispatch',
        task: directive,
        reasoning: margeData.response,
        complexity: 'simple'
      };
    }

    res.status(200).json({
      taskId: Math.random().toString(36).substring(7),
      status: 'dispatched',
      decision: margeDecision
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
