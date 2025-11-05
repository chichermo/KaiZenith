# Patolin Construction App

Sistema de gestión integral para empresa de construcción en Chile.

## 🏗️ Características Principales

### ✅ Funcionalidades Implementadas

- **Gestión de Clientes**
  - Lista de clientes activos y potenciales
  - Formularios de creación y edición
  - Estados: Activo, Potencial, Inactivo
  - Validación de RUT chileno

- **Sistema de Facturas**
  - Generación de facturas con formato chileno
  - Cálculo automático de IVA (19%)
  - Estados: Borrador, Enviada, Pagada, Vencida, Cancelada
  - Generación de PDF
  - Numeración automática

- **Autenticación y Seguridad**
  - Sistema de login con JWT
  - Roles de usuario (Admin, Usuario, Contador)
  - Protección de rutas
  - Manejo de sesiones

- **Dashboard Interactivo**
  - Estadísticas en tiempo real
  - Resumen financiero
  - Métricas de clientes y facturas

### 🚧 Funcionalidades en Desarrollo

- **Órdenes de Compra**
  - Gestión completa de órdenes
  - Integración con proveedores
  - Control de inventario

- **Cotizaciones**
  - Creación de cotizaciones detalladas
  - Conversión a facturas
  - Seguimiento de estados

- **Proveedores y Comparación de Precios**
  - Integración con APIs de proveedores chilenos
  - Comparación automática de precios
  - Búsqueda de productos

- **Contabilidad Completa**
  - Plan de cuentas chileno
  - Asientos contables automáticos
  - Reportes financieros
  - Balance general y estado de resultados

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** con TypeScript
- **Express.js** para APIs REST
- **PostgreSQL** como base de datos
- **JWT** para autenticación
- **PDFKit** para generación de PDFs
- **Axios** para integración con APIs externas

### Frontend
- **React 18** con TypeScript
- **Material-UI** para interfaz de usuario
- **React Query** para manejo de estado
- **React Router** para navegación
- **React Hook Form** para formularios

### Base de Datos
- **PostgreSQL** con esquema optimizado
- **Triggers** para actualización automática
- **Índices** para rendimiento
- **Relaciones** bien definidas

## 📋 Requisitos del Sistema

### Software Requerido
- **Node.js** 18+ 
- **PostgreSQL** 12+
- **npm** o **yarn**

### Hardware Mínimo
- **RAM**: 4GB
- **Almacenamiento**: 2GB libres
- **Procesador**: Dual-core 2GHz+

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd patolin-construction-app
```

### 2. Instalación Automática

**Windows:**
```cmd
install.bat
```

**Linux/Mac:**
```bash
chmod +x install.sh
./install.sh
```

### 3. Configuración Manual

#### Instalar Dependencias
```bash
# Instalar todas las dependencias
npm run install-all
```

#### Configurar Base de Datos
1. Instalar PostgreSQL
2. Crear base de datos:
```sql
CREATE DATABASE patolin_construction;
```
3. Ejecutar el esquema:
```bash
psql -d patolin_construction -f database/schema.sql
```

#### Configurar Variables de Entorno
1. Copiar archivo de ejemplo:
```bash
cp server/env.example server/.env
```
2. Editar `server/.env` con tus configuraciones:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=patolin_construction
DB_USER=tu_usuario
DB_PASSWORD=tu_password
JWT_SECRET=tu_jwt_secret_muy_seguro
```

## 🎯 Uso del Sistema

### 1. Iniciar la Aplicación
```bash
npm run dev
```

Esto iniciará:
- **Servidor**: http://localhost:5000
- **Cliente**: http://localhost:3000

### 2. Credenciales de Prueba
- **Email**: admin@patolin.cl
- **Password**: password

### 3. Navegación
- **Dashboard**: Vista general del sistema
- **Clientes**: Gestión de clientes
- **Facturas**: Creación y gestión de facturas
- **Órdenes de Compra**: Gestión de compras
- **Cotizaciones**: Creación de cotizaciones
- **Proveedores**: Gestión de proveedores
- **Contabilidad**: Módulo contable
- **Configuración**: Ajustes del sistema

## 📊 Estructura de la Base de Datos

### Tablas Principales
- **users**: Usuarios del sistema
- **clients**: Clientes de la empresa
- **suppliers**: Proveedores
- **invoices**: Facturas emitidas
- **invoice_items**: Items de facturas
- **purchase_orders**: Órdenes de compra
- **quotations**: Cotizaciones
- **accounting_entries**: Asientos contables
- **company_settings**: Configuración de la empresa

### Relaciones
- Clientes → Facturas (1:N)
- Clientes → Cotizaciones (1:N)
- Proveedores → Órdenes de Compra (1:N)
- Facturas → Items de Factura (1:N)

## 🔧 Configuración Avanzada

### Integración con Proveedores
Para habilitar la integración con proveedores chilenos:

1. Obtener API keys de:
   - Sodimac
   - Maestro
   - Construmart

2. Configurar en `.env`:
```env
SODIMAC_API_KEY=tu_api_key
MAESTRO_API_KEY=tu_api_key
CONSTRUMART_API_KEY=tu_api_key
```

### Configuración de Email
Para notificaciones por email:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_app
```

## 📈 Escalabilidad

### Arquitectura Multi-Usuario
- Sistema de roles y permisos
- Acceso concurrente seguro
- Base de datos optimizada para múltiples usuarios

### Rendimiento
- Índices de base de datos optimizados
- Paginación en todas las listas
- Caché con React Query
- Compresión de respuestas

## 🔒 Seguridad

### Medidas Implementadas
- Autenticación JWT
- Validación de entrada
- Sanitización de datos
- Protección contra SQL injection
- Headers de seguridad (Helmet)

### Recomendaciones
- Usar HTTPS en producción
- Configurar firewall
- Backup regular de base de datos
- Monitoreo de logs

## 🐛 Solución de Problemas

### Errores Comunes

**Error de conexión a base de datos:**
- Verificar que PostgreSQL esté ejecutándose
- Revisar credenciales en `.env`
- Verificar que la base de datos existe

**Error de puerto en uso:**
- Cambiar puerto en `.env` (PORT=5001)
- Verificar que no hay otros servicios usando el puerto

**Error de dependencias:**
- Ejecutar `npm run install-all`
- Limpiar caché: `npm cache clean --force`

## 📞 Soporte

Para soporte técnico o consultas:
- **Email**: soporte@patolin.cl
- **Documentación**: Ver archivos en `/docs`
- **Issues**: Reportar en el repositorio

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

---

**Desarrollado para Patolin Construction** 🏗️
