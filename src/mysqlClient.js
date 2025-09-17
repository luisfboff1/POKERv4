import mysql from 'mysql2/promise';

// Configuração do banco MySQL do Hostinger
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'poker_settlements',
  port: process.env.MYSQL_PORT || 3306,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

let connection = null;

export const getConnection = async () => {
  if (!connection) {
    try {
      connection = await mysql.createConnection(dbConfig);
      console.log('Conectado ao MySQL com sucesso!');
    } catch (error) {
      console.error('Erro ao conectar com MySQL:', error);
      throw error;
    }
  }
  return connection;
};

export const closeConnection = async () => {
  if (connection) {
    await connection.end();
    connection = null;
    console.log('Conexão MySQL fechada.');
  }
};

// Função para executar queries
export const executeQuery = async (query, params = []) => {
  const conn = await getConnection();
  try {
    const [rows] = await conn.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Erro ao executar query:', error);
    throw error;
  }
};

// Função para testar conexão
export const testConnection = async () => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT 1 as test');
    console.log('Teste de conexão MySQL bem-sucedido:', rows);
    return true;
  } catch (error) {
    console.error('Erro no teste de conexão MySQL:', error);
    return false;
  }
};

export default {
  getConnection,
  closeConnection,
  executeQuery,
  testConnection
};
