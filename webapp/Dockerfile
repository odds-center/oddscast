# Build and run Next.js webapp (monorepo: needs shared package).
# Build from repo root: docker build -f webapp/Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace
COPY . .

# Install all workspace deps
RUN pnpm install --frozen-lockfile

# shared/dist is pre-built and committed to git.
# Explicitly link @oddscast/shared into webapp node_modules for TypeScript resolution.
RUN mkdir -p /app/webapp/node_modules/@oddscast && \
    rm -rf /app/webapp/node_modules/@oddscast/shared && \
    ln -s /app/shared /app/webapp/node_modules/@oddscast/shared

# Build webapp
WORKDIR /app/webapp
RUN pnpm run build

# Run production webapp (PORT injected by Railway, defaults to 3000)
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/next start -p ${PORT:-3000}"]
