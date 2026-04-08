# Multi-stage build for Next.js webapp (monorepo: needs shared package).
# Build from repo root: docker build -f webapp/Dockerfile .

# ── Stage 1: Install deps + Build ──
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy package manifests first for layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY webapp/package.json webapp/
COPY shared/package.json shared/

RUN pnpm install --frozen-lockfile

# Copy source
COPY shared/ shared/
COPY webapp/ webapp/

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

# ── Stage 2: Production runtime ──
FROM node:24-alpine AS prod
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace deps + build output (pnpm hoists to root node_modules)
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/webapp webapp
COPY --from=build /app/shared shared
COPY --from=build /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml ./

ENV NODE_ENV=production
EXPOSE 3000
WORKDIR /app/webapp
CMD ["sh", "-c", "../node_modules/.bin/next start -p ${PORT:-3000}"]
