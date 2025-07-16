import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { MondeAPI } from '../lib/monde-api';
import { useTheme } from '../hooks/use-theme';
import logoFull from '@assets/LOGO Lilas_1752695672079.png';
import logoIcon from '@assets/ico Lilas_1752695703171.png';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('tarefas');
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aplicar tema no body
    document.body.className = 'theme-transition';
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Carregar dados da API do Monde
        // Por enquanto, dados estáticos para demonstração
        setTasks([
          { id: 1, titulo: 'Reserva de hotel', status: 'pendente', prioridade: 'alta', cliente: 'João Silva' },
          { id: 2, titulo: 'Passagem aérea', status: 'progresso', prioridade: 'média', cliente: 'Maria Santos' },
          { id: 3, titulo: 'Seguro viagem', status: 'concluida', prioridade: 'baixa', cliente: 'Pedro Costa' },
        ]);
        setClients([
          { id: 1, nome: 'João Silva', email: 'joao@email.com', telefone: '(11) 99999-9999' },
          { id: 2, nome: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 88888-8888' },
          { id: 3, nome: 'Pedro Costa', email: 'pedro@email.com', telefone: '(11) 77777-7777' },
        ]);
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
            <span className="text-white/80 text-sm ml-1">+12% este mês</span>
          </div>
        </div>

        <div className="card rounded-xl p-6 stats-card-secondary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Em Andamento</p>
              <p className="text-white text-2xl font-bold">28</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-loader-4-line text-white text-xl"></i>
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
              <p className="text-white/80 text-sm font-medium">Concluídas</p>
              <p className="text-white text-2xl font-bold">156</p>
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
              <p className="text-white/80 text-sm font-medium">Atrasadas</p>
              <p className="text-white text-2xl font-bold">12</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <i className="ri-time-line text-white text-xl"></i>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <i className="ri-arrow-down-line text-white/80 text-sm"></i>
            <span className="text-white/80 text-sm ml-1">-5% este mês</span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="card rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Quadro Kanban
          </h2>
          <div className="flex items-center space-x-3">
            <button className="action-button px-4 py-2 rounded-lg text-sm font-medium rounded-button">
              <i className="ri-filter-line mr-2"></i>
              Filtros
            </button>
            <button className="primary-button px-4 py-2 rounded-lg text-sm font-medium rounded-button">
              <i className="ri-add-line mr-2"></i>
              Nova Tarefa
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Pendentes */}
          <div className="kanban-column rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Pendentes
              </h3>
              <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">8</span>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.status === 'pendente').map(task => (
                <div key={task.id} className="kanban-card rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    {task.titulo}
                  </h4>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {task.cliente}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs priority-badge-${task.prioridade}`}>
                      {task.prioridade}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <i className="ri-edit-line text-xs"></i>
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <i className="ri-more-line text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Em Progresso */}
          <div className="kanban-column rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Em Progresso
              </h3>
              <span className="bg-blue-200 text-blue-600 px-2 py-1 rounded-full text-xs">3</span>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.status === 'progresso').map(task => (
                <div key={task.id} className="kanban-card rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    {task.titulo}
                  </h4>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {task.cliente}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs priority-badge-${task.prioridade}`}>
                      {task.prioridade}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <i className="ri-edit-line text-xs"></i>
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <i className="ri-more-line text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revisão */}
          <div className="kanban-column rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Revisão
              </h3>
              <span className="bg-yellow-200 text-yellow-600 px-2 py-1 rounded-full text-xs">2</span>
            </div>
            <div className="space-y-3">
              {/* Placeholder para tarefas em revisão */}
            </div>
          </div>

          {/* Concluídas */}
          <div className="kanban-column rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                Concluídas
              </h3>
              <span className="bg-green-200 text-green-600 px-2 py-1 rounded-full text-xs">15</span>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => t.status === 'concluida').map(task => (
                <div key={task.id} className="kanban-card rounded-lg p-4">
                  <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
                    {task.titulo}
                  </h4>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                    {task.cliente}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs priority-badge-${task.prioridade}`}>
                      {task.prioridade}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <i className="ri-edit-line text-xs"></i>
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
                        <i className="ri-more-line text-xs"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
            <div className="font-display text-primary text-xl">
              {sidebarCollapsed ? 'K' : 'Keeptur'}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-2 font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Monde
              </div>
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
              <i className="ri-logout-box-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Sair</span>}
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
      <button className="floating-button">
        <i className="ri-add-line text-xl"></i>
      </button>
    </div>
  );
}