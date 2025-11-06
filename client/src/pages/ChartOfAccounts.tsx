import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
  Tabs,
  Tab,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AccountTree as ChartIcon,
  AccountBalance as AssetIcon,
  AttachMoney as LiabilityIcon,
  Business as EquityIcon,
  TrendingUp as RevenueIcon,
  TrendingDown as ExpenseIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';

// Axios ya está configurado globalmente en AuthContext.tsx

interface ChartOfAccount {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  category: 'current' | 'fixed' | 'long_term' | 'other';
  parent_code?: string;
  description?: string;
  active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

const ChartOfAccounts: React.FC = () => {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<ChartOfAccount | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [filterType, setFilterType] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'asset' as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
    category: 'current' as 'current' | 'fixed' | 'long_term' | 'other',
    parent_code: '',
    description: '',
    active: true
  });

  useEffect(() => {
    fetchAccounts();
  }, [filterType]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const params: any = { active_only: false };
      if (filterType) params.type = filterType;

      const response = await axios.get('/accounting/chart-of-accounts', { params });
      if (response.data.success) {
        setAccounts(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching accounts:', error);
      setSnackbar({ open: true, message: 'Error cargando plan de cuentas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (account?: ChartOfAccount) => {
    if (account) {
      setSelectedAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        category: account.category,
        parent_code: account.parent_code || '',
        description: account.description || '',
        active: account.active
      });
    } else {
      setSelectedAccount(null);
      setFormData({
        code: '',
        name: '',
        type: 'asset',
        category: 'current',
        parent_code: '',
        description: '',
        active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAccount(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedAccount) {
        // Actualizar cuenta
        const response = await axios.patch(`/accounting/chart-of-accounts/${formData.code}`, formData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Cuenta actualizada exitosamente', severity: 'success' });
          fetchAccounts();
          handleCloseDialog();
        }
      } else {
        // Crear nueva cuenta
        const response = await axios.post('/accounting/chart-of-accounts', formData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Cuenta creada exitosamente', severity: 'success' });
          fetchAccounts();
          handleCloseDialog();
        }
      }
    } catch (error: any) {
      console.error('Error saving account:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error guardando cuenta', severity: 'error' });
    }
  };

  const handleDelete = async (code: string) => {
    if (!window.confirm('¿Está seguro de eliminar esta cuenta?')) return;

    try {
      const response = await axios.delete(`/accounting/chart-of-accounts/${code}`);
      if (response.data.success) {
        setSnackbar({ open: true, message: response.data.message || 'Cuenta eliminada exitosamente', severity: 'success' });
        fetchAccounts();
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error eliminando cuenta', severity: 'error' });
    }
  };

  const handleToggleActive = async (account: ChartOfAccount) => {
    try {
      const response = await axios.patch(`/accounting/chart-of-accounts/${account.code}`, {
        active: !account.active
      });
      if (response.data.success) {
        setSnackbar({ open: true, message: `Cuenta ${!account.active ? 'activada' : 'desactivada'} exitosamente`, severity: 'success' });
        fetchAccounts();
      }
    } catch (error: any) {
      console.error('Error toggling account:', error);
      setSnackbar({ open: true, message: 'Error cambiando estado de cuenta', severity: 'error' });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'asset': return <AssetIcon />;
      case 'liability': return <LiabilityIcon />;
      case 'equity': return <EquityIcon />;
      case 'revenue': return <RevenueIcon />;
      case 'expense': return <ExpenseIcon />;
      default: return <ChartIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'asset': return 'Activo';
      case 'liability': return 'Pasivo';
      case 'equity': return 'Patrimonio';
      case 'revenue': return 'Ingreso';
      case 'expense': return 'Gasto';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'asset': return 'info';
      case 'liability': return 'warning';
      case 'equity': return 'success';
      case 'revenue': return 'primary';
      case 'expense': return 'error';
      default: return 'default';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'current': return 'Corriente';
      case 'fixed': return 'Fijo';
      case 'long_term': return 'Largo Plazo';
      case 'other': return 'Otro';
      default: return category;
    }
  };

  const filteredAccounts = accounts.filter(account => {
    if (activeTab === 0) {
      // Todos
      if (filterType && account.type !== filterType) return false;
    } else {
      // Por tipo según tab
      const tabTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
      if (account.type !== tabTypes[activeTab - 1]) return false;
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        account.code.toLowerCase().includes(search) ||
        account.name.toLowerCase().includes(search) ||
        (account.description && account.description.toLowerCase().includes(search))
      );
    }

    return true;
  });

  const getCategoryOptions = (type: string) => {
    switch (type) {
      case 'asset':
        return [
          { value: 'current', label: 'Corriente' },
          { value: 'fixed', label: 'Fijo' },
          { value: 'other', label: 'Otro' }
        ];
      case 'liability':
        return [
          { value: 'current', label: 'Corriente' },
          { value: 'long_term', label: 'Largo Plazo' },
          { value: 'other', label: 'Otro' }
        ];
      default:
        return [
          { value: 'other', label: 'Otro' }
        ];
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Plan de Cuentas"
        subtitle="Gestiona el plan de cuentas contables de la empresa"
        action={{
          label: 'Nueva Cuenta',
          onClick: () => handleOpenDialog(),
          icon: <AddIcon />
        }}
      />

      {/* Tabs por tipo */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Todas" />
          <Tab label="Activos" icon={getTypeIcon('asset')} iconPosition="start" />
          <Tab label="Pasivos" icon={getTypeIcon('liability')} iconPosition="start" />
          <Tab label="Patrimonio" icon={getTypeIcon('equity')} iconPosition="start" />
          <Tab label="Ingresos" icon={getTypeIcon('revenue')} iconPosition="start" />
          <Tab label="Gastos" icon={getTypeIcon('expense')} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Filtros */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Buscar por código o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        {activeTab === 0 && (
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filtrar por Tipo</InputLabel>
            <Select value={filterType} label="Filtrar por Tipo" onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="asset">Activos</MenuItem>
              <MenuItem value="liability">Pasivos</MenuItem>
              <MenuItem value="equity">Patrimonio</MenuItem>
              <MenuItem value="revenue">Ingresos</MenuItem>
              <MenuItem value="expense">Gastos</MenuItem>
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Cargando...</TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No hay cuentas</TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.code} sx={{ opacity: account.active ? 1 : 0.6 }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{account.code}</Typography>
                  </TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getTypeIcon(account.type)}
                      label={getTypeLabel(account.type)}
                      color={getTypeColor(account.type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{getCategoryLabel(account.category)}</TableCell>
                  <TableCell>{account.description || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      icon={account.active ? <ActiveIcon /> : <InactiveIcon />}
                      label={account.active ? 'Activa' : 'Inactiva'}
                      color={account.active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpenDialog(account)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={account.active ? 'Desactivar' : 'Activar'}>
                        <IconButton size="small" onClick={() => handleToggleActive(account)}>
                          {account.active ? <InactiveIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDelete(account.code)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Crear/Editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="Ej: 1302"
                required
                disabled={!!selectedAccount}
                helperText="4 dígitos numéricos"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cuenta Padre (opcional)"
                value={formData.parent_code}
                onChange={(e) => setFormData({ ...formData, parent_code: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="Ej: 1300"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo"
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setFormData({
                      ...formData,
                      type: newType,
                      category: (getCategoryOptions(newType)[0]?.value || 'other') as 'current' | 'fixed' | 'long_term' | 'other'
                    });
                  }}
                >
                  <MenuItem value="asset">Activo</MenuItem>
                  <MenuItem value="liability">Pasivo</MenuItem>
                  <MenuItem value="equity">Patrimonio</MenuItem>
                  <MenuItem value="revenue">Ingreso</MenuItem>
                  <MenuItem value="expense">Gasto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.category}
                  label="Categoría"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                >
                  {getCategoryOptions(formData.type).map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descripción (opcional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                }
                label="Cuenta Activa"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default ChartOfAccounts;

