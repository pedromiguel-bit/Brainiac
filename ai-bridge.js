// ============================================================================
// AI BRIDGE - Interface entre Renderer e AI Service
// ============================================================================

// Verifica se estamos no ambiente Electron
const hasIPC = typeof require !== 'undefined';
let ipcRenderer;

if (hasIPC) {
  try {
    const electron = require('electron');
    ipcRenderer = electron.ipcRenderer;
  } catch (e) {
    console.warn('IPC não disponível');
  }
}

class AIBridge {
  /**
   * Processa texto em linguagem natural usando IA
   */
  static async parseNaturalLanguage(text, peopleList, projectsList) {
    if (!ipcRenderer) {
      console.warn('IA não disponível (IPC não encontrado)');
      return null;
    }

    try {
      const result = await ipcRenderer.invoke('ai-parse-natural-language', text, peopleList, projectsList);
      return result.success ? result.tasks : null;
    } catch (error) {
      console.error('Erro ao processar com IA:', error);
      return null;
    }
  }

  /**
   * Analisa um documento usando IA
   */
  static async analyzeDocument(content, documentName) {
    if (!ipcRenderer) {
      return null;
    }

    try {
      const result = await ipcRenderer.invoke('ai-analyze-document', content, documentName);
      return result.success ? result.analysis : null;
    } catch (error) {
      console.error('Erro ao analisar documento:', error);
      return null;
    }
  }

  /**
   * Sugere prioridades para tarefas
   */
  static async suggestPriorities(tasks) {
    if (!ipcRenderer) {
      return null;
    }

    try {
      const result = await ipcRenderer.invoke('ai-suggest-priorities', tasks);
      return result.success ? result.recommendations : null;
    } catch (error) {
      console.error('Erro ao sugerir prioridades:', error);
      return null;
    }
  }

  /**
   * Gera resumo diário
   */
  static async generateDailySummary(todayTasks, overdueTasks, completedTasks) {
    if (!ipcRenderer) {
      return null;
    }

    try {
      const result = await ipcRenderer.invoke('ai-generate-summary', todayTasks, overdueTasks, completedTasks);
      return result.success ? result.summary : null;
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
      return null;
    }
  }

  /**
   * Extrai tarefas de texto livre
   */
  static async extractTasks(text) {
    if (!ipcRenderer) {
      return null;
    }

    try {
      const result = await ipcRenderer.invoke('ai-extract-tasks', text);
      return result.success ? result.tasks : null;
    } catch (error) {
      console.error('Erro ao extrair tarefas:', error);
      return null;
    }
  }

  /**
   * Melhora descrição de tarefa
   */
  static async improveDescription(description) {
    if (!ipcRenderer) {
      return description;
    }

    try {
      const result = await ipcRenderer.invoke('ai-improve-description', description);
      return result.success ? result.improved : description;
    } catch (error) {
      console.error('Erro ao melhorar descrição:', error);
      return description;
    }
  }

  /**
   * Analisa uma imagem e extrai tarefas via Claude Vision API
   */
  static async analyzeImage(imageBase64, mimeType, peopleList, projectsList) {
    if (!ipcRenderer) {
      console.warn('IA não disponível (IPC não encontrado)');
      return null;
    }
    try {
      const result = await ipcRenderer.invoke('ai-analyze-image', imageBase64, mimeType, peopleList, projectsList);
      return result.success ? result.result : null;
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      return null;
    }
  }

  /**
   * Captura screenshot da tela
   */
  static async captureScreen() {
    if (!ipcRenderer) return null;
    try {
      const result = await ipcRenderer.invoke('capture-screen');
      return result.success ? result.image : null;
    } catch (error) {
      console.error('Erro ao capturar tela:', error);
      return null;
    }
  }

  /**
   * Verifica se a IA está disponível
   */
  static isAvailable() {
    return !!ipcRenderer;
  }
}

// ============================================================================
// NOTIFICATION BRIDGE - Notificações nativas via Electron
// ============================================================================

class NotificationBridge {
  static async showNotification(title, body) {
    if (!ipcRenderer) {
      // Fallback para Notification API do browser
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }
    try {
      await ipcRenderer.invoke('show-notification', title, body);
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error);
    }
  }

  static async updateSettings(settings) {
    if (!ipcRenderer) return;
    try {
      await ipcRenderer.invoke('update-notification-settings', settings);
    } catch (error) {
      console.error('Erro ao atualizar config de notificações:', error);
    }
  }

  static async getSettings() {
    if (!ipcRenderer) return null;
    try {
      const result = await ipcRenderer.invoke('get-notification-settings');
      return result.success ? result.settings : null;
    } catch (error) {
      console.error('Erro ao obter config de notificações:', error);
      return null;
    }
  }

  static setupMainProcessListener() {
    if (!ipcRenderer) return;
    ipcRenderer.on('request-followup-check', () => {
      if (window._uiManager) {
        window._uiManager.checkDueTasks();
      }
    });
  }

  static isAvailable() {
    return !!ipcRenderer;
  }
}

// ============================================================================
// SHEETS BRIDGE - Leitura do Google Sheets via Electron (somente leitura)
// ============================================================================

class SheetsBridge {
  static async checkConfig() {
    if (!ipcRenderer) return { configured: false };
    try {
      return await ipcRenderer.invoke('sheets-check-config');
    } catch (error) {
      console.error('Erro ao verificar config Sheets:', error);
      return { configured: false };
    }
  }

  static async syncPull() {
    if (!ipcRenderer) return { success: false, error: 'IPC não disponível' };
    try {
      return await ipcRenderer.invoke('sheets-sync-pull');
    } catch (error) {
      console.error('Erro ao puxar dados do Sheets:', error);
      return { success: false, error: error.message };
    }
  }

  static isAvailable() {
    return !!ipcRenderer;
  }
}

// Torna disponível globalmente se possível
if (typeof window !== 'undefined') {
  window.AIBridge = AIBridge;
  window.NotificationBridge = NotificationBridge;
  window.SheetsBridge = SheetsBridge;
}
