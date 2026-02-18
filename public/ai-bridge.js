// ============================================================================
// AI BRIDGE - Versão WEB (usa REST API ao invés de Electron IPC)
// ============================================================================

class AIBridge {
    static async _post(endpoint, body) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            return await response.json();
        } catch (error) {
            console.error(`Erro na chamada ${endpoint}:`, error);
            return { success: false, error: error.message };
        }
    }

    static async parseNaturalLanguage(text, peopleList, projectsList, existingTaskDescriptions = []) {
        const result = await this._post('/api/ai/parse-natural-language', { text, peopleList, projectsList, existingTaskDescriptions });
        return result.success ? result.tasks : null;
    }

    static async analyzeDocument(content, documentName) {
        const result = await this._post('/api/ai/analyze-document', { content, documentName });
        return result.success ? result.analysis : null;
    }

    static async suggestPriorities(tasks) {
        const result = await this._post('/api/ai/suggest-priorities', { tasks });
        return result.success ? result.recommendations : null;
    }

    static async generateDailySummary(todayTasks, overdueTasks, completedTasks) {
        const result = await this._post('/api/ai/generate-summary', { todayTasks, overdueTasks, completedTasks });
        return result.success ? result.summary : null;
    }

    static async extractTasks(text) {
        const result = await this._post('/api/ai/extract-tasks', { text });
        return result.success ? result.tasks : null;
    }

    static async improveDescription(description) {
        const result = await this._post('/api/ai/improve-description', { description });
        return result.success ? result.improved : description;
    }

    static async analyzeImage(imageBase64, mimeType, peopleList, projectsList) {
        const result = await this._post('/api/ai/analyze-image', { imageBase64, mimeType, peopleList, projectsList });
        return result.success ? result.result : null;
    }

    static async captureScreen() {
        // Captura de tela não disponível na versão web
        console.warn('Captura de tela não disponível na versão web');
        return null;
    }

    static isAvailable() {
        return true; // Sempre disponível via API REST
    }
}

// ============================================================================
// NOTIFICATION BRIDGE - Usa Notification API do browser
// ============================================================================

class NotificationBridge {
    static async showNotification(title, body) {
        if (typeof Notification !== 'undefined') {
            if (Notification.permission === 'granted') {
                new Notification(title, { body });
            } else if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            }
        }
    }

    static async updateSettings(settings) {
        // Salva no localStorage na versão web
        localStorage.setItem('notification-settings', JSON.stringify(settings));
    }

    static async getSettings() {
        try {
            const stored = localStorage.getItem('notification-settings');
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    static setupMainProcessListener() {
        // Não necessário na versão web
    }

    static isAvailable() {
        return typeof Notification !== 'undefined';
    }
}

// ============================================================================
// SHEETS BRIDGE - Usa REST API ao invés de Electron IPC
// ============================================================================

class SheetsBridge {
    static async checkConfig() {
        try {
            const response = await fetch('/api/sheets/check-config');
            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar config Sheets:', error);
            return { configured: false };
        }
    }

    static async syncPull() {
        try {
            const response = await fetch('/api/sheets/sync-pull');
            return await response.json();
        } catch (error) {
            console.error('Erro ao puxar dados do Sheets:', error);
            return { success: false, error: error.message };
        }
    }

    static isAvailable() {
        return true; // Sempre disponível via API REST
    }
}

// Torna disponível globalmente
if (typeof window !== 'undefined') {
    window.AIBridge = AIBridge;
    window.NotificationBridge = NotificationBridge;
    window.SheetsBridge = SheetsBridge;
}
