import fetch from 'node-fetch';
import { get, run, all } from './database.js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const USER_EMAIL = process.env.BOT_USER_EMAIL;

// Estado temporário dos usuários (sessão)
const userSessions = {};

// ==================== TELEGRAM API ====================
const sendMessage = async (chatId, text, options = {}) => {
  await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...options }),
  });
};

const sendKeyboard = async (chatId, text, buttons) => {
  await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId, text, parse_mode: 'Markdown',
      reply_markup: { keyboard: buttons, resize_keyboard: true, one_time_keyboard: true },
    }),
  });
};

const sendInlineKeyboard = async (chatId, text, buttons) => {
  await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId, text, parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons },
    }),
  });
};

// ==================== HELPERS ====================
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const getUser = async () => {
  return await get('SELECT * FROM users WHERE email = ?', [USER_EMAIL]);
};

const parseAmount = (text) => {
  const clean = text.replace(/[R$\s]/g, '').replace(',', '.');
  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
};

const detectCategory = (text) => {
  const t = text.toLowerCase();
  if (/mercado|supermercado|feira|hortifruti|padaria|açougue/.test(t)) return 'Alimentação';
  if (/restaurante|lanche|pizza|hamburguer|ifood|delivery|comida|refeição/.test(t)) return 'Alimentação';
  if (/uber|99|táxi|taxi|gasolina|combustível|estacion|ônibus|metrô|transporte/.test(t)) return 'Transporte';
  if (/farmácia|remédio|médico|consulta|exame|hospital|plano de saúde/.test(t)) return 'Saúde';
  if (/netflix|spotify|amazon|disney|hbo|streaming|cinema|teatro|show/.test(t)) return 'Entretenimento';
  if (/roupa|calçado|sapato|loja|shopping/.test(t)) return 'Vestuário';
  if (/luz|água|internet|telefone|aluguel|condomínio|iptu/.test(t)) return 'Moradia';
  if (/escola|faculdade|curso|livro|material/.test(t)) return 'Educação';
  if (/salário|pagamento|freelance|trabalho/.test(t)) return 'Salário';
  return 'Outros';
};

// Parseia mensagens como "gastei 50 no mercado" ou "recebi 1000 de salário"
const parseExpenseMessage = (text) => {
  const t = text.toLowerCase().trim();

  // Padrões de despesa: "gastei 50 no mercado", "50 reais mercado", "mercado 50"
  const expensePatterns = [
    /(?:gastei|paguei|comprei|gasto)\s+(?:r\$\s*)?(\d+[.,]?\d*)\s+(?:no|na|em|de|com|reais|r\$)?\s*(.+)/i,
    /(?:r\$\s*)?(\d+[.,]?\d*)\s+(?:reais\s+)?(?:no|na|em|de|com)\s+(.+)/i,
    /(.+)\s+(?:r\$\s*)?(\d+[.,]?\d*)/i,
  ];

  // Padrões de receita: "recebi 1000 de salário", "entrou 500"
  const incomePatterns = [
    /(?:recebi|entrou|ganhei|recebimento)\s+(?:r\$\s*)?(\d+[.,]?\d*)\s*(?:de|do|da|reais)?\s*(.+)?/i,
  ];

  for (const pattern of incomePatterns) {
    const m = t.match(pattern);
    if (m) {
      const amount = parseAmount(m[1]);
      if (amount) return { type: 'income', amount, description: m[2]?.trim() || 'Receita', category: detectCategory(t) };
    }
  }

  for (const pattern of expensePatterns) {
    const m = t.match(pattern);
    if (m) {
      const amount = parseAmount(m[1]) || parseAmount(m[2]);
      const desc = parseAmount(m[1]) ? m[2]?.trim() : m[1]?.trim();
      if (amount && desc) return { type: 'expense', amount, description: desc, category: detectCategory(t) };
    }
  }

  return null;
};

// ==================== HANDLERS ====================
const handleStart = async (chatId, firstName) => {
  const user = await getUser();
  if (!user) {
    return sendMessage(chatId, `❌ Usuário não configurado no bot.\n\nFale com o administrador.`);
  }

  userSessions[chatId] = { userId: user.id, step: 'idle' };

  await sendKeyboard(chatId,
    `👋 Olá, *${firstName}*! Sou seu assistente financeiro.\n\nO que deseja fazer?`,
    [
      ['💸 Lançar Despesa', '💰 Lançar Receita'],
      ['📊 Ver Resumo', '🎯 Ver Metas'],
      ['✈️ Ver Viagens', '📋 Ver Contas Fixas'],
    ]
  );
};

const handleResumo = async (chatId, userId) => {
  const incomeResult = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = "income"', [userId]
  );
  const expenseResult = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = "expense"', [userId]
  );

  // Este mês
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const monthIncome = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = "income" AND date >= ?',
    [userId, firstDay]
  );
  const monthExpense = await get(
    'SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = "expense" AND date >= ?',
    [userId, firstDay]
  );

  const balance = incomeResult.total - expenseResult.total;
  const monthBalance = monthIncome.total - monthExpense.total;

  const msg = `📊 *Resumo Financeiro*\n\n` +
    `*Este mês:*\n` +
    `💰 Receitas: ${fmt(monthIncome.total)}\n` +
    `💸 Despesas: ${fmt(monthExpense.total)}\n` +
    `${monthBalance >= 0 ? '✅' : '❌'} Saldo do mês: *${fmt(monthBalance)}*\n\n` +
    `*Total geral:*\n` +
    `👛 Saldo total: *${fmt(balance)}*`;

  await sendKeyboard(chatId, msg, [
    ['💸 Lançar Despesa', '💰 Lançar Receita'],
    ['📊 Ver Resumo', '🎯 Ver Metas'],
  ]);
};

const handleMetas = async (chatId, userId) => {
  const goals = await all('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  if (goals.length === 0) return sendMessage(chatId, '🎯 Nenhuma meta cadastrada ainda.\n\nCrie metas no app!');

  let msg = '🎯 *Suas Metas:*\n\n';
  goals.forEach(g => {
    const pct = Math.min((g.current / g.target) * 100, 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
    const done = pct >= 100;
    msg += `${done ? '✅' : '🎯'} *${g.name}*\n`;
    msg += `${bar} ${pct}%\n`;
    msg += `${fmt(g.current)} de ${fmt(g.target)}\n\n`;
  });

  await sendMessage(chatId, msg);
};

const handleUltimasTransacoes = async (chatId, userId) => {
  const txs = await all(
    'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, created_at DESC LIMIT 5', [userId]
  );
  if (txs.length === 0) return sendMessage(chatId, '📋 Nenhuma transação ainda.');

  let msg = '📋 *Últimas 5 transações:*\n\n';
  txs.forEach(t => {
    const emoji = t.type === 'income' ? '💰' : '💸';
    const sign = t.type === 'income' ? '+' : '-';
    msg += `${emoji} ${t.description}\n`;
    msg += `   ${sign}${fmt(t.amount)} • ${t.category}\n\n`;
  });

  await sendMessage(chatId, msg);
};

// Fluxo de lançamento manual
const startExpenseFlow = async (chatId, type) => {
  userSessions[chatId] = { ...userSessions[chatId], step: 'awaiting_description', pendingType: type };
  const emoji = type === 'expense' ? '💸' : '💰';
  await sendMessage(chatId, `${emoji} *${type === 'expense' ? 'Nova Despesa' : 'Nova Receita'}*\n\nQual a descrição? (ex: Mercado, Salário...)`);
};

const handleDescription = async (chatId, text) => {
  userSessions[chatId].pendingDescription = text;
  userSessions[chatId].step = 'awaiting_amount';
  await sendMessage(chatId, `💲 Qual o valor? (ex: 50, 150.90, R$ 200)`);
};

const handleAmountStep = async (chatId, text) => {
  const amount = parseAmount(text);
  if (!amount || amount <= 0) return sendMessage(chatId, '❌ Valor inválido. Tente novamente: (ex: 50, 150.90)');

  userSessions[chatId].pendingAmount = amount;
  userSessions[chatId].step = 'awaiting_category';

  const cats = userSessions[chatId].pendingType === 'expense'
    ? [['🍔 Alimentação', '🚗 Transporte'], ['💊 Saúde', '📚 Educação'], ['🎮 Entretenimento', '👕 Vestuário'], ['🏠 Moradia', '📦 Outros']]
    : [['💼 Salário', '💻 Freelance'], ['📈 Investimento', '🎁 Presente'], ['📦 Outros']];

  await sendKeyboard(chatId, `📂 Qual a categoria?`, cats);
};

const handleCategory = async (chatId, text) => {
  // Remove emoji prefix if present
  const category = text.replace(/^[^\w]+/, '').trim();
  const session = userSessions[chatId];
  const today = new Date().toISOString().split('T')[0];

  await run(
    'INSERT INTO transactions (user_id, type, description, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)',
    [session.userId, session.pendingType, session.pendingDescription, session.pendingAmount, category, today]
  );

  const emoji = session.pendingType === 'expense' ? '💸' : '💰';
  const sign = session.pendingType === 'expense' ? '-' : '+';

  await sendKeyboard(chatId,
    `${emoji} *Lançado com sucesso!*\n\n` +
    `📝 ${session.pendingDescription}\n` +
    `💲 ${sign}${fmt(session.pendingAmount)}\n` +
    `📂 ${category}\n` +
    `📅 Hoje`,
    [
      ['💸 Lançar Despesa', '💰 Lançar Receita'],
      ['📊 Ver Resumo', '🎯 Ver Metas'],
    ]
  );

  userSessions[chatId].step = 'idle';
  delete userSessions[chatId].pendingType;
  delete userSessions[chatId].pendingDescription;
  delete userSessions[chatId].pendingAmount;
};

// Lançamento rápido por texto natural
const handleQuickLaunch = async (chatId, userId, parsed) => {
  const today = new Date().toISOString().split('T')[0];
  await run(
    'INSERT INTO transactions (user_id, type, description, amount, category, date) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, parsed.type, parsed.description, parsed.amount, parsed.category, today]
  );

  const emoji = parsed.type === 'expense' ? '💸' : '💰';
  const sign = parsed.type === 'expense' ? '-' : '+';

  await sendKeyboard(chatId,
    `${emoji} *Registrado automaticamente!*\n\n` +
    `📝 ${parsed.description}\n` +
    `💲 ${sign}${fmt(parsed.amount)}\n` +
    `📂 ${parsed.category}\n` +
    `📅 Hoje\n\n` +
    `_Categoria detectada automaticamente. Corrija no app se necessário._`,
    [
      ['💸 Lançar Despesa', '💰 Lançar Receita'],
      ['📊 Ver Resumo', '🎯 Ver Metas'],
    ]
  );
};

// Foto/comprovante
const handlePhoto = async (chatId, userId) => {
  userSessions[chatId] = { ...userSessions[chatId], step: 'awaiting_photo_description' };
  await sendMessage(chatId,
    `📸 *Comprovante recebido!*\n\n` +
    `Agora me diga o valor e descrição:\n` +
    `Ex: _"50 reais mercado"_ ou _"gastei 120 no hotel"`
  );
};

// ==================== PROCESSADOR PRINCIPAL ====================
export const processUpdate = async (update) => {
  try {
    const message = update.message || update.edited_message;
    if (!message) return;

    const chatId = message.chat.id;
    const text = message.text?.trim() || '';
    const firstName = message.from?.first_name || 'Lucas';

    // Buscar/criar sessão
    if (!userSessions[chatId]) {
      const user = await getUser();
      if (user) userSessions[chatId] = { userId: user.id, step: 'idle' };
    }

    const session = userSessions[chatId];
    const userId = session?.userId;

    // Foto recebida
    if (message.photo) {
      await handlePhoto(chatId, userId);
      return;
    }

    if (!text) return;

    // Comandos
    if (text === '/start' || text === '/menu') {
      return handleStart(chatId, firstName);
    }

    // Botões do teclado
    if (text === '📊 Ver Resumo' || text === '/resumo') return handleResumo(chatId, userId);
    if (text === '🎯 Ver Metas' || text === '/metas') return handleMetas(chatId, userId);
    if (text === '📋 Ver Últimas' || text === '/ultimas') return handleUltimasTransacoes(chatId, userId);
    if (text === '💸 Lançar Despesa') return startExpenseFlow(chatId, 'expense');
    if (text === '💰 Lançar Receita') return startExpenseFlow(chatId, 'income');
    if (text === '✈️ Ver Viagens') {
      return sendMessage(chatId, '✈️ Gerencie suas viagens diretamente no app!\n\n🌐 Acesse: https://gregarious-purpose-production.up.railway.app');
    }
    if (text === '📋 Ver Contas Fixas') {
      const msg = '📋 *Contas fixas* são gerenciadas no app.\n\n🌐 Acesse: https://gregarious-purpose-production.up.railway.app';
      return sendMessage(chatId, msg);
    }

    // Fluxo passo a passo
    if (session?.step === 'awaiting_description') return handleDescription(chatId, text);
    if (session?.step === 'awaiting_amount') return handleAmountStep(chatId, text);
    if (session?.step === 'awaiting_category') return handleCategory(chatId, text);

    // Descrição após foto
    if (session?.step === 'awaiting_photo_description') {
      const parsed = parseExpenseMessage(text);
      if (parsed) {
        userSessions[chatId].step = 'idle';
        return handleQuickLaunch(chatId, userId, parsed);
      }
      userSessions[chatId].step = 'idle';
      await startExpenseFlow(chatId, 'expense');
      return;
    }

    // Lançamento rápido por texto natural
    const parsed = parseExpenseMessage(text);
    if (parsed) return handleQuickLaunch(chatId, userId, parsed);

    // Help
    if (text === '/ajuda' || text === 'ajuda' || text === 'help') {
      return sendMessage(chatId,
        `🤖 *Como usar o bot:*\n\n` +
        `*Lançamento rápido (texto natural):*\n` +
        `• _"gastei 50 no mercado"_\n` +
        `• _"paguei 120 no uber"_\n` +
        `• _"recebi 3000 de salário"_\n` +
        `• _"comprei roupa 89 reais"_\n\n` +
        `*Foto de comprovante:*\n` +
        `• Mande a foto e depois diga o valor\n\n` +
        `*Comandos:*\n` +
        `/menu - Menu principal\n` +
        `/resumo - Ver saldo e resumo\n` +
        `/metas - Ver suas metas\n` +
        `/ultimas - Últimas transações\n` +
        `/ajuda - Esta mensagem`
      );
    }

    // Não entendeu
    await sendKeyboard(chatId,
      `🤔 Não entendi. Tente:\n• _"gastei 50 no mercado"_\n• _"recebi 1000 de salário"_\n\nOu escolha uma opção:`,
      [
        ['💸 Lançar Despesa', '💰 Lançar Receita'],
        ['📊 Ver Resumo', '🎯 Ver Metas'],
      ]
    );

  } catch (err) {
    console.error('Bot error:', err);
  }
};

// ==================== POLLING (desenvolvimento) ====================
let lastUpdateId = 0;

export const startPolling = async () => {
  console.log('🤖 Bot Telegram iniciado!');
  while (true) {
    try {
      const res = await fetch(`${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
      const data = await res.json();
      if (data.ok && data.result?.length) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          await processUpdate(update);
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
};
