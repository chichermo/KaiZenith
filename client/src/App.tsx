import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import PurchaseOrders from './pages/PurchaseOrders';
import Quotations from './pages/Quotations';
import Suppliers from './pages/Suppliers';
import Accounting from './pages/Accounting';
import Settings from './pages/Settings';
import SupplierIntegration from './pages/EnhancedSupplierIntegration';
import IntegrationsManagement from './pages/IntegrationsManagement';
import Workflow from './pages/Workflow';
import Inventory from './pages/Inventory';
import Projects from './pages/Projects';
import PurchaseInvoices from './pages/PurchaseInvoices';
import ChartOfAccounts from './pages/ChartOfAccounts';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import AccountingReports from './pages/AccountingReports';
import Tasks from './pages/Tasks';
import Payroll from './pages/Payroll';

// Componente para rutas protegidas (DESACTIVADO TEMPORALMENTE)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  // Login desactivado - siempre permitir acceso
  return <>{children}</>;
};

// Componente principal de la aplicación
const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  // Mostrar loading mientras se inicializa el usuario de prueba
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h6">Cargando aplicación...</Typography>
        <Box sx={{ width: 200 }}>
          <Box sx={{ 
            width: '100%', 
            height: 4, 
            bgcolor: '#e0e0e0', 
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              width: '30%', 
              height: '100%', 
              bgcolor: 'primary.main',
              animation: 'loading 1.5s ease-in-out infinite',
              '@keyframes loading': {
                '0%': { transform: 'translateX(-100%)' },
                '100%': { transform: 'translateX(400%)' }
              }
            }} />
          </Box>
        </Box>
      </Box>
    );
  }

  // Login desactivado - acceso directo sin autenticación
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/professional-dashboard" element={<ProfessionalDashboard />} />
        <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
        <Route path="/accounting-reports" element={<AccountingReports />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/purchase-orders" element={<PurchaseOrders />} />
        <Route path="/quotations" element={<Quotations />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/accounting" element={<Accounting />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/supplier-integration" element={<SupplierIntegration />} />
        <Route path="/integrations" element={<IntegrationsManagement />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/purchase-invoices" element={<PurchaseInvoices />} />
        <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/payroll" element={<Payroll />} />
        {/* Ruta de login comentada pero disponible para reactivar más tarde */}
        {/* <Route path="/login" element={<Login />} /> */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppContent />
        </Box>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
