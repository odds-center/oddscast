# Multi-stage build for NestJS server (monorepo: needs shared package).
# Build from repo root: docker build -f server/Dockerfile .
# cache-bust: 2026-04-06b
#
# Stage 1 (build): install all deps, compile TS  [node:24-alpine]
# Stage 2 (deps):  install production-only deps   [node:24-alpine]
# Stage 3 (prod):  runtime + python + lightgbm    [node:24-slim / glibc — pre-built wheels]

# ── Stage 1: Build ──
FROM node:24-alpine AS build
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
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json server/
COPY shared/package.json shared/
RUN pnpm install --frozen-lockfile --prod

# ── Stage 3: Production runtime ──
# Use node:24-slim (Debian/glibc) so lightgbm pre-built wheels install without a C compiler.
# Alpine (musl libc) has no pre-built lightgbm musllinux wheels and requires cmake to compile.
FROM node:24-slim AS prod

# pnpm required by Railway (reads packageManager from package.json)
RUN corepack enable && corepack prepare pnpm@latest --activate
# Python for analysis scripts + LightGBM (libgomp1 required for OpenMP threading)
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 python3-numpy python3-pandas python3-pip libgomp1 && \
    rm -rf /var/lib/apt/lists/* && \
    pip3 install --no-cache-dir --break-system-packages lightgbm
WORKDIR /app

# pnpm workspace config (required for `pnpm --filter server start` used by Railway)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY server/package.json server/package.json

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

# WORKDIR stays at /app (repo root) so `pnpm --filter server` can find workspace
ENV NODE_ENV=production
ENV PYTHON_BIN=/usr/bin/python3
ENV NODE_OPTIONS="--max-old-space-size=512"
EXPOSE 3000

CMD ["node", "server/dist/main"]
