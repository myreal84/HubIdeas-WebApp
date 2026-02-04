#!/bin/sh
# Ensure data directory exists
mkdir -p /app/prisma/data

echo "Pushing schema to DB..."
npx prisma db push

echo "Starting server..."
node server.js
