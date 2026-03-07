# Build and run Next.js webapp (monorepo: needs shared package).
# Build from repo root: docker build -f webapp/Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace
COPY . .

# Install all workspace deps
RUN pnpm install --frozen-lockfile

# Build shared first (webapp depends on @oddscast/shared types)
WORKDIR /app/shared
RUN pnpm run build

# Build webapp
WORKDIR /app/webapp
RUN pnpm run build

# Run production webapp (PORT from env; Railway injects PORT)
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
