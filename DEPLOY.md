# 🚀 Guia Rápido de Deploy

## Deploy Mais Rápido: Railway (100% Grátis)

### 1. Prepare seu código
```bash
# Crie um repositório no GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-usuario/financas-app.git
git push -u origin main
```

### 2. Deploy do Backend
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. "New Project" → "Deploy from GitHub repo"
4. Selecione seu repositório
5. Railway detectará automaticamente o Node.js
6. Clique em "Deploy Now"
7. Vá em "Variables" e adicione:
   - `JWT_SECRET` = `uma-string-aleatoria-super-segura-aqui`
8. Anote a URL gerada (ex: `financas-backend-production.up.railway.app`)

### 3. Deploy do Frontend
1. No mesmo projeto, clique "New Service"
2. "GitHub Repo" → selecione o mesmo repositório
3. Configure:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: (deixe vazio, Railway detecta automaticamente)
4. Em "Variables" adicione:
   - `VITE_API_URL` = `https://SUA-URL-DO-BACKEND/api`
5. Deploy!

### 4. Pronto! 🎉
Acesse a URL do frontend e comece a usar!

---

## Alternativa: Vercel + Railway

### Backend (Railway)
Mesmo processo acima.

### Frontend (Vercel)
1. Acesse [vercel.com](https://vercel.com)
2. "Add New" → "Project"
3. Importe do GitHub
4. Configure:
   - Framework Preset: Vite
   - Root Directory: `frontend`
5. Environment Variables:
   - `VITE_API_URL` = `https://SUA-URL-DO-BACKEND/api`
6. Deploy!

---

## Testando Localmente Antes do Deploy

```bash
# Terminal 1 - Backend
cd backend
npm install
echo "JWT_SECRET=test-secret" > .env
npm start

# Terminal 2 - Frontend  
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3000/api" > .env
npm run dev
```

Abra http://localhost:5173

---

## Checklist Pré-Deploy

- [ ] `.env.example` criados (não commitar `.env`)
- [ ] `JWT_SECRET` forte e aleatório
- [ ] URLs corretas configuradas
- [ ] Código commitado no GitHub
- [ ] Testado localmente

---

## Custos

- **Railway**: Grátis (500h/mês é mais que suficiente)
- **Vercel**: Grátis (uso pessoal ilimitado)
- **Render**: Grátis (pode dormir após inatividade)

Todos têm planos gratuitos excelentes para projetos pessoais!

---

## Próximo Passo: WhatsApp Bot

Se quiser integrar com WhatsApp, precisará:
1. Conta Twilio (grátis para testes)
2. Webhook endpoint no backend
3. Número de telefone para teste

Me avise se quiser que eu crie isso também! 🤖
