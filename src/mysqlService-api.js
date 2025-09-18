// Serviço que faz chamadas HTTP para a API PHP
const API_BASE = window.location.origin;

// ===== SESSÕES =====
export async function getSessions(userId = null) {
  try {
    const url = userId ? `/api/sessions?userId=${userId}` : '/api/sessions';
    const response = await fetch(API_BASE + url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Dados recebidos da API:', data);
    if (data.data) {
      console.log('Sessions da API:', data.data);
      data.data = data.data.map(session => {
        if (session.snapshot) {
          try {
            session.snapshot = JSON.parse(session.snapshot);
          } catch (e) {
            console.error('Erro ao fazer parse do snapshot:', e);
          }
        }
        return session;
      });
    }
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    return { data: null, error: error.message };
  }
}

export async function saveSession(sessionData) {
  try {
    const response = await fetch(API_BASE + '/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteSession(sessionId) {
  try {
    const response = await fetch(API_BASE + `/api/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return { error: null };
  } catch (error) {
    console.error('Erro ao deletar sessão:', error);
    return { error: error.message };
  }
}

// ===== DADOS DE JANTA =====
export async function getDinnerData(sessionId = null) {
  try {
    const response = await fetch(API_BASE + '/api/dinner');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { data: result.data || [], error: null };
  } catch (error) {
    console.error('Erro ao buscar dados de janta:', error);
    return { data: null, error: error.message };
  }
}

export async function saveDinnerData(dinnerData) {
  try {
    const response = await fetch(API_BASE + '/api/dinner', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dinnerData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Erro ao salvar dados de janta:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteDinnerData(dinnerId) {
  try {
    const response = await fetch(API_BASE + `/api/dinner/${dinnerId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return { error: null };
  } catch (error) {
    console.error('Erro ao deletar dados de janta:', error);
    return { error: error.message };
  }
}

// ===== USUÁRIOS =====
export async function getUsers() {
  try {
    const response = await fetch(API_BASE + '/api/players');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { data: result.data || [], error: null };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return { data: null, error: error.message };
  }
}

export async function saveUser(userData) {
  try {
    const response = await fetch(API_BASE + '/api/players', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Erro ao salvar usuário:', error);
    return { data: null, error: error.message };
  }
}
