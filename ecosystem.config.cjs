// PM2 config — chạy: pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: 'tft-helper-ai',
      script: 'server.js',
      instances: 1,          // rate-limit trong bộ nhớ → giữ 1 instance
      autorestart: true,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
