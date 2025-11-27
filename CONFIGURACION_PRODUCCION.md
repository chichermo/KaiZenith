# Configuración para Producción (Vercel)

## Problema

En producción (Vercel), el frontend intenta conectarse a `localhost:5000`, lo cual no funciona porque el backend está en otro servidor.

## Solución

### 1. Configurar Variable de Entorno en Vercel

1. Ve al dashboard de Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto `kai-zenith`
3. Ve a **Settings** → **Environment Variables**
4. Agrega una nueva variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: La URL de tu backend (ej: `https://tu-backend.herokuapp.com` o `https://api.tudominio.com`)
   - **Environments**: Selecciona `Production`, `Preview`, y `Development`
   - **Importante**: No incluyas `/api` al final, el código lo agrega automáticamente

### 2. Opciones de Backend

#### Opción A: Backend en Heroku/Railway/Render
```
REACT_APP_API_URL=https://tu-backend.herokuapp.com
```

#### Opción B: Backend en Vercel Serverless Functions
Si tu backend está en Vercel como serverless functions:
```
REACT_APP_API_URL=https://tu-proyecto.vercel.app/api
```

#### Opción C: Backend en un servidor propio
```
REACT_APP_API_URL=https://api.tudominio.com
```

### 3. Re-desplegar

Después de agregar la variable de entorno:
1. Ve a **Deployments**
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. Espera a que termine el deployment

### 4. Verificar

1. Abre la consola del navegador (F12)
2. Deberías ver: `API URL configurada: https://tu-backend-url.com/api`
3. Las peticiones deberían ir a la URL correcta

## Archivos Modificados

Los siguientes archivos ahora usan la configuración centralizada:

- `client/src/config/api.ts` - Configuración centralizada de la URL del API
- `client/src/utils/api.ts` - Helper para hacer peticiones fetch
- `client/src/contexts/AuthContext.tsx` - Configuración de axios
- `client/src/pages/Suppliers.tsx` - Actualizado para usar apiFetch
- `client/src/pages/PurchaseOrders.tsx` - Actualizado para usar apiFetch
- `client/src/components/NotificationBell.tsx` - Actualizado para usar apiFetch

## Nota

Si aún hay archivos que usan `localhost:5000` directamente, deberían actualizarse para usar `apiFetch` de `client/src/utils/api.ts`.

