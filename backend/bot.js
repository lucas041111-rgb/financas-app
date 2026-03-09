import fetch from 'node-fetch';
import { run, get, all } from './database.js';

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const USER_EMAIL = process.env.BOT_USER_EMAIL;
const API_BASE = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

const sessions = {};

// ==================== HELPERS ====================
const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);
const getUser = async () => get('SELECT * FROM users WHERE email = ?', [USER_EMAIL]);

const getContexto = async (userId) => {
  const now = new Date();
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const [incAll, expAll, incMes, expMes, txs, goals, cats] = await Promise.all([
    get('SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=? AND type="income"', [userId]),
    get('SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=? AND type="expense"', [userId]),
    get('SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=? AND type="income" AND date>=?', [userId, firstDay]),
    get('SELECT COALESCE(SUM(amount),0) as total FROM transactions WHERE user_id=? AND type="expense" AND date>=?', [userId, firstDay]),
    all('SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC,created_at DESC LIMIT 10', [userId]),
    all('SELECT * FROM goals WHERE user_id=? ORDER BY created_at DESC', [userId]),
    all('SELECT category, SUM(amount) as total FROM transactions WHERE user_id=? AND type="expense" AND date>=? GROUP BY category ORDER BY total DESC', [userId, firstDay]),
  ]);
  return {
    saldoTotal: incAll.total - expAll.total,
    receitasMes: incMes.total, despesasMes: expMes.total,
    saldoMes: incMes.total - expMes.total,
    ultimasTransacoes: txs, metas: goals, categoriasMes: cats,
  };
};

// ==================== TELEGRAM ====================
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
      reply_markup: { keyboard: buttons, resize_keyboard: true },
    }),
  });
};

const mainMenu = (chatId, text) => sendKeyboard(chatId, text, [
  ['💸 Lançar Despesa', '💰 Lançar Receita'],
  ['📊 Resumo', '🎯 Metas'],
  ['📋 Últimas Transações', '❓ Ajuda'],
]);

// ==================== GEMINI ====================
const askGemini = async (systemPrompt, userMessage, history = []) => {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
  });
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

const classifyMessage = async (text, ctx, history) => {
  const system = `Você é um assistente financeiro pessoal inteligente e amigável integrado a um app de finanças pessoais.
Responda SEMPRE em português brasileiro, de forma natural e com emojis.

CONTEXTO FINANCEIRO ATUAL DO USUÁRIO:
- Saldo total: ${fmt(ctx.saldoTotal)}
- Este mês - Receitas: ${fmt(ctx.receitasMes)} | Despesas: ${fmt(ctx.despesasMes)} | Saldo: ${fmt(ctx.saldoMes)}
- Últimas transações: ${JSON.stringify(ctx.ultimasTransacoes.slice(0,5).map(t=>({desc:t.description,valor:t.amount,tipo:t.type,cat:t.category,data:t.date})))}
- Metas: ${JSON.stringify(ctx.metas.map(g=>({nome:g.name,meta:g.target,atual:g.current,pct:((g.current/g.target)*100).toFixed(0)+'%'})))}
- Top gastos do mês: ${JSON.stringify(ctx.categoriasMes.slice(0,5))}

CATEGORIAS DISPONÍVEIS:
- Despesa: Alimentação, Transporte, Saúde, Educação, Entretenimento, Vestuário, Moradia, Outros
- Receita: Salário, Freelance, Investimento, Presente, Outros

INSTRUÇÕES:
1. Se a mensagem for um LANÇAMENTO (ex: "gastei 50 no mercado", "paguei uber 30", "recebi salário 3000"), retorne JSON:
{"intent":"lancamento","type":"expense"|"income","amount":número,"description":"string","category":"string","resposta":"confirmação amigável"}

2. Se for uma CONSULTA financeira (ex: "quanto gastei?", "estou bem?", "qual maior gasto?"), responda usando os dados reais e retorne JSON:
{"intent":"consulta","type":null,"amount":null,"description":null,"category":null,"resposta":"resposta detalhada com os dados reais"}

3. Se for CONVERSA geral, retorne JSON:
{"intent":"conversa","type":null,"amount":null,"description":null,"category":null,"resposta":"resposta amigável"}

IMPORTANTE: Retorne SOMENTE o JSON válido, sem markdown, sem explicações fora do JSON.`;

  const raw = await askGemini(system, text, history);
  if (!raw) return null;
  try {
    return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    return { intent: 'conversa', resposta: raw };
  }
};

const analyzePhoto = async (fileUrl) => {
  const imageRes = await fetch(fileUrl);
  const buffer = await imageRes.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: 'Analise este comprovante/recibo/nota fiscal. Extraia os dados e retorne SOMENTE JSON válido (sem markdown): {"amount": número_sem_formatação, "description": "estabelecimento ou descrição curta", "type": "expense", "category": "Alimentação"|"Transporte"|"Saúde"|"Entretenimento"|"Moradia"|"Outros", "confidence": "alta"|"média"|"baixa"}. Se não conseguir identificar o valor, retorne {"amount": null}.' },
          { inline_data: { mime_type: 'image/jpeg', data: base64 } },
        ],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 256 },
    }),
  });

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) return null;
  try {
    return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
  } catch { return null; }
};

// ==================== PROCESSADOR ====================
export const processUpdate = async (update) => {
  try {
    const message = update.message || update.edited_message;
    if (!message) return;

    const chatId = message.chat.id;
    const text = message.text?.trim() || '';
    const firstName = message.from?.first_name || 'Lucas';

    if (!sessions[chatId]) {
      const user = await getUser();
      if (user) sessions[chatId] = { userId: user.id, history: [] };
    }

    const session = sessions[chatId];
    if (!session) return sendMessage(chatId, '❌ Usuário não configurado.');
    const { userId } = session;

    // /start
    if (text === '/start' || text === '/menu') {
      session.history = [];
      return mainMenu(chatId,
        `👋 Olá, *${firstName}*! Sou seu assistente financeiro com IA 🤖\n\n` +
        `Pode falar naturalmente:\n` +
        `• _"gastei 45 no mercado"_\n` +
        `• _"quanto sobrou esse mês?"_\n` +
        `• _"estou indo bem nas finanças?"_\n` +
        `• 📸 Mande foto de comprovante!\n\n` +
        `O que deseja fazer?`
      );
    }

    if (text === '/limpar') {
      session.history = [];
      return mainMenu(chatId, '🧹 Histórico limpo!');
    }

    // Foto
    if (message.photo) {
      await sendMessage(chatId, '📸 Analisando comprovante com IA...');
      try {
        const fileId = message.photo[message.photo.length - 1].file_id;
        const fileRes = await fetch(`${API_BASE}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${fileData.result.file_path}`;
        const extracted = await analyzePhoto(fileUrl);

        if (extracted?.amount) {
          const today = new Date().toISOString().split('T')[0];
          await run(
            'INSERT INTO transactions (user_id, type, description, amount, category, date) VALUES (?,?,?,?,?,?)',
            [userId, extracted.type || 'expense', extracted.description || 'Comprovante', extracted.amount, extracted.category || 'Outros', today]
          );
          return mainMenu(chatId,
            `✅ *Comprovante registrado!*\n\n` +
            `📝 ${extracted.description}\n` +
            `💲 -${fmt(extracted.amount)}\n` +
            `📂 ${extracted.category}\n` +
            `📅 Hoje\n\n` +
            `_Confiança da leitura: ${extracted.confidence || 'média'}. Corrija no app se necessário._`
          );
        } else {
          session.history.push({ role: 'user', parts: [{ text: '[usuário enviou foto de comprovante mas não foi possível ler os dados]' }] });
          return sendMessage(chatId, `📸 Recebi a foto, mas não consegui ler os dados claramente.\n\nMe diga o valor:\n_Ex: "gastei 50 no mercado"_`);
        }
      } catch (e) {
        console.error('Photo error:', e);
        return sendMessage(chatId, '❌ Erro ao analisar imagem. Me diga o valor manualmente.');
      }
    }

    // Botões fixos
    if (text === '📊 Resumo') {
      const ctx = await getContexto(userId);
      const topCats = ctx.categoriasMes.slice(0, 3).map(c => `• ${c.category}: ${fmt(c.total)}`).join('\n');
      return mainMenu(chatId,
        `📊 *Resumo — ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}*\n\n` +
        `💰 Receitas: *${fmt(ctx.receitasMes)}*\n` +
        `💸 Despesas: *${fmt(ctx.despesasMes)}*\n` +
        `${ctx.saldoMes >= 0 ? '✅' : '⚠️'} Saldo do mês: *${fmt(ctx.saldoMes)}*\n\n` +
        `👛 Saldo total: *${fmt(ctx.saldoTotal)}*\n\n` +
        (topCats ? `*Top gastos:*\n${topCats}` : '')
      );
    }

    if (text === '🎯 Metas') {
      const goals = await all('SELECT * FROM goals WHERE user_id=? ORDER BY created_at DESC', [userId]);
      if (!goals.length) return sendMessage(chatId, '🎯 Nenhuma meta cadastrada. Crie no app!');
      let msg = '🎯 *Suas Metas:*\n\n';
      goals.forEach(g => {
        const pct = Math.min((g.current / g.target) * 100, 100);
        const bars = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
        msg += `*${pct >= 100 ? '✅' : '🎯'} ${g.name}*\n${bars} ${pct.toFixed(0)}%\n${fmt(g.current)} de ${fmt(g.target)}\n\n`;
      });
      return mainMenu(chatId, msg);
    }

    if (text === '📋 Últimas Transações') {
      const txs = await all('SELECT * FROM transactions WHERE user_id=? ORDER BY date DESC,created_at DESC LIMIT 7', [userId]);
      if (!txs.length) return sendMessage(chatId, '📋 Nenhuma transação ainda.');
      let msg = '📋 *Últimas transações:*\n\n';
      txs.forEach(t => {
        msg += `${t.type === 'income' ? '💰' : '💸'} *${t.description}*\n`;
        msg += `   ${t.type === 'income' ? '+' : '-'}${fmt(t.amount)} · ${t.category} · ${new Date(t.date + 'T12:00:00').toLocaleDateString('pt-BR')}\n\n`;
      });
      return mainMenu(chatId, msg);
    }

    if (text === '❓ Ajuda') {
      return mainMenu(chatId,
        `🤖 *Assistente Financeiro com IA*\n\n` +
        `*Fale naturalmente:*\n` +
        `• _"gastei 50 no mercado"_\n` +
        `• _"paguei 120 de uber"_\n` +
        `• _"recebi 3000 de salário"_\n` +
        `• _"quanto gastei esse mês?"_\n` +
        `• _"estou indo bem nas finanças?"_\n` +
        `• _"qual minha maior despesa?"_\n` +
        `• _"quanto falta pra minha meta de viagem?"_\n\n` +
        `*📸 Foto de comprovante:*\n` +
        `Mande a foto → IA lê e registra automaticamente!\n\n` +
        `/limpar — Limpar histórico da conversa`
      );
    }

    if (text === '💸 Lançar Despesa') return sendMessage(chatId, `💸 Me diga a despesa:\n_Ex: "gastei 50 no mercado"_`);
    if (text === '💰 Lançar Receita') return sendMessage(chatId, `💰 Me diga a receita:\n_Ex: "recebi 3000 de salário"_`);

    // IA Gemini
    await sendMessage(chatId, '_Pensando..._');
    const ctx = await getContexto(userId);
    const resultado = await classifyMessage(text, ctx, session.history);

    if (!resultado) return mainMenu(chatId, '❌ Erro ao processar. Tente novamente.');

    // Lança transação
    if (resultado.intent === 'lancamento' && resultado.amount > 0) {
      const today = new Date().toISOString().split('T')[0];
      await run(
        'INSERT INTO transactions (user_id, type, description, amount, category, date) VALUES (?,?,?,?,?,?)',
        [userId, resultado.type || 'expense', resultado.description || text, resultado.amount, resultado.category || 'Outros', today]
      );
    }

    // Atualiza histórico (máx 20 mensagens)
    session.history.push({ role: 'user', parts: [{ text }] });
    session.history.push({ role: 'model', parts: [{ text: resultado.resposta }] });
    if (session.history.length > 20) session.history = session.history.slice(-20);

    return mainMenu(chatId, resultado.resposta);

  } catch (err) {
    console.error('Bot error:', err);
  }
};

// ==================== POLLING ====================
let lastUpdateId = 0;

export const startPolling = async () => {
  console.log('🤖 Bot Telegram com Gemini AI iniciado!');
  while (true) {
    try {
      const res = await fetch(`${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
      const data = await res.json();
      if (data.ok && data.result?.length) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          processUpdate(update).catch(console.error);
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
};
