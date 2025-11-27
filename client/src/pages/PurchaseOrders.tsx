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
  CheckCircle as ApprovedIcon,
  ShoppingCart as OrderedIcon,
  LocalShipping as DeliveredIcon,
  Cancel as CancelledIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface PurchaseOrderItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit: string;
}

interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier_name: string;
  supplier_rut: string;
  supplier_email: string;
  supplier_address: string;
  supplier_city: string;
  supplier_region: string;
  supplier_phone: string;
  date: string;
  delivery_date: string;
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'approved' | 'ordered' | 'delivered' | 'cancelled';
  notes: string;
  items: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: number;
  rut: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  type: 'materials' | 'tools' | 'services';
  status: 'active' | 'inactive';
  notes: string;
  created_at: string;
  updated_at: string;
}

const PurchaseOrders: React.FC = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para el formulario de orden de compra
  const [formData, setFormData] = useState({
    supplier_id: '',
    date: new Date().toISOString().split('T')[0],
    delivery_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', quantity: 1, unit_price: 0, unit: 'unidades', total: 0 }],
    notes: ''
  });

  // Datos mock para desarrollo
  const mockOrders: PurchaseOrder[] = [
    {
      id: 1,
      order_number: 'OC-000001-012024',
      supplier_id: 1,
      supplier_name: 'Materiales Santiago S.A.',
      supplier_rut: '76.123.456-7',
      supplier_email: 'ventas@materialessantiago.cl',
      supplier_address: 'Av. Industrial 1234',
      supplier_city: 'Santiago',
      supplier_region: 'Región Metropolitana',
      supplier_phone: '+56 2 2345 6789',
      date: '2024-01-15',
      delivery_date: '2024-01-25',
      subtotal: 500000,
      tax: 95000,
      total: 595000,
      status: 'pending',
      notes: 'Materiales para proyecto residencial',
      items: [
        {
          id: 1,
          description: 'Cemento Portland 25kg',
          quantity: 100,
          unit_price: 2500,
          total: 250000,
          unit: 'bolsas'
        },
        {
          id: 2,
          description: 'Arena gruesa',
          quantity: 10,
          unit_price: 15000,
          total: 150000,
          unit: 'm3'
        },
        {
          id: 3,
          description: 'Grava 1/2"',
          quantity: 8,
          unit_price: 12500,
          total: 100000,
          unit: 'm3'
        }
      ],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      order_number: 'OC-000002-012024',
      supplier_id: 2,
      supplier_name: 'Ferretería Central',
      supplier_rut: '98.765.432-1',
      supplier_email: 'compras@ferreteriacentral.cl',
      supplier_address: 'Calle Comercial 567',
      supplier_city: 'Valparaíso',
      supplier_region: 'Región de Valparaíso',
      supplier_phone: '+56 32 1234 5678',
      date: '2024-01-20',
      delivery_date: '2024-01-30',
      subtotal: 200000,
      tax: 38000,
      total: 238000,
      status: 'delivered',
      notes: 'Herramientas y accesorios',
      items: [
        {
          id: 4,
          description: 'Martillo demoledor',
          quantity: 2,
          unit_price: 80000,
          total: 160000,
          unit: 'unidades'
        },
        {
          id: 5,
          description: 'Taladro percutor',
          quantity: 1,
          unit_price: 40000,
          total: 40000,
          unit: 'unidades'
        }
      ],
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z'
    }
  ];

  const mockSuppliers: Supplier[] = [
    {
      id: 1,
      rut: '76.123.456-7',
      name: 'Materiales Santiago S.A.',
      email: 'ventas@materialessantiago.cl',
      phone: '+56 2 2345 6789',
      address: 'Av. Industrial 1234',
      city: 'Santiago',
      region: 'Región Metropolitana',
      type: 'materials',
      status: 'active',
      notes: 'Proveedor de materiales de construcción',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 2,
      rut: '98.765.432-1',
      name: 'Ferretería Central',
      email: 'compras@ferreteriacentral.cl',
      phone: '+56 32 1234 5678',
      address: 'Calle Comercial 567',
      city: 'Valparaíso',
      region: 'Región de Valparaíso',
      type: 'tools',
      status: 'active',
      notes: 'Proveedor de herramientas',
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ];

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/purchase-orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.data || mockOrders);
      } else {
        setOrders(mockOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data.data || mockSuppliers);
      } else {
        setSuppliers(mockSuppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setSuppliers(mockSuppliers);
    }
  };

  const handleCreateOrder = () => {
    setEditingOrder(null);
    setFormData({
      supplier_id: '',
      date: new Date().toISOString().split('T')[0],
      delivery_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unit_price: 0, unit: 'unidades', total: 0 }],
      notes: ''
    });
    setOpenDialog(true);
  };

  const handleEditOrder = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setFormData({
      supplier_id: order.supplier_id.toString(),
      date: order.date,
      delivery_date: order.delivery_date,
      items: order.items,
      notes: order.notes
    });
    setOpenDialog(true);
  };

  const handleViewOrder = (order: PurchaseOrder) => {
    setViewingOrder(order);
    setOpenViewDialog(true);
  };

  const handleSaveOrder = async () => {
    try {
      const orderData = {
        ...formData,
        supplier_id: parseInt(formData.supplier_id),
        items: formData.items.filter(item => item.description.trim() !== '')
      };

      const response = await fetch('http://localhost:5000/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        setSuccess('Orden de compra guardada exitosamente');
        setOpenDialog(false);
        fetchOrders();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar la orden de compra');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      setError('Error al guardar la orden de compra');
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/purchase-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setSuccess('Estado actualizado exitosamente');
        fetchOrders();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Error al actualizar estado');
    }
  };

  const handleDownloadPDF = async (orderId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/purchase-orders/${orderId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `orden-compra-${orderId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          setSuccess('PDF descargado exitosamente');
        } else {
          // Si no es PDF, puede ser un error JSON
          const errorData = await response.json();
          setError(errorData.error || 'Error al descargar PDF');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Error al descargar PDF' }));
        setError(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      setError(`Error al descargar PDF: ${error.message || 'Error desconocido'}`);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unit_price: 0, unit: 'unidades', total: 0 }]
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
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'ordered': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <InventoryIcon />;
      case 'approved': return <ApprovedIcon />;
      case 'ordered': return <OrderedIcon />;
      case 'delivered': return <DeliveredIcon />;
      case 'cancelled': return <CancelledIcon />;
      default: return <InventoryIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'ordered': return 'Ordenada';
      case 'delivered': return 'Entregada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDateFrom = !dateFrom || order.date >= dateFrom;
    const matchesDateTo = !dateTo || order.date <= dateTo;
    
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const totalAmount = filteredOrders.reduce((sum, order) => sum + order.total, 0);
  const pendingAmount = filteredOrders.filter(o => o.status === 'pending').reduce((sum, order) => sum + order.total, 0);
  const deliveredAmount = filteredOrders.filter(o => o.status === 'delivered').reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando órdenes de compra...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography 
            variant="h2" 
            component="h1"
            sx={{
              fontWeight: 700,
              mb: 1,
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              color: '#ffffff',
              textShadow: '0 2px 8px rgba(94, 114, 228, 0.6)',
            }}
          >
            Órdenes de Compra
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateOrder}
          sx={{ 
            background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
            color: '#ffffff',
            fontWeight: 600,
            borderRadius: 2,
            px: 3,
            py: 1.5,
            boxShadow: '0 4px 6px rgba(94, 114, 228, 0.3)',
            '&:hover': { 
              background: 'linear-gradient(87deg, #4c63d2 0, #6d4cd2 100%)',
              boxShadow: '0 8px 12px rgba(94, 114, 228, 0.4)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          + Nueva Orden
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              border: 'none',
              background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 1.5rem 3rem rgba(94, 114, 228, 0.5)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(87deg, #5e72e4 0%, #825ee4 100%)',
                zIndex: 1,
              },
            }}
          >
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      display: 'block',
                      mb: 1.5,
                    }}
                  >
                    Total Ordenado
                  </Typography>
                  <Typography 
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: '#ffffff',
                      textShadow: '0 2px 8px rgba(94, 114, 228, 0.6)',
                      fontSize: '2rem',
                    }}
                  >
                    ${totalAmount.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
                    borderRadius: 3,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(94, 114, 228, 0.3)',
                  }}
                >
                  <MoneyIcon sx={{ fontSize: 32, color: '#ffffff' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              border: 'none',
              background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 1.5rem 3rem rgba(94, 114, 228, 0.5)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(87deg, #5e72e4 0%, #825ee4 100%)',
                zIndex: 1,
              },
            }}
          >
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      display: 'block',
                      mb: 1.5,
                    }}
                  >
                    Pendiente
                  </Typography>
                  <Typography 
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: '#ffffff',
                      fontSize: '2rem',
                    }}
                  >
                    ${pendingAmount.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
                    borderRadius: 3,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(94, 114, 228, 0.3)',
                  }}
                >
                  <InventoryIcon sx={{ fontSize: 32, color: '#ffffff' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              border: 'none',
              background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 1.5rem 3rem rgba(94, 114, 228, 0.5)',
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: 'linear-gradient(87deg, #5e72e4 0%, #825ee4 100%)',
                zIndex: 1,
              },
            }}
          >
            <CardContent sx={{ p: 3, position: 'relative', zIndex: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography 
                    variant="overline" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      display: 'block',
                      mb: 1.5,
                    }}
                  >
                    Entregado
                  </Typography>
                  <Typography 
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: '#ffffff',
                      textShadow: '0 2px 8px rgba(94, 114, 228, 0.6)',
                      fontSize: '2rem',
                    }}
                  >
                    ${deliveredAmount.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)',
                    borderRadius: 3,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px rgba(94, 114, 228, 0.3)',
                  }}
                >
                  <DeliveredIcon sx={{ fontSize: 32, color: '#ffffff' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card 
        sx={{ 
          mb: 3,
          border: 'none',
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
          borderRadius: 4,
          boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <TextField
              placeholder="Buscar por número de orden o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ 
                flexGrow: 1, 
                mr: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#5e72e4',
                  },
                },
                '& .MuiInputBase-input': {
                  color: 'rgba(255, 255, 255, 0.9)',
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setShowFilters(!showFilters)}
              variant="outlined"
              sx={{
                borderColor: '#5e72e4',
                color: '#5e72e4',
                borderRadius: 2,
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#4c63d2',
                  backgroundColor: 'rgba(94, 114, 228, 0.08)',
                },
              }}
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
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="approved">Aprobada</MenuItem>
                    <MenuItem value="ordered">Ordenada</MenuItem>
                    <MenuItem value="delivered">Entregada</MenuItem>
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

      {/* Tabla de órdenes de compra */}
      <TableContainer 
        component={Paper}
        sx={{
          borderRadius: 4,
          border: 'none',
          background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
          boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: 'linear-gradient(87deg, #5e72e4 0%, #825ee4 100%)',
              }}
            >
              <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Número</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Proveedor</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Fecha</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Entrega</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Total</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {order.order_number}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {order.supplier_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {order.supplier_rut}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {new Date(order.date).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell>
                  {new Date(order.delivery_date).toLocaleDateString('es-CL')}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    ${order.total.toLocaleString('es-CL')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={getStatusLabel(order.status)}
                    size="small"
                    sx={{
                      background: order.status === 'delivered' 
                        ? 'linear-gradient(87deg, #5e72e4 0%, #825ee4 100%)'
                        : order.status === 'pending'
                        ? 'linear-gradient(87deg, #fb6340 0%, #e04a2a 100%)'
                        : 'linear-gradient(87deg, #5e72e4 0%, #825ee4 100%)',
                      color: '#ffffff',
                      fontWeight: 600,
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Ver">
                      <IconButton
                        size="small"
                        onClick={() => handleViewOrder(order)}
                        sx={{
                          color: '#5e72e4',
                          '&:hover': {
                            backgroundColor: 'rgba(94, 114, 228, 0.1)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEditOrder(order)}
                        sx={{
                          color: '#5e72e4',
                          '&:hover': {
                            backgroundColor: 'rgba(94, 114, 228, 0.1)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Descargar PDF">
                      <IconButton
                        size="small"
                        onClick={() => handleDownloadPDF(order.id)}
                        sx={{
                          color: '#5e72e4',
                          '&:hover': {
                            backgroundColor: 'rgba(94, 114, 228, 0.1)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    {order.status === 'pending' && (
                      <Tooltip title="Aprobar">
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateStatus(order.id, 'approved')}
                          sx={{
                            color: '#5e72e4',
                            '&:hover': {
                              backgroundColor: 'rgba(94, 114, 228, 0.1)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <ApprovedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {order.status === 'approved' && (
                      <Tooltip title="Marcar como Ordenada">
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateStatus(order.id, 'ordered')}
                          sx={{
                            color: '#5e72e4',
                            '&:hover': {
                              backgroundColor: 'rgba(94, 114, 228, 0.1)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <OrderedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {order.status === 'ordered' && (
                      <Tooltip title="Marcar como Entregada">
                        <IconButton
                          size="small"
                          onClick={() => handleUpdateStatus(order.id, 'delivered')}
                          sx={{
                            color: '#5e72e4',
                            '&:hover': {
                              backgroundColor: 'rgba(94, 114, 228, 0.1)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <DeliveredIcon />
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

      {/* Dialog para crear/editar orden de compra */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingOrder ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Proveedor</InputLabel>
                <Select
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  label="Proveedor"
                >
                  {suppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name} - {supplier.rut}
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
                label="Fecha de Entrega"
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Items de la Orden
              </Typography>
              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}>
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
                      label="Unidad"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
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
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveOrder} 
            variant="contained"
            sx={{
              background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
              color: '#ffffff',
              fontWeight: 600,
              boxShadow: '0 4px 6px rgba(94, 114, 228, 0.3)',
              '&:hover': {
                background: 'linear-gradient(87deg, #4c63d2 0, #6d4cd2 100%)',
                boxShadow: '0 8px 12px rgba(94, 114, 228, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver orden de compra */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Orden de Compra {viewingOrder?.order_number}
        </DialogTitle>
        <DialogContent>
          {viewingOrder && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Información del Proveedor
                  </Typography>
                  <Typography><strong>Nombre:</strong> {viewingOrder.supplier_name}</Typography>
                  <Typography><strong>RUT:</strong> {viewingOrder.supplier_rut}</Typography>
                  <Typography><strong>Email:</strong> {viewingOrder.supplier_email}</Typography>
                  <Typography><strong>Teléfono:</strong> {viewingOrder.supplier_phone}</Typography>
                  <Typography><strong>Dirección:</strong> {viewingOrder.supplier_address}</Typography>
                  <Typography><strong>Ciudad:</strong> {viewingOrder.supplier_city}, {viewingOrder.supplier_region}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Información de la Orden
                  </Typography>
                  <Typography><strong>Número:</strong> {viewingOrder.order_number}</Typography>
                  <Typography><strong>Fecha:</strong> {new Date(viewingOrder.date).toLocaleDateString('es-CL')}</Typography>
                  <Typography><strong>Entrega:</strong> {new Date(viewingOrder.delivery_date).toLocaleDateString('es-CL')}</Typography>
                  <Typography><strong>Estado:</strong> {getStatusLabel(viewingOrder.status)}</Typography>
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
                    {viewingOrder.items.map((item) => (
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
                <Box textAlign="right">
                  <Typography><strong>Subtotal:</strong> ${viewingOrder.subtotal.toLocaleString('es-CL')}</Typography>
                  <Typography><strong>IVA (19%):</strong> ${viewingOrder.tax.toLocaleString('es-CL')}</Typography>
                  <Typography variant="h6"><strong>TOTAL:</strong> ${viewingOrder.total.toLocaleString('es-CL')}</Typography>
                </Box>
              </Box>

              {viewingOrder.notes && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Notas
                  </Typography>
                  <Typography>{viewingOrder.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenViewDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.8)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            Cerrar
          </Button>
          <Button
            onClick={() => handleDownloadPDF(viewingOrder!.id)}
            variant="contained"
            startIcon={<DownloadIcon />}
            sx={{
              background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
              color: '#ffffff',
              fontWeight: 600,
              boxShadow: '0 4px 6px rgba(94, 114, 228, 0.3)',
              '&:hover': {
                background: 'linear-gradient(87deg, #4c63d2 0, #6d4cd2 100%)',
                boxShadow: '0 8px 12px rgba(94, 114, 228, 0.4)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
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

export default PurchaseOrders;