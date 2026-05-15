/** PM2 config – Bens Music op poort 3002 */
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
      },
    },
  ],
};
