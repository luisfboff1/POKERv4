// API Base
const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost'  // Local development
  : 'https://poker.luisfboff.com';  // Production

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
  list: () => fetchApi('/api/session'),
  
  // Buscar uma sessão específica
  get: (id) => fetchApi(`/api/session/${id}`),
  
  // Criar nova sessão
  create: (data) => fetchApi('/api/session', 'POST', data),
  
  // Atualizar sessão existente
  update: (id, data) => fetchApi(`/api/session/${id}`, 'PUT', data),
  
  // Deletar sessão
  delete: (id) => fetchApi(`/api/session/${id}`, 'DELETE')
};
