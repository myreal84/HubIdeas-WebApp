# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
# Install ALL dependencies (including devDependencies like prisma CLI)
RUN npm install --ignore-scripts --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
ENV DATABASE_URL "file:./dev.db"

# Build-time variables
ARG NEXT_PUBLIC_STAGING_ADMIN_EMAIL
ARG NEXT_PUBLIC_STAGING_ADMIN_PASSWORD
ARG NEXT_PUBLIC_ALLOW_CREDENTIALS
ARG NEXT_PUBLIC_IS_STAGING

ENV NEXT_PUBLIC_STAGING_ADMIN_EMAIL=$NEXT_PUBLIC_STAGING_ADMIN_EMAIL
ENV NEXT_PUBLIC_STAGING_ADMIN_PASSWORD=$NEXT_PUBLIC_STAGING_ADMIN_PASSWORD
ENV NEXT_PUBLIC_ALLOW_CREDENTIALS=$NEXT_PUBLIC_ALLOW_CREDENTIALS
ENV NEXT_PUBLIC_IS_STAGING=$NEXT_PUBLIC_IS_STAGING

# Generate Prisma Client (uses local version from node_modules)
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN apk add --no-cache libc6-compat openssl
RUN npm install -g prisma@6.2.1

# Create a group and user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy start script
COPY start.sh ./
RUN chmod +x start.sh

# USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["./start.sh"]
