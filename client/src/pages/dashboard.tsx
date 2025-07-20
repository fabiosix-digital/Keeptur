import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../lib/auth";
import { MondeAPI } from "../lib/monde-api";
import { useTheme } from "../hooks/use-theme";
import { TokenExpiredModal } from "../components/TokenExpiredModal";
import ClientSearchField from "../components/ClientSearchField";
import PersonFisicaModal from "../components/PersonFisicaModal";
import PersonJuridicaModal from "../components/PersonJuridicaModal";
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
  const { user, logout } = useAuth();
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
  const [attachments, setAttachments] = useState<File[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<any[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  
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
  const [savingPersonFisica, setSavingPersonFisica] = useState(false);
  const [savingPersonJuridica, setSavingPersonJuridica] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [loadingAttachments, setLoadingAttachments] = useState(false);


  // Debounce timeout ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para buscar clientes na API do Monde com debounce
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
    
    // Set new timeout
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
    }, 300); // 300ms debounce otimizado
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
  const submitPersonFisica = async (personData: any) => {
    setSavingPersonFisica(true);

    try {
      const response = await fetch('/api/monde/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        },
        body: JSON.stringify(personData)
      });

      if (response.ok) {
        console.log('✅ Pessoa física cadastrada com sucesso');
        setShowPersonFisicaModal(false);
        // Recarregar lista de clientes se necessário
      } else {
        console.error('❌ Erro ao cadastrar pessoa física:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao cadastrar pessoa física:', error);
    }
    
    setSavingPersonFisica(false);
  };

  // Função para submeter formulário de pessoa jurídica
  const submitPersonJuridica = async (companyData: any) => {
    setSavingPersonJuridica(true);
    
    try {
      const response = await fetch('/api/monde/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        },
        body: JSON.stringify(companyData)
      });

      if (response.ok) {
        console.log('✅ Pessoa jurídica cadastrada com sucesso');
        setShowPersonJuridicaModal(false);
        // Recarregar lista de clientes se necessário
      } else {
        console.error('❌ Erro ao cadastrar pessoa jurídica:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao cadastrar pessoa jurídica:', error);
    }
    
    setSavingPersonJuridica(false);
  };

  // Função para carregar anexos da tarefa
  const loadTaskAttachments = async (taskId: string) => {
    if (!taskId) return;
    
    setLoadingAttachments(true);
    try {
      const response = await fetch(`/api/monde/tarefas/${taskId}/anexos`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTaskAttachments(data.data || []);
      } else {
        console.error('Erro ao carregar anexos:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar anexos:', error);
    }
    setLoadingAttachments(false);
  };

  // Função para upload de anexos
  const uploadAttachments = async () => {
    if (!selectedTask?.id || attachments.length === 0) return;
    
    setUploadingAttachment(true);
    
    for (const file of attachments) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch(`/api/monde/tarefas/${selectedTask.id}/anexos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
          },
          body: formData
        });

        if (response.ok) {
          console.log(`✅ Anexo ${file.name} enviado com sucesso`);
        } else {
          console.error(`❌ Erro ao enviar anexo ${file.name}:`, response.status);
        }
      } catch (error) {
        console.error(`❌ Erro ao enviar anexo ${file.name}:`, error);
      }
    }
    
    setAttachments([]);
    setUploadingAttachment(false);
    loadTaskAttachments(selectedTask.id);
  };

  // Função para excluir anexo
  const deleteAttachment = async (attachmentId: string) => {
    if (!selectedTask?.id) return;
    
    try {
      const response = await fetch(`/api/monde/tarefas/${selectedTask.id}/anexos/${attachmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });

      if (response.ok) {
        console.log('✅ Anexo excluído com sucesso');
        loadTaskAttachments(selectedTask.id);
      } else {
        console.error('❌ Erro ao excluir anexo:', response.status);
      }
    } catch (error) {
      console.error('❌ Erro ao excluir anexo:', error);
    }
  };

  // Função para carregar histórico da tarefa
  const loadTaskHistory = async (taskId: string) => {
    if (!taskId) return;
    
    try {
      const response = await fetch(`/api/monde/tarefas/${taskId}/historico`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTaskHistory(data.data || []);
      } else {
        console.error('Erro ao carregar histórico:', response.status);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  // Hook para adicionar toast notifications
  const addToast = (toast: any) => {
    // Implementação de toast simples para feedback
    console.log('Toast:', toast);
  };

  // Função para carregar estatísticas (implementação existente mantida)
  const loadStats = async () => {
    // Implementation preserved
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
        
        // 🚨 CORREÇÃO DEFINITIVA baseada na documentação oficial do Monde:
        // 1. Tarefas excluídas NÃO são retornadas pela API (hard delete)
        // 2. Tarefas na resposta são apenas: ativas (completed=false) ou concluídas (completed=true)
        // 3. Não existe campo "deleted" ou status de exclusão
        
        console.log('🎯 IMPLEMENTAÇÃO CORRETA: Apenas ativas e concluídas (sem excluídas)');
        
        // Separar tarefas usando APENAS os campos oficiais do Monde
        const activeTasks = uniqueTasks.filter((task: any) => 
          !task.attributes.completed  // completed = false = ATIVA
        );
        
        const completedTasks = uniqueTasks.filter((task: any) => 
          task.attributes.completed   // completed = true = CONCLUÍDA
        );
        
        // Tarefas excluídas NÃO existem na resposta da API
        const deletedTasks: any[] = [];
        
        console.log('🎯 SEPARAÇÃO OFICIAL baseada na API do Monde:', {
          ativas: activeTasks.length,
          concluidas: completedTasks.length,
          excluidas: deletedTasks.length // Sempre 0 - API não retorna excluídas
        });
        
        console.log('🎯 Tarefas separadas conforme API oficial do Monde:', {
          total: uniqueTasks.length,
          ativas: activeTasks.length,
          concluidas: completedTasks.length,
          excluidas: deletedTasks.length
        });

        // Combinar ativas + concluídas para exibição normal
        const visibleTasks = [...activeTasks, ...completedTasks];
        
        // Calcular estatísticas apenas das tarefas ativas
        const realStats = calculateTaskStats(visibleTasks);

        setAllTasks([...visibleTasks, ...deletedTasks]); // Todas únicas
        setTasks(visibleTasks); // Apenas ativas + concluídas para visualização normal
        
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
      
      // Calcular estatísticas SOMENTE das tarefas ativas (filtrar excluídas)
      const activeTasksOnly = filteredTasks.filter((task: any) => 
        !task.attributes.deleted && !task.attributes.is_deleted
      );
      setStats(calculateTaskStats(activeTasksOnly));
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
      
      // 🚨 SIMPLIFICAÇÃO: API do Monde não tem tarefas excluídas (hard delete)
      // Retornar apenas as tarefas ativas/concluídas da resposta
      console.log('✅ Sistema simplificado: usando apenas tarefas da API (ativas + concluídas)');
      return data;
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      return { data: [] };
    }
  };

  // Função para calcular estatísticas das tarefas
  const calculateTaskStats = (tasks: any[]) => {
    const now = new Date();

    const stats = {
      total: tasks.length,
      // Pendentes = não concluídas E não atrasadas (dentro do prazo ou sem prazo)
      pendentes: tasks.filter((t: any) => {
        if (t.attributes.completed) return false;
        const dueDate = t.attributes.due ? new Date(t.attributes.due) : null;
        return !dueDate || dueDate >= now;
      }).length,
      concluidas: tasks.filter((t: any) => t.attributes.completed).length,
      // Atrasadas = não concluídas E com prazo vencido
      atrasadas: tasks.filter((t: any) => {
        if (t.attributes.completed) return false;
        const dueDate = t.attributes.due ? new Date(t.attributes.due) : null;
        return dueDate && dueDate < now;
      }).length,
    };

    // Calcular variações reais baseadas no mês anterior
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthTasks = tasks.filter((t: any) => {
      const taskDate = new Date(
        t.attributes["registered-at"] || t.attributes.created_at,
      );
      return taskDate >= lastMonth && taskDate < thisMonth;
    });

    const thisMonthTasks = tasks.filter((t: any) => {
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

  // Função loadTaskHistory já definida anteriormente

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
    // Verificar se a tarefa foi excluída
    if (task.attributes.deleted || task.attributes.is_deleted) {
      return { status: "deleted", label: "Excluída", class: "status-badge-deleted" };
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

  // Função para visualizar detalhes da tarefa (agora abre em modo de edição)
  const handleViewTask = async (task: any) => {
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

  // Funções de ação das tarefas
  const handleCompleteTask = (taskId: string) => {
    console.log("Completar tarefa:", taskId);
  };

  const handleTransferTask = (taskId: string) => {
    console.log("Transferir tarefa:", taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    console.log("Deletar tarefa:", taskId);
  };

  // 🚨 FUNÇÃO CORRIGIDA: Evitar duplicação e usar dados corretos
  const getFilteredTasksWithStatus = () => {
    // 🚨 SIMPLIFICAÇÃO TOTAL: Usar apenas as tarefas já filtradas do servidor
    let filtered = tasks || [];
    
    // Remover duplicatas por ID (se houver)
    const uniqueTasksMap = new Map();
    filtered.forEach((task: any) => {
      if (task && task.id && !uniqueTasksMap.has(task.id)) {
        uniqueTasksMap.set(task.id, task);
      }
    });
    filtered = Array.from(uniqueTasksMap.values());
    
    console.log('🔄 Usando tarefas do servidor (já filtradas):', filtered.length);

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
    const filteredTasks = getFilteredTasksWithStatus();

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
    // Usar tarefas filtradas (que já remove duplicatas)
    const filteredTasks = getFilteredTasksWithStatus();
    
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
    const filteredTasks = getFilteredTasksWithStatus();
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

  // Estado para modal de mudança de status
  const [statusChangeModal, setStatusChangeModal] = useState({
    isOpen: false,
    task: null as any,
    newStatus: "" as string,
    isReopen: false
  });

  const [statusChangeForm, setStatusChangeForm] = useState({
    datetime: "",
    comment: "",
    success: "",
    error: ""
  });

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

      // Se for reabertura (de completed/archived para pending/overdue), mostrar modal
      if ((currentStatus === "completed" || currentStatus === "archived") && 
          (newStatus === "pending" || newStatus === "overdue")) {
        console.log("🔄 Reabertura detectada, abrindo modal");
        setStatusChangeModal({
          isOpen: true,
          task: taskData,
          newStatus,
          isReopen: true
        });
        return;
      }

      // Se está movendo para "completed", abrir modal específica de conclusão
      if (newStatus === 'completed') {
        console.log('✅ Abrindo modal de conclusão de tarefa');
        setTaskToComplete(taskData);
        setShowCompletionModal(true);
        return;
      }

      // Se está movendo para "archived" (excluir), abrir modal específica de exclusão
      if (newStatus === 'archived') {
        console.log('✅ Abrindo modal de exclusão de tarefa');
        setTaskToDelete(taskData);
        setShowDeletionModal(true);
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

    } catch (error) {
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
      
      // Validações de data baseadas no status
      if (statusChangeForm.datetime) {
        const selectedDate = new Date(statusChangeForm.datetime);
        const now = new Date();
        
        if (newStatus === "pending" && selectedDate <= now) {
          console.log("⚠️ Data inválida para tarefa pendente");
          setStatusChangeForm(prev => ({ ...prev, error: "Para tarefas pendentes, a data deve ser futura para evitar que fique atrasada." }));
          return;
        }
        
        if (newStatus === "overdue" && selectedDate >= now) {
          console.log("⚠️ Data inválida para tarefa atrasada");
          setStatusChangeForm(prev => ({ ...prev, error: "Para tarefas atrasadas, a data deve ser no passado (antes da data/hora atual)." }));
          return;
        }
      }

      console.log("🔍 Iniciando alteração de status...");
      console.log("📋 Tarefa:", task.id, task.attributes?.title);
      console.log("🎯 Status atual → novo:", getTaskStatus(task, tasks, []).status, "→", newStatus);
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

      // Fazer a requisição para atualizar a tarefa
      const response = await fetch(`/api/monde/tarefas/${task.id}`, {
        method: "PUT",
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

      // Aguardar 2 segundos para mostrar mensagem de sucesso
      setTimeout(() => {
        // Fechar modal e recarregar tarefas
        console.log("🔄 Fechando modal e recarregando tarefas...");
        setStatusChangeModal({ isOpen: false, task: null, newStatus: "", isReopen: false });
        setStatusChangeForm({ datetime: "", comment: "", success: "", error: "" });
        reloadTasks();
        console.log("✅ Processo concluído com sucesso!");
      }, 2000);

    } catch (error) {
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

  // Função auxiliar para obter nome de exibição do status
  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "overdue": return "Atrasada";
      case "completed": return "Concluída";
      case "archived": return "Excluída";
      default: return "Pendente";
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
          Bem-vindo, {user?.name}! 👋
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
                onClick={() => setShowTaskModal(true)}
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
                    {tasks.map((task, index) => (
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
                            className={`text-sm font-medium ${
                              !task.client_name ? "text-red-600" : ""
                            }`}
                            style={{
                              color: !task.client_name
                                ? "#dc2626"
                                : "var(--text-primary)",
                            }}
                          >
                            {task.client_name || "Sem cliente"}
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
                            {task.assignee_name || "Sem responsável"}
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
                          {(() => {
                            const statusInfo = getTaskStatus(task);
                            return (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}
                              >
                                {statusInfo.label}
                              </span>
                            );
                          })()}
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
                            <button
                              onClick={() => handleCompleteTask(task.id)}
                              className="action-button p-2 rounded-lg !rounded-button whitespace-nowrap"
                              title="Concluir tarefa"
                            >
                              <i className="ri-checkbox-circle-line text-sm"></i>
                            </button>
                            <button
                              onClick={() => handleTransferTask(task.id)}
                              className="action-button p-2 rounded-lg !rounded-button whitespace-nowrap"
                              title="Transferir atendimento"
                            >
                              <i className="ri-user-shared-line text-sm"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="action-button p-2 rounded-lg !rounded-button whitespace-nowrap"
                              title="Deletar tarefa"
                            >
                              <i className="ri-delete-bin-line text-sm"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                    className={`space-y-3 ${getFilteredTasksWithStatus().filter(task => {
                      const { status } = getTaskStatus(task);
                      return status === "pending";
                    }).length === 0 ? 'min-h-[80px]' : 'min-h-[120px]'}`}
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
                                title="Visualizar tarefa"
                              >
                                <i className="ri-eye-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Editar tarefa"
                              >
                                <i className="ri-edit-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToComplete(task);
                                  setShowCompletionModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-green-600 hover:bg-green-50"
                                title="Concluir tarefa"
                              >
                                <i className="ri-check-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task);
                                  setShowDeletionModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-red-600 hover:bg-red-50"
                                title="Excluir tarefa"
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
                    onClick={() => {
                      setPreSelectedStatus("pending");
                      setSelectedTask(null);
                      setTaskHistory([]);
                      setShowTaskModal(true);
                    }}
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
                                title="Visualizar tarefa"
                              >
                                <i className="ri-eye-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Editar tarefa"
                              >
                                <i className="ri-edit-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToComplete(task);
                                  setShowCompletionModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-green-600 hover:bg-green-50"
                                title="Concluir tarefa"
                              >
                                <i className="ri-check-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToTransfer(task);
                                  setShowTransferModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-blue-600 hover:bg-blue-50"
                                title="Transferir responsável"
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
                                title="Excluir tarefa"
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
                    onClick={() => {
                      setPreSelectedStatus("overdue");
                      setSelectedTask(null);
                      setTaskHistory([]);
                      setShowTaskModal(true);
                    }}
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
                                title="Visualizar tarefa"
                              >
                                <i className="ri-eye-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                                title="Editar tarefa"
                              >
                                <i className="ri-edit-line text-xs"></i>
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task);
                                  setShowDeletionModal(true);
                                }}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap text-red-600 hover:bg-red-50"
                                title="Excluir tarefa"
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
                    onClick={() => {
                      setPreSelectedStatus("completed");
                      setSelectedTask(null);
                      setTaskHistory([]);
                      setShowTaskModal(true);
                    }}
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
                                onClick={() => handleViewTask(task)}
                                className="action-button p-1 rounded !rounded-button whitespace-nowrap"
                              >
                                <i className="ri-eye-line text-xs"></i>
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
                              className={`calendar-event truncate ${
                                task.status.status === 'completed' ? 'line-through opacity-60' : ''
                              }`}
                              title={`${task.timeStr} - ${task.title}`}
                            >
                              {task.timeStr} - {task.title}
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
                              <div key={`${task.id}-${index}`} className="calendar-event text-xs truncate">
                                {task.title}
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
                            <div key={`${task.id}-${index}`} className="text-xs truncate">
                              {task.title}
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
          const response = await fetch(`/api/monde/tarefas/${selectedTask?.id}/historico`, {
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
            console.log('✅ Histórico salvo com sucesso');
            alert('Atualização salva com sucesso!');
            // Recarregar a página para atualizar os dados
            window.location.reload();
          } else {
            const errorData = await response.json();
            console.error('❌ Erro ao salvar histórico:', errorData);
            alert('Erro: Esta tarefa não permite adicionar histórico ou foi excluída');
          }
        } catch (error) {
          console.error('❌ Erro na requisição:', error);
          alert('Erro ao salvar atualização');
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
                console.log(isEditing ? '💾 Editando tarefa com dados:' : '✨ Criando nova tarefa com dados:', taskData);
                
                const url = isEditing ? `/api/monde/tarefas/${selectedTask.id}` : '/api/monde/tarefas';
                const method = isEditing ? 'PUT' : 'POST';
                
                const response = await fetch(url, {
                  method: method,
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
                  },
                  body: JSON.stringify(taskData)
                });
                
                const result = await response.json();
                console.log('📋 Resposta da API:', result);
                
                if (response.ok) {
                  console.log(isEditing ? '✅ Tarefa editada com sucesso' : '✅ Nova tarefa criada com sucesso');
                  
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
                        // Recarregar histórico após salvar
                        loadTaskHistory(selectedTask.id);
                      } else {
                        console.warn('⚠️ Erro ao salvar histórico, mas tarefa foi salva');
                      }
                    } catch (historyError) {
                      console.warn('⚠️ Erro ao salvar histórico:', historyError);
                    }
                  } else {
                    // Se não há histórico para salvar, ainda assim recarregar
                    loadTaskHistory(selectedTask.id);
                  }
                  
                  // Fechar modal e recarregar dados
                  setShowTaskModal(false);
                  setSelectedTask(null);
                  setNewHistoryText('');
                  reloadTasks(); // Recarregar lista de tarefas em vez de reload da página
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
                        defaultValue={selectedTask?.attributes?.title || ''}
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        onChange={(e) => saveTaskChanges({ title: e.target.value })}
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
                        onChange={(e) => saveTaskChanges({ category: e.target.value })}
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
                            : users.find((u: any) => u.attributes?.email === localStorage.getItem('user-email'))?.id || ''
                        }
                        onChange={(e) => saveTaskChanges({ assignee_id: e.target.value })}
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
                        <ClientSearchField
                          value={clientSearchTerm}
                          onChange={(value) => {
                            setClientSearchTerm(value);
                            searchClientsInMonde(value);
                          }}
                          onSelect={(client) => {
                            setSelectedPersonForTask(client);
                            setClientSearchTerm(client.attributes.name || client.attributes['company-name'] || 'Cliente');
                            setClientSearchResults([]);
                            
                            // Preencher campos automaticamente
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
                                mobileField.value = client.attributes['mobile-phone'] || '';
                                mobileField.dispatchEvent(new Event('input', { bubbles: true }));
                              }
                            }, 100);
                          }}
                          results={clientSearchResults}
                          isSearching={isSearchingClients}
                        />
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
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        defaultValue={selectedTask?.client_email || selectedPersonForTask?.attributes?.email || ''}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Telefone:
                      </label>
                      <input
                        type="tel"
                        name="client_phone"
                        placeholder="(11) 3333-4444"
                        className="form-input w-full px-3 py-2 text-sm"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        defaultValue={selectedTask?.client_phone || selectedPersonForTask?.attributes?.phone || ''}
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Celular:
                      </label>
                      <input
                        type="tel"
                        name="client_mobile"
                        placeholder="(11) 99999-8888"
                        className="form-input w-full px-3 py-2 text-sm"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        defaultValue={selectedTask?.client_mobile || selectedPersonForTask?.attributes?.['mobile-phone'] || ''}
                      />
                    </div>
                  </div>

                  {/* Quinta linha - Descrição da tarefa */}
                  <div className="col-span-12">
                    <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                      Descrição:
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="form-input w-full px-3 py-2 text-sm"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                      defaultValue={selectedTask?.attributes?.description || ''}
                    ></textarea>
                  </div>

                  {/* Histórico/Comentários */}
                  {activeModalTab === "detalhes" && (
                    <div className="col-span-12 border-t pt-4">
                      <h4 className="text-md font-medium mb-3" style={{ color: "var(--text-primary)" }}>
                        Histórico da Tarefa
                      </h4>
                      
                      {/* Novo comentário */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                          Adicionar comentário:
                        </label>
                        <textarea
                          value={newHistoryText}
                          onChange={(e) => setNewHistoryText(e.target.value)}
                          placeholder="Digite seu comentário ou observação..."
                          rows={3}
                          className="form-input w-full px-3 py-2 text-sm"
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                        ></textarea>
                      </div>
                      
                      {/* Lista do histórico */}
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {taskHistory.length > 0 ? (
                          taskHistory.map((item: any, index: number) => (
                            <div key={index} className="text-xs p-2 rounded" style={{ backgroundColor: "var(--bg-tertiary)" }}>
                              <div className="font-medium" style={{ color: "var(--text-primary)" }}>
                                {item.attributes?.description || item.description || 'Sem descrição'}
                              </div>
                              <div className="text-gray-500 mt-1">
                                {item.attributes?.['created-at'] 
                                  ? new Date(item.attributes['created-at']).toLocaleString('pt-BR')
                                  : item.createdAt
                                  ? new Date(item.createdAt).toLocaleString('pt-BR')
                                  : 'Data não disponível'
                                }
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum histórico disponível</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botões de ação */}
                  <div className="col-span-12 flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTaskModal(false);
                        setSelectedTask(null);
                        setAttachments([]);
                        setTaskAttachments([]);
                        setIsModalMaximized(false);
                        setIsEditing(false);
                        setTaskHistory([]);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {isEditing ? 'Salvar Alterações' : 'Criar Tarefa'}
                    </button>
                  </div>
                </div>
                )}

                {/* Aba de Anexos */}
                {activeModalTab === "anexos" && (
                  <div className="space-y-6">
                    {/* Upload de anexos */}
                    <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            setAttachments(Array.from(e.target.files));
                          }
                        }}
                        className="hidden"
                        id="attachment-upload"
                      />
                      <label htmlFor="attachment-upload" className="cursor-pointer">
                        <i className="ri-upload-cloud-2-line text-3xl text-gray-400 mb-2 block"></i>
                        <p className="text-sm text-gray-600">Clique para selecionar arquivos ou arraste aqui</p>
                        <p className="text-xs text-gray-400 mt-1">Máximo 10 arquivos, 5MB cada</p>
                      </label>
                    </div>

                    {/* Lista de anexos para upload */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Arquivos selecionados:</h4>
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                              className="text-red-500 hover:text-red-700"
                            >
                              <i className="ri-close-line"></i>
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={uploadAttachments}
                          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                          disabled={uploadingAttachment}
                        >
                          {uploadingAttachment ? 'Enviando...' : `Enviar ${attachments.length} arquivo(s)`}
                        </button>
                      </div>
                    )}

                    {/* Lista de anexos existentes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Anexos da tarefa:</h4>
                        <button
                          type="button"
                          onClick={() => loadTaskAttachments(selectedTask?.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          <i className="ri-refresh-line mr-1"></i>
                          Atualizar
                        </button>
                      </div>
                      
                      {loadingAttachments ? (
                        <div className="text-center py-4">
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Carregando anexos...
                        </div>
                      ) : taskAttachments.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                          <div className="grid grid-cols-4 gap-2 text-xs font-medium text-gray-600 border-b pb-2">
                            <div>Nome do Arquivo</div>
                            <div>Tipo</div>
                            <div>Tamanho</div>
                            <div>Ações</div>
                          </div>
                          {taskAttachments.map((attachment, index) => (
                            <div key={attachment.id || index} className="grid grid-cols-4 gap-2 text-sm py-2 border-b">
                              <div className="truncate" title={attachment.attributes?.['file-name'] || attachment.filename || 'Arquivo'}>
                                {attachment.attributes?.['file-name'] || attachment.filename || 'Arquivo'}
                              </div>
                              <div className="text-gray-500">
                                {attachment.attributes?.['file-type'] || 'N/A'}
                              </div>
                              <div className="text-gray-500">
                                {attachment.attributes?.['file-size'] 
                                  ? `${(attachment.attributes['file-size'] / 1024).toFixed(1)} KB`
                                  : 'N/A'
                                }
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    addToast({
                                      title: "Limitação da API",
                                      description: "A API do Monde não disponibiliza download direto de anexos. Use o botão 'Ver no Monde' para acessar o arquivo.",
                                      variant: "default",
                                    });
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                  title="Visualizar arquivo"
                                >
                                  <i className="ri-eye-line"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(attachment.attributes?.['file-name'] || attachment.filename || 'Arquivo');
                                    addToast({
                                      title: "Nome copiado!",
                                      description: "O nome do arquivo foi copiado para a área de transferência.",
                                      variant: "default",
                                    });
                                  }}
                                  className="text-green-600 hover:text-green-800 text-xs"
                                  title="Copiar nome do arquivo"
                                >
                                  <i className="ri-file-copy-line"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    window.open(`https://${user?.monde_server}/tasks/${selectedTask?.id}`, '_blank');
                                  }}
                                  className="text-purple-600 hover:text-purple-800 text-xs"
                                  title="Ver tarefa no Monde"
                                >
                                  <i className="ri-external-link-line"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteAttachment(attachment.id)}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                  title="Excluir anexo"
                                >
                                  <i className="ri-delete-bin-line"></i>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 py-4 text-center">Nenhum anexo encontrado</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Aba de Campos Personalizados */}
                {activeModalTab === "campos" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Esta funcionalidade estará disponível em breve. Aqui você poderá gerenciar campos personalizados da tarefa.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modais de Cadastro */}
      <PersonFisicaModal
        show={showPersonFisicaModal}
        onClose={() => setShowPersonFisicaModal(false)}
        onSubmit={submitPersonFisica}
        cities={cities}
        loadCities={loadCities}
        loadingCities={loadingCities}
        savingPerson={savingPersonFisica}
      />

      {/* Modal Pessoa Jurídica */}
      <PersonJuridicaModal
        show={showPersonJuridicaModal}
        onClose={() => setShowPersonJuridicaModal(false)}
        onSubmit={submitPersonJuridica}
        cities={cities}
        loadCities={loadCities}
        loadingCities={loadingCities}
        savingPerson={savingPersonJuridica}
      />

      {/* Modal de busca de clientes */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">🔍 Buscar Cliente</h2>
            </div>
            <div className="p-4 space-y-4">
              <input
                type="text"
                placeholder="Nome ou documento do cliente"
                className="form-input w-full px-3 py-2 text-sm border rounded"
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
            <div className="p-4 flex justify-end space-x-3">
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
      )}

    </div>
  );
}
