import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { MondeAPI } from '../lib/monde-api';
import { useTheme } from '../hooks/use-theme';
import logoFull from '@assets/LOGO Lilas_1752695672079.png';
import logoIcon from '@assets/ico Lilas_1752695703171.png';
import '../modal.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('tarefas');
  const [activeView, setActiveView] = useState('lista');
  const [tasks, setTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [calendarView, setCalendarView] = useState('mes');

  useEffect(() => {
    // Aplicar tema no body
    document.body.className = 'theme-transition';
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('keeptur-monde-token');
        const serverUrl = localStorage.getItem('keeptur-server-url') || 'http://allanacaires.monde.com.br';
        
        if (!token || !serverUrl) {
          console.error('Token ou servidor não encontrado');
          return;
        }

        // Inicializar API do Monde
        const api = new MondeAPI(serverUrl);
        api.setToken(token);

        // Carregar dados reais da API do Monde
        const [tasksResponse, clientsResponse, statsResponse] = await Promise.all([
          fetch('/api/monde/tarefas', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => res.json()).catch(() => ({ data: [] })),
          fetch('/api/monde/clientes', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => res.json()).catch(() => ({ data: [] })),
          fetch('/api/monde/tarefas/stats').then(res => res.json()).catch(() => ({}))
        ]);

        // Processar dados do formato JSON:API do Monde
        const tasks = tasksResponse?.data || [];
        const clients = clientsResponse?.data || [];
        
        // Calcular estatísticas reais das tarefas
        const realStats = {
          total: tasks.length,
          pendentes: tasks.filter((t: any) => !t.attributes.completed).length,
          concluidas: tasks.filter((t: any) => t.attributes.completed).length,
          atrasadas: tasks.filter((t: any) => {
            const dueDate = new Date(t.attributes.due);
            return dueDate < new Date() && !t.attributes.completed;
          }).length
        };

        setTasks(tasks);
        setClients(clients);
        setStats({
          ...realStats,
          totalVariation: "+15%",
          pendentesVariation: "-8%",
          concluidasVariation: "+23%",
          atrasadasVariation: "+12%"
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
  };

  const handleDragStart = (e: React.DragEvent, taskId: number, status: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ taskId, status }));
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
    
    try {
      const token = localStorage.getItem('keeptur-token');
      
      if (!token) return;

      // Atualizar status da tarefa via API
      await fetch(`/api/monde/tarefas/${data.taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      // Recarregar dados após atualização
      const tasksResponse = await fetch('/api/monde/tarefas', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json()).catch(() => ({ data: [] }));
      setTasks(tasksResponse?.data || []);
      
      console.log(`Tarefa ${data.taskId} movida para ${newStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  const handleViewTask = (task: any) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleCompleteTask = async (taskId: number) => {
    try {
      const token = localStorage.getItem('keeptur-token');
      if (!token) return;

      // Atualizar tarefa para concluída
      await fetch(`/api/monde/tarefas/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'concluida' })
      });
      
      // Recarregar dados
      const tasksResponse = await fetch('/api/monde/tarefas', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json()).catch(() => ({ data: [] }));
      setTasks(tasksResponse?.data || []);
      
      console.log(`Tarefa ${taskId} marcada como concluída`);
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
    }
  };

  const handleTransferTask = async (taskId: number) => {
    console.log(`Transferir tarefa ${taskId} - funcionalidade em desenvolvimento`);
    alert('Funcionalidade de transferência será implementada em breve');
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Tem certeza que deseja deletar esta tarefa?')) return;
    
    try {
      const token = localStorage.getItem('keeptur-token');
      if (!token) return;

      const response = await fetch(`/api/monde/tarefas/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok || response.status === 204) {
        // Recarregar dados
        const tasksResponse = await fetch('/api/monde/tarefas', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).catch(() => ({ data: [] }));
        setTasks(tasksResponse?.data || []);
        
        console.log(`Tarefa ${taskId} deletada`);
      }
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };


  const renderTasksView = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Bem-vindo, {user?.name}! 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Aqui está um resumo das suas tarefas para hoje, {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card rounded-xl p-6 stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Total de Tarefas</p>
              <p className="text-white text-2xl font-bold">342</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-task-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-up-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">+15% este mês</span>
          </div>
        </div>

        <div className="card rounded-xl p-6 stats-card-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Tarefas Pendentes</p>
              <p className="text-white text-2xl font-bold">127</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-down-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">-8% este mês</span>
          </div>
        </div>

        <div className="card rounded-xl p-6 stats-card-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Tarefas Concluídas</p>
              <p className="text-white text-2xl font-bold">189</p>
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
              <p className="text-white/80 text-sm font-medium">Tarefas Atrasadas</p>
              <p className="text-white text-2xl font-bold">26</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-alarm-warning-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-up-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">+12% este mês</span>
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
                onClick={() => setActiveView('lista')}
                className={`tab-button ${activeView === 'lista' ? 'active' : ''} px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap`}
              >
                <i className="ri-list-check mr-2"></i>Lista
              </button>
              <button 
                onClick={() => setActiveView('kanban')}
                className={`tab-button ${activeView === 'kanban' ? 'active' : ''} px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap`}
              >
                <i className="ri-kanban-view mr-2"></i>Kanban
              </button>
              <button 
                onClick={() => setActiveView('calendario')}
                className={`tab-button ${activeView === 'calendario' ? 'active' : ''} px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap`}
              >
                <i className="ri-calendar-line mr-2"></i>Calendário
              </button>
            </div>
            <button 
              onClick={() => setShowTaskModal(true)}
              className="primary-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>Nova Tarefa
            </button>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Buscar tarefas..." 
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
            <div className="flex gap-2">
              <select className="form-input px-3 py-2 rounded-lg text-sm">
                <option value="">Data de:</option>
                <option value="cadastro">Cadastro</option>
                <option value="conclusao">Conclusão</option>
                <option value="vencimento">Vencimento</option>
              </select>
              <div className="flex items-center gap-2">
                <input type="date" className="form-input px-3 py-2 rounded-lg text-sm" />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>até</span>
                <input type="date" className="form-input px-3 py-2 rounded-lg text-sm" />
              </div>
            </div>
            <select className="form-input px-3 py-2 rounded-lg text-sm">
              <option value="todas">Tarefas: Todas</option>
              <option value="criadas">Criadas por Mim</option>
              <option value="minhas">Minhas Tarefas</option>
            </select>
            <select className="form-input px-3 py-2 rounded-lg text-sm">
              <option value="">Todas as Empresas</option>
              <option value="empresa1">Empresa Alpha</option>
              <option value="empresa2">Empresa Beta</option>
              <option value="empresa3">Empresa Gamma</option>
              <option value="empresa4">Empresa Delta</option>
              <option value="empresa5">Empresa Epsilon</option>
            </select>
            <select className="form-input px-3 py-2 rounded-lg text-sm">
              <option value="">Todos os Agentes</option>
              <option value="ana">Ana Marques</option>
              <option value="joao">João Silva</option>
              <option value="maria">Maria Santos</option>
              <option value="pedro">Pedro Costa</option>
            </select>
            <select className="form-input px-3 py-2 rounded-lg text-sm">
              <option value="">Todas as Categorias</option>
              <option value="reuniao">Reunião</option>
              <option value="ligacao">Ligação</option>
              <option value="email">E-mail</option>
              <option value="visita">Visita</option>
            </select>
            <select className="form-input px-3 py-2 rounded-lg text-sm">
              <option value="">Situação</option>
              <option value="not_completed">Não Concluída</option>
              <option value="completed">Concluída</option>
              <option value="deleted">Excluída</option>
            </select>
            <select className="form-input px-3 py-2 rounded-lg text-sm">
              <option value="">Todas as Prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          {/* Lista View */}
          {activeView === 'lista' && (
            <div className="view-content">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-row">
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Nº</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Cliente</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Título</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Responsável</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Data/Hora</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Status</th>
                      <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Prioridade</th>
                      <th className="text-right py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task, index) => (
                      <tr key={task.id} className="table-row">
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>#{String(task.attributes.number).padStart(3, '0')}</span>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {task.relationships?.person?.data?.id || 'Sem cliente'}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task.attributes.title}</p>
                          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{task.attributes.description || 'Sem descrição'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {task.relationships?.assignee?.data?.id || 'Sem responsável'}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            {new Date(task.attributes.due).toLocaleDateString('pt-BR')} {new Date(task.attributes.due).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.attributes.completed ? 'status-badge-completed' : 'status-badge-pending'
                          }`}>
                            {task.attributes.completed ? 'Concluída' : 'Pendente'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="priority-badge-medium px-2 py-1 rounded-full text-xs font-medium">
                            Média
                          </span>
                        </td>
                        <td className="py-4 px-4">
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
          {activeView === 'kanban' && (
            <div className="view-content">
              <div className="flex space-x-6 overflow-x-auto pb-4">
                {/* A Fazer */}
                <div className="kanban-column rounded-lg p-4 min-w-80">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>A Fazer</h3>
                    <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">8</span>
                  </div>
                  <div 
                    className="space-y-3"
                    onDrop={(e) => handleDrop(e, 'A Fazer')}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div 
                      className="kanban-card rounded-lg p-4 cursor-move"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 1, 'A Fazer')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Reunião de Planejamento</h4>
                        <span className="priority-badge-high px-2 py-1 rounded-full text-xs font-medium">Alta</span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Maria Rodrigues</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>15/07 14:30</span>
                        <div className="flex space-x-1">
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-eye-line text-xs"></i>
                          </button>
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-edit-line text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="kanban-card rounded-lg p-4 cursor-move"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 2, 'A Fazer')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Ligação de Follow-up</h4>
                        <span className="priority-badge-medium px-2 py-1 rounded-full text-xs font-medium">Média</span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>João Silva</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>16/07 09:00</span>
                        <div className="flex space-x-1">
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-eye-line text-xs"></i>
                          </button>
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-edit-line text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="primary-button w-full mt-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap">
                    <i className="ri-add-line mr-2"></i>Nova Tarefa
                  </button>
                </div>

                {/* Em Andamento */}
                <div className="kanban-column rounded-lg p-4 min-w-80">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Em Andamento</h3>
                    <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded-full text-xs">3</span>
                  </div>
                  <div 
                    className="space-y-3"
                    onDrop={(e) => handleDrop(e, 'Em Andamento')}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div 
                      className="kanban-card rounded-lg p-4 cursor-move"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 3, 'Em Andamento')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Análise de Requisitos</h4>
                        <span className="priority-badge-medium px-2 py-1 rounded-full text-xs font-medium">Média</span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Lucia Santos</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>17/07 10:00</span>
                        <div className="flex space-x-1">
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-eye-line text-xs"></i>
                          </button>
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-edit-line text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTaskModal(true)}
                    className="primary-button w-full mt-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>Nova Tarefa
                  </button>
                </div>

                {/* Concluído */}
                <div className="kanban-column rounded-lg p-4 min-w-80">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Concluído</h3>
                    <span className="bg-green-200 text-green-700 px-2 py-1 rounded-full text-xs">12</span>
                  </div>
                  <div 
                    className="space-y-3"
                    onDrop={(e) => handleDrop(e, 'Concluído')}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div 
                      className="kanban-card rounded-lg p-4 cursor-move"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 4, 'Concluído')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Envio de Proposta</h4>
                        <span className="priority-badge-low px-2 py-1 rounded-full text-xs font-medium">Baixa</span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Ana Costa</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>14/07 16:00</span>
                        <div className="flex space-x-1">
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-eye-line text-xs"></i>
                          </button>
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-edit-line text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTaskModal(true)}
                    className="primary-button w-full mt-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>Nova Tarefa
                  </button>
                </div>

                {/* Cancelado */}
                <div className="kanban-column rounded-lg p-4 min-w-80">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Cancelado</h3>
                    <span className="bg-red-200 text-red-700 px-2 py-1 rounded-full text-xs">2</span>
                  </div>
                  <div 
                    className="space-y-3"
                    onDrop={(e) => handleDrop(e, 'Cancelado')}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <div 
                      className="kanban-card rounded-lg p-4 cursor-move"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, 5, 'Cancelado')}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Reunião Cancelada</h4>
                        <span className="priority-badge-low px-2 py-1 rounded-full text-xs font-medium">Baixa</span>
                      </div>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Roberto Ferreira</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>13/07 15:00</span>
                        <div className="flex space-x-1">
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-eye-line text-xs"></i>
                          </button>
                          <button className="action-button p-1 rounded !rounded-button whitespace-nowrap">
                            <i className="ri-edit-line text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowTaskModal(true)}
                    className="primary-button w-full mt-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
                  >
                    <i className="ri-add-line mr-2"></i>Nova Tarefa
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Calendário View */}
          {activeView === 'calendario' && (
            <div className="view-content">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Julho 2025</h3>
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
                    onClick={() => setCalendarView('mes')}
                    className={`tab-button ${calendarView === 'mes' ? 'active' : ''} px-3 py-1 rounded-lg text-sm !rounded-button whitespace-nowrap`}
                  >
                    Mês
                  </button>
                  <button 
                    onClick={() => setCalendarView('semana')}
                    className={`tab-button ${calendarView === 'semana' ? 'active' : ''} px-3 py-1 rounded-lg text-sm !rounded-button whitespace-nowrap`}
                  >
                    Semana
                  </button>
                  <button 
                    onClick={() => setCalendarView('dia')}
                    className={`tab-button ${calendarView === 'dia' ? 'active' : ''} px-3 py-1 rounded-lg text-sm !rounded-button whitespace-nowrap`}
                  >
                    Dia
                  </button>
                </div>
              </div>
              {calendarView === 'mes' && (
                <div className="grid grid-cols-7 gap-1">
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Dom</div>
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Seg</div>
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ter</div>
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Qua</div>
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Qui</div>
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Sex</div>
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Sáb</div>
                  
                  {/* Dias do mês */}
                  {[...Array(31)].map((_, i) => (
                    <div key={i} className={`calendar-day rounded-lg p-2 ${i === 15 ? 'bg-blue-50' : ''}`}>
                      <div className={`text-sm font-medium mb-1 ${i === 15 ? 'text-blue-600' : ''}`} style={{ color: i === 15 ? undefined : 'var(--text-primary)' }}>
                        {i + 1}
                      </div>
                      {i === 11 && <div className="calendar-event">10:00 - Visita Técnica</div>}
                      {i === 13 && <div className="calendar-event">16:00 - Envio Proposta</div>}
                      {i === 14 && <div className="calendar-event">14:30 - Reunião</div>}
                      {i === 15 && (
                        <>
                          <div className="calendar-event">09:00 - Follow-up</div>
                          <div className="calendar-event">15:00 - Análise</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {calendarView === 'semana' && (
                <div className="grid grid-cols-8 gap-1">
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Horário
                  </div>
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: 24 }, (_, hour) => (
                    <React.Fragment key={hour}>
                      <div className="p-2 text-center text-xs border" style={{ borderColor: 'var(--border-color)' }}>
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      {Array.from({ length: 7 }, (_, day) => (
                        <div key={day} className="calendar-day p-2 text-center text-xs min-h-[40px] border" style={{ borderColor: 'var(--border-color)' }}>
                          {hour === 9 && day === 1 ? 'Reunião' : ''}
                          {hour === 14 && day === 3 ? 'Proposta' : ''}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
              )}
              
              {calendarView === 'dia' && (
                <div className="grid grid-cols-2 gap-1">
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Horário
                  </div>
                  <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Tarefas
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <React.Fragment key={hour}>
                      <div className="p-2 text-center text-xs border" style={{ borderColor: 'var(--border-color)' }}>
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      <div className="calendar-day p-2 text-center text-xs min-h-[40px] border" style={{ borderColor: 'var(--border-color)' }}>
                        {hour === 9 ? 'Reunião com cliente' : hour === 14 ? 'Desenvolver proposta' : ''}
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

  // Modal de Nova Tarefa
  const TaskModal = () => (
    <div className={`fixed inset-0 modal-overlay flex items-center justify-center z-50 ${showTaskModal ? '' : 'hidden'}`}>
      <div className="modal-content rounded-xl shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Nova Tarefa</h3>
          <button 
            onClick={() => setShowTaskModal(false)}
            className="theme-toggle p-2 rounded-lg !rounded-button whitespace-nowrap"
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>
        <div className="flex space-x-1 mb-6">
          <button className="tab-button active px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap">
            Detalhes
          </button>
          <button className="tab-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap">
            Anexos
          </button>
          <button className="tab-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap">
            Campos Personalizados
          </button>
        </div>
        <form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Título da Tarefa *
              </label>
              <input 
                type="text" 
                className="form-input w-full px-3 py-2 rounded-lg text-sm" 
                placeholder="Digite o título da tarefa"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Categoria
              </label>
              <select className="form-input w-full px-3 py-2 rounded-lg text-sm">
                <option value="todo">A Fazer</option>
                <option value="progress">Em Andamento</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Responsável
              </label>
              <select className="form-input w-full px-3 py-2 rounded-lg text-sm">
                <option value="">Selecione o responsável</option>
                <option value="ana">Ana Marques</option>
                <option value="joao">João Silva</option>
                <option value="maria">Maria Santos</option>
                <option value="pedro">Pedro Costa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Cliente
              </label>
              <select className="form-input w-full px-3 py-2 rounded-lg text-sm">
                <option value="">Selecione o cliente</option>
                <option value="maria">Maria Rodrigues</option>
                <option value="joao">João Silva</option>
                <option value="ana">Ana Costa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Prioridade
              </label>
              <select className="form-input w-full px-3 py-2 rounded-lg text-sm">
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Data de Vencimento
              </label>
              <input 
                type="datetime-local" 
                className="form-input w-full px-3 py-2 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Tipo de Tarefa
              </label>
              <select className="form-input w-full px-3 py-2 rounded-lg text-sm">
                <option value="reuniao">Reunião</option>
                <option value="ligacao">Ligação</option>
                <option value="email">E-mail</option>
                <option value="visita">Visita</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Descrição
              </label>
              <textarea 
                className="form-input w-full px-3 py-2 rounded-lg text-sm h-32"
                placeholder="Descreva os detalhes da tarefa..."
              ></textarea>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button"
              onClick={() => setShowTaskModal(false)}
              className="action-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="primary-button px-4 py-2 rounded-lg text-sm font-medium !rounded-button whitespace-nowrap"
            >
              Criar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderClientsView = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card rounded-xl p-6 stats-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Total de Clientes</p>
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
              <p className="text-white/80 text-sm font-medium">Clientes com Tarefas</p>
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
              <p className="text-white/80 text-sm font-medium">Novos Clientes (30 dias)</p>
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

      {/* Clients Table */}
      <div className="card rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Lista de Clientes
          </h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar clientes..." 
                className="search-input pl-10 pr-4 py-2 rounded-lg text-sm w-64"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <i className="ri-search-line text-gray-400"></i>
              </div>
            </div>
            <button className="action-button px-4 py-2 rounded-lg text-sm font-medium rounded-button">
              <i className="ri-filter-line mr-2"></i>
              Filtros
            </button>
            <button className="primary-button px-4 py-2 rounded-lg text-sm font-medium rounded-button">
              <i className="ri-add-line mr-2"></i>
              Novo Cliente
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-row">
                <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Cliente</th>
                <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Email</th>
                <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Telefone</th>
                <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="text-left py-3 px-4 font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id} className="table-row">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full client-avatar flex items-center justify-center text-white font-medium text-sm">
                        {client.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                          {client.nome}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {client.email}
                  </td>
                  <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {client.telefone}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs status-badge-active">
                      Ativo
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="action-button p-1 rounded">
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button className="action-button p-1 rounded">
                        <i className="ri-more-line text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} sidebar-transition fixed inset-y-0 left-0 z-50 flex flex-col`}>
        <div className="flex items-center h-16 px-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
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
            onClick={() => setActiveTab('tarefas')}
            className={`menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full ${activeTab === 'tarefas' ? 'active' : ''}`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-task-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Tarefas</span>}
            {sidebarCollapsed && <span className="tooltip">Tarefas</span>}
          </button>
          
          <button
            onClick={() => setActiveTab('clientes')}
            className={`menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full ${activeTab === 'clientes' ? 'active' : ''}`}
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-user-3-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Clientes</span>}
            {sidebarCollapsed && <span className="tooltip">Clientes</span>}
          </button>
        </nav>

        <div className="mt-auto px-3 py-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-settings-3-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Configurações</span>}
            {sidebarCollapsed && <span className="tooltip">Configurações</span>}
          </button>
          
          <button onClick={handleLogout} className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full bg-red-500 hover:bg-red-600 text-white">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-logout-box-line text-white"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3 text-white">Sair</span>}
            {sidebarCollapsed && <span className="tooltip">Sair</span>}
          </button>
          
          <button onClick={toggleSidebar} className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className={sidebarCollapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'}></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Recolher Menu</span>}
            {sidebarCollapsed && <span className="tooltip">Expandir Menu</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className={`header flex items-center justify-between h-16 px-6 content-transition`} style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          <div className="flex items-center">
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {activeTab === 'tarefas' ? 'Gestão de Tarefas' : 'Gestão de Clientes'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button onClick={toggleTheme} className="theme-toggle p-2 rounded-lg rounded-button">
              <div className="w-5 h-5 flex items-center justify-center">
                <i className={theme === 'light' ? 'ri-moon-line' : 'ri-sun-line'}></i>
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
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {user?.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
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
        <main className={`flex-1 overflow-auto content-area content-transition p-6`} style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          {activeTab === 'tarefas' ? renderTasksView() : renderClientsView()}
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
    </div>
  );
}