/** PM2 config – Bens Music op poort 3002 */
const fs = require("fs");
const path = require("path");

/** PM2 laadt geen .env.local zelf; Next doet dat bij `next start`, dit is backup. */
function loadEnvFile(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const fileEnv = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.production"),
  ...loadEnvFile(".env.local"),
};

module.exports = {
  apps: [
    {
      name: "bens-music",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3002",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        ...fileEnv,
      },
    },
  ],
};
