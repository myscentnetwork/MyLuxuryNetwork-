#!/bin/bash

# MyLuxuryNetwork VPS Setup Script
# Run this on a fresh Ubuntu 22.04 VPS

echo "=== MyLuxuryNetwork VPS Setup ==="
echo ""

# Update system
echo "1. Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
echo "2. Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Install PM2 globally
echo "3. Installing PM2 process manager..."
sudo npm install -g pm2

# Install Nginx
echo "4. Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "5. Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

# Install Git
echo "6. Installing Git..."
sudo apt install -y git

# Create app directory
echo "7. Creating app directory..."
sudo mkdir -p /var/www/myluxurynetwork
sudo chown -R $USER:$USER /var/www/myluxurynetwork

# Enable Nginx
echo "8. Enabling Nginx..."
sudo systemctl enable nginx
sudo systemctl start nginx

# Configure firewall
echo "9. Configuring firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Upload your project to /var/www/myluxurynetwork"
echo "2. Run: cd /var/www/myluxurynetwork && npm install"
echo "3. Run: npm run build"
echo "4. Configure Nginx (see nginx-config.conf)"
echo "5. Start apps with PM2 (see ecosystem.config.js)"
echo "6. Setup SSL with: sudo certbot --nginx"
echo ""
