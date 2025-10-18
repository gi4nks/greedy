FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat libstdc++

# ------------------------------------------
FROM base AS deps
RUN apk add --no-cache bash build-base python3 pkgconfig openssl-dev
WORKDIR /app
COPY package*.json ./
# Install dependencies (include dev deps for build)
RUN npm ci && npm cache clean --force

# ------------------------------------------
FROM base AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
# Source code will be mounted as volumes, no need to copy
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ------------------------------------------
FROM base AS builder
WORKDIR /app

COPY src/ ./src/
COPY public/ ./public/
COPY package*.json ./
COPY next.config.mjs ./
COPY postcss.config.cjs ./
COPY tailwind.config.mjs ./
COPY tsconfig.json ./
COPY --from=deps /app/node_modules ./node_modules

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm rebuild better-sqlite3
RUN npm run build

# ------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 \
    DATA_DIR=/app/database IMAGES_DIR=/app/public/images
RUN addgroup -g 1001 nodejs && adduser -D -u 1001 -G nodejs nextjs && \
    mkdir -p /app/database /app/public/images && \
    chown -R nextjs:nodejs /app

# Copy the standalone output preserving the structure Next.js creates
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
