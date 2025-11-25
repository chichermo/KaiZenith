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
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Schedule as ExpiredIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface QuotationItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit: string;
  partida?: string; // Nombre de la partida a la que pertenece
}

interface QuotationPartida {
  id: number;
  name: string;
  items: QuotationItem[];
  subtotal: number;
}

interface Quotation {
  id: number;
  quotation_number: string;
  client_id: number;
  client_name: string;
  client_rut: string;
  client_email: string;
  client_address: string;
  client_city: string;
  client_region: string;
  client_phone: string;
  date: string;
  valid_until: string;
  delivery_date?: string; // Fecha de entrega de la cotización
  materials_total: number; // Total de materiales
  labor_cost: number; // Mano de obra
  margin_percentage: number; // Porcentaje de margen (ej: 3)
  subtotal: number; // Materiales + Mano de obra
  margin_amount: number; // Monto del margen
  net_total: number; // Subtotal + Margen
  tax: number; // IVA
  total: number; // Total final
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  notes: string;
  payment_terms?: string; // Forma de pago (ej: "50% anticipo / 50% contra entrega")
  items: QuotationItem[];
  partidas?: QuotationPartida[]; // Partidas agrupadas
  created_at: string;
  updated_at: string;
}

interface Client {
  id: number;
  rut: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  type: 'individual' | 'company';
  status: 'active' | 'potential';
  notes: string;
  created_at: string;
  updated_at: string;
}

const Quotations: React.FC = () => {
  const { token } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para el formulario de cotización
  const [formData, setFormData] = useState<{
    client_id: string;
    date: string;
    valid_until: string;
    delivery_date: string;
    items: Array<{ id: number; description: string; quantity: number; unit_price: number; unit: string; total: number; partida: string }>;
    partidas: QuotationPartida[];
    labor_cost: number;
    margin_percentage: number;
    notes: string;
    payment_terms: string;
  }>({
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 días por defecto
    delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ id: 0, description: '', quantity: 1, unit_price: 0, unit: 'unidades', total: 0, partida: '' }],
    partidas: [{ id: 1, name: '', items: [], subtotal: 0 }],
    labor_cost: 0,
    margin_percentage: 3,
    notes: '',
    payment_terms: '50% anticipo / 50% contra entrega'
  });

  // Datos mock para desarrollo
  const mockQuotations: Quotation[] = [
    {
      id: 1,
      quotation_number: 'COT-000001-012024',
      client_id: 1,
      client_name: 'Juan Pérez',
      client_rut: '12.345.678-9',
      client_email: 'juan.perez@email.com',
      client_address: 'Av. Principal 123',
      client_city: 'Santiago',
      client_region: 'Región Metropolitana',
      client_phone: '+56 9 1234 5678',
      date: '2024-01-15',
      valid_until: '2024-02-15',
      materials_total: 800000,
      labor_cost: 0,
      margin_percentage: 3,
      subtotal: 800000,
      margin_amount: 24000,
      net_total: 824000,
      tax: 156560,
      total: 980560,
      status: 'sent',
      notes: 'Cotización para remodelación de cocina',
      payment_terms: '',
      items: [
        {
          id: 1,
          description: 'Demolición y preparación de área',
          quantity: 1,
          unit_price: 150000,
          total: 150000,
          unit: 'proyecto'
        },
        {
          id: 2,
          description: 'Instalación de cerámicas',
          quantity: 25,
          unit_price: 8000,
          total: 200000,
          unit: 'm2'
        },
        {
          id: 3,
          description: 'Instalación de muebles de cocina',
          quantity: 1,
          unit_price: 450000,
          total: 450000,
          unit: 'juego'
        }
      ],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      quotation_number: 'COT-000002-012024',
      client_id: 2,
      client_name: 'María González',
      client_rut: '98.765.432-1',
      client_email: 'maria.gonzalez@email.com',
      client_address: 'Calle Secundaria 456',
      client_city: 'Valparaíso',
      client_region: 'Región de Valparaíso',
      client_phone: '+56 9 8765 4321',
      date: '2024-01-20',
      valid_until: '2024-02-20',
      materials_total: 300000,
      labor_cost: 0,
      margin_percentage: 3,
      subtotal: 300000,
      margin_amount: 9000,
      net_total: 309000,
      tax: 58710,
      total: 367710,
      status: 'approved',
      notes: 'Reparación de techo y pintura',
      payment_terms: '',
      items: [
        {
          id: 4,
          description: 'Reparación de techo',
          quantity: 1,
          unit_price: 200000,
          total: 200000,
          unit: 'proyecto'
        },
        {
          id: 5,
          description: 'Pintura interior',
          quantity: 80,
          unit_price: 1250,
          total: 100000,
          unit: 'm2'
        }
      ],
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z'
    }
  ];

  const mockClients: Client[] = [
    {
      id: 1,
      rut: '12.345.678-9',
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '+56 9 1234 5678',
      address: 'Av. Principal 123',
      city: 'Santiago',
      region: 'Región Metropolitana',
      type: 'individual',
      status: 'active',
      notes: 'Cliente preferencial',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      rut: '98.765.432-1',
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '+56 9 8765 4321',
      address: 'Calle Secundaria 456',
      city: 'Valparaíso',
      region: 'Región de Valparaíso',
      type: 'individual',
      status: 'potential',
      notes: 'Cliente potencial',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ];

  useEffect(() => {
    fetchQuotations();
    fetchClients();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/quotations');
      if (response.data.success) {
        setQuotations(response.data.data || mockQuotations);
      } else {
        setQuotations(mockQuotations);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
      setQuotations(mockQuotations);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get('/clients');
      if (response.data.success) {
        setClients(response.data.data || mockClients);
      } else {
        setClients(mockClients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients(mockClients);
    }
  };

  const handleCreateQuotation = () => {
    setEditingQuotation(null);
    setFormData({
      client_id: '',
      date: new Date().toISOString().split('T')[0],
      valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ id: 0, description: '', quantity: 1, unit_price: 0, unit: 'unidades', total: 0, partida: '' }],
      partidas: [{ id: 1, name: '', items: [], subtotal: 0 }],
      labor_cost: 0,
      margin_percentage: 3,
      notes: '',
      payment_terms: '50% anticipo / 50% contra entrega'
    });
    setOpenDialog(true);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setFormData({
      client_id: quotation.client_id.toString(),
      date: quotation.date,
      valid_until: quotation.valid_until,
      delivery_date: quotation.delivery_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: quotation.items.map(item => ({ ...item, partida: item.partida || '', id: item.id || 0 })),
      partidas: quotation.partidas || [{ id: 1, name: '', items: [], subtotal: 0 }],
      labor_cost: quotation.labor_cost || 0,
      margin_percentage: quotation.margin_percentage || 3,
      notes: quotation.notes || '',
      payment_terms: quotation.payment_terms || '50% anticipo / 50% contra entrega'
    });
    setOpenDialog(true);
  };

  const handleViewQuotation = (quotation: Quotation) => {
    setViewingQuotation(quotation);
    setOpenViewDialog(true);
  };

  const handleSaveQuotation = async () => {
    try {
      const filteredItems = formData.items.filter(item => item.description.trim() !== '');
      const totals = calculateTotals(filteredItems, formData.labor_cost, formData.margin_percentage);
      
      const quotationData = {
        ...formData,
        client_id: parseInt(formData.client_id),
        items: filteredItems,
        materials_total: totals.materialsTotal,
        labor_cost: formData.labor_cost,
        margin_percentage: formData.margin_percentage,
        subtotal: totals.subtotal,
        margin_amount: totals.marginAmount,
        net_total: totals.netTotal,
        tax: totals.tax,
        total: totals.total
      };

      const response = await axios.post('/quotations', quotationData);
      if (response.data.success) {
        setSuccess('Cotización guardada exitosamente');
        setOpenDialog(false);
        fetchQuotations();
      } else {
        setError(response.data.error || 'Error al guardar la cotización');
      }
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      setError(error.response?.data?.error || 'Error al guardar la cotización');
    }
  };

  const handleUpdateStatus = async (quotationId: number, status: string) => {
    try {
      const response = await axios.patch(`/quotations/${quotationId}/status`, { status });
      if (response.data.success) {
        setSuccess('Estado actualizado exitosamente');
        fetchQuotations();
      } else {
        setError(response.data.error || 'Error al actualizar estado');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      setError(error.response?.data?.error || 'Error al actualizar estado');
    }
  };

  const handleConvertToInvoice = async (quotationId: number) => {
    try {
      const response = await axios.post(`/quotations/${quotationId}/convert-to-invoice`);
      if (response.data.success) {
        setSuccess('Cotización convertida a factura exitosamente');
        fetchQuotations();
      } else {
        setError(response.data.error || 'Error al convertir cotización');
      }
    } catch (error: any) {
      console.error('Error converting quotation:', error);
      setError(error.response?.data?.error || 'Error al convertir cotización');
    }
  };

  const handleDownloadPDF = async (quotationId: number) => {
    try {
      const response = await axios.get(`/quotations/${quotationId}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cotizacion-${quotationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('PDF descargado exitosamente');
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      setError(error.response?.data?.error || 'Error al descargar PDF');
    }
  };

  // Calcular totales basados en materiales, mano de obra y margen
  const calculateTotals = (items: Array<QuotationItem | { description: string; quantity: number; unit_price: number; unit: string; total: number; partida?: string; id?: number }>, laborCost: number, marginPercentage: number) => {
    const materialsTotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const subtotal = materialsTotal + laborCost;
    const marginAmount = subtotal * (marginPercentage / 100);
    const netTotal = subtotal + marginAmount;
    const tax = netTotal * 0.19; // IVA 19%
    const total = netTotal + tax;
    
    return {
      materialsTotal,
      subtotal,
      marginAmount,
      netTotal,
      tax,
      total
    };
  };

  const addItem = () => {
    const newId = Math.max(...formData.items.map(i => i.id), 0) + 1;
    setFormData({
      ...formData,
      items: [...formData.items, { id: newId, description: '', quantity: 1, unit_price: 0, unit: 'unidades', total: 0, partida: '' }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    setFormData({ ...formData, items: newItems });
  };

  const addPartida = () => {
    const newPartidaId = Math.max(...formData.partidas.map(p => p.id), 0) + 1;
    setFormData({
      ...formData,
      partidas: [...formData.partidas, { id: newPartidaId, name: '', items: [], subtotal: 0 }]
    });
  };

  const removePartida = (partidaId: number) => {
    const newPartidas = formData.partidas.filter(p => p.id !== partidaId);
    setFormData({ ...formData, partidas: newPartidas });
  };

  const updatePartida = (partidaId: number, field: string, value: any) => {
    const newPartidas = formData.partidas.map(p => 
      p.id === partidaId ? { ...p, [field]: value } : p
    );
    setFormData({ ...formData, partidas: newPartidas });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'sent': return 'info';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <DescriptionIcon />;
      case 'sent': return <SendIcon />;
      case 'approved': return <ApprovedIcon />;
      case 'rejected': return <RejectedIcon />;
      case 'expired': return <ExpiredIcon />;
      default: return <DescriptionIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sent': return 'Enviada';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      case 'expired': return 'Vencida';
      default: return status;
    }
  };

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = quotation.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quotation.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    const matchesDateFrom = !dateFrom || quotation.date >= dateFrom;
    const matchesDateTo = !dateTo || quotation.date <= dateTo;
    
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const totalAmount = filteredQuotations.reduce((sum, quotation) => sum + quotation.total, 0);
  const sentAmount = filteredQuotations.filter(q => q.status === 'sent').reduce((sum, quotation) => sum + quotation.total, 0);
  const approvedAmount = filteredQuotations.filter(q => q.status === 'approved').reduce((sum, quotation) => sum + quotation.total, 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando cotizaciones...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Cotizaciones
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateQuotation}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Nueva Cotización
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Cotizado
                  </Typography>
                  <Typography variant="h5">
                    ${totalAmount.toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SendIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Enviadas
                  </Typography>
                  <Typography variant="h5">
                    ${sentAmount.toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ApprovedIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Aprobadas
                  </Typography>
                  <Typography variant="h5">
                    ${approvedAmount.toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <SearchIcon sx={{ mr: 1 }} />
            <TextField
              placeholder="Buscar por número de cotización o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ flexGrow: 1, mr: 2 }}
            />
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
            >
              Filtros
            </Button>
          </Box>
          
          {showFilters && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Estado"
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="draft">Borrador</MenuItem>
                    <MenuItem value="sent">Enviada</MenuItem>
                    <MenuItem value="approved">Aprobada</MenuItem>
                    <MenuItem value="rejected">Rechazada</MenuItem>
                    <MenuItem value="expired">Vencida</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Desde"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Hasta"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Tabla de cotizaciones */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Válida Hasta</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQuotations.map((quotation) => (
              <TableRow key={quotation.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {quotation.quotation_number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {quotation.client_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {quotation.client_rut}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(quotation.date).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell>
                  {new Date(quotation.valid_until).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    ${quotation.total.toLocaleString('es-CL')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(quotation.status)}
                    label={getStatusLabel(quotation.status)}
                    color={getStatusColor(quotation.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Ver">
                      <IconButton
                        size="small"
                        onClick={() => handleViewQuotation(quotation)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEditQuotation(quotation)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Descargar PDF">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadPDF(quotation.id)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    {quotation.status === 'draft' && (
                      <Tooltip title="Enviar">
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateStatus(quotation.id, 'sent')}
                        >
                          <SendIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {quotation.status === 'sent' && (
                      <Tooltip title="Aprobar">
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateStatus(quotation.id, 'approved')}
                        >
                          <ApprovedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {quotation.status === 'approved' && (
                      <Tooltip title="Convertir a Factura">
                        <IconButton
                          size="small"
                          onClick={() => handleConvertToInvoice(quotation.id)}
                        >
                          <ReceiptIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar cotización */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingQuotation ? 'Editar Cotización' : 'Nueva Cotización'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  label="Cliente"
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.name} - {client.rut}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Fecha"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Válida Hasta"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Fecha Entrega Cot."
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Items de la Cotización
              </Typography>
              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Partida (opcional)"
                      value={item.partida || ''}
                      onChange={(e) => updateItem(index, 'partida', e.target.value)}
                      fullWidth
                      placeholder="Ej: Desarme de bodega"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Descripción"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField
                      label="Cantidad"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField
                      label="Unidad"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField
                      label="Precio Unit."
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      fullWidth
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={1.5}>
                    <TextField
                      label="Total"
                      value={item.total.toLocaleString('es-CL')}
                      fullWidth
                      disabled
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={1}>
                    <IconButton
                      onClick={() => removeItem(index)}
                      color="error"
                      disabled={formData.items.length === 1}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={addItem}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                Agregar Item
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Costos y Totales
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Mano de Obra"
                type="number"
                value={formData.labor_cost}
                onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
                fullWidth
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Margen (%)"
                type="number"
                value={formData.margin_percentage}
                onChange={(e) => setFormData({ ...formData, margin_percentage: parseFloat(e.target.value) || 0 })}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Total Materiales:</Typography>
                  <Typography fontWeight="bold">
                    ${calculateTotals(formData.items, formData.labor_cost, formData.margin_percentage).materialsTotal.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Mano de Obra:</Typography>
                  <Typography fontWeight="bold">
                    ${formData.labor_cost.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Subtotal:</Typography>
                  <Typography fontWeight="bold">
                    ${calculateTotals(formData.items, formData.labor_cost, formData.margin_percentage).subtotal.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Margen ({formData.margin_percentage}%):</Typography>
                  <Typography fontWeight="bold">
                    ${calculateTotals(formData.items, formData.labor_cost, formData.margin_percentage).marginAmount.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Neto:</Typography>
                  <Typography fontWeight="bold">
                    ${calculateTotals(formData.items, formData.labor_cost, formData.margin_percentage).netTotal.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>IVA (19%):</Typography>
                  <Typography fontWeight="bold">
                    ${calculateTotals(formData.items, formData.labor_cost, formData.margin_percentage).tax.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h6">TOTAL:</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${calculateTotals(formData.items, formData.labor_cost, formData.margin_percentage).total.toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Forma de Pago"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                fullWidth
                placeholder="Ej: 50% anticipo / 50% contra entrega"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notas"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
                multiline
                rows={3}
                placeholder="Notas adicionales sobre la cotización..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveQuotation} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver cotización */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Cotización {viewingQuotation?.quotation_number}
        </DialogTitle>
        <DialogContent>
          {viewingQuotation && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Información del Cliente
                  </Typography>
                  <Typography><strong>Nombre:</strong> {viewingQuotation.client_name}</Typography>
                  <Typography><strong>RUT:</strong> {viewingQuotation.client_rut}</Typography>
                  <Typography><strong>Email:</strong> {viewingQuotation.client_email}</Typography>
                  <Typography><strong>Teléfono:</strong> {viewingQuotation.client_phone}</Typography>
                  <Typography><strong>Dirección:</strong> {viewingQuotation.client_address}</Typography>
                  <Typography><strong>Ciudad:</strong> {viewingQuotation.client_city}, {viewingQuotation.client_region}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Información de la Cotización
                  </Typography>
                  <Typography><strong>Número:</strong> {viewingQuotation.quotation_number}</Typography>
                  <Typography><strong>Fecha:</strong> {new Date(viewingQuotation.date).toLocaleDateString('es-CL')}</Typography>
                  <Typography><strong>Válida hasta:</strong> {new Date(viewingQuotation.valid_until).toLocaleDateString('es-CL')}</Typography>
                  <Typography><strong>Estado:</strong> {getStatusLabel(viewingQuotation.status)}</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Items
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Unidad</TableCell>
                      <TableCell>Precio Unit.</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingQuotation.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>${item.unit_price.toLocaleString('es-CL')}</TableCell>
                        <TableCell>${item.total.toLocaleString('es-CL')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Card variant="outlined" sx={{ p: 2, minWidth: 300, bgcolor: 'grey.50' }}>
                  <Box textAlign="right">
                    <Typography><strong>Total Materiales:</strong> ${(viewingQuotation.materials_total || viewingQuotation.subtotal).toLocaleString('es-CL')}</Typography>
                    {viewingQuotation.labor_cost > 0 && (
                      <Typography><strong>Mano de Obra:</strong> ${viewingQuotation.labor_cost.toLocaleString('es-CL')}</Typography>
                    )}
                    <Typography><strong>Subtotal:</strong> ${viewingQuotation.subtotal.toLocaleString('es-CL')}</Typography>
                    {viewingQuotation.margin_percentage && viewingQuotation.margin_percentage > 0 && (
                      <Typography><strong>Margen ({viewingQuotation.margin_percentage}%):</strong> ${(viewingQuotation.margin_amount || 0).toLocaleString('es-CL')}</Typography>
                    )}
                    <Typography><strong>Neto:</strong> ${(viewingQuotation.net_total || viewingQuotation.subtotal).toLocaleString('es-CL')}</Typography>
                    <Typography><strong>IVA (19%):</strong> ${viewingQuotation.tax.toLocaleString('es-CL')}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="h6" color="primary"><strong>TOTAL:</strong> ${viewingQuotation.total.toLocaleString('es-CL')}</Typography>
                  </Box>
                </Card>
              </Box>

              {viewingQuotation.payment_terms && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Forma de pago:</strong> {viewingQuotation.payment_terms}
                  </Typography>
                </Box>
              )}

              {viewingQuotation.notes && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Notas
                  </Typography>
                  <Typography>{viewingQuotation.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>
            Cerrar
          </Button>
          <Button
            onClick={() => handleDownloadPDF(viewingQuotation!.id)}
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Descargar PDF
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

export default Quotations;