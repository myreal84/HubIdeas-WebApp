#!/bin/bash
set -e

echo "🚀 Starting Staging Deployment..."

echo "📦 Building application..."
npm run build

echo "📡 Syncing files to staging server (192.168.178.236)..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude 'prisma/dev.db*' \
  --exclude 'prisma/data' \
  . root@192.168.178.236:~/hub-ideas/

echo "🔄 Restarting containers on staging server..."
ssh root@192.168.178.236 "cd ~/hub-ideas && cp .env.staging .env && docker compose -f docker-compose.staging.yml up -d --build"

echo "✅ Deployment complete!"
