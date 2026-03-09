import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db, run, get, all } from './database.js';

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro-aqui-mude-em-producao';

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de autenticação
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Verificar se usuário já existe
    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserir usuário
    const result = await run('INSERT INTO users (email, password, name) VALUES (?, ?, ?)', [email, hashedPassword, name]);
    
    // Gerar token
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: { id: result.lastInsertRowid, email, name }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    
    // Buscar usuário
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Gerar token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ==================== ROTAS DE TRANSAÇÕES ====================

// Listar transações
app.get('/api/transactions', authenticate, async (req, res) => {
  try {
    const transactions = await all(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC',
      [req.userId]
    );
    
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// Criar transação
app.post('/api/transactions', authenticate, async (req, res) => {
  try {
    const { type, description, amount, category, date } = req.body;
    
    if (!type || !description || !amount || !category || !date) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    if (type !== 'income' && type !== 'expense') {
      return res.status(400).json({ error: 'Tipo deve ser income ou expense' });
    }
    
    const result = await run(
      'INSERT INTO transactions (user_id, type, description, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, type, description, amount, category, date]
    );
    
    const transaction = await get('SELECT * FROM transactions WHERE id = ?', [result.lastInsertRowid]);
    
    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// Deletar transação
app.delete('/api/transactions/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a transação pertence ao usuário
    const transaction = await get('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [id, req.userId]);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    await run('DELETE FROM transactions WHERE id = ?', [id]);
    
    res.json({ message: 'Transação deletada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

// Estatísticas
app.get('/api/transactions/stats', authenticate, async (req, res) => {
  try {
    const incomeResult = await get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = "income"',
      [req.userId]
    );
    
    const expenseResult = await get(
      'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = "expense"',
      [req.userId]
    );
    
    const categoryStats = await all(
      'SELECT category, SUM(amount) as total FROM transactions WHERE user_id = ? AND type = "expense" GROUP BY category',
      [req.userId]
    );
    
    const income = incomeResult.total;
    const expense = expenseResult.total;
    
    res.json({
      income,
      expense,
      balance: income - expense,
      categoryStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// ==================== ROTAS DE METAS ====================

// Listar metas
app.get('/api/goals', authenticate, async (req, res) => {
  try {
    const goals = await all(
      'SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC',
      [req.userId]
    );
    
    res.json(goals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar metas' });
  }
});

// Criar meta
app.post('/api/goals', authenticate, async (req, res) => {
  try {
    const { name, target, current } = req.body;
    
    if (!name || !target) {
      return res.status(400).json({ error: 'Nome e valor alvo são obrigatórios' });
    }
    
    const result = await run(
      'INSERT INTO goals (user_id, name, target, current) VALUES (?, ?, ?, ?)',
      [req.userId, name, target, current || 0]
    );
    
    const goal = await get('SELECT * FROM goals WHERE id = ?', [result.lastInsertRowid]);
    
    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar meta' });
  }
});

// Atualizar meta
app.put('/api/goals/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { current } = req.body;
    
    // Verificar se a meta pertence ao usuário
    const goal = await get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, req.userId]);
    
    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }
    
    await run('UPDATE goals SET current = ? WHERE id = ?', [current, id]);
    
    const updatedGoal = await get('SELECT * FROM goals WHERE id = ?', [id]);
    
    res.json(updatedGoal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

// Deletar meta
app.delete('/api/goals/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se a meta pertence ao usuário
    const goal = await get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [id, req.userId]);
    
    if (!goal) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }
    
    await run('DELETE FROM goals WHERE id = ?', [id]);
    
    res.json({ message: 'Meta deletada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar meta' });
  }
});

// ==================== ROTA DE SAÚDE ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando!' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
