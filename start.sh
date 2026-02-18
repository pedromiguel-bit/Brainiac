#!/bin/sh

echo "🚀 Iniciando Segundo Cérebro (Debug Mode)..."
echo "📂 Diretório atual: $(pwd)"
echo "👤 Usuário: $(whoami)"
echo "📦 Conteúdo do diretório:"
ls -la

echo "🔧 Variáveis de ambiente (filtradas):"
env | grep -v "KEY" | grep -v "SECRET"

echo "⏳ Iniciando servidor na porta ${PORT:-3000}..."

# Executa o servidor e captura qualquer erro
node server.js

EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ Servidor crashou com código $EXIT_CODE"
    echo "🛑 Mantendo container vivo para debug..."
    # Loop infinito para permitir leitura de logs e exec no container
    while true; do sleep 1000; done
else
    echo "✅ Servidor finalizou normalmente (SIGTERM/SIGINT recebido)"
fi
