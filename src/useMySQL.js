// Hook personalizado para usar MySQL ao invés de localStorage
import { useState, useEffect } from 'react';

// Detectar ambiente: desenvolvimento = mock, produção = API HTTP
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// Função para obter o serviço correto
async function getService() {
  if (isDevelopment) {
    // Desenvolvimento: usar mock
    return await import('./mysqlService-mock.js');
  } else {
    // Produção: usar API HTTP
    return await import('./mysqlService-api.js');
  }
}

// Hook para sessões
export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const service = await getService();
      const { data, error } = await service.getSessions();
      if (error) {
        setError(error);
      } else {
        setSessions(data.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSession = async (sessionData) => {
    try {
      console.log("Tentando salvar sessão:", sessionData);
      const service = await getService();
      console.log("Serviço obtido:", service);
      const { data, error } = await service.saveSession(sessionData);
      console.log("Resultado do saveSession:", { data, error });
      if (error) {
        console.error("Erro ao salvar sessão:", error);
        setError(error);
        return false;
      } else {
        await loadSessions(); // Recarregar lista
        return true;
      }
    } catch (err) {
      console.error("Erro catch ao salvar sessão:", err);
      setError(err.message);
      return false;
    }
  };

  const removeSession = async (sessionId) => {
    try {
      const service = await getService();
      const { error } = await service.deleteSession(sessionId);
      if (error) {
        setError(error);
        return false;
      } else {
        await loadSessions(); // Recarregar lista
        return true;
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const editSession = async (sessionId, updates) => {
    try {
      const service = await getService();
      const { error } = await service.updateSession(sessionId, updates);
      if (error) {
        setError(error);
        return false;
      } else {
        await loadSessions(); // Recarregar lista
        return true;
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return {
    sessions,
    loading,
    error,
    loadSessions,
    addSession,
    removeSession,
    editSession
  };
}

// Hook para dados da janta
export function useDinnerData() {
  const [dinnerData, setDinnerData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadDinnerData = async (sessionId = null) => {
    setLoading(true);
    setError(null);
    try {
      const service = await getService();
      const { data, error } = await service.getDinnerData(sessionId);
      if (error) {
        setError(error);
      } else {
        setDinnerData(data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addDinnerData = async (data) => {
    try {
      const service = await getService();
      const { data: result, error } = await service.saveDinnerData(data);
      if (error) {
        setError(error);
        return false;
      } else {
        await loadDinnerData(); // Recarregar lista
        return true;
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const removeDinnerData = async (sessionId) => {
    try {
      const service = await getService();
      const { error } = await service.deleteDinnerData(sessionId);
      if (error) {
        setError(error);
        return false;
      } else {
        await loadDinnerData(); // Recarregar lista
        return true;
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  useEffect(() => {
    loadDinnerData();
  }, []);

  return {
    dinnerData,
    loading,
    error,
    loadDinnerData,
    addDinnerData,
    removeDinnerData
  };
}

// Hook para jogadores (estado local temporário)
export function usePlayers() {
  const [players, setPlayers] = useState([]);

  return [players, setPlayers];
}

// Hook para configurações (estado local temporário)
export function useConfig(key, defaultValue) {
  const [value, setValue] = useState(defaultValue);

  return [value, setValue];
}