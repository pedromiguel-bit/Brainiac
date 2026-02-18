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
COPY start.sh ./
RUN chmod +x start.sh

# Copiar frontend (versão web)
COPY public/ ./public/
COPY renderer.js ./public/renderer.js
COPY styles.css ./public/styles.css
COPY icon.png ./public/icon.png

# Diretório de dados persistentes (montar volume no EasyPanel)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000

# Usar script de debug para evitar restart loop
CMD ["./start.sh"]
