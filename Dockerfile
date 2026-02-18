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

EXPOSE 80

# EasyPanel gerencia health checks — não precisa do Docker HEALTHCHECK

CMD ["node", "server.js"]
