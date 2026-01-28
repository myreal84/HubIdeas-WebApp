# Deployment & Operations Guide

This document outlines the standard procedures for deploying and maintaining the HubIdeas application.

## 🚀 Production Deployment (Manual)

We use a "Push-to-Deploy" strategy via `rsync` and `docker compose`. This avoids running git operations on the production server and keeps the image minimal.

### 1. Prerequisites
- SSH access to the server (`root@192.168.178.78`).
- Local `rsync` installed.
- Valid `.env` file on the server (never overwritten by deployment).

### 2. Deployment Command
Run this command from the project root to deploy code changes. It excludes sensitive or heavy files.

```bash
npm run build && \
rsync -avz \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'prisma/dev.db*' \
  --exclude 'prisma/data' \
  --exclude 'README.md' \
  --exclude 'DEPLOYMENT.md' \
  . root@192.168.178.78:~/hub-ideas/ && \
ssh root@192.168.178.78 "cd ~/hub-ideas && docker compose up -d --build"
```

### 3. Database Migrations
The `start.sh` script automatically checks for and applies pending migrations on every container start (`prisma migrate deploy`).
- **If you change `schema.prisma`**: Run `npx prisma migrate dev` locally to generate the migration file *before* deploying.
- **Manual Force**: `ssh root@192.168.178.78 "docker exec hub-ideas npx prisma migrate deploy"`

## 🤖 AI Configuration
- **Model Compatibility**: Always use **stable** model tags (e.g., `gemini-2.0-flash-lite` or `gemini-1.5-flash`). Avoid `-preview` tags for production code as they may change or expire (returning 404).
- **Token Limits**: The app enforces database-stored token limits. Columns `aiTokenLimit` etc. must exist in the `User` table.

## 📂 Server Structure
- **Path**: `/root/hub-ideas/`
- **Database**: `prisma/data/hubideas.db` (Mapped volume, persistent).
- **Logs**: `docker logs hub-ideas`
