# Guía de Instalación de Integraciones

Esta guía te ayudará a configurar todas las integraciones del sistema ERP.

## 📋 **Prerequisitos**

- Node.js 18+ instalado
- Docker (opcional, para Redis y Meilisearch)
- Cuentas en los servicios necesarios

---

## 🔧 **Instalación Paso a Paso**

### **1. Instalar Dependencias**

```bash
cd server
npm install
```

Esto instalará:
- OpenAI SDK
- Meilisearch client
- Redis client
- Transbank SDK
- SendGrid
- Firebase Admin
- Y más...

### **2. Configurar Variables de Entorno**

Copia el archivo de ejemplo y configura tus API keys:

```bash
cp server/env.example server/.env
```

Edita `server/.env` con tus credenciales reales.

---

## 🔍 **Búsqueda Inteligente (Meilisearch + OpenAI)**

### **Opción A: Docker (Recomendado)**

```bash
# Instalar Meilisearch con Docker
docker run -d \
  --name meilisearch \
  -p 7700:7700 \
  -e MEILI_MASTER_KEY=your-master-key-here \
  getmeili/meilisearch:latest
```

### **Opción B: Binario**

```bash
# Descargar Meilisearch
curl -L https://install.meilisearch.com | sh

# Ejecutar
./meilisearch --master-key=your-master-key-here
```

### **Configurar OpenAI**

1. Ve a https://platform.openai.com/api-keys
2. Crea una API key
3. Agrega a `.env`:
   ```
   OPENAI_API_KEY=sk-tu-api-key-aqui
   ```

### **Configurar Meilisearch en .env**

```
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=your-master-key-here
```

---

## 🏦 **Integración Bancaria (Fintoc)**

### **Obtener API Key de Fintoc**

1. Ve a https://fintoc.com
2. Crea una cuenta
3. Obtén tu API key del dashboard
4. Agrega a `.env`:
   ```
   FINTOC_API_KEY=tu-api-key-fintoc
   ```

### **Alternativa: APIs Bancarias Directas**

Si prefieres conectar directamente con bancos chilenos:

- **Banco de Chile**: https://developers.bancochile.cl
- **Santander**: https://developers.santander.cl
- **BCI**: Contacta con el banco para acceso a API

---

## 📋 **Integración SII (Facturador Electrónico)**

### **Opción 1: Facturador Pro (Recomendado)**

1. Ve a https://facturadorpro.cl
2. Crea una cuenta
3. Obtén tu API key
4. Agrega a `.env`:
   ```
   FACTURADOR_API_KEY=tu-api-key
   FACTURADOR_BASE_URL=https://api.facturadorpro.cl/v1
   SII_ENVIRONMENT=test  # Cambiar a 'production' cuando estés listo
   ```

### **Opción 2: Facturama**

1. Ve a https://facturama.cl
2. Crea una cuenta
3. Obtén tu API key
4. Actualiza `FACTURADOR_BASE_URL` en `.env`

### **Opción 3: Facturador Gratis del SII**

El SII ofrece un facturador básico gratis, pero requiere configuración manual más compleja.

---

## 💳 **Pagos (Transbank)**

### **Configuración**

1. Ve a https://www.transbank.cl
2. Regístrate como comercio
3. Obtén tus credenciales:
   - Commerce Code
   - API Key
4. Agrega a `.env`:
   ```
   TBK_ENVIRONMENT=integration  # 'integration' para pruebas, 'production' para producción
   TBK_COMMERCE_CODE=tu-commerce-code
   TBK_API_KEY=tu-api-key
   ```

### **Ambiente de Pruebas**

Transbank ofrece un ambiente de integración gratuito para pruebas. Usa:
- Commerce Code: `597055555532`
- API Key: `579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1`

---

## 📧 **Notificaciones (SendGrid)**

### **Configuración**

1. Ve a https://sendgrid.com
2. Crea una cuenta (100 emails/día gratis)
3. Crea un API key:
   - Settings → API Keys → Create API Key
4. Agrega a `.env`:
   ```
   SENDGRID_API_KEY=SG.tu-api-key-aqui
   SENDGRID_FROM_EMAIL=noreply@patolin.cl
   ```

### **Verificar Dominio (Opcional)**

Para mejor deliverability, verifica tu dominio en SendGrid.

---

## 📱 **Push Notifications (Firebase Cloud Messaging)**

### **Configuración**

1. Ve a https://console.firebase.google.com
2. Crea un proyecto
3. Ve a Project Settings → Service Accounts
4. Genera una nueva clave privada
5. Copia el JSON completo
6. Agrega a `.env` como una línea (o usa archivo separado):
   ```
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...",...}
   ```

### **Alternativa: Archivo de Credenciales**

Puedes guardar el JSON en `server/firebase-credentials.json` y cargarlo en el código.

---

## 🗄️ **Redis (Cache y Sesiones)**

### **Opción A: Docker (Recomendado)**

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:latest
```

### **Opción B: Instalación Local**

**Windows:**
- Descarga desde https://github.com/microsoftarchive/redis/releases
- O usa WSL2

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# Mac
brew install redis
```

### **Configurar en .env**

```
REDIS_URL=redis://localhost:6379
```

---

## 🚀 **Iniciar Servicios**

### **1. Iniciar Redis y Meilisearch**

```bash
# Con Docker
docker start redis meilisearch

# O manualmente
redis-server
./meilisearch --master-key=your-key
```

### **2. Iniciar Servidor**

```bash
cd server
npm run dev
```

---

## ✅ **Verificar Instalación**

### **Probar Búsqueda IA**

```bash
curl -X GET "http://localhost:5000/api/ai-search/search?q=cemento" \
  -H "Authorization: Bearer test-token-temporary"
```

### **Probar Integración Bancaria**

```bash
curl -X POST "http://localhost:5000/api/banking-enhanced/connect" \
  -H "Authorization: Bearer test-token-temporary" \
  -H "Content-Type: application/json" \
  -d '{"bankCode":"banco_chile","credentials":{"rut":"12.345.678-9","username":"user","password":"pass"}}'
```

### **Probar SII**

```bash
curl -X POST "http://localhost:5000/api/sii-enhanced/validate-rut" \
  -H "Authorization: Bearer test-token-temporary" \
  -H "Content-Type: application/json" \
  -d '{"rut":"12.345.678-9"}'
```

---

## 🆓 **Alternativas Gratuitas**

Si no quieres pagar por servicios, puedes usar:

1. **Meilisearch**: 100% gratis (self-hosted)
2. **Hugging Face**: Modelos de IA gratis (en lugar de OpenAI)
3. **Redis**: 100% gratis (self-hosted)
4. **SendGrid**: 100 emails/día gratis
5. **FCM**: 100% gratis
6. **Facturador SII Gratis**: Básico pero funcional

Ver `ALTERNATIVAS_GRATUITAS.md` para más detalles.

---

## 📝 **Notas Importantes**

1. **Ambiente de Pruebas**: Todas las integraciones tienen modo de prueba. Úsalas antes de producción.

2. **API Keys**: Nunca subas tus API keys a Git. Usa `.env` y agrégalo a `.gitignore`.

3. **Rate Limits**: Algunos servicios tienen límites. Revisa la documentación de cada uno.

4. **Costos**: Revisa `ALTERNATIVAS_GRATUITAS.md` para opciones gratuitas.

5. **Chile Específico**: 
   - Fintoc es específico para Chile
   - Transbank es el estándar en Chile
   - SII es el sistema tributario chileno

---

## 🆘 **Solución de Problemas**

### **Meilisearch no inicia**
```bash
# Verificar que el puerto 7700 esté libre
netstat -ano | findstr :7700  # Windows
lsof -i :7700  # Mac/Linux
```

### **Redis no conecta**
```bash
# Verificar que Redis esté corriendo
redis-cli ping  # Debe responder "PONG"
```

### **OpenAI da error 401**
- Verifica que tu API key sea correcta
- Verifica que tengas créditos disponibles
- Revisa que no hayas excedido el rate limit

### **Fintoc no funciona**
- Verifica que tu API key sea válida
- Asegúrate de estar en el plan correcto
- Revisa los logs del servidor

---

## 📚 **Recursos Adicionales**

- [Documentación Meilisearch](https://www.meilisearch.com/docs)
- [Documentación OpenAI](https://platform.openai.com/docs)
- [Documentación Fintoc](https://docs.fintoc.com)
- [Documentación Transbank](https://www.transbankdevelopers.cl)
- [Documentación SendGrid](https://docs.sendgrid.com)

---

## ✅ **Checklist de Instalación**

- [ ] Dependencias instaladas (`npm install`)
- [ ] Redis corriendo
- [ ] Meilisearch corriendo
- [ ] Variables de entorno configuradas (`.env`)
- [ ] OpenAI API key configurada
- [ ] Fintoc API key configurada (opcional)
- [ ] Facturador API key configurada (opcional)
- [ ] Transbank configurado (opcional)
- [ ] SendGrid configurado (opcional)
- [ ] Firebase configurado (opcional)
- [ ] Servidor iniciado sin errores
- [ ] Pruebas básicas funcionando

---

¡Listo! Ahora tienes todas las integraciones configuradas. 🎉

