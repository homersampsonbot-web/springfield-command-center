export async function POST(req: Request) {
  const body = await req.json();
  const { directive } = body;
  if (!directive) return Response.json({ error: 'directive required' }, { status: 400 });

  const task = {
    from: 'mayor_quimby',
    priority: 'high',
    task: directive,
    taskId: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };

  try {
    const res = await fetch(`http://${process.env.HOMER_IP}:3001/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-springfield-key': process.env.SPRINGFIELD_KEY || ''
      },
      body: JSON.stringify(task)
    });
    const result = await res.json();
    return Response.json({
      status: 'dispatched',
      taskId: task.taskId,
      homer: result
    });
  } catch (e) {
    return Response.json({
      status: 'homer_unreachable',
      taskId: task.taskId
    }, { status: 502 });
  }
}
