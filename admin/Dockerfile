# Multi-stage build for Next.js admin (monorepo: needs shared package).
# Build from repo root: docker build -f admin/Dockerfile .

# ── Stage 1: Install deps + Build ──
FROM node:24-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy package manifests first for layer caching
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY admin/package.json admin/
COPY shared/package.json shared/

RUN pnpm install --frozen-lockfile

# Copy source
COPY shared/ shared/
COPY admin/ admin/

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

# ── Stage 2: Production runtime ──
FROM node:24-alpine AS prod
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace deps + build output (pnpm hoists to root node_modules)
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/admin admin
COPY --from=build /app/shared shared
COPY --from=build /app/pnpm-workspace.yaml /app/package.json /app/pnpm-lock.yaml ./

ENV NODE_ENV=production
EXPOSE 3002
WORKDIR /app/admin
CMD ["sh", "-c", "../node_modules/.bin/next start -p ${PORT:-3002}"]
