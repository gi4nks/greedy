# Development stage
FROM node:18-bullseye as development

RUN apt-get update && apt-get install -y python3 build-essential g++ make wget ca-certificates --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]

# Builder stage
FROM node:18-bullseye AS builder

RUN apt-get update && apt-get install -y python3 build-essential g++ make wget ca-certificates --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dev deps so we can build TypeScript inside image
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build || true

# Production stage
FROM node:18-bullseye-slim as production
WORKDIR /app

# Copy only runtime deps and built files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/tsconfig.json ./tsconfig.json

EXPOSE 3001

CMD ["node", "dist/server.js"]