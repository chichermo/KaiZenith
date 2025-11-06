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
  Card,
  CardContent,
  Alert,
  Snackbar,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface InventoryProduct {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  cost_method: 'fifo' | 'lifo' | 'average';
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit_cost: number;
  total_value: number;
  location?: string;
  status: 'active' | 'inactive' | 'discontinued';
}

interface InventoryMovement {
  id: number;
  movement_type: string;
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_type?: string;
  reference_id?: number;
  document_number?: string;
  location_from?: string;
  location_to?: string;
  notes?: string;
  user_name: string;
  created_at: string;
}

const Inventory: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [openMovementDialog, setOpenMovementDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    unit: 'unidad',
    cost_method: 'average' as 'fifo' | 'lifo' | 'average',
    min_stock: 0,
    max_stock: 0,
    unit_cost: 0,
    location: '',
  });

  const [movementFormData, setMovementFormData] = useState({
    movement_type: 'purchase',
    product_id: 0,
    quantity: 0,
    unit_cost: 0,
    reference_type: '',
    reference_id: '',
    document_number: '',
    location_from: '',
    location_to: '',
    notes: '',
  });

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchMovements();
      fetchLowStockAlerts();
    }
  }, [token, categoryFilter, statusFilter, lowStockOnly]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category', categoryFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (lowStockOnly) params.append('low_stock', 'true');
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/inventory?${params}`);
      if (response.data.success) {
        setProducts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get('/inventory/movements');
      // El interceptor maneja los 404 silenciosamente, retornando data: { success: false, data: [] }
      setMovements(response.data.data || []);
    } catch (error: any) {
      // Solo mostrar errores que no sean 404 (el interceptor ya los maneja)
      if (error.response?.status !== 404) {
        console.error('Error fetching movements:', error);
      }
      setMovements([]);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await axios.get('/inventory/alerts/low-stock');
      if (response.data.success) {
        setLowStockAlerts(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const handleOpenProductDialog = (product?: InventoryProduct) => {
    if (product) {
      setSelectedProduct(product);
      setFormData({
        code: product.code,
        name: product.name,
        description: product.description || '',
        category: product.category,
        unit: product.unit,
        cost_method: product.cost_method,
        min_stock: product.min_stock,
        max_stock: product.max_stock,
        unit_cost: product.unit_cost,
        location: product.location || '',
      });
    } else {
      setSelectedProduct(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        category: '',
        unit: 'unidad',
        cost_method: 'average',
        min_stock: 0,
        max_stock: 0,
        unit_cost: 0,
        location: '',
      });
    }
    setOpenProductDialog(true);
  };

  const handleSaveProduct = async () => {
    try {
      setLoading(true);
      let response;
      if (selectedProduct) {
        response = await axios.put(`/inventory/${selectedProduct.id}`, formData);
      } else {
        response = await axios.post('/inventory', formData);
      }

      if (response.data.success) {
        setSuccess(`Producto ${selectedProduct ? 'actualizado' : 'creado'} exitosamente`);
        setOpenProductDialog(false);
        fetchProducts();
      } else {
        setError(response.data.error || 'Error al guardar producto');
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      setError(error.response?.data?.error || 'Error al guardar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMovementDialog = (product?: InventoryProduct) => {
    if (product) {
      setMovementFormData({
        ...movementFormData,
        product_id: product.id,
        unit_cost: product.unit_cost,
      });
    }
    setOpenMovementDialog(true);
  };

  const handleSaveMovement = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/inventory/movements', movementFormData);
      if (response.data.success) {
        setSuccess('Movimiento registrado exitosamente');
        setOpenMovementDialog(false);
        fetchProducts();
        fetchMovements();
      } else {
        setError(response.data.error || 'Error al registrar movimiento');
      }
    } catch (error: any) {
      console.error('Error saving movement:', error);
      setError(error.response?.data?.error || 'Error al registrar movimiento');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (product: InventoryProduct) => {
    if (product.current_stock === 0) return { label: 'Sin Stock', color: 'error' };
    if (product.current_stock <= product.min_stock) return { label: 'Stock Bajo', color: 'warning' };
    if (product.current_stock >= product.max_stock) return { label: 'Stock Alto', color: 'info' };
    return { label: 'Normal', color: 'success' };
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'purchase': 'Compra',
      'sale': 'Venta',
      'adjustment': 'Ajuste',
      'transfer': 'Transferencia',
      'return': 'Devolución',
      'production': 'Producción',
      'consumption': 'Consumo'
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors: { [key: string]: any } = {
      'purchase': 'success',
      'sale': 'primary',
      'adjustment': 'warning',
      'transfer': 'info',
      'return': 'secondary',
      'production': 'success',
      'consumption': 'error'
    };
    return colors[type] || 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Gestión de Inventario
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenProductDialog()}
          >
            Nuevo Producto
          </Button>
          <Button
            variant="outlined"
            startIcon={<ReportIcon />}
            onClick={() => setActiveTab(2)}
          >
            Reportes
          </Button>
        </Box>
      </Box>

      {/* Alertas de Stock Bajo */}
      {lowStockAlerts.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          <Typography variant="subtitle2" gutterBottom>
            {lowStockAlerts.length} producto(s) con stock bajo:
          </Typography>
          {lowStockAlerts.slice(0, 5).map((alert) => (
            <Typography key={alert.id} variant="body2">
              • {alert.name} - Stock actual: {alert.current_stock} {alert.unit} (Mínimo: {alert.min_stock})
            </Typography>
          ))}
          {lowStockAlerts.length > 5 && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              Y {lowStockAlerts.length - 5} más...
            </Typography>
          )}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Productos" />
        <Tab label="Movimientos" />
        <Tab label="Reportes" />
      </Tabs>

      {/* Tab Productos */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                <TextField
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ flexGrow: 1, minWidth: 200 }}
                />
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Categoría"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    <MenuItem value="materiales">Materiales</MenuItem>
                    <MenuItem value="equipos">Equipos</MenuItem>
                    <MenuItem value="herramientas">Herramientas</MenuItem>
                    <MenuItem value="otros">Otros</MenuItem>
                  </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Estado"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="inactive">Inactivo</MenuItem>
                    <MenuItem value="discontinued">Descontinuado</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant={lowStockOnly ? 'contained' : 'outlined'}
                  startIcon={<WarningIcon />}
                  onClick={() => {
                    setLowStockOnly(!lowStockOnly);
                    fetchProducts();
                  }}
                >
                  Stock Bajo
                </Button>
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Código</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Categoría</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Costo Unit.</TableCell>
                      <TableCell align="right">Valor Total</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product);
                      return (
                        <TableRow key={product.id}>
                          <TableCell>{product.code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell align="right">
                            <Box>
                              <Typography>{product.current_stock} {product.unit}</Typography>
                              <Chip
                                label={stockStatus.label}
                                color={stockStatus.color as any}
                                size="small"
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            ${product.unit_cost.toLocaleString('es-CL')}
                          </TableCell>
                          <TableCell align="right">
                            ${product.total_value.toLocaleString('es-CL')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={product.status}
                              color={product.status === 'active' ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Ver Detalles">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setOpenViewDialog(true);
                                  }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenProductDialog(product)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Registrar Movimiento">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenMovementDialog(product)}
                                >
                                  <InventoryIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab Movimientos */}
      {activeTab === 1 && (
        <Box>
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Costo Unit.</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Usuario</TableCell>
                      <TableCell>Referencia</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.created_at).toLocaleDateString('es-CL')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getMovementTypeLabel(movement.movement_type)}
                            color={getMovementTypeColor(movement.movement_type) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{movement.product_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {movement.product_code}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {movement.quantity > 0 ? (
                            <Chip
                              icon={<TrendingUpIcon />}
                              label={movement.quantity}
                              color="success"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<TrendingDownIcon />}
                              label={Math.abs(movement.quantity)}
                              color="error"
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          ${movement.unit_cost.toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell align="right">
                          ${movement.total_cost.toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell>{movement.user_name}</TableCell>
                        <TableCell>
                          {movement.document_number || `${movement.reference_type} #${movement.reference_id}`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab Reportes */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Resumen de Inventario
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total de productos: {products.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Valor total inventario: ${products.reduce((sum, p) => sum + p.total_value, 0).toLocaleString('es-CL')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Productos con stock bajo: {lowStockAlerts.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Dialog Producto */}
      <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={!!selectedProduct}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Categoría"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unidad"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Método de Costo</InputLabel>
                <Select
                  value={formData.cost_method}
                  label="Método de Costo"
                  onChange={(e) => setFormData({ ...formData, cost_method: e.target.value as any })}
                >
                  <MenuItem value="fifo">FIFO</MenuItem>
                  <MenuItem value="lifo">LIFO</MenuItem>
                  <MenuItem value="average">Promedio</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Stock Mínimo"
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Stock Máximo"
                type="number"
                value={formData.max_stock}
                onChange={(e) => setFormData({ ...formData, max_stock: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Costo Unitario"
                type="number"
                value={formData.unit_cost}
                onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ubicación"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveProduct} variant="contained" disabled={loading}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Movimiento */}
      <Dialog open={openMovementDialog} onClose={() => setOpenMovementDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Movimiento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Movimiento</InputLabel>
                <Select
                  value={movementFormData.movement_type}
                  label="Tipo de Movimiento"
                  onChange={(e) => setMovementFormData({ ...movementFormData, movement_type: e.target.value })}
                >
                  <MenuItem value="purchase">Compra</MenuItem>
                  <MenuItem value="sale">Venta</MenuItem>
                  <MenuItem value="adjustment">Ajuste</MenuItem>
                  <MenuItem value="transfer">Transferencia</MenuItem>
                  <MenuItem value="return">Devolución</MenuItem>
                  <MenuItem value="production">Producción</MenuItem>
                  <MenuItem value="consumption">Consumo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={movementFormData.quantity}
                onChange={(e) => setMovementFormData({ ...movementFormData, quantity: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Costo Unitario"
                type="number"
                value={movementFormData.unit_cost}
                onChange={(e) => setMovementFormData({ ...movementFormData, unit_cost: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Número de Documento"
                value={movementFormData.document_number}
                onChange={(e) => setMovementFormData({ ...movementFormData, document_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notas"
                value={movementFormData.notes}
                onChange={(e) => setMovementFormData({ ...movementFormData, notes: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMovementDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveMovement} variant="contained" disabled={loading}>
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Ver Producto */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalles del Producto</DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Código</Typography>
                <Typography variant="body1">{selectedProduct.code}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Nombre</Typography>
                <Typography variant="body1">{selectedProduct.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Stock Actual</Typography>
                <Typography variant="h6" color={selectedProduct.current_stock <= selectedProduct.min_stock ? 'error' : 'inherit'}>
                  {selectedProduct.current_stock} {selectedProduct.unit}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Valor Total</Typography>
                <Typography variant="h6">${selectedProduct.total_value.toLocaleString('es-CL')}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Inventory;


