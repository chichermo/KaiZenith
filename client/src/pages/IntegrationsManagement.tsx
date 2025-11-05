import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Avatar,
  Tabs,
  Tab,
  Autocomplete,
  Stack,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  Receipt as SIIIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Sync as SyncIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  FilterList as FilterIcon,
  SmartToy as AIIcon,
  Recommend as RecommendIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  PriceCheck as PriceIcon,
  Inventory as InventoryIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  CreditCard as CreditCardIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Security as SecurityIcon,
  CloudSync as CloudSyncIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface SIIStatus {
  rut: string;
  estado: string;
  ultimaDeclaracion: string;
  proximaDeclaracion: string;
  saldoFavor: number;
  saldoDeuda: number;
  observaciones: string[];
}

interface BankInfo {
  key: string;
  name: string;
  code: string;
  shortName: string;
  website: string;
  services: string[];
  atms: number;
  branches: number;
  coverage: string;
}

interface BankBalance {
  bank: string;
  accountNumber: string;
  rut: string;
  balance: number;
  currency: string;
  lastUpdate: string;
  accountType: string;
  availableBalance: number;
}

interface BankTransfer {
  transactionId: string;
  fromBank: string;
  toBank: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  fee: number;
  reference: string;
}

const IntegrationsManagement: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [siiStatus, setSiiStatus] = useState<SIIStatus | null>(null);
  const [banks, setBanks] = useState<BankInfo[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [bankBalance, setBankBalance] = useState<BankBalance | null>(null);
  const [bankTransfers, setBankTransfers] = useState<BankTransfer[]>([]);
  const [rut, setRut] = useState('12.345.678-9');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openSiiDialog, setOpenSiiDialog] = useState(false);
  const [openBankDialog, setOpenBankDialog] = useState(false);

  // Datos mock para desarrollo
  const mockBanks: BankInfo[] = [
    {
      key: 'banco_chile',
      name: 'Banco de Chile',
      code: '001',
      shortName: 'Banco Chile',
      website: 'https://www.bancochile.cl',
      services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito'],
      atms: 1200,
      branches: 400,
      coverage: 'Nacional'
    },
    {
      key: 'santander',
      name: 'Banco Santander Chile',
      code: '037',
      shortName: 'Santander',
      website: 'https://www.santander.cl',
      services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito', 'inversiones'],
      atms: 1000,
      branches: 350,
      coverage: 'Nacional'
    },
    {
      key: 'bci',
      name: 'Banco de Crédito e Inversiones',
      code: '016',
      shortName: 'BCI',
      website: 'https://www.bci.cl',
      services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito', 'inversiones'],
      atms: 800,
      branches: 300,
      coverage: 'Nacional'
    },
    {
      key: 'itau',
      name: 'Banco Itaú Chile',
      code: '049',
      shortName: 'Itaú',
      website: 'https://www.itau.cl',
      services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito'],
      atms: 600,
      branches: 200,
      coverage: 'Nacional'
    },
    {
      key: 'scotiabank',
      name: 'Scotiabank Chile',
      code: '014',
      shortName: 'Scotiabank',
      website: 'https://www.scotiabank.cl',
      services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito'],
      atms: 500,
      branches: 180,
      coverage: 'Nacional'
    }
  ];

  const mockSiiStatus: SIIStatus = {
    rut: '12.345.678-9',
    estado: 'AL DÍA',
    ultimaDeclaracion: '2024-01-31',
    proximaDeclaracion: '2024-02-28',
    saldoFavor: 0,
    saldoDeuda: 0,
    observaciones: []
  };

  useEffect(() => {
    fetchBanks();
    fetchSiiStatus();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/banking/banks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBanks(data.data);
      } else {
        setBanks(mockBanks);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
      setBanks(mockBanks);
    }
  };

  const fetchSiiStatus = async () => {
    if (!rut || rut.trim() === '' || rut === '12.345.678-9') {
      // RUT de ejemplo, no hacer petición
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/sii/tax-status/${rut}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSiiStatus(data.data);
      } else {
        setSiiStatus(mockSiiStatus);
      }
    } catch (error) {
      console.error('Error fetching SII status:', error);
      setSiiStatus(mockSiiStatus);
    }
  };

  const fetchBankBalance = async () => {
    if (!selectedBank || !accountNumber) {
      setError('Selecciona un banco y ingresa el número de cuenta');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/banking/balance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bankKey: selectedBank,
          accountNumber: accountNumber,
          rut: rut
        })
      });

      if (response.ok) {
        const data = await response.json();
        setBankBalance(data.data);
        setSuccess('Saldo consultado exitosamente');
      } else {
        setError('Error consultando saldo');
      }
    } catch (error) {
      console.error('Error fetching bank balance:', error);
      setError('Error consultando saldo');
    } finally {
      setLoading(false);
    }
  };

  const validateRut = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sii/validate-rut', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rut })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.valid) {
          setSuccess('RUT válido');
          fetchSiiStatus();
        } else {
          setError('RUT inválido');
        }
      }
    } catch (error) {
      console.error('Error validating RUT:', error);
      setError('Error validando RUT');
    }
  };

  const renderSIITab = () => (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <SIIIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">
          Integración con SII
        </Typography>
        <Chip 
          label="Oficial" 
          color="success" 
          size="small" 
          sx={{ ml: 2 }} 
        />
      </Box>

      {/* Validación de RUT */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Validación de RUT
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                label="RUT"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                fullWidth
                placeholder="12.345.678-9"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={validateRut}
                fullWidth
                startIcon={<VerifiedIcon />}
              >
                Validar RUT
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="outlined"
                onClick={fetchSiiStatus}
                fullWidth
                startIcon={<SearchIcon />}
              >
                Consultar Estado
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estado Tributario */}
      {siiStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Estado Tributario
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <BusinessIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    <strong>RUT:</strong> {siiStatus.rut}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <CheckIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="subtitle1">
                    <strong>Estado:</strong> {siiStatus.estado}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    <strong>Última Declaración:</strong> {siiStatus.ultimaDeclaracion}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    <strong>Próxima Declaración:</strong> {siiStatus.proximaDeclaracion}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="subtitle1">
                    <strong>Saldo a Favor:</strong> ${siiStatus.saldoFavor.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <MoneyIcon sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="subtitle1">
                    <strong>Saldo Deuda:</strong> ${siiStatus.saldoDeuda.toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Servicios SII */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Documentos Tributarios
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Facturas" secondary="Envío automático" />
                  <ListItemSecondaryAction>
                    <Chip label="Activo" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Notas de Crédito" secondary="Envío automático" />
                  <ListItemSecondaryAction>
                    <Chip label="Activo" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Notas de Débito" secondary="Envío automático" />
                  <ListItemSecondaryAction>
                    <Chip label="Activo" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Libros Contables
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Libro de Ventas" secondary="Sincronización automática" />
                  <ListItemSecondaryAction>
                    <Chip label="Activo" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Libro de Compras" secondary="Sincronización automática" />
                  <ListItemSecondaryAction>
                    <Chip label="Activo" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Libro de Honorarios" secondary="Sincronización automática" />
                  <ListItemSecondaryAction>
                    <Chip label="Activo" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Declaraciones
              </Typography>
              <List>
                <ListItem>
                  <ListItemText primary="Declaración Mensual" secondary="Automática" />
                  <ListItemSecondaryAction>
                    <Chip label="Activo" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Declaración Anual" secondary="Automática" />
                  <ListItemSecondaryAction>
                    <Chip label="Activo" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText primary="Certificados Digitales" secondary="Renovación automática" />
                  <ListItemSecondaryAction>
                    <Chip label="Activo" color="success" size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderBankingTab = () => (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <BankIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">
          Integración Bancaria
        </Typography>
        <Chip 
          label="15 Bancos" 
          color="info" 
          size="small" 
          sx={{ ml: 2 }} 
        />
      </Box>

      {/* Consulta de Saldo */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Consulta de Saldo
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Banco</InputLabel>
                <Select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  label="Banco"
                >
                  {banks.map((bank) => (
                    <MenuItem key={bank.key} value={bank.key}>
                      {bank.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Número de Cuenta"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                fullWidth
                placeholder="1234567890"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                onClick={fetchBankBalance}
                disabled={loading}
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                Consultar Saldo
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Información del Saldo */}
      {bankBalance && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Información de Cuenta
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <BankIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    <strong>Banco:</strong> {bankBalance.bank}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <CreditCardIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    <strong>Cuenta:</strong> {bankBalance.accountNumber}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <BusinessIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    <strong>Tipo:</strong> {bankBalance.accountType}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" mb={2}>
                  <MoneyIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6">
                    <strong>Saldo:</strong> ${bankBalance.balance.toLocaleString('es-CL')} {bankBalance.currency}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <MoneyIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="subtitle1">
                    <strong>Disponible:</strong> ${bankBalance.availableBalance.toLocaleString('es-CL')} {bankBalance.currency}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" mb={2}>
                  <CalendarIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    <strong>Última Actualización:</strong> {new Date(bankBalance.lastUpdate).toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Lista de Bancos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Bancos Integrados
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Banco</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Cobertura</TableCell>
                  <TableCell>Cajeros</TableCell>
                  <TableCell>Sucursales</TableCell>
                  <TableCell>Servicios</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {banks.map((bank) => (
                  <TableRow key={bank.key}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 1, bgcolor: 'primary.main' }}>
                          {bank.shortName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">{bank.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {bank.shortName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{bank.code}</TableCell>
                    <TableCell>{bank.coverage}</TableCell>
                    <TableCell>{bank.atms.toLocaleString()}</TableCell>
                    <TableCell>{bank.branches.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {bank.services.slice(0, 3).map((service, index) => (
                          <Chip key={index} label={service} size="small" />
                        ))}
                        {bank.services.length > 3 && (
                          <Chip label={`+${bank.services.length - 3}`} size="small" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label="Conectado" color="success" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Integraciones
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<SIIIcon />} label="SII" />
        <Tab icon={<BankIcon />} label="Bancos" />
      </Tabs>

      {activeTab === 0 && renderSIITab()}
      {activeTab === 1 && renderBankingTab()}

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

export default IntegrationsManagement;
