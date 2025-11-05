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
  Rating,
  Tabs,
  Tab
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as CartIcon,
  Store as StoreIcon,
  Compare as CompareIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Favorite as FavoriteIcon,
  Share as ShareIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Star as StarIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  brand: string;
  image: string;
  supplier: string;
  supplierKey: string;
  available: boolean;
  stock: number;
  rating: number;
  reviews: number;
  features: string[];
  specifications: { [key: string]: string };
  shipping: {
    free: boolean;
    cost: number;
    estimated_days: number;
  };
  warranty: string;
  sku: string;
  barcode: string;
  searchScore?: number;
}

interface SupplierInfo {
  name: string;
  total: number;
  error?: string;
}

interface SearchResult {
  query: string;
  total: number;
  suppliers: SupplierInfo[];
  products: Product[];
  searchTime: string;
}

interface ComparisonResult {
  productName: string;
  totalProducts: number;
  suppliers: Array<{
    supplier: string;
    supplierKey: string;
    productCount: number;
    averagePrice: number;
    minPrice: number | null;
    maxPrice: number | null;
    error?: string;
  }>;
  products: Product[];
  priceRange: {
    min: number | null;
    max: number | null;
    average: number | null;
  };
  comparedAt: string;
}

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  product_count: number;
}

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  hours: string;
  services: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

const SupplierIntegration: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Datos mock para desarrollo
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Cemento Portland Tipo I 25kg',
      description: 'Cemento Portland Tipo I para construcción general',
      price: 4500,
      currency: 'CLP',
      category: 'Materiales de Construcción',
      brand: 'Melón',
      image: '/images/cemento.jpg',
      supplier: 'Sodimac',
      supplierKey: 'sodimac',
      available: true,
      stock: 150,
      rating: 4.5,
      reviews: 23,
      features: ['Alta resistencia', 'Fácil aplicación', 'Durabilidad'],
      specifications: {
        'Peso': '25kg',
        'Tipo': 'Portland Tipo I',
        'Resistencia': '28 días'
      },
      shipping: {
        free: false,
        cost: 5000,
        estimated_days: 2
      },
      warranty: '1 año',
      sku: 'CEM-001',
      barcode: '1234567890123'
    },
    {
      id: '2',
      name: 'Ladrillos Cerámicos 10x20x40cm',
      description: 'Ladrillos cerámicos para construcción de muros',
      price: 120,
      currency: 'CLP',
      category: 'Materiales de Construcción',
      brand: 'Ladrillos del Sur',
      image: '/images/ladrillos.jpg',
      supplier: 'Easy',
      supplierKey: 'easy',
      available: true,
      stock: 5000,
      rating: 4.2,
      reviews: 15,
      features: ['Resistencia térmica', 'Aislamiento acústico'],
      specifications: {
        'Dimensiones': '10x20x40cm',
        'Material': 'Cerámico',
        'Color': 'Rojo'
      },
      shipping: {
        free: true,
        cost: 0,
        estimated_days: 1
      },
      warranty: 'Sin garantía',
      sku: 'LAD-002',
      barcode: '1234567890124'
    }
  ];

  const mockCategories: Category[] = [
    { id: '1', name: 'Materiales de Construcción', product_count: 150 },
    { id: '2', name: 'Herramientas', product_count: 89 },
    { id: '3', name: 'Pinturas y Acabados', product_count: 67 },
    { id: '4', name: 'Electricidad', product_count: 45 },
    { id: '5', name: 'Plomería', product_count: 34 }
  ];

  const mockStores: Store[] = [
    {
      id: '1',
      name: 'Sodimac Maipú',
      address: 'Av. Américo Vespucio 1501',
      city: 'Maipú',
      phone: '+56 2 2345 6789',
      hours: 'Lun-Dom: 9:00-22:00',
      services: ['Delivery', 'Instalación', 'Asesoría'],
      coordinates: { lat: -33.4489, lng: -70.6693 }
    },
    {
      id: '2',
      name: 'Easy Providencia',
      address: 'Av. Providencia 1200',
      city: 'Providencia',
      phone: '+56 2 3456 7890',
      hours: 'Lun-Dom: 9:00-21:00',
      services: ['Delivery', 'Instalación'],
      coordinates: { lat: -33.4255, lng: -70.6108 }
    }
  ];

  useEffect(() => {
    fetchCategories();
    fetchStores();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/supplier-integration/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data[0]?.categories || mockCategories);
      } else {
        setCategories(mockCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories(mockCategories);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/supplier-integration/stores', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStores(data.data[0]?.stores || mockStores);
      } else {
        setStores(mockStores);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
      setStores(mockStores);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Ingresa un término de búsqueda');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('q', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      if (supplierFilter.length > 0) params.append('suppliers', supplierFilter.join(','));
      params.append('limit', '50');

      const response = await fetch(`http://localhost:5000/api/supplier-integration/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data);
      } else {
        // Usar datos mock si falla la API
        setSearchResults({
          query: searchTerm,
          total: mockProducts.length,
          suppliers: [
            { name: 'Sodimac', total: 1 },
            { name: 'Easy', total: 1 }
          ],
          products: mockProducts,
          searchTime: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error searching products:', error);
      setError('Error en la búsqueda de productos');
      // Usar datos mock en caso de error
      setSearchResults({
        query: searchTerm,
        total: mockProducts.length,
        suppliers: [
          { name: 'Sodimac', total: 1 },
          { name: 'Easy', total: 1 }
        ],
        products: mockProducts,
        searchTime: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComparePrices = async () => {
    if (!searchTerm.trim()) {
      setError('Ingresa un término de búsqueda para comparar');
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('productName', searchTerm);
      if (categoryFilter) params.append('category', categoryFilter);
      params.append('limit', '20');

      const response = await fetch(`http://localhost:5000/api/supplier-integration/compare/${encodeURIComponent(searchTerm)}?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setComparisonResults(data.data);
      } else {
        setError('Error comparando precios');
      }
    } catch (error) {
      console.error('Error comparing prices:', error);
      setError('Error comparando precios');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setOpenProductDialog(true);
  };

  const handleToggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = searchResults?.products.filter(product => {
    const matchesPrice = (!priceRange.min || product.price >= parseFloat(priceRange.min)) &&
                        (!priceRange.max || product.price <= parseFloat(priceRange.max));
    const matchesAvailability = availabilityFilter === 'all' || 
                               (availabilityFilter === 'available' && product.available) ||
                               (availabilityFilter === 'unavailable' && !product.available);
    
    return matchesPrice && matchesAvailability;
  }) || [];

  const renderSearchTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Búsqueda de Productos
      </Typography>

      {/* Barra de búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  label="Categoría"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name} ({category.product_count})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Proveedores</InputLabel>
                <Select
                  multiple
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value as string[])}
                  label="Proveedores"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="sodimac">Sodimac</MenuItem>
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="maestro">Maestro</MenuItem>
                  <MenuItem value="homecenter">Homecenter</MenuItem>
                  <MenuItem value="constructor">Constructor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                onClick={handleSearch}
                disabled={loading}
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              >
                Buscar
              </Button>
            </Grid>
          </Grid>

          {/* Filtros adicionales */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={3}>
              <TextField
                label="Precio Mínimo"
                type="number"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Precio Máximo"
                type="number"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Disponibilidad</InputLabel>
                <Select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  label="Disponibilidad"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="available">Disponibles</MenuItem>
                  <MenuItem value="unavailable">Agotados</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resultados de búsqueda */}
      {searchResults && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Resultados para "{searchResults.query}" ({filteredProducts.length} productos)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<CompareIcon />}
                onClick={handleComparePrices}
                disabled={loading}
              >
                Comparar Precios
              </Button>
            </Box>

            {/* Estadísticas de proveedores */}
            <Box display="flex" gap={1} mb={2}>
              {searchResults.suppliers.map((supplier, index) => (
                <Chip
                  key={index}
                  label={`${supplier.name}: ${supplier.total}`}
                  color={supplier.error ? 'error' : 'primary'}
                  size="small"
                />
              ))}
            </Box>

            {/* Lista de productos */}
            <Grid container spacing={2}>
              {filteredProducts.map((product) => (
                <Grid item xs={12} md={6} lg={4} key={product.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        component="img"
                        src={product.image || '/images/no-image.jpg'}
                        alt={product.name}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover'
                        }}
                      />
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleFavorite(product.id)}
                          sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'grey.100' } }}
                        >
                          <FavoriteIcon 
                            color={favorites.includes(product.id) ? 'error' : 'inherit'} 
                          />
                        </IconButton>
                      </Box>
                      <Chip
                        label={product.supplier}
                        size="small"
                        sx={{ position: 'absolute', top: 8, left: 8 }}
                      />
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom noWrap>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {product.brand} • {product.category}
                      </Typography>
                      
                      <Box display="flex" alignItems="center" mb={1}>
                        <Rating value={product.rating} readOnly size="small" />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          ({product.reviews})
                        </Typography>
                      </Box>

                      <Typography variant="h6" color="primary" gutterBottom>
                        ${product.price.toLocaleString('es-CL')} {product.currency}
                      </Typography>

                      <Box display="flex" alignItems="center" mb={2}>
                        {product.available ? (
                          <Chip
                            icon={<AvailableIcon />}
                            label={`Stock: ${product.stock}`}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<UnavailableIcon />}
                            label="Agotado"
                            color="error"
                            size="small"
                          />
                        )}
                      </Box>

                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewProduct(product)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CartIcon />}
                          disabled={!product.available}
                        >
                          Agregar
                        </Button>
                        <IconButton size="small">
                          <ShareIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderComparisonTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Comparación de Precios
      </Typography>

      {comparisonResults && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Comparación: {comparisonResults.productName}
            </Typography>

            {/* Estadísticas de comparación */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      ${comparisonResults.priceRange.min?.toLocaleString('es-CL') || 'N/A'}
                    </Typography>
                    <Typography variant="body2">Precio Mínimo</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      ${comparisonResults.priceRange.max?.toLocaleString('es-CL') || 'N/A'}
                    </Typography>
                    <Typography variant="body2">Precio Máximo</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      ${comparisonResults.priceRange.average?.toLocaleString('es-CL') || 'N/A'}
                    </Typography>
                    <Typography variant="body2">Precio Promedio</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      {comparisonResults.totalProducts}
                    </Typography>
                    <Typography variant="body2">Productos Encontrados</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Comparación por proveedor */}
            <Typography variant="h6" gutterBottom>
              Por Proveedor
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Productos</TableCell>
                    <TableCell>Precio Mínimo</TableCell>
                    <TableCell>Precio Máximo</TableCell>
                    <TableCell>Precio Promedio</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonResults.suppliers.map((supplier, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <StoreIcon sx={{ mr: 1 }} />
                          {supplier.supplier}
                          {supplier.error && (
                            <WarningIcon color="error" sx={{ ml: 1 }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{supplier.productCount}</TableCell>
                      <TableCell>
                        {supplier.minPrice ? `$${supplier.minPrice.toLocaleString('es-CL')}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {supplier.maxPrice ? `$${supplier.maxPrice.toLocaleString('es-CL')}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        ${supplier.averagePrice.toLocaleString('es-CL')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Productos ordenados por precio */}
            <Typography variant="h6" gutterBottom>
              Productos Ordenados por Precio
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Precio</TableCell>
                    <TableCell>Disponibilidad</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {comparisonResults.products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{product.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {product.brand}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={product.supplier} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" color="primary">
                          ${product.price.toLocaleString('es-CL')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {product.available ? (
                          <Chip
                            icon={<AvailableIcon />}
                            label={`Stock: ${product.stock}`}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            icon={<UnavailableIcon />}
                            label="Agotado"
                            color="error"
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Ver detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleViewProduct(product)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Agregar al carrito">
                            <span>
                              <IconButton
                                size="small"
                                disabled={!product.available}
                              >
                                <CartIcon />
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
          </CardContent>
        </Card>
      )}
    </Box>
  );

  const renderStoresTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Tiendas y Sucursales
      </Typography>

      <Grid container spacing={3}>
        {stores.map((store) => (
          <Grid item xs={12} md={6} key={store.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6">{store.name}</Typography>
                  <Chip label="Abierto" color="success" size="small" />
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {store.address}, {store.city}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  📞 {store.phone}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  🕒 {store.hours}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Servicios Disponibles:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {store.services.map((service, index) => (
                    <Chip key={index} label={service} size="small" />
                  ))}
                </Box>

                <Box display="flex" gap={1} sx={{ mt: 2 }}>
                  <Button size="small" startIcon={<ViewIcon />}>
                    Ver en Mapa
                  </Button>
                  <Button size="small" startIcon={<ShippingIcon />}>
                    Delivery
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Integración con Proveedores
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<SearchIcon />} label="Búsqueda" />
        <Tab icon={<CompareIcon />} label="Comparación" />
        <Tab icon={<StoreIcon />} label="Tiendas" />
      </Tabs>

      {activeTab === 0 && renderSearchTab()}
      {activeTab === 1 && renderComparisonTab()}
      {activeTab === 2 && renderStoresTab()}

      {/* Dialog para ver detalles del producto */}
      <Dialog open={openProductDialog} onClose={() => setOpenProductDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProduct?.name}
        </DialogTitle>
        <DialogContent>
          {selectedProduct && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box
                  component="img"
                  src={selectedProduct.image || '/images/no-image.jpg'}
                  alt={selectedProduct.name}
                  sx={{
                    width: '100%',
                    height: 300,
                    objectFit: 'cover',
                    borderRadius: 1
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>
                  ${selectedProduct.price.toLocaleString('es-CL')} {selectedProduct.currency}
                </Typography>
                
                <Typography variant="body1" gutterBottom>
                  {selectedProduct.description}
                </Typography>

                <Box display="flex" alignItems="center" mb={2}>
                  <Rating value={selectedProduct.rating} readOnly />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({selectedProduct.reviews} reseñas)
                  </Typography>
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Especificaciones:
                </Typography>
                {Object.entries(selectedProduct.specifications).map(([key, value]) => (
                  <Typography key={key} variant="body2">
                    <strong>{key}:</strong> {value}
                  </Typography>
                ))}

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Características:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {selectedProduct.features.map((feature, index) => (
                    <Chip key={index} label={feature} size="small" />
                  ))}
                </Box>

                <Box display="flex" gap={1} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    startIcon={<CartIcon />}
                    disabled={!selectedProduct.available}
                  >
                    Agregar al Carrito
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<FavoriteIcon />}
                    onClick={() => handleToggleFavorite(selectedProduct.id)}
                  >
                    {favorites.includes(selectedProduct.id) ? 'Quitar de Favoritos' : 'Agregar a Favoritos'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProductDialog(false)}>
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

export default SupplierIntegration;
