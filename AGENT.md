# Springfield Command Center — Agent Context

## Homer EC2 Executor
- Working directory: `/home/ubuntu/.openclaw/workspace/springfield-command-center`
- All file paths relative to this directory
- Key files:
  - `src/app/page.tsx` — main UI page (tabs, layout)
  - `src/app/api/` — API routes
  - `src/components/` — React components
  - `src/app/layout.tsx` — app layout

## Critical Path Rules for Homer
- ALWAYS use relative paths from REPO_DIR: `src/app/page.tsx` NOT `page.tsx`
- For absolute paths use: `/home/ubuntu/.openclaw/workspace/springfield-command-center/src/app/page.tsx`
- Homer runs in REPO_DIR — `cat src/app/page.tsx` works, `cat page.tsx` does NOT
- Use `grep -n "pattern" src/app/page.tsx` to find line numbers
- Use `sed -n '100,120p' src/app/page.tsx` to read specific lines
- Use `python3` scripts for complex edits

## Deployment
- After editing: `npm run build` then `git add -A` then `git commit -m "message"` then `git push origin master` then `vercel --prod`
- PM2 restart after gateway changes: `pm2 restart springfield-gateway`

## Agent Roles
- Marge: Architecture decisions only — never implementation
- Lisa: Planning, sequencing, breaking into atomic Homer tasks
- Homer: Executes specific shell commands — needs exact commands, not natural language
- Skinner: Interventionist — SSH access, monitors, reports to SMS
- Flanders: Dispatch brain — routes directives

## Homer Task Format
Good: `grep -n "debate" src/app/page.tsx`
Good: `sed -n '550,570p' src/app/page.tsx`
Good: `python3 -c "...edit script..."`
Bad: `cat page.tsx` (wrong path)
Bad: `read_file src/app/page.tsx` (not a shell command)
Bad: `implement the UI changes` (too vague)
