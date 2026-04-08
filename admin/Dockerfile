# Next.js standalone Docker build (monorepo: needs shared package).
# Build from repo root: docker build -f admin/Dockerfile .

FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace manifests for layer caching
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

# Production stage — standalone needs no node_modules
FROM node:24-alpine AS prod
WORKDIR /app

COPY --from=base /app/admin/.next/standalone ./
COPY --from=base /app/admin/public ./admin/public
COPY --from=base /app/admin/.next/static ./admin/.next/static

ENV NODE_ENV=production
EXPOSE 3002
CMD ["node", "admin/server.js"]
