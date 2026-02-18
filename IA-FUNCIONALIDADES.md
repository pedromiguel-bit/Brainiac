# 🤖 Funcionalidades de IA - Segundo Cérebro

## ✨ Integração com Claude API

O app agora possui **inteligência artificial integrada** usando a API da Anthropic Claude!

---

## 🎯 Funcionalidades Disponíveis

### 1. 🗣️ **Comandos em Linguagem Natural**

Agora você pode digitar comandos como se estivesse falando naturalmente:

**Antes (sintaxe rígida):**
```
Pedro 10/02 - Revisar código [alta]
```

**Agora (linguagem natural):**
```
"Preciso que o Pedro revise o código amanhã com alta prioridade"
"Lembrar de fazer deploy em produção no dia 15"
"O Walter precisa conversar com o cliente Monnaie essa semana"
```

A IA entende e converte automaticamente para tarefas estruturadas!

---

### 2. 📄 **Análise Inteligente de Documentos**

Quando você faz upload de um documento, a IA:

- ✅ Cria um **resumo executivo** (3-5 pontos principais)
- ✅ Sugere **tarefas** baseadas no conteúdo
- ✅ Recomenda **tags** relevantes
- ✅ Indica a **prioridade** sugerida

**Exemplo:**
- Upload: "Ata da reunião com cliente X"
- IA extrai: "Follow-up com cliente", "Enviar proposta", "Agendar próxima call"

---

### 3. 🎯 **Priorização Inteligente**

A IA analisa todas as suas tarefas e sugere prioridades baseado em:

- ⏰ **Urgência** (prazos próximos)
- 💡 **Importância** (impacto no projeto)
- 🔗 **Dependências** (o que bloqueia outras tarefas)

**Exemplo:**
```
"Deploy em produção" → ALTA (bloqueia outras tarefas)
"Atualizar documentação" → MÉDIA (importante mas não urgente)
"Limpar código antigo" → NORMAL (pode esperar)
```

---

### 4. 📊 **Resumo Diário Inteligente**

A IA gera um resumo motivacional do seu dia:

**Exemplo:**
> "Bom dia! Você tem 5 tarefas para hoje, sendo 2 de alta prioridade.
> Foque primeiro no deploy do Walter e na reunião com Monnaie.
> Você já concluiu 8 tarefas ontem, está indo muito bem! 💪"

---

### 5. ✉️ **Extração de Tarefas de Texto Livre**

Cole qualquer texto (email, ata de reunião, notas) e a IA extrai as tarefas:

**Exemplo de entrada:**
```
Reunião com time:
- Pedro vai revisar o PR até sexta
- Walter precisa atualizar o dashboard
- Todos devem participar da retrospectiva na quinta
```

**Saída:**
- ✅ Pedro - Revisar PR (sexta-feira) [alta]
- ✅ Walter - Atualizar dashboard [média]
- ✅ Todos - Retrospectiva (quinta-feira) [normal]

---

### 6. ✍️ **Melhoria Automática de Descrições**

A IA torna descrições vagas em tarefas claras e acionáveis:

**Antes:**
- "mexer no código"
- "falar com cliente"
- "fazer aquela coisa"

**Depois (melhorado pela IA):**
- "Refatorar módulo de autenticação removendo código duplicado"
- "Agendar call de alinhamento com cliente sobre requisitos do projeto"
- "Implementar validação de formulário conforme especificação"

---

## 🚀 Como Usar

### Modo IA Ativado

A IA funciona automaticamente quando você:

1. **Digita comandos em linguagem natural** no campo de tarefas
2. **Faz upload de documentos** (análise automática)
3. **Clica em "Sugerir Prioridades"** (botão novo)
4. **Visualiza o dashboard** (resumo diário)

### Desativar IA Temporariamente

Se quiser usar apenas o parser tradicional:
- Use a sintaxe rígida: `Pessoa Data - Descrição [Prioridade]`
- A IA só é acionada para linguagem natural

---

## ⚙️ Configuração

A IA está configurada para usar:

- **Modelo:** Claude 3.5 Sonnet (mais inteligente)
- **API Key:** Armazenada em `.env` (seguro)
- **Fallback:** Se IA falhar, usa parser tradicional

---

## 🔒 Privacidade e Segurança

### ✅ Seus dados estão seguros:

1. **API Key local** - Armazenada apenas no seu computador
2. **Sem tracking** - Nenhum dado enviado para outros servidores além da Anthropic
3. **Cache local** - Tarefas e documentos ficam no localStorage
4. **Processamento sob demanda** - IA só processa quando você solicita

### ⚠️ O que a IA processa:

- ✅ Texto que você digita nos comandos
- ✅ Conteúdo de documentos que você faz upload
- ✅ Lista de tarefas para priorização
- ❌ **NÃO** processa automaticamente tudo
- ❌ **NÃO** envia dados sem sua ação

---

## 💡 Dicas de Uso

### 1. **Comandos Naturais Funcionam Melhor Com Contexto:**

❌ Ruim: "fazer coisa"
✅ Bom: "preciso que o Pedro faça code review do módulo de pagamentos até sexta com alta prioridade"

### 2. **Documentos Estruturados Geram Melhores Tarefas:**

- Atas de reunião com tópicos claros
- Emails com action items destacados
- Notas organizadas por seções

### 3. **Use a Priorização Inteligente:**

- Toda segunda-feira para planejar a semana
- Quando tiver muitas tarefas acumuladas
- Antes de reuniões de planejamento

### 4. **Aproveite o Resumo Diário:**

- Primeira coisa pela manhã
- Depois de adicionar novas tarefas
- Para compartilhar com o time

---

## 🎓 Exemplos Práticos

### Exemplo 1: Reunião de Cliente

**Digite:**
```
"Tivemos reunião com Monnaie. O Pedro precisa enviar a proposta até quinta.
Walter vai preparar o dashboard novo. Todos devemos participar da demo na sexta."
```

**IA cria:**
- Pedro - Enviar proposta para Monnaie (quinta-feira) [alta]
- Walter - Preparar dashboard novo [média]
- Todos - Demo (sexta-feira) [alta]

### Exemplo 2: Email com Tasks

**Cole no extrator:**
```
Oi time,

Após nossa call de hoje:
- Precisamos corrigir o bug de login urgente
- Atualizar a documentação da API pode esperar
- Deploy está marcado para terça que vem

Abs!
```

**IA extrai:**
- Bug de login [alta]
- Atualizar documentação API [normal]
- Deploy (terça-feira) [média]

### Exemplo 3: Planejamento da Sprint

**Use "Sugerir Prioridades" com estas tarefas:**
1. Implementar feature X
2. Fix bug crítico de produção
3. Reunião de planejamento
4. Code review
5. Atualizar dependências

**IA sugere:**
1. Fix bug crítico → ALTA (produção afetada)
2. Reunião de planejamento → ALTA (bloqueia outras tasks)
3. Implementar feature X → MÉDIA (importante mas pode aguardar fix)
4. Code review → MÉDIA (libera deploy)
5. Atualizar dependências → NORMAL (manutenção)

---

## 📈 Benefícios

### ⏱️ **Economia de Tempo:**
- **Antes:** 30 segundos para adicionar uma tarefa
- **Agora:** 5 segundos (fala naturalmente)

### 🎯 **Maior Clareza:**
- Descrições vagas se tornam acionáveis
- Prioridades sugeridas baseadas em dados

### 🧠 **Inteligência Contextual:**
- IA entende contexto de projetos
- Sugere ações baseadas em padrões

### 📊 **Melhor Planejamento:**
- Resumos executivos automáticos
- Priorização baseada em critérios múltiplos

---

## 🆘 Troubleshooting

### ❓ IA não está funcionando

**Verifique:**
1. Arquivo `.env` existe com a API key
2. Internet está conectada
3. API key é válida (console.anthropic.com)

### ❓ Respostas estranhas da IA

**Solução:**
- Seja mais específico nos comandos
- Use linguagem clara e objetiva
- Mencione pessoa, data e prioridade explicitamente

### ❓ IA está lenta

**Normal:**
- Primeira chamada pode demorar 2-5 segundos
- Análise de documentos grandes: até 10 segundos
- Use o parser tradicional para adições rápidas

---

## 🚀 Roadmap Futuro

Features de IA planejadas:

- [ ] Sugestões de horários ideais para tarefas
- [ ] Detecção de conflitos de agenda
- [ ] Geração de relatórios automáticos
- [ ] Sugestões proativas de tarefas
- [ ] Integração com calendário
- [ ] Voice input (comandos por voz)
- [ ] Análise de produtividade com insights

---

## 💰 Custos da API

**Uso estimado:**

- Comando natural: ~$0.001 por comando
- Análise de documento: ~$0.003 por documento
- Sugestão de prioridades: ~$0.002 por análise
- Uso mensal estimado: **$1-5** (uso moderado)

**Dica:** A IA só é chamada quando você usa explicitamente. O parser tradicional é grátis!

---

**Desenvolvido com ❤️ e 🤖 para maximizar sua produtividade!**
