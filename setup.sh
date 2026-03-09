#!/bin/bash

echo "🚀 Setup do App de Finanças"
echo "=============================="
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Instalando dependências do BACKEND...${NC}"
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend instalado com sucesso!${NC}"
else
    echo "❌ Erro ao instalar backend"
    exit 1
fi
cd ..

echo ""
echo -e "${BLUE}2. Instalando dependências do FRONTEND...${NC}"
cd frontend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend instalado com sucesso!${NC}"
else
    echo "❌ Erro ao instalar frontend"
    exit 1
fi
cd ..

echo ""
echo -e "${BLUE}3. Criando arquivos .env...${NC}"

# Backend .env
if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
PORT=3000
JWT_SECRET=mude-este-secret-para-algo-super-seguro-$(openssl rand -hex 16)
NODE_ENV=development
EOF
    echo -e "${GREEN}✓ backend/.env criado!${NC}"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3000/api
EOF
    echo -e "${GREEN}✓ frontend/.env criado!${NC}"
fi

echo ""
echo -e "${GREEN}=============================="
echo "✅ Setup completo!"
echo "==============================${NC}"
echo ""
echo "Para rodar localmente:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend && npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Depois acesse: http://localhost:5173"
echo ""
echo "Para deploy no Railway, veja: GUIA-RAILWAY.md"
