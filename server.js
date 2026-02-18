// ============================================================================
// SERVER.JS - Segundo Cérebro — Web Server para VPS / EasyPanel
// ============================================================================

// Carregar .env se existir (em produção, env vars vêm do Docker/EasyPanel)
try { require('dotenv').config(); } catch (e) { /* sem dotenv, usa env do sistema */ }

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Tratamento de erros global — impede que o processo morra
// ============================================================================

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
});

// Graceful shutdown (Docker envia SIGTERM ao parar container)
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM recebido, encerrando gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 SIGINT recebido, encerrando...');
    process.exit(0);
});

// ============================================================================
// Middleware
// ============================================================================

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
// public/ primeiro (ai-bridge.js web tem prioridade sobre a versão Electron)
app.use(express.static(path.join(__dirname, 'public')));

// Servir arquivos frontend que ficam na raiz (renderer.js, styles.css, icon.png)
app.get('/renderer.js', (req, res) => res.sendFile(path.join(__dirname, 'renderer.js')));
app.get('/styles.css', (req, res) => res.sendFile(path.join(__dirname, 'styles.css')));
app.get('/icon.png', (req, res) => res.sendFile(path.join(__dirname, 'icon.png')));

// ============================================================================
// Inicializar serviços (de forma segura — nunca crasha)
// ============================================================================

let aiService = null;
let sheetsService = null;

// AI Service
try {
    if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('⚠ ANTHROPIC_API_KEY não definida — IA desabilitada');
    } else {
        const AIService = require('./ai-service');
        aiService = new AIService();
        console.log('✓ Serviço de IA inicializado');
    }
} catch (error) {
    console.error('⚠ Erro ao inicializar IA (servidor continua):', error.message);
    aiService = null;
}

// Google Sheets Service
try {
    const GoogleSheetsService = require('./google-sheets-service');
    sheetsService = new GoogleSheetsService();
    if (sheetsService.isConfigured()) {
        console.log('✓ Google Sheets configurado');
    } else {
        console.log('⚠ Google Sheets não configurado (faltam GOOGLE_SHEETS_ID / GOOGLE_API_KEY)');
    }
} catch (error) {
    console.error('⚠ Erro ao inicializar Google Sheets (servidor continua):', error.message);
    sheetsService = null;
}

// ============================================================================
// API ROUTES
// ============================================================================

// --- AI Endpoints ---

app.post('/api/ai/parse-natural-language', async (req, res) => {
    if (!aiService) return res.json({ success: false, error: 'Serviço de IA não disponível. Configure ANTHROPIC_API_KEY.' });
    try {
        const { text, peopleList, projectsList } = req.body;
        const tasks = await aiService.parseNaturalLanguage(text, peopleList, projectsList);
        res.json({ success: true, tasks });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/ai/analyze-document', async (req, res) => {
    if (!aiService) return res.json({ success: false, error: 'Serviço de IA não disponível' });
    try {
        const { content, documentName } = req.body;
        const analysis = await aiService.analyzeDocument(content, documentName);
        res.json({ success: true, analysis });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/ai/suggest-priorities', async (req, res) => {
    if (!aiService) return res.json({ success: false, error: 'Serviço de IA não disponível' });
    try {
        const { tasks } = req.body;
        const recommendations = await aiService.suggestPriorities(tasks);
        res.json({ success: true, recommendations });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/ai/generate-summary', async (req, res) => {
    if (!aiService) return res.json({ success: false, error: 'Serviço de IA não disponível' });
    try {
        const { todayTasks, overdueTasks, completedTasks } = req.body;
        const summary = await aiService.generateDailySummary(todayTasks, overdueTasks, completedTasks);
        res.json({ success: true, summary });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/ai/extract-tasks', async (req, res) => {
    if (!aiService) return res.json({ success: false, error: 'Serviço de IA não disponível' });
    try {
        const { text } = req.body;
        const result = await aiService.extractTasksFromText(text);
        res.json({ success: true, tasks: result ? result.tasks : [] });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/ai/improve-description', async (req, res) => {
    if (!aiService) return res.json({ success: false, error: 'Serviço de IA não disponível' });
    try {
        const { description } = req.body;
        const improved = await aiService.improveTaskDescription(description);
        res.json({ success: true, improved });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/ai/analyze-image', async (req, res) => {
    if (!aiService) return res.json({ success: false, error: 'Serviço de IA não disponível' });
    try {
        const { imageBase64, mimeType, peopleList, projectsList } = req.body;
        const result = await aiService.analyzeImage(imageBase64, mimeType, peopleList, projectsList);
        res.json({ success: true, result });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// --- Google Sheets Endpoints ---

app.get('/api/sheets/check-config', async (req, res) => {
    if (!sheetsService) return res.json({ success: false, configured: false });
    res.json({ success: true, ...sheetsService.getStatus() });
});

app.get('/api/sheets/sync-pull', async (req, res) => {
    if (!sheetsService) return res.json({ success: false, error: 'Google Sheets não inicializado' });
    try {
        const result = await sheetsService.pullAll();
        res.json(result);
    } catch (error) {
        console.error('Erro no sheets-sync-pull:', error);
        res.json({ success: false, error: error.message });
    }
});

// --- Health Check ---

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '2.0.0',
        ai: !!aiService,
        sheets: sheetsService ? sheetsService.isConfigured() : false,
        uptime: process.uptime()
    });
});

// Fallback: qualquer rota não-API retorna index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('='.repeat(60));
    console.log('  🧠 Segundo Cérebro — Web Server v2.0');
    console.log('='.repeat(60));
    console.log(`  🌐 Porta:   ${PORT}`);
    console.log(`  🤖 IA:      ${aiService ? '✓ Disponível' : '✗ Indisponível'}`);
    console.log(`  📊 Sheets:  ${sheetsService?.isConfigured() ? '✓ Configurado' : '✗ Não configurado'}`);
    console.log(`  🏭 Env:     ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60));
    console.log('');
});

server.on('error', (err) => {
    console.error('❌ Erro ao iniciar servidor:', err.message);
    if (err.code === 'EADDRINUSE') {
        console.error(`   Porta ${PORT} já está em uso!`);
    }
});
