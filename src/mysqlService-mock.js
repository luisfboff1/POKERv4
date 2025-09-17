// Mock do MySQL para desenvolvimento (dados em memória)
let mockSessions = [];
let mockDinnerData = [];
let mockUsers = [
  { id: 1, name: 'Admin', email: 'admin@poker.com', role: 'admin' }
];

// ===== SESSÕES =====
export async function getSessions(userId = null) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let sessions = [...mockSessions];
    if (userId) {
      sessions = sessions.filter(s => s.created_by === userId);
    }
    
    return { data: sessions, error: null };
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    return { data: null, error: error.message };
  }
}

export async function saveSession(sessionData) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newSession = {
      id: Date.now(),
      name: sessionData.name,
      date: sessionData.date,
      buy_in: sessionData.buyIn || 0,
      rebuy: sessionData.rebuy || 0,
      add_on: sessionData.addOn || 0,
      total_pot: sessionData.totalPot || 0,
      snapshot: sessionData.snapshot,
      created_by: sessionData.userId || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockSessions.unshift(newSession);
    return { data: { id: newSession.id }, error: null };
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteSession(sessionId) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const index = mockSessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      mockSessions.splice(index, 1);
    }
    
    return { error: null };
  } catch (error) {
    console.error('Erro ao deletar sessão:', error);
    return { error: error.message };
  }
}

export async function updateSession(sessionId, updates) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const index = mockSessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      mockSessions[index] = { ...mockSessions[index], ...updates, updated_at: new Date().toISOString() };
    }
    
    return { error: null };
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    return { error: error.message };
  }
}

// ===== DADOS DA JANTA =====
export async function getDinnerData(sessionId = null) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    let data = [...mockDinnerData];
    if (sessionId) {
      data = data.filter(d => d.session_id === sessionId);
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar dados da janta:', error);
    return { data: null, error: error.message };
  }
}

export async function saveDinnerData(dinnerData) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newDinner = {
      id: Date.now(),
      session_id: dinnerData.sessionId,
      total_cost: dinnerData.totalCost,
      number_of_people: dinnerData.numberOfPeople,
      cost_per_person: dinnerData.costPerPerson,
      participants: dinnerData.participants || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockDinnerData.unshift(newDinner);
    return { data: { id: newDinner.id }, error: null };
  } catch (error) {
    console.error('Erro ao salvar dados da janta:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteDinnerData(sessionId) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const index = mockDinnerData.findIndex(d => d.session_id === sessionId);
    if (index !== -1) {
      mockDinnerData.splice(index, 1);
    }
    
    return { error: null };
  } catch (error) {
    console.error('Erro ao deletar dados da janta:', error);
    return { error: error.message };
  }
}

// ===== USUÁRIOS =====
export async function getUsers() {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { data: [...mockUsers], error: null };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return { data: null, error: error.message };
  }
}

export async function createUser(userData) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newUser = {
      id: Date.now(),
      name: userData.name,
      email: userData.email,
      password_hash: userData.passwordHash,
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockUsers.push(newUser);
    return { data: { id: newUser.id }, error: null };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { data: null, error: error.message };
  }
}

// ===== AUTENTICAÇÃO SIMPLES =====
export async function authenticateUser(email, password) {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const user = mockUsers.find(u => u.email === email && u.password_hash === password);
    
    if (user) {
      return { data: { user }, error: null };
    } else {
      return { data: null, error: 'Credenciais inválidas' };
    }
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return { data: null, error: error.message };
  }
}

// ===== UTILITÁRIOS =====
export async function testConnection() {
  try {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { data: [{ test: 1 }], error: null };
  } catch (error) {
    console.error('Erro na conexão:', error);
    return { data: null, error: error.message };
  }
}

export default {
  getSessions,
  saveSession,
  deleteSession,
  updateSession,
  getDinnerData,
  saveDinnerData,
  deleteDinnerData,
  getUsers,
  createUser,
  authenticateUser,
  testConnection
};
