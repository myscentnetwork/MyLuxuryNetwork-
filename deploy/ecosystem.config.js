// PM2 Ecosystem Configuration
// Run with: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'admin',
      cwd: '/var/www/myluxurynetwork/apps/admin',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'reseller',
      cwd: '/var/www/myluxurynetwork/apps/reseller',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
    {
      name: 'store',
      cwd: '/var/www/myluxurynetwork/apps/store',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        STORE_BASE_URL: 'https://store.myluxury.network',
      },
    },
  ],
};
