# MyLuxuryNetwork VPS Deployment Guide

## Prerequisites
- Namecheap VPS with Ubuntu 22.04
- Domain: myluxury.network (or your domain)
- SSH access to VPS

---

## Step 1: Connect to VPS

After VPS is created, you'll receive:
- IP Address (e.g., 198.51.100.25)
- Root password

Connect via SSH:
```bash
ssh root@YOUR_VPS_IP
```

---

## Step 2: Create Non-Root User (Recommended)

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

---

## Step 3: Run Setup Script

Upload `vps-setup.sh` and run:
```bash
chmod +x vps-setup.sh
./vps-setup.sh
```

This installs: Node.js 20, PM2, Nginx, Certbot, Git

---

## Step 4: Upload Project

**Option A: Using Git (Recommended)**
```bash
cd /var/www/myluxurynetwork
git clone YOUR_REPO_URL .
```

**Option B: Using FileZilla**
1. Connect: SFTP, your IP, port 22, deploy/password
2. Upload all files to `/var/www/myluxurynetwork`

---

## Step 5: Install Dependencies & Build

```bash
cd /var/www/myluxurynetwork
npm install
npm run build
```

---

## Step 6: Configure Environment

Create `.env` files for each app:

**packages/database/.env:**
```
DATABASE_URL="file:./prod.db"
```

**apps/admin/.env.local:**
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**apps/store/.env.local:**
```
STORE_BASE_URL=https://store.myluxury.network
```

---

## Step 7: Setup Database

```bash
cd packages/database
npx prisma generate
npx prisma db push
```

---

## Step 8: Configure Nginx

```bash
sudo cp deploy/nginx-config.conf /etc/nginx/sites-available/myluxurynetwork
sudo ln -s /etc/nginx/sites-available/myluxurynetwork /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 9: Configure DNS (In Namecheap)

Go to: Namecheap Dashboard > Domain > Advanced DNS

Add A Records:
| Type | Host | Value |
|------|------|-------|
| A | admin | YOUR_VPS_IP |
| A | reseller | YOUR_VPS_IP |
| A | store | YOUR_VPS_IP |
| A | @ | YOUR_VPS_IP |

Wait 5-30 minutes for DNS propagation.

---

## Step 10: Start Applications

```bash
cd /var/www/myluxurynetwork
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup  # Follow the command it outputs
```

---

## Step 11: Setup SSL (HTTPS)

```bash
sudo certbot --nginx -d admin.myluxury.network -d reseller.myluxury.network -d store.myluxury.network
```

Follow prompts, enter email, agree to terms.

---

## Verify Everything Works

Visit:
- https://admin.myluxury.network
- https://reseller.myluxury.network
- https://store.myluxury.network

---

## Useful Commands

```bash
# View app status
pm2 status

# View logs
pm2 logs admin
pm2 logs reseller
pm2 logs store

# Restart apps
pm2 restart all

# Stop all
pm2 stop all

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

**Apps not starting:**
```bash
pm2 logs  # Check for errors
```

**502 Bad Gateway:**
- App not running: `pm2 status`
- Wrong port: Check ecosystem.config.js

**Domain not working:**
- DNS not propagated: wait or use `dig admin.myluxury.network`
- Nginx not configured: `sudo nginx -t`
