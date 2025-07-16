import { Button } from "./button";
import { 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  PanelLeftOpen 
} from "lucide-react";
import logoKeeptur from "@/assets/logo-keeptur.png";
import iconKeeptur from "@/assets/icon-keeptur.png";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  currentView: 'tasks' | 'clients';
  onViewChange: (view: 'tasks' | 'clients') => void;
  onLogout: () => void;
}

export function Sidebar({ collapsed, onToggle, currentView, onViewChange, onLogout }: SidebarProps) {
  const menuItems = [
    {
      id: 'tasks',
      label: 'Tarefas',
      icon: CheckSquare,
      active: currentView === 'tasks',
      onClick: () => onViewChange('tasks'),
    },
    {
      id: 'clients',
      label: 'Clientes',
      icon: Users,
      active: currentView === 'clients',
      onClick: () => onViewChange('clients'),
    },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : 'sidebar-expanded'} sidebar-transition fixed inset-y-0 left-0 z-50 flex flex-col`}>
      <div className="flex items-center h-16 px-4 border-b border-border">
        <div className="flex items-center">
          {collapsed ? (
            <img src={iconKeeptur} alt="Keeptur" className="w-8 h-8" />
          ) : (
            <img src={logoKeeptur} alt="Keeptur" className="h-8" />
          )}
        </div>
      </div>
      
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={item.active ? "default" : "ghost"}
            className={`menu-item flex items-center w-full justify-start px-3 py-2.5 text-sm font-medium ${
              item.active ? 'active' : ''
            }`}
            onClick={item.onClick}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="menu-text ml-3">{item.label}</span>}
            {collapsed && (
              <span className="tooltip">{item.label}</span>
            )}
          </Button>
        ))}
      </nav>
      
      <div className="mt-auto px-3 py-4 border-t border-border">
        <Button
          variant="ghost"
          className="menu-item flex items-center w-full justify-start px-3 py-2.5 text-sm font-medium"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="menu-text ml-3">Configurações</span>}
          {collapsed && <span className="tooltip">Configurações</span>}
        </Button>
        
        <Button
          variant="ghost"
          onClick={onLogout}
          className="menu-item flex items-center w-full justify-start px-3 py-2.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="menu-text ml-3">Sair</span>}
          {collapsed && <span className="tooltip">Sair</span>}
        </Button>
        
        <Button
          variant="ghost"
          onClick={onToggle}
          className="menu-item flex items-center w-full justify-start px-3 py-2.5 text-sm font-medium"
        >
          {collapsed ? (
            <PanelLeftOpen className="w-5 h-5 flex-shrink-0" />
          ) : (
            <Menu className="w-5 h-5 flex-shrink-0" />
          )}
          {!collapsed && <span className="menu-text ml-3">Recolher Menu</span>}
          {collapsed && <span className="tooltip">Expandir Menu</span>}
        </Button>
      </div>
    </aside>
  );
}
