# Multi-stage build for Next.js webapp (monorepo: needs shared package).
# Build from repo root: docker build -f webapp/Dockerfile .

# ── Stage 1: Install deps ──
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy only package manifests for better layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY webapp/package.json webapp/
COPY shared/package.json shared/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Build ──
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/webapp/node_modules webapp/node_modules
COPY --from=deps /app/shared/node_modules shared/node_modules

# Copy source files
COPY shared/ shared/
COPY webapp/ webapp/
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

# Link shared package
RUN mkdir -p /app/webapp/node_modules/@oddscast && \
    rm -rf /app/webapp/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/webapp/node_modules/@oddscast/shared

# Build-time env vars (Next.js inlines NEXT_PUBLIC_* at build)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEBAPP_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN

WORKDIR /app/webapp
RUN pnpm run build

# ── Stage 3: Production runtime ──
FROM node:24-alpine AS prod
WORKDIR /app/webapp

# Copy only what's needed to run
COPY --from=build /app/webapp/.next .next
COPY --from=build /app/webapp/public public
COPY --from=build /app/webapp/package.json .
COPY --from=build /app/webapp/node_modules node_modules
COPY --from=build /app/shared /app/shared

# Re-link shared in production
RUN mkdir -p /app/webapp/node_modules/@oddscast && \
    rm -rf /app/webapp/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/webapp/node_modules/@oddscast/shared

ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-3000}"]
