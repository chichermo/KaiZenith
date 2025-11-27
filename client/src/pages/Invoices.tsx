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
  CardActions,
  Alert,
  Snackbar,
  Fab,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  CheckCircle as PaidIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';
import PageHeader from '../components/PageHeader';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client_name: string;
  client_rut: string;
  client_email: string;
  client_address: string;
  client_city: string;
  client_region: string;
  client_phone: string;
  date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
  payment_method: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta';
  payment_reference: string;
  items: InvoiceItem[];
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

const Invoices: React.FC = () => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para el formulario de factura
  const [formData, setFormData] = useState({
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
    notes: '',
    payment_method: 'efectivo' as 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta',
    payment_reference: ''
  });

  // Datos mock para desarrollo
  const mockInvoices: Invoice[] = [
    {
      id: 1,
      invoice_number: '000001-012024',
      client_id: 1,
      client_name: 'Juan Pérez',
      client_rut: '12.345.678-9',
      client_email: 'juan.perez@email.com',
      client_address: 'Av. Principal 123',
      client_city: 'Santiago',
      client_region: 'Región Metropolitana',
      client_phone: '+56 9 1234 5678',
      date: '2024-01-15',
      due_date: '2024-02-15',
      subtotal: 100000,
      tax: 19000,
      total: 119000,
      status: 'paid',
      notes: 'Factura pagada',
      payment_method: 'transferencia',
      payment_reference: 'TRF-001234',
      items: [
        {
          id: 1,
          description: 'Servicio de construcción',
          quantity: 1,
          unit_price: 100000,
          total: 100000
        }
      ],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      invoice_number: '000002-012024',
      client_id: 2,
      client_name: 'María González',
      client_rut: '98.765.432-1',
      client_email: 'maria.gonzalez@email.com',
      client_address: 'Calle Secundaria 456',
      client_city: 'Valparaíso',
      client_region: 'Región de Valparaíso',
      client_phone: '+56 9 8765 4321',
      date: '2024-01-20',
      due_date: '2024-02-20',
      subtotal: 150000,
      tax: 28500,
      total: 178500,
      status: 'sent',
      notes: 'Factura pendiente de pago',
      payment_method: 'efectivo',
      payment_reference: '',
      items: [
        {
          id: 2,
          description: 'Reparación de techo',
          quantity: 1,
          unit_price: 150000,
          total: 150000
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
    fetchInvoices();
    fetchClients();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.data || mockInvoices);
      } else {
        setInvoices(mockInvoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices(mockInvoices);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiFetch('/clients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.data || mockClients);
      } else {
        setClients(mockClients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients(mockClients);
    }
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    setFormData({
      client_id: '',
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      notes: '',
      payment_method: 'efectivo' as 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta',
      payment_reference: ''
    });
    setOpenDialog(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      client_id: invoice.client_id.toString(),
      date: invoice.date,
      due_date: invoice.due_date,
      items: invoice.items,
      notes: invoice.notes,
      payment_method: invoice.payment_method,
      payment_reference: invoice.payment_reference
    });
    setOpenDialog(true);
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    setOpenViewDialog(true);
  };

  const handleSaveInvoice = async () => {
    try {
      const invoiceData = {
        ...formData,
        client_id: parseInt(formData.client_id),
        items: formData.items.filter(item => item.description.trim() !== '')
      };

      const response = await apiFetch('/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        setSuccess('Factura guardada exitosamente');
        setOpenDialog(false);
        fetchInvoices();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar la factura');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError('Error al guardar la factura');
    }
  };

  const handleUpdateStatus = async (invoiceId: number, status: string) => {
    try {
      const response = await apiFetch(`/invoices/${invoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setSuccess('Estado actualizado exitosamente');
        fetchInvoices();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Error al actualizar estado');
    }
  };

  const handleDownloadPDF = async (invoiceId: number) => {
    try {
      const response = await apiFetch(`/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factura-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess('PDF descargado exitosamente');
      } else {
        setError('Error al descargar PDF');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Error al descargar PDF');
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, total: 0 }]
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'info';
      case 'draft': return 'default';
      case 'overdue': return 'error';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <PaidIcon />;
      case 'sent': return <SendIcon />;
      case 'draft': return <EditIcon />;
      case 'overdue': return <PendingIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <PendingIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'sent': return 'Enviada';
      case 'draft': return 'Borrador';
      case 'overdue': return 'Vencida';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesDateFrom = !dateFrom || invoice.date >= dateFrom;
    const matchesDateTo = !dateTo || invoice.date <= dateTo;
    
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidAmount = filteredInvoices.filter(i => i.status === 'paid').reduce((sum, invoice) => sum + invoice.total, 0);
  const pendingAmount = filteredInvoices.filter(i => i.status === 'sent').reduce((sum, invoice) => sum + invoice.total, 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando facturas...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Gestión de Facturas"
        subtitle="Administra tus facturas y seguimiento de pagos"
        action={{
          label: 'Nueva Factura',
          onClick: handleCreateInvoice,
          icon: <AddIcon />,
        }}
      />

      {/* Estadísticas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Facturado
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
                <PaidIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pagado
                  </Typography>
                  <Typography variant="h5">
                    ${paidAmount.toLocaleString('es-CL')}
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
                <PendingIcon color="warning" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pendiente
                  </Typography>
                  <Typography variant="h5">
                    ${pendingAmount.toLocaleString('es-CL')}
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
              placeholder="Buscar por número de factura o cliente..."
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
                    <MenuItem value="paid">Pagada</MenuItem>
                    <MenuItem value="overdue">Vencida</MenuItem>
                    <MenuItem value="cancelled">Cancelada</MenuItem>
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

      {/* Tabla de facturas */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {invoice.invoice_number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {invoice.client_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {invoice.client_rut}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(invoice.date).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell>
                  {new Date(invoice.due_date).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    ${invoice.total.toLocaleString('es-CL')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(invoice.status)}
                    label={getStatusLabel(invoice.status)}
                    color={getStatusColor(invoice.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Ver">
                      <IconButton
                        size="small"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEditInvoice(invoice)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Descargar PDF">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadPDF(invoice.id)}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    {invoice.status === 'sent' && (
                      <Tooltip title="Marcar como Pagada">
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                        >
                          <PaidIcon />
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

      {/* Dialog para crear/editar factura */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingInvoice ? 'Editar Factura' : 'Nueva Factura'}
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
                label="Vencimiento"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Items de la Factura
              </Typography>
              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Descripción"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Cantidad"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
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
                  <Grid item xs={12} md={1}>
                    <TextField
                      label="Total"
                      value={item.total}
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

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
                  label="Método de Pago"
                >
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="tarjeta">Tarjeta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Referencia de Pago"
                value={formData.payment_reference}
                onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                fullWidth
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
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveInvoice} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver factura */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Factura {viewingInvoice?.invoice_number}
        </DialogTitle>
        <DialogContent>
          {viewingInvoice && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Información del Cliente
                  </Typography>
                  <Typography><strong>Nombre:</strong> {viewingInvoice.client_name}</Typography>
                  <Typography><strong>RUT:</strong> {viewingInvoice.client_rut}</Typography>
                  <Typography><strong>Email:</strong> {viewingInvoice.client_email}</Typography>
                  <Typography><strong>Teléfono:</strong> {viewingInvoice.client_phone}</Typography>
                  <Typography><strong>Dirección:</strong> {viewingInvoice.client_address}</Typography>
                  <Typography><strong>Ciudad:</strong> {viewingInvoice.client_city}, {viewingInvoice.client_region}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Información de la Factura
                  </Typography>
                  <Typography><strong>Número:</strong> {viewingInvoice.invoice_number}</Typography>
                  <Typography><strong>Fecha:</strong> {new Date(viewingInvoice.date).toLocaleDateString('es-CL')}</Typography>
                  <Typography><strong>Vencimiento:</strong> {new Date(viewingInvoice.due_date).toLocaleDateString('es-CL')}</Typography>
                  <Typography><strong>Estado:</strong> {getStatusLabel(viewingInvoice.status)}</Typography>
                  <Typography><strong>Método de Pago:</strong> {viewingInvoice.payment_method}</Typography>
                  {viewingInvoice.payment_reference && (
                    <Typography><strong>Referencia:</strong> {viewingInvoice.payment_reference}</Typography>
                  )}
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
                      <TableCell>Precio Unit.</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingInvoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.unit_price.toLocaleString('es-CL')}</TableCell>
                        <TableCell>${item.total.toLocaleString('es-CL')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Box textAlign="right">
                  <Typography><strong>Subtotal:</strong> ${viewingInvoice.subtotal.toLocaleString('es-CL')}</Typography>
                  <Typography><strong>IVA (19%):</strong> ${viewingInvoice.tax.toLocaleString('es-CL')}</Typography>
                  <Typography variant="h6"><strong>TOTAL:</strong> ${viewingInvoice.total.toLocaleString('es-CL')}</Typography>
                </Box>
              </Box>

              {viewingInvoice.notes && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Notas
                  </Typography>
                  <Typography>{viewingInvoice.notes}</Typography>
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
            onClick={() => handleDownloadPDF(viewingInvoice!.id)}
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

export default Invoices;