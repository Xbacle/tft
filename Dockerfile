# ---------- Build stage ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- Runtime stage ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY server.js ./
COPY server ./server
COPY --from=build /app/dist ./dist

# Dữ liệu JSON nằm sẵn trong dist (được copy từ public/data khi build).
# Khi cập nhật data: thay file trong public/data rồi build lại image (hoặc xem DEPLOY.md cách hot-swap).
EXPOSE 3000
CMD ["node", "server.js"]
