# Configuración del Backend para Producción

## Variables de Entorno Requeridas

### 1. Configuración Básica

```env
# Puerto del servidor
PORT=5000

# Entorno
NODE_ENV=production

# JWT Secret (genera uno seguro)
JWT_SECRET=tu-secret-key-super-segura-aqui
```

### 2. CORS (Frontend URL)

```env
# URL del frontend en producción
# Puedes especificar múltiples URLs separadas por comas
FRONTEND_URL=https://kai-zenith.vercel.app,https://www.tudominio.com
```

**Importante**: 
- En desarrollo, si no está configurado, permite todos los orígenes
- En producción, **debes** configurar `FRONTEND_URL` para seguridad

### 3. Base de Datos (si usas PostgreSQL)

```env
DATABASE_URL=postgresql://user:password@host:5432/database
```

### 4. Servicios Opcionales

#### Redis (Cache)
```env
REDIS_URL=redis://localhost:6379
```

#### OpenAI (Búsqueda IA)
```env
OPENAI_API_KEY=sk-tu-api-key
```

#### Meilisearch
```env
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_MASTER_KEY=tu-master-key
```

#### Integración Bancaria (Fintoc)
```env
FINTOC_API_KEY=tu-fintoc-api-key
```

#### Facturador Electrónico (SII)
```env
FACTURADOR_API_KEY=tu-facturador-api-key
FACTURADOR_BASE_URL=https://api.facturadorpro.cl/v1
SII_ENVIRONMENT=production
```

#### Transbank (Pagos)
```env
TBK_ENVIRONMENT=production
TBK_COMMERCE_CODE=tu-commerce-code
TBK_API_KEY=tu-transbank-api-key
```

#### SendGrid (Emails)
```env
SENDGRID_API_KEY=SG.tu-api-key
SENDGRID_FROM_EMAIL=noreply@tudominio.com
```

#### Firebase (Push Notifications)
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## Despliegue en Diferentes Plataformas

### Heroku

1. Instala Heroku CLI
2. Login: `heroku login`
3. Crea la app: `heroku create tu-app-name`
4. Configura variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://tu-frontend.vercel.app
   heroku config:set JWT_SECRET=tu-secret-key
   # ... otras variables
   ```
5. Despliega: `git push heroku main`

### Railway

1. Conecta tu repositorio en Railway
2. Configura las variables de entorno en el dashboard
3. Railway detecta automáticamente el `package.json` y despliega

### Render

1. Crea un nuevo "Web Service" en Render
2. Conecta tu repositorio
3. Configura:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Agrega las variables de entorno en el dashboard

### Vercel (Serverless Functions)

Si quieres usar Vercel para el backend también:

1. Crea `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/src/index-simple.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/src/index-simple.ts"
    }
  ]
}
```

2. Configura variables de entorno en Vercel dashboard
3. Despliega

## Verificación

Después de desplegar, verifica que el servidor funciona:

```bash
curl https://tu-backend-url.com/api/health
```

Deberías recibir:
```json
{
  "status": "OK",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Seguridad

### Checklist de Seguridad

- [ ] `JWT_SECRET` es una cadena larga y aleatoria
- [ ] `NODE_ENV=production` está configurado
- [ ] `FRONTEND_URL` está configurado correctamente
- [ ] Todas las API keys están configuradas
- [ ] El servidor usa HTTPS
- [ ] Helmet está habilitado (ya incluido)
- [ ] CORS está configurado correctamente

## Troubleshooting

### Error: CORS bloqueado

**Problema**: El frontend no puede hacer requests al backend.

**Solución**: 
1. Verifica que `FRONTEND_URL` incluye la URL exacta del frontend
2. Asegúrate de que no hay espacios en la variable
3. Si usas múltiples URLs, sepáralas por comas sin espacios

### Error: Puerto ya en uso

**Problema**: El puerto 5000 está ocupado.

**Solución**: 
1. Cambia `PORT` en las variables de entorno
2. O mata el proceso: `lsof -ti:5000 | xargs kill`

### Error: Variables de entorno no cargadas

**Problema**: Las variables de entorno no se están leyendo.

**Solución**:
1. Verifica que el archivo `.env` existe (solo en desarrollo)
2. En producción, verifica que las variables están configuradas en la plataforma
3. Reinicia el servidor después de cambiar variables

