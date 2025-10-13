FROM node:20-alpine AS base

WORKDIR /app

# Install base runtime dependencies once for re-use across stages
RUN apk add --no-cache \
    libc6-compat \
    libstdc++

FROM base AS deps

# Tooling required to build native modules such as better-sqlite3
RUN apk add --no-cache \
    bash \
    build-base \
    python3 \
    pkgconfig \
    openssl-dev

WORKDIR /app

# Leverage npm workspaces – copy manifests first for better caching
COPY package.json package-lock.json ./
COPY greedy/package.json greedy/package.json

# Install all dependencies (workspace aware)
RUN npm ci

FROM base AS builder

WORKDIR /app

# Copy installed dependencies and source tree
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY . .

# Rebuild native modules for Alpine Linux
RUN npm rebuild better-sqlite3

WORKDIR /app/greedy

ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV DATA_DIR=/app/database
ENV IMAGES_DIR=/app/public/images

# Add a non-root user for runtime security
RUN addgroup -g 1001 nodejs \
 && adduser -D -u 1001 -G nodejs nextjs

# Prepare writable directories for persistent data
RUN mkdir -p \
    /app/database \
    /app/public/images \
 && chown -R nextjs:nodejs /app

# Copy the build output produced by Next.js standalone mode
COPY --from=builder --chown=nextjs:nodejs /app/greedy/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/greedy/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/greedy/public ./public

USER nextjs

EXPOSE 3000

# Start the production server
CMD ["node", "server.js"]
