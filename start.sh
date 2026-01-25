#!/bin/sh
# Ensure data directory exists
mkdir -p /app/prisma/data

echo "Running migrations..."
npx prisma migrate deploy

echo "Starting server..."
node server.js
