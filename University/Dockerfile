# ---------- Base ----------
FROM node:20-alpine AS base
WORKDIR /app

# ---------- Dependencies ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# ---------- Build ----------
FROM base AS builder

# 👇 IMPORTANT: Build argument with default /api
ENV NEXT_PUBLIC_GO_API_URL=https://api.cloudlab.works
ENV NEXT_PUBLIC_API_URL=https://api.cloudlab.works
ENV NEXT_PUBLIC_SERPER_API_URL=https://api.cloudlab.works
ENV NEXT_PUBLIC_SCRAPER_API_URL=https://api.cloudlab.works/api/scraper

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g pnpm
RUN pnpm build

# ---------- Runner ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# 👇 IMPORTANT: Also set in runtime
ENV NEXT_PUBLIC_GO_API_URL=https://api.cloudlab.works
ENV NEXT_PUBLIC_API_URL=https://api.cloudlab.works
ENV NEXT_PUBLIC_SERPER_API_URL=https://api.cloudlab.works
ENV NEXT_PUBLIC_SCRAPER_API_URL=https://api.cloudlab.works/api/scraper

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN npm install -g pnpm

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["pnpm", "start"]
