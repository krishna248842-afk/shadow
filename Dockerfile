# ── Shadow — production Dockerfile (Render / Railway / any VPS) ──────────────
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

FROM node:22-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
COPY --from=builder /app ./
RUN mkdir -p /app/data
EXPOSE 3000
# Data lives in /app/data (mount a volume there to keep your store)
CMD ["npm", "start"]
