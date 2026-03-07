# Build and run NestJS server (monorepo: needs shared package).
# Build from repo root: docker build -f server/Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace ( .dockerignore excludes node_modules, .git, dist, .next, etc.)
COPY . .

# Install all workspace deps (required for pnpm workspace resolution)
RUN pnpm install --frozen-lockfile

# Build shared package (creates dist/types/index.d.ts and dist/types/index.js)
WORKDIR /app/shared
RUN pnpm exec tsc -p tsconfig.build.json

# Explicitly link @oddscast/shared into server node_modules for TypeScript resolution
RUN mkdir -p /app/server/node_modules/@oddscast && \
    rm -rf /app/server/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/server/node_modules/@oddscast/shared

# Build server
WORKDIR /app
RUN pnpm --filter server build

# Run production server (PORT from env; Railway injects PORT)
WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
