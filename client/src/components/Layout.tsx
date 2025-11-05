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
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Api as ApiIcon,
  CloudSync as CloudSyncIcon,
  Assessment as ExecutiveDashboardIcon,
  Assignment as WorkflowIcon,
  Inventory as InventoryIcon,
  Construction as ProjectsIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Dashboard Ejecutivo', icon: <ExecutiveDashboardIcon />, path: '/executive-dashboard' },
    { text: 'Clientes', icon: <PeopleIcon />, path: '/clients' },
    { text: 'Facturas', icon: <ReceiptIcon />, path: '/invoices' },
    { text: 'Órdenes de Compra', icon: <ShoppingCartIcon />, path: '/purchase-orders' },
    { text: 'Cotizaciones', icon: <DescriptionIcon />, path: '/quotations' },
    { text: 'Proveedores', icon: <StoreIcon />, path: '/suppliers' },
    { text: 'Workflow y Aprobaciones', icon: <WorkflowIcon />, path: '/workflow' },
    { text: 'Inventario', icon: <InventoryIcon />, path: '/inventory' },
    { text: 'Proyectos', icon: <ProjectsIcon />, path: '/projects' },
    { text: 'Integración IA Proveedores', icon: <ApiIcon />, path: '/supplier-integration' },
    { text: 'Integraciones SII/Bancos', icon: <CloudSyncIcon />, path: '/integrations' },
    { text: 'Contabilidad', icon: <AccountBalanceIcon />, path: '/accounting' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa' }}>
      <Toolbar
        sx={{
          backgroundColor: '#0d47a1',
          color: 'white',
          minHeight: '64px !important',
          px: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Box
            component="img"
            src="/Logo.jpg"
            alt="KaiZenith Spa Logo"
            sx={{
              height: 36,
              width: 'auto',
              objectFit: 'contain',
              mr: 1.5,
            }}
          />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: '0.875rem', lineHeight: 1.2 }}>
              KaiZenith Spa
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}>
              ERP Financiero
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, px: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                py: 0.75,
                px: 1.5,
                minHeight: 40,
                '&.Mui-selected': {
                  backgroundColor: '#e3f2fd',
                  color: '#0d47a1',
                  '&:hover': {
                    backgroundColor: '#bbdefb',
                  },
                  '& .MuiListItemIcon-root': {
                    color: '#0d47a1',
                  },
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 36, color: location.pathname === item.path ? '#0d47a1' : '#546e7a' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontSize: '0.813rem',
                  fontWeight: location.pathname === item.path ? 500 : 400,
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
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px !important', sm: '64px !important' }, px: { xs: 1.5, sm: 2, md: 3 }, backgroundColor: '#ffffff' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: { xs: 1, sm: 2 }, 
              display: { sm: 'none' },
              color: '#37474f',
              padding: { xs: '8px', sm: '12px' },
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
                fontWeight: 500, 
                fontSize: { xs: '0.875rem', sm: '0.938rem', md: '1rem' }, 
                color: '#212121',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Sistema ERP Financiero
            </Typography>
          </Box>
          <NotificationBell />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.813rem', color: '#212121' }}>
                {user?.name}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: '#546e7a' }}>
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
                color: '#37474f',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  backgroundColor: '#0d47a1',
                  fontSize: '0.875rem',
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
          backgroundColor: '#f5f7fa',
          minHeight: '100vh',
          overflowX: 'hidden',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: '56px !important', sm: '64px !important' } }} />
        <Box sx={{ maxWidth: '1600px', mx: 'auto', width: '100%' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
