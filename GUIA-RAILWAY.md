# 🚂 Guia Completo: Deploy no Railway

## 📋 Pré-requisitos

1. ✅ Conta no GitHub (gratuita)
2. ✅ Conta no Railway (gratuita) - [railway.app](https://railway.app)
3. ✅ Git instalado no seu computador

---

## PASSO 1: Preparar o Código no GitHub

### 1.1 - Criar Repositório no GitHub

1. Acesse [github.com](https://github.com)
2. Clique no **"+"** no canto superior direito → **"New repository"**
3. Preencha:
   - **Repository name**: `financas-app` (ou outro nome)
   - **Description**: "App de gestão financeira"
   - Deixe **Public**
   - **NÃO** marque "Add a README"
4. Clique em **"Create repository"**

### 1.2 - Subir o Código

Abra o terminal/prompt na pasta do projeto e execute:

```bash
# Entre na pasta do projeto
cd financas-app

# Inicialize o Git (se ainda não tiver)
git init

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Initial commit - App de finanças"

# Adicione o repositório remoto (SUBSTITUA com a URL do seu repositório)
git remote add origin https://github.com/SEU-USUARIO/financas-app.git

# Suba o código
git push -u origin main

# Se der erro, tente:
git push -u origin master
```

**✅ Checkpoint:** Seu código agora está no GitHub!

---

## PASSO 2: Deploy do Backend no Railway

### 2.1 - Criar Projeto no Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **"Login"** → **"Login with GitHub"**
3. Autorize o Railway a acessar seu GitHub
4. Na tela inicial, clique em **"New Project"**

### 2.2 - Conectar ao GitHub

1. Na janela que abriu, clique em **"Deploy from GitHub repo"**
2. Você verá a lista dos seus repositórios
3. Clique em **"financas-app"** (ou o nome que você deu)
4. Railway vai perguntar qual pasta deployar

### 2.3 - Configurar o Backend

1. Clique em **"Add variables"** ou procure por **"Variables"** no menu
2. Adicione as seguintes variáveis:

   **Nome:** `JWT_SECRET`  
   **Valor:** `minha-chave-super-secreta-12345-mude-isso` (crie uma senha forte e aleatória)

   **Nome:** `NODE_ENV`  
   **Valor:** `production`

3. Clique em **"Settings"** (ícone de engrenagem)
4. Em **"Root Directory"**, digite: `backend`
5. Em **"Build Command"**, deve estar: `npm install` (Railway detecta automaticamente)
6. Em **"Start Command"**, deve estar: `npm start`

### 2.4 - Deploy!

1. Volte para a aba principal
2. Railway automaticamente iniciará o deploy
3. Aguarde até ver **"Success"** (pode levar 2-3 minutos)
4. Clique em **"Settings"** → procure por **"Domains"**
5. Clique em **"Generate Domain"**
6. **COPIE A URL** gerada (exemplo: `financas-backend-production.up.railway.app`)

**✅ Checkpoint:** Seu backend está no ar! Teste acessando: `https://SUA-URL/api/health`

---

## PASSO 3: Deploy do Frontend no Railway

### 3.1 - Adicionar Novo Serviço

1. No mesmo projeto Railway, clique em **"+ New"** (canto superior direito)
2. Selecione **"GitHub Repo"**
3. Escolha o mesmo repositório: **"financas-app"**

### 3.2 - Configurar o Frontend

1. Clique em **"Settings"**
2. Em **"Root Directory"**, digite: `frontend`
3. Em **"Build Command"**, digite: `npm install && npm run build`
4. Em **"Start Command"**, deixe vazio (Railway detecta automaticamente)

### 3.3 - Configurar Variáveis de Ambiente

1. Clique em **"Variables"**
2. Adicione a variável:

   **Nome:** `VITE_API_URL`  
   **Valor:** `https://SUA-URL-DO-BACKEND/api`  
   _(Cole a URL que você copiou no Passo 2.4, adicionando `/api` no final)_

   **Exemplo:**  
   `https://financas-backend-production.up.railway.app/api`

### 3.4 - Gerar Domínio do Frontend

1. Volte para **"Settings"**
2. Procure por **"Domains"**
3. Clique em **"Generate Domain"**
4. **COPIE A URL DO FRONTEND**

**✅ Checkpoint:** Aguarde o deploy finalizar (2-3 minutos)

---

## PASSO 4: Testar o App

1. Acesse a URL do frontend que você copiou
2. Você verá a tela de login/registro
3. Clique em **"Registrar"**
4. Crie sua conta
5. Adicione transações e metas!

**🎉 PRONTO! Seu app está no ar!**

---

## 📱 Usar no Celular

1. Abra o navegador do celular
2. Acesse a URL do frontend
3. No **iOS**: Safari → Compartilhar → "Adicionar à Tela de Início"
4. No **Android**: Chrome → Menu (3 pontos) → "Adicionar à tela inicial"

Agora você tem um ícone do app na tela do celular! 📲

---

## 🔧 Troubleshooting (Problemas Comuns)

### Problema: "Cannot connect to API" ou erro 404

**Solução:**
1. Verifique se a variável `VITE_API_URL` está correta
2. Certifique-se de adicionar `/api` no final da URL
3. Teste se o backend está funcionando: acesse `https://SUA-URL-BACKEND/api/health`

### Problema: Deploy falhou no Railway

**Solução:**
1. Verifique os logs clicando em "Deployments" → último deploy → "View Logs"
2. Certifique-se que a pasta está correta (backend ou frontend)
3. Verifique se os comandos de build estão corretos

### Problema: "Invalid token" ao fazer login

**Solução:**
1. Limpe os dados do navegador (Ctrl+Shift+Delete)
2. Certifique-se que `JWT_SECRET` foi configurado no backend
3. Tente fazer logout e login novamente

### Problema: App lento ou "dormindo"

**Solução:**
- Plano gratuito do Railway pode "dormir" após inatividade
- Primeiro acesso pode demorar 30-60 segundos para "acordar"
- Considere fazer upgrade para plano pago ($5/mês) se usar muito

---

## 🔄 Como Atualizar o App

Quando você fizer alterações no código:

```bash
# Na pasta do projeto
git add .
git commit -m "Descrição das mudanças"
git push

# Railway fará deploy automático!
```

---

## 📊 Monitoramento

No Railway você pode ver:
- **Logs em tempo real**: para debugar problemas
- **Métricas**: uso de CPU, memória, requisições
- **Deploy history**: histórico de todas as versões

---

## 💡 Dicas Importantes

1. **Guarde as URLs**: Salve em algum lugar seguro
2. **JWT_SECRET**: Use uma senha forte e aleatória (no mínimo 32 caracteres)
3. **Backup**: Railway faz backup automático, mas você pode exportar o banco SQLite
4. **Custom Domain**: Você pode adicionar seu próprio domínio (ex: financas.seusite.com)

---

## ✅ Checklist Final

- [ ] Backend funcionando (`/api/health` retorna OK)
- [ ] Frontend carregando
- [ ] Consegue criar conta
- [ ] Consegue fazer login
- [ ] Consegue adicionar transações
- [ ] Consegue criar metas
- [ ] Testou no celular

---

## 🆘 Precisa de Ajuda?

Se encontrar algum erro:
1. Copie a mensagem de erro completa
2. Verifique os logs no Railway
3. Me mande o erro e te ajudo a resolver!

---

**Próximo passo:** Depois que estiver tudo funcionando, posso criar a integração com WhatsApp Bot! 🤖
