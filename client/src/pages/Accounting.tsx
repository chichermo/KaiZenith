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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AccountBalance as BalanceIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  Receipt as EntryIcon,
  AccountTree as ChartIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface AccountingEntry {
  id: number;
  date: string;
  reference: string;
  description: string;
  entries: Array<{
    account: string;
    debit: number;
    credit: number;
    description: string;
  }>;
  total_debit: number;
  total_credit: number;
  created_at: string;
  updated_at: string;
}

interface ChartOfAccounts {
  [key: string]: string;
}

interface BalanceSheet {
  assets: {
    current: { [key: string]: { balance: number; description: string } };
    fixed: { [key: string]: { balance: number; description: string } };
  };
  liabilities: {
    current: { [key: string]: { balance: number; description: string } };
    long_term: { [key: string]: { balance: number; description: string } };
  };
  equity: { [key: string]: { balance: number; description: string } };
}

interface IncomeStatement {
  period: { from: string; to: string };
  revenues: { [key: string]: { balance: number; description: string } };
  costs: { [key: string]: { balance: number; description: string } };
  expenses: { [key: string]: { balance: number; description: string } };
  totals: {
    revenue: number;
    costs: number;
    expenses: number;
    gross_profit: number;
    net_income: number;
  };
}

const Accounting: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccounts>({});
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountingEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [accountFilter, setAccountFilter] = useState('');

  // Estados para el formulario de entrada contable
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reference: '',
    description: '',
    entries: [
      { account: '', debit: 0, credit: 0, description: '' },
      { account: '', debit: 0, credit: 0, description: '' }
    ]
  });

  // Datos mock para desarrollo
  const mockEntries: AccountingEntry[] = [
    {
      id: 1,
      date: '2024-01-15',
      reference: 'FAC-000001',
      description: 'Venta de servicios de construcción',
      entries: [
        { account: '1201', debit: 119000, credit: 0, description: 'Cuentas por Cobrar Clientes' },
        { account: '4101', debit: 0, credit: 100000, description: 'Ventas de Servicios' },
        { account: '2105', debit: 0, credit: 19000, description: 'IVA Crédito Fiscal' }
      ],
      total_debit: 119000,
      total_credit: 119000,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      date: '2024-01-20',
      reference: 'OC-000001',
      description: 'Compra de materiales',
      entries: [
        { account: '1302', debit: 500000, credit: 0, description: 'Materiales' },
        { account: '2105', debit: 95000, credit: 0, description: 'IVA Crédito Fiscal' },
        { account: '2101', debit: 0, credit: 595000, description: 'Cuentas por Pagar Proveedores' }
      ],
      total_debit: 595000,
      total_credit: 595000,
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z'
    }
  ];

  const mockChartOfAccounts: ChartOfAccounts = {
    '1101': 'Caja',
    '1102': 'Banco Cuenta Corriente',
    '1201': 'Cuentas por Cobrar Clientes',
    '1302': 'Materiales',
    '1401': 'Muebles y Útiles',
    '1403': 'Maquinarias',
    '2101': 'Cuentas por Pagar Proveedores',
    '2105': 'IVA Crédito Fiscal',
    '3101': 'Capital',
    '4101': 'Ventas de Servicios',
    '5101': 'Costo de Ventas Servicios',
    '6101': 'Gastos de Administración'
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      switch (activeTab) {
        case 0: // Entradas contables
          await fetchEntries();
          await fetchChartOfAccounts();
          break;
        case 1: // Balance General
          await fetchBalanceSheet();
          break;
        case 2: // Estado de Resultados
          await fetchIncomeStatement();
          break;
        case 3: // Libro Mayor
          await fetchGeneralLedger();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/accounting/entries', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.data || mockEntries);
      } else {
        setEntries(mockEntries);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
      setEntries(mockEntries);
    }
  };

  const fetchChartOfAccounts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/accounting/chart-of-accounts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setChartOfAccounts(data.data || mockChartOfAccounts);
      } else {
        setChartOfAccounts(mockChartOfAccounts);
      }
    } catch (error) {
      console.error('Error fetching chart of accounts:', error);
      setChartOfAccounts(mockChartOfAccounts);
    }
  };

  const fetchBalanceSheet = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/accounting/balance-sheet', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalanceSheet(data.data);
      }
    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    }
  };

  const fetchIncomeStatement = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/accounting/income-statement', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setIncomeStatement(data.data);
      }
    } catch (error) {
      console.error('Error fetching income statement:', error);
    }
  };

  const fetchGeneralLedger = async () => {
    try {
      const params = new URLSearchParams();
      if (accountFilter) params.append('account', accountFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`http://localhost:5000/api/accounting/general-ledger?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEntries(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching general ledger:', error);
    }
  };

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      reference: '',
      description: '',
      entries: [
        { account: '', debit: 0, credit: 0, description: '' },
        { account: '', debit: 0, credit: 0, description: '' }
      ]
    });
    setOpenDialog(true);
  };

  const handleSaveEntry = async () => {
    try {
      const url = editingEntry 
        ? `http://localhost:5000/api/accounting/entries/${editingEntry.id}`
        : 'http://localhost:5000/api/accounting/entries';
      
      const method = editingEntry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(editingEntry ? 'Entrada contable actualizada exitosamente' : 'Entrada contable creada exitosamente');
        setOpenDialog(false);
        fetchEntries();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar la entrada contable');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setError('Error al guardar la entrada contable');
    }
  };

  const addEntryLine = () => {
    setFormData({
      ...formData,
      entries: [...formData.entries, { account: '', debit: 0, credit: 0, description: '' }]
    });
  };

  const removeEntryLine = (index: number) => {
    if (formData.entries.length > 2) {
      const newEntries = formData.entries.filter((_, i) => i !== index);
      setFormData({ ...formData, entries: newEntries });
    }
  };

  const updateEntryLine = (index: number, field: string, value: any) => {
    const newEntries = [...formData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    
    // Actualizar descripción automáticamente si se selecciona una cuenta
    if (field === 'account' && chartOfAccounts[value]) {
      newEntries[index].description = chartOfAccounts[value];
    }
    
    setFormData({ ...formData, entries: newEntries });
  };

  const downloadReport = async (type: string) => {
    try {
      const params = new URLSearchParams();
      params.append('type', type);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (accountFilter) params.append('account', accountFilter);

      const response = await fetch(`http://localhost:5000/api/accounting/report/pdf?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-contable-${type}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Error generando reporte PDF');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Error generando reporte PDF');
    }
  };

  const filteredEntries = (entries || []).filter(entry => {
    if (!entry.entries || !Array.isArray(entry.entries)) {
      return false;
    }
    const matchesSearch = entry.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = (!dateFrom || entry.date >= dateFrom) && 
                       (!dateTo || entry.date <= dateTo);
    const matchesAccount = !accountFilter || 
                          entry.entries.some(e => e.account === accountFilter);
    
    return matchesSearch && matchesDate && matchesAccount;
  });

  const renderEntriesTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Entradas Contables</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateEntry}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Nueva Entrada
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Buscar"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Fecha Desde"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Fecha Hasta"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Cuenta</InputLabel>
                <Select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  label="Cuenta"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {Object.entries(chartOfAccounts).map(([code, name]) => (
                    <MenuItem key={code} value={code}>
                      {code} - {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de entradas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Referencia</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Débito</TableCell>
              <TableCell>Crédito</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntries && filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>{new Date(entry.date).toLocaleDateString('es-CL')}</TableCell>
                  <TableCell>{entry.reference}</TableCell>
                  <TableCell>{entry.description}</TableCell>
                  <TableCell>${entry.total_debit.toLocaleString('es-CL')}</TableCell>
                  <TableCell>${entry.total_credit.toLocaleString('es-CL')}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Ver">
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay entradas contables
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderBalanceSheetTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Balance General</Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => downloadReport('balance-sheet')}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Descargar PDF
        </Button>
      </Box>

      {balanceSheet && (
        <Grid container spacing={3}>
          {/* Activos */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  ACTIVOS
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  Activos Circulantes
                </Typography>
                {Object.entries(balanceSheet.assets.current).map(([code, data]) => (
                  <Box key={code} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {code} - {data.description}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${data.balance.toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Activos Fijos
                </Typography>
                {Object.entries(balanceSheet.assets.fixed).map(([code, data]) => (
                  <Box key={code} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {code} - {data.description}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${data.balance.toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Pasivos y Patrimonio */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="secondary">
                  PASIVOS Y PATRIMONIO
                </Typography>
                
                <Typography variant="subtitle1" gutterBottom>
                  Pasivos Circulantes
                </Typography>
                {Object.entries(balanceSheet.liabilities.current).map(([code, data]) => (
                  <Box key={code} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {code} - {data.description}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${data.balance.toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Patrimonio
                </Typography>
                {Object.entries(balanceSheet.equity).map(([code, data]) => (
                  <Box key={code} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">
                      {code} - {data.description}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${data.balance.toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  const renderIncomeStatementTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Estado de Resultados</Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => downloadReport('income-statement')}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Descargar PDF
        </Button>
      </Box>

      {incomeStatement && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Período: {incomeStatement.period.from} al {incomeStatement.period.to}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Ingresos */}
            <Typography variant="subtitle1" gutterBottom color="success.main">
              INGRESOS
            </Typography>
            {Object.entries(incomeStatement.revenues).map(([code, data]) => (
              <Box key={code} display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {code} - {data.description}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${data.balance.toLocaleString('es-CL')}
                </Typography>
              </Box>
            ))}

            <Box display="flex" justifyContent="space-between" mb={2} mt={2}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total Ingresos
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                ${incomeStatement.totals.revenue.toLocaleString('es-CL')}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Costos */}
            <Typography variant="subtitle1" gutterBottom color="error.main">
              COSTOS
            </Typography>
            {Object.entries(incomeStatement.costs).map(([code, data]) => (
              <Box key={code} display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {code} - {data.description}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${data.balance.toLocaleString('es-CL')}
                </Typography>
              </Box>
            ))}

            <Box display="flex" justifyContent="space-between" mb={2} mt={2}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total Costos
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                ${incomeStatement.totals.costs.toLocaleString('es-CL')}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Gastos */}
            <Typography variant="subtitle1" gutterBottom color="warning.main">
              GASTOS
            </Typography>
            {Object.entries(incomeStatement.expenses).map(([code, data]) => (
              <Box key={code} display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {code} - {data.description}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${data.balance.toLocaleString('es-CL')}
                </Typography>
              </Box>
            ))}

            <Box display="flex" justifyContent="space-between" mb={2} mt={2}>
              <Typography variant="subtitle1" fontWeight="bold">
                Total Gastos
              </Typography>
              <Typography variant="subtitle1" fontWeight="bold">
                ${incomeStatement.totals.expenses.toLocaleString('es-CL')}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Resultado Final */}
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                UTILIDAD NETA
              </Typography>
              <Typography 
                variant="h6" 
                fontWeight="bold"
                color={incomeStatement.totals.net_income >= 0 ? 'success.main' : 'error.main'}
              >
                ${incomeStatement.totals.net_income.toLocaleString('es-CL')}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderGeneralLedgerTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Libro Mayor</Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => downloadReport('general-ledger')}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Descargar PDF
        </Button>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Cuenta</InputLabel>
                <Select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  label="Cuenta"
                >
                  <MenuItem value="">Todas las cuentas</MenuItem>
                  {Object.entries(chartOfAccounts).map(([code, name]) => (
                    <MenuItem key={code} value={code}>
                      {code} - {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha Desde"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Fecha Hasta"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla del libro mayor */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Referencia</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Cuenta</TableCell>
              <TableCell>Débito</TableCell>
              <TableCell>Crédito</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntries && filteredEntries.length > 0 ? (
              filteredEntries.map((entry, index) => (
                <React.Fragment key={index}>
                  {entry.entries && entry.entries.map((line, lineIndex) => (
                    <TableRow key={`${index}-${lineIndex}`}>
                      <TableCell>{new Date(entry.date).toLocaleDateString('es-CL')}</TableCell>
                      <TableCell>{entry.reference}</TableCell>
                      <TableCell>{line.description}</TableCell>
                      <TableCell>{line.account}</TableCell>
                      <TableCell>
                        {line.debit > 0 ? `$${line.debit.toLocaleString('es-CL')}` : ''}
                      </TableCell>
                      <TableCell>
                        {line.credit > 0 ? `$${line.credit.toLocaleString('es-CL')}` : ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No hay datos disponibles
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando datos contables...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Contabilidad
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<EntryIcon />} label="Entradas Contables" />
        <Tab icon={<BalanceIcon />} label="Balance General" />
        <Tab icon={<IncomeIcon />} label="Estado de Resultados" />
        <Tab icon={<ChartIcon />} label="Libro Mayor" />
      </Tabs>

      {activeTab === 0 && renderEntriesTab()}
      {activeTab === 1 && renderBalanceSheetTab()}
      {activeTab === 2 && renderIncomeStatementTab()}
      {activeTab === 3 && renderGeneralLedgerTab()}

      {/* Dialog para crear/editar entrada contable */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEntry ? 'Editar Entrada Contable' : 'Nueva Entrada Contable'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fecha"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Referencia"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Asientos Contables
              </Typography>
              {formData.entries.map((entry, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Cuenta</InputLabel>
                          <Select
                            value={entry.account}
                            onChange={(e) => updateEntryLine(index, 'account', e.target.value)}
                            label="Cuenta"
                          >
                            {Object.entries(chartOfAccounts).map(([code, name]) => (
                              <MenuItem key={code} value={code}>
                                {code} - {name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Débito"
                          type="number"
                          value={entry.debit}
                          onChange={(e) => updateEntryLine(index, 'debit', parseFloat(e.target.value) || 0)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Crédito"
                          type="number"
                          value={entry.credit}
                          onChange={(e) => updateEntryLine(index, 'credit', parseFloat(e.target.value) || 0)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <TextField
                          label="Descripción"
                          value={entry.description}
                          onChange={(e) => updateEntryLine(index, 'description', e.target.value)}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={1}>
                        <IconButton
                          onClick={() => removeEntryLine(index)}
                          disabled={formData.entries.length <= 2}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addEntryLine}
                variant="outlined"
                sx={{ mt: 1 }}
              >
                Agregar Línea
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveEntry} variant="contained">
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

export default Accounting;