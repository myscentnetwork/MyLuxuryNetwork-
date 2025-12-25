#!/bin/bash

# MyLuxuryNetwork - Complete Automated Installation
# Just run this script and everything will be set up

set -e  # Exit on any error

echo "=============================================="
echo "  MyLuxuryNetwork - Automated Installation"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_step() {
    echo -e "${YELLOW}[→]${NC} $1"
}

# Step 1: Update system
print_step "Step 1/10: Updating system packages..."
apt update && apt upgrade -y
print_status "System updated"

# Step 2: Install Node.js 20
print_step "Step 2/10: Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
print_status "Node.js $(node -v) installed"

# Step 3: Install PM2
print_step "Step 3/10: Installing PM2 process manager..."
npm install -g pm2
print_status "PM2 installed"

# Step 4: Install Nginx
print_step "Step 4/10: Installing Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
print_status "Nginx installed and running"

# Step 5: Install Certbot
print_step "Step 5/10: Installing Certbot for SSL..."
apt install -y certbot python3-certbot-nginx
print_status "Certbot installed"

# Step 6: Install Git and unzip
print_step "Step 6/10: Installing Git..."
apt install -y git unzip
print_status "Git installed"

# Step 7: Configure firewall
print_step "Step 7/10: Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable
print_status "Firewall configured"

# Step 8: Create app directory
print_step "Step 8/10: Creating application directory..."
mkdir -p /var/www/myluxurynetwork
cd /var/www/myluxurynetwork
print_status "Directory created: /var/www/myluxurynetwork"

# Step 9: Download and extract project
print_step "Step 9/10: Waiting for project files..."
echo ""
echo "=============================================="
echo "  SERVER SETUP COMPLETE!"
echo "=============================================="
echo ""
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PM2 version: $(pm2 -v)"
echo "Nginx status: $(systemctl is-active nginx)"
echo ""
echo "Next: Upload your project files"
echo "Directory: /var/www/myluxurynetwork"
echo ""
echo "=============================================="
