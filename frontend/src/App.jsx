import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, Plus, X, LogOut } from 'lucide-react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [authMode, setAuthMode] = useState('login');
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);

  useEffect(() => {
    if (token) {
      loadUserData();
    }
  }, [token]);

  const loadUserData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [transRes, goalsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/transactions`, { headers }),
        fetch(`${API_URL}/goals`, { headers }),
        fetch(`${API_URL}/transactions/stats`, { headers })
      ]);

      if (transRes.ok) setTransactions(await transRes.json());
      if (goalsRes.ok) setGoals(await goalsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch(`${API_URL}/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const { token, user } = await res.json();
        localStorage.setItem('token', token);
        setToken(token);
        setUser(user);
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao autenticar');
      }
    } catch (error) {
      alert('Erro de conexão com o servidor');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setTransactions([]);
    setGoals([]);
  };

  const addTransaction = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setShowAddTransaction(false);
        loadUserData();
        e.target.reset();
      }
    } catch (error) {
      alert('Erro ao adicionar transação');
    }
  };

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) loadUserData();
    } catch (error) {
      alert('Erro ao deletar transação');
    }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        setShowAddGoal(false);
        loadUserData();
        e.target.reset();
      }
    } catch (error) {
      alert('Erro ao adicionar meta');
    }
  };

  const updateGoal = async (id, current) => {
    try {
      const res = await fetch(`${API_URL}/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ current: parseFloat(current) })
      });

      if (res.ok) loadUserData();
    } catch (error) {
      alert('Erro ao atualizar meta');
    }
  };

  const deleteGoal = async (id) => {
    try {
      const res = await fetch(`${API_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) loadUserData();
    } catch (error) {
      alert('Erro ao deletar meta');
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="logo">FINANÇAS</h1>
          <p className="tagline">Controle financeiro inteligente</p>
          
          <div className="auth-toggle">
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              Entrar
            </button>
            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
            >
              Registrar
            </button>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            {authMode === 'register' && (
              <input
                type="text"
                name="name"
                placeholder="Nome completo"
                required
              />
            )}
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Senha"
              required
              minLength="6"
            />
            <button type="submit" className="btn-primary">
              {authMode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">FINANÇAS</h1>
          <button onClick={handleLogout} className="btn-logout">
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </header>

      <div className="container">
        <div className="stats-grid">
          <div className="stat-card income">
            <TrendingUp className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Receitas</span>
              <span className="stat-value mono">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.income)}
              </span>
            </div>
          </div>

          <div className="stat-card expense">
            <TrendingDown className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Despesas</span>
              <span className="stat-value mono">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.expense)}
              </span>
            </div>
          </div>

          <div className={`stat-card balance ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
            <Wallet className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Saldo</span>
              <span className="stat-value mono">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.balance)}
              </span>
            </div>
          </div>
        </div>

        <div className="main-grid">
          <section className="card">
            <div className="card-header">
              <h2>Transações</h2>
              <button onClick={() => setShowAddTransaction(true)} className="btn-add">
                <Plus size={18} />
                Nova
              </button>
            </div>

            <div className="transactions-list">
              {transactions.length === 0 ? (
                <p className="empty-state">Nenhuma transação ainda</p>
              ) : (
                transactions.map(t => (
                  <div key={t.id} className="transaction-item">
                    <div className="transaction-info">
                      <span className="transaction-desc">{t.description}</span>
                      <span className="transaction-meta mono">
                        {t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="transaction-actions">
                      <span className={`transaction-amount mono ${t.type}`}>
                        {t.type === 'income' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                      </span>
                      <button onClick={() => deleteTransaction(t.id)} className="btn-delete">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-header">
              <h2>Metas</h2>
              <button onClick={() => setShowAddGoal(true)} className="btn-add">
                <Target size={18} />
                Nova
              </button>
            </div>

            <div className="goals-list">
              {goals.length === 0 ? (
                <p className="empty-state">Nenhuma meta definida</p>
              ) : (
                goals.map(g => {
                  const progress = Math.min((g.current / g.target) * 100, 100);
                  return (
                    <div key={g.id} className="goal-item">
                      <div className="goal-header">
                        <span className="goal-name">{g.name}</span>
                        <span className="goal-progress mono">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.current)} / {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(g.target)}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="goal-actions">
                        <button
                          onClick={() => {
                            const value = prompt('Quanto você já economizou?', g.current);
                            if (value !== null) updateGoal(g.id, value);
                          }}
                          className="btn-secondary"
                        >
                          Atualizar
                        </button>
                        <button onClick={() => deleteGoal(g.id)} className="btn-delete-goal">
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {showAddTransaction && (
        <Modal onClose={() => setShowAddTransaction(false)}>
          <h2>Nova Transação</h2>
          <form onSubmit={addTransaction} className="modal-form">
            <label>
              Tipo
              <select name="type" required>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </label>
            <label>
              Descrição
              <input type="text" name="description" required />
            </label>
            <label>
              Valor (R$)
              <input type="number" step="0.01" name="amount" required />
            </label>
            <label>
              Categoria
              <input type="text" name="category" required />
            </label>
            <label>
              Data
              <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required />
            </label>
            <button type="submit" className="btn-primary">Adicionar</button>
          </form>
        </Modal>
      )}

      {showAddGoal && (
        <Modal onClose={() => setShowAddGoal(false)}>
          <h2>Nova Meta</h2>
          <form onSubmit={addGoal} className="modal-form">
            <label>
              Nome da meta
              <input type="text" name="name" required />
            </label>
            <label>
              Valor alvo (R$)
              <input type="number" step="0.01" name="target" required />
            </label>
            <label>
              Valor atual (R$)
              <input type="number" step="0.01" name="current" defaultValue="0" />
            </label>
            <button type="submit" className="btn-primary">Criar Meta</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
}

export default App;
