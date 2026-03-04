module.exports = {
  apps: [{
    name: 'collective-souls-backend',
    script: './server.js',
    cwd: '/var/www/collective-souls/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3004
    },
    error_file: '/var/www/collective-souls/logs/err.log',
    out_file: '/var/www/collective-souls/logs/out.log',
    log_file: '/var/www/collective-souls/logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};