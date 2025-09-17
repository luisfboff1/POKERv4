// Servidor Node.js para produção (opcional)
// Este arquivo pode ser usado se você quiser um servidor backend

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConnection, executeQuery } from './src/mysqlClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// API Routes
app.get('/api/health', async (req, res) => {
  try {
    const connection = await getConnection();
    await connection.execute('SELECT 1');
    res.json({ status: 'OK', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', database: 'disconnected', error: error.message });
  }
});

// API para sessões
app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await executeQuery(`
      SELECT s.*, u.name as created_by_name 
      FROM sessions s 
      LEFT JOIN users u ON s.created_by = u.id 
      ORDER BY s.date DESC
    `);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { name, date, buy_in, rebuy, add_on, total_pot, created_by } = req.body;
    const result = await executeQuery(`
      INSERT INTO sessions (name, date, buy_in, rebuy, add_on, total_pot, created_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, date, buy_in, rebuy, add_on, total_pot, created_by]);
    
    res.json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para participantes
app.get('/api/sessions/:sessionId/participants', async (req, res) => {
  try {
    const participants = await executeQuery(`
      SELECT p.*, u.name as user_name 
      FROM participants p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.session_id = ? 
      ORDER BY p.position ASC
    `, [req.params.sessionId]);
    res.json(participants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sessions/:sessionId/participants', async (req, res) => {
  try {
    const { name, buy_in, rebuy, add_on, final_amount, position, user_id } = req.body;
    const total_invested = parseFloat(buy_in) + parseFloat(rebuy) + parseFloat(add_on);
    const profit_loss = parseFloat(final_amount) - total_invested;
    
    const result = await executeQuery(`
      INSERT INTO participants (session_id, user_id, name, buy_in, rebuy, add_on, total_invested, final_amount, profit_loss, position) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [req.params.sessionId, user_id, name, buy_in, rebuy, add_on, total_invested, final_amount, profit_loss, position]);
    
    res.json({ id: result.insertId, ...req.body, total_invested, profit_loss });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para transferências
app.get('/api/sessions/:sessionId/transfers', async (req, res) => {
  try {
    const transfers = await executeQuery(`
      SELECT t.*, 
             fp.name as from_participant_name, 
             tp.name as to_participant_name 
      FROM transfers t 
      JOIN participants fp ON t.from_participant_id = fp.id 
      JOIN participants tp ON t.to_participant_id = tp.id 
      WHERE t.session_id = ? 
      ORDER BY t.created_at ASC
    `, [req.params.sessionId]);
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sessions/:sessionId/transfers', async (req, res) => {
  try {
    const { from_participant_id, to_participant_id, amount, description } = req.body;
    const result = await executeQuery(`
      INSERT INTO transfers (session_id, from_participant_id, to_participant_id, amount, description) 
      VALUES (?, ?, ?, ?, ?)
    `, [req.params.sessionId, from_participant_id, to_participant_id, amount, description]);
    
    res.json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API para dados da janta
app.get('/api/sessions/:sessionId/dinner', async (req, res) => {
  try {
    const dinner = await executeQuery(`
      SELECT d.*, 
             COUNT(dp.id) as participants_count 
      FROM dinner_data d 
      LEFT JOIN dinner_participants dp ON d.id = dp.dinner_id AND dp.is_participating = 1 
      WHERE d.session_id = ? 
      GROUP BY d.id
    `, [req.params.sessionId]);
    
    if (dinner.length === 0) {
      return res.json(null);
    }
    
    const participants = await executeQuery(`
      SELECT dp.*, p.name as participant_name 
      FROM dinner_participants dp 
      JOIN participants p ON dp.participant_id = p.id 
      WHERE dp.dinner_id = ?
    `, [dinner[0].id]);
    
    res.json({ ...dinner[0], participants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sessions/:sessionId/dinner', async (req, res) => {
  try {
    const { total_cost, number_of_people, cost_per_person, participants } = req.body;
    
    // Criar ou atualizar dados da janta
    const dinnerResult = await executeQuery(`
      INSERT INTO dinner_data (session_id, total_cost, number_of_people, cost_per_person) 
      VALUES (?, ?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
      total_cost = VALUES(total_cost), 
      number_of_people = VALUES(number_of_people), 
      cost_per_person = VALUES(cost_per_person)
    `, [req.params.sessionId, total_cost, number_of_people, cost_per_person]);
    
    const dinnerId = dinnerResult.insertId || await executeQuery(`
      SELECT id FROM dinner_data WHERE session_id = ?
    `, [req.params.sessionId]).then(result => result[0].id);
    
    // Limpar participantes existentes
    await executeQuery('DELETE FROM dinner_participants WHERE dinner_id = ?', [dinnerId]);
    
    // Adicionar novos participantes
    if (participants && participants.length > 0) {
      for (const participant of participants) {
        await executeQuery(`
          INSERT INTO dinner_participants (dinner_id, participant_id, is_participating) 
          VALUES (?, ?, ?)
        `, [dinnerId, participant.id, participant.is_participating]);
      }
    }
    
    res.json({ id: dinnerId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir arquivos estáticos
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
