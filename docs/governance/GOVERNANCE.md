# SPRINGFIELD COMMAND CENTER — GOVERNANCE.MD
# Created: April 4 2026
# Authors: Marge (architecture) + Lisa (sprint continuity)
# Purpose: Migration continuity — OpenClaw → Direct API
# Safe restore point: git tag phase4-governed-execution

================================================================
AUTHORITY BOUNDARIES
================================================================

SMS        = system owner, final authority on all decisions
Marge      = Chief Architect, architecture rulings only
Lisa       = implementer/strategist, proposes to Marge
Maggie     = orchestrator/classifier, routes and dispatches
Homer      = executor, acts on approved packets only
Bart       = browser automation, QA (backlog)
Smithers   = UI monitor component only, never an agent

================================================================
NON-NEGOTIABLE GOVERNANCE RULES
================================================================

1. Master branch only — never main
2. Base URL always from request headers — never hardcode commander.margebot.com
3. 3 failed attempts → escalate to Marge before attempt 4
4. Every idea classified as INTERVENTION / BACKLOG / REJECT before implementation
5. No scope expansion mid-sprint
6. Agents are logical, not physical — identity survives infrastructure changes
7. Debugging stays flat and readable — no metaphors obscuring traces
8. No magic numbers — all scene geometry references GRID constants
9. Marge approves architecture only — not execution
10. SMS only for approvals and emergencies

Escalation rule:
  Homer and Lisa stop after 3 failed fix attempts.
  Before attempt 4, escalate to Marge with:
    - symptom
    - attempts tried
    - current hypothesis
  Do not attempt a 4th fix without Marge input.

================================================================
CURRENT SPRINT STATE — APRIL 4 2026
================================================================

IMMEDIATELY RESUME AFTER MIGRATION:

Phase 5 — SUCCESS State Routing
Status: IN PROGRESS — final validation pending
Risk: LOW — single file modification, no architecture changes
Rollback: single file revert in src/app/api/thread/send/route.ts

What was implemented:
  COMPLETE → SUCCESS status mapping in completion listener
  Location: src/app/api/thread/send/route.ts

  Code:
    let homerStatus =
      homerData?._springfield?.status ||
      (homerData.error ? "BLOCKED" : "UNKNOWN");
    if (homerStatus === "COMPLETE") homerStatus = "SUCCESS";

  SUCCESS test passthrough also implemented:
    blocked test → BLOCKED
    success test → COMPLETE

What is NOT yet done:
  - Supervised SUCCESS test run
  - Thread logging validation
  - Confirm no escalation triggered
  - Confirm audit trace

Marge approval conditions for Phase 5:
  - SUCCESS logs only
  - No escalation
  - BLOCKED unchanged
  - UNKNOWN unchanged
  - Supervised run required before Phase 6

POST-MIGRATION FIRST ACTION:
  @maggie success test route latest approved brief to @homer
  Expected: dispatch log → Homer execution → SUCCESS log → no escalation

================================================================
PHASE COMPLETION RECORD
================================================================

Phase 1 — Governance Loop            COMPLETE
Phase 2 — BLOCKED Escalation         COMPLETE
Phase 3 — Governance Validation      COMPLETE
Phase 4 — Governed Execution         COMPLETE
Phase 5 — SUCCESS Routing            IN PROGRESS (validation pending)
Phase 6 — TBD                        NOT STARTED

Git tag for safe restore: phase4-governed-execution

================================================================
SPRINT ROADMAP — STAGE SEQUENCE
================================================================

Stage 1:  Grid lock                         COMPLETE
Stage 2:  Smithers plant panel              COMPLETE
Stage 3:  Agent task ownership              COMPLETE
Stage 4:  Layer 1 sign-off by SMS           COMPLETE
Stage 5:  Trace Inspector                   PARTIAL
Stage 6:  Persistence (Zilliz)              ACTIVE
Stage 6B: Governance Layer (Decision Ledger) APPROVED, NOT IMPLEMENTED
Stage 7:  Reliability Board                 IN PROGRESS
Stage 8:  Stage A visual polish             DEFERRED
Stage 9:  Stage B spatial interaction       DEFERRED
Stage 10: Stage C WebGL shell               DEFERRED

Sprint priorities after Phase 5 validation:
  1. Finish Phase 5 supervised SUCCESS run
  2. Confirm audit trace continuity
  3. Confirm no escalation behavior
  4. Open Phase 6 discussion with Lisa/Marge

================================================================
CRITICAL RELAY AND ROUTING BEHAVIOR
================================================================

Maggie dispatch gate — only fires when ALL present:
  1. Approval state = APPROVED
  2. Valid execution brief
  3. requestId present
  If any missing → Maggie holds (intentional governance)

Completion listener — only triggers when:
  traceId: completion_listener
  Missing traceId = no completion processing
  This is stateless and restart-safe.

Status normalization rules (in completion_listener, NOT relay):
  COMPLETE → SUCCESS
  BLOCKED  → BLOCKED
  UNKNOWN  → UNKNOWN
  Mapping happens in completion_listener only.

Relay behavior:
  Homer relay returns: _springfield.status
  POST /api/relay/homer does NOT trigger completion listener
  POST /api/thread/send DOES trigger completion listener
  This is expected but undocumented — preserve this behavior.

Neon job queue:
  Maggie creates job metadata
  Homer executes
  Completion listener resolves
  Entirely stateless — restart safe

================================================================
APPROVED BUT NOT YET IMPLEMENTED
================================================================

1. Decision Ledger (Stage 6B)
   Schema: id, timestamp, proposalTitle, proposingAgent,
           ruling, conditions, summary, stageReference,
           sourceThreadEventId
   Route: POST /api/governance/ledger (append-only)
   Forbidden: PATCH, PUT, DELETE
   Storage: Zilliz primary, Neon secondary reference
   UI: read-only governance panel, back wall only

2. Governance Panel UI
   Back wall only, read-only Phase 1, zero write controls
   Must not modify locked scene grid
   Homer implements via File/Find/Replace/Verify/Rollback

3. S2-3 Failure routing to team chat
   Pending — now unblocked by direct relay architecture

4. Kanban state machine (Sprint 4)
   Not yet built

================================================================
OPEN RULINGS — MARCH 14 2026
================================================================

Marge command channel — APPROVED WITH CONDITIONS
  Read-only to all agents except SMS and Marge
  Homer listens and executes, no other agent writes

Auto memory updates — REJECTED
  Memory writes must be explicit and directed only

UI relay lock bug — DIRECTIVE ISSUED
  May be moot post-migration (relay is being replaced)
  If still relevant: disable flag must clear on process init
  Lock state must not persist across restarts
  3-attempt circuit breaker if runaway loops occur

================================================================
VISUALIZATION ARCHITECTURE — APPROVED
================================================================

Layer 1 — Control Room      → What is happening right now?
Layer 2 — Trace Inspector   → Why did that happen?
Layer 3 — Reliability Board → How well is it performing?

Sequencing gates (hard — no skipping):
  Gate 1: Grid lock before any other UI work
  Gate 2: Full Layer 1 stable before Trace Inspector
  Gate 3: Persistence live before Reliability Board

Control Room scene grid — LOCKED:
  Canvas: 1800 × 1100px
  Vanishing point: (900, 160)
  Wall zone: y 0-320 / Floor zone: y 318-1040
  Homer:  (310, 490)   Marge:  (1490, 490)
  Bart:   (390, 710)   Lisa:   (1410, 710)
  Maggie: (900, 780) — central console
  Smithers panel (back wall): x=1080, y=44, w=220, h=260
  DO NOT modify without Marge approval.

Smithers = UI monitor component ONLY
  Never an agent. Never on the floor. Back wall only.

================================================================
MIGRATION STATE — APRIL 4 2026
================================================================

OpenClaw migration: APPROVED by Marge (all 5 items)

Marge relay (post-migration):
  Script: /home/ubuntu/springfield-gateway/marge-relay.js
  Port: 3012
  Pattern: execSync → claude -p --output-format json
  Model: Claude Pro subscription
  System prompt: agents/marge-system-prompt.txt
  Architecture memory: agents/marge-architecture-memory.txt
  Fallback: Anthropic API key if CLI access tightened

Lisa relay (post-migration):
  Script: /home/ubuntu/springfield-gateway/lisa-relay.js
  Port: 3013
  Proxy: codex-proxy PM2 → 127.0.0.1:10531
  Model: gpt-5.4 via Codex OAuth
  Auth: ~/.codex/auth.json (symlinked from OpenClaw)
  Covered by: ChatGPT Pro subscription
  SOUL.md: agents/lisa-soul.md

Migration phase gate:
  Phase 2 end-to-end verification MUST pass before Phase 3
  Rollback stays live until Phase 4 complete

⚠️  SECURITY NOTE:
  x-springfield-key was stored in marge-architecture-memory.txt
  Rotate this key after migration is complete.
  Load from env only — never hardcode.

================================================================
INFRASTRUCTURE — CURRENT STATE
================================================================

Homer EC2: 3.131.96.117 Ubuntu
Gateway: homer.margebot.com (Cloudflare tunnel 54ffe3f2)
SSH: ssh.margebot.com (ttyd, Cloudflare Access gated)
Ports: 3001 (gateway), 3002 (ttyd), 3012 (marge-relay), 3013 (lisa-relay)
Vercel: commander.margebot.com (master branch ONLY)
Neon: primary operational DB via Prisma
Zilliz: primary vector store
Synology NAS: backup/persistence layer

================================================================
BACKLOG — PARKED
================================================================

- Maggie new BotFather token (separate from Marge's)
- Bart QA workflow / Ubuntu migration
- Async relay production promotion
- Maggie classification envelope implementation
- War Room at /war-room
- DVD Learning Library
- Event Stream → Terminal tab
- Programs/Projects/Jobs layer
- Geoff (geoff.ai) — revisit Homer/StackNet backlog when live

================================================================
AGENT FILES IN THIS DIRECTORY
================================================================

GOVERNANCE.md               — this file (continuity record)
marge-system-prompt.txt     — injected as system prompt on every Marge relay call
marge-architecture-memory.txt — full architecture context (March 14 2026)
marge-rulings-log.md        — canonical append-only rulings log
lisa-soul.md                — Lisa SOUL.md (updated April 4 2026)
SOUL.md                     — Springfield team SOUL.md
AGENTS.md                   — Springfield AGENTS.md

================================================================
HOW TO RESTORE MARGE POST-MIGRATION
================================================================

marge-relay.js injects both files as system context:
  1. marge-system-prompt.txt  → system prompt
  2. marge-architecture-memory.txt → prepended to every message

Marge reads both on every invocation.
No session state required — stateless by design.
Neon thread history is the conversational source of truth.

HOW TO RESTORE LISA POST-MIGRATION

lisa-relay.js injects lisa-soul.md as system prompt.
Lisa's model: gpt-5.4 via codex-proxy.
Stateless — Neon threads are source of truth.


## Agent Roster Update — April 5 2026

### Flanders — Springfield Dispatch (APPROVED)
- **Role**: Springfield Dispatch brain — SMS autonomous proxy
- **Model**: Claude Sonnet 4.6 (Anthropic)
- **Function**: Receives natural language input from SMS, reasons about priorities and state, writes plain-language directives for Maggie to operationalize
- **Type**: External actor / reasoning layer, not an executor
- **Reports to**: SMS (as SMS proxy)
- **Constraints**: No execution authority. All directives route through Maggie for classification before any agent acts. Escalations from Flanders route to Marge first. Does not appear on control room floor.

### Smithers — UI Monitor Component (CONFIRMED)
- **Role**: UI monitor component, back wall display
- **Type**: UI component only — no AI, no routing capability
- **Note**: Not an agent. Never speaks, never routes, never appears on the command floor.
