import React, { useState, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { MondeAPI } from "../lib/monde-api";
import { useTheme } from "../hooks/use-theme";
import { TokenExpiredModal } from "../components/TokenExpiredModal";
import { setTokenExpiredHandler } from "../lib/queryClient";
import logoFull from "@assets/LOGO Lilas_1752695672079.png";
import logoIcon from "@assets/ico Lilas_1752695703171.png";
import "../modal.css";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("tarefas");
  const [activeView, setActiveView] = useState("lista");
  const [tasks, setTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskFilter, setTaskFilter] = useState("assigned_to_me");
  const [users, setUsers] = useState([]);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const [draggedTask, setDraggedTask] = useState<any>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Funções de Drag-and-Drop
  const handleDragStart = (e: React.DragEvent, taskId: string, sourceColumn: string) => {
    console.log(`🎯 Iniciando drag: taskId=${taskId}, sourceColumn=${sourceColumn}`);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setDraggedTask(task);
      e.dataTransfer.setData('text/plain', taskId);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    
    if (!draggedTask) {
      console.warn("⚠️ Nenhuma tarefa arrastada encontrada");
      return;
    }

    console.log(`🎯 Drop na coluna: ${targetColumn}`);
    
    // Mapear coluna para status da API
    const statusMapping: { [key: string]: { completed: boolean, deleted: boolean } } = {
      "Pendentes": { completed: false, deleted: false },
      "Atrasadas": { completed: false, deleted: false },
      "Concluídas": { completed: true, deleted: false },
      "Excluídas": { completed: false, deleted: true }
    };

    const newStatus = statusMapping[targetColumn];
    if (!newStatus) {
      console.warn(`⚠️ Status desconhecido para coluna: ${targetColumn}`);
      return;
    }

    try {
      // Atualizar status na API do Monde
      const api = new MondeAPI(localStorage.getItem("keeptur-server-url") || "");
      api.setToken(localStorage.getItem("keeptur-token") || "");
      
      await api.updateTaskStatus(draggedTask.id, newStatus.completed, newStatus.deleted);
      
      // Simulação de reload
      console.log(`✅ Tarefa ${draggedTask.id} movida para ${targetColumn}`);
      
    } catch (error) {
      console.error("❌ Erro ao mover tarefa:", error);
    } finally {
      setDraggedTask(null);
      setDragOverColumn(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Keeptur</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Bem-vindo, {user?.name}!
            </span>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Kanban Board */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Coluna Pendentes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Pendentes
              </h3>
              <div
                className="min-h-[200px] space-y-2"
                onDrop={(e) => handleDrop(e, "Pendentes")}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Tarefas pendentes */}
              </div>
            </div>

            {/* Coluna Atrasadas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Atrasadas
              </h3>
              <div
                className="min-h-[200px] space-y-2"
                onDrop={(e) => handleDrop(e, "Atrasadas")}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Tarefas atrasadas */}
              </div>
            </div>

            {/* Coluna Concluídas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Concluídas
              </h3>
              <div
                className="min-h-[200px] space-y-2"
                onDrop={(e) => handleDrop(e, "Concluídas")}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Tarefas concluídas */}
              </div>
            </div>

            {/* Coluna Excluídas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Excluídas
              </h3>
              <div
                className="min-h-[200px] space-y-2"
                onDrop={(e) => handleDrop(e, "Excluídas")}
                onDragOver={(e) => e.preventDefault()}
              >
                {/* Tarefas excluídas */}
              </div>
            </div>
          </div>
        </div>

        {/* Modal de token expirado */}
        <TokenExpiredModal
          isOpen={showTokenExpiredModal}
          onClose={() => setShowTokenExpiredModal(false)}
        />
      </div>
    </div>
  );
}