FROM oven/bun:alpine AS dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS build
COPY . .
RUN bun run build

FROM oven/bun:alpine AS runtime-dependencies
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:alpine AS runtime
WORKDIR /app
ENV APP_ENV=production PORT=3000
COPY --from=runtime-dependencies --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/build ./build
COPY --chown=bun:bun package.json monkeyos.identity.json server.ts ./
COPY --chown=bun:bun config ./config
USER bun
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 CMD bun -e 'const r=await fetch("http://127.0.0.1:3000/healthz");if(!r.ok)process.exit(1)'
CMD ["bun", "server.ts"]
