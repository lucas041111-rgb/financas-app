import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ==================== ICONS ====================
const icons = {
  dashboard: '📊', transactions: '💳', bills: '📋', goals: '🎯',
  logout: '→', add: '+', delete: '×', edit: '✏️',
  income: '💰', expense: '💸', balance: '👛',
  food: '🍔', transport: '🚗', health: '💊', education: '📚',
  entertainment: '🎮', clothing: '👕', home: '🏠', other: '📦',
  salary: '💼', freelance: '💻', investment: '📈', gift: '🎁',
  electricity: '⚡', water: '💧', internet: '📡', phone: '📱',
  rent: '🏠', insurance: '🛡️', streaming: '📺', gym: '💪',
};

const categoryIcons = {
  'Alimentação': '🍔', 'Transporte': '🚗', 'Saúde': '💊',
  'Educação': '📚', 'Entretenimento': '🎮', 'Vestuário': '👕',
  'Moradia': '🏠', 'Outros': '📦', 'Salário': '💼',
  'Freelance': '💻', 'Investimento': '📈', 'Presente': '🎁',
};

const billIcons = {
  'Aluguel': '🏠', 'Luz': '⚡', 'Água': '💧', 'Internet': '📡',
  'Telefone': '📱', 'Seguro': '🛡️', 'Streaming': '📺', 'Academia': '💪',
  'Outros': '📦',
};

const COLORS = ['#00ff88', '#ff3366', '#00ccff', '#ffaa00', '#aa00ff', '#ff6600', '#00ffcc', '#ff0099'];

// ==================== HELPERS ====================
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

// ==================== API ====================
const api = async (path, options = {}, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) throw await res.json();
  return res.json();
};

// ==================== COMPONENTS ====================

const StatCard = ({ label, value, icon, color, sub }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'all 0.2s', cursor: 'default',
  }}
    onMouseEnter={e => e.currentTarget.style.border = `1px solid ${color}40`}
    onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.07)'}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <span style={{ fontSize: 11, color: '#666', letterSpacing: 2, textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: 24, background: `${color}20`, padding: '6px 10px', borderRadius: 10 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'Fira Code, monospace' }}>{fmt(value)}</div>
    {sub && <div style={{ fontSize: 12, color: '#555' }}>{sub}</div>}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  }} onClick={e => e.target === e.currentTarget && onClose()}>
    <div style={{
      background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 20, padding: 32, width: '100%', maxWidth: 480,
      maxHeight: '90vh', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>{title}</h2>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666',
          width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 18,
        }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const Input = ({ label, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 12, color: '#666', letterSpacing: 1 }}>{label}</label>}
    <input {...props} style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14,
      outline: 'none', width: '100%', boxSizing: 'border-box',
      ...props.style,
    }} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {label && <label style={{ fontSize: 12, color: '#666', letterSpacing: 1 }}>{label}</label>}
    <select {...props} style={{
      background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 14,
      outline: 'none', width: '100%', boxSizing: 'border-box',
      ...props.style,
    }}>{children}</select>
  </div>
);

const Btn = ({ children, variant = 'primary', ...props }) => (
  <button {...props} style={{
    background: variant === 'primary' ? '#00ff88' : variant === 'danger' ? '#ff3366' : 'rgba(255,255,255,0.05)',
    color: variant === 'primary' ? '#000' : '#fff',
    border: 'none', borderRadius: 10, padding: '12px 20px',
    fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
    ...props.style,
  }}>{children}</button>
);

// ==================== PAGES ====================

const Dashboard = ({ transactions, bills, stats }) => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  // Monthly chart data (last 6 months)
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const filtered = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === m && td.getFullYear() === y;
    });
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { name: months[m], Receitas: income, Despesas: expense, Saldo: income - expense };
  });

  // Category pie data
  const catMap = {};
  transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === thisMonth)
    .forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // This month summary
  const monthTx = transactions.filter(t => {
    const td = new Date(t.date);
    return td.getMonth() === thisMonth && td.getFullYear() === thisYear;
  });
  const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const billsTotal = bills.filter(b => b.active).reduce((s, b) => s + b.amount, 0);
  const freeAfterBills = monthIncome - billsTotal;
  const monthBalance = monthIncome - monthExpense;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: '#111', border: '1px solid #333', borderRadius: 10, padding: '12px 16px' }}>
        <p style={{ margin: '0 0 8px', color: '#888', fontSize: 12 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ margin: '2px 0', color: p.color, fontSize: 13, fontFamily: 'Fira Code' }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Month header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, color: '#fff' }}>Dashboard</h2>
          <p style={{ margin: '4px 0 0', color: '#555', fontSize: 13 }}>
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <StatCard label="Receitas do Mês" value={monthIncome} icon="💰" color="#00ff88"
          sub={`${monthTx.filter(t => t.type === 'income').length} transações`} />
        <StatCard label="Despesas do Mês" value={monthExpense} icon="💸" color="#ff3366"
          sub={`${monthTx.filter(t => t.type === 'expense').length} transações`} />
        <StatCard label="Saldo do Mês" value={monthBalance} icon="👛"
          color={monthBalance >= 0 ? '#00ff88' : '#ff3366'}
          sub={monthBalance >= 0 ? 'Você está no positivo!' : 'Atenção: saldo negativo'} />
        <StatCard label="Contas Fixas" value={billsTotal} icon="📋" color="#ffaa00"
          sub={`Sobra ${fmt(freeAfterBills)} após contas`} />
      </div>

      {/* Monthly bar chart */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 24,
      }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 15, color: '#aaa' }}>Receitas × Despesas (6 meses)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Receitas" fill="#00ff88" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ff3366" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Area chart - saldo */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: 24,
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, color: '#aaa' }}>Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Saldo" stroke="#00ff88" fill="url(#balGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: 24,
        }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 15, color: '#aaa' }}>Gastos por Categoria</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend formatter={(v) => `${categoryIcons[v] || '📦'} ${v}`}
                  wrapperStyle={{ fontSize: 11, color: '#888' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
              Nenhuma despesa este mês
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 24,
      }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#aaa' }}>Últimas Transações</h3>
        {transactions.slice(0, 5).length === 0 ? (
          <p style={{ color: '#333', textAlign: 'center', padding: '20px 0' }}>Nenhuma transação ainda</p>
        ) : (
          transactions.slice(0, 5).map(t => (
            <div key={t.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontSize: 20, background: 'rgba(255,255,255,0.05)',
                  padding: '8px', borderRadius: 10,
                }}>{categoryIcons[t.category] || '📦'}</span>
                <div>
                  <div style={{ fontSize: 14, color: '#ddd' }}>{t.description}</div>
                  <div style={{ fontSize: 12, color: '#555' }}>{t.category} · {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
              <span style={{
                fontFamily: 'Fira Code', fontWeight: 600, fontSize: 15,
                color: t.type === 'income' ? '#00ff88' : '#ff3366',
              }}>
                {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ==================== TRANSACTIONS PAGE ====================
const expenseCategories = ['Alimentação', 'Transporte', 'Saúde', 'Educação', 'Entretenimento', 'Vestuário', 'Moradia', 'Outros'];
const incomeCategories = ['Salário', 'Freelance', 'Investimento', 'Presente', 'Outros'];

const TransactionsPage = ({ transactions, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ type: 'expense', description: '', amount: '', category: 'Alimentação', date: new Date().toISOString().split('T')[0] });

  const filtered = transactions.filter(t => filter === 'all' || t.type === filter);

  const handleSubmit = async () => {
    if (!form.description || !form.amount || !form.date) return alert('Preencha todos os campos');
    await onAdd(form);
    setShowModal(false);
    setForm({ type: 'expense', description: '', amount: '', category: 'Alimentação', date: new Date().toISOString().split('T')[0] });
  };

  const cats = form.type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Transações</h2>
        <Btn onClick={() => setShowModal(true)}>+ Nova</Btn>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[['all', 'Todas'], ['income', '💰 Receitas'], ['expense', '💸 Despesas']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} style={{
            background: filter === v ? (v === 'income' ? '#00ff8820' : v === 'expense' ? '#ff336620' : '#ffffff10') : 'transparent',
            border: `1px solid ${filter === v ? (v === 'income' ? '#00ff88' : v === 'expense' ? '#ff3366' : '#444') : '#222'}`,
            color: filter === v ? '#fff' : '#555', borderRadius: 8, padding: '8px 16px',
            cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
          }}>{l}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#333' }}>Nenhuma transação</div>
        ) : filtered.map(t => (
          <div key={t.id} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{
                fontSize: 22, background: t.type === 'income' ? '#00ff8815' : '#ff336615',
                padding: '8px', borderRadius: 10,
              }}>{categoryIcons[t.category] || '📦'}</span>
              <div>
                <div style={{ fontSize: 14, color: '#ddd', fontWeight: 500 }}>{t.description}</div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                  {t.category} · {new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{
                fontFamily: 'Fira Code', fontWeight: 700, fontSize: 16,
                color: t.type === 'income' ? '#00ff88' : '#ff3366',
              }}>
                {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
              </span>
              <button onClick={() => onDelete(t.id)} style={{
                background: 'rgba(255,51,102,0.1)', border: 'none', color: '#ff3366',
                width: 28, height: 28, borderRadius: 7, cursor: 'pointer', fontSize: 14,
              }}>×</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal title="Nova Transação" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['expense', '💸 Despesa'], ['income', '💰 Receita']].map(([v, l]) => (
                <button key={v} onClick={() => setForm(f => ({ ...f, type: v, category: v === 'expense' ? 'Alimentação' : 'Salário' }))} style={{
                  flex: 1, background: form.type === v ? (v === 'expense' ? '#ff336620' : '#00ff8820') : 'transparent',
                  border: `1px solid ${form.type === v ? (v === 'expense' ? '#ff3366' : '#00ff88') : '#333'}`,
                  color: form.type === v ? '#fff' : '#555', borderRadius: 10, padding: '10px',
                  cursor: 'pointer', fontSize: 14, transition: 'all 0.2s',
                }}>{l}</button>
              ))}
            </div>
            <Input label="DESCRIÇÃO" placeholder="Ex: Mercado, Salário..." value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Input label="VALOR (R$)" type="number" placeholder="0,00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Select label="CATEGORIA" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {cats.map(c => <option key={c}>{categoryIcons[c]} {c}</option>)}
            </Select>
            <Input label="DATA" type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <Btn onClick={handleSubmit} style={{ marginTop: 8 }}>Adicionar Transação</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==================== BILLS PAGE ====================
const billCategories = ['Aluguel', 'Luz', 'Água', 'Internet', 'Telefone', 'Seguro', 'Streaming', 'Academia', 'Outros'];

const BillsPage = ({ bills, onAdd, onDelete, onToggle }) => {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', category: 'Outros', dueDay: '1' });

  const active = bills.filter(b => b.active);
  const inactive = bills.filter(b => !b.active);
  const total = active.reduce((s, b) => s + b.amount, 0);

  const handleSubmit = async () => {
    if (!form.name || !form.amount) return alert('Preencha todos os campos');
    await onAdd({ ...form, amount: parseFloat(form.amount), dueDay: parseInt(form.dueDay), active: true });
    setShowModal(false);
    setForm({ name: '', amount: '', category: 'Outros', dueDay: '1' });
  };

  const BillCard = ({ bill }) => (
    <div style={{
      background: bill.active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)',
      border: `1px solid ${bill.active ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)'}`,
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      opacity: bill.active ? 1 : 0.5, transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          fontSize: 22, background: bill.active ? '#ffaa0020' : 'rgba(255,255,255,0.03)',
          padding: '8px', borderRadius: 10,
        }}>{billIcons[bill.category] || '📦'}</span>
        <div>
          <div style={{ fontSize: 14, color: bill.active ? '#ddd' : '#555', fontWeight: 500 }}>{bill.name}</div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 2 }}>
            {bill.category} · Vence dia {bill.dueDay}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontFamily: 'Fira Code', fontWeight: 700, fontSize: 16,
          color: bill.active ? '#ffaa00' : '#444',
        }}>{fmt(bill.amount)}</span>
        <button onClick={() => onToggle(bill.id)} style={{
          background: bill.active ? '#00ff8810' : 'rgba(255,255,255,0.05)',
          border: 'none', color: bill.active ? '#00ff88' : '#444',
          padding: '6px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600,
        }}>{bill.active ? 'ATIVA' : 'INATIVA'}</button>
        <button onClick={() => onDelete(bill.id)} style={{
          background: 'rgba(255,51,102,0.1)', border: 'none', color: '#ff3366',
          width: 28, height: 28, borderRadius: 7, cursor: 'pointer', fontSize: 14,
        }}>×</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Contas Fixas</h2>
          <p style={{ margin: '4px 0 0', color: '#555', fontSize: 13 }}>Total mensal: <span style={{ color: '#ffaa00', fontFamily: 'Fira Code' }}>{fmt(total)}</span></p>
        </div>
        <Btn onClick={() => setShowModal(true)}>+ Nova Conta</Btn>
      </div>

      {/* Summary bar */}
      <div style={{
        background: 'rgba(255,170,0,0.05)', border: '1px solid rgba(255,170,0,0.2)',
        borderRadius: 12, padding: '16px 20px',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#666', letterSpacing: 1 }}>CONTAS ATIVAS</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ffaa00', fontFamily: 'Fira Code' }}>{active.length}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#666', letterSpacing: 1 }}>TOTAL MENSAL</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ffaa00', fontFamily: 'Fira Code' }}>{fmt(total)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#666', letterSpacing: 1 }}>POR DIA</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ffaa00', fontFamily: 'Fira Code' }}>{fmt(total / 30)}</div>
        </div>
      </div>

      {active.length === 0 && inactive.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#333' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div>Nenhuma conta fixa cadastrada</div>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#555', letterSpacing: 1, marginBottom: 4 }}>CONTAS ATIVAS ({active.length})</div>
              {active.map(b => <BillCard key={b.id} bill={b} />)}
            </div>
          )}
          {inactive.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, color: '#444', letterSpacing: 1, marginBottom: 4 }}>INATIVAS ({inactive.length})</div>
              {inactive.map(b => <BillCard key={b.id} bill={b} />)}
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal title="Nova Conta Fixa" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="NOME DA CONTA" placeholder="Ex: Netflix, CEMIG, Internet..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="VALOR MENSAL (R$)" type="number" placeholder="0,00" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            <Select label="CATEGORIA" value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {billCategories.map(c => <option key={c}>{billIcons[c]} {c}</option>)}
            </Select>
            <Input label="DIA DO VENCIMENTO" type="number" min="1" max="31" placeholder="Ex: 10" value={form.dueDay}
              onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))} />
            <Btn onClick={handleSubmit} style={{ marginTop: 8 }}>Adicionar Conta</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==================== GOALS PAGE ====================
const GoalsPage = ({ goals, onAdd, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form, setForm] = useState({ name: '', target: '', current: '0' });
  const [updateAmount, setUpdateAmount] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.target) return alert('Preencha todos os campos');
    await onAdd({ name: form.name, target: parseFloat(form.target), current: parseFloat(form.current) || 0 });
    setShowModal(false);
    setForm({ name: '', target: '', current: '0' });
  };

  const handleUpdate = async () => {
    const val = parseFloat(updateAmount);
    if (isNaN(val)) return;
    await onUpdate(editingGoal.id, Math.min(editingGoal.current + val, editingGoal.target));
    setEditingGoal(null);
    setUpdateAmount('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Metas</h2>
        <Btn onClick={() => setShowModal(true)}>+ Nova Meta</Btn>
      </div>

      {goals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#333' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div>Nenhuma meta definida ainda</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {goals.map(g => {
            const pct = Math.min((g.current / g.target) * 100, 100);
            const done = pct >= 100;
            return (
              <div key={g.id} style={{
                background: done ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${done ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#ddd' }}>{done ? '✅ ' : '🎯 '}{g.name}</div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>
                      Meta: <span style={{ color: '#888', fontFamily: 'Fira Code' }}>{fmt(g.target)}</span>
                    </div>
                  </div>
                  <button onClick={() => onDelete(g.id)} style={{
                    background: 'rgba(255,51,102,0.1)', border: 'none', color: '#ff3366',
                    width: 28, height: 28, borderRadius: 7, cursor: 'pointer', fontSize: 14,
                  }}>×</button>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: 'Fira Code', fontSize: 18, fontWeight: 700, color: done ? '#00ff88' : '#fff' }}>
                      {fmt(g.current)}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: done ? '#00ff88' : '#aaa' }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 100, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%', borderRadius: 100, transition: 'width 0.5s ease',
                      background: done ? '#00ff88' : `linear-gradient(90deg, #00ff88, ${pct > 60 ? '#00ff88' : '#ffaa00'})`,
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#444', marginTop: 6 }}>
                    Faltam {fmt(Math.max(g.target - g.current, 0))}
                  </div>
                </div>

                {!done && (
                  <button onClick={() => setEditingGoal(g)} style={{
                    background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
                    color: '#00ff88', borderRadius: 8, padding: '8px', cursor: 'pointer', fontSize: 13,
                  }}>+ Atualizar progresso</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal title="Nova Meta" onClose={() => setShowModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="NOME DA META" placeholder="Ex: Viagem, Reserva de emergência..." value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="VALOR ALVO (R$)" type="number" placeholder="0,00" value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
            <Input label="JÁ TENHO (R$)" type="number" placeholder="0,00" value={form.current}
              onChange={e => setForm(f => ({ ...f, current: e.target.value }))} />
            <Btn onClick={handleSubmit} style={{ marginTop: 8 }}>Criar Meta</Btn>
          </div>
        </Modal>
      )}

      {editingGoal && (
        <Modal title={`Atualizar: ${editingGoal.name}`} onClose={() => setEditingGoal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#555' }}>Progresso atual</div>
              <div style={{ fontFamily: 'Fira Code', fontSize: 24, fontWeight: 700, color: '#00ff88', margin: '4px 0' }}>
                {fmt(editingGoal.current)}
              </div>
              <div style={{ fontSize: 12, color: '#444' }}>de {fmt(editingGoal.target)}</div>
            </div>
            <Input label="VALOR A ADICIONAR (R$)" type="number" placeholder="0,00" value={updateAmount}
              onChange={e => setUpdateAmount(e.target.value)} />
            <Btn onClick={handleUpdate}>Salvar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==================== LOGIN ====================
const LoginPage = ({ onLogin }) => {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async () => {
    setLoading(true); setError('');
    try {
      const path = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login' ? { email: form.email, password: form.password } : form;
      const data = await api(path, { method: 'POST', body: JSON.stringify(body) });
      onLogin(data.token, data.user);
    } catch (e) {
      setError(e.error || 'Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#080808', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24, padding: 40,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: 6, color: '#00ff88', fontFamily: 'Outfit' }}>FINANÇAS</h1>
          <p style={{ margin: '8px 0 0', color: '#444', fontSize: 13 }}>Controle financeiro inteligente</p>
        </div>

        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {[['login', 'Entrar'], ['register', 'Registrar']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} style={{
              flex: 1, background: tab === v ? '#00ff88' : 'transparent',
              color: tab === v ? '#000' : '#555', border: 'none', borderRadius: 9,
              padding: '10px', cursor: 'pointer', fontWeight: 600, fontSize: 14, transition: 'all 0.2s',
            }}>{l}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' && (
            <Input placeholder="Seu nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          )}
          <Input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Input placeholder="Senha" type="password" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handle()} />
          {error && <div style={{ color: '#ff3366', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          <Btn onClick={handle} disabled={loading} style={{ marginTop: 8, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Carregando...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN APP ====================
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'transactions', label: 'Transações', icon: '💳' },
  { id: 'bills', label: 'Contas Fixas', icon: '📋' },
  { id: 'goals', label: 'Metas', icon: '🎯' },
];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));
  const [page, setPage] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [bills, setBills] = useState(JSON.parse(localStorage.getItem('bills') || '[]'));
  const [goals, setGoals] = useState([]);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

  const loadData = async () => {
    if (!token) return;
    try {
      const [tx, gs, st] = await Promise.all([
        api('/transactions', {}, token),
        api('/goals', {}, token),
        api('/transactions/stats', {}, token),
      ]);
      setTransactions(tx);
      setGoals(gs);
      setStats(st);
    } catch (e) {
      if (e.error === 'Token inválido') handleLogout();
    }
  };

  useEffect(() => { loadData(); }, [token]);
  useEffect(() => { localStorage.setItem('bills', JSON.stringify(bills)); }, [bills]);

  const handleLogin = (t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t); setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setToken(null); setUser(null); setTransactions([]); setGoals([]);
  };

  const addTransaction = async (form) => {
    await api('/transactions', { method: 'POST', body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) }, token);
    await loadData();
  };

  const deleteTransaction = async (id) => {
    await api(`/transactions/${id}`, { method: 'DELETE' }, token);
    await loadData();
  };

  const addGoal = async (g) => {
    await api('/goals', { method: 'POST', body: JSON.stringify(g) }, token);
    await loadData();
  };

  const updateGoal = async (id, current) => {
    await api(`/goals/${id}`, { method: 'PUT', body: JSON.stringify({ current }) }, token);
    await loadData();
  };

  const deleteGoal = async (id) => {
    await api(`/goals/${id}`, { method: 'DELETE' }, token);
    await loadData();
  };

  const addBill = (b) => setBills(prev => [...prev, { ...b, id: Date.now() }]);
  const deleteBill = (id) => setBills(prev => prev.filter(b => b.id !== id));
  const toggleBill = (id) => setBills(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));

  if (!token) return <LoginPage onLogin={handleLogin} />;

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#fff', fontFamily: 'Outfit, sans-serif', display: 'flex' }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column', padding: '28px 16px', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ marginBottom: 32, paddingLeft: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 4, color: '#00ff88' }}>FINANÇAS</div>
          <div style={{ fontSize: 12, color: '#444', marginTop: 4 }}>{user?.name}</div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setPage(item.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: page === item.id ? 'rgba(0,255,136,0.08)' : 'transparent',
              border: page === item.id ? '1px solid rgba(0,255,136,0.2)' : '1px solid transparent',
              color: page === item.id ? '#00ff88' : '#555',
              borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
              fontSize: 14, fontWeight: page === item.id ? 600 : 400, transition: 'all 0.2s',
              textAlign: 'left', width: '100%',
            }}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </nav>

        <button onClick={handleLogout} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'transparent', border: '1px solid transparent',
          color: '#333', borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
          fontSize: 14, transition: 'all 0.2s', textAlign: 'left', width: '100%',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ff3366'; e.currentTarget.style.background = 'rgba(255,51,102,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#333'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span>🚪</span> Sair
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', maxWidth: 1100 }}>
        {page === 'dashboard' && <Dashboard transactions={transactions} bills={bills} stats={stats} />}
        {page === 'transactions' && <TransactionsPage transactions={transactions} onAdd={addTransaction} onDelete={deleteTransaction} />}
        {page === 'bills' && <BillsPage bills={bills} onAdd={addBill} onDelete={deleteBill} onToggle={toggleBill} />}
        {page === 'goals' && <GoalsPage goals={goals} onAdd={addGoal} onUpdate={updateGoal} onDelete={deleteGoal} />}
      </div>
    </div>
  );
}
