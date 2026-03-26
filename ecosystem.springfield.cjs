module.exports = {
  apps: [
    {
      name: "lisa-browser",
      script: "/usr/bin/bash",
      args: "-c xvfb-run -a node /home/ubuntu/.openclaw/workspace/springfield-command-center/agents/lisa/browser-worker.js",
      cwd: "/home/ubuntu",
      autorestart: true,
      watch: false,
      env: {
        PM2_ROLE_NOTE: "legacy-fallback"
      }
    }
  ]
};

// NOTE: lisa-browser is LEGACY/FALLBACK only as of March 16 2026.
// Canonical Lisa ingress is CLI Lisa plus team chat Lisa.
// Do not stop lisa-browser without explicit Marge ruling.
