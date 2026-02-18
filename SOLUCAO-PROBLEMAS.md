# 🔧 Solução de Problemas - Segundo Cérebro

## ⚠️ Erro ao Executar instalar.bat

### Problema: "ENOENT: no such file or directory, open 'C:\Windows\System32\package.json'"

**Causa:** O script não está executando no diretório correto.

**Solução 1 - Use o Terminal Diretamente (RECOMENDADO):**

1. Abra o PowerShell ou Prompt de Comando
2. Navegue até a pasta do projeto:
   ```bash
   cd "C:\Users\Pedro\OneDrive\Área de Trabalho\Braniac"
   ```
3. Execute:
   ```bash
   npm install
   ```
4. Depois execute:
   ```bash
   npm start
   ```

**Solução 2 - Corrija o Script .bat:**

Já atualizei os scripts `instalar.bat` e `executar.bat` com a correção.
Tente executar novamente o `instalar.bat` com duplo clique.

**Solução 3 - Via PowerShell (Alternativa):**

1. Clique com botão direito na pasta `Braniac`
2. Selecione "Abrir no Terminal" ou "Abrir janela do PowerShell aqui"
3. Execute:
   ```powershell
   npm install
   npm start
   ```

---

## 📝 Instalação Manual Passo a Passo

Se os scripts automáticos não funcionarem, siga estes passos:

### 1. Abrir Terminal na Pasta Correta

**Opção A - Via Explorer:**
1. Abra a pasta `Braniac` no Explorer
2. Clique na barra de endereço
3. Digite `cmd` e pressione Enter
4. O terminal abrirá na pasta correta

**Opção B - Via PowerShell:**
1. Pressione `Windows + X`
2. Selecione "Windows PowerShell" ou "Terminal"
3. Digite: `cd "C:\Users\Pedro\OneDrive\Área de Trabalho\Braniac"`
4. Pressione Enter

### 2. Verificar se está na Pasta Correta

Digite:
```bash
dir
```

Você deve ver estes arquivos:
- package.json
- main.js
- index.html
- renderer.js
- styles.css

Se não ver esses arquivos, você está na pasta errada!

### 3. Instalar Dependências

```bash
npm install
```

Aguarde... Isso pode levar 1-2 minutos.

### 4. Executar a Aplicação

```bash
npm start
```

A aplicação deve abrir! 🎉

---

## 🐛 Outros Problemas Comuns

### Erro: "npm não é reconhecido como comando"

**Causa:** Node.js não está instalado ou não está no PATH.

**Solução:**
1. Baixe e instale o Node.js: https://nodejs.org/
2. Durante a instalação, certifique-se de marcar "Add to PATH"
3. Reinicie o terminal/computador
4. Verifique: `node --version`

### Erro: "EACCES: permission denied"

**Causa:** Falta de permissões.

**Solução Windows:**
1. Execute o terminal como Administrador
2. Navegue até a pasta
3. Execute `npm install`

**Solução Alternativa:**
```bash
npm cache clean --force
npm install
```

### Erro: "Cannot find module 'electron'"

**Causa:** Dependências não foram instaladas.

**Solução:**
```bash
npm install
```

### Aplicação não abre

**Solução 1:**
```bash
# Reinstale as dependências
rmdir /s /q node_modules
npm install
npm start
```

**Solução 2:**
```bash
# Limpe o cache
npm cache clean --force
npm install
npm start
```

### Erro ao importar checklist ou documentos

**Causa:** Caminhos de arquivo com caracteres especiais.

**Solução:**
- Certifique-se que o arquivo existe
- Evite caracteres especiais no nome do arquivo
- Use apenas letras, números, hífen e underscore

---

## 🎯 Verificação de Instalação Bem-Sucedida

Após executar `npm install`, você deve ter:

1. ✅ Pasta `node_modules` criada (pode ter 100+ MB)
2. ✅ Arquivo `package-lock.json` criado
3. ✅ Nenhuma mensagem de erro no terminal

Para verificar:
```bash
dir node_modules
```

Deve mostrar várias pastas (electron, etc.)

---

## 📞 Comandos Úteis de Diagnóstico

**Verificar versão do Node.js:**
```bash
node --version
```
Deve mostrar algo como: `v18.x.x` ou superior

**Verificar versão do npm:**
```bash
npm --version
```
Deve mostrar algo como: `9.x.x` ou superior

**Verificar se está na pasta correta:**
```bash
cd
```
Deve mostrar: `C:\Users\Pedro\OneDrive\Área de Trabalho\Braniac`

**Ver conteúdo da pasta:**
```bash
dir
```
Deve listar: package.json, main.js, etc.

**Limpar cache do npm:**
```bash
npm cache clean --force
```

**Reinstalar tudo:**
```bash
rmdir /s /q node_modules
del package-lock.json
npm install
```

---

## 🎓 Dicas para Evitar Problemas

1. **Sempre execute comandos npm na pasta do projeto**
   - Verifique com `cd` onde você está
   - Use `cd "caminho\completo\da\pasta"` para ir à pasta correta

2. **Evite executar como Administrador**
   - Pode causar problemas de permissão
   - Execute normalmente sempre que possível

3. **Mantenha o Node.js atualizado**
   - Versões antigas podem ter bugs
   - Baixe a versão LTS em https://nodejs.org/

4. **Não delete a pasta node_modules manualmente**
   - Use o comando: `rmdir /s /q node_modules`
   - Ou deixe o npm gerenciar

5. **Faça backup dos dados**
   - Use: Configurações → Exportar Dados
   - Salve o JSON em local seguro

---

## 🚀 Se Nada Funcionar

**Plano B - Instalação Limpa:**

1. Delete toda a pasta `Braniac`
2. Extraia/copie novamente os arquivos
3. Abra PowerShell na pasta
4. Execute:
   ```powershell
   npm install
   npm start
   ```

**Plano C - Verifique Antivírus:**

Alguns antivírus bloqueiam o npm/electron:
1. Adicione exceção para a pasta `Braniac`
2. Adicione exceção para `node.exe`
3. Tente novamente

**Plano D - Use WSL (Avançado):**

Se você usa Windows 11:
1. Instale WSL2
2. Execute dentro do Linux
3. Geralmente funciona melhor

---

## 📧 Registros de Erros

Se precisar de ajuda, colete estas informações:

```bash
node --version
npm --version
cd
dir
```

E copie a mensagem de erro completa do terminal.

---

## ✅ Checklist de Verificação

Antes de pedir ajuda, verifique:

- [ ] Node.js está instalado (`node --version`)
- [ ] npm está instalado (`npm --version`)
- [ ] Você está na pasta correta (`cd`)
- [ ] O arquivo package.json existe (`dir package.json`)
- [ ] Não há antivírus bloqueando
- [ ] Terminal foi aberto na pasta correta
- [ ] Tentou `npm cache clean --force`
- [ ] Tentou reinstalar (`npm install`)

---

**Boa sorte! 🍀**

Se tudo mais falhar, use a instalação manual descrita no início deste documento.
