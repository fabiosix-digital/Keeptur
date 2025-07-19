import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../lib/auth";
import { MondeAPI } from "../lib/monde-api";
import { useTheme } from "../hooks/use-theme";
import { TokenExpiredModal } from "../components/TokenExpiredModal";
import { setTokenExpiredHandler } from "../lib/queryClient";
import logoFull from "@assets/LOGO Lilas_1752695672079.png";
import logoIcon from "@assets/ico Lilas_1752695703171.png";
import "../modal.css";

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

  const [isInitialized, setIsInitialized] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);
  const [savingCustomFields, setSavingCustomFields] = useState(false);
  


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
        
        // Carregar estatísticas de clientes
        await loadClientStats();

        // Processar dados do formato JSON:API do Monde
        const allTasksFromServer = tasksResponse?.data || [];
        
        // Separar tarefas ativas das excluídas
        const activeTasks = allTasksFromServer.filter((task: any) => 
          !task.attributes.deleted && !task.attributes.is_deleted
        );
        
        console.log('🎯 Tarefas separadas:', {
          total: allTasksFromServer.length,
          ativas: activeTasks.length,
          excluidas: allTasksFromServer.length - activeTasks.length
        });

        // Calcular estatísticas apenas das tarefas ativas para o filtro padrão
        const realStats = calculateTaskStats(activeTasks);

        setAllTasks(allTasksFromServer); // Todas (ativas + excluídas) para quando mostrar excluídas
        setTasks(activeTasks); // Apenas ativas para filtro padrão "Minhas Tarefas"
        
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

  // Recarregar tarefas quando taskFilter ou showDeleted mudar
  useEffect(() => {
    if (isInitialized) {
      reloadTasks();
    }
  }, [taskFilter, showDeleted]);

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
      
      // Agora carregar tarefas excluídas separadamente
      const deletedUrl = `/api/monde/tarefas?include_deleted=true`;
      console.log('🗑️ Carregando tarefas excluídas...');

      const deletedResponse = await fetch(deletedUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (deletedResponse.ok) {
        const deletedData = await deletedResponse.json();
        console.log('✅ Tarefas excluídas carregadas:', deletedData.data?.length || 0);
        
        // Combinar tarefas ativas e excluídas evitando duplicatas
        const activeTasks = data.data || [];
        const deletedTasks = deletedData.data || [];
        
        // Separar corretamente tarefas ativas das excluídas
        const reallyActiveTasks = activeTasks.filter((task: any) => 
          !task.attributes.deleted && !task.attributes.is_deleted
        );
        
        const reallyDeletedTasks = deletedTasks.filter((task: any) => 
          task.attributes.deleted || task.attributes.is_deleted
        );
        
        const allTasks = [...reallyActiveTasks, ...reallyDeletedTasks];
        
        // Remover duplicatas baseado no ID
        const uniqueTasks = allTasks.filter((task, index, self) => 
          index === self.findIndex(t => t.id === task.id)
        );
        
        console.log('📊 Total de tarefas combinadas:', uniqueTasks.length, '(ativas:', reallyActiveTasks.length, '+ excluídas:', reallyDeletedTasks.length, ')');
        
        // Para mostrar estatísticas corretas, separar apenas as ativas
        return { 
          data: uniqueTasks,
          activeTasks: reallyActiveTasks,
          deletedTasks: reallyDeletedTasks
        };
      } else {
        console.warn('⚠️ Erro ao carregar tarefas excluídas, continuando apenas com ativas');
        return data;
      }
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
      
      // Para "assigned_to_me", SEMPRE filtrar manualmente por UUID para garantir apenas tarefas do usuário
      console.log('✅ Usando tarefas ativas para assigned_to_me:', tasks?.length || 0);
      if (userUUID) {
        // Filtrar das tarefas ativas (tasks) que já vem filtradas do servidor
        filtered = (tasks || []).filter((task: any) => {
          const assigneeId = task.relationships?.assignee?.data?.id;
          return assigneeId === userUUID;
        });
        console.log('🔍 Tarefas filtradas para o usuário:', filtered.length);
      } else {
        console.log('❌ UUID do usuário não encontrado');
        filtered = [];
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
    } else {
      // Para 'all', usar TODAS as tarefas disponíveis 
      // Se estiver no modo "all", sempre usar allTasks que contém todas as tarefas da empresa
      filtered = allTasks || sourceTasks;
      console.log('✅ Filtro "all" - usando todas as tarefas:', filtered.length);
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
    
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Criar novo controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      const token = localStorage.getItem("keeptur-token");
      
      let activeTasks = [];
      let deletedTasks = [];
      
      // Carregar tarefas baseado no filtro atual
      if (taskFilter === 'assigned_to_me') {
        // Carregar apenas tarefas atribuídas ao usuário
        const response = await fetch('/api/monde/tarefas?assignee=me', {
          headers: { Authorization: `Bearer ${token}` },
          signal,
        });
        
        if (signal.aborted) return;
        
        const data = await response.json();
        activeTasks = data?.data || [];
        console.log('✅ Tarefas "Minhas" carregadas:', activeTasks.length);
      } else if (taskFilter === 'created_by_me') {
        // Carregar apenas tarefas criadas pelo usuário
        const response = await fetch('/api/monde/tarefas?filter[created_by]=me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        activeTasks = data?.data || [];
        console.log('✅ Tarefas "Criadas por Mim" carregadas:', activeTasks.length);
      } else {
        // Para "all", carregar TODAS as tarefas da empresa
        const response = await fetch('/api/monde/tarefas?all_company=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        activeTasks = data?.data || [];
        console.log('✅ TODAS as tarefas da empresa carregadas:', activeTasks.length);
      }
      
      // Se showDeleted for true, carregar também tarefas excluídas
      if (showDeleted) {
        console.log('🗑️ Carregando tarefas excluídas...');
        const deletedResponse = await fetch('/api/monde/tarefas?include_deleted=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const deletedData = await deletedResponse.json();
        deletedTasks = deletedData?.data || [];
        console.log('✅ Tarefas excluídas carregadas:', deletedTasks.length);
      }
      
      // Combinar tarefas ativas e excluídas
      const allTasksCombined = [...activeTasks, ...deletedTasks];
      console.log('📊 Total de tarefas combinadas:', allTasksCombined.length, '(ativas:', activeTasks.length, '+ excluídas:', deletedTasks.length, ')');
      
      // Atualizar estado
      setTasks(activeTasks); // Apenas ativas
      setAllTasks(allTasksCombined); // Todas (ativas + excluídas)
      
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

  // Polling para atualizar dados a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      reloadTasksAndClients();
    }, 30000);

    return () => clearInterval(interval);
  }, [
    taskFilter,
    taskSearchTerm,
    selectedCategory,
    // selectedPriority removido - não existe na API do Monde
    selectedSituation,

    selectedClient,
    startDate,
    endDate,
    searchTerm,
  ]);

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

  // Filtrar tarefas baseado no status e filtros (função principal)
  const getFilteredTasksWithStatus = () => {
    // IMPORTANTE: Para o Kanban, usar APENAS as tarefas já filtradas pelo filtro principal (tasks)
    // O array 'tasks' já contém apenas as tarefas filtradas corretamente
    let filtered = tasks || [];

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

  // Função para organizar tarefas por status no Kanban (mantida para compatibilidade)
  const getTasksByStatus = (status: string) => {
    // Usar TODAS as tarefas combinadas (ativas + excluídas) para o Kanban
    const allCombinedTasks = allTasks;

    switch (status) {
      case "A Fazer":
        // Tarefas não concluídas e sem status específico
        return allCombinedTasks.filter(
          (task: any) =>
            !task.attributes.completed &&
            (!task.attributes.status || task.attributes.status === "pending"),
        );
      case "Em Andamento":
        // Tarefas com status in_progress
        return allCombinedTasks.filter(
          (task: any) =>
            !task.attributes.completed &&
            task.attributes.status === "in_progress",
        );
      case "Concluído":
        // Tarefas marcadas como concluídas - usar todas as tarefas combinadas
        return allCombinedTasks.filter(
          (task: any) => task.attributes.completed === true,
        );
      case "Cancelado":
        // Tarefas com status cancelled
        return allCombinedTasks.filter(
          (task: any) => task.attributes.status === "cancelled",
        );
      default:
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

  // Aplicar debounce na função reloadTasks
  const debouncedReloadTasks = debounce(reloadTasks, 500);

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
                      {getFilteredTasksWithStatus().filter(task => {
                        const { status } = getTaskStatus(task);
                        return status === "pending";
                      }).length}
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
                    {getFilteredTasksWithStatus()
                      .filter(task => {
                        const { status } = getTaskStatus(task);
                        // Filtrar apenas tarefas reais (não mockadas)
                        return status === "pending" && task.id && !task.attributes.title?.includes("Follow-up");
                      })
                      .map((task: any, index: number) => (
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
                      ))}
                  </div>
                  <button
                    onClick={() => setShowTaskModal(true)}
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
                      {getFilteredTasksWithStatus().filter(task => {
                        const { status } = getTaskStatus(task);
                        return status === "overdue";
                      }).length}
                    </span>
                  </div>
                  <div
                    className={`space-y-3 ${getFilteredTasksWithStatus().filter(task => {
                      const { status } = getTaskStatus(task);
                      return status === "overdue";
                    }).length === 0 ? 'min-h-[80px]' : 'min-h-[120px]'}`}
                    onDrop={(e) => handleDrop(e, "overdue")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {getFilteredTasksWithStatus()
                      .filter(task => {
                        const { status } = getTaskStatus(task);
                        return status === "overdue";
                      })
                      .map((task: any, index: number) => (
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
                      ))}
                  </div>
                  <button
                    onClick={() => setShowTaskModal(true)}
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
                      {getFilteredTasksWithStatus().filter(task => task.attributes.completed === true).length}
                    </span>
                  </div>
                  <div
                    className={`space-y-3 ${getFilteredTasksWithStatus().filter(task => task.attributes.completed === true).length === 0 ? 'min-h-[80px]' : 'min-h-[120px]'}`}
                    onDrop={(e) => handleDrop(e, "completed")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {getFilteredTasksWithStatus()
                      .filter(task => {
                        return task.attributes.completed === true;
                      })
                      .map((task: any, index: number) => (
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
                      ))}
                  </div>
                  <button
                    onClick={() => setShowTaskModal(true)}
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
                      {allTasks.filter(task => {
                        return task && task.attributes && (task.attributes.deleted || task.attributes.status === "deleted" || task.attributes.is_deleted);
                      }).length}
                    </span>
                  </div>
                  <div
                    className="space-y-3 min-h-[120px]"
                    onDrop={(e) => handleDrop(e, "archived")}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {allTasks
                      .filter(task => {
                        return task && task.attributes && (task.attributes.deleted || task.attributes.status === "deleted" || task.attributes.is_deleted);
                      })
                      .map((task: any, index: number) => (
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
                      ))}
                  </div>
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="primary-button w-full mt-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>Nova Tarefa
                  </button>
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
          await loadTasks();
          
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
        <div className="modal-content rounded-xl shadow-xl max-w-5xl w-full mx-4 max-h-[95vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-primary)" }}>
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
                  className="theme-toggle p-2 rounded-lg !rounded-button whitespace-nowrap"
                >
                  <i className="ri-fullscreen-line text-lg"></i>
                </button>
                <button
                  onClick={() => {
                    setShowTaskModal(false);
                    setSelectedTask(null);
                    setAttachments([]);
                    setTaskAttachments([]);
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
              
              if (!isEditing) return;
              
              const formData = new FormData(e.target as HTMLFormElement);
              const taskData = {
                title: formData.get('title') || selectedTask?.attributes?.title,
                description: formData.get('description') || selectedTask?.attributes?.description,
                due: selectedTask?.attributes?.due,
                priority: formData.get('priority') || 'normal',
                assignee_id: formData.get('assignee_id') || selectedTask?.relationships?.assignee?.data?.id,
                person_id: formData.get('person_id') || selectedTask?.relationships?.person?.data?.id,
                category_id: formData.get('category') || selectedTask?.relationships?.category?.data?.id,
                status: selectedTask?.attributes?.completed ? 'concluida' : 'pendente',
                completed: selectedTask?.attributes?.completed || false
              };
              
              try {
                console.log('💾 Salvando tarefa com dados:', taskData);
                
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
                  console.log('✅ Tarefa salva com sucesso');
                  
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
                  loadTasks(); // Recarregar lista de tarefas em vez de reload da página
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
                        defaultValue={selectedTask?.relationships?.assignee?.data?.id || ''}
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

                  {/* Terceira linha - Pessoa/Cliente e Empresa */}
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-6">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Pessoa/Cliente:
                      </label>
                      <input
                        type="text"
                        className="form-input w-full px-3 py-2 text-sm"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        value={selectedTask?.client_name || 'Cliente não encontrado'}
                        readOnly
                      />

                    </div>
                    <div className="col-span-6">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Empresa:
                      </label>
                      <input
                        type="text"
                        className="form-input w-full px-3 py-2 text-sm"
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        value={selectedTask?.client_company || 'Empresa não encontrada'}
                        readOnly
                      />
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
                        name="email"
                        className="form-input w-full px-3 py-2 text-sm text-blue-600 underline"
                        value={selectedTask?.client_email || ''}
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        readOnly
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Telefone:
                      </label>
                      <input
                        type="text"
                        className="form-input w-full px-3 py-2 text-sm"
                        value={selectedTask?.client_phone || ''}
                        style={{ backgroundColor: "var(--bg-secondary)" }}
                        readOnly
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                        Celular:
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          className="form-input flex-1 px-3 py-2 text-sm"
                          value={selectedTask?.client_mobile || ''}
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                          readOnly
                        />
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      </div>
                    </div>
                  </div>

                  {/* Área de Descrição/Atualizações */}
                  <div className="mt-6">
                    <div className="grid grid-cols-12 gap-4 mb-4">
                      <div className="col-span-6">
                        <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                          Vencimento:
                        </label>
                        <input
                          type="datetime-local"
                          name="due"
                          className="form-input w-full px-3 py-2 text-sm"
                          defaultValue={selectedTask?.attributes?.due ? 
                            (() => {
                              const date = new Date(selectedTask.attributes.due);
                              // Converter para o fuso horário local
                              const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
                              return localDate.toISOString().slice(0, 16);
                            })() : ''
                          }
                          style={{ backgroundColor: "var(--bg-secondary)" }}
                          onChange={(e) => saveTaskChanges({ due: e.target.value })}
                        />
                      </div>
                      <div className="col-span-6"></div>
                    </div>

                    {/* Área de histórico com scroll */}
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
                        <div className="space-y-3">
                          <div className="text-sm font-medium text-purple-600">
                            16/07/2025 15:08:24 - Fabio Silva
                          </div>
                          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            mais um teste
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            16/07/2025 15:08:08 - Fabio Silva
                          </div>
                          <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                            testando atualização
                          </div>
                        </div>
                      )}
                    </div>
                    
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
                                loadTasks();
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
                {selectedTask?.attributes?.completed ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Para reabertura, obrigar seleção de nova data/hora
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
                    Reabrir
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
                )}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={deleteTask}
                    className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTaskModal(false);
                      setSelectedTask(null);
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
                    Salvar
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
          <button className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full">
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
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="hidden md:block text-left">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {user?.name}
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
        onClick={() => setShowTaskModal(true)}
        className="floating-button"
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
                    className={`status-badge-${selectedTaskDetails.attributes.completed ? "completed" : "pending"} px-3 py-1 rounded-full text-sm font-medium`}
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

      {/* Modal de token expirado */}
      <TokenExpiredModal
        isOpen={showTokenExpiredModal}
        onClose={() => setShowTokenExpiredModal(false)}
      />

      {/* Modal de Cliente */}
      {renderClientModal()}

      {/* Modal de Mudança de Status */}
      {statusChangeModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {statusChangeModal.isReopen ? "Reabrir Tarefa" : "Alterar Status da Tarefa"}
            </h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {statusChangeModal.isReopen 
                  ? `Você está reabrindo a tarefa "${statusChangeModal.task?.attributes?.title}" para o status "${getStatusDisplayName(statusChangeModal.newStatus)}".`
                  : `Alterando status da tarefa "${statusChangeModal.task?.attributes?.title}" para "${getStatusDisplayName(statusChangeModal.newStatus)}".`
                }
              </p>

              {/* Campo de data/hora obrigatório para mudanças de status */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nova Data/Hora de Vencimento *
                </label>
                <input
                  type="datetime-local"
                  value={statusChangeForm.datetime}
                  onChange={(e) => setStatusChangeForm({...statusChangeForm, datetime: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  min={statusChangeModal.newStatus === "pending" ? new Date().toISOString().slice(0, 16) : ""}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {statusChangeModal.newStatus === "pending" 
                    ? "⚠️ Para tarefas pendentes, a data deve ser FUTURA para evitar ficar atrasada"
                    : statusChangeModal.isReopen 
                      ? "Obrigatório para reabertura de tarefas"
                      : "Obrigatório para mudança de status"
                  }
                </p>
              </div>

              {/* Campo de atualização opcional */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Atualização (opcional)
                </label>
                <textarea
                  value={statusChangeForm.comment}
                  onChange={(e) => setStatusChangeForm({...statusChangeForm, comment: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  rows={3}
                  placeholder="Adicione uma atualização sobre a mudança de status..."
                />
              </div>

              {/* Mensagens de sucesso e erro */}
              {statusChangeForm.success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-center">
                    <i className="ri-check-line mr-2"></i>
                    {statusChangeForm.success}
                  </div>
                </div>
              )}

              {statusChangeForm.error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
                  <div className="flex items-center">
                    <i className="ri-error-warning-line mr-2"></i>
                    {statusChangeForm.error}
                  </div>
                </div>
              )}
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
                disabled={!statusChangeForm.datetime}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {statusChangeModal.isReopen ? "Reabrir" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Transferência de Responsável */}
      {showTransferModal && taskToTransfer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                <i className="ri-user-shared-line mr-2 text-blue-600"></i>
                Transferir Responsável
              </h3>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTaskToTransfer(null);
                  setSelectedTransferUser("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Tarefa: <span className="font-medium" style={{ color: "var(--text-primary)" }}>{taskToTransfer.attributes.title}</span>
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Responsável atual: <span className="font-medium">{getAssigneeName(taskToTransfer)}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                Novo Responsável *
              </label>
              <select
                value={selectedTransferUser}
                onChange={(e) => setSelectedTransferUser(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
              >
                <option value="">Selecione um responsável</option>
                {users.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.attributes.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTaskToTransfer(null);
                  setSelectedTransferUser("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!selectedTransferUser) {
                    // Mostrar toast de erro
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    toast.textContent = 'Selecione um responsável';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                    return;
                  }

                  try {
                    console.log("🔄 Transferindo tarefa", taskToTransfer.id, "para", selectedTransferUser);
                    
                    // Buscar dados atuais da tarefa
                    const currentTask = taskToTransfer;
                    const taskData = {
                      title: currentTask.attributes.title,
                      description: currentTask.attributes.description || "",
                      completed: currentTask.attributes.completed,
                      due: currentTask.attributes.due,
                      assignee_id: selectedTransferUser // Novo responsável
                    };
                    
                    // Atualizar tarefa via API do Monde
                    const response = await fetch(`/api/monde/tarefas/${taskToTransfer.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
                      },
                      body: JSON.stringify(taskData)
                    });
                    
                    if (response.ok) {
                      console.log("✅ Tarefa transferida com sucesso");
                      
                      // Registrar no histórico
                      const selectedUser = users.find((u: any) => u.id === selectedTransferUser);
                      const historyText = `Responsável transferido para ${selectedUser?.attributes?.name || 'Usuário'}`;
                      
                      await fetch('/api/monde/task-historics', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('keeptur-token')}`
                        },
                        body: JSON.stringify({
                          task_id: taskToTransfer.id,
                          text: historyText
                        })
                      });
                      
                      // Mostrar toast de sucesso
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                      toast.textContent = 'Responsável transferido com sucesso!';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                      
                      setShowTransferModal(false);
                      setTaskToTransfer(null);
                      setSelectedTransferUser("");
                      reloadTasks();
                    } else {
                      throw new Error('Erro na API');
                    }
                  } catch (error) {
                    console.error("❌ Erro ao transferir responsável:", error);
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    toast.textContent = 'Erro ao transferir responsável';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!selectedTransferUser}
              >
                <i className="ri-user-shared-line mr-2"></i>
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conclusão de Tarefa */}
      {showCompletionModal && taskToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                <i className="ri-check-double-line mr-2 text-green-600"></i>
                Concluir Tarefa
              </h3>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setTaskToComplete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  {taskToComplete.attributes?.title}
                </h4>
                <p className="text-blue-600 dark:text-blue-300 text-sm">
                  Esta tarefa será marcada como concluída. Você pode adicionar uma observação opcional sobre a conclusão.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Observação da Conclusão (Opcional)
                  </label>
                  <textarea
                    value={newHistoryText}
                    onChange={(e) => setNewHistoryText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    style={{ 
                      backgroundColor: "var(--bg-primary)", 
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)"
                    }}
                    rows={3}
                    placeholder="Descreva brevemente o que foi realizado ou concluído..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setTaskToComplete(null);
                  setNewHistoryText("");
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

                    // Cancelar requisições anteriores se existirem
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                    }

                    // Marcar tarefa como concluída
                    const response = await fetch(`/api/monde/tarefas/${taskToComplete.id}`, {
                      method: 'PUT',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        completed: true,
                        completed_at: new Date().toISOString(),
                        history_comment: newHistoryText.trim() || 'Tarefa concluída'
                      })
                    });

                    if (response.ok) {
                      console.log('✅ Tarefa marcada como concluída');
                      
                      // Fechar modal imediatamente
                      setShowCompletionModal(false);
                      setTaskToComplete(null);
                      setNewHistoryText("");
                      
                      // Aguardar um momento antes de recarregar
                      setTimeout(async () => {
                        try {
                          await reloadTasks();
                        } catch (error) {
                          console.log('⚠️ Erro ao recarregar tarefas após conclusão:', error);
                        }
                      }, 800);
                      
                      // Mostrar feedback visual
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = 'Tarefa concluída com sucesso!';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    } else {
                      console.error('❌ Erro ao concluir tarefa:', response.status);
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = 'Erro ao concluir tarefa. Tente novamente.';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    }
                  } catch (error) {
                    console.error('❌ Erro:', error);
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                    toast.textContent = 'Erro ao concluir tarefa. Tente novamente.';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <i className="ri-check-line mr-2"></i>
                Concluir Tarefa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Tarefa */}
      {showDeletionModal && taskToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                <i className="ri-delete-bin-line mr-2 text-red-600"></i>
                Excluir Tarefa
              </h3>
              <button
                onClick={() => {
                  setShowDeletionModal(false);
                  setTaskToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  {taskToDelete.attributes?.title}
                </h4>
                <p className="text-red-600 dark:text-red-300 text-sm">
                  Esta tarefa será excluída permanentemente. Você pode adicionar uma observação sobre a exclusão.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Motivo da Exclusão (Opcional)
                  </label>
                  <textarea
                    value={newHistoryText}
                    onChange={(e) => setNewHistoryText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    style={{ 
                      backgroundColor: "var(--bg-primary)", 
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)"
                    }}
                    rows={3}
                    placeholder="Explique brevemente o motivo da exclusão desta tarefa..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeletionModal(false);
                  setTaskToDelete(null);
                  setNewHistoryText("");
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

                    // Excluir tarefa
                    const response = await fetch(`/api/monde/tarefas/${taskToDelete.id}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        history_comment: newHistoryText.trim() || 'Tarefa excluída'
                      })
                    });

                    if (response.ok) {
                      console.log('✅ Tarefa excluída com sucesso');
                      
                      // Fechar modal imediatamente
                      setShowDeletionModal(false);
                      setTaskToDelete(null);
                      setNewHistoryText("");
                      
                      // Aguardar mais tempo para a API processar a exclusão
                      setTimeout(async () => {
                        try {
                          await reloadTasks();
                          
                          // Se não mudou, forçar uma atualização completa
                          setTimeout(async () => {
                            console.log('🔄 Forçando atualização completa após exclusão');
                            await reloadTasks();
                          }, 1500);
                        } catch (error) {
                          console.log('⚠️ Erro ao recarregar tarefas após exclusão:', error);
                        }
                      }, 1000);
                      
                      // Mostrar feedback visual
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = 'Tarefa excluída com sucesso!';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    } else {
                      console.error('❌ Erro ao excluir tarefa:', response.status);
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = 'Erro ao excluir tarefa. Tente novamente.';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    }
                  } catch (error) {
                    console.error('❌ Erro:', error);
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                    toast.textContent = 'Erro ao excluir tarefa. Tente novamente.';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Excluir Tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
