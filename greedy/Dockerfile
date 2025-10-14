FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat libstdc++

FROM base AS deps
RUN apk add --no-cache bash build-base python3 pkgconfig openssl-dev
WORKDIR /app
COPY package.json package-lock.json ./
COPY greedy/package.json ./greedy/package.json
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/greedy/node_modules ./greedy/node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY greedy/ ./greedy/
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm rebuild better-sqlite3
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 \
    DATA_DIR=/app/database IMAGES_DIR=/app/public/images
RUN addgroup -g 1001 nodejs && adduser -D -u 1001 -G nodejs nextjs && \
    mkdir -p /app/database /app/public/images && \
    chown -R nextjs:nodejs /app

# Copy the standalone output preserving the structure Next.js creates
COPY --from=builder --chown=nextjs:nodejs /app/greedy/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/greedy/.next/static ./greedy/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/greedy/public ./greedy/public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]