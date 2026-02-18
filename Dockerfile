# ============================================================================
# Dockerfile - Segundo Cérebro (Web Version para EasyPanel)
# ============================================================================

FROM node:20-alpine

WORKDIR /app

# Variáveis de ambiente de produção
ENV NODE_ENV=production

# Copiar package.json para cache de dependências
COPY package.json ./

# Instalar dependências de produção (sem electron/electron-builder)
RUN npm install --omit=dev && npm cache clean --force

# Copiar código do servidor e serviços backend
COPY server.js ./
COPY ai-service.js ./
COPY google-sheets-service.js ./
COPY .env.example ./

# Copiar arquivos do frontend (versão web)
COPY public/ ./public/

# Copiar renderer.js, styles.css e icon para public/
COPY renderer.js ./public/renderer.js
COPY styles.css ./public/styles.css
COPY icon.png ./public/icon.png

# NÃO copiar .env — configure variáveis de ambiente no EasyPanel

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Iniciar servidor
CMD ["node", "server.js"]
