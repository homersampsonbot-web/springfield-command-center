const express = require('express');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = 3013;
const AGENTS_DIR = '/home/ubuntu/springfield-gateway/agents';

// Load Lisa's soul at startup
const lisaSoul = fs.existsSync(path.join(AGENTS_DIR, 'lisa-soul.md'))
  ? fs.readFileSync(path.join(AGENTS_DIR, 'lisa-soul.md'), 'utf8').trim()
  : '';

console.log('Lisa soul loaded:', lisaSoul.length, 'chars');

// Point OpenAI SDK at local codex-proxy
const client = new OpenAI({
  apiKey: 'not-needed',
  baseURL: 'http://127.0.0.1:10531/v1'
});

app.get('/health', (req, res) => {
  res.json({
    status: 'alive',
    agent: 'lisa',
    model: 'gpt-5.4',
    proxy: 'codex-oauth',
    soulLoaded: lisaSoul.length > 0
  });
});

app.post('/relay', async (req, res) => {
  const { message, system } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    // Build system prompt from lisa soul + caller system
    const systemParts = [];
    if (lisaSoul) systemParts.push(lisaSoul);
    if (system) systemParts.push(system);
    const fullSystem = systemParts.join('\n\n');

    const response = await client.chat.completions.create({
      model: 'gpt-5.4',
      max_tokens: 4096,
      messages: [
        ...(fullSystem ? [{ role: 'system', content: fullSystem }] : []),
        { role: 'user', content: message }
      ]
    });

    res.json({
      response: response.choices[0].message.content,
      agent: 'lisa',
      model: 'gpt-5.4',
      status: 'ok'
    });

  } catch (e) {
    // If proxy is down, report clearly
    if (e.message.includes('ECONNREFUSED') || e.message.includes('10531')) {
      return res.status(503).json({
        error: 'codex-proxy not running — start with: pm2 start codex-proxy',
        detail: e.message
      });
    }
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`Lisa relay running on port ${PORT} (gpt-5.4 via codex-oauth proxy)`));
