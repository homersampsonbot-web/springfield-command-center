# Homer Command Mode

## Status
Homer now supports three execution modes:
- patch
- write_file
- command_mode

## Approved command allowlist
- git status
- git add .
- git add <path>
- git commit -m "<message>"
- git push origin master
- npm run build
- pm2 restart springfield-web
- vercel deploy
- vercel --prod

## Governance
- production deployments must use master only
- command_mode is for bounded approved operations only
- no unrestricted shell execution