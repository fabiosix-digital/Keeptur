import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../lib/auth";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTab, setCurrentTab] = useState("profile");
  const [darkMode, setDarkMode] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkGoogleConnection();
    
    // Verificar se retornou do OAuth com sucesso
    const urlParams = new URLSearchParams(window.location.search);
    const googleStatus = urlParams.get('google');
    const error = urlParams.get('error');
    
    if (googleStatus === 'connected') {
      setGoogleConnected(true);
      showToast('✅ Google Calendar conectado com sucesso!', 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      let errorMessage = 'Erro na conexão com Google';
      if (error === 'oauth_cancelled') {
        errorMessage = 'Conexão cancelada pelo usuário';
      } else if (error === 'oauth_failed') {
        errorMessage = 'Falha na autenticação OAuth';
      }
      showToast(`❌ ${errorMessage}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 text-white px-4 py-2 rounded shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), type === 'error' ? 5000 : 3000);
  };

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
      showToast('❌ Erro ao conectar Google Calendar', 'error');
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', !darkMode ? 'dark' : 'light');
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'profile':
        return (
          <div className="card rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 flex items-center justify-center">
                <i className="ri-user-3-line text-xl text-primary"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Informações do Perfil
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Suas informações pessoais e de conta
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Nome
                  </label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    className="form-input w-full px-3 py-2 rounded-lg"
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
                    className="form-input w-full px-3 py-2 rounded-lg"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Função
                  </label>
                  <input
                    type="text"
                    value={user?.role || 'Usuário'}
                    className="form-input w-full px-3 py-2 rounded-lg"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={user?.empresa || 'Não informado'}
                    className="form-input w-full px-3 py-2 rounded-lg"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'connections':
        return (
          <div className="card rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 flex items-center justify-center">
                <i className="ri-links-line text-xl text-primary"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Integrações Externas
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Conecte suas ferramentas favoritas
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border rounded-lg p-6" style={{ borderColor: "var(--border-color)" }}>
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
                  <div className={`connection-status ${googleConnected ? 'connected' : 'disconnected'}`}>
                    <div className="connection-status-dot"></div>
                    <span>{googleConnected ? 'Conectado' : 'Desconectado'}</span>
                  </div>
                </div>

                {!googleConnected ? (
                  <div className="space-y-4">
                    <div className="info-box">
                      <h5 className="font-medium text-blue-800 mb-2">Recursos disponíveis:</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>Criação automática de eventos no Google Calendar</li>
                        <li>Sincronização bidirecional (Keeptur ↔ Google)</li>
                        <li>Atualização automática de horários e datas</li>
                        <li>Notificações do Google Calendar</li>
                      </ul>
                    </div>
                    
                    <button
                      onClick={connectGoogleCalendar}
                      disabled={loading}
                      className="google-button px-6 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      {loading ? (
                        <i className="ri-loader-4-line animate-spin"></i>
                      ) : (
                        <i className="ri-google-line"></i>
                      )}
                      <span>{loading ? 'Conectando...' : 'Conectar Google Calendar'}</span>
                    </button>
                    
                    <div className="text-xs border rounded-lg p-3 bg-amber-50 border-amber-200">
                      <p className="font-medium text-amber-800 mb-1">⚠️ Configuração necessária</p>
                      <p className="text-amber-700 mb-2">
                        Para usar a integração com Google Calendar, certifique-se de que o redirect URI está configurado:
                      </p>
                      <p className="font-mono text-xs bg-amber-100 p-1 rounded">
                        https://keeptur.replit.app/auth/google/callback
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <h5 className="font-medium text-green-800">Sincronização Ativa</h5>
                        <p className="text-sm text-green-600">Suas tarefas estão sendo sincronizadas automaticamente</p>
                      </div>
                      <div className="switch">
                        <input 
                          type="checkbox" 
                          checked={syncEnabled}
                          onChange={(e) => setSyncEnabled(e.target.checked)}
                        />
                        <span className="slider"></span>
                      </div>
                    </div>
                    
                    <button 
                      className="action-button w-full py-2 px-4 rounded-lg font-medium"
                      onClick={() => setGoogleConnected(false)}
                    >
                      Desconectar Google Calendar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="card rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 flex items-center justify-center">
                <i className="ri-notification-3-line text-xl text-primary"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Preferências de Notificação
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Gerencie como você recebe notificações
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: "var(--border-color)" }}>
                <div>
                  <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>Email de notificações</h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Receber notificações por email sobre tarefas</p>
                </div>
                <div className="switch">
                  <input type="checkbox" />
                  <span className="slider"></span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: "var(--border-color)" }}>
                <div>
                  <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>Notificações push</h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Receber notificações no navegador</p>
                </div>
                <div className="switch">
                  <input type="checkbox" />
                  <span className="slider"></span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="card rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 flex items-center justify-center">
                <i className="ri-palette-line text-xl text-primary"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Aparência
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Personalize a aparência da aplicação
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: "var(--border-color)" }}>
                <div>
                  <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>Modo escuro</h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Alternar entre tema claro e escuro</p>
                </div>
                <div className="switch">
                  <input 
                    type="checkbox" 
                    checked={darkMode}
                    onChange={toggleTheme}
                  />
                  <span className="slider"></span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="card rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 flex items-center justify-center">
                <i className="ri-shield-check-line text-xl text-primary"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Segurança
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Configurações de segurança da conta
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg" style={{ borderColor: "var(--border-color)" }}>
                <h4 className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>Sessão</h4>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  Gerencie suas sessões ativas
                </p>
                <button 
                  onClick={handleLogout}
                  className="action-button px-4 py-2 rounded-lg font-medium"
                >
                  Encerrar todas as sessões
                </button>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="card rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 flex items-center justify-center">
                <i className="ri-database-2-line text-xl text-primary"></i>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  Dados e Privacidade
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Controle seus dados pessoais
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg" style={{ borderColor: "var(--border-color)" }}>
                <h4 className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>Coleta de dados</h4>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Seus dados são utilizados exclusivamente para o funcionamento da plataforma, conforme nossa política de privacidade.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden theme-transition">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} sidebar-transition fixed inset-y-0 left-0 z-50 flex flex-col`}>
        <div className="flex items-center h-16 px-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center">
            <div className="font-['Pacifico'] text-primary text-xl">K</div>
            {!sidebarCollapsed && (
              <div className="ml-2 font-bold text-lg" style={{ color: "var(--text-primary)" }}>
                Keeptur
              </div>
            )}
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <a 
            href="/dashboard"
            className="menu-item flex items-center px-3 py-2.5 text-sm font-medium"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-task-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Tarefas</span>}
            {sidebarCollapsed && <span className="tooltip">Tarefas</span>}
          </a>
          
          <a 
            href="/clientes"
            className="menu-item flex items-center px-3 py-2.5 text-sm font-medium"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-user-3-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Clientes</span>}
            {sidebarCollapsed && <span className="tooltip">Clientes</span>}
          </a>
        </nav>
        
        <div className="mt-auto px-3 py-4 border-t" style={{ borderColor: "var(--border-color)" }}>
          <a 
            href="/settings"
            className="menu-item active flex items-center px-3 py-2.5 text-sm font-medium"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-settings-3-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Configurações</span>}
            {sidebarCollapsed && <span className="tooltip">Configurações</span>}
          </a>
          
          <button 
            onClick={handleLogout}
            className="menu-item flex items-center px-3 py-2.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white w-full"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-logout-box-line"></i>
            </div>
            {!sidebarCollapsed && <span className="ml-3">Sair</span>}
            {sidebarCollapsed && <span className="tooltip">Sair</span>}
          </button>
          
          <button 
            onClick={toggleSidebar}
            className="menu-item flex items-center px-3 py-2.5 text-sm font-medium w-full"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              <i className={sidebarCollapsed ? "ri-menu-unfold-line" : "ri-menu-fold-line"}></i>
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
          style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
        >
          <div className="flex items-center">
            <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
              Configurações
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="theme-toggle p-2 rounded-lg"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <i className={darkMode ? "ri-sun-line" : "ri-moon-line"}></i>
              </div>
            </button>
            
            <div className="relative">
              <button className="theme-toggle p-2 rounded-lg relative">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-notification-3-line"></i>
                </div>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">0</span>
              </button>
            </div>
            
            <div className="relative">
              <div className="flex items-center space-x-3 p-1 rounded-lg theme-toggle">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {user?.role || 'Usuário'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main 
          className={`flex-1 overflow-auto content-area content-transition p-6`}
          style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                Configurações do Sistema
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Personalize suas preferências e configurações da aplicação
              </p>
            </div>
            
            {/* Tabs */}
            <div className="mb-6 border-b" style={{ borderColor: "var(--border-color)" }}>
              <nav className="flex space-x-2" role="tablist">
                {[
                  { id: 'profile', icon: 'ri-user-3-line', label: 'Perfil' },
                  { id: 'connections', icon: 'ri-links-line', label: 'Conexões' },
                  { id: 'notifications', icon: 'ri-notification-3-line', label: 'Notificações' },
                  { id: 'appearance', icon: 'ri-palette-line', label: 'Aparência' },
                  { id: 'security', icon: 'ri-shield-check-line', label: 'Segurança' },
                  { id: 'privacy', icon: 'ri-database-2-line', label: 'Dados e Privacidade' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none ${
                      currentTab === tab.id 
                        ? 'bg-primary text-white border-b-2 border-primary' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{
                      backgroundColor: currentTab === tab.id ? '#6366f1' : 'transparent',
                      color: currentTab === tab.id ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    <i className={`${tab.icon} mr-2`}></i>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="fade-in">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}