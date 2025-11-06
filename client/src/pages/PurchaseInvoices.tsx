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
  InputAdornment,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  CheckCircle as ApprovedIcon,
  AttachMoney as PaidIcon,
  Cancel as CancelledIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  Build as EquipmentIcon,
  Business as ServicesIcon,
  Receipt as InvoiceIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';

// Axios ya está configurado globalmente en AuthContext.tsx

interface PurchaseInvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit: string;
  category?: 'materials' | 'services' | 'expenses' | 'equipment' | 'other';
  account_code?: string;
}

interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_invoice_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_rut: string;
  date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  category: 'materials' | 'services' | 'expenses' | 'equipment' | 'other';
  account_code: string;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  notes: string;
  items: PurchaseInvoiceItem[];
  payment_method?: 'transferencia' | 'efectivo' | 'cheque' | 'other';
  payment_reference?: string;
  payment_date?: string;
}

interface Supplier {
  id: number;
  name: string;
  rut: string;
  type: 'materials' | 'tools' | 'services';
}

const PurchaseInvoices: React.FC = () => {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<{
    supplier_id: string;
    supplier_invoice_number: string;
    date: string;
    due_date: string;
    items: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      unit: string;
      category?: 'materials' | 'services' | 'expenses' | 'equipment' | 'other';
      account_code?: string;
      total?: number;
    }>;
    category: 'materials' | 'services' | 'expenses' | 'equipment' | 'other';
    account_code: string;
    notes: string;
  }>({
    supplier_id: '',
    supplier_invoice_number: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unit_price: 0, unit: 'unidades', category: 'materials', account_code: '', total: 0 }],
    category: 'materials',
    account_code: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;

      const response = await axios.get('/purchase-invoices', { params });
      if (response.data.success) {
        setInvoices(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      setSnackbar({ open: true, message: 'Error cargando facturas de compra', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/suppliers');
      if (response.data.success) {
        setSuppliers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [filterStatus, filterCategory]);

  const handleOpenDialog = (invoice?: PurchaseInvoice) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      setFormData({
        supplier_id: invoice.supplier_id.toString(),
        supplier_invoice_number: invoice.supplier_invoice_number,
        date: invoice.date,
        due_date: invoice.due_date,
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit: item.unit,
          category: item.category,
          account_code: item.account_code,
          total: item.total
        })),
        category: invoice.category,
        account_code: invoice.account_code,
        notes: invoice.notes
      });
    } else {
      setSelectedInvoice(null);
      setFormData({
        supplier_id: '',
        supplier_invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, unit_price: 0, unit: 'unidades', category: 'materials' as const, account_code: '' }],
        category: 'materials' as const,
        account_code: '',
        notes: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedInvoice) {
        // Actualizar factura existente (si implementamos actualización)
        setSnackbar({ open: true, message: 'Actualización no implementada aún', severity: 'info' as any });
      } else {
        const response = await axios.post('/purchase-invoices', formData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Factura de compra creada exitosamente', severity: 'success' });
          fetchInvoices();
          handleCloseDialog();
        }
      }
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error guardando factura', severity: 'error' });
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const response = await axios.patch(`/purchase-invoices/${id}/approve`);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Factura aprobada y asiento contable generado', severity: 'success' });
        fetchInvoices();
      }
    } catch (error: any) {
      console.error('Error approving invoice:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error aprobando factura', severity: 'error' });
    }
  };

  const handlePay = async (id: number) => {
    try {
      const response = await axios.patch(`/purchase-invoices/${id}/pay`, {
        payment_method: 'transferencia',
        payment_date: new Date().toISOString().split('T')[0]
      });
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Factura marcada como pagada', severity: 'success' });
        fetchInvoices();
      }
    } catch (error: any) {
      console.error('Error paying invoice:', error);
      setSnackbar({ open: true, message: error.response?.data?.error || 'Error pagando factura', severity: 'error' });
    }
  };

  const handleDownloadPDF = async (id: number) => {
    try {
      const response = await axios.get(`/purchase-invoices/${id}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `factura-compra-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setSnackbar({ open: true, message: 'Error descargando PDF', severity: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'approved': return 'info';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagada';
      case 'approved': return 'Aprobada';
      case 'pending': return 'Pendiente';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'materials': return <InventoryIcon />;
      case 'equipment': return <EquipmentIcon />;
      case 'services': return <ServicesIcon />;
      default: return <InvoiceIcon />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'materials': return 'Materiales';
      case 'equipment': return 'Equipos';
      case 'services': return 'Servicios';
      case 'expenses': return 'Gastos';
      default: return 'Otros';
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, unit: 'unidades', category: 'materials', account_code: '', total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    const updatedItem = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      updatedItem.total = updatedItem.quantity * updatedItem.unit_price;
    }
    newItems[index] = updatedItem;
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * 0.19;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Facturas de Compra"
        subtitle="Gestiona las facturas recibidas de proveedores"
        action={{
          label: 'Nueva Factura',
          onClick: () => handleOpenDialog(),
          icon: <AddIcon />
        }}
      />

      {/* Filtros */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select value={filterStatus} label="Estado" onChange={(e) => setFilterStatus(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="pending">Pendiente</MenuItem>
            <MenuItem value="approved">Aprobada</MenuItem>
            <MenuItem value="paid">Pagada</MenuItem>
            <MenuItem value="cancelled">Cancelada</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Categoría</InputLabel>
          <Select value={filterCategory} label="Categoría" onChange={(e) => setFilterCategory(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="materials">Materiales</MenuItem>
            <MenuItem value="equipment">Equipos</MenuItem>
            <MenuItem value="services">Servicios</MenuItem>
            <MenuItem value="expenses">Gastos</MenuItem>
            <MenuItem value="other">Otros</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Factura Proveedor</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">Cargando...</TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">No hay facturas de compra</TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.supplier_invoice_number}</TableCell>
                  <TableCell>{invoice.supplier_name}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString('es-CL')}</TableCell>
                  <TableCell>
                    <Chip
                      icon={getCategoryIcon(invoice.category)}
                      label={getCategoryLabel(invoice.category)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>${invoice.total.toLocaleString('es-CL')}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(invoice.status)}
                      color={getStatusColor(invoice.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Ver detalles">
                        <IconButton size="small" onClick={() => { setSelectedInvoice(invoice); setViewDialog(true); }}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {invoice.status === 'pending' && (
                        <Tooltip title="Aprobar">
                          <IconButton size="small" onClick={() => handleApprove(invoice.id)}>
                            <ApprovedIcon fontSize="small" color="info" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {invoice.status === 'approved' && (
                        <Tooltip title="Marcar como pagada">
                          <IconButton size="small" onClick={() => handlePay(invoice.id)}>
                            <PaidIcon fontSize="small" color="success" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Descargar PDF">
                        <IconButton size="small" onClick={() => handleDownloadPDF(invoice.id)}>
                          <DownloadIcon fontSize="small" />
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedInvoice ? 'Editar Factura de Compra' : 'Nueva Factura de Compra'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={suppliers}
                getOptionLabel={(option) => `${option.name} - ${option.rut}`}
                value={suppliers.find(s => s.id.toString() === formData.supplier_id) || null}
                onChange={(_, value) => setFormData({ ...formData, supplier_id: value?.id.toString() || '' })}
                renderInput={(params) => <TextField {...params} label="Proveedor" required />}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número Factura Proveedor"
                value={formData.supplier_invoice_number}
                onChange={(e) => setFormData({ ...formData, supplier_invoice_number: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Vencimiento"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.category}
                  label="Categoría"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                >
                  <MenuItem value="materials">Materiales</MenuItem>
                  <MenuItem value="equipment">Equipos</MenuItem>
                  <MenuItem value="services">Servicios</MenuItem>
                  <MenuItem value="expenses">Gastos</MenuItem>
                  <MenuItem value="other">Otros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cuenta Contable"
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                placeholder="Ej: 1302"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>Items</Divider>
              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Descripción"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Cantidad"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      label="Unidad"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Precio Unit."
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                      required
                    />
                  </Grid>
                  <Grid item xs={6} sm={1}>
                    <TextField
                      fullWidth
                      label="Total"
                      value={(item.total || 0).toLocaleString('es-CL')}
                      disabled
                      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton onClick={() => removeItem(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              ))}
              <Button startIcon={<AddIcon />} onClick={addItem} variant="outlined" size="small">
                Agregar Item
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="h6">Subtotal:</Typography>
                <Typography variant="h6">${calculateTotals().subtotal.toLocaleString('es-CL')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography>IVA (19%):</Typography>
                <Typography>${calculateTotals().tax.toLocaleString('es-CL')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                <Typography variant="h6" fontWeight="bold">Total:</Typography>
                <Typography variant="h6" fontWeight="bold">${calculateTotals().total.toLocaleString('es-CL')}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notas"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Ver Detalles */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalles Factura de Compra</DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Número</Typography>
                  <Typography>{selectedInvoice.invoice_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Factura Proveedor</Typography>
                  <Typography>{selectedInvoice.supplier_invoice_number}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Proveedor</Typography>
                  <Typography>{selectedInvoice.supplier_name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">RUT</Typography>
                  <Typography>{selectedInvoice.supplier_rut}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Fecha</Typography>
                  <Typography>{new Date(selectedInvoice.date).toLocaleDateString('es-CL')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Vencimiento</Typography>
                  <Typography>{new Date(selectedInvoice.due_date).toLocaleDateString('es-CL')}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Categoría</Typography>
                  <Chip label={getCategoryLabel(selectedInvoice.category)} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Cuenta Contable</Typography>
                  <Typography>{selectedInvoice.account_code}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Items</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Descripción</TableCell>
                          <TableCell align="right">Cantidad</TableCell>
                          <TableCell align="right">Precio Unit.</TableCell>
                          <TableCell align="right">Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell align="right">{item.quantity} {item.unit}</TableCell>
                            <TableCell align="right">${item.unit_price.toLocaleString('es-CL')}</TableCell>
                            <TableCell align="right">${item.total.toLocaleString('es-CL')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Subtotal:</Typography>
                    <Typography variant="h6">${selectedInvoice.subtotal.toLocaleString('es-CL')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>IVA (19%):</Typography>
                    <Typography>${selectedInvoice.tax.toLocaleString('es-CL')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="h6" fontWeight="bold">Total:</Typography>
                    <Typography variant="h6" fontWeight="bold">${selectedInvoice.total.toLocaleString('es-CL')}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Cerrar</Button>
          <Button onClick={() => handleDownloadPDF(selectedInvoice!.id)} variant="contained" startIcon={<DownloadIcon />}>
            Descargar PDF
          </Button>
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

export default PurchaseInvoices;

