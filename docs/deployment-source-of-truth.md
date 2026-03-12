# Deployment Source of Truth

## Rule
- Production deployments for Springfield Command Center must use master only.
- Do not deploy production from main.

## Why
A broken deployment incident occurred because changes were deployed from main while the known-good production state was on master.

## Recovery pattern
1. switch to master
2. reset to origin/master
3. redeploy from master

## Operational note
If production breaks, recovery should begin from the last known-good Vercel deployment or from origin/master, not from local branch assumptions.