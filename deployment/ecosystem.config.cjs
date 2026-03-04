module.exports = {
  apps: [{
    name: 'collective-souls-backend',
    script: './server.js',
    cwd: '/var/www/collective-souls/backend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/collective-souls/logs/err.log',
    out_file: '/var/www/collective-souls/logs/out.log',
    log_file: '/var/www/collective-souls/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};