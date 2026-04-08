# Multi-stage build for Next.js admin (monorepo: needs shared package).
# Build from repo root: docker build -f admin/Dockerfile .

# ── Stage 1: Install deps ──
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy only package manifests for better layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY admin/package.json admin/
COPY shared/package.json shared/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ──
FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/admin/node_modules admin/node_modules
COPY --from=deps /app/shared/node_modules shared/node_modules

# Copy source files
COPY shared/ shared/
COPY admin/ admin/
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Link shared package
RUN mkdir -p /app/admin/node_modules/@oddscast && \
    rm -rf /app/admin/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/admin/node_modules/@oddscast/shared

# Build-time env vars
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ADMIN_API_URL
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN

WORKDIR /app/admin
RUN pnpm run build

# ── Stage 3: Production runtime ──
FROM node:20-alpine AS prod
WORKDIR /app/admin

# Copy only what's needed to run
COPY --from=build /app/admin/.next .next
COPY --from=build /app/admin/public public
COPY --from=build /app/admin/package.json .
COPY --from=build /app/admin/node_modules node_modules
COPY --from=build /app/shared /app/shared

# Re-link shared in production
RUN mkdir -p /app/admin/node_modules/@oddscast && \
    rm -rf /app/admin/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/admin/node_modules/@oddscast/shared

ENV NODE_ENV=production
EXPOSE 3002
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-3002}"]
