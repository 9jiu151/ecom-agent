FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY web/package.json web/package-lock.json ./web/
RUN npm install --prefix web --no-audit --no-fund
COPY . .
RUN npm run build && npm prune --prefix web --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/web/dist ./web/dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/assets ./assets
RUN mkdir -p data uploads outputs
EXPOSE 3000
CMD ["node", "server/index.js"]
