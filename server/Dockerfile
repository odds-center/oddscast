# Build and run NestJS server (monorepo: needs shared package).
# Build from repo root: docker build -f server/Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace ( .dockerignore excludes node_modules, .git, dist, .next, etc.)
COPY . .

# Install all workspace deps (required for pnpm workspace resolution)
RUN pnpm install --frozen-lockfile

# Build only shared and server
RUN pnpm --filter @oddscast/shared build
RUN pnpm --filter server build

# Run production server (PORT from env; Railway injects PORT)
WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main"]
