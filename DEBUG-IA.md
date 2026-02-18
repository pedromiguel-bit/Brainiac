# 🐛 DEBUG - Testando a IA

## ✅ **MELHORIAS IMPLEMENTADAS:**

### 1. **Prompt da IA Melhorado**
- ✅ Mais exemplos práticos
- ✅ Instruções mais claras
- ✅ Melhor extração de JSON

### 2. **Logging Completo**
- ✅ Console mostra TODOS os passos
- ✅ Veja exatamente o que a IA retorna
- ✅ Debug fácil de problemas

### 3. **Botão "Limpar Tudo"**
- ✅ Apaga TODAS as tarefas
- ✅ Perfeito para testes
- ✅ Confirmação antes de apagar

---

## 🧪 **COMO TESTAR:**

### 1. **Abra o DevTools** (já está aberto)
   - Veja a aba "Console"
   - Todos os logs aparecem lá

### 2. **Primeiro: Limpe as tarefas antigas**
   - Clique em **"🗑️ Limpar Tudo"**
   - Confirme
   - Tudo limpo para testar!

### 3. **Teste com comandos simples:**

**Teste 1 - Simples:**
```
O Pedro precisa revisar o código amanhã com alta prioridade
```

**Teste 2 - Múltiplas tarefas:**
```
O Walter deve atualizar o dashboard até sexta
Pedro precisa enviar email para cliente Monnaie essa semana
Paulo vai fazer code review na quinta
```

**Teste 3 - Informal:**
```
Lembrar de fazer deploy em produção no dia 15
```

### 4. **Veja o Console:**

Você verá logs tipo:
```
📤 Enviando para IA: "O Pedro precisa..."
👥 Pessoas disponíveis: ["Walter", "Pedro", "Paulo"]
🤖 Resposta da IA: { "tasks": [...] }
✓ JSON parseado: [...]
✅ Tarefa 1 convertida: { person: "Pedro", ... }
```

---

## 🔍 **O QUE VERIFICAR NO CONSOLE:**

### ✅ **Se Funcionar:**
```
📤 Enviando para IA: ...
🤖 Resposta da IA: { "tasks": [...] }
✓ JSON parseado: [...]
✅ Tarefa 1 convertida: { person: "Pedro", description: "revisar o código", ... }
```

### ❌ **Se Falhar:**
```
❌ Erro ao processar com IA: ...
```

Veja a mensagem de erro para entender o problema.

---

## 🐛 **PROBLEMAS COMUNS:**

### Problema 1: "IA não conseguiu processar"
**Causa:** IA retornou formato errado
**Solução:** Veja no console o que a IA retornou
**Fix:** Parser tradicional assume automaticamente

### Problema 2: Tarefas com dados errados
**Causa:** IA não entendeu o comando
**Solução:** Seja mais específico
**Exemplo:**
- ❌ "fazer aquela coisa"
- ✅ "O Pedro precisa revisar o código"

### Problema 3: Pessoa errada
**Causa:** Nome não está na lista de pessoas
**Solução:** Adicione a pessoa em Configurações primeiro
**Ou:** Use nome exato da lista (Walter, Pedro, Paulo)

### Problema 4: Data estranha
**Causa:** IA retornou formato que CommandParser não entende
**Solução:** Use datas mais claras
**Exemplo:**
- ✅ "amanhã"
- ✅ "sexta-feira"
- ✅ "dia 15"
- ✅ "15/02"

---

## 📊 **FORMATO ESPERADO DA IA:**

A IA deve retornar JSON assim:
```json
{
  "tasks": [
    {
      "person": "Pedro",
      "date": "amanhã",
      "description": "revisar o código",
      "priority": "high"
    }
  ]
}
```

**Conversão para formato interno:**
- `person` → usado direto (deve estar na lista)
- `date` → passa por `CommandParser.parseDate()` que converte para YYYY-MM-DD
- `description` → usado direto
- `priority` → "high"/"medium"/outros → "high"/"medium"/"normal"

---

## 🎯 **DICAS PARA MELHORES RESULTADOS:**

### ✅ **BOM:**
```
"O Pedro precisa revisar o PR #123 até sexta com alta prioridade"
"Walter deve atualizar dashboard de vendas essa semana"
"Todos devem participar da retrospectiva quinta-feira"
```

### ❌ **RUIM:**
```
"fazer coisa"
"lembrar disso"
"importante"
```

---

## 🔧 **SE A IA CONTINUAR FALHANDO:**

### Opção 1: Desative a IA temporariamente
- Desmarque "🤖 Modo IA"
- Use parser tradicional: `Pedro hoje - Teste [alta]`

### Opção 2: Verifique a API Key
```bash
# No terminal
cd "C:\Users\Pedro\OneDrive\Área de Trabalho\Braniac"
cat .env
```

Deve mostrar:
```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

### Opção 3: Teste a API diretamente
Abra o Console no DevTools e execute:
```javascript
window.AIBridge.isAvailable()
// Deve retornar: true
```

---

## 📝 **EXEMPLOS DE TESTE PRONTOS:**

Cole estes no campo de comandos:

**Exemplo 1 - Básico:**
```
O Pedro precisa revisar o código amanhã
```

**Exemplo 2 - Com prioridade:**
```
Walter deve corrigir o bug crítico de produção urgente
```

**Exemplo 3 - Com data específica:**
```
Paulo vai fazer deploy no dia 15 de fevereiro
```

**Exemplo 4 - Múltiplas tasks:**
```
Na reunião de hoje decidimos:
- Pedro vai revisar o PR até sexta
- Walter precisa atualizar o dashboard
- Paulo deve preparar a apresentação para quinta
```

**Exemplo 5 - Projeto mencionado:**
```
O Pedro precisa enviar proposta para o cliente Monnaie essa semana
```

---

## 🎓 **ENTENDENDO O FLUXO:**

```
1. Você digita texto natural
   ↓
2. Clica "Processar com IA"
   ↓
3. Texto enviado para API Claude
   ↓
4. IA analisa e extrai:
   - Quem (pessoa)
   - Quando (data)
   - O quê (descrição)
   - Prioridade
   ↓
5. IA retorna JSON estruturado
   ↓
6. App converte JSON para formato interno
   ↓
7. Tarefas criadas!
```

**Se algo falhar em 3-6:**
→ Fallback automático para parser tradicional

---

## ✅ **CHECKLIST DE TESTE:**

Antes de reportar erro, verifique:

- [ ] DevTools está aberto (vendo console)
- [ ] Clicou em "Limpar Tudo" antes de testar
- [ ] Checkbox "🤖 Modo IA" está marcado
- [ ] Usou comandos claros e específicos
- [ ] Pessoas mencionadas existem na lista
- [ ] Viu logs no console
- [ ] Copiou mensagem de erro (se houver)

---

## 📞 **INFORMAÇÕES PARA DEBUG:**

Se precisar de ajuda, forneça:

1. **O que digitou** (texto exato)
2. **O que esperava** (tarefa esperada)
3. **O que aconteceu** (resultado real)
4. **Console logs** (copie as mensagens)
5. **Screenshot** (se possível)

---

**Boa sorte nos testes!** 🚀

Agora você tem ferramentas completas de debug para entender exatamente o que a IA está fazendo!
