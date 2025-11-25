import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Business as CompanyIcon,
  People as UsersIcon,
  Settings as SettingsIcon,
  Api as ApiIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface CompanyConfig {
  id: number;
  name: string;
  rut: string;
  address: string;
  city: string;
  region: string;
  phone: string;
  email: string;
  website: string;
  business_type: string;
  tax_regime: string;
  iva_rate: number;
  currency: string;
  fiscal_year_start: string;
  fiscal_year_end: string;
  invoice_prefix: string;
  quotation_prefix: string;
  purchase_order_prefix: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'accountant';
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface Integration {
  sii: {
    enabled: boolean;
    api_key: string;
    environment: string;
    last_sync: string | null;
  };
  banks: {
    enabled: boolean;
    bank_name: string;
    api_key: string;
    account_number: string;
  };
  suppliers: {
    enabled: boolean;
    apis: Array<{
      name: string;
      enabled: boolean;
      api_key: string;
      base_url: string;
      rate_limit: number;
    }>;
  };
}

interface SystemStats {
  company: {
    name: string;
    rut: string;
    created_at: string;
  };
  users: {
    total: number;
    active: number;
    by_role: {
      admin: number;
      accountant: number;
      user: number;
    };
  };
  integrations: {
    sii_enabled: boolean;
    banks_enabled: boolean;
    suppliers_enabled: boolean;
    suppliers_count: number;
  };
  system: {
    version: string;
    environment: string;
    uptime: number;
    memory_usage: any;
  };
}

const Settings: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [integrations, setIntegrations] = useState<Integration | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Estados para formularios
  const [companyForm, setCompanyForm] = useState({
    name: '',
    rut: '',
    address: '',
    city: '',
    region: '',
    phone: '',
    email: '',
    website: '',
    business_type: '',
    tax_regime: '',
    iva_rate: 19,
    currency: 'CLP',
    fiscal_year_start: '01-01',
    fiscal_year_end: '12-31',
    invoice_prefix: 'FAC',
    quotation_prefix: 'COT',
    purchase_order_prefix: 'OC'
  });

  const [userForm, setUserForm] = useState({
    email: '',
    name: '',
    role: 'user' as 'admin' | 'user' | 'accountant',
    password: '',
    active: true
  });

  const [integrationForm, setIntegrationForm] = useState({
    sii: {
      enabled: false,
      api_key: '',
      environment: 'test'
    },
    banks: {
      enabled: false,
      bank_name: '',
      api_key: '',
      account_number: ''
    },
    suppliers: {
      enabled: true,
      apis: [
        {
          name: 'Sodimac',
          enabled: true,
          api_key: '',
          base_url: 'https://api.sodimac.cl',
          rate_limit: 100
        },
        {
          name: 'Easy',
          enabled: true,
          api_key: '',
          base_url: 'https://api.easy.cl',
          rate_limit: 100
        },
        {
          name: 'Maestro',
          enabled: true,
          api_key: '',
          base_url: 'https://api.maestro.cl',
          rate_limit: 100
        }
      ]
    }
  });

  // Datos mock para desarrollo
  const mockCompanyConfig: CompanyConfig = {
    id: 1,
    name: 'Patolin Construction',
    rut: '12.345.678-9',
    address: 'Av. Principal 123',
    city: 'Santiago',
    region: 'Región Metropolitana',
    phone: '+56 9 1234 5678',
    email: 'contacto@patolin.cl',
    website: 'www.patolin.cl',
    business_type: 'Construcción y Remodelaciones',
    tax_regime: 'Régimen General',
    iva_rate: 19,
    currency: 'CLP',
    fiscal_year_start: '01-01',
    fiscal_year_end: '12-31',
    invoice_prefix: 'FAC',
    quotation_prefix: 'COT',
    purchase_order_prefix: 'OC',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z'
  };

  const mockUsers: User[] = [
    {
      id: 1,
      email: 'admin@patolin.cl',
      name: 'Administrador',
      role: 'admin',
      active: true,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      email: 'contador@patolin.cl',
      name: 'Contador',
      role: 'accountant',
      active: true,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 3,
      email: 'usuario@patolin.cl',
      name: 'Usuario General',
      role: 'user',
      active: true,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 0: // Configuración de empresa
          await fetchCompanyConfig();
          break;
        case 1: // Usuarios
          await fetchUsers();
          break;
        case 2: // Integraciones
          await fetchIntegrations();
          break;
        case 3: // Estadísticas
          await fetchSystemStats();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyConfig = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings/company', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyConfig(data.data || mockCompanyConfig);
        setCompanyForm(data.data || mockCompanyConfig);
      } else {
        setCompanyConfig(mockCompanyConfig);
        setCompanyForm(mockCompanyConfig);
      }
    } catch (error) {
      console.error('Error fetching company config:', error);
      setCompanyConfig(mockCompanyConfig);
      setCompanyForm(mockCompanyConfig);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || mockUsers);
      } else {
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers(mockUsers);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings/integrations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.data);
        setIntegrationForm(data.data);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSystemStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const handleSaveCompanyConfig = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings/company', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyForm)
      });

      if (response.ok) {
        setSuccess('Configuración de empresa actualizada exitosamente');
        fetchCompanyConfig();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar la configuración');
      }
    } catch (error) {
      console.error('Error saving company config:', error);
      setError('Error al actualizar la configuración');
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      email: '',
      name: '',
      role: 'user',
      password: '',
      active: true
    });
    setOpenUserDialog(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      name: user.name,
      role: user.role,
      password: '',
      active: user.active
    });
    setOpenUserDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      const url = editingUser 
        ? `http://localhost:5000/api/settings/users/${editingUser.id}`
        : 'http://localhost:5000/api/settings/users';
      
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { email: userForm.email, name: userForm.name, role: userForm.role, active: userForm.active }
        : userForm;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        setSuccess(editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
        setOpenUserDialog(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar el usuario');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Error al guardar el usuario');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/settings/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Usuario eliminado exitosamente');
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar el usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error al eliminar el usuario');
    }
  };

  const handleSaveIntegrations = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings/integrations', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(integrationForm)
      });

      if (response.ok) {
        setSuccess('Configuraciones de integración actualizadas exitosamente');
        fetchIntegrations();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar las integraciones');
      }
    } catch (error) {
      console.error('Error saving integrations:', error);
      setError('Error al actualizar las integraciones');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'accountant': return 'warning';
      case 'user': return 'primary';
      default: return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'accountant': return 'Contador';
      case 'user': return 'Usuario';
      default: return role;
    }
  };

  const renderCompanyTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Configuración de Empresa</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveCompanyConfig}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Guardar Cambios
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Nombre de la Empresa"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="RUT"
                    value={companyForm.rut}
                    onChange={(e) => setCompanyForm({ ...companyForm, rut: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Teléfono"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    type="email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Sitio Web"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Tipo de Negocio"
                    value={companyForm.business_type}
                    onChange={(e) => setCompanyForm({ ...companyForm, business_type: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Dirección
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Dirección"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Ciudad"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Región"
                    value={companyForm.region}
                    onChange={(e) => setCompanyForm({ ...companyForm, region: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configuración Fiscal y Contable
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Régimen Tributario</InputLabel>
                    <Select
                      value={companyForm.tax_regime}
                      onChange={(e) => setCompanyForm({ ...companyForm, tax_regime: e.target.value })}
                      label="Régimen Tributario"
                    >
                      <MenuItem value="Régimen General">Régimen General</MenuItem>
                      <MenuItem value="Régimen Pro Pyme">Régimen Pro Pyme</MenuItem>
                      <MenuItem value="Régimen Simplificado">Régimen Simplificado</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Tasa de IVA (%)"
                    type="number"
                    value={companyForm.iva_rate}
                    onChange={(e) => setCompanyForm({ ...companyForm, iva_rate: parseFloat(e.target.value) || 0 })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Moneda</InputLabel>
                    <Select
                      value={companyForm.currency}
                      onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                      label="Moneda"
                    >
                      <MenuItem value="CLP">Peso Chileno (CLP)</MenuItem>
                      <MenuItem value="USD">Dólar Americano (USD)</MenuItem>
                      <MenuItem value="EUR">Euro (EUR)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Inicio Año Fiscal"
                    value={companyForm.fiscal_year_start}
                    onChange={(e) => setCompanyForm({ ...companyForm, fiscal_year_start: e.target.value })}
                    fullWidth
                    placeholder="MM-DD"
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Fin Año Fiscal"
                    value={companyForm.fiscal_year_end}
                    onChange={(e) => setCompanyForm({ ...companyForm, fiscal_year_end: e.target.value })}
                    fullWidth
                    placeholder="MM-DD"
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prefijos de Documentos
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Prefijo Facturas"
                    value={companyForm.invoice_prefix}
                    onChange={(e) => setCompanyForm({ ...companyForm, invoice_prefix: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Prefijo Cotizaciones"
                    value={companyForm.quotation_prefix}
                    onChange={(e) => setCompanyForm({ ...companyForm, quotation_prefix: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Prefijo Órdenes de Compra"
                    value={companyForm.purchase_order_prefix}
                    onChange={(e) => setCompanyForm({ ...companyForm, purchase_order_prefix: e.target.value })}
                    fullWidth
                    required
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderUsersTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Gestión de Usuarios</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateUser}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip
                    label={getRoleLabel(user.role)}
                    color={getRoleColor(user.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={user.active ? <ActiveIcon /> : <InactiveIcon />}
                    label={user.active ? 'Activo' : 'Inactivo'}
                    color={user.active ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{new Date(user.created_at).toLocaleDateString('es-CL')}</TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.id)}
                          color="error"
                          disabled={user.role === 'admin'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderIntegrationsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Integraciones</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSaveIntegrations}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Guardar Cambios
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* SII */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Servicio de Impuestos Internos (SII)
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={integrationForm.sii.enabled}
                    onChange={(e) => setIntegrationForm({
                      ...integrationForm,
                      sii: { ...integrationForm.sii, enabled: e.target.checked }
                    })}
                  />
                }
                label="Habilitar integración con SII"
              />
              {integrationForm.sii.enabled && (
                <Box mt={2}>
                  <TextField
                    label="API Key"
                    type="password"
                    value={integrationForm.sii.api_key}
                    onChange={(e) => setIntegrationForm({
                      ...integrationForm,
                      sii: { ...integrationForm.sii, api_key: e.target.value }
                    })}
                    fullWidth
                    size="small"
                  />
                  <FormControl fullWidth size="small" sx={{ mt: 2 }}>
                    <InputLabel>Ambiente</InputLabel>
                    <Select
                      value={integrationForm.sii.environment}
                      onChange={(e) => setIntegrationForm({
                        ...integrationForm,
                        sii: { ...integrationForm.sii, environment: e.target.value }
                      })}
                      label="Ambiente"
                    >
                      <MenuItem value="test">Pruebas</MenuItem>
                      <MenuItem value="production">Producción</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bancos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Integración Bancaria
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={integrationForm.banks.enabled}
                    onChange={(e) => setIntegrationForm({
                      ...integrationForm,
                      banks: { ...integrationForm.banks, enabled: e.target.checked }
                    })}
                  />
                }
                label="Habilitar integración bancaria"
              />
              {integrationForm.banks.enabled && (
                <Box mt={2}>
                  <TextField
                    label="Banco"
                    value={integrationForm.banks.bank_name}
                    onChange={(e) => setIntegrationForm({
                      ...integrationForm,
                      banks: { ...integrationForm.banks, bank_name: e.target.value }
                    })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="API Key"
                    type="password"
                    value={integrationForm.banks.api_key}
                    onChange={(e) => setIntegrationForm({
                      ...integrationForm,
                      banks: { ...integrationForm.banks, api_key: e.target.value }
                    })}
                    fullWidth
                    size="small"
                    sx={{ mt: 2 }}
                  />
                  <TextField
                    label="Número de Cuenta"
                    value={integrationForm.banks.account_number}
                    onChange={(e) => setIntegrationForm({
                      ...integrationForm,
                      banks: { ...integrationForm.banks, account_number: e.target.value }
                    })}
                    fullWidth
                    size="small"
                    sx={{ mt: 2 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Proveedores */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                APIs de Proveedores
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={integrationForm.suppliers.enabled}
                    onChange={(e) => setIntegrationForm({
                      ...integrationForm,
                      suppliers: { ...integrationForm.suppliers, enabled: e.target.checked }
                    })}
                  />
                }
                label="Habilitar integración con proveedores"
              />
              
              {integrationForm.suppliers.enabled && (
                <Box mt={2}>
                  {integrationForm.suppliers.apis.map((api, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" alignItems="center" width="100%">
                          <FormControlLabel
                            control={
                              <Switch
                                checked={api.enabled}
                                onChange={(e) => {
                                  const newApis = [...integrationForm.suppliers.apis];
                                  newApis[index].enabled = e.target.checked;
                                  setIntegrationForm({
                                    ...integrationForm,
                                    suppliers: { ...integrationForm.suppliers, apis: newApis }
                                  });
                                }}
                              />
                            }
                            label=""
                            sx={{ mr: 2 }}
                          />
                          <Typography variant="subtitle1">{api.name}</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="API Key"
                              type="password"
                              value={api.api_key}
                              onChange={(e) => {
                                const newApis = [...integrationForm.suppliers.apis];
                                newApis[index].api_key = e.target.value;
                                setIntegrationForm({
                                  ...integrationForm,
                                  suppliers: { ...integrationForm.suppliers, apis: newApis }
                                });
                              }}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="URL Base"
                              value={api.base_url}
                              onChange={(e) => {
                                const newApis = [...integrationForm.suppliers.apis];
                                newApis[index].base_url = e.target.value;
                                setIntegrationForm({
                                  ...integrationForm,
                                  suppliers: { ...integrationForm.suppliers, apis: newApis }
                                });
                              }}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Límite de Rate (req/min)"
                              type="number"
                              value={api.rate_limit}
                              onChange={(e) => {
                                const newApis = [...integrationForm.suppliers.apis];
                                newApis[index].rate_limit = parseInt(e.target.value) || 100;
                                setIntegrationForm({
                                  ...integrationForm,
                                  suppliers: { ...integrationForm.suppliers, apis: newApis }
                                });
                              }}
                              fullWidth
                              size="small"
                            />
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderStatsTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Estadísticas del Sistema
      </Typography>

      {systemStats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Información de la Empresa
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Nombre"
                      secondary={systemStats.company.name}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="RUT"
                      secondary={systemStats.company.rut}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Fecha de Creación"
                      secondary={new Date(systemStats.company.created_at).toLocaleDateString('es-CL')}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Usuarios
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Total de Usuarios"
                      secondary={systemStats.users.total}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Usuarios Activos"
                      secondary={systemStats.users.active}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Administradores"
                      secondary={systemStats.users.by_role.admin}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Contadores"
                      secondary={systemStats.users.by_role.accountant}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Usuarios Generales"
                      secondary={systemStats.users.by_role.user}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Integraciones
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="SII"
                      secondary={systemStats.integrations.sii_enabled ? 'Habilitado' : 'Deshabilitado'}
                    />
                    <ListItemSecondaryAction>
                      {systemStats.integrations.sii_enabled ? (
                        <ActiveIcon color="success" />
                      ) : (
                        <InactiveIcon color="error" />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Bancos"
                      secondary={systemStats.integrations.banks_enabled ? 'Habilitado' : 'Deshabilitado'}
                    />
                    <ListItemSecondaryAction>
                      {systemStats.integrations.banks_enabled ? (
                        <ActiveIcon color="success" />
                      ) : (
                        <InactiveIcon color="error" />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Proveedores"
                      secondary={systemStats.integrations.suppliers_enabled ? 'Habilitado' : 'Deshabilitado'}
                    />
                    <ListItemSecondaryAction>
                      {systemStats.integrations.suppliers_enabled ? (
                        <ActiveIcon color="success" />
                      ) : (
                        <InactiveIcon color="error" />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="APIs de Proveedores"
                      secondary={`${systemStats.integrations.suppliers_count} configuradas`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sistema
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Versión"
                      secondary={systemStats.system.version}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Ambiente"
                      secondary={systemStats.system.environment}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Tiempo de Actividad"
                      secondary={`${Math.floor(systemStats.system.uptime / 3600)} horas`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Uso de Memoria"
                      secondary={`${Math.round(systemStats.system.memory_usage.heapUsed / 1024 / 1024)} MB`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando configuración...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{
          fontWeight: 700,
          color: '#ffffff',
          textShadow: '0 2px 8px rgba(94, 114, 228, 0.6)',
        }}
      >
        Configuración
      </Typography>

      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)} 
        sx={{ 
          mb: 3,
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': {
              color: '#ffffff',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#5e72e4',
          },
        }}
      >
        <Tab icon={<CompanyIcon />} label="Empresa" />
        <Tab icon={<UsersIcon />} label="Usuarios" />
        <Tab icon={<ApiIcon />} label="Integraciones" />
        <Tab icon={<SettingsIcon />} label="Estadísticas" />
      </Tabs>

      {activeTab === 0 && renderCompanyTab()}
      {activeTab === 1 && renderUsersTab()}
      {activeTab === 2 && renderIntegrationsTab()}
      {activeTab === 3 && renderStatsTab()}

      {/* Dialog para crear/editar usuario */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nombre"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                  label="Rol"
                >
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="accountant">Contador</MenuItem>
                  <MenuItem value="user">Usuario</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {!editingUser && (
              <Grid item xs={12}>
                <TextField
                  label="Contraseña"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  fullWidth
                  required
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userForm.active}
                    onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })}
                  />
                }
                label="Usuario Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveUser} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;