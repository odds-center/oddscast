# Next.js standalone Docker build (monorepo: needs shared package).
# Build from repo root: docker build -f webapp/Dockerfile .

FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace manifests for layer caching
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

# Build-time env vars (Railway injects as Docker build args)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WEBAPP_URL
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_APP_ENV
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_AUTH_TOKEN

WORKDIR /app/webapp
RUN pnpm run build

# Production stage — standalone needs no node_modules
FROM node:24-alpine AS prod
WORKDIR /app

COPY --from=base /app/webapp/.next/standalone ./
COPY --from=base /app/webapp/public ./webapp/public
COPY --from=base /app/webapp/.next/static ./webapp/.next/static

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "webapp/server.js"]
