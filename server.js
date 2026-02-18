// ============================================================================
// SERVER.JS - Servidor Web para deploy no EasyPanel (Docker)
// Substitui o main.js do Electron por um servidor Express
// ============================================================================

const express = require('express');
const path = require('path');
const AIService = require('./ai-service');
const GoogleSheetsService = require('./google-sheets-service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================================
// Inicializar serviços
// ============================================================================

let aiService = null;
let sheetsService = null;

try {
    aiService = new AIService();
    console.log('✓ Serviço de IA inicializado');
} catch (error) {
    console.error('⚠ Erro ao inicializar IA:', error.message);
}

try {
    sheetsService = new GoogleSheetsService();
    if (sheetsService.isConfigured()) {
        console.log('✓ Google Sheets configurado');
    } else {
        console.log('⚠ Google Sheets não configurado');
    }
} catch (error) {
    console.error('⚠ Erro ao inicializar Google Sheets:', error.message);
}

// ============================================================================
// API ROUTES - Equivalentes aos IPC Handlers do Electron
// ============================================================================

// --- AI Endpoints ---

app.post('/api/ai/parse-natural-language', async (req, res) => {
    if (!aiService) return res.json({ success: false, error: 'Serviço de IA não disponível' });
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
        res.json({ success: true, tasks: result.tasks });
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

// --- Health Check (útil para EasyPanel) ---

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Segundo Cérebro rodando em http://0.0.0.0:${PORT}`);
    console.log(`   IA: ${aiService ? '✓ Disponível' : '✗ Indisponível'}`);
    console.log(`   Sheets: ${sheetsService?.isConfigured() ? '✓ Configurado' : '✗ Não configurado'}`);
});
