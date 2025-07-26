import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function useSessionKeepAlive() {
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const keepSessionAlive = async () => {
      const token = localStorage.getItem('keeptur-token');
      
      if (!token) {
        return;
      }

      try {
        // Fazer uma requisição leve para manter a sessão ativa
        await apiRequest('GET', '/api/user/me');
        console.log('✅ Sessão renovada automaticamente');
      } catch (error) {
        console.log('⚠️ Erro ao renovar sessão:', error.message);
        // Se a sessão expirou, o handler global do queryClient vai lidar com isso
      }
    };

    // Renovar sessão a cada 30 minutos (1800000 ms)
    const startKeepAlive = () => {
      intervalId = setInterval(keepSessionAlive, 30 * 60 * 1000);
    };

    // Iniciar apenas se houver token
    if (localStorage.getItem('keeptur-token')) {
      startKeepAlive();
    }

    // Cleanup ao desmontar o componente
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
}