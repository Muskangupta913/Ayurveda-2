#!/bin/bash

# Set project path and app name
PROJECT_DIR="/home/ubuntu/ayurveda"
NGINX_CONF_NAME="ayurvedanearme.ae"

# Install dependencies
sudo apt update
sudo apt install nginx -y

# Copy Nginx config
sudo cp "$PROJECT_DIR/server-setup/nginx.conf" "/etc/nginx/sites-available/$NGINX_CONF_NAME"

# Enable config
sudo ln -s "/etc/nginx/sites-available/$NGINX_CONF_NAME" "/etc/nginx/sites-enabled/"

# Test & restart
sudo nginx -t && sudo systemctl restart nginx

echo "✅ Nginx configured and restarted."
