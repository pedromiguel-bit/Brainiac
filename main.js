const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, Notification, desktopCapturer, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const AIService = require('./ai-service');
const GoogleSheetsService = require('./google-sheets-service');

// Necessário para notificações nativas do Windows
app.setAppUserModelId('com.segundocerebro.app');

// ============================================================================
// INSTÂNCIA ÚNICA - Impede múltiplas janelas do app
// ============================================================================
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Outra instância já está rodando - encerra esta
  app.quit();
} else {
  // Esta é a instância principal - quando outra tenta abrir, restaura esta
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

let mainWindow;
let aiService;
let sheetsService;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#f8fafc',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'icon.png'),
    title: 'Segundo Cérebro - Task Manager'
  });

  mainWindow.loadFile('index.html');

  // Abrir DevTools em desenvolvimento (comentar em produção)
  // mainWindow.webContents.openDevTools();

  mainWindow.on('close', function (event) {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function createTray() {
  // Carrega o ícone e redimensiona para 16x16 (tamanho ideal para tray do Windows)
  const iconPath = path.join(__dirname, 'icon.png');
  let trayIcon = nativeImage.createFromPath(iconPath);
  if (trayIcon.isEmpty()) {
    console.error('⚠ Ícone da tray não encontrado:', iconPath);
    return;
  }
  trayIcon = trayIcon.resize({ width: 16, height: 16 });

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Segundo Cérebro',
      click: function () {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: function () {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Segundo Cérebro');
  tray.setContextMenu(contextMenu);

  // Clique simples (esquerdo) na tray: restaura e foca a janela
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Sistema de Notificações Agendadas
let lastNotificationId = null;
let notificationSettings = { followUps: true, overdue: true, reminders: true, hours: [10, 11, 16] };

function startNotificationScheduler() {
  // Verificar a cada minuto
  setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const targetHours = notificationSettings.hours || [10, 11, 16];

    // Se for hora cheia (minuto 0) e estiver na lista de horários
    if (minute === 0 && targetHours.includes(hour)) {
      const notificationId = `${now.getDate()}-${hour}`;
      if (lastNotificationId !== notificationId) {
        lastNotificationId = notificationId;
        // Pedir ao renderer para verificar tarefas e notificar
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('request-followup-check');
        } else if (notificationSettings.reminders) {
          showNotification('Lembrete de Tarefas', 'Verifique suas tarefas pendentes e atualize o status!');
        }
      }
    }
  }, 60000); // Check every 60s
}

function showNotification(title, body) {
  if (!Notification.isSupported()) {
    console.warn('Notificações não suportadas neste sistema');
    return;
  }
  const notification = new Notification({
    title: title,
    body: body,
    icon: path.join(__dirname, 'icon.png')
  });
  notification.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
  notification.show();
}

app.whenReady().then(() => {
  // Inicializa o serviço de IA
  try {
    aiService = new AIService();
    console.log('✓ Serviço de IA inicializado');
  } catch (error) {
    console.error('⚠ Erro ao inicializar IA:', error.message);
  }

  // Inicializa o serviço de Google Sheets
  try {
    sheetsService = new GoogleSheetsService();
    if (sheetsService.isConfigured()) {
      console.log('✓ Google Sheets configurado');
    } else {
      console.log('⚠ Google Sheets não configurado (defina GOOGLE_SHEETS_ID e GOOGLE_API_KEY no .env)');
    }
  } catch (error) {
    console.error('⚠ Erro ao inicializar Google Sheets:', error.message);
  }

  createWindow();
  createTray();
  startNotificationScheduler();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', function () {
  isQuitting = true;
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    // Não faz nada, mantém rodando na tray
  }
});

// IPC Handlers para file operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-file', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documentos', extensions: ['txt', 'md', 'pdf'] },
      { name: 'Todos os arquivos', extensions: ['*'] }
    ],
    ...options
  });

  return result;
});

ipcMain.handle('save-file', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'Todos os arquivos', extensions: ['*'] }
    ],
    ...options
  });

  return result;
});

// ============================================================================
// AI HANDLERS
// ============================================================================

ipcMain.handle('ai-parse-natural-language', async (event, text, peopleList, projectsList) => {
  if (!aiService) {
    return { success: false, error: 'Serviço de IA não disponível' };
  }

  try {
    const tasks = await aiService.parseNaturalLanguage(text, peopleList, projectsList);
    return { success: true, tasks };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-analyze-document', async (event, content, documentName) => {
  if (!aiService) {
    return { success: false, error: 'Serviço de IA não disponível' };
  }

  try {
    const analysis = await aiService.analyzeDocument(content, documentName);
    return { success: true, analysis };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-suggest-priorities', async (event, tasks) => {
  if (!aiService) {
    return { success: false, error: 'Serviço de IA não disponível' };
  }

  try {
    const recommendations = await aiService.suggestPriorities(tasks);
    return { success: true, recommendations };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-generate-summary', async (event, todayTasks, overdueTasks, completedTasks) => {
  if (!aiService) {
    return { success: false, error: 'Serviço de IA não disponível' };
  }

  try {
    const summary = await aiService.generateDailySummary(todayTasks, overdueTasks, completedTasks);
    return { success: true, summary };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-extract-tasks', async (event, text) => {
  if (!aiService) {
    return { success: false, error: 'Serviço de IA não disponível' };
  }

  try {
    const result = await aiService.extractTasksFromText(text);
    return { success: true, tasks: result.tasks };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('ai-improve-description', async (event, description) => {
  if (!aiService) {
    return { success: false, error: 'Serviço de IA não disponível' };
  }

  try {
    const improved = await aiService.improveTaskDescription(description);
    return { success: true, improved };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// IMAGE / OCR HANDLERS
// ============================================================================

ipcMain.handle('ai-analyze-image', async (event, imageBase64, mimeType, peopleList, projectsList) => {
  if (!aiService) {
    return { success: false, error: 'Serviço de IA não disponível' };
  }
  try {
    const result = await aiService.analyzeImage(imageBase64, mimeType, peopleList, projectsList);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('capture-screen', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });
    if (sources.length > 0) {
      const image = sources[0].thumbnail.toDataURL();
      return { success: true, image };
    }
    return { success: false, error: 'Nenhuma tela encontrada' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// ============================================================================
// NOTIFICATION HANDLERS
// ============================================================================

ipcMain.handle('show-notification', async (event, title, body) => {
  try {
    showNotification(title, body);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-notification-settings', async (event, settings) => {
  notificationSettings = { ...notificationSettings, ...settings };
  return { success: true };
});

ipcMain.handle('get-notification-settings', async () => {
  return { success: true, settings: notificationSettings };
});

// ============================================================================
// GOOGLE SHEETS HANDLERS (somente leitura)
// ============================================================================

ipcMain.handle('sheets-check-config', async () => {
  if (!sheetsService) return { success: false, configured: false };
  return { success: true, ...sheetsService.getStatus() };
});

ipcMain.handle('sheets-sync-pull', async () => {
  if (!sheetsService) return { success: false, error: 'Google Sheets não inicializado' };
  try {
    const result = await sheetsService.pullAll();
    return result;
  } catch (error) {
    console.error('Erro no sheets-sync-pull:', error);
    return { success: false, error: error.message };
  }
});
