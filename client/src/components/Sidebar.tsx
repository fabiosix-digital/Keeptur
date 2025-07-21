import { useLocation } from "wouter";
import logoFull from "@assets/LOGO Lilas_1752695672079.png";
import logoIcon from "@assets/ico Lilas_1752695703171.png";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  showConfigsOption?: boolean;
}

export function Sidebar({ collapsed, onToggle, activeTab, onTabChange, showConfigsOption = false }: SidebarProps) {
  const [, setLocation] = useLocation();

  const handleNavigation = (path: string, tab?: string) => {
    if (tab && onTabChange) {
      onTabChange(tab);
    } else {
      setLocation(path);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col ${
        collapsed ? "w-16" : "w-64"
      }`}
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {collapsed ? (
          <img
            src={logoIcon}
            alt="Keeptur"
            className="w-8 h-8 object-contain cursor-pointer"
            onClick={onToggle}
          />
        ) : (
          <>
            <img
              src={logoFull}
              alt="Keeptur"
              className="h-8 object-contain cursor-pointer"
              onClick={onToggle}
            />
            <button
              onClick={onToggle}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <i className="ri-menu-fold-line text-gray-600 dark:text-gray-300"></i>
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {/* Tarefas */}
          <button
            onClick={() => handleNavigation("/dashboard", "tarefas")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "tarefas" || window.location.pathname === "/dashboard"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <i className="ri-task-line text-xl mr-3"></i>
            {!collapsed && <span>Tarefas</span>}
          </button>

          {/* Clientes */}
          <button
            onClick={() => handleNavigation("/dashboard", "clientes")}
            className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
              activeTab === "clientes"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <i className="ri-user-line text-xl mr-3"></i>
            {!collapsed && <span>Clientes</span>}
          </button>

          {/* Configurações */}
          {showConfigsOption && (
            <button
              onClick={() => handleNavigation("/settings")}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                window.location.pathname === "/settings"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <i className="ri-settings-line text-xl mr-3"></i>
              {!collapsed && <span>Configurações</span>}
            </button>
          )}
        </nav>
      </div>

      {/* Footer - Configurações e Sair */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={() => handleNavigation("/settings")}
          className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
            window.location.pathname === "/settings"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <i className="ri-settings-line text-xl mr-3"></i>
          {!collapsed && <span>Configurações</span>}
        </button>

        <button
          onClick={() => {
            localStorage.removeItem('keeptur-token');
            setLocation('/login');
          }}
          className="w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <i className="ri-logout-box-line text-xl mr-3"></i>
          {!collapsed && <span>Sair</span>}
        </button>

        {!collapsed && (
          <button
            onClick={onToggle}
            className="w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
          >
            <i className="ri-menu-fold-line text-lg mr-3"></i>
            <span>Recolher Menu</span>
          </button>
        )}
      </div>
    </div>
  );
}