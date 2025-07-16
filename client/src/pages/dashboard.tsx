import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/hooks/use-theme";
import { Sidebar } from "@/components/ui/sidebar";
import { KanbanBoard } from "@/components/ui/kanban-board";
import { TaskModal } from "@/components/ui/task-modal";
import { ClientModal } from "@/components/ui/client-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Search, 
  Filter, 
  Plus, 
  Moon, 
  Sun, 
  ChevronDown,
  LayoutGrid,
  List,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  UserPlus,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currentView, setCurrentView] = useState<'tasks' | 'clients'>('tasks');
  const [taskView, setTaskView] = useState<'kanban' | 'list' | 'calendar'>('kanban');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const stats = {
    tasks: {
      total: 342,
      inProgress: 127,
      completed: 186,
      overdue: 29,
    },
    clients: {
      total: 1247,
      withTasks: 892,
      new: 156,
    },
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const handleTaskCreate = (taskData: any) => {
    console.log("Creating task:", taskData);
    setShowTaskModal(false);
  };

  const handleTaskEdit = (task: any) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  const handleClientView = (client: any) => {
    setSelectedClient(client);
    setShowClientModal(true);
  };

  const getPageTitle = () => {
    return currentView === 'tasks' ? 'Gestão de Tarefas' : 'Gestão de Clientes';
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header 
          className="header flex items-center justify-between h-16 px-6 content-transition"
          style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
        >
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-primary">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="theme-toggle p-2"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            
            <Button variant="ghost" size="sm" className="theme-toggle p-2 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                5
              </span>
            </Button>
            
            <div className="relative">
              <Button
                variant="ghost"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-3 p-1 theme-toggle"
              >
                <div className="w-8 h-8 rounded-full stats-card flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-primary">{user?.name || 'Usuário'}</p>
                  <p className="text-xs text-muted-foreground">{user?.role || 'Administrador'}</p>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
              
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 card rounded-lg shadow-lg py-1 z-50">
                  <button className="block w-full text-left px-4 py-2 text-sm text-secondary hover:bg-muted">
                    Meu Perfil
                  </button>
                  <button className="block w-full text-left px-4 py-2 text-sm text-secondary hover:bg-muted">
                    Configurações
                  </button>
                  <div className="border-t my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-muted"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main 
          className="flex-1 overflow-auto content-area content-transition p-6"
          style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
        >
          {currentView === 'tasks' ? (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-primary">
                  Bem-vindo, {user?.name || 'Usuário'}! 👋
                </h2>
                <p className="text-sm mt-1 text-muted-foreground">
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
                      <p className="text-white text-2xl font-bold">{stats.tasks.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <LayoutGrid className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-white/80 text-sm">+12% este mês</span>
                  </div>
                </div>

                <div className="card rounded-xl p-6 stats-card-secondary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Em Andamento</p>
                      <p className="text-white text-2xl font-bold">{stats.tasks.inProgress}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Clock className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-white/80 text-sm">+8% este mês</span>
                  </div>
                </div>

                <div className="card rounded-xl p-6 stats-card-success">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Concluídas</p>
                      <p className="text-white text-2xl font-bold">{stats.tasks.completed}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-white/80 text-sm">+23% este mês</span>
                  </div>
                </div>

                <div className="card rounded-xl p-6 stats-card-danger">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Atrasadas</p>
                      <p className="text-white text-2xl font-bold">{stats.tasks.overdue}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-white/80 text-sm">-5% este mês</span>
                  </div>
                </div>
              </div>

              {/* View Controls */}
              <div className="card rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={taskView === 'kanban' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTaskView('kanban')}
                      className="tab-button"
                    >
                      <LayoutGrid className="w-4 h-4 mr-2" />
                      Kanban
                    </Button>
                    <Button
                      variant={taskView === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTaskView('list')}
                      className="tab-button"
                    >
                      <List className="w-4 h-4 mr-2" />
                      Lista
                    </Button>
                    <Button
                      variant={taskView === 'calendar' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTaskView('calendar')}
                      className="tab-button"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Calendário
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar tarefas..."
                        className="search-input pl-10 pr-4 py-2 w-64"
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="action-button">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                    </Button>
                    <Button
                      onClick={() => setShowTaskModal(true)}
                      className="primary-button"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Tarefa
                    </Button>
                  </div>
                </div>

                {taskView === 'kanban' && (
                  <KanbanBoard onTaskEdit={handleTaskEdit} />
                )}
                {taskView === 'list' && (
                  <div className="text-center py-8 text-muted-foreground">
                    Lista de tarefas em desenvolvimento
                  </div>
                )}
                {taskView === 'calendar' && (
                  <div className="text-center py-8 text-muted-foreground">
                    Calendário em desenvolvimento
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Client Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card rounded-xl p-6 stats-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Total de Clientes</p>
                      <p className="text-white text-2xl font-bold">{stats.clients.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-white/80 text-sm">+12% este mês</span>
                  </div>
                </div>

                <div className="card rounded-xl p-6 stats-card-secondary">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Clientes com Tarefas</p>
                      <p className="text-white text-2xl font-bold">{stats.clients.withTasks}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <LayoutGrid className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-white/80 text-sm">+8% este mês</span>
                  </div>
                </div>

                <div className="card rounded-xl p-6 stats-card-success">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/80 text-sm font-medium">Novos Clientes (30 dias)</p>
                      <p className="text-white text-2xl font-bold">{stats.clients.new}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <UserPlus className="text-white text-xl" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-white/80 text-sm">+23% este mês</span>
                  </div>
                </div>
              </div>

              {/* Clients Table */}
              <div className="card rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-semibold text-primary">Lista de Clientes</h2>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar clientes..."
                        className="search-input pl-10 pr-4 py-2 w-64"
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="action-button">
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                    </Button>
                    <Button className="primary-button">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Cliente
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="table-row border-b">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Cliente</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Contato</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Responsável</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Última Tarefa</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="table-row">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full stats-card flex items-center justify-center text-white font-medium text-sm mr-3">
                              JS
                            </div>
                            <div>
                              <div className="font-medium text-sm text-primary">João Silva</div>
                              <div className="text-xs text-muted-foreground">Cliente desde 2023</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-primary">joao@email.com</div>
                          <div className="text-xs text-muted-foreground">(11) 99999-9999</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-6 h-6 rounded-full stats-card flex items-center justify-center text-white font-medium text-xs mr-2">
                              AM
                            </div>
                            <span className="text-sm text-primary">Ana Marques</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="status-badge-progress text-xs px-2 py-1 rounded-full font-medium">
                            Ativo
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-primary">Reserva de hotel</div>
                          <div className="text-xs text-muted-foreground">2 dias atrás</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClientView({ id: 1, name: 'João Silva' })}
                              className="action-button p-1"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="action-button p-1">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="action-button p-1">
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskCreate}
        task={selectedTask}
      />

      <ClientModal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />

      {/* Click outside to close dropdown */}
      {showUserDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserDropdown(false)}
        />
      )}
    </div>
  );
}
