# Build and run NestJS server (monorepo: needs shared package).
# Build from repo root: docker build -f server/Dockerfile .

FROM node:20-alpine AS base
RUN apk add --no-cache python3 py3-numpy py3-pandas && \
    python3 --version && \
    which python3
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace ( .dockerignore excludes node_modules, .git, dist, .next, etc.)
COPY . .

# Install all workspace deps (required for pnpm workspace resolution)
RUN pnpm install --frozen-lockfile

# shared/dist is pre-built and committed to git.
# Explicitly link @oddscast/shared into server node_modules for TypeScript resolution.
RUN mkdir -p /app/server/node_modules/@oddscast && \
    rm -rf /app/server/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/server/node_modules/@oddscast/shared

# Build server
WORKDIR /app
RUN pnpm --filter server build

# Run production server (PORT from env; Railway injects PORT)
WORKDIR /app/server
ENV NODE_ENV=production
ENV PYTHON_BIN=/usr/bin/python3
EXPOSE 3000
CMD ["node", "dist/main"]
