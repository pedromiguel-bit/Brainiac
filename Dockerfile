# ============================================================================
# Dockerfile - Segundo Cérebro (Web App para EasyPanel / VPS)
# ============================================================================

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copiar package.json e instalar dependências
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copiar backend
COPY server.js ./
COPY ai-service.js ./
COPY google-sheets-service.js ./

# Copiar frontend (versão web)
COPY public/ ./public/
COPY renderer.js ./public/renderer.js
COPY styles.css ./public/styles.css
COPY icon.png ./public/icon.png

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
