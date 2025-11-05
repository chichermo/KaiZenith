@echo off
echo ========================================
echo   Patolin Construction App - Instalacion
echo ========================================
echo.

echo [1/5] Instalando dependencias del proyecto principal...
call npm install
if %errorlevel% neq 0 (
    echo Error instalando dependencias principales
    pause
    exit /b 1
)

echo [2/5] Instalando dependencias del servidor...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Error instalando dependencias del servidor
    pause
    exit /b 1
)
cd ..

echo [3/5] Instalando dependencias del cliente...
cd client
call npm install
if %errorlevel% neq 0 (
    echo Error instalando dependencias del cliente
    pause
    exit /b 1
)
cd ..

echo [4/5] Configurando base de datos...
echo.
echo IMPORTANTE: Asegurate de tener PostgreSQL instalado y ejecutandose
echo.
echo Para configurar la base de datos:
echo 1. Abre pgAdmin o psql
echo 2. Ejecuta el archivo database/schema.sql
echo 3. Crea un archivo .env en la carpeta server/ basado en env.example
echo.

echo [5/5] Configuracion completada!
echo.
echo Para ejecutar la aplicacion:
echo   npm run dev
echo.
echo Esto iniciara tanto el servidor (puerto 5000) como el cliente (puerto 3000)
echo.
echo Credenciales de prueba:
echo   Email: admin@patolin.cl
echo   Password: password
echo.
pause
