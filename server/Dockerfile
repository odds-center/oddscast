# Multi-stage build for NestJS server (monorepo: needs shared package).
# Build from repo root: docker build -f server/Dockerfile .
#
# Stage 1 (build): install all deps, compile TS
# Stage 2 (deps):  install production-only deps
# Stage 3 (prod):  copy compiled output + prod deps + python

# ── Stage 1: Build ──
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @oddscast/shared build && \
    mkdir -p /app/server/node_modules/@oddscast && \
    rm -rf /app/server/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/server/node_modules/@oddscast/shared && \
    pnpm --filter server build

# ── Stage 2: Production deps only ──
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json server/
COPY shared/package.json shared/
RUN pnpm install --frozen-lockfile --prod

# ── Stage 3: Production runtime ──
FROM node:20-alpine AS prod

# pnpm required by Railway (reads packageManager from package.json)
RUN corepack enable && corepack prepare pnpm@latest --activate
# Python for analysis scripts
RUN apk add --no-cache python3 py3-numpy py3-pandas
WORKDIR /app

# Production node_modules from deps stage
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/server/node_modules server/node_modules
COPY --from=deps /app/shared/package.json shared/package.json

# Compiled output from build stage
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/shared/types shared/types

# Python analysis scripts
COPY server/scripts server/scripts

# Link shared package
RUN mkdir -p /app/server/node_modules/@oddscast && \
    rm -rf /app/server/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/server/node_modules/@oddscast/shared

WORKDIR /app/server
ENV NODE_ENV=production
ENV PYTHON_BIN=/usr/bin/python3
ENV NODE_OPTIONS="--max-old-space-size=512"
EXPOSE 3000

CMD ["node", "dist/main"]
