// ============================================================================
// AI SERVICE - Integração com Claude API
// ============================================================================

const Anthropic = require('@anthropic-ai/sdk');

class AIService {
  constructor() {
    const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não está definida nas variáveis de ambiente');
    }
    this.client = new Anthropic({ apiKey });
    console.log('✓ AIService inicializado (key: ' + apiKey.substring(0, 12) + '...)');
  }

  /**
   * Processa comandos em linguagem natural e converte em tarefas estruturadas
   * Exemplo: "preciso revisar o código do Pedro amanhã com alta prioridade"
   * → { people: ["Pedro"], date: "tomorrow", description: "revisar o código", priority: "high" }
   */
  async parseNaturalLanguage(text, peopleList, projectsList, existingTaskDescriptions = []) {
    try {
      const today = new Date().toLocaleDateString('pt-BR');

      // Contexto de tarefas existentes para evitar duplicatas
      const existingContext = existingTaskDescriptions.length > 0
        ? `\n\nTAREFAS JÁ EXISTENTES NO SISTEMA (evite criar duplicatas):\n${existingTaskDescriptions.slice(0, 50).map((d, i) => `${i + 1}. ${d}`).join('\n')}\n`
        : '';

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Você é um assistente inteligente que interpreta textos em português e os converte em TAREFAS ACIONÁVEIS bem estruturadas para um gerenciador de tarefas.

HOJE É: ${today} (use esta data como base para cálculos)
PESSOAS DISPONÍVEIS: ${peopleList.join(', ')}
PROJETOS DISPONÍVEIS: ${projectsList.map(p => p.name).join(', ')}${existingContext}

═══════════════════════════════════════════════════
REGRA #1 — ENTENDER O CONTEXTO ANTES DE CRIAR TAREFAS
═══════════════════════════════════════════════════

NÃO trate cada linha como uma tarefa separada. Primeiro entenda O QUE o texto está descrevendo:
- Se é uma lista de CAMPOS/ATRIBUTOS de um sistema → agrupe tudo em UMA tarefa como "Implementar campos X, Y, Z no sistema"
- Se é uma lista de FUNCIONALIDADES → agrupe por área em poucas tarefas contextualizadas
- Se é uma ata de REUNIÃO → extraia apenas as AÇÕES decididas, não os tópicos discutidos
- Se é um CHECKLIST com "- [ ]" → cada item É uma tarefa separada
- Se são TAREFAS EXPLÍCITAS ("fazer X", "enviar Y") → cada uma é uma tarefa

═══════════════════════════════════════════════════
REGRA #2 — MULTI-PESSOAS E MULTI-PROJETOS (COLLABORATIVE)
═══════════════════════════════════════════════════

PESSOAS ("people"):
- Extraia TODAS as pessoas mencionadas como responsáveis.
- Ex: "Pedro e Walter revisar" → people: ["Pedro", "Walter"]
- Ex: "Todos revisar" → people: [todos nomes da lista]
- Se não especificar → people: ["${peopleList[0]}"]

PROJETOS ("projects"):
- Extraia TODOS os clientes/projetos citados.
- Ex: "Fazer post para Lefer e Vizary" → projects: ["Lefer", "Vizary"]
- A tarefa será "multicliente".
- Se o projeto não existe na lista, extraia assim mesmo (será criado).

═══════════════════════════════════════════════════
REGRA #3 — PRAZOS E FOLLOW-UPS
═══════════════════════════════════════════════════

Se pedir prazo LONGO + "FOLLOW-UP"/"CHECK" periódico:
1. Tarefa Principal (prazo final)
2. Tarefas de Follow-up (datas intermediárias) com tag "follow"

═══════════════════════════════════════════════════
REGRA #4 — EVITAR DUPLICATAS
═══════════════════════════════════════════════════

Se a lista de "TAREFAS JÁ EXISTENTES NO SISTEMA" foi fornecida:
- Compare cada tarefa que você criaria com as existentes
- Se uma tarefa muito similar já existe (>70% parecida), NÃO a crie
- Se o texto menciona algo que já é uma tarefa existente, pule-a
- Foque em criar apenas tarefas NOVAS que não existem ainda

═══════════════════════════════════════════════════
REGRA #5 — CORREÇÃO DE NOMES (FUZZY MATCH)
═══════════════════════════════════════════════════

Você deve corrigir automaticamente erros de digitação nos nomes de PESSOAS e PROJETOS baseando-se nas listas fornecidas.

PESSOAS:
- "Hualter", "Valter" → converter para "Walter" (se "Walter" estiver na lista de pessoas)
- "Pdro", "Perdro" → converter para "Pedro"
- USE APENAS OS NOMES DA LISTA "PESSOAS DISPONÍVEIS" se houver similaridade fonética ou de grafia.

PROJETOS:
- "Vizari", "Visary" → converter para "Vizary"
- "Lefe", "Leffer" → converter para "Lefer"

SEMPRE use a grafia correta fornecida nas listas de "Disponíveis".

═══════════════════════════════════════════════════
EXEMPLOS
═══════════════════════════════════════════════════
Entrada: "Pedro e Walter precisam entregar o relatório da Lefer e Monnaie até sexta"
Saída: [
  {
    "description": "Entregar relatório consolidado",
    "people": ["Pedro", "Walter"],
    "projects": ["Lefer", "Monnaie"],
    "date": "sexta-feira (data)",
    "priority": "normal"
  }
]

═══════════════════════════════════════════════════

AGORA PROCESSE O TEXTO ABAIXO:

${text}

RETORNE APENAS JSON VÁLIDO (sem markdown, sem explicações):
{
  "tasks": [
    {
      "people": ["nome1", "nome2"],
      "date": "DD/MM ou 'hoje'",
      "description": "descrição acionável e contextualizada",
      "priority": "high|medium|normal",
      "projects": ["proj1", "proj2"],
      "tags": ["tag1", "tag2"]
    }
  ]
}`
        }]
      });

      const response = message.content[0].text.trim();
      console.log('🤖 RAW AI RESPONSE:', response);

      // Tenta extrair JSON se houver texto extra
      let jsonText = response;
      if (response.includes('```')) {
        const match = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (match) jsonText = match[1];
      }

      const parsed = JSON.parse(jsonText);
      console.log('✓ JSON parseado:', parsed);

      return parsed.tasks || [];
    } catch (error) {
      console.error('❌ Erro ao processar com IA:', error);
      console.error('Resposta recebida:', error.response || error.message);
      return null;
    }
  }

  /**
   * Analisa um documento e extrai insights importantes
   */
  async analyzeDocument(content, documentName) {
    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `Analise o seguinte documento e forneça:

1. RESUMO (3-5 pontos principais)
2. TAREFAS SUGERIDAS (ações que devem ser tomadas baseado no conteúdo)
3. TAGS SUGERIDAS (palavras-chave para categorização)
4. PRIORIDADE SUGERIDA (alta/média/normal)

DOCUMENTO: ${documentName}

CONTEÚDO:
${content.substring(0, 10000)}

FORMATO DE SAÍDA (JSON):
{
  "summary": ["ponto 1", "ponto 2", ...],
  "suggested_tasks": [
    {
      "description": "descrição da tarefa",
      "priority": "alta|média|normal"
    }
  ],
  "tags": ["tag1", "tag2", ...],
  "priority": "alta|média|normal"
}

IMPORTANTE: Retorne APENAS o JSON, sem explicações.`
        }]
      });

      const response = message.content[0].text;
      return JSON.parse(response);
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
      return null;
    }
  }

  /**
   * Sugere priorização inteligente de tarefas
   */
  async suggestPriorities(tasks) {
    try {
      const tasksText = tasks.map((t, i) =>
        `${i + 1}. [${t.person}] ${t.description} - ${t.date}`
      ).join('\n');

      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analise as seguintes tarefas e sugira prioridades baseado em:
- Urgência (prazos próximos)
- Importância (impacto)
- Dependências (o que bloqueia outras tarefas)

TAREFAS:
${tasksText}

FORMATO DE SAÍDA (JSON):
{
  "recommendations": [
    {
      "task_index": 1,
      "suggested_priority": "alta|média|normal",
      "reason": "motivo da priorização"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem explicações.`
        }]
      });

      const response = message.content[0].text;
      return JSON.parse(response);
    } catch (error) {
      console.error('Erro ao sugerir prioridades:', error);
      return null;
    }
  }

  /**
   * Gera resumo diário de tarefas
   */
  async generateDailySummary(todayTasks, overdueTasks, completedTasks) {
    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Crie um resumo executivo do dia de trabalho:

TAREFAS HOJE: ${todayTasks.length}
TAREFAS ATRASADAS: ${overdueTasks.length}
TAREFAS CONCLUÍDAS: ${completedTasks.length}

Gere um resumo motivacional e prático em 2-3 frases curtas.`
        }]
      });

      return message.content[0].text;
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return null;
    }
  }

  /**
   * Extrai tarefas de um texto livre (reunião, email, etc)
   */
  async extractTasksFromText(text) {
    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Extraia todas as tarefas/ações mencionadas no seguinte texto.
Identifique: responsável (se mencionado), prazo (se mencionado), e descrição.

TEXTO:
${text}

FORMATO DE SAÍDA (JSON):
{
  "tasks": [
    {
      "description": "descrição da tarefa",
      "person": "nome da pessoa (ou null)",
      "date": "data mencionada (ou null)",
      "priority": "alta|média|normal"
    }
  ]
}

IMPORTANTE: Retorne APENAS o JSON, sem explicações.`
        }]
      });

      const response = message.content[0].text;
      return JSON.parse(response);
    } catch (error) {
      console.error('Erro ao extrair tarefas:', error);
      return null;
    }
  }

  /**
   * Melhora a descrição de uma tarefa
   */
  async improveTaskDescription(description) {
    try {
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        messages: [{
          role: 'user',
          content: `Melhore esta descrição de tarefa tornando-a mais clara, específica e acionável, mantendo o sentido original:

"${description}"

Retorne APENAS a descrição melhorada, sem explicações.`
        }]
      });

      return message.content[0].text.trim();
    } catch (error) {
      console.error('Erro ao melhorar descrição:', error);
      return description;
    }
  }
  async analyzeImage(imageBase64, mimeType, peopleList, projectsList) {
    try {
      const today = new Date().toLocaleDateString('pt-BR');
      const message = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: `Analise esta imagem e extraia TODAS as tarefas, ações ou itens de trabalho visíveis.

HOJE É: ${today}
PESSOAS DISPONÍVEIS: ${peopleList.join(', ')}
PROJETOS DISPONÍVEIS: ${projectsList.map(p => typeof p === 'string' ? p : p.name).join(', ')}

Tipos de conteúdo que você pode encontrar:
- Screenshots de emails, chats (WhatsApp, Slack, Teams)
- Fotos de quadros brancos ou post-its
- Screenshots de planilhas ou documentos
- Anotações manuscritas
- Qualquer texto com ações/tarefas

RETORNE APENAS JSON VÁLIDO (sem markdown, sem explicação):
{
  "tasks": [
    {
      "people": ["nome1"],
      "date": "YYYY-MM-DD",
      "description": "descrição clara da tarefa",
      "priority": "high|medium|normal",
      "projects": ["proj1"],
      "tags": ["tag1"]
    }
  ],
  "rawText": "texto extraído da imagem (resumo)"
}`
            }
          ]
        }]
      });

      const response = message.content[0].text.trim();
      let jsonText = response;
      if (response.includes('```')) {
        const match = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match) jsonText = match[1];
      }
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      return null;
    }
  }
}

module.exports = AIService;
