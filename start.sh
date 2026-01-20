#!/bin/sh
# Replace PORT_PLACEHOLDER with actual PORT (default 80)
sed -i "s/PORT_PLACEHOLDER/${PORT:-80}/g" /etc/nginx/conf.d/default.conf
# Start nginx
exec nginx -g 'daemon off;'
