# Multi-stage build for NestJS server (monorepo: needs shared package).
# Build from repo root: docker build -f server/Dockerfile .
#
# Stage 1 (build): install all deps, compile TS, build shared + server
# Stage 2 (prod):  copy only production deps + compiled output + python

# ── Stage 1: Build ──
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace config + lockfile first (cache-friendly layer)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json server/
COPY shared/package.json shared/

# Install ALL deps (including devDeps for build)
RUN pnpm install --frozen-lockfile --filter server --filter @oddscast/shared

# Copy source
COPY shared/ shared/
COPY server/ server/

# Build shared types, then link + build server
RUN pnpm --filter @oddscast/shared build && \
    mkdir -p /app/server/node_modules/@oddscast && \
    rm -rf /app/server/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/server/node_modules/@oddscast/shared && \
    pnpm --filter server build

# ── Stage 2: Production ──
FROM node:20-alpine AS prod

# Python for analysis scripts (numpy/pandas needed by analysis.py)
RUN apk add --no-cache python3 py3-numpy py3-pandas

WORKDIR /app

# Copy only production node_modules (re-install without devDeps)
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY server/package.json server/
COPY shared/package.json shared/
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --frozen-lockfile --filter server --filter @oddscast/shared --prod

# Copy compiled output from build stage
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/shared/types shared/types
COPY --from=build /app/shared/package.json shared/package.json

# Copy Python analysis scripts
COPY server/scripts server/scripts

# Link shared into server node_modules
RUN mkdir -p /app/server/node_modules/@oddscast && \
    rm -rf /app/server/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/server/node_modules/@oddscast/shared

# Copy migration files (TypeORM CLI needs them at runtime)
COPY --from=build /app/server/dist/database server/dist/database

WORKDIR /app/server
ENV NODE_ENV=production
ENV PYTHON_BIN=/usr/bin/python3
# Limit Node.js heap to 256MB (default ~1.5GB is wasteful for this app)
ENV NODE_OPTIONS="--max-old-space-size=256"
EXPOSE 3000

# Run pending TypeORM migrations before starting the server.
CMD ["sh", "-c", "node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js && node dist/main"]
