# Build and run Next.js admin (monorepo: needs shared package).
# Build from repo root: docker build -f admin/Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace
COPY . .

# Install all workspace deps
RUN pnpm install --frozen-lockfile

# Explicitly link @oddscast/shared into admin node_modules for TypeScript resolution.
RUN mkdir -p /app/admin/node_modules/@oddscast && \
    rm -rf /app/admin/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/admin/node_modules/@oddscast/shared

# Build admin — Railway injects service env vars as Docker build args.
# NEXT_PUBLIC_* must be available at build time for Next.js to inline them.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ADMIN_API_URL
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN

WORKDIR /app/admin
RUN pnpm run build

# Run production admin (PORT injected by Railway, defaults to 3002)
ENV NODE_ENV=production
EXPOSE 3002
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-3002}"]
