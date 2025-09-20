// API Base: em dev usamos proxy Vite '/api' -> Hostinger '/poker/api'; em prod usamos '/poker/api'
const API_BASE = import.meta.env.DEV ? '/api' : '/poker/api';

// Função genérica para fazer requisições
async function fetchApi(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(API_BASE + endpoint, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error) {
    console.error('API Error:', error);
    return { data: null, error: error.message };
  }
}

// API de Sessões
export const sessionService = {
  // Listar todas as sessões
  list: () => fetchApi('/session.php'),
  
  // Buscar uma sessão específica
  get: (id) => fetchApi(`/session.php?id=${id}`),
  
  // Criar nova sessão
  create: (data) => fetchApi('/session.php', 'POST', data),
  
  // Atualizar sessão existente
  update: (id, data) => fetchApi(`/session.php?id=${id}`, 'PUT', data),
  
  // Deletar sessão
  delete: (id) => fetchApi(`/session.php?id=${id}`, 'DELETE')
};
