                      reloadTasks();
                    } else {
                      throw new Error('Erro na API');
                    }
                  } catch (error) {
                    console.error("❌ Erro ao transferir responsável:", error);
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    toast.textContent = 'Erro ao transferir responsável';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!selectedTransferUser}
              >
                <i className="ri-user-shared-line mr-2"></i>
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Conclusão de Tarefa */}
      {showCompletionModal && taskToComplete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                <i className="ri-check-double-line mr-2 text-green-600"></i>
                Concluir Tarefa
              </h3>
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setTaskToComplete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  {taskToComplete.attributes?.title}
                </h4>
                <p className="text-blue-600 dark:text-blue-300 text-sm">
                  Esta tarefa será marcada como concluída. Você pode adicionar uma observação opcional sobre a conclusão.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Observação da Conclusão (Opcional)
                  </label>
                  <textarea
                    value={newHistoryText}
                    onChange={(e) => setNewHistoryText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    style={{ 
                      backgroundColor: "var(--bg-primary)", 
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)"
                    }}
                    rows={3}
                    placeholder="Descreva brevemente o que foi realizado ou concluído..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setTaskToComplete(null);
                  setNewHistoryText("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('keeptur-token');
                    if (!token) {
                      setShowTokenExpiredModal(true);
                      return;
                    }

                    // Cancelar requisições anteriores se existirem
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort();
                    }

                    // Marcar tarefa como concluída
                    const response = await fetch(`/api/monde/tarefas/${taskToComplete.id}`, {
                      method: 'PUT',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        completed: true,
                        completed_at: new Date().toISOString(),
                        history_comment: newHistoryText.trim() || 'Tarefa concluída'
                      })
                    });

                    if (response.ok) {
                      console.log('✅ Tarefa marcada como concluída');
                      
                      // Fechar modal imediatamente
                      setShowCompletionModal(false);
                      setTaskToComplete(null);
                      setNewHistoryText("");
                      
                      // Aguardar um momento antes de recarregar
                      setTimeout(async () => {
                        try {
                          await reloadTasks();
                        } catch (error) {
                          console.log('⚠️ Erro ao recarregar tarefas após conclusão:', error);
                        }
                      }, 800);
                      
                      // Mostrar feedback visual
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = 'Tarefa concluída com sucesso!';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    } else {
                      console.error('❌ Erro ao concluir tarefa:', response.status);
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = 'Erro ao concluir tarefa. Tente novamente.';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    }
                  } catch (error) {
                    console.error('❌ Erro:', error);
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                    toast.textContent = 'Erro ao concluir tarefa. Tente novamente.';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <i className="ri-check-line mr-2"></i>
                Concluir Tarefa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão de Tarefa */}
      {showDeletionModal && taskToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                <i className="ri-delete-bin-line mr-2 text-red-600"></i>
                Excluir Tarefa
              </h3>
              <button
                onClick={() => {
                  setShowDeletionModal(false);
                  setTaskToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                  {taskToDelete.attributes?.title}
                </h4>
                <p className="text-red-600 dark:text-red-300 text-sm">
                  Esta tarefa será excluída permanentemente. Você pode adicionar uma observação sobre a exclusão.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Motivo da Exclusão (Opcional)
                  </label>
                  <textarea
                    value={newHistoryText}
                    onChange={(e) => setNewHistoryText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    style={{ 
                      backgroundColor: "var(--bg-primary)", 
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)"
                    }}
                    rows={3}
                    placeholder="Explique brevemente o motivo da exclusão desta tarefa..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeletionModal(false);
                  setTaskToDelete(null);
                  setNewHistoryText("");
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('keeptur-token');
                    if (!token) {
                      setShowTokenExpiredModal(true);
                      return;
                    }

                    // Excluir tarefa
                    const response = await fetch(`/api/monde/tarefas/${taskToDelete.id}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        history_comment: newHistoryText.trim() || 'Tarefa excluída'
                      })
                    });

                    if (response.ok) {
                      console.log('✅ Tarefa excluída com sucesso');
                      
                      // Fechar modal imediatamente
                      setShowDeletionModal(false);
                      setTaskToDelete(null);
                      setNewHistoryText("");
                      
                      // Aguardar mais tempo para a API processar a exclusão
                      setTimeout(async () => {
                        try {
                          await reloadTasks();
                          
                          // Se não mudou, forçar uma atualização completa
                          setTimeout(async () => {
                            console.log('🔄 Forçando atualização completa após exclusão');
                            await reloadTasks();
                          }, 1500);
                        } catch (error) {
                          console.log('⚠️ Erro ao recarregar tarefas após exclusão:', error);
                        }
                      }, 1000);
                      
                      // Mostrar feedback visual
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = 'Tarefa excluída com sucesso!';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    } else {
                      console.error('❌ Erro ao excluir tarefa:', response.status);
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      toast.textContent = 'Erro ao excluir tarefa. Tente novamente.';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    }
                  } catch (error) {
                    console.error('❌ Erro:', error);
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50';
                    toast.textContent = 'Erro ao excluir tarefa. Tente novamente.';
                    document.body.appendChild(toast);
                    setTimeout(() => document.body.removeChild(toast), 3000);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <i className="ri-delete-bin-line mr-2"></i>
                Excluir Tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
