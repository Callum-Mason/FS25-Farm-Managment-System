FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source and build both frontend and backend
COPY . .
RUN npm run build

FROM node:20-bullseye-slim

WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built assets and production node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
