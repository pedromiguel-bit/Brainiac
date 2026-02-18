╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║              🧠 SEGUNDO CÉREBRO - TASK MANAGER DESKTOP                   ║
║                                                                           ║
║              Sistema de Gerenciamento de Tarefas e Memória               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

📌 BEM-VINDO!

Este é um sistema completo de gerenciamento de tarefas com memória de contexto,
desenvolvido para rodar como aplicação desktop no Windows.

═══════════════════════════════════════════════════════════════════════════════
⚡ INSTALAÇÃO E USO (MAIS RÁPIDO)
═══════════════════════════════════════════════════════════════════════════════

Opção 1 - Scripts Automáticos (RECOMENDADO):
   1. Clique duas vezes em: instalar.bat
   2. Aguarde a instalação terminar
   3. Clique duas vezes em: executar.bat
   4. Pronto! ✓

Opção 2 - Manual (Via Terminal):
   1. Abra o terminal nesta pasta
   2. Digite: npm install
   3. Digite: npm start
   4. Pronto! ✓

═══════════════════════════════════════════════════════════════════════════════
📚 DOCUMENTAÇÃO DISPONÍVEL
═══════════════════════════════════════════════════════════════════════════════

Para começar rápido:
   → INICIO-RAPIDO.md (2 minutos de leitura)

Para instalação detalhada:
   → INSTALACAO.md (guia passo a passo)

Documentação completa:
   → README.md (todas as funcionalidades)

Exemplos práticos:
   → exemplos-comandos.txt (comandos prontos)
   → exemplo-checklist.md (para importar)

═══════════════════════════════════════════════════════════════════════════════
🎯 PRINCIPAIS FUNCIONALIDADES
═══════════════════════════════════════════════════════════════════════════════

✅ Adicionar tarefas via comandos rápidos
   Exemplo: "Pedro hoje - Revisar código [alta]"

✅ Importar checklists markdown
   Importe arquivos .md com múltiplas tarefas

✅ Upload de documentos (PDF, TXT, MD)
   Mantenha contexto de projetos e reuniões

✅ Filtros avançados
   Filtre por pessoa, data, prioridade, projeto, tags

✅ Dashboard com métricas
   Veja tarefas do dia, atrasadas, taxa de conclusão

✅ Export/Import de dados
   Faça backup e restaure quando necessário

✅ Atalhos de teclado
   Ctrl+K, Ctrl+N, Ctrl+F para máxima produtividade

═══════════════════════════════════════════════════════════════════════════════
🎨 EXEMPLO RÁPIDO
═══════════════════════════════════════════════════════════════════════════════

Após abrir a aplicação, digite no campo de comandos:

   Walter hoje - Revisar PRs pendentes [alta]
   Pedro amanhã - Call com cliente Monnaie @Monnaie
   Paulo 15/02 - Otimizar queries do banco [média] #performance

Clique em "Processar Comandos" → 3 tarefas criadas! 🎉

═══════════════════════════════════════════════════════════════════════════════
📁 ESTRUTURA DE ARQUIVOS
═══════════════════════════════════════════════════════════════════════════════

📄 Aplicação:
   ├── main.js              (Electron - processo principal)
   ├── index.html           (HTML base)
   ├── renderer.js          (Lógica da aplicação)
   └── styles.css           (Estilos)

📖 Documentação:
   ├── README.md            (Completo)
   ├── INSTALACAO.md        (Passo a passo)
   ├── INICIO-RAPIDO.md     (2 minutos)
   └── LEIA-ME-PRIMEIRO.txt (Este arquivo)

📝 Exemplos:
   ├── exemplos-comandos.txt    (Sintaxe de comandos)
   └── exemplo-checklist.md     (Checklist para importar)

⚙️ Scripts:
   ├── instalar.bat         (Instala dependências)
   ├── executar.bat         (Executa a aplicação)
   └── package.json         (Configuração)

═══════════════════════════════════════════════════════════════════════════════
💡 COMANDOS ÚTEIS
═══════════════════════════════════════════════════════════════════════════════

Via Scripts (Windows):
   instalar.bat     → Instala as dependências
   executar.bat     → Executa a aplicação

Via Terminal:
   npm install      → Instala as dependências
   npm start        → Executa a aplicação
   npm run build    → Gera executável .exe

═══════════════════════════════════════════════════════════════════════════════
⌨️ ATALHOS DE TECLADO
═══════════════════════════════════════════════════════════════════════════════

   Ctrl + K    →  Focus no campo de comandos rápidos
   Ctrl + N    →  Abrir formulário de nova tarefa
   Ctrl + F    →  Focus na busca
   Esc         →  Fechar modals e formulários

═══════════════════════════════════════════════════════════════════════════════
🎯 DADOS PRÉ-CONFIGURADOS
═══════════════════════════════════════════════════════════════════════════════

Pessoas:
   • Walter
   • Pedro
   • Paulo

Projetos:
   • Monnaie (Active)
   • HS Golden (Active)
   • Marthan (Active)
   • Multimax (Active)
   • Big Credit (Implementation)
   • Ozox (Implementation)

Você pode adicionar/remover pessoas e projetos em ⚙️ Configurações

═══════════════════════════════════════════════════════════════════════════════
🆘 SUPORTE E PROBLEMAS
═══════════════════════════════════════════════════════════════════════════════

Problema: Node.js não encontrado
   Solução: Instale o Node.js em https://nodejs.org/

Problema: Erro ao instalar
   Solução: Execute "npm cache clean --force" e tente novamente

Problema: Aplicação não abre
   Solução: Execute "instalar.bat" novamente

Para mais detalhes, veja INSTALACAO.md

═══════════════════════════════════════════════════════════════════════════════
🎓 PRÓXIMOS PASSOS
═══════════════════════════════════════════════════════════════════════════════

1. ✅ Instale (instalar.bat ou npm install)
2. ✅ Execute (executar.bat ou npm start)
3. 📖 Leia INICIO-RAPIDO.md (2 minutos)
4. 🧪 Teste com os exemplos
5. 🎨 Personalize pessoas e projetos
6. 🚀 Comece a usar!

═══════════════════════════════════════════════════════════════════════════════
📞 INFORMAÇÕES ADICIONAIS
═══════════════════════════════════════════════════════════════════════════════

Tecnologias:
   • Electron (Desktop App Framework)
   • JavaScript Vanilla
   • CSS3
   • localStorage (Persistência)

Compatibilidade:
   • Windows 10/11
   • Pode funcionar em Mac/Linux (não testado)

Licença:
   • MIT License (uso livre)

Desenvolvido por: Pedro
Versão: 1.0.0

═══════════════════════════════════════════════════════════════════════════════

                    🧠 Maximize sua produtividade!

                      Desenvolvido com ❤️ e ☕

═══════════════════════════════════════════════════════════════════════════════
