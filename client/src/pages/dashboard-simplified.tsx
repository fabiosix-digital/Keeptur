import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";

export default function DashboardSimplified() {
  const { user, logout } = useAuth();
  
  // ETAPA 1: UM ÚNICO ESTADO PARA TAREFAS
  const [tasks, setTasks] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    total: 0, pendentes: 0, concluidas: 0, atrasadas: 0
  });

  // ETAPA 2: UM ÚNICO MÉTODO DE CARREGAMENTO
  const loadTasks = async (filters: any = {}) => {
    try {
      setLoading(true);
      console.log('🔄 Carregando tarefas da API do Monde...');
      
      const params = new URLSearchParams();
      
      // Aplicar filtros APENAS na API, não no frontend
      if (filters.assignee) params.append('assignee', filters.assignee);
      if (filters.situation) params.append('situation', filters.situation);
      if (filters.category) params.append('category', filters.category);
      
      const token = localStorage.getItem('keeptur-token');
      const response = await fetch(`/api/monde/tarefas?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      const tasksData = data.data || [];
      setTasks(tasksData); // USAR EXATAMENTE OS DADOS DA API
      
      // CALCULAR ESTATÍSTICAS DIRETAMENTE DOS DADOS DA API
      const calculatedStats = calculateStats(tasksData);
      setStats(calculatedStats);
      
      console.log('✅ Tarefas carregadas:', tasksData.length);
      console.log('📊 Estatísticas:', calculatedStats);
      
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      setTasks([]);
      setStats({ total: 0, pendentes: 0, concluidas: 0, atrasadas: 0 });
    } finally {
      setLoading(false);
    }
  };

  // ETAPA 3: CORREÇÃO DA LÓGICA DE STATUS
  const getTaskStatus = (task: any) => {
    // USAR APENAS OS CAMPOS OFICIAIS DA API DO MONDE
    if (task.attributes?.completed === true) {
      return { status: "completed", label: "Concluída", class: "bg-green-100 text-green-800" };
    }
    
    const now = new Date();
    const dueDate = task.attributes?.due ? new Date(task.attributes.due) : null;
    
    if (dueDate && dueDate < now) {
      return { status: "overdue", label: "Atrasada", class: "bg-red-100 text-red-800" };
    }
    
    return { status: "pending", label: "Pendente", class: "bg-yellow-100 text-yellow-800" };
  };

  // ETAPA 4: CALCULAR ESTATÍSTICAS REAIS
  const calculateStats = (tasksArray: any[]) => {
    const total = tasksArray.length;
    let pendentes = 0;
    let concluidas = 0; 
    let atrasadas = 0;
    
    tasksArray.forEach(task => {
      const status = getTaskStatus(task);
      if (status.status === 'completed') concluidas++;
      else if (status.status === 'overdue') atrasadas++;
      else pendentes++;
    });
    
    return { total, pendentes, concluidas, atrasadas };
  };

  // ETAPA 5: IMPLEMENTAÇÃO DE FILTROS CORRETOS
  const handleFilterChange = (filterType: string, value: string) => {
    const newFilters = { ...filters, [filterType]: value };
    setFilters(newFilters);
    
    // RECARREGAR DA API COM NOVOS FILTROS
    loadTasks(newFilters);
  };

  // Carregamento inicial
  useEffect(() => {
    loadTasks({ assignee: 'me' }); // Filtro padrão
  }, []);

  // 3. SINCRONIZAÇÃO REAL-TIME SIMPLES
  useEffect(() => {
    const interval = setInterval(() => {
      loadTasks(filters);
    }, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando tarefas...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Keeptur Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Usuário: {user?.name || 'Não identificado'}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Total</h3>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Pendentes</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendentes}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Concluídas</h3>
            <p className="text-3xl font-bold text-green-600">{stats.concluidas}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Atrasadas</h3>
            <p className="text-3xl font-bold text-red-600">{stats.atrasadas}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleFilterChange('assignee', 'me')}
              className={`px-4 py-2 rounded ${filters.assignee === 'me' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Minhas Tarefas
            </button>
            <button
              onClick={() => handleFilterChange('situation', 'pending')}
              className={`px-4 py-2 rounded ${filters.situation === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Pendentes
            </button>
            <button
              onClick={() => handleFilterChange('situation', 'completed')}
              className={`px-4 py-2 rounded ${filters.situation === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Concluídas
            </button>
            <button
              onClick={() => loadTasks({})}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Lista de tarefas */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Tarefas ({tasks.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Nenhuma tarefa encontrada
              </div>
            ) : (
              tasks.map((task) => {
                const status = getTaskStatus(task);
                return (
                  <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {task.attributes?.title || 'Sem título'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          ID: {task.id}
                        </p>
                        <p className="text-sm text-gray-600">
                          Vencimento: {task.attributes?.due ? 
                            new Date(task.attributes.due).toLocaleDateString('pt-BR') : 
                            'Não definido'
                          }
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.class}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}