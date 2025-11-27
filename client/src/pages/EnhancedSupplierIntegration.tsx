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
  Tab,
  Autocomplete,
  Slider,
  Switch,
  FormControlLabel,
  Stack
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
  FilterList as FilterIcon,
  SmartToy as AIIcon,
  Recommend as RecommendIcon,
  LocationOn as LocationIcon,
  Category as CategoryIcon,
  PriceCheck as PriceIcon,
  Inventory as InventoryIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';

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
  recommended?: boolean;
}

interface SupplierInfo {
  name: string;
  key: string;
  total: number;
  error?: string;
  recommended?: boolean;
}

interface RecommendedSupplier {
  name: string;
  key: string;
  specialties: string[];
  coverage: string;
}

interface SearchResult {
  query: string;
  total: number;
  suppliers: SupplierInfo[];
  recommendedSuppliers: RecommendedSupplier[];
  products: Product[];
  searchTime: string;
  filters: {
    category?: string;
    priceRange?: { min?: number; max?: number };
    availableOnly?: boolean;
    suppliers?: string[];
  };
}

interface SupplierStats {
  total: number;
  byCategory: { [key: string]: number };
  byCoverage: { [key: string]: number };
  withDelivery: number;
  withInstallation: number;
  specialties: string[];
}

const EnhancedSupplierIntegration: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000000]);
  const [availabilityFilter, setAvailabilityFilter] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [supplierStats, setSupplierStats] = useState<SupplierStats | null>(null);
  const [allSuppliers, setAllSuppliers] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [openProductDialog, setOpenProductDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Datos mock expandidos
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
      barcode: '1234567890123',
      recommended: true
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
      barcode: '1234567890124',
      recommended: false
    },
    {
      id: '3',
      name: 'Taladro Percutor 18V',
      description: 'Taladro percutor inalámbrico de 18V con batería',
      price: 85000,
      currency: 'CLP',
      category: 'Herramientas',
      brand: 'DeWalt',
      image: '/images/taladro.jpg',
      supplier: 'Maestro',
      supplierKey: 'maestro',
      available: true,
      stock: 25,
      rating: 4.8,
      reviews: 45,
      features: ['Inalámbrico', 'Percutor', 'Batería incluida'],
      specifications: {
        'Voltaje': '18V',
        'Tipo': 'Percutor',
        'Batería': 'Incluida'
      },
      shipping: {
        free: true,
        cost: 0,
        estimated_days: 1
      },
      warranty: '2 años',
      sku: 'TAL-003',
      barcode: '1234567890125',
      recommended: true
    }
  ];

  const mockSuppliers = [
    { key: 'sodimac', name: 'Sodimac', category: 'Retail', coverage: 'Nacional', specialties: ['Materiales', 'Herramientas', 'Pinturas'] },
    { key: 'easy', name: 'Easy', category: 'Retail', coverage: 'Nacional', specialties: ['Materiales', 'Herramientas', 'Pinturas'] },
    { key: 'maestro', name: 'Maestro', category: 'Retail', coverage: 'Nacional', specialties: ['Materiales', 'Herramientas'] },
    { key: 'melon', name: 'Cementos Melón', category: 'Materiales', coverage: 'Nacional', specialties: ['Cementos', 'Hormigones'] },
    { key: 'dewalt', name: 'DeWalt Chile', category: 'Herramientas', coverage: 'Nacional', specialties: ['Herramientas Eléctricas'] }
  ];

  const mockCategories = [
    'Materiales de Construcción',
    'Herramientas',
    'Pinturas y Acabados',
    'Electricidad',
    'Plomería',
    'Cementos',
    'Cerámicas',
    'Pisos y Revestimientos'
  ];

  useEffect(() => {
    fetchSupplierStats();
    fetchAllSuppliers();
  }, []);

  const fetchSupplierStats = async () => {
    try {
      const response = await apiFetch('/intelligent-search/suppliers/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSupplierStats(data.data);
      } else {
        // Datos mock
        setSupplierStats({
          total: 15,
          byCategory: { 'Retail': 5, 'Materiales': 4, 'Herramientas': 3, 'Pinturas': 2, 'Electricidad': 1 },
          byCoverage: { 'Nacional': 12, 'Región Metropolitana': 2, 'Región de Valparaíso': 1 },
          withDelivery: 14,
          withInstallation: 8,
          specialties: ['Materiales', 'Herramientas', 'Pinturas', 'Electricidad', 'Plomería', 'Cementos', 'Cerámicas']
        });
      }
    } catch (error) {
      console.error('Error fetching supplier stats:', error);
    }
  };

  const fetchAllSuppliers = async () => {
    try {
      const response = await apiFetch('/intelligent-search/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllSuppliers(data.data);
      } else {
        setAllSuppliers(mockSuppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      setAllSuppliers(mockSuppliers);
    }
  };

  const handleIntelligentSearch = async () => {
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
      if (priceRange[0] > 0) params.append('price_min', priceRange[0].toString());
      if (priceRange[1] < 1000000) params.append('price_max', priceRange[1].toString());
      if (availabilityFilter) params.append('available_only', 'true');
      params.append('limit', '50');

      const response = await apiFetch(`/intelligent-search/search?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data);
        setSuccess(`Búsqueda completada: ${data.data.total} productos encontrados`);
      } else {
        // Usar datos mock si falla la API
        setSearchResults({
          query: searchTerm,
          total: mockProducts.length,
          suppliers: [
            { name: 'Sodimac', key: 'sodimac', total: 1, recommended: true },
            { name: 'Easy', key: 'easy', total: 1, recommended: false },
            { name: 'Maestro', key: 'maestro', total: 1, recommended: true }
          ],
          recommendedSuppliers: [
            { name: 'Sodimac', key: 'sodimac', specialties: ['Materiales', 'Herramientas'], coverage: 'Nacional' },
            { name: 'Cementos Melón', key: 'melon', specialties: ['Cementos'], coverage: 'Nacional' }
          ],
          products: mockProducts,
          searchTime: new Date().toISOString(),
          filters: {
            category: categoryFilter,
            priceRange: { min: priceRange[0], max: priceRange[1] },
            availableOnly: availabilityFilter,
            suppliers: supplierFilter
          }
        });
        setSuccess(`Búsqueda completada: ${mockProducts.length} productos encontrados`);
      }
    } catch (error) {
      console.error('Error en búsqueda inteligente:', error);
      setError('Error en la búsqueda de productos');
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
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesAvailability = !availabilityFilter || product.available;
    
    return matchesPrice && matchesAvailability;
  }) || [];

  const renderIntelligentSearchTab = () => (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <AIIcon sx={{ mr: 1, color: '#5e72e4' }} />
        <Typography 
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#ffffff',
            textShadow: '0 2px 4px rgba(94, 114, 228, 0.5)',
          }}
        >
          Búsqueda Inteligente con IA
        </Typography>
        <Chip 
          label="Beta" 
          color="primary" 
          size="small" 
          sx={{ ml: 2 }} 
        />
      </Box>

      {/* Barra de búsqueda inteligente */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                label="Buscar productos inteligentemente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleIntelligentSearch()}
                placeholder="Ej: cemento portland, taladro 18v, pintura exterior..."
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                options={mockCategories}
                value={categoryFilter || null}
                onChange={(event, newValue) => setCategoryFilter(newValue || '')}
                isOptionEqualToValue={(option, value) => option === value}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Categoría"
                    placeholder="Seleccionar categoría"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <CategoryIcon sx={{ mr: 1 }} />
                    {option}
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Autocomplete
                multiple
                options={allSuppliers}
                getOptionLabel={(option) => option.name}
                value={allSuppliers.filter(s => supplierFilter.includes(s.key))}
                onChange={(event, newValue) => setSupplierFilter(newValue.map(s => s.key))}
                isOptionEqualToValue={(option, value) => option.key === value.key}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Proveedores"
                    placeholder="Seleccionar proveedores"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <StoreIcon sx={{ mr: 1 }} />
                    {option.name}
                    <Chip label={option.category} size="small" sx={{ ml: 1 }} />
                  </Box>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.key}
                      label={option.name}
                      size="small"
                    />
                  ))
                }
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                onClick={handleIntelligentSearch}
                disabled={loading}
                fullWidth
                startIcon={loading ? <CircularProgress size={20} /> : <AIIcon />}
                sx={{ height: '56px' }}
              >
                Buscar IA
              </Button>
            </Grid>
          </Grid>

          {/* Filtros avanzados */}
          <Box mt={2}>
            <Button
              startIcon={<FilterIcon />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="outlined"
              size="small"
            >
              Filtros Avanzados
            </Button>
          </Box>

          {showAdvancedFilters && (
            <Box mt={2}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography gutterBottom>Rango de Precios</Typography>
                  <Slider
                    value={priceRange}
                    onChange={(e, newValue) => setPriceRange(newValue as number[])}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000000}
                    step={1000}
                    valueLabelFormat={(value) => `$${value.toLocaleString('es-CL')}`}
                  />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">
                      ${priceRange[0].toLocaleString('es-CL')}
                    </Typography>
                    <Typography variant="caption">
                      ${priceRange[1].toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.checked)}
                      />
                    }
                    label="Solo productos disponibles"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
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
              <Box display="flex" gap={1}>
                <Chip
                  icon={<AIIcon />}
                  label="IA Activada"
                  color="primary"
                  size="small"
                />
                <Chip
                  icon={<RecommendIcon />}
                  label={`${searchResults.recommendedSuppliers.length} proveedores recomendados`}
                  color="success"
                  size="small"
                />
              </Box>
            </Box>

            {/* Proveedores recomendados por IA */}
            {searchResults.recommendedSuppliers.length > 0 && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom color="success.main">
                  <RecommendIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Proveedores Recomendados por IA
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {searchResults.recommendedSuppliers.map((supplier, index) => (
                    <Chip
                      key={index}
                      label={supplier.name}
                      color="success"
                      variant="outlined"
                      icon={<StarIcon />}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Estadísticas de proveedores */}
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              {searchResults.suppliers.map((supplier, index) => (
                <Chip
                  key={index}
                  label={`${supplier.name}: ${supplier.total}`}
                  color={supplier.error ? 'error' : supplier.recommended ? 'success' : 'primary'}
                  size="small"
                  icon={supplier.recommended ? <StarIcon /> : undefined}
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
                          sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' } }}
                        >
                          <FavoriteIcon 
                            color={favorites.includes(product.id) ? 'error' : 'inherit'} 
                          />
                        </IconButton>
                      </Box>
                      <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                        <Chip
                          label={product.supplier}
                          size="small"
                          color={product.recommended ? 'success' : 'default'}
                        />
                        {product.recommended && (
                          <Chip
                            label="IA"
                            size="small"
                            color="primary"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
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

  const renderSupplierStatsTab = () => (
    <Box>
      <Typography variant="h5" gutterBottom>
        Estadísticas de Proveedores
      </Typography>

      {supplierStats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <StoreIcon color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Proveedores
                    </Typography>
                    <Typography variant="h5">
                      {supplierStats.total}
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
                  <ShippingIcon color="success" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Con Delivery
                    </Typography>
                    <Typography variant="h5">
                      {supplierStats.withDelivery}
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
                  <PaymentIcon color="warning" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Con Instalación
                    </Typography>
                    <Typography variant="h5">
                      {supplierStats.withInstallation}
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
                  <CategoryIcon color="info" sx={{ mr: 1 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Especialidades
                    </Typography>
                    <Typography variant="h5">
                      {supplierStats.specialties.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Por Categoría
                </Typography>
                {Object.entries(supplierStats.byCategory).map(([category, count]) => (
                  <Box key={category} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{category}</Typography>
                    <Typography variant="body2" fontWeight="bold">{count}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Por Cobertura
                </Typography>
                {Object.entries(supplierStats.byCoverage).map(([coverage, count]) => (
                  <Box key={coverage} display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">{coverage}</Typography>
                    <Typography variant="body2" fontWeight="bold">{count}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Especialidades Disponibles
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {supplierStats.specialties.map((specialty, index) => (
                    <Chip key={index} label={specialty} size="small" />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Integración Inteligente con Proveedores
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab icon={<AIIcon />} label="Búsqueda IA" />
        <Tab icon={<StoreIcon />} label="Estadísticas" />
      </Tabs>

      {activeTab === 0 && renderIntelligentSearchTab()}
      {activeTab === 1 && renderSupplierStatsTab()}

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

export default EnhancedSupplierIntegration;
