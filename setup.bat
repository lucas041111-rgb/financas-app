@echo off
echo =============================
echo Setup do App de Financas
echo =============================
echo.

echo [1/3] Instalando dependencias do BACKEND...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar backend
    pause
    exit /b 1
)
cd ..
echo [OK] Backend instalado!
echo.

echo [2/3] Instalando dependencias do FRONTEND...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Erro ao instalar frontend
    pause
    exit /b 1
)
cd ..
echo [OK] Frontend instalado!
echo.

echo [3/3] Criando arquivos .env...

if not exist backend\.env (
    (
        echo PORT=3000
        echo JWT_SECRET=mude-este-secret-para-algo-super-seguro
        echo NODE_ENV=development
    ) > backend\.env
    echo [OK] backend\.env criado!
)

if not exist frontend\.env (
    echo VITE_API_URL=http://localhost:3000/api > frontend\.env
    echo [OK] frontend\.env criado!
)

echo.
echo =============================
echo Setup completo!
echo =============================
echo.
echo Para rodar localmente, abra 2 terminais:
echo.
echo Terminal 1 - Backend:
echo   cd backend
echo   npm start
echo.
echo Terminal 2 - Frontend:
echo   cd frontend
echo   npm run dev
echo.
echo Depois acesse: http://localhost:5173
echo.
echo Para deploy no Railway, veja: GUIA-RAILWAY.md
echo.
pause
