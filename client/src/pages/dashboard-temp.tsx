import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useLocation } from 'wouter';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState('tasks');
  const [activeView, setActiveView] = useState('lista');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<any>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingClients, setSearchingClients] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [calendarView, setCalendarView] = useState('mes');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('keeptur-token');
      
      if (!token) {
        setLocation('/login');
        return;
      }

      // Carregar tarefas
      const tasksResponse = await fetch('/api/monde/tarefas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.data || []);
      }

      // Carregar estatísticas
      const statsResponse = await fetch('/api/monde/tarefas/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleViewTask = (task: any) => {
    setSelectedTaskDetails(task);
    setShowTaskDetails(true);
    loadTaskHistory(task.id);
  };

  const loadTaskHistory = async (taskId: string) => {
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem('keeptur-token');
      
      const response = await fetch(`/api/monde/task-historics?filter[task_id]=${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTaskHistory(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    if (!showCompletedTasks) {
      filtered = filtered.filter((task: any) => !task.attributes.completed);
    } else {
      filtered = filtered.filter((task: any) => task.attributes.completed);
    }

    if (taskFilter !== 'all') {
      const userEmail = user?.email || '';
      filtered = filtered.filter((task: any) => {
        switch (taskFilter) {
          case 'created_by_me':
            return task.relationships?.author?.data?.attributes?.email === userEmail;
          case 'assigned_to_me':
            return task.relationships?.assignee?.data?.attributes?.email === userEmail;
          default:
            return true;
        }
      });
    }

    if (sortBy) {
      filtered = [...filtered].sort((a: any, b: any) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'id':
            aValue = a.attributes.number;
            bValue = b.attributes.number;
            break;
          case 'title':
            aValue = a.attributes.title;
            bValue = b.attributes.title;
            break;
          case 'person':
            aValue = a.relationships?.person?.data?.attributes?.name || '';
            bValue = b.relationships?.person?.data?.attributes?.name || '';
            break;
          case 'assignee':
            aValue = a.relationships?.assignee?.data?.attributes?.name || '';
            bValue = b.relationships?.assignee?.data?.attributes?.name || '';
            break;
          case 'due':
            aValue = new Date(a.attributes.due);
            bValue = new Date(b.attributes.due);
            break;
          case 'completed':
            aValue = a.attributes.completed;
            bValue = b.attributes.completed;
            break;
          default:
            return 0;
        }
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }

    return filtered;
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sair
          </button>
        </div>

        {/* Nav */}
        <div className="flex space-x-4 mb-6">
          <button 
            onClick={() => setCurrentPage('tasks')}
            className={`px-4 py-2 rounded ${currentPage === 'tasks' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Tarefas
          </button>
          <button 
            onClick={() => setCurrentPage('clients')}
            className={`px-4 py-2 rounded ${currentPage === 'clients' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Clientes
          </button>
        </div>

        {/* Tasks Page */}
        {currentPage === 'tasks' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Total de Tarefas</h3>
                <p className="text-2xl font-bold text-blue-600">{(stats as any).total || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Pendentes</h3>
                <p className="text-2xl font-bold text-yellow-600">{(stats as any).pendentes || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Concluídas</h3>
                <p className="text-2xl font-bold text-green-600">{(stats as any).concluidas || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-2">Atrasadas</h3>
                <p className="text-2xl font-bold text-red-600">{(stats as any).atrasadas || 0}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestão de Tarefas</h2>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Nova Tarefa
                </button>
              </div>

              {/* Views */}
              <div className="flex space-x-2 mb-4">
                <button 
                  onClick={() => setActiveView('lista')}
                  className={`px-4 py-2 rounded ${activeView === 'lista' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Lista
                </button>
                <button 
                  onClick={() => setActiveView('kanban')}
                  className={`px-4 py-2 rounded ${activeView === 'kanban' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Kanban
                </button>
                <button 
                  onClick={() => setActiveView('calendario')}
                  className={`px-4 py-2 rounded ${activeView === 'calendario' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  Calendário
                </button>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="taskStatus" 
                      checked={!showCompletedTasks}
                      onChange={() => setShowCompletedTasks(false)}
                    />
                    <span>Tarefas Abertas</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="taskStatus" 
                      checked={showCompletedTasks}
                      onChange={() => setShowCompletedTasks(true)}
                    />
                    <span>Tarefas Concluídas</span>
                  </label>
                </div>
                
                <select 
                  value={taskFilter}
                  onChange={(e) => setTaskFilter(e.target.value)}
                  className="px-3 py-2 border rounded"
                >
                  <option value="all">Todos os Filtros</option>
                  <option value="created_by_me">Criadas por mim</option>
                  <option value="assigned_to_me">Atribuídas a mim</option>
                </select>
              </div>

              {/* Lista View */}
              {activeView === 'lista' && (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th 
                          className="border p-2 text-left cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort('id')}
                        >
                          Nº {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="border p-2 text-left cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort('person')}
                        >
                          Cliente {sortBy === 'person' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="border p-2 text-left cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort('title')}
                        >
                          Título {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="border p-2 text-left cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort('assignee')}
                        >
                          Responsável {sortBy === 'assignee' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="border p-2 text-left cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort('due')}
                        >
                          Vencimento {sortBy === 'due' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="border p-2 text-left cursor-pointer hover:bg-gray-200"
                          onClick={() => handleSort('completed')}
                        >
                          Status {sortBy === 'completed' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="border p-2 text-left">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredTasks().map((task: any) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="border p-2">#{String(task.attributes.number).padStart(3, '0')}</td>
                          <td className="border p-2">{task.relationships?.person?.data?.attributes?.name || 'Sem cliente'}</td>
                          <td className="border p-2">{task.attributes.title}</td>
                          <td className="border p-2">{task.relationships?.assignee?.data?.attributes?.name || 'Sem responsável'}</td>
                          <td className="border p-2">
                            {new Date(task.attributes.due).toLocaleDateString('pt-BR')} {new Date(task.attributes.due).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                          </td>
                          <td className="border p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              task.attributes.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {task.attributes.completed ? 'Concluída' : 'Pendente'}
                            </span>
                          </td>
                          <td className="border p-2">
                            <button 
                              onClick={() => handleViewTask(task)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 mr-2"
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Kanban View */}
              {activeView === 'kanban' && (
                <div className="flex space-x-4 overflow-x-auto">
                  <div className="bg-gray-100 p-4 rounded min-w-64">
                    <h3 className="font-semibold mb-4">A Fazer ({getFilteredTasks().filter(task => !task.attributes.completed).length})</h3>
                    <div className="space-y-2">
                      {getFilteredTasks().filter(task => !task.attributes.completed).map((task: any) => (
                        <div key={task.id} className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md" onClick={() => handleViewTask(task)}>
                          <h4 className="font-medium">{task.attributes.title}</h4>
                          <p className="text-sm text-gray-600">{task.relationships?.person?.data?.attributes?.name || 'Sem cliente'}</p>
                          <p className="text-xs text-gray-500">{new Date(task.attributes.due).toLocaleDateString('pt-BR')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-gray-100 p-4 rounded min-w-64">
                    <h3 className="font-semibold mb-4">Concluído ({getFilteredTasks().filter(task => task.attributes.completed).length})</h3>
                    <div className="space-y-2">
                      {getFilteredTasks().filter(task => task.attributes.completed).map((task: any) => (
                        <div key={task.id} className="bg-white p-3 rounded shadow cursor-pointer hover:shadow-md opacity-75" onClick={() => handleViewTask(task)}>
                          <h4 className="font-medium">{task.attributes.title}</h4>
                          <p className="text-sm text-gray-600">{task.relationships?.person?.data?.attributes?.name || 'Sem cliente'}</p>
                          <p className="text-xs text-gray-500">{new Date(task.attributes.due).toLocaleDateString('pt-BR')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Calendário View */}
              {activeView === 'calendario' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Calendário de Tarefas</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => setCalendarView('mes')}
                        className={`px-3 py-1 rounded ${calendarView === 'mes' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Mês
                      </button>
                      <button 
                        onClick={() => setCalendarView('semana')}
                        className={`px-3 py-1 rounded ${calendarView === 'semana' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                      >
                        Semana
                      </button>
                    </div>
                  </div>
                  
                  {calendarView === 'mes' && (
                    <div className="grid grid-cols-7 gap-1">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="p-2 text-center font-medium bg-gray-100">{day}</div>
                      ))}
                      {Array.from({ length: 35 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - date.getDay() + i);
                        const tasksForDay = getFilteredTasks().filter(task => {
                          const taskDate = new Date(task.attributes.due);
                          return taskDate.toDateString() === date.toDateString();
                        });
                        
                        return (
                          <div key={i} className="border p-2 h-24 overflow-y-auto">
                            <div className="font-medium text-sm mb-1">{date.getDate()}</div>
                            {tasksForDay.map(task => (
                              <div 
                                key={task.id} 
                                className="text-xs bg-blue-100 p-1 rounded mb-1 cursor-pointer hover:bg-blue-200"
                                onClick={() => handleViewTask(task)}
                              >
                                {task.attributes.title}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {calendarView === 'semana' && (
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 7 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() - date.getDay() + i);
                        const tasksForDay = getFilteredTasks().filter(task => {
                          const taskDate = new Date(task.attributes.due);
                          return taskDate.toDateString() === date.toDateString();
                        });
                        
                        return (
                          <div key={i} className="border p-2">
                            <div className="text-center font-medium mb-2">
                              {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                            </div>
                            {tasksForDay.map(task => (
                              <div 
                                key={task.id} 
                                className="text-xs bg-blue-100 p-1 rounded mb-1 cursor-pointer hover:bg-blue-200"
                                onClick={() => handleViewTask(task)}
                              >
                                {task.attributes.title}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clients Page */}
        {currentPage === 'clients' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Clientes</h2>
            <p className="text-gray-600">Funcionalidade de clientes em desenvolvimento...</p>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {showTaskDetails && selectedTaskDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                #{String(selectedTaskDetails.attributes.number).padStart(3, '0')} - {selectedTaskDetails.attributes.title}
              </h2>
              <button 
                onClick={() => setShowTaskDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Informações da Tarefa</h3>
                <div className="space-y-2">
                  <p><strong>Cliente:</strong> {selectedTaskDetails.relationships?.person?.data?.attributes?.name || 'Sem cliente'}</p>
                  <p><strong>Responsável:</strong> {selectedTaskDetails.relationships?.assignee?.data?.attributes?.name || 'Sem responsável'}</p>
                  <p><strong>Vencimento:</strong> {new Date(selectedTaskDetails.attributes.due).toLocaleDateString('pt-BR')} às {new Date(selectedTaskDetails.attributes.due).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                  <p><strong>Status:</strong> {selectedTaskDetails.attributes.completed ? 'Concluída' : 'Pendente'}</p>
                  <p><strong>Descrição:</strong> {selectedTaskDetails.attributes.description || 'Sem descrição'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Histórico da Tarefa</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {loadingHistory ? (
                    <p>Carregando histórico...</p>
                  ) : taskHistory.length === 0 ? (
                    <p className="text-gray-500">Nenhum histórico encontrado</p>
                  ) : (
                    taskHistory.map((history, index) => (
                      <div key={index} className="border rounded p-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{history.attributes.action || 'Ação'}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(history.attributes.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{history.attributes.description || 'Sem descrição'}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Nova Tarefa</h2>
              <button 
                onClick={() => setShowTaskModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título da Tarefa</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Ex: Reunião com cliente"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cliente</label>
                  <select className="w-full px-3 py-2 border rounded">
                    <option value="">Selecione o cliente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Data de Vencimento</label>
                  <input 
                    type="datetime-local" 
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea 
                  className="w-full px-3 py-2 border rounded h-24"
                  placeholder="Descreva os detalhes da tarefa..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Criar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}