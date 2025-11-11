# ===== Stage 1: Build React (Vite) App =====
FROM node:22.17.0-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build || (echo "Build failed" && exit 1)

# ===== Stage 2: Serve Vite Build =====
FROM node:22.17.0-alpine AS production

WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
