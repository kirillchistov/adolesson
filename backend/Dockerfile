# Образ API общего стола. Контекст сборки — корень репозитория:
# docker build -f backend/Dockerfile -t adolesson-api .
FROM node:22-alpine
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --omit=dev --prefix backend

COPY docs/api/openapi.yaml ./docs/api/openapi.yaml
COPY backend/src ./backend/src
COPY backend/migrations ./backend/migrations

WORKDIR /app/backend
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5001
EXPOSE 5001
USER node
CMD ["node", "src/index.js"]
