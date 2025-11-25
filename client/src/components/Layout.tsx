import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Description as DescriptionIcon,
  Store as StoreIcon,
  AccountBalance as AccountBalanceIcon,
  AccountTree as AccountTreeIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Api as ApiIcon,
  CloudSync as CloudSyncIcon,
  Assessment as ExecutiveDashboardIcon,
  Assessment as AssessmentIcon,
  Assignment as WorkflowIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  Construction as ProjectsIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import FinancialCalculator from './FinancialCalculator';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Login desactivado temporalmente - no hacer logout
    // logout();
    // navigate('/login');
    handleMenuClose();
    // Por ahora, solo cerrar el menú
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Dashboard Profesional', icon: <ExecutiveDashboardIcon />, path: '/professional-dashboard' },
    { text: 'Dashboard Ejecutivo', icon: <ExecutiveDashboardIcon />, path: '/executive-dashboard' },
    { text: 'Clientes', icon: <PeopleIcon />, path: '/clients' },
    { text: 'Facturas', icon: <ReceiptIcon />, path: '/invoices' },
    { text: 'Órdenes de Compra', icon: <ShoppingCartIcon />, path: '/purchase-orders' },
    { text: 'Facturas de Compra', icon: <ReceiptIcon />, path: '/purchase-invoices' },
    { text: 'Cotizaciones', icon: <DescriptionIcon />, path: '/quotations' },
    { text: 'Proveedores', icon: <StoreIcon />, path: '/suppliers' },
    { text: 'Workflow y Aprobaciones', icon: <WorkflowIcon />, path: '/workflow' },
    { text: 'Tareas y Recordatorios', icon: <AssignmentIcon />, path: '/tasks' },
    { text: 'Recursos Humanos', icon: <PeopleIcon />, path: '/payroll' },
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Proyectos', icon: <ProjectsIcon />, path: '/projects' },
    { text: 'Integración IA Proveedores', icon: <ApiIcon />, path: '/supplier-integration' },
    { text: 'Integraciones SII/Bancos', icon: <CloudSyncIcon />, path: '/integrations' },
    { text: 'Contabilidad', icon: <AccountBalanceIcon />, path: '/accounting' },
    { text: 'Reportes Contables', icon: <AssessmentIcon />, path: '/accounting-reports' },
    { text: 'Plan de Cuentas', icon: <AccountTreeIcon />, path: '/chart-of-accounts' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: 'linear-gradient(180deg, #172b4d 0%, #1a2742 100%)',
      color: 'white',
    }}>
      <Toolbar
        sx={{
          background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
          color: 'white',
          minHeight: '64px !important',
          px: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(87deg, #ffffff 0, #f0f0f0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box
              component="img"
              src="/Logo.jpg"
              alt="KaiZenith Spa Logo"
              sx={{
                height: 32,
                width: 32,
                objectFit: 'contain',
                borderRadius: '50%',
              }}
            />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2, color: 'white' }}>
              KaiZenith Spa
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
              ERP Financiero
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ flexGrow: 1, px: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 2,
                py: 0.75,
                px: 1.5,
                minHeight: 40,
                mb: 0.5,
                '&.Mui-selected': {
                  background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 6px rgba(94, 114, 228, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(87deg, #4c63d2 0, #6d4cd2 100%)',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#ffffff',
                  },
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: location.pathname === item.path ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: '0.813rem',
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  color: location.pathname === item.path ? '#ffffff' : 'rgba(255,255,255,0.9)',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
          boxShadow: '0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)',
        }}
      >
        <Toolbar sx={{ 
          minHeight: { xs: '56px !important', sm: '64px !important' }, 
          px: { xs: 1.5, sm: 2, md: 3 }, 
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0.125rem 0.5rem rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
        }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: { xs: 1, sm: 2 }, 
              display: { sm: 'none' },
              color: 'rgba(255, 255, 255, 0.9)',
              padding: { xs: '8px', sm: '12px' },
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.2) 0%, rgba(130, 94, 228, 0.2) 100%)',
              },
            }}
          >
            <MenuIcon sx={{ fontSize: { xs: '24px', sm: '28px' } }} />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 600, 
                fontSize: { xs: '0.875rem', sm: '0.938rem', md: '1rem' }, 
                color: 'rgba(255, 255, 255, 0.9)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: { xs: 'none', md: 'block' },
                mr: 2,
              }}
            >
              Home &gt; Dashboard
            </Typography>
            <GlobalSearch />
          </Box>
          <NotificationBell />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.813rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                {user?.role === 'admin' ? 'Administrador' : user?.role === 'accountant' ? 'Contador' : 'Usuario'}
              </Typography>
            </Box>
            <IconButton
              size="small"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenuOpen}
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                position: 'relative',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.2) 0%, rgba(130, 94, 228, 0.2) 100%)',
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: '#f5365c',
                  border: '2px solid #ffffff',
                  zIndex: 1,
                }}
              />
              <Avatar 
                sx={{ 
                  width: 36, 
                  height: 36,
                  background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  borderRadius: 1,
                  mt: 1,
                  minWidth: 180,
                  border: '1px solid #e0e0e0',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.12)',
                },
              }}
            >
              <MenuItem onClick={handleMenuClose} sx={{ py: 1, fontSize: '0.875rem' }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Perfil" />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setCalculatorOpen(true);
                  handleMenuClose();
                }}
                sx={{ py: 1, fontSize: '0.875rem' }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CalculateIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Calculadora Financiera" />
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ py: 1, fontSize: '0.875rem' }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Cerrar Sesión" />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: { xs: '280px', sm: drawerWidth },
              maxWidth: '85vw',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 50%, #1a2742 100%)',
          minHeight: '100vh',
          overflowX: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '300px',
            background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.15) 0%, rgba(130, 94, 228, 0.15) 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(94, 114, 228, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          },
          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px !important', sm: '64px !important' } }} />
        <Box sx={{ maxWidth: '1600px', mx: 'auto', width: '100%' }}>
          {children}
        </Box>
      </Box>
      <FinancialCalculator open={calculatorOpen} onClose={() => setCalculatorOpen(false)} />
    </Box>
  );
};

export default Layout;
