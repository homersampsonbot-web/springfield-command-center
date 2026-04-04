const express = require('express');

async function callGemini(prompt) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text();
}


const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

function extractFirstJsonObject(text){
    if(!text) throw new Error("Empty model response");
    const cleaned = text.replace(/`json|`/g,"").trim();
    try {
        return JSON.parse(cleaned);
    } catch(e){}
    const start = cleaned.indexOf("{");
    if(start < 0) throw new Error("No JSON start found");
    let depth = 0;
    for(let i=start;i<cleaned.length;i++){
        const ch = cleaned[i];
        if(ch==="{") depth++;
        if(ch==="}") depth--;
        if(depth===0){
            const cand = cleaned.slice(start,i+1);
            return JSON.parse(cand);
        }
    }
    throw new Error("No complete JSON object found");
}

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://commander.margebot.com');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-springfield-key');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
const PORT = 3001;
const AUTH_KEY = 'c4c75fe2065fb96842e3690a3a6397fb';
const LOG_FILE = '/var/log/springfield/tasks.log';

app.use(express.json());

async function reportResult(taskId, result, status) {
  try {
    await fetch('https://springfield-command-center.vercel.app/api/results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-springfield-key': AUTH_KEY
      },
      body: JSON.stringify({
        taskId,
        result,
        status,
        agent: 'homer',
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) {
    console.error('Result report failed:', e);
  }
}

const authenticate = (req, res, next) => {
    const key = req.headers['x-springfield-key'];
    if (key === AUTH_KEY) {
        next();
    } else {
        res.status(401).json({ status: 'unauthorized' });
    }
};


// Session expiry detection
function isSessionExpired(response, agent) {
  if (!response) return true;
  const r = response.toLowerCase();
  const expiredSignals = ['sign in', 'log in', 'login', 'session expired', 
    'just a moment', 'checking your browser', 'cloudflare', 
    'unauthorized', 'access denied', 'please log in'];
  return expiredSignals.some(s => r.includes(s));
}

async function notifySessionExpired(agent) {
  const { default: fetch } = await import('node-fetch');
  const msg = encodeURIComponent('⚠️ Springfield Alert: ' + agent + ' relay session expired! Please refresh the browser session on Bart.');
  await fetch('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage?chat_id=7029605637&text=' + msg).catch(()=>{});
  console.log('[SESSION] ' + agent + ' session expired - Telegram alert sent');
}

app.post('/think', authenticate, async (req, res) => {
  const { task } = req.body;
  try {
    const { default: fetch } = await import('node-fetch');
    const repoPath = process.env.HOME + '/springfield-command-center';
    const fullContent = fs.readFileSync(repoPath + '/src/app/page.tsx', 'utf8');
    const keywords = task.toLowerCase().split(' ').filter(w => w.length > 3);
    let bestIdx = 0;
    for (const kw of keywords) {
      const i = fullContent.toLowerCase().indexOf(kw);
      if (i > 0) { bestIdx = Math.max(0, i - 200); break; }
    }
    const pageContent = fullContent.slice(bestIdx, bestIdx + 3000);
    const prompt = 'RESPOND WITH ONLY RAW JSON. NO MARKDOWN. NO BACKTICKS. NO EXTRA TEXT.\nTask: ' + task + '\nFile section:\n' + pageContent + '\nReturn ONLY: {"file":"src/app/page.tsx","find":"exact string","replace":"new string","explanation":"x"}';
    let response, source;
    try {
      const r = await fetch('http://127.0.0.1:3012/relay', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:prompt}), signal:AbortSignal.timeout(60000) });
      const d = await r.json();
      response = d.response; source = 'marge';
      if (isSessionExpired(response, 'Marge')) {
        await notifySessionExpired('Marge');
        throw new Error('Marge session expired');
      }
    } catch(e) {
      try {
        const r = await fetch('http://127.0.0.1:3013/relay', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({message:prompt}), signal:AbortSignal.timeout(60000) });
        const d = await r.json();
        response = d.response; source = 'lisa';
      if (isSessionExpired(response, 'Lisa')) {
        await notifySessionExpired('Lisa');
        throw new Error('Lisa session expired - falling back to Gemini');
      }
      } catch(e2) { throw new Error('Both relays failed'); }
    }
    const fMatch = response.match(/"find"s*:s*"((?:[^"\\]|\\.)*)"/);
    const rMatch = response.match(/"replace"s*:s*"((?:[^"\\]|\\.)*)"/);
    if (!fMatch || !rMatch) throw new Error('No JSON found in response: ' + response.slice(0,120));
    const findStr = fMatch[1].trim();
    const replStr = rMatch[1].trim();
    if (fullContent.includes(findStr)) return res.json({file:'src/app/page.tsx', find:findStr, replace:replStr, explanation:'ok', source});
    const lines = fullContent.split('\n');
    const match = lines.find(l => l.trim() === findStr || l.includes(findStr));
    if (match) return res.json({file:'src/app/page.tsx', find:match, replace:replStr, explanation:'ok', source});
    return res.status(400).json({error:'Find string not in file', find:findStr.slice(0,50), source});
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.get('/health', (req, res) => {
    res.json({ status: 'alive', agent: 'homer' });
});

app.post('/task', authenticate, (req, res) => {
    const taskId = uuidv4();
    const taskData = {
        taskId,
        receivedAt: new Date().toISOString(),
        payload: req.body
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(taskData) + '\n');
    reportResult(taskId, "Task received and logged", "received");
    res.json({ status: 'received', taskId });
});

app.post('/report', authenticate, (req, res) => {
    res.json({ status: 'reported' });
});

app.post('/chat', authenticate, (req, res) => {
    const { message } = req.body;
    const name = process.env.AGENT_NAME || 'homer';
    res.json({ reply: `${name} here. Got your message: "${message}". Standing by.`, agent: name });
});

const MARGE_BOT_TOKEN = process.env.MARGE_BOT_TOKEN;
app.post('/telegram-marge', async (req, res) => {
    const msg = req.body?.message;
    if (!msg) return res.sendStatus(200);
    const chatId = msg.chat.id;
    const text = msg.text || '';
    try {
            const directive = text.trim();
            if (!directive) return res.sendStatus(200);
            const result = await fetch('http://localhost:3001/task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                headers: { 'Content-Type': 'application/json', 'x-springfield-key': 'c4c75fe2065fb96842e3690a3a6397fb' },
                body: JSON.stringify({ directive })
            });
            const data = await result.json();
            const reply = `🎩 *Directive received*\nTask ID: ${data.taskId?.slice(0, 8)}\nStatus: ${data.status}`;
            await fetch(`https://api.telegram.org/bot${MARGE_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: reply, parse_mode: 'Markdown' })
            });
    } catch (e) {}
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Springfield Gateway listening on port ${PORT}`);
});

// Relay proxy routes — forwards Vercel requests to local relay services
app.post('/api/marge-relay', authenticate, async (req, res) => {
  try {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch('http://127.0.0.1:3012/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(90000)
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message, relay: 'marge' });
  }
});

app.post('/api/lisa-relay', authenticate, async (req, res) => {
  try {
    const { default: fetch } = await import('node-fetch');
    const r = await fetch('http://127.0.0.1:3013/relay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: AbortSignal.timeout(90000)
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message, relay: 'lisa' });
  }
});

// External exec route — authenticated shell execution for Dispatch Console
app.post('/api/exec', authenticate, async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });

  // Command allowlist — same rules as executor
  const BLOCKED = [
    'rm -rf', 'dd if', '> ~/.openclaw', 'curl | bash',
    'wget | bash', 'mkfs', 'shutdown', 'reboot', 'passwd'
  ];
  if (BLOCKED.some(b => command.includes(b))) {
    return res.status(403).json({ error: 'Blocked command pattern' });
  }

  try {
    const { execSync } = require('child_process');
    const output = execSync(command, {
      maxBuffer: 10 * 1024 * 1024,
      timeout: 60000,
      cwd: '/home/ubuntu',
      env: { ...process.env }
    }).toString().trim();
    res.json({ output, command, status: 'ok' });
  } catch (e) {
    res.json({
      output: e.stdout?.toString() || e.message,
      stderr: e.stderr?.toString(),
      command,
      status: 'error'
    });
  }
});

// Dispatch Claude brain — runs claude CLI for the Dispatch console
app.post('/api/dispatch', authenticate, async (req, res) => {
  const { system, messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'messages required' });

  try {
    const { spawnSync } = require('child_process');
    // Only use last 2 messages to avoid context overflow from large log outputs
    const recentMessages = messages.slice(-2);
    const lastMessage = recentMessages[recentMessages.length - 1]?.content || '';
    const fs2 = require('fs');
    const springfieldContext = `--- SPRINGFIELD HOME LAB CONTEXT ---
This is a personal home lab system owned by SMS. Key facts:
- The main repo is at ~/.openclaw/workspace/springfield-command-center (Next.js/TypeScript)
- Springfield gateway runs on port 3001 with auth header x-springfield-key
- Phase 5 test: POST to http://localhost:3001/thread/send with body {"thread":"team","message":"@maggie success test route latest approved brief to @homer","sender":"SMS"} and verify SUCCESS status in response
- PM2 manages: springfield-executor, springfield-gateway:3001, springfield-relay-worker, neon-bridge, marge-relay:3012, lisa-relay:3013, codex-proxy:10531, ssh-ttyd:3002
- Marge relay at port 3012, Lisa relay at port 3013
- Git branch is master only, never main
- Neon PostgreSQL is primary DB via Prisma
- Safe restore point: git tag phase4-governed-execution
\n\n`;
    // Truncate very long messages
    const truncated = lastMessage.length > 6000
      ? lastMessage.slice(0, 6000) + '\n\n[TRUNCATED]'
      : lastMessage;
    const fullPrompt = system ? `${springfieldContext}${system}\n\n${truncated}` : `${springfieldContext}${truncated}`;

    const result = spawnSync('claude', ['-p', '--output-format', 'json'], {
      input: fullPrompt,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 55000,
      encoding: 'utf8',
      env: { ...process.env }
    });

    if (result.error) throw result.error;
    const raw = result.stdout.trim();
    let response;
    try {
      const parsed = JSON.parse(raw);
      response = parsed.result || parsed.content || raw;
    } catch { response = raw; }

    res.json({ response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
