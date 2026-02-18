// ============================================================================
// GOOGLE SHEETS SERVICE - Leitura da Torre de Comando (somente leitura)
// ============================================================================

const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

class GoogleSheetsService {
  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    this.apiKey = process.env.GOOGLE_API_KEY;
    this.credentialsFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE || 'google-credentials.json';
    this.sheets = null;
    this.authMode = null;
  }

  async initialize() {
    if (this.sheets) return true;

    // Tenta API Key primeiro (mais simples)
    if (this.apiKey) {
      try {
        this.sheets = google.sheets({ version: 'v4', auth: this.apiKey });
        this.authMode = 'apikey';
        console.log('✓ Google Sheets conectado (API Key)');
        return true;
      } catch (error) {
        console.error('❌ Erro ao conectar com API Key:', error.message);
        this.sheets = null;
      }
    }

    // Fallback: Service Account
    const credPath = path.resolve(__dirname, this.credentialsFile);
    if (fs.existsSync(credPath)) {
      try {
        const auth = new google.auth.GoogleAuth({
          keyFile: credPath,
          scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
        this.sheets = google.sheets({ version: 'v4', auth });
        this.authMode = 'serviceaccount';
        console.log('✓ Google Sheets conectado (Service Account)');
        return true;
      } catch (error) {
        console.error('❌ Erro ao conectar com Service Account:', error.message);
        this.sheets = null;
      }
    }

    console.warn('⚠ Nenhuma autenticação Google configurada');
    return false;
  }

  isConfigured() {
    return !!(this.spreadsheetId && (this.apiKey || fs.existsSync(path.resolve(__dirname, this.credentialsFile))));
  }

  getStatus() {
    return {
      configured: this.isConfigured(),
      connected: !!this.sheets,
      authMode: this.authMode,
      spreadsheetId: this.spreadsheetId ? '...' + this.spreadsheetId.slice(-8) : null
    };
  }

  // ============================================================================
  // DESCOBRIR NOMES DAS ABAS
  // ============================================================================

  async getSheetNames() {
    if (!await this.initialize()) return [];
    try {
      const res = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
        fields: 'sheets.properties.title'
      });
      const names = res.data.sheets.map(s => s.properties.title);
      console.log('📋 Abas encontradas:', names.join(', '));
      return names;
    } catch (error) {
      console.error('❌ Erro ao listar abas:', error.message);
      return [];
    }
  }

  // Encontra a aba que contém o termo (case-insensitive)
  findSheet(sheetNames, ...searchTerms) {
    for (const term of searchTerms) {
      const found = sheetNames.find(name =>
        name.toLowerCase().includes(term.toLowerCase())
      );
      if (found) return found;
    }
    return null;
  }

  // ============================================================================
  // PULL: Google Sheets → App
  // ============================================================================

  async pullAll() {
    if (!await this.initialize()) {
      return { success: false, error: 'Não foi possível conectar ao Google Sheets' };
    }

    try {
      // Primeiro, descobre os nomes reais das abas
      const sheetNames = await this.getSheetNames();
      if (sheetNames.length === 0) {
        return { success: false, error: 'Não foi possível ler as abas da planilha. Verifique se ela está compartilhada como "Qualquer pessoa com o link pode ver".' };
      }

      // Procura as abas por nome (flexível)
      const implSheet = this.findSheet(sheetNames, 'Implementação', 'Implementacao', 'DB - Impl', 'Impl');
      const ongoingSheet = this.findSheet(sheetNames, 'On Going', 'OnGoing', 'Ongoing', 'Recorr');

      console.log(`📊 Aba Implementação: "${implSheet || 'NÃO ENCONTRADA'}"`);
      console.log(`📊 Aba On Going: "${ongoingSheet || 'NÃO ENCONTRADA'}"`);

      let projectsImpl = [];
      let projectsOngoing = [];
      const warnings = [];

      if (implSheet) {
        projectsImpl = await this.pullImplementacao(implSheet);
      } else {
        warnings.push('Aba de Implementação não encontrada');
      }

      if (ongoingSheet) {
        projectsOngoing = await this.pullOngoing(ongoingSheet);
      } else {
        warnings.push('Aba de On Going não encontrada');
      }

      return {
        success: true,
        projectsImpl: projectsImpl || [],
        projectsOngoing: projectsOngoing || [],
        sheetNames,
        warnings
      };
    } catch (error) {
      console.error('❌ Erro geral no pull:', error.message);
      return { success: false, error: error.message };
    }
  }

  async pullImplementacao(sheetName) {
    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `'${sheetName}'!A1:S200`
      });

      const rows = res.data.values;
      if (!rows || rows.length < 2) {
        console.log(`⚠ Aba "${sheetName}" vazia ou sem dados`);
        return [];
      }

      // Log header para debug
      console.log(`📋 Headers "${sheetName}":`, rows[0].join(' | '));

      const projects = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const get = (col) => (row[col] || '').trim();

        // Tenta encontrar o cliente (pode estar em col B=1 ou col C=2)
        let cliente = get(1);
        if (!cliente) cliente = get(2);
        if (!cliente) continue;

        // Mapeia colunas baseado na estrutura da planilha
        // Col: A=0, B=1, C=2, D=3...
        projects.push({
          id: Date.now() + i,
          _rowIndex: i + 1,
          cliente: get(1) || get(0),
          valor: this.parseValor(get(2)),
          tipo: get(3),
          responsavel: get(4),
          email: get(5),
          status: get(6),
          dataInicio: this.parseSheetDate(get(7)),
          prazoOriginal: this.parseSheetDate(get(8)),
          prazoRevisado: this.parseSheetDate(get(9)),
          dataEntregaReal: this.parseSheetDate(get(10)),
          motivoAtraso: get(11),
          notaCsat: parseFloat(get(12)) || 0,
          feedbackCsat: get(13),
          links: {
            documento: get(14),
            ekyte: get(15),
            contrato: get(16),
            acessos: get(17)
          },
          quarter: get(18)
        });
      }

      console.log(`✓ Pull "${sheetName}": ${projects.length} projetos`);
      return projects;
    } catch (error) {
      console.error(`❌ Erro ao ler "${sheetName}":`, error.message);
      return [];
    }
  }

  async pullOngoing(sheetName) {
    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `'${sheetName}'!A1:N200`
      });

      const rows = res.data.values;
      if (!rows || rows.length < 2) {
        console.log(`⚠ Aba "${sheetName}" vazia ou sem dados`);
        return [];
      }

      console.log(`📋 Headers "${sheetName}":`, rows[0].join(' | '));

      const projects = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const get = (col) => (row[col] || '').trim();

        let cliente = get(1);
        if (!cliente) cliente = get(2);
        if (!cliente) continue;

        projects.push({
          id: Date.now() + i + 10000,
          _rowIndex: i + 1,
          idCliente: get(0),
          cliente: get(1),
          valor: this.parseValor(get(2)),
          tipo: get(3),
          responsavel: get(4),
          email: get(5),
          status: get(6),
          flag: get(7),
          dataInicio: this.parseSheetDate(get(8)),
          dataFim: this.parseSheetDate(get(9)),
          notaCsat: parseFloat(get(10)) || 0,
          feedbackCsat: get(11),
          linkContrato: get(12)
        });
      }

      console.log(`✓ Pull "${sheetName}": ${projects.length} projetos`);
      return projects;
    } catch (error) {
      console.error(`❌ Erro ao ler "${sheetName}":`, error.message);
      return [];
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  parseValor(value) {
    if (!value) return 0;
    // Remove R$, espaços, pontos de milhar e troca vírgula decimal
    const clean = value.replace(/[R$\s.]/g, '').replace(',', '.');
    return parseFloat(clean) || 0;
  }

  parseSheetDate(value) {
    if (!value) return '';
    // YYYY-MM-DD (já correto)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // DD/MM/YYYY
    const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
    // Datas seriais do Google Sheets
    const num = parseFloat(value);
    if (!isNaN(num) && num > 40000) {
      const d = new Date((num - 25569) * 86400000);
      return d.toISOString().split('T')[0];
    }
    return value;
  }
}

module.exports = GoogleSheetsService;
