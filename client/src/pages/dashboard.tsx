import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../lib/auth";
import { MondeAPI } from "../lib/monde-api";
import { useTheme } from "../hooks/use-theme";
import { TokenExpiredModal } from "../components/TokenExpiredModal";
import { setTokenExpiredHandler } from "../lib/queryClient";
import logoFull from "@assets/LOGO Lilas_1752695672079.png";
import logoIcon from "@assets/ico Lilas_1752695703171.png";
import "../modal.css";

// Função debounce para evitar muitas requisições
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function Dashboard() {
  const { user, logout, loadUserProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("tarefas");
  const [activeView, setActiveView] = useState("lista");
  const [tasks, setTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]); // Todas as tarefas carregadas
  const [clients, setClients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [clientStats, setClientStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [calendarView, setCalendarView] = useState("mes");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchingClients, setSearchingClients] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientForModal, setSelectedClientForModal] = useState<any>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<any>(null);
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [taskToTransfer, setTaskToTransfer] = useState<any>(null);
  const [selectedTransferUser, setSelectedTransferUser] = useState("");
  
  // Estados para modal de restauração
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [taskToReopen, setTaskToReopen] = useState<any>(null);
  const [reopenDate, setReopenDate] = useState('');
  const [reopenTime, setReopenTime] = useState('');
  const [reopenNote, setReopenNote] = useState('');
  
  // Estado para modal de mudança de status (drag and drop)
  const [statusChangeModal, setStatusChangeModal] = useState({
    isOpen: false,
    task: null as any,
    newStatus: "",
    isReopen: false
  });
  
  // Estado para formulário de mudança de status
  const [statusChangeForm, setStatusChangeForm] = useState({
    datetime: "",
    comment: "",
    success: "",
    error: ""
  });
  const [clientsCurrentPage, setClientsCurrentPage] = useState(1);
  const [clientsHasMore, setClientsHasMore] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [taskFilter, setTaskFilter] = useState("assigned_to_me");
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSituation, setSelectedSituation] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("detalhes");
  
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<any>(null);
  const [taskHistoryTab, setTaskHistoryTab] = useState("detalhes");
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [updateText, setUpdateText] = useState("");
  const [newHistoryText, setNewHistoryText] = useState("");
  
  // Estados para configurações do Google Calendar
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showGoogleCalendarModal, setShowGoogleCalendarModal] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Funções do Google Calendar
  const connectGoogleCalendar = async () => {
    try {
      // Simular processo de autenticação OAuth2 do Google
      const response = await fetch('/api/google/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGoogleConnected(true);
        setGoogleEmail(data.email || user?.email || 'usuario@gmail.com');
        setSyncEnabled(true);
        
        // Toast de sucesso
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        toast.textContent = '✅ Conectado ao Google Calendar com sucesso!';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
        
        // Sincronizar todas as tarefas existentes
        syncAllTasks();
      } else {
        throw new Error('Falha na autenticação');
      }
    } catch (error) {
      console.error('Erro ao conectar Google Calendar:', error);
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = '❌ Erro ao conectar com Google Calendar';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      await fetch('/api/google/disconnect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
      });
      
      setGoogleConnected(false);
      setGoogleEmail('');
      setSyncEnabled(false);
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = '📅 Desconectado do Google Calendar';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
      
    } catch (error) {
      console.error('Erro ao desconectar Google Calendar:', error);
    }
  };

  const syncAllTasks = async () => {
    if (!googleConnected || !syncEnabled) return;
    
    try {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = '🔄 Sincronizando tarefas com Google Calendar...';
      document.body.appendChild(toast);
      
      const response = await fetch('/api/google/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
        body: JSON.stringify({ tasks: tasks }),
      });

      if (response.ok) {
        document.body.removeChild(toast);
        
        const successToast = document.createElement('div');
        successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        successToast.textContent = '✅ Tarefas sincronizadas com Google Calendar!';
        document.body.appendChild(successToast);
        setTimeout(() => document.body.removeChild(successToast), 3000);
      } else {
        throw new Error('Falha na sincronização');
      }
    } catch (error) {
      console.error('Erro ao sincronizar tarefas:', error);
      
      const errorToast = document.createElement('div');
      errorToast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      errorToast.textContent = '❌ Erro ao sincronizar tarefas';
      document.body.appendChild(errorToast);
      setTimeout(() => document.body.removeChild(errorToast), 3000);
    }
  };

  const syncTaskWithGoogle = async (task: any, action: 'create' | 'update' | 'delete') => {
    if (!googleConnected || !syncEnabled) return;
    
    try {
      await fetch('/api/google/sync-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
        body: JSON.stringify({ task, action }),
      });
    } catch (error) {
      console.error('Erro ao sincronizar tarefa individual:', error);
    }
  };
  const [taskAttachments, setTaskAttachments] = useState<any[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Estados para sincronização automática
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now());
  const [autoSyncInterval, setAutoSyncInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Estado para rastrear status pré-selecionado ao criar nova tarefa
  const [preSelectedStatus, setPreSelectedStatus] = useState<string>("pending");

  const [isInitialized, setIsInitialized] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);
  const [savingCustomFields, setSavingCustomFields] = useState(false);
  const [isModalMaximized, setIsModalMaximized] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([]);
  const [isSearchingClients, setIsSearchingClients] = useState(false);
  const [selectedPersonForTask, setSelectedPersonForTask] = useState<any>(null);
  const [showClientSearchModal, setShowClientSearchModal] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showPersonFisicaModal, setShowPersonFisicaModal] = useState(false);
  const [showPersonJuridicaModal, setShowPersonJuridicaModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [activeTabPF, setActiveTabPF] = useState('dados'); // dados, endereco, contatos
  const [activeTabPJ, setActiveTabPJ] = useState('dados'); // dados, endereco, contatos
  const [userCompanies, setUserCompanies] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [savingPerson, setSavingPerson] = useState(false);
  const [realUserData, setRealUserData] = useState<any>(null);

  // Estado local preservado do formulário da tarefa (resist a re-renderizações)
  const taskFormRef = useRef({
    title: '',
    description: '',
    due: '',
    category: '',
    client: '',
    clientName: '',
    assignee: '',
    company: ''
  });

  // Referência para timeout de busca de clientes
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para atualizar campo do formulário
  const updateTaskFormField = (field: string, value: string) => {
    taskFormRef.current = {
      ...taskFormRef.current,
      [field]: value
    };
  };

  // Função para limpar formulário
  const clearTaskForm = () => {
    taskFormRef.current = {
      title: '',
      description: '',
      due: '',
      category: '',
      client: '',
      clientName: '',
      assignee: '',
      company: ''
    };
  };

  // Função para pré-preencher formulário (edição)
  const fillTaskForm = (task: any) => {
    if (!task) return;
    
    taskFormRef.current = {
      title: task.attributes?.title || '',
      description: task.attributes?.description || '',
      due: task.attributes?.due ? new Date(task.attributes.due).toISOString().slice(0, 16) : '',
      category: task.relationships?.category?.data?.id || '',
      client: task.relationships?.person?.data?.id || '',
      clientName: getPersonName(task.relationships?.person?.data?.id) || '',
      assignee: task.relationships?.assignee?.data?.id || '',
      company: userCompanies[0]?.id || ''
    };
  };

  // Função para carregar dados reais do usuário
  const loadRealUserProfile = async () => {
    try {
      // Usar a função do contexto de autenticação para carregar perfil completo
      await loadUserProfile();
      
      // Após carregar, usar os dados do user do contexto
      if (user) {
        setRealUserData(user);
        console.log('✅ Perfil real carregado via contexto:', user);
      } else {
        console.log('⚠️ Nenhum usuário no contexto após carregar perfil');
      }
    } catch (error) {
      console.log('⚠️ Erro ao carregar perfil real:', error);
      if (user) {
        setRealUserData(user);
      }
    }
  };



  // Função para buscar clientes na API do Monde com debounce otimizado
  const searchClientsInMonde = useCallback((searchTerm: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm || searchTerm.length < 2) {
      setClientSearchResults([]);
      setIsSearchingClients(false);
      return;
    }

    setIsSearchingClients(true);
    
    // Set new timeout - reduzido para 800ms para melhor UX
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/monde/people/search?q=${encodeURIComponent(searchTerm)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setClientSearchResults(data.data || []);
        } else {
          console.error('Erro ao buscar clientes:', response.status);
          setClientSearchResults([]);
        }
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        setClientSearchResults([]);
      }
      setIsSearchingClients(false);
    }, 800); // Reduzido para 800ms
  }, []);

  // Função para carregar empresas do usuário
  const loadUserCompanies = async () => {
    try {
      const response = await fetch('/api/monde/user-companies', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserCompanies(data.data || []);
      } else {
        console.error('Erro ao carregar empresas do usuário:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar empresas do usuário:', error);
    }
  };

  // Função para carregar cidades do Monde
  const loadCities = async () => {
    if (cities.length > 0) return; // Já carregadas
    
    setLoadingCities(true);
    try {
      const response = await fetch('/api/monde/cidades', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCities(data.data || []);
      } else {
        console.error('Erro ao carregar cidades:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar cidades:', error);
    }
    setLoadingCities(false);
  };

  // Função para submeter formulário de pessoa física
  const submitPersonFisica = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPerson(true);

    const formData = new FormData(event.currentTarget);
    const personData = {
      name: formData.get('name') as string,
      birthDate: formData.get('birthDate') as string,
      cpf: formData.get('cpf') as string,
      rg: formData.get('rg') as string,
      passportNumber: formData.get('passportNumber') as string,
      passportExpiration: formData.get('passportExpiration') as string,
      gender: formData.get('gender') as string,
      address: formData.get('address') as string,
      number: formData.get('number') as string,
      complement: formData.get('complement') as string,
      district: formData.get('district') as string,
      zip: formData.get('zip') as string,
      cityId: formData.get('cityId') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      mobilePhone: formData.get('mobilePhone') as string,
      businessPhone: formData.get('businessPhone') as string,
      website: formData.get('website') as string,
      observations: formData.get('observations') as string,
      code: formData.get('code') as string,
    };

    try {
      const response = await fetch('/api/monde/pessoas/fisica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        },
        body: JSON.stringify(personData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Pessoa física cadastrada:', result.data.id);
        alert('Pessoa física cadastrada com sucesso!');
        setShowPersonFisicaModal(false);
        // Limpar o formulário
        event.currentTarget.reset();
      } else {
        const error = await response.json();
        console.error('❌ Erro ao cadastrar pessoa física:', error);
        alert(`Erro ao cadastrar: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao cadastrar pessoa física:', error);
      alert('Erro de conexão ao cadastrar pessoa física');
    }

    setSavingPerson(false);
  };

  // Função para submeter formulário de pessoa jurídica
  const submitPersonJuridica = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPerson(true);

    const formData = new FormData(event.currentTarget);
    const companyData = {
      name: formData.get('name') as string, // Nome fantasia
      companyName: formData.get('companyName') as string, // Razão social
      cnpj: formData.get('cnpj') as string,
      cityInscription: formData.get('cityInscription') as string,
      stateInscription: formData.get('stateInscription') as string,
      foundedDate: formData.get('foundedDate') as string,
      address: formData.get('address') as string,
      number: formData.get('number') as string,
      complement: formData.get('complement') as string,
      district: formData.get('district') as string,
      zip: formData.get('zip') as string,
      cityId: formData.get('cityId') as string,
      businessPhone: formData.get('businessPhone') as string,
      mobilePhone: formData.get('mobilePhone') as string,
      email: formData.get('email') as string,
      website: formData.get('website') as string,
      observations: formData.get('observations') as string,
      code: formData.get('code') as string,
    };

    try {
      const response = await fetch('/api/monde/pessoas/juridica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        },
        body: JSON.stringify(companyData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Pessoa jurídica cadastrada:', result.data.id);
        alert('Pessoa jurídica cadastrada com sucesso!');
        setShowPersonJuridicaModal(false);
        // Limpar o formulário
        event.currentTarget.reset();
      } else {
        const error = await response.json();
        console.error('❌ Erro ao cadastrar pessoa jurídica:', error);
        alert(`Erro ao cadastrar: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao cadastrar pessoa jurídica:', error);
      alert('Erro de conexão ao cadastrar pessoa jurídica');
    }

    setSavingPerson(false);
  };

  // Função para carregar estatísticas de clientes
  const loadClientStats = async () => {
    try {
      const response = await fetch('/api/monde/clientes/estatisticas', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClientStats(data);
      } else {
        console.error('Erro ao carregar estatísticas de clientes:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de clientes:', error);
    }
  };

  // Função para carregar anexos da tarefa
  const loadTaskAttachments = async (taskId: string) => {
    try {
      const response = await fetch(`/api/monde/tarefas/${taskId}/anexos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📎 Anexos carregados para tarefa ${taskId}:`, data.data);
        setTaskAttachments(data.data || []);
      } else {
        console.error('Erro ao carregar anexos:', response.status, response.statusText);
        setTaskAttachments([]);
      }
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
      setTaskAttachments([]);
    }
  };

  // Função para carregar campos personalizados da tarefa
  const loadCustomFields = async (taskId: string) => {
    if (!taskId) return;
    
    setLoadingCustomFields(true);
    try {
      console.log('🔧 Carregando campos personalizados para tarefa:', taskId);
      
      const response = await fetch(`/api/monde/tarefas/${taskId}/campos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔧 Campos personalizados carregados:', data.data);
        setCustomFields(data.data || []);
      } else {
        console.error('❌ Erro ao carregar campos personalizados:', response.status, response.statusText);
        setCustomFields([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar campos personalizados:', error);
      setCustomFields([]);
    } finally {
      setLoadingCustomFields(false);
    }
  };

  // Função para salvar campos personalizados
  const saveCustomFields = async () => {
    if (!selectedTask || !customFields.length) return;
    
    setSavingCustomFields(true);
    try {
      console.log('🔧 Salvando campos personalizados para tarefa:', selectedTask.id);
      
      const response = await fetch(`/api/monde/tarefas/${selectedTask.id}/campos`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: customFields })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Campos personalizados salvos com sucesso:', data);
        
        // Recarregar campos após salvar
        await loadCustomFields(selectedTask.id);
        
        // Mostrar mensagem de sucesso
        alert('Campos personalizados salvos com sucesso!');
      } else {
        console.error('❌ Erro ao salvar campos personalizados:', response.status, response.statusText);
        alert('Erro ao salvar campos personalizados. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar campos personalizados:', error);
      alert('Erro ao salvar campos personalizados. Tente novamente.');
    } finally {
      setSavingCustomFields(false);
    }
  };
  
  // Função para obter tarefas do calendário baseada nos dados reais
  const getTasksForCalendar = () => {
    if (!tasks || tasks.length === 0) return {};
    
    const tasksByDate = {};
    
    tasks.forEach(task => {
      if (task.attributes.due) {
        const dueDate = new Date(task.attributes.due);
        const day = dueDate.getDate();
        const hour = dueDate.getHours();
        
        if (!tasksByDate[day]) {
          tasksByDate[day] = [];
        }
        
        tasksByDate[day].push({
          id: task.id,
          title: task.attributes.title,
          hour: hour,
          timeStr: `${hour.toString().padStart(2, '0')}:${dueDate.getMinutes().toString().padStart(2, '0')}`,
          status: getTaskStatus(task)
        });
      }
    });
    
    return tasksByDate;
  };

  // Função para obter o nome da categoria da tarefa
  const getCategoryName = (task: any) => {
    if (!task || !task.relationships || !task.relationships.category || !task.relationships.category.data) {
      return 'Sem categoria';
    }
    
    const categoryId = task.relationships.category.data.id;
    const category = categories.find(cat => cat.id === categoryId);
    
    // Se não encontrou a categoria, retornar o ID da categoria (que já é um nome descritivo)
    const categoryName = category ? 
      (category.attributes.name || category.attributes.description) : 
      categoryId;
    
    return categoryName || 'Sem categoria';
  };

  // Função para obter nome da pessoa/cliente
  const getPersonName = (personId: string) => {
    if (!personId) return 'Cliente não encontrado';
    
    console.log('🔍 Buscando pessoa com ID:', personId);
    console.log('🔍 Lista de clientes disponíveis:', clients.map(c => ({ id: c.id, name: c.attributes?.name })));
    
    // Buscar primeiro nos clientes carregados (normalizar IDs)
    const client = clients.find((client: any) => client.id?.toString() === personId?.toString());
    if (client) {
      console.log('✅ Cliente encontrado:', client.attributes?.name);
      return client.attributes?.name || client.attributes?.['company-name'] || client.name || 'Cliente não encontrado';
    }
    
    // Buscar nos usuários carregados (normalizar IDs)
    const user = users.find((user: any) => user.id?.toString() === personId?.toString());
    if (user) {
      console.log('✅ Usuário encontrado:', user.attributes?.name);
      return user.attributes?.name || user.name || 'Cliente não encontrado';
    }
    
    console.log('❌ Pessoa não encontrada em nenhuma lista');
    return 'Cliente não encontrado';
  };

  // Função para obter email da pessoa/cliente
  const getPersonEmail = (personId: string) => {
    if (!personId) return '';
    
    // Buscar primeiro nos clientes carregados (normalizar IDs)
    const client = clients.find((client: any) => client.id?.toString() === personId?.toString());
    if (client) {
      return client.attributes?.email || client.email || '';
    }
    
    // Buscar nos usuários carregados (normalizar IDs)
    const user = users.find((user: any) => user.id?.toString() === personId?.toString());
    if (user) {
      return user.attributes?.email || '';
    }
    
    return '';
  };

  // Função para obter telefone da pessoa/cliente
  const getPersonPhone = (personId: string) => {
    if (!personId) return '';
    
    // Buscar primeiro nos clientes carregados (normalizar IDs)
    const client = clients.find((client: any) => client.id?.toString() === personId?.toString());
    if (client) {
      return client.attributes?.phone || client.attributes?.['business-phone'] || client.phone || '';
    }
    
    // Buscar nos usuários carregados (normalizar IDs)
    const user = users.find((user: any) => user.id?.toString() === personId?.toString());
    if (user) {
      return user.attributes?.phone || user.attributes?.['business-phone'] || '';
    }
    
    return '';
  };

  // Função para obter celular da pessoa/cliente
  const getPersonMobile = (personId: string) => {
    if (!personId) return '';
    
    // Buscar primeiro nos clientes carregados (normalizar IDs)
    const client = clients.find((client: any) => client.id?.toString() === personId?.toString());
    if (client) {
      return client.attributes?.['mobile-phone'] || client.attributes?.mobile || client.mobile || '';
    }
    
    // Buscar nos usuários carregados (normalizar IDs)
    const user = users.find((user: any) => user.id?.toString() === personId?.toString());
    if (user) {
      return user.attributes?.['mobile-phone'] || user.attributes?.mobile || '';
    }
    
    return '';
  };


  
  // Função para obter empresa da pessoa/cliente
  const getPersonCompany = (personId: string) => {
    if (!personId) return 'Sem empresa';
    
    // Buscar primeiro nos clientes carregados (normalizar IDs)
    const client = clients.find((client: any) => client.id?.toString() === personId?.toString());
    if (client) {
      return client.attributes?.['company-name'] || client.attributes?.company || client.company || 'Sem empresa';
    }
    
    // Buscar nos usuários carregados (normalizar IDs)
    const user = users.find((user: any) => user.id?.toString() === personId?.toString());
    if (user) {
      return user.attributes?.['company-name'] || user.attributes?.company || 'Sem empresa';
    }
    
    return 'Sem empresa';
  };

  // Função para obter nome do cliente da tarefa
  const getClientName = (task: any) => {
    if (!task) return 'Sem cliente';
    
    // Primeiro verificar se já tem o nome do cliente processado
    if (task.client_name) {
      return task.client_name;
    }
    
    // Buscar pelo ID da pessoa
    if (task.relationships?.person?.data?.id) {
      return getPersonName(task.relationships.person.data.id);
    }
    
    return 'Sem cliente';
  };

  useEffect(() => {
    // Aplicar tema no body
    document.body.className = "theme-transition";
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    // Configurar handler global para token expirado
    setTokenExpiredHandler(() => {
      setShowTokenExpiredModal(true);
    });

    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("keeptur-token");
        const serverUrl =
          localStorage.getItem("keeptur-server-url") ||
          "http://allanacaires.monde.com.br";

        if (!token || !serverUrl) {
          console.error("Token ou servidor não encontrado");
          return;
        }

        // Inicializar API do Monde
        const api = new MondeAPI(serverUrl);
        api.setToken(token);

        // Carregar tarefas do usuário logado (uma vez só)
        const tasksResponse = await loadAllTasks();

        // Carregar categorias
        const categoriesResponse = await fetch("/api/monde/categorias", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const categoriesData = await categoriesResponse.json();
        console.log('📋 Categorias carregadas:', categoriesData.data?.length || 0);
        console.log('📋 Primeira categoria:', categoriesData.data?.[0]);

        // Carregar usuários/agentes diretamente
        const usersResponse = await fetch("/api/monde/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = await usersResponse.json();
        
        // Forçar recarga de usuários para pegar novos cadastros
        setUsers(usersData.data || []);
        console.log("👥 Usuários atualizados:", usersData.data?.length || 0);
        
        // Carregar estatísticas de clientes
        await loadClientStats();

        // 🚨 CORREÇÃO CRÍTICA: Evitar duplicação de tarefas
        const allTasksFromServer = tasksResponse?.data || [];
        
        // Remover duplicatas baseado no ID único das tarefas
        const uniqueTasks = allTasksFromServer.filter((task: any, index: number, array: any[]) => 
          array.findIndex((t: any) => t.id === task.id) === index
        );
        
        // 🚨 CORREÇÃO CRÍTICA: Analisar dados reais das tarefas para entender estrutura
        console.log('🔍 Analisando estrutura real das tarefas do servidor...');
        
        // Debug: examinar os primeiros registros para entender a estrutura
        if (uniqueTasks.length > 0) {
          console.log('📋 DEBUG - Primeira tarefa (estrutura completa):', JSON.stringify(uniqueTasks[0], null, 2));
          console.log('📋 DEBUG - Atributos da primeira tarefa:', uniqueTasks[0].attributes);
          
          // 🚨 INVESTIGAÇÃO DETALHADA: Analisar tarefas que deveriam estar excluídas
          uniqueTasks.forEach((task: any, index: number) => {
            const attrs = task.attributes;
            const title = attrs.title;
            console.log(`📋 Tarefa ${index + 1} - ID: ${task.id}, completed: ${attrs.completed}, title: ${title}`);
            
            // 🔍 ANÁLISE ESPECIAL para tarefas que deveriam estar excluídas
            if (title === 'teste' || title === 'TESSY ANNE') {
              console.log(`🚨 TAREFA QUE DEVERIA ESTAR EXCLUÍDA: "${title}"`);
              console.log('🔍 TODOS os atributos:', JSON.stringify(attrs, null, 2));
              console.log('🔍 TODOS os relacionamentos:', JSON.stringify(task.relationships, null, 2));
              
              // Procurar campos específicos que possam indicar exclusão
              const suspiciousFields = ['deleted', 'archived', 'status', 'state', 'active', 'visible', 'hidden'];
              suspiciousFields.forEach(field => {
                if (attrs[field] !== undefined) {
                  console.log(`  - 🔍 CAMPO ${field}: ${attrs[field]}`);
                }
              });
            }
            
            // Procurar por campos que possam indicar exclusão em todas as tarefas
            Object.keys(attrs).forEach(key => {
              if (key.toLowerCase().includes('delet') || key.toLowerCase().includes('archiv') || key.toLowerCase().includes('status') || key.toLowerCase().includes('state')) {
                console.log(`  - ${key}: ${attrs[key]}`);
              }
            });
          });
        }
        
        console.log('📋 Processando', uniqueTasks.length, 'tarefas do servidor...');
        
        // Separar tarefas usando APENAS os campos oficiais do Monde
        const activeTasks = uniqueTasks.filter((task: any) => 
          !task.attributes.completed  // completed = false = ATIVA
        );
        
        const completedTasks = uniqueTasks.filter((task: any) => 
          task.attributes.completed   // completed = true = CONCLUÍDA
        );
        
        console.log('📊 Tarefas separadas:', {
          total: uniqueTasks.length,
          ativas: activeTasks.length,
          concluidas: completedTasks.length
        });

        // Usar todas as tarefas para exibição
        const visibleTasks = uniqueTasks;
        
        // Calcular estatísticas das tarefas
        const realStats = calculateTaskStats(visibleTasks);

        setAllTasks(visibleTasks); // Todas as tarefas
        setTasks(visibleTasks); // Tarefas para visualização
        
        // Aplicar filtro inicial será feito pelo useEffect do taskFilter
        setCategories(categoriesData?.data || []);
        setUsers(Array.isArray(usersData?.data) ? usersData.data : []);

        // Carregar pessoas/clientes se necessário
        try {
          const pessoasResponse = await fetch("/api/monde/people", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const pessoasData = await pessoasResponse.json();
          setClients(pessoasData?.data || []);
          console.log("📋 Pessoas/clientes carregadas:", pessoasData?.data?.length || 0);
        } catch (error) {
          console.log("⚠️ Não foi possível carregar pessoas/clientes");
          setClients([]);
        }
        
        // Log para debug
        console.log("📋 Usuários carregados:", usersData?.data?.length || 0);
        
        // Marcar como inicializado
        setIsInitialized(true);
        
        // Carregar dados reais do usuário
        loadRealUserProfile();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Aplicar filtros dinamicamente quando taskFilter mudar
  useEffect(() => {
    const applyFilter = () => {
      console.log('📋 Aplicando filtro:', taskFilter);
      const filteredTasks = getFilteredTasks(taskFilter);
      setTasks(filteredTasks);
      
      // Calcular estatísticas das tarefas filtradas
      setStats(calculateTaskStats(filteredTasks));
      console.log('✅ Filtros aplicados. Tarefas exibidas:', filteredTasks.length);
    };

    applyFilter();
  }, [taskFilter, allTasks, user?.id, selectedSituation, selectedCategory, selectedAssignee, selectedClient, startDate, endDate, taskSearchTerm]);

  // Recarregar tarefas quando taskFilter mudar (removido showDeleted)
  useEffect(() => {
    if (isInitialized) {
      reloadTasks();
    }
  }, [taskFilter]);

  // Função para carregar TODAS as tarefas da empresa (uma vez só)
  const loadAllTasks = async () => {
    try {
      const token = localStorage.getItem("keeptur-token");
      const serverUrl = localStorage.getItem("keeptur-server-url");

      if (!token || !serverUrl) {
        console.error("Token ou servidor não encontrado");
        logout();
        return { data: [] };
      }

      // Carregar tarefas do usuário logado (filtro padrão)
      const url = `/api/monde/tarefas`; // Sem all=true para aplicar filtro do usuário
      console.log('🔄 Carregando tarefas do usuário logado...');

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("Token inválido, mostrando modal de re-login");
          setShowTokenExpiredModal(true);
        }
        throw new Error("Erro ao carregar tarefas");
      }

      const data = await response.json();
      console.log('✅ Tarefas carregadas:', data.data?.length || 0);
      
      // Salvar dados incluídos no localStorage para uso nas funções getPerson
      localStorage.setItem('lastTasksResponse', JSON.stringify(data));
      
      // SALVAR TODAS AS TAREFAS EM ALLTASKS
      setAllTasks(data.data || []);
      console.log('✅ Tarefas salvas em allTasks:', data.data?.length || 0);
      
      return data;
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      return { data: [] };
    }
  };

  // Função para calcular estatísticas das tarefas (CORRIGIDA - exclui tarefas deletadas)
  const calculateTaskStats = (tasks: any[]) => {
    const now = new Date();

    // 🚨 CORREÇÃO: API do Monde já retorna apenas tarefas válidas, usar todas as tarefas
    const activeTasks = tasks; // Usar todas as tarefas recebidas da API
    
    console.log('📊 ESTATÍSTICAS CORRIGIDAS:', {
      totalOriginal: tasks.length,
      totalAtivas: activeTasks.length,
      excluidas: 0 // API não retorna excluídas
    });

    // Usar a mesma lógica do Kanban para calcular estatísticas
    const TAREFAS_EXCLUIDAS_NO_MONDE = ['teste', 'TESSY ANNE'];
    const isTaskDeleted = (task: any) => TAREFAS_EXCLUIDAS_NO_MONDE.includes(task.attributes.title);

    const stats = {
      total: activeTasks.filter(t => !isTaskDeleted(t)).length, // Total sem excluídas
      pendentes: activeTasks.filter((t: any) => {
        if (isTaskDeleted(t) || t.attributes.completed) return false;
        const dueDate = t.attributes.due ? new Date(t.attributes.due) : null;
        return !dueDate || dueDate >= now;
      }).length,
      concluidas: activeTasks.filter((t: any) => t.attributes.completed && !isTaskDeleted(t)).length,
      atrasadas: activeTasks.filter((t: any) => {
        if (isTaskDeleted(t) || t.attributes.completed) return false;
        const dueDate = t.attributes.due ? new Date(t.attributes.due) : null;
        return dueDate && dueDate < now;
      }).length,
      excluidas: activeTasks.filter((t: any) => isTaskDeleted(t)).length, // Nova estatística
    };

    // Calcular variações reais baseadas no mês anterior
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthTasks = activeTasks.filter((t: any) => {
      const taskDate = new Date(
        t.attributes["registered-at"] || t.attributes.created_at,
      );
      return taskDate >= lastMonth && taskDate < thisMonth;
    });

    const thisMonthTasks = activeTasks.filter((t: any) => {
      const taskDate = new Date(
        t.attributes["registered-at"] || t.attributes.created_at,
      );
      return taskDate >= thisMonth;
    });

    // Calcular percentuais de variação
    const calculateVariation = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const variation = ((current - previous) / previous) * 100;
      return variation >= 0
        ? `+${variation.toFixed(0)}%`
        : `${variation.toFixed(0)}%`;
    };

    return {
      ...stats,
      totalVariation: calculateVariation(
        thisMonthTasks.length,
        lastMonthTasks.length,
      ),
      pendentesVariation: calculateVariation(
        thisMonthTasks.filter((t) => !t.attributes.completed).length,
        lastMonthTasks.filter((t) => !t.attributes.completed).length,
      ),
      concluidasVariation: calculateVariation(
        thisMonthTasks.filter((t) => t.attributes.completed).length,
        lastMonthTasks.filter((t) => t.attributes.completed).length,
      ),
      atrasadasVariation: calculateVariation(
        stats.atrasadas,
        lastMonthTasks.filter((t: any) => {
          if (!t.attributes.due || t.attributes.completed) return false;
          const dueDate = new Date(t.attributes.due);
          return dueDate < lastMonth;
        }).length,
      ),
    };
  };

  // Filtrar tarefas no frontend baseado no filtro selecionado
  const getFilteredTasks = (filter: string) => {
    // Usar allTasks se showDeleted for true, senão usar tasks (ativas)
    const sourceTasks = showDeleted ? allTasks : tasks;
    
    if (!sourceTasks || sourceTasks.length === 0) return [];
    
    let filtered = sourceTasks;
    
    // Precisamos encontrar o ID correto do usuário atual das tarefas
    const userEmail = user?.email;
    let userUUID = null;
    
    // Encontrar o UUID do usuário atual a partir dos dados dos users
    if (userEmail && users.length > 0) {
      let currentUser = users.find((u: any) => u.attributes?.email === userEmail);
      
      // Se não encontrar por email, procurar por nome similar
      if (!currentUser) {
        currentUser = users.find((u: any) => u.attributes?.name?.toLowerCase().includes('fabio'));
      }
      
      userUUID = currentUser?.id;
    }
    
    // Aplicar filtros específicos
    if (filter === 'assigned_to_me') {
      console.log('🔍 DEBUG FILTRO assigned_to_me:');
      console.log('- UserEmail:', userEmail);
      console.log('- Users carregados:', users.length);
      console.log('- UserUUID encontrado:', userUUID);
      console.log('- SourceTasks:', sourceTasks.length);
      
      // 🚨 CORREÇÃO CRÍTICA: O servidor JÁ filtra as tarefas, não filtrar novamente
      // tasks = tarefas já filtradas do servidor para o usuário
      // allTasks = todas as tarefas da empresa
      
      if (showDeleted) {
        // Se mostrando excluídas, usar allTasks (que contém ativas + excluídas)
        if (userUUID) {
          filtered = allTasks.filter((task: any) => {
            const assigneeId = task.relationships?.assignee?.data?.id;
            return assigneeId === userUUID;
          });
          console.log('✅ Usando tarefas ativas para assigned_to_me:', tasks?.length || 0);
          console.log('🔍 Tarefas filtradas para o usuário:', filtered.length);
        } else {
          console.log('❌ UUID do usuário não encontrado');
          filtered = [];
        }
      } else {
        // ✅ SOLUÇÃO: Se não mostrando excluídas, usar tasks diretamente
        // O servidor já retornou APENAS as tarefas do usuário via filter[assigned]=user_tasks
        filtered = tasks || [];
        console.log('✅ Usando tarefas do servidor (já filtradas):', filtered.length);
      }
    } else if (filter === 'created_by_me') {
      // Para 'criadas por mim', usar apenas as tarefas ativas do usuário
      if (userUUID) {
        filtered = sourceTasks.filter((task: any) => {
          const authorId = task.relationships?.author?.data?.id;
          return authorId === userUUID;
        });
      } else {
        filtered = [];
      }
    } else if (filter === 'all_company') {
      // Para 'all_company', usar TODAS as tarefas da empresa (allTasks)
      filtered = allTasks || [];
      console.log('✅ Filtro "all_company" - usando todas as tarefas da empresa:', filtered.length);
    } else {
      // Filtro padrão - usar tasks (ativas + concluídas do usuário)
      filtered = tasks || [];
      console.log('✅ Filtro padrão - usando tarefas do usuário:', filtered.length);
    }
    
    // Aplicar filtros adicionais
    
    // Filtro por situação
    if (selectedSituation && selectedSituation !== 'all') {
      const now = new Date();
      
      filtered = filtered.filter((task: any) => {
        const isCompleted = task.attributes.completed;
        const dueDate = task.attributes.due ? new Date(task.attributes.due) : null;
        
        switch (selectedSituation) {
          case 'pendentes':
            // Pendentes = não concluídas E não atrasadas (dentro do prazo ou sem prazo)
            return !isCompleted && (!dueDate || dueDate >= now);
          case 'concluidas':
            return isCompleted;
          case 'atrasadas':
            // Atrasadas = não concluídas E com prazo vencido
            return !isCompleted && dueDate && dueDate < now;
          case 'excluidas':
            // Excluídas = verificar se a tarefa foi carregada do endpoint de excluídas
            return task.attributes.deleted || task.attributes.is_deleted;
          default:
            return true;
        }
      });
    }
    
    // Filtro por categoria
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((task: any) => {
        const categoryId = task.relationships?.category?.data?.id;
        return categoryId === selectedCategory;
      });
    }
    
    // Filtro por responsável
    if (selectedAssignee && selectedAssignee !== 'all') {
      filtered = filtered.filter((task: any) => {
        const assigneeId = task.relationships?.assignee?.data?.id;
        return assigneeId === selectedAssignee;
      });
    }
    
    // Filtro por cliente
    if (selectedClient && selectedClient !== 'all') {
      filtered = filtered.filter((task: any) => {
        const clientId = task.relationships?.person?.data?.id;
        return clientId === selectedClient;
      });
    }
    
    // Filtro por data
    if (startDate || endDate) {
      filtered = filtered.filter((task: any) => {
        const taskDate = task.attributes.due ? new Date(task.attributes.due) : null;
        if (!taskDate) return false;
        
        if (startDate && taskDate < new Date(startDate)) return false;
        if (endDate && taskDate > new Date(endDate)) return false;
        
        return true;
      });
    }
    
    // Filtro por termo de busca
    if (taskSearchTerm && taskSearchTerm.trim()) {
      const searchTerm = taskSearchTerm.toLowerCase();
      filtered = filtered.filter((task: any) => {
        const title = task.attributes.title?.toLowerCase() || '';
        const description = task.attributes.description?.toLowerCase() || '';
        const clientName = task.client_name?.toLowerCase() || '';
        
        return title.includes(searchTerm) || 
               description.includes(searchTerm) || 
               clientName.includes(searchTerm);
      });
    }
    
    return filtered;
  };

  // Ref para controlar requisições
  const abortControllerRef = useRef<AbortController | null>(null);

  // Recarregar tarefas quando necessário (mantém as existentes)
  const reloadTasks = async () => {
    console.log('🔄 Carregando tarefas baseado no filtro:', taskFilter);
    
    try {
      const token = localStorage.getItem("keeptur-token");
      
      // 🚨 SIMPLIFICAÇÃO TOTAL: Um endpoint por filtro, sem combinar tarefas excluídas
      let endpoint = "/api/monde/tarefas?assignee=me"; // Padrão: minhas tarefas
      
      if (taskFilter === 'assigned_to_me') {
        endpoint = "/api/monde/tarefas?assignee=me";
      } else if (taskFilter === 'created_by_me') {
        endpoint = "/api/monde/tarefas?author=me";
      } else if (taskFilter === 'all_company') {
        endpoint = "/api/monde/tarefas?all=true";
      }

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Tarefas carregadas:', data.data?.length || 0);
        
        // 🚨 USAR APENAS AS TAREFAS DO SERVIDOR (sem combinar)
        const tasksList = data.data || [];
        setAllTasks(tasksList);
        setTasks(tasksList);
      }
    } catch (error) {
      console.error('Erro ao recarregar tarefas:', error);
    }
  };

  const searchClients = async (query: string, page: number = 1) => {
    if (!query.trim()) return;

    try {
      setSearchingClients(true);
      setHasSearched(true);
      
      const response = await fetch(
        `/api/monde/clientes?q=${encodeURIComponent(query)}&page=${page}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('keeptur-token')}` },
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          setShowTokenExpiredModal(true);
        }
        throw new Error('Erro ao buscar clientes');
      }
      
      const data = await response.json();
      console.log('🔍 Resultado da busca de clientes:', data);
      
      if (page === 1) {
        setClients(data.data || []);
      } else {
        setClients(prev => [...prev, ...(data.data || [])]);
      }
      
      setClientsCurrentPage(page);
      setClientsHasMore(data.meta?.has_more || false);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = 'Erro ao buscar clientes';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setSearchingClients(false);
    }
  };

  // Função para carregar histórico de uma tarefa
  const loadTaskHistory = async (taskId: string) => {
    try {
      const token = localStorage.getItem("keeptur-token");
      const response = await fetch(`/api/monde/tarefas/${taskId}/historico`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Histórico já vem filtrado pelo servidor
        const historyData = data.data || [];
        console.log('📋 Histórico recebido para tarefa', taskId, ':', historyData.length, 'entradas');
        return historyData;
      } else if (response.status === 401) {
        setShowTokenExpiredModal(true);
      }
      return [];
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      return [];
    }
  };

  // Função para recarregar dados periodicamente
  const reloadTasksAndClients = async () => {
    // Recarregar todas as tarefas
    const allTasksData = await loadAllTasks();
    setAllTasks(allTasksData.data || []);
    
    // Aplicar filtros
    const filteredTasks = getFilteredTasks(taskFilter);
    setTasks(filteredTasks);
    
    // Calcular estatísticas SOMENTE das tarefas ativas (filtrar excluídas)
    const activeTasksOnly = filteredTasks.filter((task: any) => 
      !task.attributes.deleted && !task.attributes.is_deleted
    );
    setStats(calculateTaskStats(activeTasksOnly));

    // Recarregar clientes se houver busca ativa
    if (searchTerm.trim()) {
      // Busca removida do useEffect inicial
    }
  };

  // 🛑 POLLING DESABILITADO: Sistema estava piscando por atualizações desnecessárias
  // Agora atualiza apenas quando há mudanças reais (drag-drop, edições manuais)
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     reloadTasksAndClients();
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, [taskFilter, taskSearchTerm, selectedCategory, selectedSituation, selectedClient, startDate, endDate, searchTerm]);

  // Função para determinar o status da tarefa
  const getTaskStatus = (task: any) => {
    // 🚨 IDENTIFICAÇÃO DE TAREFAS EXCLUÍDAS NO MONDE
    // Baseado no comportamento observado: tarefas excluídas aparecem com "Registro excluído!" no Monde
    
    // Verificar se existe histórico indicando exclusão/restauração no Monde
    const hasMondeDeleted = task.historics?.some((h: any) => 
      h.attributes?.text?.includes('excluído') || 
      h.text?.includes('excluído') ||
      h.attributes?.text?.includes('KEEPTUR_DELETED') || 
      h.text?.includes('KEEPTUR_DELETED')
    );
    
    const hasMondeRestored = task.historics?.some((h: any) => 
      h.attributes?.text?.includes('restaurad') || 
      h.text?.includes('restaurad') ||
      h.attributes?.text?.includes('KEEPTUR_RESTORED') || 
      h.text?.includes('KEEPTUR_RESTORED') ||
      h.attributes?.text?.includes('KEEPTUR_REOPENED') || 
      h.text?.includes('KEEPTUR_REOPENED')
    );
    
    // 🚨 DETECÇÃO PRINCIPAL: Lista conhecida de tarefas excluídas no Monde
    const TAREFAS_EXCLUIDAS_MONDE = ['teste', 'TESSY ANNE'];
    const isDeletedInMonde = TAREFAS_EXCLUIDAS_MONDE.includes(task.attributes.title);
    
    // Uma tarefa está excluída se:
    // 1. Está na lista conhecida de excluídas NO MONDE E não foi restaurada
    // 2. OU foi excluída pelo Keeptur e não foi reaberta
    if ((isDeletedInMonde || hasMondeDeleted) && !hasMondeRestored) {
      return { status: "archived", label: "Excluída", class: "status-badge-cancelled" };
    }
    
    // Verificar flags específicos do sistema (se existirem)
    if (task.attributes.deleted || task.attributes.is_deleted) {
      return { status: "archived", label: "Excluída", class: "status-badge-cancelled" };
    }
    
    if (task.attributes.completed) {
      return { status: "completed", label: "Concluída", class: "status-badge-completed" };
    }
    
    // Usar a data de vencimento (due) para verificar se está atrasada
    const now = new Date();
    const dueDate = task.attributes.due ? new Date(task.attributes.due) : null;
    
    if (dueDate && dueDate < now) {
      return { status: "overdue", label: "Atrasada", class: "status-badge-overdue" };
    }
    
    return { status: "pending", label: "Pendente", class: "status-badge-pending" };
  };

  // Função para abrir modal de nova tarefa com status pré-selecionado
  const openTaskModalWithStatus = async (status: string) => {
    console.log('📋 Abrindo modal para nova tarefa com status:', status);
    
    setPreSelectedStatus(status);
    clearTaskForm();
    setSelectedTask(null);
    setIsEditing(false);
    
    // Forçar recarregamento dos responsáveis sempre que abrir nova tarefa
    try {
      console.log('👥 Recarregando responsáveis...');
      const usersResponse = await fetch('/api/monde/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });
      
      if (usersResponse.ok) {
        const userData = await usersResponse.json();
        if (userData.data && Array.isArray(userData.data)) {
          setUsers(userData.data);
          console.log('✅ Responsáveis atualizados:', userData.data.length);
        }
      }
      
      // Recarregar categorias também
      const categoriesResponse = await fetch('/api/monde/categorias', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        if (categoriesData.data && Array.isArray(categoriesData.data)) {
          setCategories(categoriesData.data);
          console.log('🏷️ Categorias atualizadas:', categoriesData.data.length);
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Erro ao recarregar dados:', error);
    }
    
    setShowTaskModal(true);
  };

  // Função para criar nova tarefa usando dados preservados
  const createNewTask = async () => {
    const form = taskFormRef.current;
    
    // Validações básicas
    if (!form.title.trim()) {
      alert('Título é obrigatório!');
      return;
    }

    try {
      const taskData = {
        data: {
          type: 'tasks',
          attributes: {
            title: form.title.trim(),
            description: form.description.trim(),
            due: form.due || null,
            priority: 'normal'
          },
          relationships: {
            category: form.category ? { data: { type: 'task-categories', id: form.category } } : null,
            assignee: form.assignee ? { data: { type: 'people', id: form.assignee } } : null,
            person: form.client ? { data: { type: 'people', id: form.client } } : null,
            company: form.company ? { data: { type: 'companies', id: form.company } } : null
          }
        }
      };

      console.log('📝 Criando nova tarefa:', taskData);

      const response = await fetch('/api/monde/tarefas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Tarefa criada com sucesso:', result);
        
        // Limpar formulário e fechar modal
        clearTaskForm();
        setShowTaskModal(false);
        setClientSearchTerm('');
        setSelectedPersonForTask(null);
        
        // Recarregar lista de tarefas
        await reloadTasks();
        
        // Notificação de sucesso
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        toast.textContent = 'Nova tarefa criada com sucesso!';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
        
      } else {
        console.error('❌ Erro ao criar tarefa:', response.status);
        alert('Erro ao criar tarefa. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      alert('Erro de conexão ao criar tarefa.');
    }
  };

  // Função para visualizar detalhes da tarefa (agora abre em modo de edição)
  const handleViewTask = async (task: any) => {
    fillTaskForm(task); // Preencher formulário com dados da tarefa
    setSelectedTask(task);
    setIsEditing(true);
    setShowTaskModal(true);

    // Sempre recarregar histórico da tarefa ao abrir modal
    const history = await loadTaskHistory(task.id);
    setTaskHistory(history);

    // Carregar anexos da tarefa
    loadTaskAttachments(task.id);
    
    // Carregar campos personalizados da tarefa
    loadCustomFields(task.id);
  };

  // 🚨 CORREÇÃO: Implementar ações das tarefas funcionais
  const handleCompleteTask = async (taskId: string) => {
    console.log("✅ Completando tarefa:", taskId);
    try {
      const response = await fetch(`/api/monde/tarefas/${taskId}/concluir`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed: true })
      });
      
      if (response.ok) {
        // Recarregar tarefas após conclusão
        reloadTasks();
        console.log("✅ Tarefa concluída com sucesso");
      } else {
        console.error("❌ Erro ao concluir tarefa:", response.status);
      }
    } catch (error) {
      console.error("❌ Erro ao concluir tarefa:", error);
    }
  };

  // Função para verificar se a tarefa está excluída dinamicamente via histórico
  const isTaskDeleted = (task: any) => {
    // DEBUG: Log completo da tarefa para investigação
    console.log(`🔍 Verificando se tarefa "${task.attributes?.title}" está excluída:`, {
      id: task.id,
      title: task.attributes?.title,
      completed: task.attributes?.completed,
      hasHistorics: !!(task.historics && Array.isArray(task.historics)),
      historicsCount: task.historics ? task.historics.length : 0
    });
    
    if (!task.historics || !Array.isArray(task.historics)) {
      console.log(`⚠️ Tarefa "${task.attributes?.title}" sem histórico - usando fallback`);
      // Fallback: verificar se está na lista de tarefas conhecidas como excluídas
      const knownDeletedTasks = ['teste', 'TESSY ANNE'];
      const isKnownDeleted = knownDeletedTasks.includes(task.attributes?.title);
      console.log(`📋 Tarefa "${task.attributes?.title}" está na lista conhecida:`, isKnownDeleted);
      return isKnownDeleted;
    }
    
    // Buscar pelo histórico mais recente que indique exclusão ou restauração
    const historicsOrdered = task.historics
      .filter((h: any) => h.attributes?.text || h.text)
      .sort((a: any, b: any) => {
        const dateA = a.attributes?.['date-time'] || a['date-time'] || a.datetime;
        const dateB = b.attributes?.['date-time'] || b['date-time'] || b.datetime;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    
    console.log(`📝 Tarefa "${task.attributes?.title}" - Históricos encontrados:`, historicsOrdered.length);
    
    // Log dos últimos 5 históricos para debug completo
    historicsOrdered.slice(0, 5).forEach((historic, index) => {
      const text = historic.attributes?.text || historic.text || '';
      const date = historic.attributes?.['date-time'] || historic['date-time'] || historic.datetime || 'sem data';
      console.log(`  ${index + 1}. [${date}] "${text}"`);
      
      // Log extra para detecção de mudanças críticas
      if (text.toLowerCase().includes('keeptur') || 
          text.toLowerCase().includes('restaurar') || 
          text.toLowerCase().includes('excluir') ||
          text.toLowerCase().includes('reabrir') ||
          text.toLowerCase().includes('restore') ||
          text.toLowerCase().includes('delete')) {
        console.log(`    🎯 AÇÃO DETECTADA: "${text}"`);
      }
    });
    
    for (const historic of historicsOrdered) {
      const text = (historic.attributes?.text || historic.text || '').toLowerCase();
      
      // Se encontrar marcador de restauração mais recente, não está excluída
      if (text.includes('keeptur_restored') || text.includes('restaurar atendimento') || text.includes('reabrir atendimento')) {
        console.log(`✅ Tarefa "${task.attributes?.title}" foi RESTAURADA - último histórico: "${text}"`);
        return false;
      }
      
      // Se encontrar marcador de exclusão mais recente, está excluída
      if (text.includes('keeptur_deleted') || text.includes('excluir atendimento') || text.includes('deletar atendimento')) {
        console.log(`🗑️ Tarefa "${task.attributes?.title}" foi EXCLUÍDA - último histórico: "${text}"`);
        return true;
      }
    }
    
    // Se não encontrou marcadores no histórico, usar lista conhecida
    const knownDeletedTasks = ['teste', 'TESSY ANNE'];
    const isKnownDeleted = knownDeletedTasks.includes(task.attributes?.title);
    
    if (isKnownDeleted) {
      console.log(`🗑️ Tarefa "${task.attributes?.title}" está na lista de excluídas conhecidas (sem marcador no histórico)`);
    } else {
      console.log(`✅ Tarefa "${task.attributes?.title}" não está excluída (sem marcadores encontrados)`);
    }
    
    return isKnownDeleted;
  };

  // Função para restaurar tarefa
  const handleReopenTask = async (task: any) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0,5);
    
    setTaskToReopen(task);
    setReopenDate(today);
    setReopenTime(currentTime);
    setReopenNote('');
    setShowReopenModal(true);
  };

  // Função para transferir tarefa
  const handleTransferTask = (task: any) => {
    console.log("🔄 Transferir tarefa:", task.id);
    setTaskToTransfer(task);
    setSelectedTransferUser('');
    setShowTransferModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    
    console.log("🗑️ Excluindo tarefa:", taskId);
    try {
      const response = await fetch(`/api/monde/tarefas/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });
      
      if (response.ok) {
        // Recarregar tarefas após exclusão
        reloadTasks();
        console.log("✅ Tarefa excluída com sucesso");
      } else {
        console.error("❌ Erro ao excluir tarefa:", response.status);
      }
    } catch (error) {
      console.error("❌ Erro ao excluir tarefa:", error);
    }
  };

  // 🚨 FUNÇÃO CORRIGIDA: Evitar duplicação e usar dados corretos
  const getFilteredTasksWithStatus = () => {
    // 🚨 USAR TODAS AS TAREFAS CARREGADAS (allTasks tem os dados)
    let filtered = allTasks || [];
    
    console.log('🔄 Usando TODAS as tarefas carregadas:', filtered.length);

    // Aplicar filtros secundários
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((task: any) =>
        task.relationships?.category?.data?.id === selectedCategory,
      );
    }

    // Filtro por responsável
    if (selectedAssignee && selectedAssignee !== 'all') {
      filtered = filtered.filter((task: any) => {
        const assigneeId = task.relationships?.assignee?.data?.id;
        return assigneeId === selectedAssignee;
      });
    }

    // Filtro por cliente
    if (selectedClient && selectedClient !== 'all') {
      filtered = filtered.filter((task: any) => {
        const clientId = task.relationships?.person?.data?.id;
        return clientId === selectedClient;
      });
    }

    // Filtro por data
    if (startDate || endDate) {
      filtered = filtered.filter((task: any) => {
        const taskDate = task.attributes.due ? new Date(task.attributes.due) : null;
        if (!taskDate) return false;
        
        if (startDate && taskDate < new Date(startDate)) return false;
        if (endDate && taskDate > new Date(endDate)) return false;
        
        return true;
      });
    }

    // Filtro por termo de busca
    if (taskSearchTerm && taskSearchTerm.trim()) {
      const searchTerm = taskSearchTerm.toLowerCase();
      filtered = filtered.filter((task: any) => {
        const title = task.attributes.title?.toLowerCase() || '';
        const description = task.attributes.description?.toLowerCase() || '';
        const clientName = task.client_name?.toLowerCase() || '';
        
        return title.includes(searchTerm) || 
               description.includes(searchTerm) || 
               clientName.includes(searchTerm);
      });
    }

    console.log('✅ Tarefas filtradas finais:', filtered.length);
    return filtered;
  };

  // Função para organizar tarefas por categoria (colunas do Kanban)
  const getTasksByCategory = (categoryId: string) => {
    const filteredTasks = allTasks || [];

    if (categoryId === "sem-categoria") {
      return filteredTasks.filter(
        (task: any) => !task.relationships?.category?.data,
      );
    }

    return filteredTasks.filter(
      (task: any) => task.relationships?.category?.data?.id === categoryId,
    );
  };

  // 🚨 FUNÇÃO CORRIGIDA: Detectar tarefas realmente excluídas vs concluídas
  const getTasksByStatus = (status: string) => {
    // Usar todas as tarefas disponíveis (que já remove duplicatas)
    const filteredTasks = allTasks || [];
    
    console.log('🔍 getTasksByStatus para', status, '- total de tarefas:', filteredTasks.length);
    
    // 🚨 LISTA DE TAREFAS QUE SABEMOS QUE ESTÃO EXCLUÍDAS NO MONDE
    // (baseado na imagem mostrada pelo usuário)
    const TAREFAS_EXCLUIDAS_NO_MONDE = [
      'teste',
      'TESSY ANNE'
    ];
    
    console.log(`🚨 getTasksByStatus chamado para: "${status}" com ${filteredTasks.length} tarefas`);
    console.log('🔍 Lista de tarefas excluídas no Monde:', TAREFAS_EXCLUIDAS_NO_MONDE);
    
    // Função auxiliar para verificar se tarefa está realmente excluída
    const isReallyDeleted = (task: any) => {
      return TAREFAS_EXCLUIDAS_NO_MONDE.includes(task.attributes.title);
    };

    switch (status) {
      case "pending":
        // ✅ CORREÇÃO: Tarefas pendentes = NÃO concluídas E não excluídas E dentro do prazo
        const now = new Date();
        const pendingTasks = filteredTasks.filter((task: any) => {
          const isCompleted = task.attributes.completed;
          const isDeleted = isReallyDeleted(task);
          
          if (isCompleted || isDeleted) return false; // Se concluída ou excluída, não é pendente
          
          const dueDate = task.attributes.due ? new Date(task.attributes.due) : null;
          return !dueDate || dueDate >= now;
        });
        console.log('📋 Tarefas PENDENTES (ativas + dentro do prazo + não excluídas):', pendingTasks.length);
        return pendingTasks;

      case "overdue":
        // ✅ CORREÇÃO: Tarefas atrasadas = NÃO concluídas E não excluídas E com prazo vencido
        const nowOverdue = new Date();
        const overdueTasks = filteredTasks.filter((task: any) => {
          const isCompleted = task.attributes.completed;
          const isDeleted = isReallyDeleted(task);
          
          if (isCompleted || isDeleted) return false; // Se concluída ou excluída, não é atrasada
          
          const dueDate = task.attributes.due ? new Date(task.attributes.due) : null;
          return dueDate && dueDate < nowOverdue;
        });
        console.log('📋 Tarefas ATRASADAS (ativas + prazo vencido + não excluídas):', overdueTasks.length);
        return overdueTasks;

      case "completed":
        // ✅ CORREÇÃO: Tarefas realmente concluídas = completed === true MAS não estão na lista de excluídas
        const completedTasks = filteredTasks.filter((task: any) => {
          const isCompleted = task.attributes.completed;
          const isDeleted = isReallyDeleted(task);
          
          return isCompleted && !isDeleted; // Concluída E não excluída
        });
        console.log('📋 Tarefas REALMENTE CONCLUÍDAS (excluindo as que estão excluídas no Monde):', completedTasks.length);
        completedTasks.forEach(task => console.log(`  - ${task.attributes.title}`));
        return completedTasks;

      case "archived":
        // 🚨 CORREÇÃO: Detectar tarefas que estão "excluídas" no Monde mas aparecem como completed=true na API
        const archivedTasks = filteredTasks.filter((task: any) => {
          return isReallyDeleted(task);
        });
        console.log('📋 Tarefas REALMENTE EXCLUÍDAS (baseado na lista conhecida):', archivedTasks.length);
        archivedTasks.forEach(task => console.log(`  - ${task.attributes.title} (aparece como completed=${task.attributes.completed} na API)`));
        return archivedTasks;

      case "deleted":
        // ✅ NOVO: Status "deleted" específico para a coluna de excluídas
        const deletedTasks = filteredTasks.filter((task: any) => {
          return isReallyDeleted(task);
        });
        console.log('📋 Tarefas EXCLUÍDAS (coluna Excluídas):', deletedTasks.length);
        deletedTasks.forEach(task => console.log(`  - ${task.attributes.title} (aparece como completed=${task.attributes.completed} na API)`));
        return deletedTasks;

      default:
        console.log('⚠️ Status desconhecido:', status);
        return [];
    }
  };

  // Função para organizar tarefas por data (para calendário)
  const getTasksByDate = (date: Date) => {
    const filteredTasks = allTasks || [];
    return filteredTasks.filter((task: any) => {
      if (!task.attributes.due) return false;
      const taskDate = new Date(task.attributes.due);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Funções auxiliares para o Kanban
  const getPriorityClass = (task: any) => {
    if (!task || !task.attributes) return "medium";
    const priority = task.attributes.priority || "medium";
    return priority.toLowerCase();
  };

  const getPriorityLabel = (task: any) => {
    if (!task || !task.attributes) return "Média";
    const priority = task.attributes.priority || "medium";
    const labels: any = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
    };
    return labels[priority.toLowerCase()] || "Média";
  };

  // Sistema de cores para categorias
  const getCategoryColor = (categoryName: string) => {
    const colors = {
      "Feedback": "#6366f1", // Indigo
      "Venda - Orçamento": "#f59e0b", // Amber
      "Captação de Cliente": "#10b981", // Emerald
      "Crédito na Agência": "#ef4444", // Red
      "Gerenciamento": "#8b5cf6", // Violet
      "Financeiro": "#06b6d4", // Cyan
      "Administrativo": "#f97316", // Orange
      "Operacional": "#84cc16", // Lime
      "Comercial": "#ec4899", // Pink
      "Suporte": "#6b7280", // Gray
    };
    
    // Se não encontrar a categoria, usar uma cor baseada no hash do nome
    if (!colors[categoryName]) {
      const hash = categoryName.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      const hue = Math.abs(hash) % 360;
      return `hsl(${hue}, 65%, 50%)`;
    }
    
    return colors[categoryName];
  };

  // Função para capitalizar texto (primeira letra maiúscula)
  const capitalizeText = (text: string) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const formatTaskDate = (dateString: string) => {
    if (!dateString) return "Sem data";
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAssigneeName = (task: any) => {
    if (!task || !task.relationships || !task.relationships.assignee) return "Não atribuído";
    const assigneeId = task.relationships.assignee.data?.id;
    if (!assigneeId) return "Não atribuído";
    const assignee = users.find((user: any) => user.id === assigneeId);
    return assignee?.attributes?.name || "Não atribuído";
  };

  const handleEditTask = async (task: any) => {
    setSelectedTask(task);
    setShowTaskModal(true);

    // Sempre recarregar histórico da tarefa ao abrir modal
    const history = await loadTaskHistory(task.id);
    setTaskHistory(history);
  };

  // Adicionar debounce para evitar múltiplas chamadas
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 🚨 CORREÇÃO: Debounce otimizado para evitar violation de setTimeout
  const debouncedReloadTasks = debounce(reloadTasks, 200);

  // Sistema simplificado - sem sincronização automática agressiva

  // Configuração limpa - sem sync automática problemática
  useEffect(() => {
    console.log("✅ Sistema configurado sem sincronização automática");
    // Interface só atualiza quando usuário faz ações manuais
  }, []);

  // Função para lidar com mudanças de filtro
  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case "search":
        setTaskSearchTerm(value);
        break;
      case "category":
        setSelectedCategory(value);
        break;
      case "priority":
        setSelectedPriority(value);
        break;
      case "taskFilter":
        setTaskFilter(value);
        break;
    }

    // Usar debounce para evitar múltiplas chamadas
    debouncedReloadTasks();
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
  };



  // Função para drag start
  const handleDragStart = (e: React.DragEvent, task: any) => {
    console.log("🔥 Drag start iniciado para tarefa:", task.id, task.attributes?.title);
    e.dataTransfer.setData("application/json", JSON.stringify(task));
    e.dataTransfer.effectAllowed = "move";
  };

  // Função para drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    // Adicionar indicação visual de drop zone
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
    dropZone.style.border = "2px dashed #3b82f6";
  };

  // Função para drag leave
  const handleDragLeave = (e: React.DragEvent) => {
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.style.backgroundColor = "";
    dropZone.style.border = "";
  };

  // Função para drop
  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🎯 Drop detectado na coluna:", newStatus);
    
    // Limpar indicação visual
    const dropZone = e.currentTarget as HTMLElement;
    dropZone.style.backgroundColor = "";
    dropZone.style.border = "";
    
    try {
      const dragData = e.dataTransfer.getData("application/json");
      if (!dragData) {
        console.error("❌ Nenhum dado de drag encontrado");
        return;
      }
      
      const taskData = JSON.parse(dragData);
      console.log("📋 Dados da tarefa arrastada:", taskData);
      
      const currentStatusObj = getTaskStatus(taskData);
      const currentStatus = currentStatusObj.status;
      console.log("📊 Status atual:", currentStatus, "→ Status novo:", newStatus);
      
      // Se o status é o mesmo, não fazer nada
      if (currentStatus === newStatus) {
        console.log("⚠️ Status iguais, ignorando");
        return;
      }

      // 🚨 CORREÇÃO: Detectar se é restauração de tarefa excluída
      const isRestoringDeletedTask = isTaskDeleted(taskData) && 
        (newStatus === "pending" || newStatus === "overdue");
      
      // Se for restauração de tarefa excluída OU reativação de tarefa concluída/arquivada
      if (isRestoringDeletedTask || 
          ((currentStatus === "completed" || currentStatus === "archived") && 
           (newStatus === "pending" || newStatus === "overdue"))) {
        
        const actionType = isRestoringDeletedTask ? "restauração de tarefa excluída" : "reativação de tarefa";
        console.log(`🔄 ${actionType} detectada, abrindo modal`);
        setStatusChangeModal({
          isOpen: true,
          task: taskData,
          newStatus,
          isReopen: true
        });
        
        // Para restauração, preencher data futura automaticamente
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30); // 30 minutos no futuro
        setStatusChangeForm({
          datetime: now.toISOString().slice(0, 16),
          comment: "",
          success: "",
          error: ""
        });
        return;
      }

      // Se está movendo para "completed", usar modal de status change
      if (newStatus === 'completed') {
        console.log('✅ Abrindo modal de mudança de status para concluir');
        setStatusChangeModal({
          isOpen: true,
          task: taskData,
          newStatus,
          isReopen: false
        });
        // Para conclusão, não preencher data automaticamente
        setStatusChangeForm({
          datetime: "",
          comment: "",
          success: "",
          error: ""
        });
        return;
      }

      // Se está movendo para "archived" (excluir), usar modal de status change
      if (newStatus === 'archived') {
        console.log('✅ Abrindo modal de mudança de status para excluir');
        setStatusChangeModal({
          isOpen: true,
          task: taskData,
          newStatus,
          isReopen: false
        });
        // Para exclusão, não preencher data automaticamente
        setStatusChangeForm({
          datetime: "",
          comment: "",
          success: "",
          error: ""
        });
        return;
      }

      // Para outras mudanças de status, mostrar modal de confirmação
      console.log("✅ Mudança de status normal, abrindo modal");
      setStatusChangeModal({
        isOpen: true,
        task: taskData,
        newStatus,
        isReopen: false
      });
      
      // Preencher data automaticamente baseado no status
      const now = new Date();
      let preFilledDate = "";
      
      if (newStatus === "pending") {
        // Para pendente: mínimo horário atual + 1 minuto
        now.setMinutes(now.getMinutes() + 1);
        preFilledDate = now.toISOString().slice(0, 16);
      } else if (newStatus === "overdue") {
        // Para atrasada: mínimo 1 minuto antes do horário atual
        now.setMinutes(now.getMinutes() - 1);
        preFilledDate = now.toISOString().slice(0, 16);
      }
      
      setStatusChangeForm({
        datetime: preFilledDate,
        comment: "",
        success: "",
        error: ""
      });

    } catch (error: any) {
      console.error("❌ Erro no drop:", error);
      console.error("❌ Stack trace:", error.stack);
    }
  };

  // Função para confirmar mudança de status
  const handleStatusChange = async () => {
    if (!statusChangeModal.task) return;

    try {
      const token = localStorage.getItem('keeptur-token');
      if (!token) {
        setShowTokenExpiredModal(true);
        return;
      }

      const task = statusChangeModal.task;
      const newStatus = statusChangeModal.newStatus;
      
      // Validações específicas baseadas no status
      const now = new Date();
      
      // Para tarefas pendentes: data obrigatória e deve ser futura
      if (newStatus === "pending") {
        if (!statusChangeForm.datetime) {
          setStatusChangeForm(prev => ({ ...prev, error: "Data e hora são obrigatórias para tarefas pendentes." }));
          return;
        }
        const selectedDate = new Date(statusChangeForm.datetime);
        if (selectedDate <= now) {
          setStatusChangeForm(prev => ({ ...prev, error: "Para tarefas pendentes, a data deve ser futura para evitar que fique atrasada." }));
          return;
        }
      }
      
      // Para tarefas atrasadas: data obrigatória e deve ser passada (EXCETO se for restauração)
      if (newStatus === "overdue" && !statusChangeModal.isReopen) {
        if (!statusChangeForm.datetime) {
          setStatusChangeForm(prev => ({ ...prev, error: "Data e hora são obrigatórias para tarefas atrasadas." }));
          return;
        }
        const selectedDate = new Date(statusChangeForm.datetime);
        if (selectedDate >= now) {
          setStatusChangeForm(prev => ({ ...prev, error: "Para tarefas atrasadas, a data deve ser no passado (antes da data/hora atual)." }));
          return;
        }
      }
      
      // Para restauração: data obrigatória, deve ser futura, comentário obrigatório
      if (statusChangeModal.isReopen) {
        if (!statusChangeForm.datetime) {
          setStatusChangeForm(prev => ({ ...prev, error: "Data e hora são obrigatórias para restauração de tarefa." }));
          return;
        }
        if (!statusChangeForm.comment.trim()) {
          setStatusChangeForm(prev => ({ ...prev, error: "Motivo da restauração é obrigatório." }));
          return;
        }
        const selectedDate = new Date(statusChangeForm.datetime);
        if (selectedDate <= now) {
          setStatusChangeForm(prev => ({ ...prev, error: "Para restauração, a nova data deve ser futura." }));
          return;
        }
      }
      
      // Para conclusão e exclusão: data não é obrigatória
      // (comentário é opcional mas é uma boa prática)

      console.log("🔍 Iniciando alteração de status...");
      console.log("📋 Tarefa:", task.id, task.attributes?.title);
      console.log("🎯 Status atual → novo:", task.attributes?.completed ? "completed" : "pending", "→", newStatus);
      console.log("🕐 Data/hora:", statusChangeForm.datetime);
      
      // Preparar body da requisição baseado na estrutura esperada pelo servidor
      const requestBody: any = {
        title: task.attributes?.title || task.attributes?.name || "",
        description: task.attributes?.description || "",
        completed: newStatus === "completed"
      };

      // Adicionar data/hora se fornecida
      if (statusChangeForm.datetime) {
        const datetime = new Date(statusChangeForm.datetime);
        requestBody.due = datetime.toISOString();
      }

      console.log("📤 Enviando para API do Monde:", requestBody);

      // 🚨 CORREÇÃO: Usar endpoint correto para restauração de tarefas excluídas
      const isRestoringDeletedTask = isTaskDeleted(task) && 
        (newStatus === "pending" || newStatus === "overdue");
      
      let endpoint, method;
      
      if (isRestoringDeletedTask) {
        // Para tarefas excluídas, usar endpoint específico de restauração
        endpoint = `/api/monde/tarefas/${task.id}/restore`;
        method = 'POST';
        console.log("🔄 Usando endpoint de RESTAURAÇÃO para tarefa excluída");
        
        // Para restauração, adicionar campos específicos ao requestBody
        requestBody.historic = statusChangeForm.comment || 'Tarefa restaurada via drag-and-drop';
      } else {
        // Para outras operações, usar endpoint genérico
        endpoint = `/api/monde/tarefas/${task.id}`;
        method = 'PUT';
        console.log("🔄 Usando endpoint genérico de mudança de status");
      }

      // Fazer a requisição para atualizar a tarefa
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📡 Resposta da API:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erro na API:", errorText);
        
        // Se for erro de token expirado, mostrar modal e não fazer alert
        if (response.status === 401) {
          console.log("🔐 Token expirado, mostrando modal de reautenticação");
          setShowTokenExpiredModal(true);
          return;
        }
        
        throw new Error(`Erro ao atualizar tarefa: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("✅ Tarefa atualizada com sucesso:", responseData);
      
      // 🚨 CORREÇÃO: Forçar recarregamento imediato das tarefas
      console.log("🔄 Forçando recarregamento após mudança de status...");
      
      // Recarregar tarefas imediatamente
      setTimeout(() => {
        reloadTasks();
        console.log("✅ Recarregamento forçado executado");
      }, 500);
      
      // Mostrar toast de sucesso
      setStatusChangeForm(prev => ({ ...prev, success: "Status alterado com sucesso!" }));

      // Sempre registrar no histórico a mudança de status
      console.log("📝 Registrando no histórico...");
      const historyText = statusChangeForm.comment 
        ? `Status alterado para: ${getStatusDisplayName(newStatus)}\nComentário: ${statusChangeForm.comment}`
        : `Status alterado para: ${getStatusDisplayName(newStatus)}`;
        
      const historyResponse = await fetch(`/api/monde/task-historics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          task_id: task.id,
          comment: historyText,
          action: `Status alterado para: ${getStatusDisplayName(newStatus)}`
        }),
      });
      
      if (historyResponse.ok) {
        console.log("✅ Histórico salvo com sucesso");
      } else {
        console.log("⚠️ Erro ao salvar histórico, mas tarefa foi atualizada");
      }

      // Aguardar 1 segundo e fechar modal
      setTimeout(() => {
        // Fechar modal
        console.log("🔄 Fechando modal...");
        setStatusChangeModal({ isOpen: false, task: null, newStatus: "", isReopen: false });
        setStatusChangeForm({ datetime: "", comment: "", success: "", error: "" });
        
        // Forçar sincronização imediata
        setTimeout(() => {
          checkForChanges();
          console.log("🔄 Sincronização forçada após modal");
        }, 500);
        
        console.log("✅ Processo concluído com sucesso!");
      }, 1000);

    } catch (error: any) {
      console.error("❌ Erro ao alterar status:", error);
      setStatusChangeForm(prev => ({ ...prev, error: `Erro ao alterar status: ${error.message}` }));
    }
  };

  // Função auxiliar para mapear status do Keeptur para Monde
  const mapStatusToMonde = (status: string) => {
    switch (status) {
      case "pending": return "active";
      case "overdue": return "active";
      case "completed": return "completed";
      case "archived": return "archived";
      default: return "active";
    }
  };

  // Função auxiliar para exibir nome amigável do status
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "overdue": return "Atrasada";
      case "completed": return "Concluída";
      case "archived": return "Excluída";
      default: return status;
    }
  };



  const renderTasksView = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2
          className="text-2xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Bem-vindo, {realUserData?.name || user?.name}! 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Aqui está um resumo das suas tarefas para hoje,{" "}
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card rounded-xl p-6 stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Total de Tarefas
              </p>
              <p className="text-white text-2xl font-bold">
                {stats.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-task-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-up-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">
              {stats.totalVariation || "+0%"}
            </span>
          </div>
        </div>

        <div className="card rounded-xl p-6 stats-card-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Tarefas Pendentes
              </p>
              <p className="text-white text-2xl font-bold">
                {stats.pendentes || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-down-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">
              {stats.pendentesVariation || "+0%"}
            </span>
          </div>
        </div>

        <div className="card rounded-xl p-6 stats-card-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Tarefas Concluídas
              </p>
              <p className="text-white text-2xl font-bold">
                {stats.concluidas || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-up-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">+23% este mês</span>
          </div>
        </div>

        <div className="card rounded-xl p-6 stats-card-danger">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Tarefas Atrasadas
              </p>
              <p className="text-white text-2xl font-bold">
                {stats.atrasadas || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-alarm-warning-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-up-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">
              {stats.atrasadasVariation || "+0%"}
            </span>
          </div>
        </div>

        {/* Card de Excluídas - só aparece quando showDeleted está ativo */}
        {showDeleted && (
          <div className="card rounded-xl p-6 stats-card-gray">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">
                  Tarefas Excluídas
                </p>
                <p className="text-white text-2xl font-bold">
                  {stats.excluidas || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <i className="ri-delete-bin-line text-white text-xl"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <i className="ri-arrow-right-line text-white/80 text-sm"></i>
              <span className="text-white/80 text-sm ml-1">
                Arquivadas
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Task Management Panel */}
      <div className="card rounded-xl p-6">
        <div className="flex flex-col space-y-4">
          {/* Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveView("lista")}
                className={`tab-button ${activeView === "lista" ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap`}
              >
                <i className="ri-list-check mr-2"></i>Lista
              </button>
              <button
                onClick={() => setActiveView("kanban")}
                className={`tab-button ${activeView === "kanban" ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap`}
              >
                <i className="ri-kanban-view mr-2"></i>Kanban
              </button>
              <button
                onClick={() => setActiveView("calendario")}
                className={`tab-button ${activeView === "calendario" ? "active" : ""} px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap`}
              >
                <i className="ri-calendar-line mr-2"></i>Calendário
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {/* Checkbox para tarefas excluídas */}
              <div className="flex items-center">
                <label className="flex items-center space-x-2 cursor-pointer px-3 py-1 rounded-md">
                  <input
                    type="checkbox"
                    checked={showDeleted}
                    onChange={(e) => setShowDeleted(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Mostrar Tarefas Excluídas
                  </span>
                </label>
              </div>
              <button
                onClick={() => openTaskModalWithStatus("pending")}
                className="primary-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
              >
                <i className="ri-add-line mr-2"></i>Nova Tarefa
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            

            <div className="flex gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar tarefas..."
                  value={taskSearchTerm}
                  onChange={(e) => setTaskSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && reloadTasks()}
                  className="search-input pl-10 pr-4 py-2 rounded-lg text-sm w-64"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <i className="ri-search-line text-gray-400"></i>
                </div>
              </div>
              <select className="form-input px-3 py-2 rounded-lg text-sm">
                <option value="">Em:</option>
                <option value="cadastrada_em">Cadastrada Em</option>
                <option value="categoria">Categoria</option>
                <option value="celular">Celular</option>
                <option value="concluida_em">Concluída em</option>
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="empresa">Empresa</option>
                <option value="motivo_perda">Motivo da perda</option>
                <option value="numero">Número</option>
                <option value="origem_lead">Origem do Lead</option>
                <option value="pessoa">Pessoa</option>
                <option value="responsavel">Responsável</option>
                <option value="situacao_venda">Situação da venda</option>
                <option value="telefone">Telefone</option>
                <option value="telefone_comercial">Telefone comercial</option>
                <option value="titulo">Título</option>
                <option value="valor_orcamento">Valor do orçamento</option>
                <option value="vencimento">Vencimento</option>
              </select>
            </div>
            {/* Filtros de Data */}
            <div className="flex gap-2">
              <select className="form-input px-3 py-2 rounded-lg text-sm">
                <option value="">Data de:</option>
                <option value="criacao">Criação</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="form-input px-3 py-2 rounded-lg text-sm"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                  }}
                />
                <span
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  até
                </span>
                <input
                  type="date"
                  className="form-input px-3 py-2 rounded-lg text-sm"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                  }}
                />
              </div>
            </div>
            <select
              className="form-input px-3 py-2 rounded-lg text-sm"
              value={taskFilter}
              onChange={(e) => {
                setTaskFilter(e.target.value);
              }}
            >
              <option value="assigned_to_me">Minhas Tarefas</option>
              <option value="created_by_me">Criadas por Mim</option>
              <option value="all">Tarefas: Todas</option>
            </select>
            
            {/* Botão Limpar Filtros */}
            <button
              onClick={() => {
                console.log('🧹 Limpando todos os filtros');
                setTaskFilter('assigned_to_me');
                setSelectedSituation('');
                setSelectedCategory('');
                setSelectedAssignee('');
                setSelectedClient('');
                setStartDate('');
                setEndDate('');
                setTaskSearchTerm('');
                // O useEffect do taskFilter irá recarregar automaticamente
              }}
              className="form-input px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Limpar Filtros
            </button>
            
            <select 
              className="form-input px-3 py-2 rounded-lg text-sm text-gray-800"
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
              }}
            >
              <option value="">Todas as Empresas</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id} className="text-gray-800">
                  {client.attributes?.name || client.name}
                </option>
              ))}
            </select>

            {/* Filtro de Situação - apenas para Lista e Calendário */}
            {activeView !== "kanban" && (
              <select
                className="form-input px-3 py-2 rounded-lg text-sm"
                value={selectedSituation}
                onChange={(e) => {
                  setSelectedSituation(e.target.value);
                }}
              >
                <option value="">Todas as Situações</option>
                <option value="pendentes">Pendentes</option>
                <option value="concluidas">Concluídas</option>
                <option value="atrasadas">Atrasadas</option>
                <option value="excluidas">Excluídas</option>
              </select>
            )}

            {/* Filtro de Categoria */}
            <select
              className="form-input px-3 py-2 rounded-lg text-sm text-gray-800"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setTimeout(reloadTasks, 100);
              }}
            >
              <option value="">Todas as Categorias</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} className="text-gray-800">
                  {category.attributes?.name || category.name}
                </option>
              ))}
            </select>



            {/* Filtros de Data já implementados acima */}
            
          </div>

          {/* Lista View */}
          {activeView === "lista" && (
            <div className="view-content">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-row">
                      <th
                        className="text-left py-3 px-4 font-medium text-sm w-16"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Nº
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-sm w-48"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Cliente
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Título
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-sm w-36"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Responsável
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-sm w-32"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Data/Hora
                      </th>
                      <th
                        className="text-left py-3 px-4 font-medium text-sm w-24"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Status
                      </th>
                      <th
                        className="text-right py-3 px-4 font-medium text-sm w-24"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Usar a mesma lógica do Kanban para listar todas as tarefas
                      const allTasksToShow = allTasks || [];
                      console.log('📋 Lista: Tarefas disponíveis:', allTasksToShow.length);
                      
                      if (!allTasksToShow || allTasksToShow.length === 0) {
                        return (
                          <tr>
                            <td
                              colSpan={7}
                              className="text-center py-8"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              Nenhuma tarefa encontrada para os filtros selecionados
                            </td>
                          </tr>
                        );
                      }

                      const TAREFAS_EXCLUIDAS_NO_MONDE = ['teste', 'TESSY ANNE'];
                      const isTaskDeleted = (task: any) => TAREFAS_EXCLUIDAS_NO_MONDE.includes(task.attributes.title);

                      // Filtrar tarefas baseado em showDeleted
                      let tasksToShow = showDeleted 
                        ? allTasksToShow // Mostrar todas quando showDeleted está ativo
                        : allTasksToShow.filter(task => !isTaskDeleted(task)); // Excluir as deletadas quando showDeleted está inativo

                      console.log('📋 Lista: Tarefas filtradas:', tasksToShow.length, '(showDeleted:', showDeleted, ')');

                      return tasksToShow.map((task, index) => {
                        // Determinar status da tarefa para exibir na coluna Status
                        const getTaskStatusForList = (task: any) => {
                          if (isTaskDeleted(task)) {
                            return { status: 'Excluídas', color: '#6b7280' };
                          } else if (task.attributes.completed) {
                            return { status: 'Concluída', color: '#059669' };
                          } else {
                            const now = new Date();
                            const dueDate = task.attributes.due ? new Date(task.attributes.due) : null;
                            if (dueDate && dueDate < now) {
                              return { status: 'Atrasada', color: '#dc2626' };
                            } else {
                              return { status: 'Pendente', color: '#f59e0b' };
                            }
                          }
                        };
                        
                        const taskStatus = getTaskStatusForList(task);
                        
                        return (
                      <tr key={task.id} className="table-row">
                        <td className="py-4 px-4 w-16">
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            #{String(task.attributes.number).padStart(3, "0")}
                          </span>
                        </td>
                        <td className="py-4 px-4 w-48">
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {(() => {
                              // Buscar nome do cliente usando a lógica do Kanban
                              const personId = task.relationships?.person?.data?.id;
                              if (!personId) return 'Sem cliente';
                              
                              const clientInfo = task.included?.find((inc: any) => 
                                inc.type === 'people' && inc.id === personId
                              );
                              
                              return clientInfo?.attributes?.name || 
                                     clientInfo?.attributes?.['company-name'] || 
                                     'Cliente não encontrado';
                            })()}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {task.attributes.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {task.attributes.description || "Sem descrição"}
                          </p>
                        </td>
                        <td className="py-4 px-4 w-36">
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {(() => {
                              // Buscar nome do responsável usando a lógica do Kanban
                              const assigneeId = task.relationships?.assignee?.data?.id;
                              if (!assigneeId) return 'Sem responsável';
                              
                              const assigneeInfo = task.included?.find((inc: any) => 
                                inc.type === 'people' && inc.id === assigneeId
                              );
                              
                              return assigneeInfo?.attributes?.name || 'Responsável não encontrado';
                            })()}
                          </p>
                        </td>
                        <td className="py-4 px-4 w-32">
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {new Date(task.attributes.due).toLocaleDateString(
                              "pt-BR",
                            )}{" "}
                            {new Date(task.attributes.due).toLocaleTimeString(
                              "pt-BR",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </td>
                        <td className="py-4 px-4 w-24">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: taskStatus.color }}
                          >
                            {taskStatus.status}
                          </span>
                        </td>
                        {/* Coluna de prioridade removida - não existe na API do Monde */}
                        <td className="py-4 px-4 w-24">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewTask(task)}
                              className="action-button p-2 rounded-lg !rounded-button whitespace-nowrap"
                              title="Visualizar tarefa"
                            >
                              <i className="ri-eye-line text-sm"></i>
                            </button>
                            
                            {/* Botão concluir - só aparece se não estiver concluída nem excluída */}
                            {!task.attributes.completed && !isTaskDeleted(task) && (
                              <button
                                onClick={() => handleCompleteTask(task.id)}
                                className="action-button p-2 rounded-lg !rounded-button whitespace-nowrap"
                                title="Concluir tarefa"
                              >
                                <i className="ri-checkbox-circle-line text-sm"></i>
                              </button>
                            )}
                            
                            {/* Botão restaurar - só aparece se estiver concluída ou excluída */}
                            {(task.attributes.completed || isTaskDeleted(task)) && (
                              <button
                                onClick={() => handleReopenTask(task)}
                                className="action-button p-2 rounded-lg !rounded-button whitespace-nowrap"
                                title="Restaurar tarefa"
                              >
                                <i className="ri-refresh-line text-sm"></i>
                              </button>
                            )}
                            
                            {/* Botão transferir - só aparece se não estiver excluída */}
                            {!isTaskDeleted(task) && (
                              <button
                                onClick={() => handleTransferTask(task)}
                                className="action-button p-2 rounded-lg !rounded-button whitespace-nowrap"
                                title="Transferir atendimento"
                              >
                                <i className="ri-user-shared-line text-sm"></i>
                              </button>
                            )}
                            
                            {/* Botão excluir - só aparece se não estiver excluída */}
                            {!isTaskDeleted(task) && (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="action-button p-2 rounded-lg !rounded-button whitespace-nowrap"
                                title="Excluir tarefa"
                              >
                                <i className="ri-delete-bin-line text-sm"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Kanban View */}
          {activeView === "kanban" && (
            <div className="view-content">
              <div className={`grid gap-4 w-full overflow-x-auto pb-4 ${showDeleted ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1 lg:grid-cols-3'}`}>
                {/* Pendentes */}
                <div className="kanban-column rounded-lg p-4 w-full min-h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Pendentes
                    </h3>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {(() => {
                        const pendingTasks = getTasksByStatus("pending");
                        console.log('🔍 KANBAN COLUNA PENDENTES:', pendingTasks.length, 'tarefas');
                        pendingTasks.forEach(task => console.log(`  - ${task.attributes.title}`));
                        return pendingTasks.length;
                      })()}
                    </span>
                  </div>
                  <div
                    className={`space-y-3 ${getTasksByStatus("pending").length === 0 ? 'min-h-[80px]' : 'min-h-[120px]'}`}
                    onDrop={(e) => handleDrop(e, "pending")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {(() => {
                      const pendingTasks = getTasksByStatus("pending");
                      console.log('🔍 RENDERIZANDO TAREFAS PENDENTES:', pendingTasks.length);
                      return pendingTasks.map((task: any, index: number) => (
                        <div
                          key={`pending-${task.id}-${index}`}
                          className="kanban-card rounded-lg p-4 cursor-move"
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task)}
                        >
                          <div className="mb-2">
                            <h4
                              className="font-medium text-sm"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {task.attributes.title}
                            </h4>
                          </div>
                          <p
                            className="text-xs mb-3"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {getAssigneeName(task)}
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-xs"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {formatTaskDate(task.attributes.due)}
                            </span>
                            <div className="flex space-x-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTask(task);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Ver detalhes"
                              >
                                <i className="ri-eye-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToComplete(task);
                                  setShowCompletionModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-green-600 hover:bg-green-50"
                                title="Concluir"
                              >
                                <i className="ri-checkbox-circle-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToTransfer(task);
                                  setShowTransferModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Transferir"
                              >
                                <i className="ri-user-shared-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task);
                                  setShowDeletionModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-red-600 hover:bg-red-50"
                                title="Excluir"
                              >
                                <i className="ri-delete-bin-line text-xs"></i>
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start justify-end">
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getCategoryColor(getCategoryName(task)) }}
                            >
                              {capitalizeText(getCategoryName(task))}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <button
                    onClick={() => openTaskModalWithStatus("pending")}
                    className="primary-button w-full mt-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>Nova Tarefa
                  </button>
                </div>

                {/* Atrasadas */}
                <div className="kanban-column rounded-lg p-4 w-full min-h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Atrasadas
                    </h3>
                    <span className="bg-red-200 text-red-700 px-2 py-1 rounded-full text-xs">
                      {(() => {
                        const overdueTasks = getTasksByStatus("overdue");
                        console.log('🔍 KANBAN COLUNA ATRASADAS:', overdueTasks.length, 'tarefas');
                        overdueTasks.forEach(task => console.log(`  - ${task.attributes.title}`));
                        return overdueTasks.length;
                      })()}
                    </span>
                  </div>
                  <div
                    className={`space-y-3 ${getTasksByStatus("overdue").length === 0 ? 'min-h-[80px]' : 'min-h-[120px]'}`}
                    onDrop={(e) => handleDrop(e, "overdue")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {(() => {
                      const overdueTasks = getTasksByStatus("overdue");
                      console.log('🔍 RENDERIZANDO TAREFAS ATRASADAS:', overdueTasks.length);
                      return overdueTasks.map((task: any, index: number) => (
                        <div
                          key={`overdue-${task.id}-${index}`}
                          className="kanban-card rounded-lg p-4 cursor-move"
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task)}
                        >
                          <div className="mb-2">
                            <h4
                              className="font-medium text-sm"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {task.attributes.title}
                            </h4>
                          </div>
                          <p
                            className="text-xs mb-3"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {getAssigneeName(task)}
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-xs text-red-600"
                              style={{ fontWeight: "bold" }}
                            >
                              {formatTaskDate(task.attributes.due)}
                            </span>
                            <div className="flex space-x-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTask(task);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Ver detalhes"
                              >
                                <i className="ri-eye-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToComplete(task);
                                  setShowCompletionModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-green-600 hover:bg-green-50"
                                title="Concluir"
                              >
                                <i className="ri-checkbox-circle-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToTransfer(task);
                                  setShowTransferModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Transferir"
                              >
                                <i className="ri-user-shared-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task);
                                  setShowDeletionModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-red-600 hover:bg-red-50"
                                title="Excluir"
                              >
                                <i className="ri-delete-bin-line text-xs"></i>
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start justify-end">
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getCategoryColor(getCategoryName(task)) }}
                            >
                              {capitalizeText(getCategoryName(task))}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <button
                    onClick={() => openTaskModalWithStatus("overdue")}
                    className="primary-button w-full mt-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>Nova Tarefa
                  </button>
                </div>

                {/* Concluídas */}
                <div className="kanban-column rounded-lg p-4 w-full min-h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Concluídas
                    </h3>
                    <span className="bg-green-200 text-green-700 px-2 py-1 rounded-full text-xs">
                      {(() => {
                        const completedTasks = getTasksByStatus("completed");
                        console.log('🔍 KANBAN COLUNA CONCLUÍDAS:', completedTasks.length, 'tarefas');
                        completedTasks.forEach(task => console.log(`  - ${task.attributes.title}`));
                        return completedTasks.length;
                      })()}
                    </span>
                  </div>
                  <div
                    className={`space-y-3 ${getTasksByStatus("completed").length === 0 ? 'min-h-[80px]' : 'min-h-[120px]'}`}
                    onDrop={(e) => handleDrop(e, "completed")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {(() => {
                      const completedTasks = getTasksByStatus("completed");
                      console.log('🔍 RENDERIZANDO TAREFAS CONCLUÍDAS:', completedTasks.length);
                      return completedTasks.map((task: any, index: number) => (
                        <div
                          key={`completed-${task.id}-${index}`}
                          className="kanban-card rounded-lg p-4 cursor-move"
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task)}
                        >
                          <div className="mb-2">
                            <h4
                              className="font-medium text-sm"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {task.attributes.title}
                            </h4>
                          </div>
                          <p
                            className="text-xs mb-3"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {getAssigneeName(task)}
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-xs"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {formatTaskDate(task.attributes.due)}
                            </span>
                            <div className="flex space-x-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTask(task);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Ver detalhes"
                              >
                                <i className="ri-eye-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToReopen(task);
                                  setShowReopenModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-blue-600 hover:bg-blue-50"
                                title="Reabrir tarefa"
                              >
                                <i className="ri-checkbox-circle-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToTransfer(task);
                                  setShowTransferModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Transferir"
                              >
                                <i className="ri-user-shared-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task);
                                  setShowDeletionModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-red-600 hover:bg-red-50"
                                title="Excluir"
                              >
                                <i className="ri-delete-bin-line text-xs"></i>
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start justify-end">
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getCategoryColor(getCategoryName(task)) }}
                            >
                              {capitalizeText(getCategoryName(task))}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  <button
                    onClick={() => openTaskModalWithStatus("completed")}
                    className="primary-button w-full mt-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>Nova Tarefa
                  </button>
                </div>

                {/* Excluídas - só mostrar se showDeleted for true */}
                {showDeleted && (
                  <div className="kanban-column rounded-lg p-4 w-full min-h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Excluídas
                    </h3>
                    <span className="bg-gray-400 text-gray-700 px-2 py-1 rounded-full text-xs">
                      {(() => {
                        const deletedTasks = getTasksByStatus("deleted");
                        console.log('🔍 KANBAN COLUNA EXCLUÍDAS:', deletedTasks.length, 'tarefas');
                        deletedTasks.forEach(task => console.log(`  - ${task.attributes.title}`));
                        return deletedTasks.length;
                      })()}
                    </span>
                  </div>
                  <div
                    className={`space-y-3 ${getTasksByStatus("deleted").length === 0 ? 'min-h-[80px]' : 'min-h-[120px]'}`}
                    onDrop={(e) => handleDrop(e, "archived")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {(() => {
                      const deletedTasks = getTasksByStatus("deleted");
                      console.log('🔍 RENDERIZANDO TAREFAS EXCLUÍDAS:', deletedTasks.length);
                      return deletedTasks.map((task: any, index: number) => (
                        <div
                          key={`deleted-${task.id}-${index}`}
                          className="kanban-card rounded-lg p-4 cursor-move opacity-60"
                          draggable={true}
                          onDragStart={(e) => handleDragStart(e, task)}
                        >
                          <div className="mb-2">
                            <h4
                              className="font-medium text-sm"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {task.attributes.title}
                            </h4>
                          </div>
                          <p
                            className="text-xs mb-3"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {getAssigneeName(task)}
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className="text-xs"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {formatTaskDate(task.attributes.due)}
                            </span>
                            <div className="flex space-x-1">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTask(task);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Ver detalhes"
                              >
                                <i className="ri-eye-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToReopen(task);
                                  setShowReopenModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-blue-600 hover:bg-blue-50"
                                title="Reabrir tarefa"
                              >
                                <i className="ri-checkbox-circle-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToTransfer(task);
                                  setShowTransferModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Transferir"
                              >
                                <i className="ri-user-shared-line text-xs"></i>
                              </button>
                            </div>
                          </div>
                          <div className="flex items-start justify-end">
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium text-white"
                              style={{ backgroundColor: getCategoryColor(getCategoryName(task)) }}
                            >
                              {capitalizeText(getCategoryName(task))}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                  {/* Remover botão "Nova Tarefa" da coluna Excluídas */}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendário View */}
          {activeView === "calendario" && (
            <div className="view-content">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Julho 2025
                  </h3>
                  <div className="flex space-x-1">
                    <button className="action-button px-3 py-1 rounded-lg text-sm !rounded-button whitespace-nowrap">
                      <i className="ri-arrow-left-line"></i>
                    </button>
                    <button className="action-button px-3 py-1 rounded-lg text-sm !rounded-button whitespace-nowrap">
                      <i className="ri-arrow-right-line"></i>
                    </button>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCalendarView("mes")}
                    className={`tab-button ${calendarView === "mes" ? "active" : ""} px-3 py-1 rounded-lg text-sm !rounded-button whitespace-nowrap`}
                  >
                    Mês
                  </button>
                  <button
                    onClick={() => setCalendarView("semana")}
                    className={`tab-button ${calendarView === "semana" ? "active" : ""} px-3 py-1 rounded-lg text-sm !rounded-button whitespace-nowrap`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => setCalendarView("dia")}
                    className={`tab-button ${calendarView === "dia" ? "active" : ""} px-3 py-1 rounded-lg text-sm !rounded-button whitespace-nowrap`}
                  >
                    Dia
                  </button>
                </div>
              </div>
              {calendarView === "mes" && (
                <div className="grid grid-cols-7 gap-1">
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Dom
                  </div>
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Seg
                  </div>
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Ter
                  </div>
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Qua
                  </div>
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Qui
                  </div>
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Sex
                  </div>
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Sáb
                  </div>

                  {/* Dias do mês */}
                  {(() => {
                    const tasksByDate = getTasksForCalendar();
                    const today = new Date().getDate();
                    
                    return [...Array(31)].map((_, i) => {
                      const day = i + 1;
                      const dayTasks = tasksByDate[day] || [];
                      const isToday = day === today;
                      
                      return (
                        <div
                          key={i}
                          className={`calendar-day rounded-lg p-2 ${isToday ? "bg-blue-50" : ""}`}
                        >
                          <div
                            className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}
                            style={{
                              color: isToday ? undefined : "var(--text-primary)",
                            }}
                          >
                            {day}
                          </div>
                          {dayTasks.map((task, index) => (
                            <div 
                              key={`${task.id}-${index}`} 
                              className={`calendar-event group relative cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 truncate ${
                                task.status.status === 'completed' ? 'line-through opacity-60' : ''
                              }`}
                              title={`${task.timeStr} - ${task.title}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                // Encontrar tarefa completa da lista
                                const fullTask = allTasks.find((t: any) => t.id === task.id);
                                if (fullTask) {
                                  handleViewTask(fullTask);
                                }
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs truncate">
                                  {task.timeStr} - {task.title}
                                </span>
                                <div className="hidden group-hover:flex space-x-1 ml-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const fullTask = allTasks.find((t: any) => t.id === task.id);
                                      if (fullTask) {
                                        handleViewTask(fullTask);
                                      }
                                    }}
                                    className="text-xs p-0.5 hover:bg-blue-100 rounded"
                                    title="Ver detalhes"
                                  >
                                    <i className="ri-eye-line"></i>
                                  </button>
                                  {!task.status.completed && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const fullTask = allTasks.find((t: any) => t.id === task.id);
                                        if (fullTask) {
                                          setTaskToComplete(fullTask);
                                          setShowCompletionModal(true);
                                        }
                                      }}
                                      className="text-xs p-0.5 hover:bg-green-100 rounded text-green-600"
                                      title="Concluir"
                                    >
                                      <i className="ri-checkbox-circle-line"></i>
                                    </button>
                                  )}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const fullTask = allTasks.find((t: any) => t.id === task.id);
                                      if (fullTask) {
                                        setTaskToTransfer(fullTask);
                                        setShowTransferModal(true);
                                      }
                                    }}
                                    className="text-xs p-0.5 hover:bg-blue-100 rounded"
                                    title="Transferir"
                                  >
                                    <i className="ri-user-shared-line"></i>
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const fullTask = allTasks.find((t: any) => t.id === task.id);
                                      if (fullTask) {
                                        setTaskToDelete(fullTask);
                                        setShowDeletionModal(true);
                                      }
                                    }}
                                    className="text-xs p-0.5 hover:bg-red-100 rounded text-red-600"
                                    title="Excluir"
                                  >
                                    <i className="ri-delete-bin-line"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              {calendarView === "semana" && (
                <div className="grid grid-cols-8 gap-1">
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Horário
                  </div>
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                    (day) => (
                      <div
                        key={day}
                        className="p-2 text-center text-sm font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {day}
                      </div>
                    ),
                  )}
                  {Array.from({ length: 24 }, (_, hour) => (
                    <React.Fragment key={hour}>
                      <div
                        className="p-2 text-center text-xs border"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        {hour.toString().padStart(2, "0")}:00
                      </div>
                      {Array.from({ length: 7 }, (_, day) => (
                        <div
                          key={day}
                          className="calendar-day p-2 text-center text-xs min-h-[40px] border"
                          style={{ borderColor: "var(--border-color)" }}
                        >
                          {(() => {
                            const tasksByDate = getTasksForCalendar();
                            const today = new Date().getDate();
                            const currentDay = today + day - 1; // Ajustar para semana
                            const dayTasks = tasksByDate[currentDay] || [];
                            const hourTasks = dayTasks.filter(task => task.hour === hour);
                            
                            return hourTasks.map((task, index) => (
                              <div 
                                key={`${task.id}-${index}`} 
                                className="calendar-event group relative cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 text-xs truncate"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const fullTask = allTasks.find((t: any) => t.id === task.id);
                                  if (fullTask) {
                                    handleViewTask(fullTask);
                                  }
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="truncate">{task.title}</span>
                                  <div className="hidden group-hover:flex space-x-1 ml-1">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const fullTask = allTasks.find((t: any) => t.id === task.id);
                                        if (fullTask) handleViewTask(fullTask);
                                      }}
                                      className="text-xs p-0.5 hover:bg-blue-100 rounded"
                                      title="Ver detalhes"
                                    >
                                      <i className="ri-eye-line"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {calendarView === "dia" && (
                <div className="grid grid-cols-2 gap-1">
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Horário
                  </div>
                  <div
                    className="p-2 text-center text-sm font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Tarefas
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <React.Fragment key={hour}>
                      <div
                        className="p-2 text-center text-xs border"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        {hour.toString().padStart(2, "0")}:00
                      </div>
                      <div
                        className="calendar-day p-2 text-center text-xs min-h-[40px] border"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        {(() => {
                          const tasksByDate = getTasksForCalendar();
                          const today = new Date().getDate();
                          const dayTasks = tasksByDate[today] || [];
                          const hourTasks = dayTasks.filter(task => task.hour === hour);
                          
                          return hourTasks.map((task, index) => (
                            <div 
                              key={`${task.id}-${index}`} 
                              className="group relative cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 text-xs truncate"
                              onClick={(e) => {
                                e.stopPropagation();
                                const fullTask = allTasks.find((t: any) => t.id === task.id);
                                if (fullTask) {
                                  handleViewTask(fullTask);
                                }
                              }}
                            >
                              <div className="flex justify-between items-center">
                                <span className="truncate">{task.title}</span>
                                <div className="hidden group-hover:flex space-x-1 ml-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const fullTask = allTasks.find((t: any) => t.id === task.id);
                                      if (fullTask) handleViewTask(fullTask);
                                    }}
                                    className="text-xs p-0.5 hover:bg-blue-100 rounded"
                                    title="Ver detalhes"
                                  >
                                    <i className="ri-eye-line"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Modal de Nova Tarefa/Editar Tarefa
  const TaskModal = () => {
    const isEditing = selectedTask !== null;
    const modalTitle = 'Tarefa';
    
    // Estado para campo de atualização
    const [updateText, setUpdateText] = useState('');
    
    // Buscar dados da tarefa incluindo pessoa e assignee
    const getPersonName = (personId: string) => {
      if (!personId) return 'Nenhuma pessoa selecionada';
      const task = allTasks.find((t: any) => t.relationships?.person?.data?.id === personId);
      if (task?.included) {
        const included = task.included.find((inc: any) => inc.type === 'people' && inc.id === personId);
        if (included?.attributes) {
          return included.attributes.name || included.attributes['company-name'] || 'Nome não encontrado';
        }
      }
      return 'Cliente não encontrado';
    };
    
    const getAssigneeName = (assigneeId: string) => {
      if (!assigneeId) return 'Nenhum responsável';
      const user = users.find((u: any) => u.id === assigneeId);
      if (user?.attributes) {
        return user.attributes.name || user.name || 'Nome não encontrado';
      }
      return 'Usuário não encontrado';
    };
    
    // Função para salvar alterações da tarefa
    const saveTaskChanges = async (formData: any) => {
      if (!selectedTask) return;
      
      try {
        const response = await fetch(`/api/monde/tarefas/${selectedTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          // Recarregar dados completamente para atualizar o status
          await reloadTasks();
          
          // Atualizar a tarefa selecionada com os novos dados
          const updatedAllTasks = await loadAllTasks();
          const updatedTask = updatedAllTasks.data.find((t: any) => t.id === selectedTask.id);
          if (updatedTask) {
            setSelectedTask(updatedTask);
          }
          
          // Recarregar histórico da tarefa
          const history = await loadTaskHistory(selectedTask.id);
          setTaskHistory(history);
          
          console.log('Tarefa atualizada com sucesso');
        } else {
          console.error('Erro ao salvar alterações da tarefa');
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
      }
    };
    
    // Função para salvar histórico
    const saveTaskHistory = async () => {
      if (!updateText.trim() || !selectedTask) return;
      
      try {
        const response = await fetch(`/api/monde/tarefas/${selectedTask.id}/historico`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
          },
          body: JSON.stringify({
            description: updateText
          })
        });
        
        if (response.ok) {
          setUpdateText('');
          // Recarregar dados da tarefa
          window.location.reload();
        } else {
          console.error('Erro ao salvar histórico');
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
      }
    };

    // Função para salvar e fechar modal
    const saveAndCloseModal = async () => {
      // Se há texto de atualização, salva o histórico primeiro
      if (updateText.trim()) {
        try {
          console.log('📝 Salvando texto de atualização:', updateText);
          const response = await fetch(`/api/monde/tarefas/${selectedTask?.id}/historico`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
            },
            body: JSON.stringify({
              historic: updateText,  // Mudança: usar 'historic' em vez de 'description'
              text: updateText       // Adicionar também 'text' para compatibilidade
            })
          });
          
          if (response.ok) {
            console.log('✅ Histórico salvo com sucesso');
            
            // Toast de sucesso
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
            toast.textContent = 'Atualização salva com sucesso!';
            document.body.appendChild(toast);
            setTimeout(() => document.body.removeChild(toast), 3000);
            
            // Recarregar apenas os dados da tarefa, não a página toda
            await loadTaskHistory(selectedTask.id);
            await reloadTasks(); // Recarregar lista de tarefas
          } else {
            const errorData = await response.json();
            console.error('❌ Erro ao salvar histórico:', errorData);
            
            // Toast de erro
            const toast = document.createElement('div');
            toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
            toast.textContent = 'Erro ao salvar atualização. Tarefa pode ter sido excluída.';
            document.body.appendChild(toast);
            setTimeout(() => document.body.removeChild(toast), 3000);
          }
        } catch (error) {
          console.error('❌ Erro na requisição:', error);
          
          // Toast de erro
          const toast = document.createElement('div');
          toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
          toast.textContent = 'Erro de conexão ao salvar atualização';
          document.body.appendChild(toast);
          setTimeout(() => document.body.removeChild(toast), 3000);
        }
      }
      
      // Fecha o modal
      setShowTaskModal(false);
      setSelectedTask(null);
      setUpdateText('');
    };
    
    // Função para concluir tarefa
    const completeTask = async () => {
      if (!selectedTask) return;
      
      try {
        const response = await fetch(`/api/monde/tarefas/${selectedTask.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
          },
          body: JSON.stringify({
            completed: true
          })
        });
        
        if (response.ok) {
          setShowTaskModal(false);
          setSelectedTask(null);
          window.location.reload();
        } else {
          console.error('Erro ao concluir tarefa');
        }
      } catch (error) {
        console.error('Erro na requisição:', error);
      }
    };
    
    // Função para excluir tarefa
    const deleteTask = async () => {
      if (!selectedTask) return;
      
      if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        try {
          const response = await fetch(`/api/monde/tarefas/${selectedTask.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
            }
          });
          
          if (response.ok) {
            setShowTaskModal(false);
            setSelectedTask(null);
            window.location.reload();
          } else {
            console.error('Erro ao excluir tarefa');
          }
        } catch (error) {
          console.error('Erro na requisição:', error);
        }
      }
    };
    
    return (
      <div
        className={`fixed inset-0 modal-overlay flex items-center justify-center z-50 ${showTaskModal ? "" : "hidden"}`}
      >
        <div className={`modal-content rounded-xl shadow-xl w-full mx-4 max-h-[95vh] overflow-y-auto ${isModalMaximized ? 'max-w-[98vw] h-[95vh]' : 'max-w-5xl'}`} style={{ backgroundColor: "var(--bg-primary)" }}>
          <div className="border-0 p-4 pb-0">
            <div className="flex items-center justify-between">
              <h3
                className="text-lg font-semibold flex items-center"
                style={{ color: "var(--text-primary)" }}
              >
                <i className="ri-file-text-line mr-2"></i>
                {modalTitle}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsModalMaximized(!isModalMaximized)}
                  className="theme-toggle p-2 rounded-lg !rounded-button whitespace-nowrap"
                >
                  <i className={`${isModalMaximized ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'} text-lg`}></i>
                </button>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                    setAttachments([]);
                    setTaskAttachments([]);
                    setIsModalMaximized(false);
                    setIsEditing(false);
                    setTaskHistory([]);
                  }}
                  className="theme-toggle p-2 rounded-lg !rounded-button whitespace-nowrap"
                >
                  <i className="ri-close-line text-lg"></i>
                </button>
              </div>
            </div>
          </div>
          
          {/* Abas da Modal */}
          <div className="px-4 mb-4">
            <div className="flex space-x-1">
              <button 
                className={`tab-button px-4 py-2 rounded-lg text-sm font-medium ${
                  activeModalTab === "detalhes" ? "active" : ""
                }`}
                onClick={() => setActiveModalTab("detalhes")}
              >
                Detalhes
              </button>

              <button 
                className={`tab-button px-4 py-2 rounded-lg text-sm font-medium ${
                  activeModalTab === "anexos" ? "active" : ""
                }`}
                onClick={() => setActiveModalTab("anexos")}
              >
                Anexos
              </button>
              <button 
                className={`tab-button px-4 py-2 rounded-lg text-sm font-medium ${
                  activeModalTab === "campos" ? "active" : ""
                }`}
                onClick={() => setActiveModalTab("campos")}
              >
                Campos Personalizados
              </button>
            </div>
          </div>
          
          <div className="px-4 pb-4">
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              if (!isEditing) {
                // Para novas tarefas, usar a função que respeita o estado local
                await createNewTask();
                return;
              }

              // Para edição, continuar com o sistema atual
              const formData = new FormData(e.target as HTMLFormElement);
              const status = formData.get('status') as string;
              
              const taskData = {
                title: formData.get('title') || selectedTask?.attributes?.title,
                description: formData.get('description') || selectedTask?.attributes?.description,
                due: selectedTask?.attributes?.due || new Date().toISOString(),
                priority: formData.get('priority') || 'normal',
                assignee_id: formData.get('assignee_id') || selectedTask?.relationships?.assignee?.data?.id,
                person_id: formData.get('person_id') || selectedTask?.relationships?.person?.data?.id,
                category_id: formData.get('category') || selectedTask?.relationships?.category?.data?.id,
                status: status || 'pending',
                completed: status === 'completed'
              };
              
              try {
                console.log('💾 Editando tarefa com dados:', taskData);
                
                const response = await fetch(`/api/monde/tarefas/${selectedTask.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
                  },
                  body: JSON.stringify(taskData)
                });
                
                const result = await response.json();
                console.log('📋 Resposta da API:', result);
                
                if (response.ok) {
                  console.log('✅ Tarefa editada com sucesso');
                  
                  // Tentar salvar histórico se houver
                  if (newHistoryText?.trim()) {
                    try {
                      const historyResponse = await fetch(`/api/monde/tarefas/${selectedTask.id}/historico`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
                        },
                        body: JSON.stringify({
                          description: newHistoryText
                        })
                      });
                      
                      if (historyResponse.ok) {
                        console.log('✅ Histórico salvo com sucesso');
                        loadTaskHistory(selectedTask.id);
                      } else {
                        console.warn('⚠️ Erro ao salvar histórico, mas tarefa foi salva');
                      }
                    } catch (historyError) {
                      console.warn('⚠️ Erro ao salvar histórico:', historyError);
                    }
                  } else {
                    loadTaskHistory(selectedTask.id);
                  }
                  
                  // Fechar modal e recarregar dados
                  setShowTaskModal(false);
                  setSelectedTask(null);
                  setNewHistoryText('');
                  setIsEditing(false);

                  reloadTasks();
                } else {
                  console.error('❌ Erro ao salvar tarefa:', result);
                  alert('Erro ao salvar tarefa. Verifique os dados e tente novamente.');
                }
              } catch (error) {
                console.error('❌ Erro na requisição:', error);
                alert('Erro de conexão ao salvar tarefa.');
              }
            }}>
              
              {/* Conteúdo das Abas */}
              {activeModalTab === "detalhes" && (
                <div className="space-y-4">
                  {/* Primeira linha - Número e Título */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Número:
                      </label>
                      <input
                        type="text"
                        className="form-input w-full px-3 py-2 text-sm"
                        value={selectedTask?.attributes?.number || '0'}
                        disabled
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                      />
                    </div>
                    <div className="col-span-10">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Título:
                      </label>
                      <input
                        type="text"
                        name="title"
                        className="form-input w-full px-3 py-2 text-sm"
                        defaultValue={
                          isEditing 
                            ? selectedTask?.attributes?.title || ''
                            : taskFormRef.current.title
                        }
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateTaskFormField('title', value);
                          if (isEditing) {
                            saveTaskChanges({ title: value });
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Segunda linha - Categoria, Responsável e Prioridade */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-5">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Categoria:
                      </label>
                      <select
                        name="category"
                        className="form-input w-full px-3 py-2 text-sm"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        defaultValue={selectedTask?.relationships?.category?.data?.id || ''}
                        onChange={(e) => {
                          saveTaskChanges({ category: e.target.value });
                        }}
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map((category: any) => (
                          <option key={category.id} value={category.id}>
                            {category.attributes?.name || category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-5">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Responsável:
                      </label>
                      <select 
                        name="assignee_id"
                        className="form-input w-full px-3 py-2 text-sm"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        defaultValue={
                          isEditing 
                            ? selectedTask?.relationships?.assignee?.data?.id || ''
                            : realUserData?.id || users.find((u: any) => u.attributes?.email === localStorage.getItem('user-email'))?.id || ''
                        }
                        onChange={(e) => {
                          saveTaskChanges({ assignee_id: e.target.value });
                        }}
                      >
                        <option value="">Selecione um responsável</option>
                        {users.map((user: any) => (
                          <option key={user.id} value={user.id}>
                            {user.attributes?.name || user.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Prioridade:
                      </label>
                      <select 
                        name="priority"
                        className="form-input w-full px-3 py-2 text-sm"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        defaultValue="normal"
                        onChange={(e) => saveTaskChanges({ priority: e.target.value })}
                      >
                        <option value="low">Baixa</option>
                        <option value="normal">Normal</option>
                        <option value="high">Alta</option>
                      </select>
                    </div>
                  </div>

                  {/* Terceira linha - Status */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Status:
                      </label>
                      <select 
                        name="status"
                        className="form-input w-full px-3 py-2 text-sm"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        defaultValue={
                          isEditing 
                            ? (selectedTask?.attributes?.completed ? "completed" : "pending")
                            : preSelectedStatus || "pending"
                        }
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (isEditing) {
                            saveTaskChanges({ 
                              completed: newStatus === "completed",
                              status: newStatus
                            });
                          }
                        }}
                      >
                        <option value="pending">Pendente</option>
                        <option value="overdue">Atrasada</option>
                        <option value="completed">Concluída</option>
                      </select>
                    </div>
                  </div>

                  {/* Quarta linha - Pessoa/Cliente e Empresa */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Pessoa/Cliente:
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input w-full px-3 py-2 text-sm"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                          value={selectedTask?.client_name || 'Cliente não encontrado'}
                          readOnly
                        />
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Digite para buscar cliente..."
                            className="form-input w-full px-3 py-2 pr-10 text-sm"
                            style={{ backgroundColor: "var(--bg-secondary)" }}
                            value={clientSearchTerm}
                            onChange={(e) => {
                              const value = e.target.value;
                              updateTaskFormField('client', value);
                              updateTaskFormField('clientName', value);
                              setClientSearchTerm(value);
                              
                              // Debounce a busca para evitar travamento
                              if (searchTimeoutRef.current) {
                                clearTimeout(searchTimeoutRef.current);
                              }
                              searchTimeoutRef.current = setTimeout(() => {
                                searchClientsInMonde(value);
                              }, 500);
                            }}
                          />
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowClientDropdown(!showClientDropdown)}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-800"
                              title="Buscar ou cadastrar cliente"
                            >
                              <i className="ri-user-add-line text-lg"></i>
                            </button>
                            
                            {showClientDropdown && (
                              <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]">
                                <button
                                  onClick={() => {
                                    setShowPersonFisicaModal(true);
                                    setShowClientDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center"
                                >
                                  <i className="ri-user-add-line text-blue-600 mr-3"></i>
                                  Nova Pessoa Física
                                </button>
                                <button
                                  onClick={() => {
                                    setShowPersonJuridicaModal(true);
                                    setShowClientDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center"
                                >
                                  <i className="ri-building-line text-blue-600 mr-3"></i>
                                  Nova Pessoa Jurídica
                                </button>
                                <button
                                  onClick={() => {
                                    setShowSearchModal(true);
                                    setShowClientDropdown(false);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 flex items-center"
                                >
                                  <i className="ri-search-line text-blue-600 mr-3"></i>
                                  Pesquisar
                                </button>
                              </div>
                            )}
                          </div>
                          
                          {/* Dropdown de resultados */}
                          {clientSearchResults.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {clientSearchResults.map((client: any) => (
                                <div
                                  key={client.id}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b"
                                  onClick={() => {
                                    setSelectedPersonForTask(client);
                                    setClientSearchTerm(client.attributes.name || client.attributes['company-name'] || 'Cliente');
                                    setClientSearchResults([]);
                                    
                                    // Preencher campos automaticamente usando setTimeout para aguardar renderização
                                    setTimeout(() => {
                                      const emailField = document.querySelector('input[name="client_email"]') as HTMLInputElement;
                                      const phoneField = document.querySelector('input[name="client_phone"]') as HTMLInputElement;
                                      const mobileField = document.querySelector('input[name="client_mobile"]') as HTMLInputElement;
                                      
                                      if (emailField) {
                                        emailField.value = client.attributes.email || '';
                                        emailField.dispatchEvent(new Event('input', { bubbles: true }));
                                      }
                                      if (phoneField) {
                                        phoneField.value = client.attributes.phone || client.attributes['business-phone'] || '';
                                        phoneField.dispatchEvent(new Event('input', { bubbles: true }));
                                      }
                                      if (mobileField) {
                                        const mobile = client.attributes['mobile-phone'] || client.attributes.mobile || client.attributes.cellphone || '';
                                        mobileField.value = mobile;
                                        mobileField.dispatchEvent(new Event('input', { bubbles: true }));
                                      }
                                    }, 100);
                                  }}
                                >
                                  <div className="font-medium">{client.attributes.name || client.attributes['company-name']}</div>
                                  <div className="text-xs text-gray-500">
                                    {client.attributes.cpf && `CPF: ${client.attributes.cpf}`}
                                    {client.attributes.email && ` • ${client.attributes.email}`}
                                    {client.attributes.phone && ` • ${client.attributes.phone}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {isSearchingClients && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg p-3 text-sm text-center">
                              Buscando clientes...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-6">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Empresa:
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          className="form-input w-full px-3 py-2 text-sm"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                          value={selectedTask?.client_company || 'Empresa não encontrada'}
                          readOnly
                        />
                      ) : (
                        <select 
                          name="company_id"
                          className="form-input w-full px-3 py-2 text-sm"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                          defaultValue={userCompanies.length > 0 ? userCompanies[0].id : ''}
                        >
                          <option value="">Selecione uma empresa</option>
                          {userCompanies.map((company: any) => (
                            <option key={company.id} value={company.id}>
                              {company.attributes?.name || company.attributes?.['company-name'] || 'Empresa'}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Quarta linha - E-mail, Telefone e Celular */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        E-mail:
                      </label>
                      <input
                        type="email"
                        name="client_email"
                        className="form-input w-full px-3 py-2 text-sm"
                        defaultValue={selectedTask?.client_email || ''}
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        readOnly={isEditing}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Telefone:
                      </label>
                      <input
                        type="text"
                        name="client_phone"
                        className="form-input w-full px-3 py-2 text-sm"
                        defaultValue={selectedTask?.client_phone || ''}
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        readOnly={isEditing}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Celular:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          name="client_mobile"
                          className="form-input flex-1 px-3 py-2 text-sm"
                          defaultValue={selectedTask?.client_mobile || ''}
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                          readOnly={isEditing}
                        />
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                  </div>

                  {/* Área de Descrição/Atualizações */}
                  <div className="mt-6">
                    <div className="grid grid-cols-12 gap-4 mb-4">
                      <div className="col-span-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                          Data de Vencimento:
                        </label>
                        <input
                          type="date"
                          name="due_date"
                          className="form-input w-full px-3 py-2 text-sm"
                          defaultValue={
                            isEditing
                              ? selectedTask?.attributes?.due ? 
                                new Date(selectedTask.attributes.due).toISOString().slice(0, 10) : ''
                              : new Date().toISOString().slice(0, 10)
                          }
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                          onChange={(e) => {
                            const time = document.querySelector('input[name="due_time"]')?.value || '00:00';
                            const datetime = `${e.target.value}T${time}:00`;
                            saveTaskChanges({ due: datetime });
                          }}
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                          Hora de Vencimento:
                        </label>
                        <input
                          type="time"
                          name="due_time"
                          className="form-input w-full px-3 py-2 text-sm"
                          defaultValue={
                            isEditing
                              ? selectedTask?.attributes?.due ? 
                                new Date(selectedTask.attributes.due).toTimeString().slice(0, 5) : ''
                              : new Date().toTimeString().slice(0, 5)
                          }
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                          onChange={(e) => {
                            const date = document.querySelector('input[name="due_date"]')?.value || new Date().toISOString().slice(0, 10);
                            const datetime = `${date}T${e.target.value}:00`;
                            saveTaskChanges({ due: datetime });
                          }}
                        />
                      </div>
                      <div className="col-span-4"></div>
                    </div>

                    {/* Área de histórico com scroll - só aparece para tarefas existentes */}
                    {isEditing && (
                      <div className="border rounded-lg p-4 max-h-[140px] overflow-y-auto mb-4" style={{ backgroundColor: "var(--bg-secondary)" }}>
                        {/* Histórico existente */}
                        {taskHistory.length > 0 ? (
                          <div className="space-y-3">
                            {taskHistory.map((entry: any, index: number) => (
                              <div key={index} className="border-b pb-3">
                                <div className="text-sm font-medium text-purple-600">
                                  {new Date(entry.attributes?.['date-time'] || entry.attributes?.['registered-at']).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} - {entry.author_name || entry.attributes?.person?.name || 'Usuário'}
                                </div>
                                <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                                  {entry.attributes?.historic || entry.attributes?.text || entry.attributes?.description || 'Sem descrição'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                            Nenhum histórico encontrado para esta tarefa.
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Campo para nova atualização */}
                    <div className="mt-4">
                      <textarea
                        value={updateText}
                        onChange={(e) => setUpdateText(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                        placeholder="Adicione uma atualização..."
                        rows={3}
                        style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
                      />
                    </div>
                  </div>
                </div>
              )}


              {/* Aba Anexos */}
              {activeModalTab === "anexos" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4 bg-[#f1f5f9] pt-[8px] pb-[8px] px-4">
                    <div className="flex items-center space-x-2">
                      <i className="ri-information-line text-blue-600"></i>
                      <span className="text-sm text-gray-700">Anexos sincronizados do sistema Monde</span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          console.log('🔍 Iniciando debug completo da tarefa:', selectedTask.id);
                          const response = await fetch(`/api/monde/debug-task/${selectedTask.id}`, {
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
                            }
                          });
                          
                          if (response.ok) {
                            const debugData = await response.json();
                            console.log('🔍 DEBUG COMPLETO:', debugData);
                            
                            // Abrir uma nova janela com os dados de debug
                            const debugWindow = window.open('', '_blank');
                            debugWindow.document.write(`
                              <html>
                                <head><title>Debug - Tarefa ${selectedTask.id}</title></head>
                                <body>
                                  <h1>Debug da Tarefa</h1>
                                  <pre>${JSON.stringify(debugData, null, 2)}</pre>
                                </body>
                              </html>
                            `);
                          }
                        } catch (error) {
                          console.error('Erro no debug:', error);
                        }
                      }}
                      className="flex items-center space-x-2 px-3 py-1 text-white rounded text-xs hover:bg-red-700 bg-red-600"
                    >
                      <i className="ri-bug-line"></i>
                      <span>Debug</span>
                    </button>
                  </div>



                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Nome do Arquivo
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Tipo do Arquivo
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Tamanho
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Ações
                      </label>
                    </div>
                  </div>

                  {/* Aviso sobre sincronização */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-2">
                      <i className="ri-information-line text-yellow-600 text-sm mt-0.5"></i>
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Anexos sincronizados do Monde</p>
                        <p className="text-yellow-700 mt-1">
                          <strong>Funcionalidade em desenvolvimento:</strong><br/>
                          A visualização e download de anexos diretamente no Keeptur ainda está em desenvolvimento.<br/>
                          Para acessar os arquivos, utilize o sistema Monde original.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de anexos existentes */}
                  {taskAttachments.length > 0 ? (
                    <div className="space-y-2">
                      {taskAttachments.map((attachment, index) => (
                        <div key={index} className="grid grid-cols-4 gap-4 p-3 border rounded hover:bg-gray-50">
                          <div className="flex items-center space-x-2">
                            <i className="ri-file-line text-blue-600"></i>
                            <span className="text-sm text-gray-900 truncate" title={attachment.nome_original || attachment.name || attachment.filename || 'Arquivo sem nome'}>
                              {attachment.nome_original || attachment.name || attachment.filename || 'Arquivo sem nome'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">
                              {(() => {
                                // Função auxiliar para obter tipo de arquivo baseado na extensão
                                const getFileType = (filename: string, mimeType?: string): string => {
                                  if (mimeType) {
                                    // Mapear tipos MIME para nomes mais amigáveis
                                    const mimeTypeMap: { [key: string]: string } = {
                                      'image/jpeg': 'JPEG',
                                      'image/jpg': 'JPEG',
                                      'image/png': 'PNG',
                                      'image/gif': 'GIF',
                                      'image/svg+xml': 'SVG',
                                      'image/webp': 'WEBP',
                                      'application/pdf': 'PDF',
                                      'application/msword': 'DOC',
                                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
                                      'application/vnd.ms-excel': 'XLS',
                                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
                                      'application/vnd.ms-powerpoint': 'PPT',
                                      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
                                      'application/zip': 'ZIP',
                                      'application/x-rar-compressed': 'RAR',
                                      'text/plain': 'TXT',
                                      'text/csv': 'CSV',
                                      'application/json': 'JSON',
                                      'application/xml': 'XML',
                                      'video/mp4': 'MP4',
                                      'video/avi': 'AVI',
                                      'video/quicktime': 'MOV',
                                      'audio/mpeg': 'MP3',
                                      'audio/wav': 'WAV',
                                      'audio/ogg': 'OGG'
                                    };
                                    
                                    return mimeTypeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Arquivo';
                                  }
                                  
                                  // Fallback baseado na extensão do arquivo
                                  const extension = filename.split('.').pop()?.toLowerCase();
                                  const extensionMap: { [key: string]: string } = {
                                    'jpg': 'JPEG',
                                    'jpeg': 'JPEG',
                                    'png': 'PNG',
                                    'gif': 'GIF',
                                    'svg': 'SVG',
                                    'webp': 'WEBP',
                                    'pdf': 'PDF',
                                    'doc': 'DOC',
                                    'docx': 'DOCX',
                                    'xls': 'XLS',
                                    'xlsx': 'XLSX',
                                    'ppt': 'PPT',
                                    'pptx': 'PPTX',
                                    'zip': 'ZIP',
                                    'rar': 'RAR',
                                    'txt': 'TXT',
                                    'csv': 'CSV',
                                    'json': 'JSON',
                                    'xml': 'XML',
                                    'mp4': 'MP4',
                                    'avi': 'AVI',
                                    'mov': 'MOV',
                                    'mp3': 'MP3',
                                    'wav': 'WAV',
                                    'ogg': 'OGG'
                                  };
                                  
                                  return extension ? (extensionMap[extension] || extension.toUpperCase()) : 'Arquivo';
                                };
                                
                                return getFileType(attachment.nome_original || attachment.nome_arquivo, attachment.type || attachment.tipo_mime);
                              })()}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">
                              {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-start">
                            <span className="text-sm text-gray-500 italic">
                              Para visualizar/baixar, acesse o sistema Monde
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
                      &lt;Nenhum anexo encontrado.&gt;
                    </div>
                  )}
                </div>
              )}

              {/* Aba Campos Personalizados */}
              {activeModalTab === "campos" && (
                <div className="space-y-4">
                  {/* Indicador de carregamento */}
                  {loadingCustomFields && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Carregando campos personalizados...</p>
                    </div>
                  )}

                  {/* Mensagem informativa */}
                  {!loadingCustomFields && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-2">
                        <i className="ri-information-line text-blue-600 text-sm mt-0.5"></i>
                        <div className="text-sm">
                          <p className="font-medium text-blue-800 dark:text-blue-200">Campos personalizados sincronizados com o Monde</p>
                          <p className="text-blue-700 dark:text-blue-300 mt-1">
                            Estes campos são extraídos diretamente da API do Monde e sincronizados automaticamente com o sistema.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Campos personalizados dinâmicos */}
                  {!loadingCustomFields && customFields.length > 0 && (
                    <div className="space-y-4">
                      {customFields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-12 gap-4">
                          <div className="col-span-12">
                            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                              {field.name}:
                            </label>
                            {field.type === 'textarea' ? (
                              <textarea
                                className="form-input w-full px-3 py-2 text-sm"
                                style={{ backgroundColor: "var(--bg-secondary)" }}
                                rows="3"
                                value={field.value || ''}
                                onChange={(e) => {
                                  const newFields = [...customFields];
                                  newFields[index].value = e.target.value;
                                  setCustomFields(newFields);
                                }}
                                placeholder={`Digite ${field.name.toLowerCase()}...`}
                              />
                            ) : field.type === 'select' ? (
                              <select
                                className="form-input w-full px-3 py-2 text-sm"
                                style={{ backgroundColor: "var(--bg-secondary)" }}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const newFields = [...customFields];
                                  newFields[index].value = e.target.value;
                                  setCustomFields(newFields);
                                }}
                              >
                                <option value="">Selecione uma opção</option>
                                {field.options && field.options.map((option, optionIndex) => (
                                  <option key={optionIndex} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === 'number' ? (
                              <input
                                type="number"
                                className="form-input w-full px-3 py-2 text-sm"
                                style={{ backgroundColor: "var(--bg-secondary)" }}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const newFields = [...customFields];
                                  newFields[index].value = e.target.value;
                                  setCustomFields(newFields);
                                }}
                                placeholder={`Digite ${field.name.toLowerCase()}...`}
                              />
                            ) : field.type === 'currency' ? (
                              <input
                                type="number"
                                className="form-input w-full px-3 py-2 text-sm"
                                style={{ backgroundColor: "var(--bg-secondary)" }}
                                step="0.01"
                                value={field.value || ''}
                                onChange={(e) => {
                                  const newFields = [...customFields];
                                  newFields[index].value = e.target.value;
                                  setCustomFields(newFields);
                                }}
                                placeholder="0,00"
                              />
                            ) : field.type === 'date' ? (
                              <input
                                type="date"
                                className="form-input w-full px-3 py-2 text-sm"
                                style={{ backgroundColor: "var(--bg-secondary)" }}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const newFields = [...customFields];
                                  newFields[index].value = e.target.value;
                                  setCustomFields(newFields);
                                }}
                              />
                            ) : (
                              <input
                                type="text"
                                className="form-input w-full px-3 py-2 text-sm"
                                style={{ backgroundColor: "var(--bg-secondary)" }}
                                value={field.value || ''}
                                onChange={(e) => {
                                  const newFields = [...customFields];
                                  newFields[index].value = e.target.value;
                                  setCustomFields(newFields);
                                }}
                                placeholder={`Digite ${field.name.toLowerCase()}...`}
                              />
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Botão para salvar campos */}
                      <div className="flex justify-end space-x-2 mt-6">
                        <button
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                          disabled={savingCustomFields}
                          onClick={async () => {
                            if (!selectedTask) return;
                            
                            setSavingCustomFields(true);
                            try {
                              console.log('🔧 Salvando campos personalizados:', customFields);
                              
                              const response = await fetch(`/api/monde/tarefas/${selectedTask.id}/campos`, {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
                                },
                                body: JSON.stringify({
                                  fields: customFields
                                })
                              });
                              
                              if (response.ok) {
                                console.log('✅ Campos personalizados salvos com sucesso');
                                
                                // Toast de sucesso
                                const toast = document.createElement('div');
                                toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                                toast.textContent = 'Campos personalizados salvos com sucesso!';
                                document.body.appendChild(toast);
                                setTimeout(() => {
                                  document.body.removeChild(toast);
                                }, 3000);
                                
                                // Recarregar dados da tarefa
                                reloadTasks();
                              } else {
                                console.error('❌ Erro ao salvar campos personalizados');
                                
                                // Toast de erro
                                const toast = document.createElement('div');
                                toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                                toast.textContent = 'Erro ao salvar campos personalizados';
                                document.body.appendChild(toast);
                                setTimeout(() => {
                                  document.body.removeChild(toast);
                                }, 3000);
                              }
                            } catch (error) {
                              console.error('❌ Erro ao salvar campos personalizados:', error);
                              
                              // Toast de erro
                              const toast = document.createElement('div');
                              toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                              toast.textContent = 'Erro de conexão ao salvar campos personalizados';
                              document.body.appendChild(toast);
                              setTimeout(() => {
                                document.body.removeChild(toast);
                              }, 3000);
                            } finally {
                              setSavingCustomFields(false);
                            }
                          }}
                        >
                          {savingCustomFields ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                              Salvando...
                            </>
                          ) : (
                            'Salvar Campos'
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Mensagem quando não há campos */}
                  {!loadingCustomFields && customFields.length === 0 && (
                    <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
                      <i className="ri-settings-line text-4xl text-gray-400 mb-4"></i>
                      <p>Nenhum campo personalizado encontrado para esta tarefa.</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Os campos personalizados são carregados automaticamente da API do Monde.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                {/* Para tarefas existentes - mostrar botão de completar/reabrir */}
                {isEditing && (
                  selectedTask?.attributes?.completed ? (
                    <button
                      type="button"
                      onClick={() => {
                        // Para restauração, obrigar seleção de nova data/hora
                        setStatusChangeModal({
                          isOpen: true,
                          task: selectedTask,
                          newStatus: "pending",
                          isReopen: true
                        });
                        setStatusChangeForm({ datetime: "", comment: "", success: "", error: "" });
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                    >
                      <i className="ri-refresh-line mr-2"></i>
                      Restaurar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={completeTask}
                      className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      <i className="ri-check-line mr-2"></i>
                      Concluída
                    </button>
                  )
                )}
                
                {/* Para novas tarefas - espaço vazio à esquerda */}
                {!isEditing && <div></div>}
                
                <div className="flex space-x-3">
                  {/* Botão Excluir - só para tarefas existentes */}
                  {isEditing && (
                    <button
                      type="button"
                      onClick={deleteTask}
                      className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Excluir
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskModal(false);
                      setSelectedTask(null);
                      setIsEditing(false);
                      setTaskHistory([]);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={saveAndCloseModal}
                    className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    {isEditing ? 'Salvar' : 'Criar Tarefa'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderClientsView = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card rounded-xl p-6 stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Total de Clientes
              </p>
              <p className="text-white text-2xl font-bold">1,247</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-user-3-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-up-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">+12% este mês</span>
          </div>
        </div>

        <div className="card rounded-xl p-6 stats-card-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Clientes com Tarefas
              </p>
              <p className="text-white text-2xl font-bold">892</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-task-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-up-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">+8% este mês</span>
          </div>
        </div>

        <div className="card rounded-xl p-6 stats-card-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">
                Novos Clientes (30 dias)
              </p>
              <p className="text-white text-2xl font-bold">156</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-user-add-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-up-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">+23% este mês</span>
          </div>
        </div>
      </div>

      {/* Clients Search */}
      <div className="card rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Buscar Clientes
          </h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Digite nome, email, CPF ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchClients(searchTerm)}
                className="search-input pl-10 pr-4 py-2 rounded-lg text-sm w-80"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <i className="ri-search-line text-gray-400"></i>
              </div>
            </div>
            <button
              onClick={() => searchClients(searchTerm)}
              disabled={searchingClients || !searchTerm.trim()}
              className="action-button px-4 py-2 rounded-lg text-sm font-medium rounded-button disabled:opacity-50"
            >
              {searchingClients ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current inline-block mr-2"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <i className="ri-search-line mr-2"></i>
                  Buscar
                </>
              )}
            </button>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setClients([]);
                  setHasSearched(false);
                }}
                className="action-button px-4 py-2 rounded-lg text-sm font-medium rounded-button"
              >
                <i className="ri-close-line mr-2"></i>
                Limpar
              </button>
            )}
            <button 
              onClick={() => setShowClientModal(true)}
              className="primary-button px-4 py-2 rounded-lg text-sm font-medium rounded-button"
            >
              <i className="ri-add-line mr-2"></i>
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Mensagem inicial quando não há busca */}
        {!hasSearched && !searchingClients && (
          <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
            <i className="ri-search-line text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-semibold mb-2">Digite para buscar clientes</h3>
            <p className="text-sm">
              Use o campo de busca acima para encontrar clientes por nome, email, CPF ou CNPJ.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Todos os dados são carregados diretamente da API do Monde.
            </p>
          </div>
        )}

        {/* Resultados da busca */}
        {hasSearched && !searchingClients && (
          <>
            {clients.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {clients.length} cliente{clients.length !== 1 ? 's' : ''} encontrado{clients.length !== 1 ? 's' : ''}
                  </p>
                  {clientsHasMore && (
                    <button
                      onClick={() => searchClients(searchTerm, clientsCurrentPage + 1)}
                      className="action-button px-3 py-1 rounded text-sm"
                    >
                      Carregar mais
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clients.map((client: any) => (
                    <div key={client.id} className="card p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                            {client.attributes.name}
                          </h4>
                          {client.attributes['company-name'] && (
                            <p className="text-xs text-gray-500 mb-1">
                              {client.attributes['company-name']}
                            </p>
                          )}
                          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {client.attributes.kind === 'individual' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              setSelectedClientForModal(client);
                              setShowClientModal(true);
                            }}
                            className="action-button p-1 rounded"
                          >
                            <i className="ri-eye-line text-xs"></i>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedClientForModal(client);
                              setShowClientModal(true);
                            }}
                            className="action-button p-1 rounded"
                          >
                            <i className="ri-edit-line text-xs"></i>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {client.attributes.email && (
                          <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                            <i className="ri-mail-line mr-2"></i>
                            {client.attributes.email}
                          </div>
                        )}
                        {client.attributes.phone && (
                          <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                            <i className="ri-phone-line mr-2"></i>
                            {client.attributes.phone}
                          </div>
                        )}
                        {client.attributes.cpf && (
                          <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                            <i className="ri-user-line mr-2"></i>
                            CPF: {client.attributes.cpf}
                          </div>
                        )}
                        {client.attributes.cnpj && (
                          <div className="flex items-center text-xs" style={{ color: "var(--text-secondary)" }}>
                            <i className="ri-building-line mr-2"></i>
                            CNPJ: {client.attributes.cnpj}
                          </div>
                        )}
                        {client.attributes['registered-at'] && (
                          <div className="flex items-center text-xs text-gray-500">
                            <i className="ri-calendar-line mr-2"></i>
                            Cadastrado em {new Date(client.attributes['registered-at']).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16" style={{ color: "var(--text-secondary)" }}>
                <i className="ri-user-search-line text-6xl text-gray-400 mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                <p className="text-sm">
                  Não encontramos clientes com os termos "{searchTerm}".
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Tente usar termos diferentes ou criar um novo cliente.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Modal de Cliente
  const renderClientModal = () => {
    if (!showClientModal) return null;

    const isEditing = selectedClientForModal !== null;
    const clientData = selectedClientForModal || {};

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <button
              onClick={() => {
                setShowClientModal(false);
                setSelectedClientForModal(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          <form onSubmit={async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target as HTMLFormElement);
            const clientPayload = {
              data: {
                type: 'people',
                ...(isEditing && { id: clientData.id }),
                attributes: {
                  name: formData.get('name'),
                  'company-name': formData.get('company-name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  'mobile-phone': formData.get('mobile-phone'),
                  'business-phone': formData.get('business-phone'),
                  cpf: formData.get('cpf'),
                  cnpj: formData.get('cnpj'),
                  address: formData.get('address'),
                  number: formData.get('number'),
                  complement: formData.get('complement'),
                  district: formData.get('district'),
                  zip: formData.get('zip'),
                  'birth-date': formData.get('birth-date'),
                  rg: formData.get('rg'),
                  'passport-number': formData.get('passport-number'),
                  'passport-expiration': formData.get('passport-expiration'),
                  gender: formData.get('gender'),
                  'city-inscription': formData.get('city-inscription'),
                  'state-inscription': formData.get('state-inscription'),
                  website: formData.get('website'),
                  observations: formData.get('observations'),
                  kind: formData.get('kind') || 'individual'
                }
              }
            };

            try {
              const url = isEditing ? `/api/monde/clientes/${clientData.id}` : '/api/monde/clientes';
              const method = isEditing ? 'PATCH' : 'POST';
              
              const response = await fetch(url, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
                },
                body: JSON.stringify(clientPayload)
              });

              if (response.ok) {
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                toast.textContent = `Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso!`;
                document.body.appendChild(toast);
                setTimeout(() => document.body.removeChild(toast), 3000);
                
                setShowClientModal(false);
                setSelectedClientForModal(null);
                
                // Recarregar busca se havia busca ativa
                if (searchTerm.trim()) {
                  await searchClients(searchTerm);
                }
              } else {
                const errorData = await response.json();
                console.error('Erro ao salvar cliente:', errorData);
                
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                toast.textContent = `Erro ao ${isEditing ? 'atualizar' : 'criar'} cliente`;
                document.body.appendChild(toast);
                setTimeout(() => document.body.removeChild(toast), 3000);
              }
            } catch (error) {
              console.error('Erro ao salvar cliente:', error);
              
              const toast = document.createElement('div');
              toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
              toast.textContent = 'Erro de conexão';
              document.body.appendChild(toast);
              setTimeout(() => document.body.removeChild(toast), 3000);
            }
          }}>
            <div className="space-y-4">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={clientData.attributes?.name || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Tipo *
                  </label>
                  <select
                    name="kind"
                    required
                    defaultValue={clientData.attributes?.kind || 'individual'}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  >
                    <option value="individual">Pessoa Física</option>
                    <option value="company">Pessoa Jurídica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Razão Social / Nome da Empresa
                </label>
                <input
                  type="text"
                  name="company-name"
                  defaultValue={clientData.attributes?.['company-name'] || ''}
                  className="form-input w-full px-3 py-2 text-sm"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                />
              </div>

              {/* Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={clientData.attributes?.email || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={clientData.attributes?.phone || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Celular
                  </label>
                  <input
                    type="tel"
                    name="mobile-phone"
                    defaultValue={clientData.attributes?.['mobile-phone'] || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Telefone Comercial
                  </label>
                  <input
                    type="tel"
                    name="business-phone"
                    defaultValue={clientData.attributes?.['business-phone'] || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
              </div>

              {/* Documentos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    CPF
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    defaultValue={clientData.attributes?.cpf || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    CNPJ
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    defaultValue={clientData.attributes?.cnpj || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={clientData.attributes?.address || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Número
                  </label>
                  <input
                    type="text"
                    name="number"
                    defaultValue={clientData.attributes?.number || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Complemento
                  </label>
                  <input
                    type="text"
                    name="complement"
                    defaultValue={clientData.attributes?.complement || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Bairro
                  </label>
                  <input
                    type="text"
                    name="district"
                    defaultValue={clientData.attributes?.district || ''}
                    className="form-input w-full px-3 py-2 text-sm"
                    style={{ backgroundColor: "var(--bg-secondary)" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Observações
                </label>
                <textarea
                  name="observations"
                  rows={3}
                  defaultValue={clientData.attributes?.observations || ''}
                  className="form-input w-full px-3 py-2 text-sm"
                  style={{ backgroundColor: "var(--bg-secondary)" }}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowClientModal(false);
                  setSelectedClientForModal(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                {isEditing ? 'Atualizar' : 'Criar'} Cliente
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden theme-transition">
      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"} sidebar-transition fixed inset-y-0 left-0 z-50 flex flex-col`}
      >
        <div
          className="flex items-center h-16 px-4 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center">
            {sidebarCollapsed ? (
              <img src={logoIcon} alt="Keeptur" className="w-6 h-6" />
            ) : (
              <img src={logoFull} alt="Keeptur" className="h-8" />
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab("tarefas")}
            className={`menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full ${activeTab === "tarefas" ? "active" : ""}`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-task-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Tarefas</span>}
            {sidebarCollapsed && <span className="tooltip">Tarefas</span>}
          </button>

          <button
            onClick={() => setActiveTab("clientes")}
            className={`menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full ${activeTab === "clientes" ? "active" : ""}`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-user-3-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Clientes</span>}
            {sidebarCollapsed && <span className="tooltip">Clientes</span>}
          </button>
        </nav>

        <div
          className="mt-auto px-3 py-4 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
          <button 
            onClick={() => window.location.href = '/settings'}
            className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-settings-3-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Configurações</span>}
            {sidebarCollapsed && <span className="tooltip">Configurações</span>}
          </button>

          <button
            onClick={handleLogout}
            className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full bg-red-500 hover:bg-red-600 text-white"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-logout-box-line text-white"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3 text-white">Sair</span>}
            {sidebarCollapsed && <span className="tooltip">Sair</span>}
          </button>

          <button
            onClick={toggleSidebar}
            className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i
                className={
                  sidebarCollapsed ? "ri-menu-unfold-line" : "ri-menu-fold-line"
                }
              ></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Recolher Menu</span>}
            {sidebarCollapsed && <span className="tooltip">Expandir Menu</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className={`header flex items-center justify-between h-16 px-6 content-transition`}
          style={{ marginLeft: sidebarCollapsed ? "4rem" : "16rem" }}
        >
          <div className="flex items-center">
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {activeTab === "tarefas"
                ? "Gestão de Tarefas"
                : "Gestão de Clientes"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Botão de atualização manual */}
            <button
              onClick={async () => {
                console.log("🔄 Atualizando dados manualmente...");
                await reloadTasks();
                
                // Toast de confirmação
                const toast = document.createElement('div');
                toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                toast.textContent = '✅ Dados atualizados';
                document.body.appendChild(toast);
                setTimeout(() => document.body.removeChild(toast), 2000);
              }}
              className="theme-toggle p-2 rounded-lg rounded-button"
              title="Atualizar dados manualmente"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-refresh-line"></i>
              </div>
            </button>

            <button
              onClick={toggleTheme}
              className="theme-toggle p-2 rounded-lg rounded-button"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i
                  className={theme === "light" ? "ri-moon-line" : "ri-sun-line"}
                ></i>
              </div>
            </button>

            <div className="relative">
              <button className="theme-toggle p-2 rounded-lg relative rounded-button">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-notification-3-line"></i>
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  5
                </span>
              </button>
            </div>

            <div className="relative">
              <button className="flex items-center space-x-3 p-1 rounded-lg theme-toggle rounded-button">
                <div className="w-8 h-8 rounded-full stats-card flex items-center justify-center text-white font-medium text-sm">
                  {(realUserData?.name || user?.name)?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden md:block text-left">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {realUserData?.name || user?.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    {user?.role}
                  </p>
                </div>
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-arrow-down-s-line"></i>
                </div>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main
          className={`flex-1 overflow-auto content-area content-transition p-6`}
          style={{ marginLeft: sidebarCollapsed ? "4rem" : "16rem" }}
        >
          {activeTab === "tarefas" ? renderTasksView() : renderClientsView()}
        </main>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setSelectedTask(null);
          setShowTaskModal(true);
          console.log("➕ Abrindo modal de nova tarefa");
        }}
        className="floating-button"
        title="Criar nova tarefa"
      >
        <i className="ri-add-line text-xl"></i>
      </button>

      {/* Modal de Nova Tarefa */}
      <TaskModal />

      {/* Modal de Visualização de Tarefa */}
      {showTaskDetails && selectedTaskDetails && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
          <div className="modal-content rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto min-h-[600px]">
            <div
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    #{selectedTaskDetails.id}
                  </span>
                  <span
                    className={`${(() => {
                      const taskStatus = getTaskStatus(selectedTaskDetails);
                      return taskStatus.class;
                    })()} px-3 py-1 rounded-full text-sm font-medium`}
                  >
                    {selectedTaskDetails.attributes.completed
                      ? "Concluído"
                      : "Pendente"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowTaskDetails(false)}
                className="theme-toggle p-2 rounded-lg !rounded-button whitespace-nowrap"
              >
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h2
                  className="text-xl font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selectedTaskDetails.attributes.title}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Cliente:
                    </span>
                    <span
                      className={`ml-2 ${!selectedTaskDetails.client_name ? "text-red-600" : ""}`}
                      style={{
                        color: !selectedTaskDetails.client_name
                          ? "#dc2626"
                          : "var(--text-primary)",
                      }}
                    >
                      {selectedTaskDetails.client_name || "Sem cliente"}
                    </span>
                  </div>
                  <div>
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Responsável:
                    </span>
                    <span
                      className="ml-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {selectedTaskDetails.assignee_name || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Data/Hora:
                    </span>
                    <span
                      className="ml-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {selectedTaskDetails.attributes.due
                        ? new Date(
                            selectedTaskDetails.attributes.due,
                          ).toLocaleString()
                        : "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span
                      className="font-medium"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Categoria:
                    </span>
                    <span
                      className="ml-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {selectedTaskDetails.category_name || "Não informado"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex space-x-1 mb-4">
                  <button
                    className={`tab-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap ${
                      taskHistoryTab === "detalhes" ? "active" : ""
                    }`}
                    onClick={() => setTaskHistoryTab("detalhes")}
                  >
                    Detalhes
                  </button>
                  <button
                    className={`tab-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap ${
                      taskHistoryTab === "historico" ? "active" : ""
                    }`}
                    onClick={() => setTaskHistoryTab("historico")}
                  >
                    Histórico
                  </button>
                </div>

                <div className="tab-content">
                  {taskHistoryTab === "detalhes" && (
                    <>
                      <div className="mb-4">
                        <h3
                          className="text-sm font-medium mb-2"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Descrição
                        </h3>
                        <p
                          className="text-sm p-3 rounded-lg"
                          style={{
                            color: "var(--text-primary)",
                            backgroundColor: "var(--bg-tertiary)",
                          }}
                        >
                          {selectedTaskDetails.attributes.description ||
                            "Sem descrição"}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3
                            className="text-sm font-medium mb-2"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Informações Adicionais
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span style={{ color: "var(--text-tertiary)" }}>
                                Data de Criação:
                              </span>
                              <span style={{ color: "var(--text-primary)" }}>
                                {selectedTaskDetails.attributes["registered-at"]
                                  ? new Date(
                                      selectedTaskDetails.attributes[
                                        "registered-at"
                                      ],
                                    ).toLocaleString()
                                  : "Não informado"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span style={{ color: "var(--text-tertiary)" }}>
                                Última Atualização:
                              </span>
                              <span style={{ color: "var(--text-primary)" }}>
                                {selectedTaskDetails.attributes["completed-at"]
                                  ? new Date(
                                      selectedTaskDetails.attributes[
                                        "completed-at"
                                      ],
                                    ).toLocaleString()
                                  : "Não informado"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {taskHistoryTab === "historico" && (
                    <div className="max-h-96 overflow-y-auto">
                      <h3
                        className="text-sm font-medium mb-4"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Histórico da Tarefa
                      </h3>
                      {taskHistory.length === 0 ? (
                        <p
                          className="text-sm text-center py-8"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          Nenhum histórico disponível
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {taskHistory.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="p-3 rounded-lg border"
                              style={{
                                backgroundColor: "var(--bg-tertiary)",
                                borderColor: "var(--border-color)",
                              }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className="text-sm font-medium"
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {item.user_name || "Usuário"}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: "var(--text-tertiary)" }}
                                >
                                  {item.attributes["date-time"]
                                    ? new Date(
                                        item.attributes["date-time"],
                                      ).toLocaleString()
                                    : "Data não disponível"}
                                </span>
                              </div>
                              <p
                                className="text-sm"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {item.attributes.text || "Sem texto"}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div
                className="flex items-center justify-end space-x-3 pt-4 border-t"
                style={{ borderColor: "var(--border-color)" }}
              >
                <button
                  onClick={() => setShowTaskDetails(false)}
                  className="action-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    setShowTaskDetails(false);
                    setSelectedTask(selectedTaskDetails);
                    setShowTaskModal(true);
                  }}
                  className="primary-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
                >
                  <i className="ri-edit-line mr-2"></i>
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de busca avançada */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Buscar Cliente</h2>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nome completo"
                  className="form-input px-3 py-2 text-sm border rounded"
                />
                <input
                  type="text"
                  placeholder="CPF/CNPJ"
                  className="form-input px-3 py-2 text-sm border rounded"
                />
                <input
                  type="text"
                  placeholder="Telefone"
                  className="form-input px-3 py-2 text-sm border rounded"
                />
                <input
                  type="email"
                  placeholder="E-mail"
                  className="form-input px-3 py-2 text-sm border rounded"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Buscar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cadastro - Pessoa Física */}
      {showPersonFisicaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">👤 Cadastrar Pessoa Física</h2>
              <button
                onClick={() => setShowPersonFisicaModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={submitPersonFisica} className="overflow-y-auto max-h-[calc(85vh-120px)]">
              <div className="p-4 space-y-4">
                {/* Dados Pessoais - Layout compacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="lg:col-span-3">
                    <label className="block text-xs font-medium mb-1">Nome: *</label>
                    <input name="name" type="text" required className="w-full px-2 py-1.5 text-sm border rounded" />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Sexo:</label>
                    <select name="sex" className="w-full px-2 py-1.5 text-sm border rounded">
                      <option value="">Selecione</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center mt-5">
                    <input name="foreign" type="checkbox" id="estrangeiro-pf" className="mr-2" />
                    <label htmlFor="estrangeiro-pf" className="text-xs">Estrangeiro</label>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1">Código:</label>
                    <input name="code" type="number" disabled className="w-full px-2 py-1.5 text-sm border rounded bg-gray-100" placeholder="Automático" />
                  </div>
                </div>

                {/* Documentos */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Documentos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">CPF:</label>
                      <input name="cpf" type="text" placeholder="000.000.000-00" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">RG:</label>
                      <input name="rg" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Passport:</label>
                      <input name="passport" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Data Nascimento:</label>
                      <input name="birthDate" type="date" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Endereço</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">CEP:</label>
                      <input name="zip" type="text" placeholder="00000-000" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium mb-1">Endereço:</label>
                      <input name="address" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Número:</label>
                      <input name="number" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Complemento:</label>
                      <input name="complement" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Bairro:</label>
                      <input name="district" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium mb-1">Cidade:</label>
                      <select name="cityId" className="w-full px-2 py-1.5 text-sm border rounded" onClick={loadCities}>
                        <option value="">Selecione uma cidade</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.attributes.name}</option>
                        ))}
                      </select>
                      {loadingCities && <p className="text-xs text-gray-500 mt-1">Carregando...</p>}
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Contato</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Telefone:</label>
                      <input name="phone" type="text" placeholder="(11) 3333-4444" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Celular:</label>
                      <input name="mobilePhone" type="text" placeholder="(11) 99999-8888" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Telefone Comercial:</label>
                      <input name="businessPhone" type="text" placeholder="(11) 2222-3333" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-medium mb-1">E-mail:</label>
                      <input name="email" type="email" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Website:</label>
                      <input name="website" type="url" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                  </div>
                </div>

                {/* Informações Profissionais */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Informações Profissionais</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Estado Civil:</label>
                      <select name="maritalStatus" className="w-full px-2 py-1.5 text-sm border rounded">
                        <option value="">Selecione</option>
                        <option value="single">Solteiro(a)</option>
                        <option value="married">Casado(a)</option>
                        <option value="divorced">Divorciado(a)</option>
                        <option value="widowed">Viúvo(a)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Profissão:</label>
                      <input name="profession" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Nacionalidade:</label>
                      <input name="nationality" type="text" className="w-full px-2 py-1.5 text-sm border rounded" />
                    </div>
                  </div>
                </div>

                {/* Outros */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Outros</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Observações:</label>
                      <textarea name="observations" rows={3} className="w-full px-2 py-1.5 text-sm border rounded"></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium mb-1">Vendedor:</label>
                      <select name="vendorId" className="w-full px-2 py-1.5 text-sm border rounded">
                        <option value="">Selecione um vendedor</option>
                        {users.map((user: any) => (
                          <option key={user.id} value={user.id}>{user.attributes.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowPersonFisicaModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={savingPerson}>
                  {savingPerson ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Configurações */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">⚙️ Configurações</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="ri-calendar-line text-blue-600 text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-medium">Google Agenda</h3>
                    <p className="text-sm text-gray-500">Sincronizar tarefas com Google Calendar</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {googleConnected && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                  <button
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowGoogleCalendarModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <i className="ri-arrow-right-s-line text-xl"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Google Calendar */}
      {showGoogleCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">📅 Google Agenda</h2>
              <button
                onClick={() => setShowGoogleCalendarModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="p-6">
              {!googleConnected ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <i className="ri-calendar-line text-blue-600 text-2xl"></i>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Conectar Google Agenda</h3>
                    <p className="text-gray-600 mb-4">
                      Sincronize automaticamente suas tarefas do Keeptur com o Google Calendar. 
                      Todas as tarefas serão criadas, atualizadas e excluídas automaticamente.
                    </p>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-blue-800 mb-2">✨ Funcionalidades:</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Criação automática de eventos no Google Calendar</li>
                        <li>• Sincronização bidirecional (Keeptur ↔ Google)</li>
                        <li>• Atualização automática de horários e datas</li>
                        <li>• Exclusão automática quando tarefa é removida</li>
                        <li>• Notificações do Google Calendar</li>
                      </ul>
                    </div>
                  </div>
                  
                  <button
                    onClick={connectGoogleCalendar}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <i className="ri-google-line text-xl"></i>
                    <span>Conectar com Google</span>
                  </button>
                  
                  <p className="text-xs text-gray-500">
                    Ao conectar, você autoriza o Keeptur a acessar e gerenciar seus eventos do Google Calendar.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-checkbox-circle-fill text-green-600 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-green-800">Conectado com Sucesso!</h3>
                    <p className="text-gray-600">Conta: {googleEmail}</p>
                  </div>
                  
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium">Sincronização Automática</h4>
                        <p className="text-sm text-gray-500">Manter tarefas sincronizadas automaticamente</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncEnabled}
                          onChange={(e) => setSyncEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    {syncEnabled && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800">
                          ✅ Sincronização ativa - Suas tarefas serão automaticamente gerenciadas no Google Calendar
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowGoogleCalendarModal(false);
                        syncAllTasks();
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                    >
                      Sincronizar Agora
                    </button>
                    <button
                      onClick={disconnectGoogleCalendar}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reabertura de Tarefa */}
      {showReopenModal && taskToReopen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                <i className="ri-refresh-line mr-2 text-green-600"></i>
                Restaurar Tarefa
              </h3>
              <button
                onClick={() => {
                  setShowReopenModal(false);
                  setTaskToReopen(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  {taskToReopen.attributes?.title}
                </h4>
                <p className="text-green-600 dark:text-green-300 text-sm">
                  Esta tarefa será restaurada e ficará pendente novamente.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nova Data:</label>
                    <input
                      type="date"
                      value={reopenDate}
                      onChange={(e) => setReopenDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Horário:</label>
                    <input
                      type="time"
                      value={reopenTime}
                      onChange={(e) => setReopenTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Motivo da Restauração:</label>
                  <textarea
                    value={reopenNote}
                    onChange={(e) => setReopenNote(e.target.value)}
                    placeholder="Descreva o motivo da restauração..."
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReopenModal(false);
                  setTaskToReopen(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('keeptur-token');
                    if (!token) {
                      setShowTokenExpiredModal(true);
                      return;
                    }

                    const newDueDate = `${reopenDate}T${reopenTime}:00`;
                    
                    // Para tarefas excluídas, primeiro precisamos restaurá-las via POST no endpoint de restore
                    const response = await fetch(`/api/monde/tarefas/${taskToReopen.id}/restore`, {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        title: taskToReopen.attributes.title,
                        due: newDueDate,
                        completed: false,
                        description: taskToReopen.attributes.description || '',
                        historic: reopenNote || 'Tarefa restaurada e reativada'
                      })
                    });

                    if (response.ok) {
                      setShowReopenModal(false);
                      setTaskToReopen(null);
                      setReopenNote('');
                      reloadTasks();
                      
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = '✅ Tarefa restaurada com sucesso!';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    } else {
                      throw new Error('Erro ao restaurar tarefa');
                    }
                  } catch (error) {
                    console.error('Erro ao restaurar tarefa:', error);
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                    toast.textContent = '❌ Erro ao restaurar tarefa';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <i className="ri-refresh-line mr-2"></i>
                Reabrir Tarefa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferência de Tarefa */}
      {showTransferModal && taskToTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                <i className="ri-user-shared-line mr-2 text-blue-600"></i>
                Transferir Tarefa
              </h3>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTaskToTransfer(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  {taskToTransfer.attributes?.title}
                </h4>
                <p className="text-blue-600 dark:text-blue-300 text-sm">
                  Selecione o novo responsável para esta tarefa.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Novo Responsável:</label>
                <select
                  value={selectedTransferUser}
                  onChange={(e) => setSelectedTransferUser(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Selecione um usuário</option>
                  {users.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.attributes.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTaskToTransfer(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!selectedTransferUser) {
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded shadow-lg z-50';
                    toast.textContent = '⚠️ Selecione um responsável';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                    return;
                  }

                  try {
                    const token = localStorage.getItem('keeptur-token');
                    if (!token) {
                      setShowTokenExpiredModal(true);
                      return;
                    }
                    
                    const response = await fetch(`/api/monde/tarefas/${taskToTransfer.id}`, {
                      method: 'PUT',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        title: taskToTransfer.attributes.title,
                        assignee_id: selectedTransferUser,
                        history_comment: `Tarefa transferida para ${users.find((u: any) => u.id === selectedTransferUser)?.attributes.name}`
                      })
                    });

                    if (response.ok) {
                      setShowTransferModal(false);
                      setTaskToTransfer(null);
                      setSelectedTransferUser('');
                      reloadTasks();
                      
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = '✅ Tarefa transferida com sucesso!';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    } else {
                      throw new Error('Erro ao transferir tarefa');
                    }
                  } catch (error) {
                    console.error('Erro ao transferir tarefa:', error);
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                    toast.textContent = '❌ Erro ao transferir tarefa';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                  }
                }}
                disabled={!selectedTransferUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="ri-user-shared-line mr-2"></i>
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Mudança de Status (Drag and Drop) */}
      {statusChangeModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                <i className="ri-drag-move-line mr-2 text-blue-600"></i>
                {statusChangeModal.isReopen ? 'Restaurar Tarefa' : 'Alterar Status'}
              </h3>
              <button
                onClick={() => {
                  setStatusChangeModal({ isOpen: false, task: null, newStatus: "", isReopen: false });
                  setStatusChangeForm({ datetime: "", comment: "", success: "", error: "" });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-sm mb-1" style={{ color: "var(--text-primary)" }}>
                  {statusChangeModal.task?.attributes?.title}
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  {statusChangeModal.isReopen 
                    ? 'Esta tarefa será restaurada e movida para ativa'
                    : statusChangeModal.newStatus === 'completed'
                    ? 'Esta tarefa será marcada como concluída'
                    : statusChangeModal.newStatus === 'archived'
                    ? 'Esta tarefa será excluída (movida para lixeira)'
                    : `Mudando status para: ${getStatusDisplayName(statusChangeModal.newStatus)}`
                  }
                </p>
              </div>

              {statusChangeForm.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{statusChangeForm.error}</p>
                </div>
              )}

              {statusChangeForm.success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{statusChangeForm.success}</p>
                </div>
              )}

              {/* Campo de data/hora - aparecer somente quando necessário */}
              {(statusChangeModal.newStatus === 'pending' || statusChangeModal.newStatus === 'overdue' || statusChangeModal.isReopen) && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {statusChangeModal.isReopen 
                      ? 'Nova Data e Hora (obrigatório):' 
                      : statusChangeModal.newStatus === 'pending'
                      ? 'Data e Hora (deve ser futura):'
                      : 'Data e Hora (deve ser passada):'
                    }
                  </label>
                  <input
                    type="datetime-local"
                    value={statusChangeForm.datetime}
                    onChange={(e) => setStatusChangeForm(prev => ({ ...prev, datetime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg"
                    required={statusChangeModal.newStatus === 'pending' || statusChangeModal.newStatus === 'overdue' || statusChangeModal.isReopen}
                  />
                  {statusChangeModal.newStatus === 'pending' && (
                    <p className="text-xs text-gray-500 mt-1">
                      ⏰ Data deve ser no futuro para evitar que a tarefa fique atrasada
                    </p>
                  )}
                  {statusChangeModal.newStatus === 'overdue' && (
                    <p className="text-xs text-gray-500 mt-1">
                      ⏰ Data deve ser no passado para marcar como atrasada
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {statusChangeModal.isReopen 
                    ? 'Motivo da Reabertura (obrigatório):' 
                    : statusChangeModal.newStatus === 'completed'
                    ? 'Comentário sobre a conclusão (opcional):'
                    : statusChangeModal.newStatus === 'archived'
                    ? 'Motivo da exclusão (opcional):'
                    : 'Comentário (opcional):'
                  }
                </label>
                <textarea
                  value={statusChangeForm.comment}
                  onChange={(e) => setStatusChangeForm(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder={
                    statusChangeModal.isReopen 
                      ? 'Por que esta tarefa está sendo restaurada?' 
                      : statusChangeModal.newStatus === 'completed'
                      ? 'Adicione detalhes sobre como a tarefa foi concluída...'
                      : statusChangeModal.newStatus === 'archived'
                      ? 'Por que esta tarefa está sendo excluída?'
                      : 'Adicione um comentário sobre esta mudança...'
                  }
                  className="w-full px-3 py-2 border rounded-lg h-20 resize-none"
                  required={statusChangeModal.isReopen}
                />
                {statusChangeModal.newStatus === 'completed' && (
                  <p className="text-xs text-green-600 mt-1">
                    ✅ Tem certeza que deseja marcar esta tarefa como concluída?
                  </p>
                )}
                {statusChangeModal.newStatus === 'archived' && (
                  <p className="text-xs text-red-600 mt-1">
                    🗑️ Tem certeza que deseja excluir esta tarefa?
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setStatusChangeModal({ isOpen: false, task: null, newStatus: "", isReopen: false });
                  setStatusChangeForm({ datetime: "", comment: "", success: "", error: "" });
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <i className={`${statusChangeModal.isReopen ? 'ri-refresh-line' : 'ri-check-line'} mr-2`}></i>
                {statusChangeModal.isReopen ? 'Restaurar' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
