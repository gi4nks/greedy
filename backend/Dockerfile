FROM node:18-bullseye

RUN apt-get update && apt-get install -y python3 build-essential g++ make wget ca-certificates --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --production --no-audit --no-fund

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]