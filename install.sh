#!/bin/bash

echo "========================================"
echo "   Patolin Construction App - Instalación"
echo "========================================"
echo

echo "[1/5] Instalando dependencias del proyecto principal..."
npm install
if [ $? -ne 0 ]; then
    echo "Error instalando dependencias principales"
    exit 1
fi

echo "[2/5] Instalando dependencias del servidor..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "Error instalando dependencias del servidor"
    exit 1
fi
cd ..

echo "[3/5] Instalando dependencias del cliente..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "Error instalando dependencias del cliente"
    exit 1
fi
cd ..

echo "[4/5] Configurando base de datos..."
echo
echo "IMPORTANTE: Asegúrate de tener PostgreSQL instalado y ejecutándose"
echo
echo "Para configurar la base de datos:"
echo "1. Abre pgAdmin o psql"
echo "2. Ejecuta el archivo database/schema.sql"
echo "3. Crea un archivo .env en la carpeta server/ basado en env.example"
echo

echo "[5/5] Configuración completada!"
echo
echo "Para ejecutar la aplicación:"
echo "  npm run dev"
echo
echo "Esto iniciará tanto el servidor (puerto 5000) como el cliente (puerto 3000)"
echo
echo "Credenciales de prueba:"
echo "  Email: admin@patolin.cl"
echo "  Password: password"
echo
