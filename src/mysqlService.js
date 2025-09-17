// Serviço MySQL para substituir Supabase
import mysql from 'mysql2/promise';

// Configuração do MySQL do Hostinger
const dbConfig = {
  host: 'srv1437.hstgr.io',
  user: 'u903000160_poker',
  password: 'Poker2025!',
  database: 'u903000160_poker',
  port: 3306
};

let connection = null;

// Conectar ao MySQL
async function getConnection() {
  if (!connection) {
    connection = await mysql.createConnection(dbConfig);
  }
  return connection;
}

// Fechar conexão
async function closeConnection() {
  if (connection) {
    await connection.end();
    connection = null;
  }
}

// ===== SESSÕES =====
export async function getSessions(userId = null) {
  try {
    const conn = await getConnection();
    let query = 'SELECT * FROM sessions ORDER BY created_at DESC';
    let params = [];
    
    if (userId) {
      query = 'SELECT * FROM sessions WHERE created_by = ? ORDER BY created_at DESC';
      params = [userId];
    }
    
    const [rows] = await conn.execute(query, params);
    return { data: rows, error: null };
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    return { data: null, error: error.message };
  }
}

export async function saveSession(sessionData) {
  try {
    const conn = await getConnection();
    const { data, error } = await conn.execute(`
      INSERT INTO sessions (name, date, buy_in, rebuy, add_on, total_pot, snapshot, created_by, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      sessionData.name,
      sessionData.date,
      sessionData.buyIn || 0,
      sessionData.rebuy || 0,
      sessionData.addOn || 0,
      sessionData.totalPot || 0,
      JSON.stringify(sessionData.snapshot || {}),
      sessionData.userId || 1
    ]);
    
    return { data: { id: data.insertId }, error: null };
  } catch (error) {
    console.error('Erro ao salvar sessão:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteSession(sessionId) {
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM sessions WHERE id = ?', [sessionId]);
    return { error: null };
  } catch (error) {
    console.error('Erro ao deletar sessão:', error);
    return { error: error.message };
  }
}

export async function updateSession(sessionId, updates) {
  try {
    const conn = await getConnection();
    const fields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (key === 'snapshot') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(updates[key]));
      } else {
        fields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    values.push(sessionId);
    
    await conn.execute(`
      UPDATE sessions 
      SET ${fields.join(', ')}, updated_at = NOW() 
      WHERE id = ?
    `, values);
    
    return { error: null };
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error);
    return { error: error.message };
  }
}

// ===== DADOS DA JANTA =====
export async function getDinnerData(sessionId = null) {
  try {
    const conn = await getConnection();
    let query = 'SELECT * FROM dinner_data ORDER BY created_at DESC';
    let params = [];
    
    if (sessionId) {
      query = 'SELECT * FROM dinner_data WHERE session_id = ? ORDER BY created_at DESC';
      params = [sessionId];
    }
    
    const [rows] = await conn.execute(query, params);
    return { data: rows, error: null };
  } catch (error) {
    console.error('Erro ao buscar dados da janta:', error);
    return { data: null, error: error.message };
  }
}

export async function saveDinnerData(dinnerData) {
  try {
    const conn = await getConnection();
    const { data, error } = await conn.execute(`
      INSERT INTO dinner_data (session_id, total_cost, number_of_people, cost_per_person, participants, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      dinnerData.sessionId,
      dinnerData.totalCost,
      dinnerData.numberOfPeople,
      dinnerData.costPerPerson,
      JSON.stringify(dinnerData.participants || [])
    ]);
    
    return { data: { id: data.insertId }, error: null };
  } catch (error) {
    console.error('Erro ao salvar dados da janta:', error);
    return { data: null, error: error.message };
  }
}

export async function deleteDinnerData(sessionId) {
  try {
    const conn = await getConnection();
    await conn.execute('DELETE FROM dinner_data WHERE session_id = ?', [sessionId]);
    return { error: null };
  } catch (error) {
    console.error('Erro ao deletar dados da janta:', error);
    return { error: error.message };
  }
}

// ===== USUÁRIOS =====
export async function getUsers() {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM users ORDER BY name');
    return { data: rows, error: null };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return { data: null, error: error.message };
  }
}

export async function createUser(userData) {
  try {
    const conn = await getConnection();
    const { data, error } = await conn.execute(`
      INSERT INTO users (name, email, password_hash, role, created_at, updated_at) 
      VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [
      userData.name,
      userData.email,
      userData.passwordHash,
      userData.role || 'user'
    ]);
    
    return { data: { id: data.insertId }, error: null };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { data: null, error: error.message };
  }
}

// ===== AUTENTICAÇÃO SIMPLES =====
export async function authenticateUser(email, password) {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE email = ? AND password_hash = ?',
      [email, password]
    );
    
    if (rows.length > 0) {
      return { data: { user: rows[0] }, error: null };
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
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT 1 as test');
    return { data: rows, error: null };
  } catch (error) {
    console.error('Erro na conexão:', error);
    return { data: null, error: error.message };
  }
}

// Fechar conexão quando a página for fechada
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', closeConnection);
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
  testConnection,
  closeConnection
};
