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
  const [currentTab, setCurrentTab] = useState("profile");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para editar perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<any>({});
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    checkGoogleConnection();
    loadUserProfile();
    
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

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/monde/user-profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
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
        showToast('Google Calendar desconectado', 'success');
      }
    } catch (error) {
      console.error('Erro ao desconectar Google Calendar:', error);
    }
  };

  const saveUserProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await fetch('/api/monde/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        setIsEditingProfile(false);
        showToast('Perfil atualizado com sucesso!', 'success');
        // Recarregar dados do usuário
        loadUserProfile();
      } else {
        throw new Error('Erro ao salvar perfil');
      }
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      showToast('Erro ao salvar perfil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const logoutAllSessions = async () => {
    try {
      const response = await fetch('/api/auth/logout-all', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('keeptur-token')}`,
        },
      });

      if (response.ok) {
        logout();
        setLocation('/login');
        showToast('Todas as sessões foram encerradas', 'success');
      }
    } catch (error) {
      console.error('Erro ao encerrar sessões:', error);
      showToast('Erro ao encerrar sessões', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                  Informações do Perfil
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Suas informações pessoais e de conta
                </p>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isEditingProfile ? 'Cancelar' : 'Editar'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Nome
                </label>
                <input
                  type="text"
                  value={profileData?.name || user?.name || ''}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  style={{ 
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)"
                  }}
                  readOnly={!isEditingProfile}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={profileData?.email || user?.email || ''}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  style={{ 
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)"
                  }}
                  readOnly={!isEditingProfile}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Função
                </label>
                <input
                  type="text"
                  value={profileData?.role || user?.role || ''}
                  onChange={(e) => setProfileData({ ...profileData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  style={{ 
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)"
                  }}
                  readOnly={!isEditingProfile}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Empresa
                </label>
                <input
                  type="text"
                  value={profileData?.empresa || user?.empresa || ''}
                  onChange={(e) => setProfileData({ ...profileData, empresa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  style={{ 
                    backgroundColor: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-primary)"
                  }}
                  readOnly={!isEditingProfile}
                />
              </div>
            </div>

            {isEditingProfile && (
              <div className="flex space-x-4">
                <button
                  onClick={saveUserProfile}
                  disabled={savingProfile}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        );

      case 'connections':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: "var(--text-primary)" }}>
                Integrações Externas
              </h3>
              
              <div className="border rounded-lg p-6" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
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
                    <div className="border rounded-lg p-4" style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.3)" }}>
                      <h5 className="font-medium text-blue-800 mb-2">Recursos disponíveis:</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Criação automática de eventos no Google Calendar</li>
                        <li>• Sincronização bidirecional (Keeptur ↔ Google)</li>
                        <li>• Atualização automática de horários e datas</li>
                        <li>• Notificações do Google Calendar</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-yellow-50" style={{ borderColor: "rgba(245, 158, 11, 0.5)" }}>
                      <h5 className="font-medium text-yellow-800 mb-2">⚠️ Configuração necessária no Google Cloud Console:</h5>
                      <p className="text-sm text-yellow-700 mb-2">
                        Adicione esta URL exata nos "URIs de redirecionamento autorizados":
                      </p>
                      <code className="block text-xs bg-gray-100 p-2 rounded border text-gray-800 break-all">
                        https://d40d28ae-1403-49d7-bf80-507c25f2b161-00-1gejeuav6wbco.spock.replit.dev/auth/google/callback
                      </code>
                      <p className="text-xs text-yellow-600 mt-2">
                        Acesse: console.cloud.google.com/apis/credentials → Sua aplicação OAuth 2.0 → URIs de redirecionamento
                      </p>
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
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                      <div>
                        <h5 className="font-medium text-green-800">Sincronização Ativa</h5>
                        <p className="text-sm text-green-600">Suas tarefas estão sendo sincronizadas automaticamente</p>
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
                    
                    <button 
                      onClick={disconnectGoogleCalendar}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                    >
                      Desconectar Google Calendar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: "var(--text-primary)" }}>
                Aparência
              </h3>
              
              <div className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
                <div>
                  <h4 className="font-medium" style={{ color: "var(--text-primary)" }}>Modo escuro</h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Alternar entre tema claro e escuro</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={theme === "dark"}
                    onChange={toggleTheme}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4" style={{ color: "var(--text-primary)" }}>
                Segurança
              </h3>
              
              <div className="p-4 border rounded-lg" style={{ borderColor: "var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
                <h4 className="font-medium mb-2" style={{ color: "var(--text-primary)" }}>Sessão</h4>
                <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
                  Gerencie suas sessões ativas
                </p>
                <button 
                  onClick={logoutAllSessions}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Encerrar todas as sessões
                </button>
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
      {/* Sidebar - usando exatamente o mesmo do dashboard */}
      <aside
        className={`sidebar ${
          sidebarCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
        } sidebar-transition fixed inset-y-0 left-0 z-50 flex flex-col`}
      >
        <div
          className="flex items-center h-16 px-4 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center">
            {sidebarCollapsed ? (
              <img src={logoIcon} alt="Keeptur" className="w-8 h-8" />
            ) : (
              <img src={logoFull} alt="Keeptur" className="h-8" />
            )}
          </div>
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
        </nav>

        <div
          className="mt-auto px-3 py-4 border-t"
          style={{ borderColor: "var(--border-color)" }}
        >
          <button 
            className="menu-item active flex items-center px-3 py-2.5 text-sm font-medium w-full">
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
        {/* Header - usando exatamente o mesmo do dashboard */}
        <header
          className={`header flex items-center justify-between h-16 px-6 content-transition`}
          style={{ marginLeft: sidebarCollapsed ? "4rem" : "16rem" }}
        >
          <div className="flex items-center">
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Configurações
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
                  0
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
                  { id: 'appearance', icon: 'ri-palette-line', label: 'Aparência' },
                  { id: 'security', icon: 'ri-shield-check-line', label: 'Segurança' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none transition-colors ${
                      currentTab === tab.id 
                        ? 'bg-blue-600 text-white border-b-2 border-blue-600' 
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
            <div className="card rounded-xl p-6">
              {renderTabContent()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}