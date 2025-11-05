import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Importar rutas
import authRoutes from './routes/auth-simple';
import clientRoutes from './routes/clients-simple';
import invoiceRoutes from './routes/invoices-simple';
import purchaseOrderRoutes from './routes/purchaseOrders-simple';
import quotationRoutes from './routes/quotations-simple';
import supplierRoutes from './routes/suppliers-simple';
import accountingRoutes from './routes/accounting-simple';
import settingsRoutes from './routes/settings-simple';
import supplierIntegrationRoutes from './routes/supplier-integration';
import intelligentSupplierSearchRoutes from './routes/intelligent-supplier-search';
import apiManagementRoutes from './routes/api-management';
import siiIntegrationRoutes from './routes/sii-integration';
import bankingIntegrationRoutes from './routes/banking-integration';
import workflowRoutes from './routes/workflow-simple';
import inventoryRoutes from './routes/inventory-simple';
import projectsRoutes from './routes/projects-simple';
import dashboardRoutes from './routes/dashboard-simple';
import notificationsRoutes from './routes/notifications-simple';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/supplier-integration', supplierIntegrationRoutes);
app.use('/api/intelligent-search', intelligentSupplierSearchRoutes);
app.use('/api/management', apiManagementRoutes);
app.use('/api/sii', siiIntegrationRoutes);
app.use('/api/banking', bankingIntegrationRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🏢 Empresa: ${process.env.COMPANY_NAME || 'Patolin Construction'}`);
  console.log(`📊 Modo: Sin base de datos (datos en memoria)`);
  console.log(`🔗 APIs Habilitadas:`);
  console.log(`   ✅ Autenticación (3 endpoints)`);
  console.log(`   ✅ Clientes (5 endpoints)`);
  console.log(`   ✅ Facturas (6 endpoints)`);
  console.log(`   ✅ Órdenes de Compra (6 endpoints)`);
  console.log(`   ✅ Cotizaciones (6 endpoints)`);
  console.log(`   ✅ Proveedores (6 endpoints)`);
  console.log(`   ✅ Contabilidad (7 endpoints)`);
  console.log(`   ✅ Configuración (6 endpoints)`);
  console.log(`   ✅ Integración Proveedores (5 endpoints)`);
  console.log(`   ✅ Búsqueda Inteligente IA (4 endpoints)`);
  console.log(`   ✅ Gestión de APIs (6 endpoints)`);
  console.log(`   ✅ Integración SII (8 endpoints)`);
  console.log(`   ✅ Integración Bancaria (7 endpoints)`);
  console.log(`   ✅ Workflow y Aprobaciones (8 endpoints)`);
  console.log(`   ✅ Gestión de Inventario (10 endpoints)`);
  console.log(`   ✅ Gestión de Proyectos (7 endpoints)`);
  console.log(`   ✅ Dashboard Ejecutivo (2 endpoints)`);
  console.log(`   ✅ Notificaciones y Alertas (7 endpoints)`);
  console.log(`🤖 Total: 116 endpoints activos`);
  console.log(`🌐 Acceso: http://localhost:${PORT}`);
});

export default app;
