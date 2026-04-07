const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function create() {
  const job1 = await p.job.create({
    data: {
      title: 'Skinner Phase 1 — Infrastructure Monitor + Agent Fallback (Pre-Geoff)',
      description: `Build Skinner as Springfield's infrastructure watchdog and break-glass agent.
No Geoff dependency — implementable immediately.

## IDENTITY
- Name: Principal Skinner
- Role: Infrastructure Monitor + Break-Glass Agent
- Phase: 1 (Pre-Geoff)
- Model: Nemotron free or Gemini (lean model sufficient)
- Runs as: PM2 process on Homer EC2

## WHAT SKINNER MONITORS (every 2 minutes)
- All PM2 processes: springfield-executor, springfield-gateway, springfield-relay-worker,
  marge-relay, lisa-relay, flanders-relay, flanders-watchdog, neon-bridge, ssh-ttyd
- Relay health: HTTP health check on ports 3012, 3013, 3014
- Homer gateway: GET /health on localhost:3001
- Supabase Job table: jobs stuck in CLAIMED/IN_PROGRESS >30min

## TRIGGER CONDITIONS
- Any PM2 process in errored/stopped state
- Any relay returning non-200 for 3 consecutive checks
- Any job stuck in CLAIMED >30min
- Homer gateway unresponsive
- EC2 CPU >90% for >5min

## INTERVENTION PROTOCOL
1. Attempt automated fix:
   - PM2 process down → pm2 restart <name>
   - Relay unresponsive → pm2 restart <relay-name>
   - Stuck job → update status to FAILED, notify @lisa
2. Wait 60s, verify fix succeeded
3. Post to team thread: "[SKINNER INTERVENTION] <what failed> → <what was done> → <status>"
4. Write intervention record to Job table with labels: ["skinner", "intervention"]
5. If fix failed: mark as NEEDS_SMS, surface action item in Kanban

## AUTONOMY LEVEL (Phase 1)
- Can restart any PM2 process without approval
- Can mark stuck jobs as FAILED without approval
- Can NOT make architecture decisions
- Can NOT modify code or config files
- Escalates anything beyond process restart to SMS via action item

## AGENT FALLBACK (Phase 1 — limited, pre-Geoff)
- Homer unresponsive: Skinner executes simple shell commands via SSH
- Flanders unresponsive: Skinner posts team thread status update to SMS
- Lisa/Marge unresponsive: flags to SMS, does NOT substitute
- All fallback actions logged to Job table

## IMPLEMENTATION
- New PM2 process: skinner-watchdog
- Complementary to flanders-watchdog — Flanders watches task flow, Skinner watches infrastructure
- Uses same thread/send API as flanders-watchdog
- Requires Marge ruling before implementation`,
      status: 'QUEUED',
      owner: 'LISA',
      risk: 'LOW',
      requiresApproval: true,
      labels: ['skinner', 'infrastructure', 'watchdog', 'backlog']
    }
  });
  console.log('Job 1:', job1.id);

  const job2 = await p.job.create({
    data: {
      title: 'Skinner Phase 2 + Milhouse Media Agent — Full Geoff Integration (Post-Launch)',
      description: `Upgrade Skinner to full Geoff-powered autonomous agent + introduce Milhouse as dedicated media generation agent.
BLOCKED: awaiting Geoff API key from SMS.

## SKINNER PHASE 2 UPGRADES

### Full Agent Fallback (Geoff-powered)
When any agent fails, Skinner substitutes using Geoff:
- Marge offline → Skinner issues architectural rulings via Geoff (low-risk only, flags high-risk to SMS)
- Lisa offline → Skinner drafts proposals + implementation plans via Geoff
- Homer offline → Skinner executes tasks via Geoff mcp-tool + direct SSH
- Flanders offline → Skinner receives SMS directives directly, routes via Geoff
- Maggie offline → Skinner classifies and routes messages via Geoff

### Autonomous Intervention Protocol (Geoff-powered)
- Geoff reasons about failure context before intervening
- Skinner proposes healing plan surfaced as structured SMS action items in Kanban
- SMS approves or modifies plan — Skinner executes
- Full audit trail in Job table
- All substitutions reported to SMS regardless of outcome

### Skinner Autonomy Level (Phase 2)
- Can substitute for any agent on any task using Geoff
- Can make low-risk architecture calls without approval
- Must escalate HIGH/CRITICAL risk to SMS
- Never modifies governance documents without Marge ruling

## MILHOUSE — MEDIA GENERATION AGENT

### Identity
- Name: Milhouse Van Houten
- Role: Media Generation
- Model: Geoff media-orchestration task type exclusively
- Trigger: Job table entry with labels: ["media"]
- Runs as: dedicated PM2 process

### Capabilities (via Geoff StackNet)
- Music generation with lyrics
- Video generation
- Image generation including 3D models
- Audio generation
- All output stored as artifacts in Job table

### Workflow
Lisa writes media job (labels: ["media"]) →
Milhouse picks up from Job table →
Submits to Geoff media-orchestration →
Result stored in Job table description as artifact reference →
Notifies @lisa [JOB:id] complete

### Constraints
- Triggered by Lisa only — never directly by Flanders, Homer, or SMS
- No governance role, no execution role — pure creative output
- Returns artifacts to job table, never to chat directly
- Rate limits and quotas managed via Geoff API

## OPEN QUESTIONS (resolve at Geoff launch)
- Geoff API auth model and rate limits
- Node.js SDK vs client.py port
- geoffnet.magma-rpc.com uptime SLA
- Milhouse model fallback when Geoff media-orchestration unavailable
- Skinner model fallback when Geoff itself unavailable

## DEPENDENCIES
- Geoff API key (SMS to provide on launch)
- Skinner Phase 1 must be complete first
- Node.js StackNet client built and tested
- Marge ruling required before implementation`,
      status: 'BLOCKED',
      owner: 'LISA',
      risk: 'MEDIUM',
      requiresApproval: true,
      labels: ['skinner', 'milhouse', 'geoff', 'media', 'backlog', 'infrastructure'],
      blockedReason: 'Awaiting Geoff API key from SMS. Skinner Phase 1 must complete first.'
    }
  });
  console.log('Job 2:', job2.id);
  await p.$disconnect();
}

create().catch(e => { console.error(e); process.exit(1); });
