// Usar caminho relativo - funciona tanto em dev quanto em produção
const API_BASE = '/api';

export const sessionApi = {
  // Listar todas as sessões
  list: async () => {
    const response = await fetch(`${API_BASE}/session.php`);
    if (!response.ok) {
      throw new Error('Erro ao buscar sessões');
    }
    return response.json();
  },

  // Criar nova sessão
  create: async (sessionData) => {
    const response = await fetch(`${API_BASE}/session.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: sessionData.date,
        players_data: sessionData.players,
        recommendations: sessionData.recommendations || []
      })
    });
    if (!response.ok) {
      throw new Error('Erro ao criar sessão');
    }
    return response.json();
  },

  // Atualizar sessão existente
  update: async (id, sessionData) => {
    const response = await fetch(`${API_BASE}/session.php?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: sessionData.date,
        players_data: sessionData.players,
        recommendations: sessionData.recommendations || []
      })
    });
    if (!response.ok) {
      throw new Error('Erro ao atualizar sessão');
    }
    return response.json();
  },

  // Excluir sessão
  delete: async (id) => {
    const response = await fetch(`${API_BASE}/session.php?id=${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Erro ao excluir sessão');
    }
    return response.json();
  },

  // Buscar jogadores únicos
  getPlayers: async () => {
    const response = await fetch(`${API_BASE}/players.php`);
    if (!response.ok) {
      throw new Error('Erro ao buscar jogadores');
    }
    return response.json();
  }
};