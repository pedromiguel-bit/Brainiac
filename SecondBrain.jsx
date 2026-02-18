import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Brain, CheckSquare, BookOpen, Settings, Plus, X,
  Upload, Search, Filter, Calendar, User, Tag,
  AlertCircle, Trash2, Download, FileText, List,
  Zap, Command, Database, BarChart3, Archive
} from 'lucide-react';

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

const useStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key}:`, error);
      return initialValue;
    }
  });

  const setStoredValue = useCallback((newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
    }
  }, [key]);

  return [value, setStoredValue];
};

// ============================================================================
// COMMAND PARSER
// ============================================================================

const parseCommands = (text, peopleList, projectsList) => {
  const lines = text.trim().split('\n').filter(line => line.trim());
  const tasks = [];

  const parseDate = (dateStr) => {
    const today = new Date();
    const normalized = dateStr.toLowerCase().trim();

    if (normalized === 'hoje' || normalized === 'today') {
      return today.toISOString().split('T')[0];
    }

    if (normalized === 'amanhã' || normalized === 'amanha' || normalized === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    // DD/MM ou DD/MM/YYYY
    const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3];

      if (!year) {
        year = today.getFullYear();
      } else if (year.length === 2) {
        year = '20' + year;
      }

      return `${year}-${month}-${day}`;
    }

    return today.toISOString().split('T')[0];
  };

  const extractPriority = (text) => {
    const priorityMatch = text.match(/\[(alta|high|média|media|medium|normal|baixa|low)\]/i);
    if (priorityMatch) {
      const priority = priorityMatch[1].toLowerCase();
      const cleanText = text.replace(priorityMatch[0], '').trim();

      if (priority === 'alta' || priority === 'high') return { priority: 'high', text: cleanText };
      if (priority === 'média' || priority === 'media' || priority === 'medium') return { priority: 'medium', text: cleanText };
      return { priority: 'normal', text: cleanText };
    }
    return { priority: 'normal', text };
  };

  const extractTags = (text) => {
    const tags = [];
    const tagRegex = /#(\w+)/g;
    let match;

    while ((match = tagRegex.exec(text)) !== null) {
      tags.push(match[1]);
    }

    const cleanText = text.replace(/#\w+/g, '').trim();
    return { tags, text: cleanText };
  };

  const extractProject = (text) => {
    const projectMatch = text.match(/@(\w+)/);
    if (projectMatch) {
      const projectName = projectMatch[1];
      const cleanText = text.replace(projectMatch[0], '').trim();

      // Tentar encontrar projeto correspondente
      const project = projectsList.find(p =>
        p.name.toLowerCase().includes(projectName.toLowerCase()) ||
        p.id.toLowerCase().includes(projectName.toLowerCase())
      );

      return { project: project?.name, text: cleanText };
    }
    return { project: null, text };
  };

  lines.forEach(line => {
    // Formato: Pessoa Data - Descrição [Prioridade] #tag @projeto
    const parts = line.split('-', 2);
    if (parts.length < 2) return;

    let [personDatePart, descriptionPart] = parts;
    personDatePart = personDatePart.trim();
    descriptionPart = descriptionPart.trim();

    // Extrair pessoa e data
    const tokens = personDatePart.split(/\s+/);
    if (tokens.length === 0) return;

    let person = tokens[0];
    let dateStr = tokens.length > 1 ? tokens.slice(1).join(' ') : 'hoje';

    // Se "todos", criar tarefa para cada pessoa
    const targetPeople = person.toLowerCase() === 'todos' || person.toLowerCase() === 'all'
      ? peopleList
      : [person];

    const date = parseDate(dateStr);

    // Processar descrição
    let processed = extractPriority(descriptionPart);
    processed = { ...processed, ...extractProject(processed.text) };
    processed = { ...processed, ...extractTags(processed.text) };

    targetPeople.forEach(targetPerson => {
      tasks.push({
        id: Date.now() + Math.random(),
        description: processed.text,
        person: targetPerson,
        date,
        priority: processed.priority,
        completed: false,
        createdAt: new Date().toISOString(),
        project: processed.project,
        tags: processed.tags.length > 0 ? processed.tags : undefined
      });
    });
  });

  return tasks;
};

// ============================================================================
// MARKDOWN CHECKLIST PARSER
// ============================================================================

const parseMarkdownChecklist = (markdown, peopleList) => {
  const tasks = [];
  const lines = markdown.split('\n');

  let currentPerson = null;
  let currentDate = null;

  const parseDate = (text) => {
    const today = new Date();

    if (text.toLowerCase().includes('hoje') || text.toLowerCase().includes('today')) {
      return today.toISOString().split('T')[0];
    }

    if (text.toLowerCase().includes('amanhã') || text.toLowerCase().includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3] || today.getFullYear();
      if (year.toString().length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }

    return today.toISOString().split('T')[0];
  };

  lines.forEach(line => {
    // Detectar seção de pessoa: ## WALTER ou ## 🎯 WALTER
    const personMatch = line.match(/^##\s*(?:🎯\s*)?([A-Z]+)/i);
    if (personMatch) {
      const personName = personMatch[1];
      currentPerson = peopleList.find(p =>
        p.toLowerCase() === personName.toLowerCase()
      ) || personName;

      // Tentar extrair data da linha
      currentDate = parseDate(line);
      return;
    }

    // Detectar tarefa: - [ ] ou - [x]
    const taskMatch = line.match(/^-\s*\[([ x])\]\s*(.+)$/i);
    if (taskMatch && currentPerson) {
      const isCompleted = taskMatch[1].toLowerCase() === 'x';
      let description = taskMatch[2].trim();

      // Extrair prioridade
      let priority = 'normal';
      const priorityMatch = description.match(/\[(alta|high|média|media|medium|normal)\]/i);
      if (priorityMatch) {
        const p = priorityMatch[1].toLowerCase();
        priority = (p === 'alta' || p === 'high') ? 'high' :
                   (p === 'média' || p === 'media' || p === 'medium') ? 'medium' : 'normal';
        description = description.replace(priorityMatch[0], '').trim();
      }

      // Extrair data se houver
      let taskDate = currentDate;
      const taskDateMatch = description.match(/\(prazo:\s*(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\)/i);
      if (taskDateMatch) {
        taskDate = parseDate(taskDateMatch[1]);
        description = description.replace(taskDateMatch[0], '').trim();
      }

      tasks.push({
        id: Date.now() + Math.random(),
        description,
        person: currentPerson,
        date: taskDate,
        priority,
        completed: isCompleted,
        createdAt: new Date().toISOString()
      });
    }
  });

  return tasks;
};

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-500' :
                  type === 'error' ? 'bg-red-500' :
                  type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';

  return (
    <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in`}>
      {type === 'success' && '✓'}
      {type === 'error' && '✕'}
      {type === 'warning' && '⚠'}
      {message}
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

export default function SecondBrain() {
  // Storage hooks
  const [tasks, setTasks] = useStorage('checklist-tasks', []);
  const [people, setPeople] = useStorage('checklist-people', ['Walter', 'Pedro', 'Paulo']);
  const [documents, setDocuments] = useStorage('brain-documents', []);
  const [projects, setProjects] = useStorage('brain-projects', [
    { id: 'monnaie', name: 'Monnaie', status: 'active', createdAt: new Date().toISOString() },
    { id: 'hs-golden', name: 'HS Golden', status: 'active', createdAt: new Date().toISOString() },
    { id: 'marthan', name: 'Marthan', status: 'active', createdAt: new Date().toISOString() },
    { id: 'multimax', name: 'Multimax', status: 'active', createdAt: new Date().toISOString() },
    { id: 'big-credit', name: 'Big Credit', status: 'implementation', createdAt: new Date().toISOString() },
    { id: 'ozox', name: 'Ozox', status: 'implementation', createdAt: new Date().toISOString() },
  ]);

  // UI State
  const [activeTab, setActiveTab] = useState('tasks');
  const [commandText, setCommandText] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Filters
  const [filterPerson, setFilterPerson] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCompleted, setFilterCompleted] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual form state
  const [formData, setFormData] = useState({
    description: '',
    person: people[0] || '',
    date: new Date().toISOString().split('T')[0],
    priority: 'normal',
    project: '',
    tags: ''
  });

  // Toast functions
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Task functions
  const addTasksFromCommands = () => {
    if (!commandText.trim()) {
      addToast('Digite comandos primeiro', 'warning');
      return;
    }

    const newTasks = parseCommands(commandText, people, projects);
    if (newTasks.length === 0) {
      addToast('Nenhuma tarefa válida encontrada', 'warning');
      return;
    }

    setTasks(prev => [...prev, ...newTasks]);
    addToast(`✓ ${newTasks.length} tarefa(s) adicionada(s)`, 'success');
    setCommandText('');
  };

  const addTaskManual = () => {
    if (!formData.description.trim()) {
      addToast('Descrição é obrigatória', 'warning');
      return;
    }

    const newTask = {
      id: Date.now(),
      description: formData.description,
      person: formData.person,
      date: formData.date,
      priority: formData.priority,
      completed: false,
      createdAt: new Date().toISOString(),
      project: formData.project || undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined
    };

    setTasks(prev => [...prev, newTask]);
    addToast('✓ Tarefa adicionada', 'success');

    // Reset form
    setFormData({
      description: '',
      person: people[0] || '',
      date: new Date().toISOString().split('T')[0],
      priority: 'normal',
      project: '',
      tags: ''
    });
    setShowManualForm(false);
  };

  const toggleTaskComplete = (taskId) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId) => {
    if (confirm('Deletar esta tarefa?')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      addToast('Tarefa deletada', 'success');
    }
  };

  const importMarkdownChecklist = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.txt';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const newTasks = parseMarkdownChecklist(content, people);

        if (newTasks.length === 0) {
          addToast('Nenhuma tarefa encontrada no arquivo', 'warning');
          return;
        }

        setTasks(prev => [...prev, ...newTasks]);
        addToast(`✓ ${newTasks.length} tarefa(s) importada(s)`, 'success');
      };

      reader.readAsText(file);
    };

    input.click();
  };

  // People management
  const addPerson = () => {
    const name = prompt('Nome da pessoa:');
    if (!name || !name.trim()) return;

    const trimmedName = name.trim();
    if (people.some(p => p.toLowerCase() === trimmedName.toLowerCase())) {
      addToast('Pessoa já existe', 'warning');
      return;
    }

    setPeople(prev => [...prev, trimmedName]);
    addToast(`✓ ${trimmedName} adicionado(a)`, 'success');
  };

  const removePerson = (personName) => {
    if (people.length <= 1) {
      addToast('Deve haver pelo menos uma pessoa', 'warning');
      return;
    }

    if (!confirm(`Remover ${personName}? Tarefas associadas não serão deletadas.`)) {
      return;
    }

    setPeople(prev => prev.filter(p => p !== personName));
    addToast(`${personName} removido(a)`, 'success');
  };

  // Project management
  const addProject = () => {
    const name = prompt('Nome do projeto:');
    if (!name || !name.trim()) return;

    const id = name.toLowerCase().replace(/\s+/g, '-');

    if (projects.some(p => p.id === id)) {
      addToast('Projeto já existe', 'warning');
      return;
    }

    const newProject = {
      id,
      name: name.trim(),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    setProjects(prev => [...prev, newProject]);
    addToast(`✓ Projeto "${name}" criado`, 'success');
  };

  const removeProject = (projectId) => {
    if (!confirm('Remover este projeto?')) return;

    setProjects(prev => prev.filter(p => p.id !== projectId));
    addToast('Projeto removido', 'success');
  };

  // Document management
  const uploadDocument = (file, projectName = '', tags = []) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;

      const newDoc = {
        id: Date.now(),
        name: file.name,
        type: file.name.endsWith('.pdf') ? 'pdf' : 'text',
        content,
        uploadedAt: new Date().toISOString(),
        project: projectName || undefined,
        tags: tags.length > 0 ? tags : undefined,
        size: file.size
      };

      setDocuments(prev => [...prev, newDoc]);
      addToast(`✓ ${file.name} salvo`, 'success');
    };

    reader.onerror = () => {
      addToast('Erro ao ler arquivo', 'error');
    };

    reader.readAsText(file);
  };

  const deleteDocument = (docId) => {
    if (!confirm('Deletar este documento?')) return;

    setDocuments(prev => prev.filter(d => d.id !== docId));
    addToast('Documento deletado', 'success');
  };

  // Export/Import
  const exportData = () => {
    const data = {
      tasks,
      people,
      documents,
      projects,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `segundo-cerebro-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addToast('✓ Dados exportados', 'success');
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);

          if (data.tasks) setTasks(data.tasks);
          if (data.people) setPeople(data.people);
          if (data.documents) setDocuments(data.documents);
          if (data.projects) setProjects(data.projects);

          addToast('✓ Dados importados com sucesso', 'success');
        } catch (error) {
          addToast('Erro ao importar dados', 'error');
        }
      };

      reader.readAsText(file);
    };

    input.click();
  };

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filterPerson !== 'all' && task.person !== filterPerson) return false;
      if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
      if (filterCompleted === 'pending' && task.completed) return false;
      if (filterCompleted === 'completed' && !task.completed) return false;

      if (filterDate !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        if (filterDate === 'today' && task.date !== today) return false;
        if (filterDate === 'tomorrow' && task.date !== tomorrowStr) return false;
        if (filterDate === 'overdue' && task.date >= today) return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return task.description.toLowerCase().includes(query) ||
               task.person.toLowerCase().includes(query) ||
               (task.project && task.project.toLowerCase().includes(query)) ||
               (task.tags && task.tags.some(t => t.toLowerCase().includes(query)));
      }

      return true;
    });
  }, [tasks, filterPerson, filterDate, filterPriority, filterCompleted, searchQuery]);

  // Group tasks by date and person
  const groupedTasks = useMemo(() => {
    const groups = {};

    filteredTasks.forEach(task => {
      const key = `${task.date}_${task.person}`;
      if (!groups[key]) {
        groups[key] = {
          date: task.date,
          person: task.person,
          tasks: []
        };
      }
      groups[key].tasks.push(task);
    });

    return Object.values(groups).sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.person.localeCompare(b.person);
    });
  }, [filteredTasks]);

  // Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;

    const personCounts = {};
    tasks.forEach(task => {
      personCounts[task.person] = (personCounts[task.person] || 0) + 1;
    });

    const mostActive = Object.entries(personCounts).sort((a, b) => b[1] - a[1])[0];

    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === today && !t.completed).length;
    const overdue = tasks.filter(t => t.date < today && !t.completed).length;

    return {
      total,
      completed,
      completionRate,
      mostActive: mostActive ? mostActive[0] : 'N/A',
      documents: documents.length,
      todayTasks,
      overdue
    };
  }, [tasks, documents]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'k') {
          e.preventDefault();
          document.getElementById('command-input')?.focus();
        }
        if (e.key === 'n') {
          e.preventDefault();
          setShowManualForm(true);
        }
        if (e.key === 'f') {
          e.preventDefault();
          document.getElementById('search-input')?.focus();
        }
      }

      if (e.key === 'Escape') {
        setShowManualForm(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================

  const renderTaskCard = (task) => {
    const priorityColors = {
      high: 'border-l-4 border-red-500 bg-red-50',
      medium: 'border-l-4 border-yellow-500 bg-yellow-50',
      normal: 'border-l-4 border-blue-500 bg-white'
    };

    const priorityLabels = {
      high: '🔴 Alta',
      medium: '🟡 Média',
      normal: '🔵 Normal'
    };

    return (
      <div
        key={task.id}
        className={`${priorityColors[task.priority]} p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow ${task.completed ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => toggleTaskComplete(task.id)}
            className="mt-1 h-5 w-5 cursor-pointer"
          />

          <div className="flex-1">
            <p className={`text-base ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {task.description}
            </p>

            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="px-2 py-1 bg-gray-100 rounded">
                {priorityLabels[task.priority]}
              </span>

              {task.project && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                  📁 {task.project}
                </span>
              )}

              {task.tags && task.tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => deleteTask(task.id)}
            className="text-red-500 hover:text-red-700 p-1"
            title="Deletar"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  const renderTasksTab = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === today && !t.completed);
    const overdueTasks = tasks.filter(t => t.date < today && !t.completed);

    return (
      <div className="space-y-6">
        {/* Dashboard Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Calendar size={20} />
              <span className="font-semibold">Hoje</span>
            </div>
            <p className="text-3xl font-bold">{todayTasks.length}</p>
            <p className="text-sm text-gray-500">tarefas pendentes</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle size={20} />
              <span className="font-semibold">Atrasadas</span>
            </div>
            <p className="text-3xl font-bold">{overdueTasks.length}</p>
            <p className="text-sm text-gray-500">precisam atenção</p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 text-green-600 mb-2">
              <CheckSquare size={20} />
              <span className="font-semibold">Conclusão</span>
            </div>
            <p className="text-3xl font-bold">{stats.completionRate}%</p>
            <p className="text-sm text-gray-500">{stats.completed} de {stats.total}</p>
          </div>
        </div>

        {/* Command Input */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="text-yellow-500" size={20} />
            <h3 className="font-bold text-lg">Adicionar Tarefas Rapidamente</h3>
            <span className="text-xs text-gray-500 ml-auto">Ctrl+K</span>
          </div>

          <textarea
            id="command-input"
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            placeholder="Walter 09/02 - Adicionar dashboard [alta]
Pedro hoje - Enviar mensagem @Marthan #urgent
Paulo amanhã - Review de código"
            className="w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex gap-2 mt-3">
            <button
              onClick={addTasksFromCommands}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Zap size={16} />
              Processar Comandos
            </button>

            <button
              onClick={() => setCommandText('')}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Limpar
            </button>

            <button
              onClick={importMarkdownChecklist}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Upload size={16} />
              Importar Checklist
            </button>

            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 ml-auto"
            >
              <Plus size={16} />
              Formulário Manual
            </button>
          </div>
        </div>

        {/* Manual Form */}
        {showManualForm && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Nova Tarefa (Manual)</h3>
              <button onClick={() => setShowManualForm(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Descrição *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Adicionar dashboard de vendas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Pessoa</label>
                <select
                  value={formData.person}
                  onChange={(e) => setFormData({...formData, person: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {people.map(person => (
                    <option key={person} value={person}>{person}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prioridade</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Projeto (opcional)</label>
                <select
                  value={formData.project}
                  onChange={(e) => setFormData({...formData, project: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhum</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.name}>{proj.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: urgent, backend, review"
                />
              </div>
            </div>

            <button
              onClick={addTaskManual}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Adicionar Tarefa
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={18} />
            <h3 className="font-semibold">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Pessoa</label>
              <select
                value={filterPerson}
                onChange={(e) => setFilterPerson(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">Todas</option>
                {people.map(person => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Data</label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">Todas</option>
                <option value="today">Hoje</option>
                <option value="tomorrow">Amanhã</option>
                <option value="overdue">Atrasadas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Prioridade</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <select
                value={filterCompleted}
                onChange={(e) => setFilterCompleted(e.target.value)}
                className="w-full p-2 border rounded text-sm"
              >
                <option value="all">Todas</option>
                <option value="pending">Pendentes</option>
                <option value="completed">Concluídas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Buscar</label>
              <input
                id="search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ctrl+F"
                className="w-full p-2 border rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-6">
          {groupedTasks.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
              <List size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhuma tarefa encontrada</p>
              <p className="text-sm mt-1">Adicione tarefas usando os comandos rápidos acima</p>
            </div>
          ) : (
            groupedTasks.map(group => (
              <div key={`${group.date}_${group.person}`} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar size={18} className="text-blue-600" />
                  <h3 className="font-bold text-lg">
                    {new Date(group.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </h3>
                  <User size={18} className="text-purple-600 ml-4" />
                  <span className="font-semibold text-purple-700">{group.person}</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {group.tasks.filter(t => !t.completed).length} pendente(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {group.tasks.map(renderTaskCard)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderMemoryTab = () => {
    const [uploadProject, setUploadProject] = useState('');
    const [uploadTags, setUploadTags] = useState('');
    const [docSearchQuery, setDocSearchQuery] = useState('');

    const handleFileUpload = (e) => {
      const files = Array.from(e.target.files || []);
      const tags = uploadTags.split(',').map(t => t.trim()).filter(Boolean);

      files.forEach(file => {
        uploadDocument(file, uploadProject, tags);
      });

      setUploadProject('');
      setUploadTags('');
      e.target.value = '';
    };

    const filteredDocs = documents.filter(doc => {
      if (!docSearchQuery) return true;
      const query = docSearchQuery.toLowerCase();
      return doc.name.toLowerCase().includes(query) ||
             doc.content.toLowerCase().includes(query) ||
             (doc.project && doc.project.toLowerCase().includes(query)) ||
             (doc.tags && doc.tags.some(t => t.toLowerCase().includes(query)));
    });

    return (
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Upload size={20} />
            Upload de Documentos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Projeto (opcional)</label>
              <select
                value={uploadProject}
                onChange={(e) => setUploadProject(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Nenhum</option>
                {projects.map(proj => (
                  <option key={proj.id} value={proj.name}>{proj.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tags (separadas por vírgula)</label>
              <input
                type="text"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="Ex: transcricao, review, checklist"
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              multiple
              accept=".txt,.md,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileText size={48} className="mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 mb-1">Arraste arquivos aqui ou clique para selecionar</p>
              <p className="text-sm text-gray-500">Suporta: PDF, TXT, MD</p>
            </label>
          </div>
        </div>

        {/* Search Documents */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-2">
            <Search size={18} />
            <input
              type="text"
              value={docSearchQuery}
              onChange={(e) => setDocSearchQuery(e.target.value)}
              placeholder="Buscar em documentos..."
              className="flex-1 p-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-lg shadow text-center text-gray-500">
              <FileText size={48} className="mx-auto mb-3 opacity-50" />
              <p>Nenhum documento encontrado</p>
            </div>
          ) : (
            filteredDocs.map(doc => (
              <div key={doc.id} className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-2 mb-3">
                  <FileText size={20} className="text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{doc.name}</h4>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {doc.project && (
                  <div className="mb-2">
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      📁 {doc.project}
                    </span>
                  </div>
                )}

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {doc.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                  {doc.content.substring(0, 150)}...
                </p>

                <button
                  onClick={() => {
                    const modal = document.createElement('div');
                    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
                    modal.innerHTML = `
                      <div class="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div class="flex justify-between items-start mb-4">
                          <h3 class="font-bold text-xl">${doc.name}</h3>
                          <button class="text-gray-500 hover:text-gray-700" onclick="this.closest('.fixed').remove()">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </div>
                        <pre class="whitespace-pre-wrap text-sm text-gray-700">${doc.content}</pre>
                      </div>
                    `;
                    document.body.appendChild(modal);
                    modal.onclick = (e) => {
                      if (e.target === modal) modal.remove();
                    };
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Ver completo →
                </button>
              </div>
            ))
          )}
        </div>

        {/* Projects List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Database size={20} />
            Projetos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map(project => {
              const projectDocs = documents.filter(d => d.project === project.name).length;
              const projectTasks = tasks.filter(t => t.project === project.name).length;

              const statusColors = {
                active: 'bg-green-100 text-green-800',
                implementation: 'bg-yellow-100 text-yellow-800',
                churned: 'bg-red-100 text-red-800'
              };

              return (
                <div key={project.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{project.name}</h4>
                    <span className={`text-xs px-2 py-1 rounded ${statusColors[project.status]}`}>
                      {project.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📄 {projectDocs} documento(s)</p>
                    <p>✓ {projectTasks} tarefa(s)</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderConfigTab = () => {
    return (
      <div className="space-y-6">
        {/* Statistics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 size={20} />
            Estatísticas
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total de Tarefas</p>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              <p className="text-sm text-gray-600">Concluídas</p>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{stats.completionRate}%</p>
              <p className="text-sm text-gray-600">Taxa de Conclusão</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{stats.mostActive}</p>
              <p className="text-sm text-gray-600">Mais Ativo</p>
            </div>

            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-3xl font-bold text-indigo-600">{stats.documents}</p>
              <p className="text-sm text-gray-600">Documentos</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">{stats.todayTasks}</p>
              <p className="text-sm text-gray-600">Tarefas Hoje</p>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
              <p className="text-sm text-gray-600">Atrasadas</p>
            </div>

            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <p className="text-3xl font-bold text-teal-600">{projects.length}</p>
              <p className="text-sm text-gray-600">Projetos</p>
            </div>
          </div>
        </div>

        {/* People Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <User size={20} />
              Gestão de Pessoas
            </h3>
            <button
              onClick={addPerson}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {people.map(person => (
              <div key={person} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{person}</span>
                <button
                  onClick={() => removePerson(person)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Project Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Database size={20} />
              Gestão de Projetos
            </h3>
            <button
              onClick={addProject}
              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1 text-sm"
            >
              <Plus size={16} />
              Adicionar
            </button>
          </div>

          <div className="space-y-2">
            {projects.map(project => (
              <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">{project.name}</span>
                  <span className="ml-3 text-sm text-gray-500">({project.status})</span>
                </div>
                <button
                  onClick={() => removeProject(project.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Archive size={20} />
            Gerenciamento de Dados
          </h3>

          <div className="flex gap-3">
            <button
              onClick={exportData}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download size={16} />
              Exportar Dados
            </button>

            <button
              onClick={importData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Upload size={16} />
              Importar Dados
            </button>

            <button
              onClick={() => {
                if (confirm('⚠️ ATENÇÃO: Isso apagará TODOS os dados. Tem certeza?')) {
                  setTasks([]);
                  setDocuments([]);
                  addToast('Dados limpos', 'success');
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 ml-auto"
            >
              <Trash2 size={16} />
              Limpar Dados
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Command size={20} />
            Atalhos de Teclado
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Focus comando rápido</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Ctrl+K</kbd>
            </div>

            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Nova tarefa manual</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Ctrl+N</kbd>
            </div>

            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Busca global</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Ctrl+F</kbd>
            </div>

            <div className="flex justify-between p-2 bg-gray-50 rounded">
              <span className="text-gray-700">Fechar modals</span>
              <kbd className="px-2 py-1 bg-gray-200 rounded font-mono">Esc</kbd>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Brain className="text-purple-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Segundo Cérebro</h1>
              <p className="text-sm text-gray-500">Gerenciador de Tarefas com Memória de Contexto</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <CheckSquare size={18} />
              Tarefas
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`px-6 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'memory'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BookOpen size={18} />
              Memória
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`px-6 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'config'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings size={18} />
              Configurações
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'tasks' && renderTasksTab()}
        {activeTab === 'memory' && renderMemoryTab()}
        {activeTab === 'config' && renderConfigTab()}
      </main>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
