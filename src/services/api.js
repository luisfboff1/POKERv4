// API service para comunicação com o backend PHP
const API_BASE = import.meta.env.DEV ? '/api' : '/poker/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Sessões
  async getSessions() {
    return this.request('/session.php');
  }

  async createSession(sessionData) {
    return this.request('/session.php', {
      method: 'POST',
      body: JSON.stringify(sessionData)
    });
  }

  async updateSession(id, sessionData) {
    return this.request(`/session.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData)
    });
  }

  async deleteSession(id) {
    return this.request(`/session.php?id=${id}`, {
      method: 'DELETE'
    });
  }

  // Jogadores
  async getPlayers() {
    return this.request('/players.php');
  }
}

export const api = new ApiService();