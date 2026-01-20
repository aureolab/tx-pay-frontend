#!/bin/sh
set -e

# Use PORT from environment or default to 80
PORT="${PORT:-80}"

echo "Starting nginx on port $PORT"

# Replace PORT_PLACEHOLDER with actual PORT
sed -i "s/PORT_PLACEHOLDER/$PORT/g" /etc/nginx/conf.d/default.conf

# Show the config for debugging
echo "Nginx config:"
cat /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g 'daemon off;'
