# 🚀 Server Deployment Plan

> **OddsCast production deployment strategy — AWS EC2 + PM2 + Nginx**
>
> This document defines the complete server infrastructure plan including
> architecture, deployment flow, cost estimates, and step-by-step guides.
>
> **Last updated**: 2026-02-19

**현재 배포 선택:** 프로덕션은 **Railway**로 배포하며, **DB는 별도** 운영( Railway PostgreSQL add-on 또는 외부 PostgreSQL).  
→ 상세 절차는 **[Railway 배포 가이드](RAILWAY_DEPLOYMENT.md)** 참고.  
→ Prisma는 dev/prod 동일 사용, `DATABASE_URL`만 개발용 DB / 프로덕션용 DB로 구분.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        AWS Cloud (ap-northeast-2, Seoul)             │
│                                                                      │
│  ┌─────────────┐    ┌──────────────────────────────────────────┐     │
│  │ Route 53    │    │  EC2 Instance (t3.small / t3.medium)     │     │
│  │ DNS         │───▶│                                          │     │
│  └─────────────┘    │  ┌──────────┐   ┌────────────────────┐  │     │
│                     │  │  Nginx   │──▶│  PM2 (cluster)     │  │     │
│  ┌─────────────┐    │  │  :80/443 │   │  ┌──────────────┐  │  │     │
│  │ CloudFront  │───▶│  │  SSL/TLS │   │  │ NestJS :3001 │  │  │     │
│  │ CDN         │    │  │  Proxy   │   │  │ (instance 0) │  │  │     │
│  └─────────────┘    │  └──────────┘   │  ├──────────────┤  │  │     │
│                     │                 │  │ NestJS :3001 │  │  │     │
│  ┌─────────────┐    │  ┌──────────┐   │  │ (instance 1) │  │  │     │
│  │ ACM         │    │  │ Certbot  │   │  └──────────────┘  │  │     │
│  │ SSL Cert    │    │  │ Let's    │   └────────────────────┘  │     │
│  └─────────────┘    │  │ Encrypt  │                           │     │
│                     │  └──────────┘   ┌────────────────────┐  │     │
│                     │                 │  Webapp (Next.js)   │  │     │
│                     │                 │  :3000 (PM2)        │  │     │
│                     │                 └────────────────────┘  │     │
│                     └──────────────────────────────────────────┘     │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  RDS PostgreSQL (db.t3.micro → db.t3.small)                  │    │
│  │  Multi-AZ: off (MVP) → on (production)                       │    │
│  │  Automated backups: 7 days retention                         │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐      │
│  │  ElastiCache Redis  │  │  S3 (backups, static assets)     │      │
│  │  (optional, later)  │  │                                  │      │
│  └─────────────────────┘  └──────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Why This Stack?

| Decision | Reasoning |
|----------|-----------|
| **AWS EC2** | Full control, predictable pricing, Seoul region (low latency for Korean users) |
| **PM2** | Zero-downtime reload, cluster mode, auto-restart on crash, built-in monitoring |
| **Nginx** | Reverse proxy, SSL termination, rate limiting, static file serving |
| **RDS PostgreSQL** | Managed DB, automated backups, easy scaling, no DBA overhead |
| **Not Docker/ECS** | Simpler for a small team, less operational overhead at MVP stage |
| **Not Vercel (server)** | NestJS with cron jobs, python-shell, WebSocket needs persistent server |

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **EC2 + PM2** | Simple, full control, cheap | Manual scaling | ✅ **MVP choice** |
| **ECS Fargate** | Auto-scaling, no server mgmt | Complex setup, higher cost | Phase 2 |
| **Lambda + API GW** | Pay per request, auto-scale | Cold starts, no cron, no python-shell | ❌ Not suitable |
| **Lightsail** | Simpler than EC2, fixed price | Limited config, no RDS integration | ❌ |
| **Railway/Render** | Easy deploy, managed | Expensive at scale, limited regions | ✅ **현재 선택: Railway** (DB 별도) |

---

## 3. Infrastructure Specification

### 3.1 EC2 Instance

| Phase | Instance Type | vCPU | RAM | Storage | Monthly Cost |
|-------|--------------|------|-----|---------|-------------|
| **MVP** | t3.small | 2 | 2 GB | 30 GB gp3 | ~$18/mo |
| **Growth** | t3.medium | 2 | 4 GB | 50 GB gp3 | ~$33/mo |
| **Scale** | t3.large | 2 | 8 GB | 100 GB gp3 | ~$66/mo |

**OS**: Amazon Linux 2023 or Ubuntu 22.04 LTS
**Region**: ap-northeast-2 (Seoul)

### 3.2 RDS PostgreSQL

| Phase | Instance | Storage | Monthly Cost |
|-------|----------|---------|-------------|
| **MVP** | db.t3.micro (Free Tier) | 20 GB gp3 | ~$0 (free tier) / $15 |
| **Growth** | db.t3.small | 50 GB gp3 | ~$28/mo |
| **Scale** | db.t3.medium + Multi-AZ | 100 GB gp3 | ~$90/mo |

**Version**: PostgreSQL 16
**Backup**: Automated, 7-day retention
**Encryption**: At rest (AES-256)

### 3.3 Optional Services

| Service | Purpose | When to Add | Cost |
|---------|---------|-------------|------|
| **ElastiCache Redis** | API caching, session store | Growth phase | ~$13/mo (t3.micro) |
| **CloudFront CDN** | Webapp static files, global delivery | Growth phase | ~$5–15/mo |
| **S3** | DB backups, user uploads, logs | MVP | ~$1–3/mo |
| **SES** | Transactional email (password reset) | MVP | ~$0.10/1000 emails |
| **CloudWatch** | Monitoring, alerting | MVP | Free tier + ~$3/mo |

### 3.4 Monthly Cost Estimate

| Phase | Compute | Database | Network | Other | Total |
|-------|---------|----------|---------|-------|-------|
| **MVP** | $18 | $0–15 | $5 | $3 | **~$26–41/mo** |
| **Growth** | $33 | $28 | $15 | $15 | **~$91/mo** |
| **Scale** | $66 | $90 | $30 | $30 | **~$216/mo** |

---

## 4. Server Setup Guide

### 4.1 EC2 Initial Setup

```bash
# 1. Connect to EC2
ssh -i oddscast-key.pem ec2-user@your-ec2-ip

# 2. System update
sudo yum update -y   # Amazon Linux
# or: sudo apt update && sudo apt upgrade -y  # Ubuntu

# 3. Install Node.js 20 LTS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
# or (Ubuntu):
# curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
# sudo apt install -y nodejs

# 4. Install pnpm
npm install -g pnpm

# 5. Install PM2
npm install -g pm2

# 6. Install Python 3 (for analysis scripts)
sudo yum install -y python3 python3-pip
pip3 install pandas numpy

# 7. Install Nginx
sudo yum install -y nginx
sudo systemctl enable nginx

# 8. Install Git
sudo yum install -y git
```

### 4.2 Project Setup

```bash
# Clone repository
cd /home/ec2-user
git clone https://github.com/your-repo/goldenrace.git
cd goldenrace

# Install dependencies
pnpm install

# Build shared types
cd shared && pnpm build && cd ..

# Server setup
cd server
# Create .env (run from repo root: ./scripts/setup-env.sh, or copy from secure store)
# Set production values: DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, KRA_SERVICE_KEY, etc.

# Generate Prisma client + build
pnpm build

# Run migrations
npx prisma db push
npx prisma db execute --file prisma/seed.sql
```

### 4.3 PM2 Configuration

Create `ecosystem.config.js` at project root:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'oddscast-server',
      cwd: './server',
      script: 'dist/main.js',
      instances: 2,             // Cluster mode (2 instances for zero-downtime)
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Auto-restart on memory leak
      max_memory_restart: '500M',
      // Graceful reload
      kill_timeout: 5000,
      listen_timeout: 10000,
      // Logging
      error_file: '/home/ec2-user/logs/server-error.log',
      out_file: '/home/ec2-user/logs/server-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Watch (disabled in production)
      watch: false,
    },
    {
      name: 'oddscast-webapp',
      cwd: './webapp',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,             // Single instance (Next.js handles its own clustering)
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '400M',
      error_file: '/home/ec2-user/logs/webapp-error.log',
      out_file: '/home/ec2-user/logs/webapp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
    },
    {
      name: 'oddscast-admin',
      cwd: './admin',
      script: 'node_modules/.bin/next',
      args: 'start -p 3002',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
      },
      max_memory_restart: '300M',
      error_file: '/home/ec2-user/logs/admin-error.log',
      out_file: '/home/ec2-user/logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      watch: false,
    },
  ],
};
```

### 4.4 PM2 Commands

```bash
# Start all apps
pm2 start ecosystem.config.js

# Zero-downtime reload (graceful restart, one instance at a time)
pm2 reload oddscast-server

# View status
pm2 status
pm2 monit          # Real-time monitoring
pm2 logs            # View logs
pm2 logs --lines 100

# Auto-start on server reboot
pm2 startup
pm2 save

# Restart all
pm2 restart all

# Stop
pm2 stop oddscast-server
pm2 delete all
```

### 4.5 Nginx Configuration

```nginx
# /etc/nginx/conf.d/oddscast.conf

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=activity:10m rate=10r/s;

# Upstream servers
upstream nestjs_server {
    least_conn;
    server 127.0.0.1:3001;
}

upstream webapp_server {
    server 127.0.0.1:3000;
}

upstream admin_server {
    server 127.0.0.1:3002;
}

# Main site — webapp + API
server {
    listen 80;
    listen 443 ssl http2;
    server_name oddscast.kr www.oddscast.kr;

    # SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/oddscast.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/oddscast.kr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Redirect HTTP to HTTPS
    if ($scheme = http) {
        return 301 https://$host$request_uri;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    # API routes → NestJS
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://nestjs_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }

    # Activity tracking (lower rate limit)
    location /api/activity/ {
        limit_req zone=activity burst=20 nodelay;
        proxy_pass http://nestjs_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health check (no rate limit)
    location /health {
        proxy_pass http://nestjs_server;
    }

    # Swagger docs (restrict in production or IP-whitelist)
    location /docs {
        # allow 123.456.789.0/24;  # Your office IP
        # deny all;
        proxy_pass http://nestjs_server;
    }

    # Everything else → Next.js webapp
    location / {
        proxy_pass http://webapp_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Next.js HMR / WebSocket (dev only, remove in production)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files cache
    location /_next/static/ {
        proxy_pass http://webapp_server;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}

# Admin panel — separate subdomain
server {
    listen 80;
    listen 443 ssl http2;
    server_name admin.oddscast.kr;

    ssl_certificate /etc/letsencrypt/live/oddscast.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/oddscast.kr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    if ($scheme = http) {
        return 301 https://$host$request_uri;
    }

    # IP whitelist for admin (recommended)
    # allow 123.456.789.0/24;
    # deny all;

    location / {
        proxy_pass http://admin_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 4.6 SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx
# or (Ubuntu): sudo apt install -y certbot python3-certbot-nginx

# Issue certificate
sudo certbot --nginx -d oddscast.kr -d www.oddscast.kr -d admin.oddscast.kr

# Auto-renewal (cron)
sudo certbot renew --dry-run
# Certbot auto-installs renewal timer
```

---

## 5. Deployment Flow (CI/CD)

### 5.1 Manual Deploy Script

Create `deploy.sh` at project root:

```bash
#!/bin/bash
set -e

echo "=== OddsCast Deploy ==="
cd /home/ec2-user/goldenrace

# Pull latest code
git pull origin master

# Install dependencies
pnpm install --frozen-lockfile

# Build shared types
cd shared && pnpm build && cd ..

# Build server
cd server
npx prisma generate
npx prisma db push --accept-data-loss=false
pnpm build
cd ..

# Build webapp
cd webapp && pnpm build && cd ..

# Build admin
cd admin && pnpm build && cd ..

# Zero-downtime reload
pm2 reload ecosystem.config.js

echo "=== Deploy complete ==="
pm2 status
```

### 5.2 GitHub Actions (Automated CI/CD)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd /home/ec2-user/goldenrace
            bash deploy.sh
```

### 5.3 Deployment Checklist

```
Pre-deploy:
  □ Run tests locally (pnpm test)
  □ Check for Prisma schema changes (migration needed?)
  □ Verify .env variables are up to date
  □ Check disk space (df -h)

Deploy:
  □ git pull origin master
  □ pnpm install --frozen-lockfile
  □ Build shared → server → webapp → admin
  □ Prisma db push (if schema changed)
  □ pm2 reload ecosystem.config.js

Post-deploy:
  □ pm2 status — all apps "online"
  □ curl https://oddscast.kr/health — 200 OK
  □ Check pm2 logs for errors
  □ Verify cron jobs running (pm2 logs oddscast-server | grep "cron")
  □ Test key user flows (login, race list, prediction)
```

---

## 6. Security

### 6.1 EC2 Security Group

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| SSH | 22 | My IP only | Server access |
| HTTP | 80 | 0.0.0.0/0 | Web (redirects to HTTPS) |
| HTTPS | 443 | 0.0.0.0/0 | Web traffic |
| Custom | 3001 | 127.0.0.1 | NestJS (local only) |
| Custom | 3000 | 127.0.0.1 | Webapp (local only) |
| Custom | 3002 | Admin IP | Admin panel |

### 6.2 RDS Security Group

| Type | Port | Source | Purpose |
|------|------|--------|---------|
| PostgreSQL | 5432 | EC2 SG only | DB access from EC2 only |

### 6.3 Environment Variables

```
NEVER commit .env files.
Store production secrets in:
  1. EC2 .env file (chmod 600)
  2. AWS Systems Manager Parameter Store (recommended)
  3. AWS Secrets Manager (for DB credentials)
```

### 6.4 Security Checklist

```
□ SSH key authentication only (disable password auth)
□ Fail2Ban installed (brute force protection)
□ UFW/firewall configured
□ Nginx rate limiting enabled
□ CORS restricted to production domains
□ JWT_SECRET is at least 32 characters, randomly generated
□ Database not publicly accessible
□ Admin panel IP-whitelisted
□ SSL/TLS enabled (A+ rating on SSL Labs)
□ Regular security updates (yum update / apt upgrade)
□ Log rotation configured
□ Swagger docs restricted in production
```

---

## 7. Monitoring & Alerting

### 7.1 PM2 Monitoring

```bash
# Real-time dashboard
pm2 monit

# Web-based dashboard (pm2.io)
pm2 link <secret> <public>   # Connect to pm2.io (free tier: 1 server)
```

### 7.2 CloudWatch (AWS)

| Metric | Alarm Threshold | Action |
|--------|----------------|--------|
| CPU Utilization | > 80% for 5 min | SNS notification |
| Memory Usage | > 85% | SNS notification |
| Disk Usage | > 80% | SNS notification |
| RDS CPU | > 80% for 5 min | Scale up alert |
| RDS Free Storage | < 2 GB | Scale storage alert |
| Health Check | /health fails 3x | Restart alert |

### 7.3 Application-Level Monitoring

| Tool | Purpose | Phase |
|------|---------|-------|
| **PM2 logs** | Application logs, error tracking | MVP |
| **CloudWatch Logs** | Centralized log storage | MVP |
| **Sentry** | Error tracking, stack traces | Growth |
| **Datadog / New Relic** | APM, performance monitoring | Scale |
| **UptimeRobot** | External uptime monitoring (free) | MVP |

### 7.4 Health Check Endpoints

Already implemented in the server:
- `GET /health` — basic health (200 OK)
- `GET /health/detailed` — DB connection, uptime, memory

---

## 8. Backup Strategy

### 8.1 Database Backups

```
RDS Automated:
  - Daily snapshots, 7-day retention
  - Point-in-time recovery (up to 5 minutes)

Manual Backup (weekly → S3):
  pg_dump -h rds-endpoint -U postgres -d oddscast | gzip > backup_$(date +%Y%m%d).sql.gz
  aws s3 cp backup_*.sql.gz s3://oddscast-backups/db/
```

### 8.2 Server Backups

```
Automated via cron:
  - PM2 ecosystem + .env → S3 (weekly)
  - Nginx config → S3 (on change)
  - Application logs → CloudWatch Logs or S3 (daily rotation)
```

### 8.3 Disaster Recovery

| Scenario | Recovery Time | Strategy |
|----------|--------------|----------|
| App crash | Instant | PM2 auto-restart |
| Server crash | 5–10 min | PM2 startup script + systemd |
| Data corruption | 15–30 min | RDS point-in-time recovery |
| Full server loss | 30–60 min | New EC2 + RDS restore + git clone + deploy |
| Region outage | 1–2 hours | Cross-region RDS read replica (Scale phase) |

---

## 9. Scaling Strategy

### Phase 1: Single Server (0–1,000 users)
```
EC2 t3.small + RDS t3.micro
PM2 cluster mode (2 instances)
In-memory cache
```

### Phase 2: Optimized Single Server (1,000–5,000 users)
```
EC2 t3.medium + RDS t3.small
ElastiCache Redis (caching + sessions)
CloudFront CDN for webapp static assets
Database query optimization + indices
```

### Phase 3: Multi-Server (5,000–20,000 users)
```
2x EC2 behind ALB (Application Load Balancer)
RDS t3.medium + Multi-AZ
ElastiCache Redis (shared cache)
S3 + CloudFront for all static content
Consider ECS Fargate migration
```

### Phase 4: Auto-Scaling (20,000+ users)
```
ECS Fargate (containerized, auto-scaling)
RDS + Read Replicas
ElastiCache Redis Cluster
CloudFront + S3
SQS for async job processing (KRA sync, predictions)
```

---

## 10. Domain & DNS Setup

### 10.1 Domain Registration

```
Register: oddscast.kr (or .com)
Registrar: AWS Route 53 / Gabia / hosting.kr
```

### 10.2 DNS Records (Route 53)

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | oddscast.kr | EC2 Elastic IP | 300 |
| A | www | EC2 Elastic IP | 300 |
| A | admin | EC2 Elastic IP | 300 |
| A | api | EC2 Elastic IP (if separate subdomain) | 300 |
| MX | oddscast.kr | AWS SES (if email needed) | 3600 |

### 10.3 Elastic IP

```bash
# Allocate and associate Elastic IP to EC2
# This ensures the IP doesn't change on instance restart
aws ec2 allocate-address --domain vpc
aws ec2 associate-address --instance-id i-xxx --allocation-id eipalloc-xxx
```

---

## 11. Environment Configuration

### 11.1 Production .env (server)

```bash
# Database (RDS endpoint)
DATABASE_URL="postgresql://oddscast:STRONG_PASSWORD@oddscast-db.xxxx.ap-northeast-2.rds.amazonaws.com:5432/oddscast?schema=public"

# Server
PORT=3001
NODE_ENV=production

# Auth
JWT_SECRET=<openssl rand -base64 64>
GOOGLE_CLIENT_ID=your-production-google-client-id.apps.googleusercontent.com

# AI
GEMINI_API_KEY=your-production-gemini-key

# KRA
KRA_SERVICE_KEY=your-encoded-kra-service-key

# Redis (when added)
# REDIS_URL=redis://oddscast-cache.xxxx.cache.amazonaws.com:6379

# Push
# EXPO_ACCESS_TOKEN=your-expo-access-token
```

### 11.2 Production .env (webapp)

```bash
NEXT_PUBLIC_API_BASE_URL=https://oddscast.kr/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-production-google-client-id
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 12. First Deploy Checklist

```
Infrastructure:
  □ AWS account created + billing alert set ($50/mo)
  □ EC2 instance launched (t3.small, Seoul region)
  □ Elastic IP allocated and associated
  □ Security groups configured (SSH my IP, HTTP/HTTPS public, DB private)
  □ RDS PostgreSQL created (t3.micro, same VPC)
  □ SSH key pair downloaded and secured (chmod 400)

Server Setup:
  □ Node.js 20, pnpm, PM2, Python 3, Nginx installed
  □ Git clone project
  □ .env configured with production secrets
  □ Prisma generate + db push + seed
  □ Server build successful (pnpm build)
  □ Webapp build successful (pnpm build)
  □ Admin build successful (pnpm build)

PM2:
  □ ecosystem.config.js created
  □ pm2 start — all apps online
  □ pm2 startup — auto-start on reboot
  □ pm2 save — save process list

Nginx:
  □ Nginx config created and tested (nginx -t)
  □ Reverse proxy working (API + Webapp + Admin)
  □ SSL certificate installed (Let's Encrypt)
  □ HTTPS redirect working

DNS:
  □ Domain registered
  □ DNS A records pointing to Elastic IP
  □ SSL cert covers all subdomains

Verification:
  □ https://oddscast.kr — webapp loads
  □ https://oddscast.kr/api/health — 200 OK
  □ https://admin.oddscast.kr — admin loads
  □ Login/register works
  □ Race list loads (KRA data synced)
  □ Cron jobs running (check PM2 logs)
  □ Mobile WebView connects properly

Monitoring:
  □ UptimeRobot configured (free)
  □ CloudWatch basic alarms set
  □ PM2 logs accessible
  □ Backup strategy confirmed
```

---

## 13. Reference Documents

| Document | Relevance |
|----------|-----------|
| [ARCHITECTURE.md](architecture/ARCHITECTURE.md) | System architecture |
| [PROJECT_STRUCTURE.md](architecture/PROJECT_STRUCTURE.md) | Directory structure |
| [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) | Feature plans |
| [API_SPECIFICATION.md](architecture/API_SPECIFICATION.md) | API endpoints |

---

_This plan should be reviewed and updated before each deployment milestone._
