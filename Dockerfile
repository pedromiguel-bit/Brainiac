# ============================================================================
# Dockerfile - Segundo Cérebro (Web Version para EasyPanel)
# ============================================================================

FROM node:20-alpine

WORKDIR /app

# Copiar package.json para cache de dependências
COPY package.json ./

# Instalar apenas dependências de produção (sem electron/electron-builder)
RUN npm install --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copiar código do servidor e serviços backend
COPY server.js ./
COPY ai-service.js ./
COPY google-sheets-service.js ./
COPY .env.example ./

# Copiar arquivos do frontend (versão web)
COPY public/ ./public/

# Copiar renderer.js e styles.css para a pasta public
COPY renderer.js ./public/renderer.js
COPY styles.css ./public/styles.css
COPY icon.png ./public/icon.png

# O .env NÃO é copiado - configure as variáveis de ambiente no EasyPanel
# Copiar google-credentials.json se existir (o [n] torna opcional)
COPY google-credentials.jso[n] ./

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Iniciar servidor
CMD ["node", "server.js"]
