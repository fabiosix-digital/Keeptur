import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { useTheme } from "../hooks/use-theme";
import logoFull from "@assets/LOGO Lilas_1752695672079.png";
import logoIcon from "@assets/ico Lilas_1752695703171.png";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("perfil");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      const response = await fetch('/api/google/auth', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔗 Redirecionando para:', data.authUrl);
        window.location.href = data.authUrl;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao obter URL de autorização');
      }
      
    } catch (error) {
      console.error('Erro ao conectar Google Calendar:', error);
      setLoading(false);
      
      let errorMessage = 'Erro ao conectar Google Calendar';
      if (error.message && error.message.includes('não configurado')) {
        errorMessage = 'Google OAuth não configurado. Entre em contato com o administrador.';
      }
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50 max-w-md';
      toast.textContent = `❌ ${errorMessage}`;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 5000);
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

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const renderPerfilTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4" style={{ color: "var(--text-primary)" }}>
          Informações Pessoais
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Nome
            </label>
            <input
              type="text"
              value={user?.name || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              style={{ 
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)"
              }}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              style={{ 
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)"
              }}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Função
            </label>
            <input
              type="text"
              value={user?.role || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              style={{ 
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)"
              }}
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
        <h3 className="text-lg font-medium mb-4" style={{ color: "var(--text-primary)" }}>
          Integrações Externas
        </h3>
        
        <div 
          className="border rounded-lg p-6"
          style={{ 
            borderColor: "var(--border-color)",
            backgroundColor: "var(--bg-secondary)"
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="ri-calendar-line text-blue-600 text-xl"></i>
              </div>
              <div>
                <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>
                  Google Calendar
                </h4>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Sincronize suas tarefas com o Google Calendar
                </p>
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
              <div 
                className="border rounded-lg p-4"
                style={{ 
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  borderColor: "rgba(59, 130, 246, 0.3)"
                }}
              >
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
              
              <div 
                className="text-xs border rounded-lg p-3 mt-4"
                style={{ 
                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                  borderColor: "rgba(245, 158, 11, 0.3)",
                  color: "var(--text-secondary)"
                }}
              >
                <p className="font-medium text-amber-800 mb-1">⚠️ Configuração necessária</p>
                <p className="text-amber-700">
                  Para usar a integração com Google Calendar, é necessário configurar as credenciais OAuth2 do Google no servidor.
                  Entre em contato com o administrador do sistema se a conexão falhar.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ backgroundColor: "var(--bg-primary)" }}
              >
                <div>
                  <h5 className="font-medium" style={{ color: "var(--text-primary)" }}>
                    Sincronização Automática
                  </h5>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Manter tarefas sincronizadas automaticamente
                  </p>
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
        <h3 className="text-lg font-medium mb-4" style={{ color: "var(--text-primary)" }}>
          Preferências de Notificação
        </h3>
        
        <div className="space-y-4">
          <div 
            className="flex items-center justify-between p-4 border rounded-lg"
            style={{ 
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-secondary)"
            }}
          >
            <div>
              <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>
                Email de notificações
              </h4>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Receber notificações por email sobre tarefas
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div 
            className="flex items-center justify-between p-4 border rounded-lg"
            style={{ 
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-secondary)"
            }}
          >
            <div>
              <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>
                Notificações push
              </h4>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Receber notificações no navegador
              </p>
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
        <h3 className="text-lg font-medium mb-4" style={{ color: "var(--text-primary)" }}>
          Segurança
        </h3>
        
        <div className="space-y-4">
          <div 
            className="border rounded-lg p-4"
            style={{ 
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-secondary)"
            }}
          >
            <h4 className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              Alterar Senha
            </h4>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              As alterações de senha devem ser feitas no sistema Monde
            </p>
            <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              Acessar Monde
            </button>
          </div>
          
          <div 
            className="border rounded-lg p-4"
            style={{ 
              borderColor: "var(--border-color)",
              backgroundColor: "var(--bg-secondary)"
            }}
          >
            <h4 className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>
              Sessões Ativas
            </h4>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Gerencie suas sessões ativas no Keeptur
            </p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
              Encerrar Todas as Sessões
            </button>
          </div>
        </div>
      </div>
    </div>
  );

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
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center"
          >
            {sidebarCollapsed ? (
              <img src={logoIcon} alt="Keeptur" className="w-6 h-6" />
            ) : (
              <img src={logoFull} alt="Keeptur" className="h-8" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setLocation("/dashboard")}
            className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-task-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Tarefas</span>}
            {sidebarCollapsed && <span className="tooltip">Tarefas</span>}
          </button>

          <button
            onClick={() => setLocation("/clientes")}
            className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-user-3-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Clientes</span>}
            {sidebarCollapsed && <span className="tooltip">Clientes</span>}
          </button>

          <button
            className="menu-item active flex items-center px-3 py-2.5 text-sm font-medium w-full"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-settings-3-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Configurações</span>}
            {sidebarCollapsed && <span className="tooltip">Configurações</span>}
          </button>
        </nav>

        <div
          className="mt-auto px-3 py-4 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
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
        </div>
      </aside>

      {/* Main Content */}
      <div className={`main-content flex flex-col flex-1 overflow-hidden ${sidebarCollapsed ? "ml-16" : "ml-64"} transition-all duration-300 ease-in-out`}>
        <header
          className="header-bar flex items-center justify-between h-16 px-6 border-b"
          style={{ 
            backgroundColor: "var(--header-bg)",
            borderColor: "var(--border-color)"
          }}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
              style={{ color: "var(--text-primary)" }}
            >
              <i className="ri-menu-line text-lg"></i>
            </button>
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Configurações
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 rounded-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              <i className={`ri-${theme === 'dark' ? 'sun' : 'moon'}-line text-lg`}></i>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:space-x-8">
              {/* Settings Navigation */}
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

              {/* Settings Content */}
              <div className="flex-1">
                <div 
                  className="bg-white rounded-lg border p-6"
                  style={{ 
                    backgroundColor: "var(--bg-primary)",
                    borderColor: "var(--border-color)"
                  }}
                >
                  {activeTab === "perfil" && renderPerfilTab()}
                  {activeTab === "conexoes" && renderConexoesTab()}
                  {activeTab === "notificacoes" && renderNotificacoesTab()}
                  {activeTab === "seguranca" && renderSegurancaTab()}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}