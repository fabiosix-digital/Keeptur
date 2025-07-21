import { useState, useEffect } from "react";
import { useLocation } from "wouter";

export default function Settings() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("perfil");
  const [user, setUser] = useState<any>(null);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Carregar dados do usuário
    const userData = localStorage.getItem('keeptur-user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Verificar status de conexão do Google
    checkGoogleConnection();
  }, []);

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch('/api/google/status', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoogleConnected(data.connected);
        setGoogleEmail(data.email || '');
        setSyncEnabled(data.syncEnabled || false);
      }
    } catch (error) {
      console.error('Erro ao verificar conexão Google:', error);
    }
  };

  const connectGoogleCalendar = async () => {
    setLoading(true);
    try {
      // Obter URL de autorização do servidor
      const response = await fetch('/api/google/auth', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Redirecionar para a página de autorização do Google
        window.location.href = data.authUrl;
      } else {
        throw new Error('Erro ao obter URL de autorização');
      }
      
    } catch (error) {
      console.error('Erro ao conectar Google Calendar:', error);
      setLoading(false);
      
      // Mostrar toast de erro
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
      toast.textContent = '❌ Erro ao conectar Google Calendar';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    }
  };

  const disconnectGoogleCalendar = async () => {
    try {
      const response = await fetch('/api/google/disconnect', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
      });
      
      if (response.ok) {
        setGoogleConnected(false);
        setGoogleEmail('');
        setSyncEnabled(false);
      }
    } catch (error) {
      console.error('Erro ao desconectar Google Calendar:', error);
    }
  };

  const syncAllTasks = async () => {
    if (!googleConnected) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/google/sync-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
      });

      if (response.ok) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        toast.textContent = '✅ Tarefas sincronizadas com Google Calendar!';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPerfilTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Informações Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome</label>
            <input
              type="text"
              value={user?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Função</label>
            <input
              type="text"
              value={user?.role || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderConexoesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Integrações Externas</h3>
        
        {/* Google Calendar */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-calendar-line text-blue-600 text-xl"></i>
              </div>
              <div>
                <h4 className="font-medium">Google Calendar</h4>
                <p className="text-sm text-gray-600">Sincronize suas tarefas com o Google Calendar</p>
                {googleConnected && (
                  <p className="text-xs text-green-600 mt-1">Conectado como: {googleEmail}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {googleConnected && (
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              )}
              <span className={`text-sm font-medium ${googleConnected ? 'text-green-600' : 'text-gray-400'}`}>
                {googleConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          
          {!googleConnected ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 mb-2">Recursos disponíveis:</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Criação automática de eventos no Google Calendar</li>
                  <li>• Sincronização bidirecional (Keeptur ↔ Google)</li>
                  <li>• Atualização automática de horários e datas</li>
                  <li>• Notificações do Google Calendar</li>
                </ul>
              </div>
              
              <button
                onClick={connectGoogleCalendar}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <i className="ri-loader-4-line animate-spin"></i>
                ) : (
                  <i className="ri-google-line"></i>
                )}
                <span>{loading ? 'Conectando...' : 'Conectar Google Calendar'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h5 className="font-medium">Sincronização Automática</h5>
                  <p className="text-sm text-gray-600">Manter tarefas sincronizadas automaticamente</p>
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
              
              <div className="flex space-x-3">
                <button
                  onClick={syncAllTasks}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Sincronizando...' : 'Sincronizar Agora'}
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
  );

  const renderNotificacoesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Preferências de Notificação</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium">Email de notificações</h4>
              <p className="text-sm text-gray-600">Receber notificações por email sobre tarefas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-medium">Notificações push</h4>
              <p className="text-sm text-gray-600">Receber notificações no navegador</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSegurancaTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Segurança</h3>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Alterar Senha</h4>
            <p className="text-sm text-gray-600 mb-4">As alterações de senha devem ser feitas no sistema Monde</p>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Acessar Monde
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium mb-2">Sessões Ativas</h4>
            <p className="text-sm text-gray-600 mb-4">Gerencie suas sessões ativas no Keeptur</p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Encerrar Todas as Sessões
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div
        className={`sidebar ${sidebarCollapsed ? "collapsed" : ""}`}
        style={{
          backgroundColor: "var(--sidebar-bg)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header com logo */}
        <div
          className="px-4 py-6 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center text-lg font-semibold"
            style={{ color: "var(--logo-color)" }}
          >
            {sidebarCollapsed ? (
              <div className="w-8 h-8 flex items-center justify-center">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 200 100"
                  fill="currentColor"
                  className="keeptur-logo-icon"
                >
                  <rect x="20" y="30" width="160" height="40" rx="20" />
                </svg>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <svg
                  width="40"
                  height="20"
                  viewBox="0 0 200 100"
                  fill="currentColor"
                  className="keeptur-logo-full"
                >
                  <rect x="20" y="30" width="160" height="40" rx="20" />
                </svg>
                <span>Keeptur</span>
              </div>
            )}
          </button>
        </div>

        {/* Menu principal */}
        <div className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            <button
              onClick={() => setLocation("/dashboard")}
              className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-dashboard-3-line"></i>
              </div>
              {!sidebarCollapsed && <span className="ml-3">Tarefas</span>}
            </button>

            <button
              onClick={() => setLocation("/clientes")}
              className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-user-3-line"></i>
              </div>
              {!sidebarCollapsed && <span className="ml-3">Clientes</span>}
            </button>

            <button
              className="menu-item active flex items-center px-3 py-2.5 text-sm font-medium w-full"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className="ri-settings-3-line"></i>
              </div>
              {!sidebarCollapsed && <span className="ml-3">Configurações</span>}
            </button>
          </nav>
        </div>

        {/* Footer do sidebar */}
        <div
          className="mt-auto px-3 py-4 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-user-line"></i>
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <div className="text-xs font-medium truncate">
                  {user?.name || "Usuário"}
                </div>
                <div className="text-xs opacity-75 truncate">
                  {user?.email || ""}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div
          className="header"
          style={{
            backgroundColor: "var(--header-bg)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                Configurações
              </h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content-area p-6">
          <div className="flex flex-col lg:flex-row lg:space-x-8">
            {/* Tabs Sidebar */}
            <div className="lg:w-64 mb-8 lg:mb-0">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("perfil")}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                    activeTab === "perfil" 
                      ? "bg-blue-100 text-blue-700 border-blue-200" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <i className="ri-user-line"></i>
                  <span>Perfil</span>
                </button>
                
                <button
                  onClick={() => setActiveTab("conexoes")}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                    activeTab === "conexoes" 
                      ? "bg-blue-100 text-blue-700 border-blue-200" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <i className="ri-links-line"></i>
                  <span>Conexões</span>
                  {googleConnected && (
                    <span className="w-2 h-2 bg-green-500 rounded-full ml-auto"></span>
                  )}
                </button>
                
                <button
                  onClick={() => setActiveTab("notificacoes")}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                    activeTab === "notificacoes" 
                      ? "bg-blue-100 text-blue-700 border-blue-200" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <i className="ri-notification-line"></i>
                  <span>Notificações</span>
                </button>
                
                <button
                  onClick={() => setActiveTab("seguranca")}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left ${
                    activeTab === "seguranca" 
                      ? "bg-blue-100 text-blue-700 border-blue-200" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <i className="ri-shield-line"></i>
                  <span>Segurança</span>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {activeTab === "perfil" && renderPerfilTab()}
                {activeTab === "conexoes" && renderConexoesTab()}
                {activeTab === "notificacoes" && renderNotificacoesTab()}
                {activeTab === "seguranca" && renderSegurancaTab()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}