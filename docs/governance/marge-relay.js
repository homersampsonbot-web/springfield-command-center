const express = require('express');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const PORT = 3012;
const MAX_BUFFER = 10 * 1024 * 1024;
const AGENTS_DIR = '/home/ubuntu/springfield-gateway/agents';

const systemPrompt = fs.existsSync(path.join(AGENTS_DIR, 'marge-system-prompt.txt'))
  ? fs.readFileSync(path.join(AGENTS_DIR, 'marge-system-prompt.txt'), 'utf8').trim() : '';
const archMemory = fs.existsSync(path.join(AGENTS_DIR, 'marge-architecture-memory.txt'))
  ? fs.readFileSync(path.join(AGENTS_DIR, 'marge-architecture-memory.txt'), 'utf8').trim() : '';
const governance = fs.existsSync(path.join(AGENTS_DIR, 'GOVERNANCE.md'))
  ? fs.readFileSync(path.join(AGENTS_DIR, 'GOVERNANCE.md'), 'utf8').trim() : '';

console.log('System prompt:', systemPrompt.length, 'chars');
console.log('Arch memory:', archMemory.length, 'chars');
console.log('Governance:', governance.length, 'chars');

app.get('/health', (req, res) => {
  res.json({
    status: 'alive',
    agent: 'marge',
    model: 'claude-pro-cli',
    systemPromptLoaded: systemPrompt.length > 0,
    archMemoryLoaded: archMemory.length > 0
  });
});

app.post('/relay', async (req, res) => {
  const { message, system } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const parts = [];
    if (systemPrompt) parts.push(systemPrompt);
    if (archMemory) parts.push('--- ARCHITECTURE MEMORY ---\n' + archMemory);
    if (governance) parts.push('--- GOVERNANCE & SPRINT STATE ---\n' + governance);
    if (system) parts.push('--- ADDITIONAL CONTEXT ---\n' + system);
    parts.push('--- MESSAGE ---\n' + message);
    const fullPrompt = parts.join('\n\n');

    // Use spawnSync with stdin to avoid all shell escaping issues
    const result = spawnSync('claude', ['-p', '--output-format', 'json'], {
      input: fullPrompt,
      maxBuffer: MAX_BUFFER,
      timeout: 120000,
      encoding: 'utf8',
      env: { ...process.env }
    });

    if (result.error) throw result.error;
    if (result.status !== 0) {
      const errMsg = result.stderr || 'claude exited with code ' + result.status;
      console.error('Claude error:', errMsg.substring(0, 300));
      return res.status(500).json({ error: errMsg.substring(0, 300) });
    }

    const raw = result.stdout.trim();
    let response;
    try {
      const parsed = JSON.parse(raw);
      response = parsed.result || parsed.content || raw;
    } catch {
      response = raw;
    }

    res.json({ response, agent: 'marge', model: 'claude-pro-cli', status: 'ok' });

  } catch (e) {
    const errMsg = e.message || 'unknown error';
    console.error('Relay error:', errMsg.substring(0, 300));
    res.status(500).json({ error: errMsg.substring(0, 300) });
  }
});

app.listen(PORT, () => console.log(`Marge relay running on port ${PORT}`));
