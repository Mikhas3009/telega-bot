# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22
ARG PNPM_VERSION=9.12.0

FROM node:${NODE_VERSION}-alpine AS pruner
ARG PNPM_VERSION
RUN apk add --no-cache git \
 && corepack enable \
 && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@2 prune notification-service --docker


FROM node:${NODE_VERSION}-alpine AS deps
ARG PNPM_VERSION
RUN corepack enable \
 && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM node:${NODE_VERSION}-alpine AS dev
ARG PNPM_VERSION
RUN corepack enable \
 && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app
COPY --from=deps /app/ ./
COPY --from=pruner /repo/out/full/ ./
COPY --from=pruner /repo/tsconfig.base.json ./tsconfig.base.json
EXPOSE 3002
CMD ["pnpm", "--filter", "notification-service", "dev"]

FROM node:${NODE_VERSION}-alpine AS runner
RUN apk add --no-cache wget \
 && addgroup -g 1001 -S nodejs \
 && adduser -u 1001 -S nestjs -G nodejs
WORKDIR /app

COPY --from=deps --chown=nestjs:nodejs /app/ ./
COPY --from=pruner --chown=nestjs:nodejs /repo/out/full/ ./
COPY --from=pruner --chown=nestjs:nodejs /repo/tsconfig.base.json ./tsconfig.base.json

USER nestjs
ENV NODE_ENV=production
EXPOSE 3002
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3002/health/live || exit 1

WORKDIR /app/apps/notification-service
CMD ["node", "--import", "@swc-node/register/esm-register", "src/main.ts"]
