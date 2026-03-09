# 💰 Finanças - App de Gestão Financeira

Sistema completo de gerenciamento financeiro pessoal com backend Node.js e frontend React.

## 🚀 Características

- ✅ Cadastro e autenticação de usuários
- ✅ Registro de receitas e despesas
- ✅ Categorização automática
- ✅ Metas de economia com progresso
- ✅ Estatísticas e resumos financeiros
- ✅ Design dark premium e responsivo
- ✅ 100% funcional em mobile e desktop

## 📁 Estrutura do Projeto

```
financas-app/
├── backend/           # API Node.js + Express + SQLite
│   ├── server.js
│   ├── database.js
│   └── package.json
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## 🛠️ Instalação Local

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env e configure o JWT_SECRET
npm start
```

O backend estará rodando em `http://localhost:3000`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

## 🌐 Deploy em Produção

### Opção 1: Railway (Recomendado - Grátis)

**Backend:**
1. Crie conta em [railway.app](https://railway.app)
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Selecione a pasta `backend`
4. Configure as variáveis de ambiente:
   - `JWT_SECRET`: crie uma string aleatória segura
   - `PORT`: 3000
5. Deploy automático!

**Frontend:**
1. No mesmo projeto Railway, adicione novo serviço
2. Deploy da pasta `frontend`
3. Configure variável:
   - `VITE_API_URL`: URL do seu backend (ex: https://seu-backend.railway.app/api)
4. Pronto!

### Opção 2: Vercel (Frontend) + Railway (Backend)

**Backend no Railway:**
- Mesmo processo acima

**Frontend na Vercel:**
1. Instale Vercel CLI: `npm i -g vercel`
2. Na pasta frontend: `vercel`
3. Configure variável de ambiente:
   - `VITE_API_URL`: URL do backend Railway

### Opção 3: Render (Grátis)

**Backend:**
1. Crie conta em [render.com](https://render.com)
2. New → Web Service
3. Conecte seu repositório
4. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Variáveis de ambiente: `JWT_SECRET`

**Frontend:**
1. New → Static Site
2. Build Command: `npm run build`
3. Publish Directory: `dist`
4. Variável: `VITE_API_URL`

## 📱 Como Usar

### Registro
1. Abra o app
2. Clique em "Registrar"
3. Preencha seus dados
4. Faça login!

### Adicionar Transações
1. Clique em "+ Nova" no card de Transações
2. Escolha tipo (Receita/Despesa)
3. Preencha descrição, valor, categoria e data
4. Adicionar!

### Criar Metas
1. Clique em "+ Nova" no card de Metas
2. Nome da meta e valor alvo
3. Atualize o progresso conforme economizar

## 🔐 Segurança

- Senhas criptografadas com bcrypt
- Autenticação via JWT
- Tokens com expiração de 7 dias
- Cada usuário vê apenas seus dados

## 🎨 Personalização

### Cores (frontend/src/index.css)
```css
:root {
  --accent: #00ff88;  /* Cor principal */
  --income: #00ff88;  /* Cor das receitas */
  --expense: #ff3366; /* Cor das despesas */
}
```

### Categorias
Edite diretamente no frontend (App.jsx) ou adicione uma tabela de categorias no banco.

## 📊 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Fazer login

### Transações
- `GET /api/transactions` - Listar transações
- `POST /api/transactions` - Criar transação
- `DELETE /api/transactions/:id` - Deletar transação
- `GET /api/transactions/stats` - Estatísticas

### Metas
- `GET /api/goals` - Listar metas
- `POST /api/goals` - Criar meta
- `PUT /api/goals/:id` - Atualizar meta
- `DELETE /api/goals/:id` - Deletar meta

## 🐛 Troubleshooting

**Erro de CORS:**
- Certifique-se que o backend tem `cors` instalado
- Verifique se `VITE_API_URL` está correto no frontend

**Banco não cria:**
- SQLite cria automaticamente ao iniciar o servidor
- Verifique permissões de escrita na pasta

**Frontend não conecta:**
- Confirme que o backend está rodando
- Verifique console do navegador para erros

## 📝 Próximos Passos

- [ ] Adicionar gráficos mais detalhados
- [ ] Exportar relatórios em PDF
- [ ] Integração com WhatsApp Bot
- [ ] App mobile nativo (React Native)
- [ ] Categorias customizadas
- [ ] Orçamentos mensais
- [ ] Notificações de metas

## 🤝 Contribuindo

Sinta-se livre para abrir issues ou pull requests!

## 📄 Licença

MIT - Use à vontade!

---

Feito com 💚 para controle financeiro inteligente
