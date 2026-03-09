# ✅ Checklist Rápido - Railway Deploy

## PRÉ-DEPLOY (no seu computador)

```bash
# 1. Entre na pasta
cd financas-app

# 2. Rode o script de setup
# Windows:
setup.bat

# Mac/Linux:
chmod +x setup.sh
./setup.sh

# 3. Teste localmente (opcional mas recomendado)
# Terminal 1:
cd backend && npm start

# Terminal 2:
cd frontend && npm run dev
# Acesse http://localhost:5173
```

## SUBIR PARA GITHUB

```bash
# 4. Inicialize Git
git init
git add .
git commit -m "Initial commit"

# 5. Crie repositório no GitHub (via navegador)
# https://github.com/new

# 6. Conecte e envie (SUBSTITUA a URL)
git remote add origin https://github.com/SEU-USUARIO/financas-app.git
git push -u origin main
# Se não funcionar, tente: git push -u origin master
```

## RAILWAY - BACKEND

```
7.  ✅ Acesse railway.app
8.  ✅ Login com GitHub
9.  ✅ New Project → Deploy from GitHub repo
10. ✅ Selecione: financas-app
11. ✅ Settings → Root Directory: backend
12. ✅ Variables → Adicione:
    JWT_SECRET = sua-senha-aleatoria-super-segura-aqui
13. ✅ Settings → Domains → Generate Domain
14. ✅ COPIE A URL (ex: xyz.railway.app)
```

## RAILWAY - FRONTEND

```
15. ✅ No mesmo projeto → + New → GitHub Repo → financas-app
16. ✅ Settings → Root Directory: frontend
17. ✅ Settings → Build Command: npm install && npm run build
18. ✅ Variables → Adicione:
    VITE_API_URL = https://URL-DO-BACKEND/api
    (use a URL que você copiou no passo 14, adicionando /api)
19. ✅ Settings → Domains → Generate Domain
20. ✅ COPIE A URL DO FRONTEND
```

## TESTE FINAL

```
21. ✅ Acesse a URL do frontend
22. ✅ Registre uma conta
23. ✅ Faça login
24. ✅ Adicione uma transação
25. ✅ Crie uma meta
```

## CELULAR

```
26. ✅ Abra a URL no celular
27. ✅ Adicione à tela inicial
28. ✅ Use como app!
```

---

## URLs Importantes (anote aqui):

**Backend Railway:**  
`https://__________________________________.railway.app`

**Frontend Railway:**  
`https://__________________________________.railway.app`

**GitHub Repo:**  
`https://github.com/_______________/financas-app`

---

## Comandos Úteis

**Ver status do deploy:**
- Entre no Railway → Deployments → View Logs

**Atualizar o app:**
```bash
git add .
git commit -m "Update"
git push
# Railway faz deploy automático!
```

**Testar backend:**
```
https://SUA-URL-BACKEND/api/health
# Deve retornar: {"status":"ok","message":"API funcionando!"}
```

---

## Deu erro? 🔧

**Erro: "Cannot connect to server"**
→ Verifique se VITE_API_URL está correto (com /api no final)

**Erro: "Invalid credentials"**  
→ Limpe cache do navegador (Ctrl+Shift+Delete)

**Deploy falhou**  
→ Veja logs no Railway → Deployments → View Logs

**App lento no primeiro acesso**  
→ Normal! Plano grátis "dorme" e demora ~30s para acordar

---

**Próximo passo:** WhatsApp Bot! 🤖
Quando tiver tudo funcionando, me avise e criamos a integração.
