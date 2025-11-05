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
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Business as BusinessIcon,
  Construction as MaterialsIcon,
  Build as ToolsIcon,
  Engineering as ServicesIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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
  contact_person: string;
  payment_terms: string;
  discount_percentage: number;
  created_at: string;
  updated_at: string;
}

const Suppliers: React.FC = () => {
  const { token } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Estados para el formulario de proveedor
  const [formData, setFormData] = useState({
    rut: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    type: 'materials' as 'materials' | 'tools' | 'services',
    status: 'active' as 'active' | 'inactive',
    notes: '',
    contact_person: '',
    payment_terms: '30 días',
    discount_percentage: 0
  });

  // Datos mock para desarrollo
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
      contact_person: 'Carlos Mendoza',
      payment_terms: '30 días',
      discount_percentage: 5,
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
      contact_person: 'María González',
      payment_terms: '15 días',
      discount_percentage: 3,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    },
    {
      id: 3,
      rut: '12.345.678-9',
      name: 'Servicios de Construcción Ltda.',
      email: 'servicios@construccion.cl',
      phone: '+56 9 8765 4321',
      address: 'Av. Obrera 890',
      city: 'Concepción',
      region: 'Región del Biobío',
      type: 'services',
      status: 'active',
      notes: 'Servicios de mano de obra especializada',
      contact_person: 'Roberto Silva',
      payment_terms: '45 días',
      discount_percentage: 0,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T10:00:00Z'
    }
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = () => {
    setEditingSupplier(null);
    setFormData({
      rut: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      region: '',
      type: 'materials',
      status: 'active',
      notes: '',
      contact_person: '',
      payment_terms: '30 días',
      discount_percentage: 0
    });
    setOpenDialog(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      rut: supplier.rut,
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      city: supplier.city,
      region: supplier.region,
      type: supplier.type,
      status: supplier.status,
      notes: supplier.notes,
      contact_person: supplier.contact_person,
      payment_terms: supplier.payment_terms,
      discount_percentage: supplier.discount_percentage
    });
    setOpenDialog(true);
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setOpenViewDialog(true);
  };

  const handleSaveSupplier = async () => {
    try {
      const url = editingSupplier 
        ? `http://localhost:5000/api/suppliers/${editingSupplier.id}`
        : 'http://localhost:5000/api/suppliers';
      
      const method = editingSupplier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess(editingSupplier ? 'Proveedor actualizado exitosamente' : 'Proveedor creado exitosamente');
        setOpenDialog(false);
        fetchSuppliers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar el proveedor');
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
      setError('Error al guardar el proveedor');
    }
  };

  const handleDeleteSupplier = async (supplierId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/suppliers/${supplierId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Proveedor eliminado exitosamente');
        fetchSuppliers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al eliminar el proveedor');
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      setError('Error al eliminar el proveedor');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'materials': return 'primary';
      case 'tools': return 'secondary';
      case 'services': return 'success';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'materials': return <MaterialsIcon />;
      case 'tools': return <ToolsIcon />;
      case 'services': return <ServicesIcon />;
      default: return <BusinessIcon />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'materials': return 'Materiales';
      case 'tools': return 'Herramientas';
      case 'services': return 'Servicios';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <ActiveIcon />;
      case 'inactive': return <InactiveIcon />;
      default: return <BusinessIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      default: return status;
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || supplier.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const materialsSuppliers = suppliers.filter(s => s.type === 'materials').length;
  const toolsSuppliers = suppliers.filter(s => s.type === 'tools').length;
  const servicesSuppliers = suppliers.filter(s => s.type === 'services').length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Cargando proveedores...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Proveedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSupplier}
          sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
        >
          Nuevo Proveedor
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Proveedores
                  </Typography>
                  <Typography variant="h5">
                    {totalSuppliers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ActiveIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Activos
                  </Typography>
                  <Typography variant="h5">
                    {activeSuppliers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <MaterialsIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Materiales
                  </Typography>
                  <Typography variant="h5">
                    {materialsSuppliers}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <ToolsIcon color="secondary" sx={{ mr: 1 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Herramientas
                  </Typography>
                  <Typography variant="h5">
                    {toolsSuppliers}
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
              placeholder="Buscar por nombre, RUT o email..."
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
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    label="Tipo"
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="materials">Materiales</MenuItem>
                    <MenuItem value="tools">Herramientas</MenuItem>
                    <MenuItem value="services">Servicios</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    label="Estado"
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="inactive">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Tabla de proveedores */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>RUT</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {supplier.rut}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {supplier.name}
                  </Typography>
                  {supplier.contact_person && (
                    <Typography variant="caption" color="textSecondary">
                      Contacto: {supplier.contact_person}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{supplier.email}</TableCell>
                <TableCell>{supplier.phone}</TableCell>
                <TableCell>
                  <Chip
                    icon={getTypeIcon(supplier.type)}
                    label={getTypeLabel(supplier.type)}
                    color={getTypeColor(supplier.type) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(supplier.status)}
                    label={getStatusLabel(supplier.status)}
                    color={getStatusColor(supplier.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="Ver">
                      <IconButton
                        size="small"
                        onClick={() => handleViewSupplier(supplier)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar proveedor */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="RUT"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Dirección"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Ciudad"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Región"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  label="Tipo"
                >
                  <MenuItem value="materials">Materiales</MenuItem>
                  <MenuItem value="tools">Herramientas</MenuItem>
                  <MenuItem value="services">Servicios</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  label="Estado"
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Persona de Contacto"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Términos de Pago"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Descuento (%)"
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) || 0 })}
                fullWidth
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                }}
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
          <Button onClick={handleSaveSupplier} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para ver proveedor */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewingSupplier?.name}
        </DialogTitle>
        <DialogContent>
          {viewingSupplier && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Información Básica
                  </Typography>
                  <Typography><strong>RUT:</strong> {viewingSupplier.rut}</Typography>
                  <Typography><strong>Nombre:</strong> {viewingSupplier.name}</Typography>
                  <Typography><strong>Email:</strong> {viewingSupplier.email}</Typography>
                  <Typography><strong>Teléfono:</strong> {viewingSupplier.phone}</Typography>
                  <Typography><strong>Dirección:</strong> {viewingSupplier.address}</Typography>
                  <Typography><strong>Ciudad:</strong> {viewingSupplier.city}</Typography>
                  <Typography><strong>Región:</strong> {viewingSupplier.region}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Información Comercial
                  </Typography>
                  <Typography><strong>Tipo:</strong> {getTypeLabel(viewingSupplier.type)}</Typography>
                  <Typography><strong>Estado:</strong> {getStatusLabel(viewingSupplier.status)}</Typography>
                  <Typography><strong>Contacto:</strong> {viewingSupplier.contact_person || 'No especificado'}</Typography>
                  <Typography><strong>Términos de Pago:</strong> {viewingSupplier.payment_terms}</Typography>
                  <Typography><strong>Descuento:</strong> {viewingSupplier.discount_percentage}%</Typography>
                </Grid>
              </Grid>

              {viewingSupplier.notes && (
                <Box mt={2}>
                  <Typography variant="h6" gutterBottom>
                    Notas
                  </Typography>
                  <Typography>{viewingSupplier.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>
            Cerrar
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

export default Suppliers;