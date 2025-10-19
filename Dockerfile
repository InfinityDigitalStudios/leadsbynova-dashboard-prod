# ---- Base image (build + runtime dependencies) ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies layer ----
FROM base AS deps
RUN apk add --no-cache libc6-compat
# copy only lockfiles/package.json for caching
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Build layer ----
FROM deps AS build
COPY . .
# your package.json builds client with vite and server with esbuild
ENV NODE_OPTIONS="--max-old-space-size=1536"
RUN npm run build

# ---- Runtime layer ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# only what we need at runtime
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app ./

EXPOSE 3000
# uses "start": "NODE_ENV=production node dist/index.js"
CMD ["npm", "start"]
