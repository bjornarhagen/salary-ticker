FROM oven/bun:latest AS build

WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock* ./
RUN bun install

COPY . .
RUN bun run build

FROM oven/bun:latest AS deploy

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

COPY --from=build /app/dist ./dist
COPY server.ts ./

EXPOSE 8080

CMD ["bun", "server.ts"]
