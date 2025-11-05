import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';
import axios from 'axios';

const router = express.Router();

// Base de datos expandida de proveedores chilenos
const CHILEAN_SUPPLIERS_DATABASE = {
  // Grandes cadenas de retail
  sodimac: {
    name: 'Sodimac',
    category: 'Retail',
    baseUrl: 'https://api.sodimac.cl',
    endpoints: {
      products: '/v1/products',
      search: '/v1/products/search',
      categories: '/v1/categories',
      stores: '/v1/stores',
      availability: '/v1/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Materiales', 'Herramientas', 'Pinturas', 'Electricidad', 'Plomería'],
    delivery: true,
    installation: true
  },
  easy: {
    name: 'Easy',
    category: 'Retail',
    baseUrl: 'https://api.easy.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/stores',
      availability: '/api/products/{id}/stock'
    },
    coverage: 'Nacional',
    specialties: ['Materiales', 'Herramientas', 'Pinturas', 'Jardín'],
    delivery: true,
    installation: true
  },
  maestro: {
    name: 'Maestro',
    category: 'Retail',
    baseUrl: 'https://api.maestro.cl',
    endpoints: {
      products: '/products',
      search: '/products/search',
      categories: '/categories',
      stores: '/stores',
      availability: '/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Materiales', 'Herramientas', 'Pinturas'],
    delivery: true,
    installation: false
  },
  homecenter: {
    name: 'Homecenter',
    category: 'Retail',
    baseUrl: 'https://api.homecenter.cl',
    endpoints: {
      products: '/api/v1/products',
      search: '/api/v1/products/search',
      categories: '/api/v1/categories',
      stores: '/api/v1/stores',
      availability: '/api/v1/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Materiales', 'Herramientas', 'Pinturas', 'Jardín', 'Decoración'],
    delivery: true,
    installation: true
  },
  constructor: {
    name: 'Constructor',
    category: 'Retail',
    baseUrl: 'https://api.constructor.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/stores',
      availability: '/api/products/{id}/stock'
    },
    coverage: 'Nacional',
    specialties: ['Materiales', 'Herramientas'],
    delivery: true,
    installation: false
  },
  
  // Proveedores especializados en materiales
  melon: {
    name: 'Cementos Melón',
    category: 'Materiales',
    baseUrl: 'https://api.melon.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/distributors',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Cementos', 'Hormigones', 'Áridos'],
    delivery: true,
    installation: false
  },
  polpaico: {
    name: 'Cementos Polpaico',
    category: 'Materiales',
    baseUrl: 'https://api.polpaico.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/distributors',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Cementos', 'Hormigones', 'Áridos', 'Prefabricados'],
    delivery: true,
    installation: false
  },
  ceramicas: {
    name: 'Cerámicas Santiago',
    category: 'Materiales',
    baseUrl: 'https://api.ceramicassantiago.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/stores',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Región Metropolitana',
    specialties: ['Cerámicas', 'Porcelanatos', 'Pisos', 'Revestimientos'],
    delivery: true,
    installation: true
  },
  
  // Proveedores de herramientas
  dewalt: {
    name: 'DeWalt Chile',
    category: 'Herramientas',
    baseUrl: 'https://api.dewalt.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/distributors',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Herramientas Eléctricas', 'Herramientas Manuales', 'Accesorios'],
    delivery: true,
    installation: false
  },
  bosch: {
    name: 'Bosch Chile',
    category: 'Herramientas',
    baseUrl: 'https://api.bosch.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/distributors',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Herramientas Eléctricas', 'Herramientas Manuales', 'Sistemas de Seguridad'],
    delivery: true,
    installation: true
  },
  
  // Proveedores de pinturas
  sika: {
    name: 'Sika Chile',
    category: 'Pinturas',
    baseUrl: 'https://api.sika.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/distributors',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Pinturas', 'Impermeabilizantes', 'Adhesivos', 'Selladores'],
    delivery: true,
    installation: false
  },
  sherwin: {
    name: 'Sherwin Williams Chile',
    category: 'Pinturas',
    baseUrl: 'https://api.sherwinwilliams.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/stores',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Pinturas', 'Recubrimientos', 'Tintas'],
    delivery: true,
    installation: false
  },
  
  // Proveedores de electricidad
  schneider: {
    name: 'Schneider Electric Chile',
    category: 'Electricidad',
    baseUrl: 'https://api.schneider.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/distributors',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Tableros Eléctricos', 'Interruptores', 'Cables', 'Automatización'],
    delivery: true,
    installation: true
  },
  legrand: {
    name: 'Legrand Chile',
    category: 'Electricidad',
    baseUrl: 'https://api.legrand.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/distributors',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Interruptores', 'Enchufes', 'Cables', 'Sistemas Domóticos'],
    delivery: true,
    installation: true
  },
  
  // Proveedores de plomería
  roca: {
    name: 'Roca Chile',
    category: 'Plomería',
    baseUrl: 'https://api.roca.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/distributors',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Baños', 'Grifería', 'Sanitarios', 'Accesorios'],
    delivery: true,
    installation: true
  },
  moen: {
    name: 'Moen Chile',
    category: 'Plomería',
    baseUrl: 'https://api.moen.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/distributors',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Nacional',
    specialties: ['Grifería', 'Accesorios de Baño', 'Duchas'],
    delivery: true,
    installation: true
  },
  
  // Proveedores regionales
  materiales_rm: {
    name: 'Materiales RM',
    category: 'Regional',
    baseUrl: 'https://api.materialesrm.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/stores',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Región Metropolitana',
    specialties: ['Materiales', 'Herramientas', 'Pinturas'],
    delivery: true,
    installation: false
  },
  construccion_v: {
    name: 'Construcción Valparaíso',
    category: 'Regional',
    baseUrl: 'https://api.construccionv.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/stores',
      availability: '/api/products/{id}/availability'
    },
    coverage: 'Región de Valparaíso',
    specialties: ['Materiales', 'Herramientas'],
    delivery: true,
    installation: false
  }
};

// Motor de búsqueda inteligente
class IntelligentSupplierSearch {
  private suppliers = CHILEAN_SUPPLIERS_DATABASE;

  // Buscar proveedores por criterios
  searchSuppliers(criteria: {
    category?: string;
    specialty?: string;
    coverage?: string;
    delivery?: boolean;
    installation?: boolean;
    searchTerm?: string;
  }) {
    let results = Object.entries(this.suppliers);

    // Filtrar por categoría
    if (criteria.category) {
      results = results.filter(([_, supplier]) => 
        supplier.category.toLowerCase().includes(criteria.category!.toLowerCase())
      );
    }

    // Filtrar por especialidad
    if (criteria.specialty) {
      results = results.filter(([_, supplier]) => 
        supplier.specialties.some(s => 
          s.toLowerCase().includes(criteria.specialty!.toLowerCase())
        )
      );
    }

    // Filtrar por cobertura
    if (criteria.coverage) {
      results = results.filter(([_, supplier]) => 
        supplier.coverage.toLowerCase().includes(criteria.coverage!.toLowerCase())
      );
    }

    // Filtrar por servicios
    if (criteria.delivery !== undefined) {
      results = results.filter(([_, supplier]) => supplier.delivery === criteria.delivery);
    }

    if (criteria.installation !== undefined) {
      results = results.filter(([_, supplier]) => supplier.installation === criteria.installation);
    }

    // Búsqueda por texto
    if (criteria.searchTerm) {
      const searchLower = criteria.searchTerm.toLowerCase();
      results = results.filter(([_, supplier]) => 
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.specialties.some(s => s.toLowerCase().includes(searchLower)) ||
        supplier.category.toLowerCase().includes(searchLower)
      );
    }

    return results.map(([key, supplier]) => ({
      key,
      ...supplier
    }));
  }

  // Obtener proveedores recomendados para un producto
  getRecommendedSuppliers(productName: string, category: string) {
    const searchTerm = productName.toLowerCase();
    const categoryLower = category.toLowerCase();

    // Mapeo de productos a especialidades
    const productSpecialtyMap: { [key: string]: string[] } = {
      'cemento': ['Cementos', 'Materiales'],
      'ladrillo': ['Materiales', 'Cerámicas'],
      'pintura': ['Pinturas'],
      'herramienta': ['Herramientas'],
      'cable': ['Electricidad'],
      'interruptor': ['Electricidad'],
      'grifo': ['Plomería'],
      'baño': ['Plomería'],
      'cerámica': ['Cerámicas', 'Materiales'],
      'hormigón': ['Cementos', 'Materiales']
    };

    let specialties: string[] = [];
    
    // Buscar especialidades por palabra clave
    for (const [keyword, specialtyList] of Object.entries(productSpecialtyMap)) {
      if (searchTerm.includes(keyword)) {
        specialties = [...specialties, ...specialtyList];
      }
    }

    // Si no se encontraron especialidades específicas, usar la categoría
    if (specialties.length === 0) {
      specialties = [category];
    }

    // Buscar proveedores que tengan estas especialidades
    const suppliers = this.searchSuppliers({ specialty: specialties[0] });
    
    // Ordenar por relevancia (cobertura nacional primero, luego especialización)
    return suppliers.sort((a, b) => {
      if (a.coverage === 'Nacional' && b.coverage !== 'Nacional') return -1;
      if (b.coverage === 'Nacional' && a.coverage !== 'Nacional') return 1;
      
      const aRelevance = a.specialties.filter(s => 
        specialties.some(spec => s.toLowerCase().includes(spec.toLowerCase()))
      ).length;
      const bRelevance = b.specialties.filter(s => 
        specialties.some(spec => s.toLowerCase().includes(spec.toLowerCase()))
      ).length;
      
      return bRelevance - aRelevance;
    });
  }

  // Obtener todos los proveedores
  getAllSuppliers() {
    return Object.entries(this.suppliers).map(([key, supplier]) => ({
      key,
      ...supplier
    }));
  }

  // Obtener proveedores por categoría
  getSuppliersByCategory(category: string) {
    return this.searchSuppliers({ category });
  }

  // Obtener estadísticas de proveedores
  getSupplierStats() {
    const suppliers = Object.values(this.suppliers);
    
    return {
      total: suppliers.length,
      byCategory: suppliers.reduce((acc, supplier) => {
        acc[supplier.category] = (acc[supplier.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      byCoverage: suppliers.reduce((acc, supplier) => {
        acc[supplier.coverage] = (acc[supplier.coverage] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      withDelivery: suppliers.filter(s => s.delivery).length,
      withInstallation: suppliers.filter(s => s.installation).length,
      specialties: [...new Set(suppliers.flatMap(s => s.specialties))].sort()
    };
  }
}

const supplierSearch = new IntelligentSupplierSearch();

// Cache para resultados de búsqueda
let searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para limpiar cache
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of searchCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      searchCache.delete(key);
    }
  }
};

// Obtener todos los proveedores disponibles
router.get('/suppliers', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { category, specialty, coverage, delivery, installation, search } = req.query;
    
    const criteria: any = {};
    if (category) criteria.category = category as string;
    if (specialty) criteria.specialty = specialty as string;
    if (coverage) criteria.coverage = coverage as string;
    if (delivery !== undefined) criteria.delivery = delivery === 'true';
    if (installation !== undefined) criteria.installation = installation === 'true';
    if (search) criteria.searchTerm = search as string;

    const suppliers = supplierSearch.searchSuppliers(criteria);

    res.json({
      success: true,
      data: suppliers,
      total: suppliers.length
    });
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener proveedores recomendados para un producto
router.get('/suppliers/recommended', authenticateToken, [
  query('product').notEmpty().trim(),
  query('category').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { product, category = '' } = req.query;
    const recommendedSuppliers = supplierSearch.getRecommendedSuppliers(
      product as string, 
      category as string
    );

    res.json({
      success: true,
      data: recommendedSuppliers,
      product: product as string,
      category: category as string
    });
  } catch (error) {
    console.error('Error obteniendo proveedores recomendados:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de proveedores
router.get('/suppliers/stats', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const stats = supplierSearch.getSupplierStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Búsqueda inteligente de productos en múltiples proveedores
router.get('/search', authenticateToken, [
  query('q').notEmpty().trim(),
  query('category').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('suppliers').optional().isString(),
  query('price_min').optional().isFloat({ min: 0 }),
  query('price_max').optional().isFloat({ min: 0 }),
  query('available_only').optional().isBoolean()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { 
      q, 
      category, 
      limit = 50, 
      suppliers, 
      price_min, 
      price_max, 
      available_only = false 
    } = req.query;

    const searchTerm = q as string;
    const categoryFilter = category as string;
    const limitNum = parseInt(limit as string);
    const suppliersFilter = suppliers ? (suppliers as string).split(',') : Object.keys(CHILEAN_SUPPLIERS_DATABASE);
    const priceMin = price_min ? parseFloat(price_min as string) : undefined;
    const priceMax = price_max ? parseFloat(price_max as string) : undefined;
    const availableOnly = available_only === 'true';

    // Verificar cache
    const cacheKey = `search_${searchTerm}_${categoryFilter}_${suppliersFilter.join(',')}_${priceMin}_${priceMax}_${availableOnly}`;
    const cachedResult = searchCache.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return res.json({
        success: true,
        data: cachedResult.data,
        cached: true
      });
    }

    // Obtener proveedores recomendados para esta búsqueda
    const recommendedSuppliers = supplierSearch.getRecommendedSuppliers(searchTerm, categoryFilter || '');
    
    // Filtrar proveedores según criterios
    const suppliersToSearch = suppliersFilter.length > 0 ? suppliersFilter : Object.keys(CHILEAN_SUPPLIERS_DATABASE);
    
    // Generar productos mock basados en la búsqueda
    const generateMockProducts = (supplierKey: string, supplier: any, count: number = 3) => {
      const mockProducts = [];
      const baseProducts = [
        {
          name: `${searchTerm} - ${supplier.name}`,
          description: `Producto ${searchTerm} de alta calidad disponible en ${supplier.name}`,
          price: Math.floor(Math.random() * 100000) + 10000,
          currency: 'CLP',
          category: categoryFilter || 'Materiales de Construcción',
          brand: supplier.name,
          image: '/images/no-image.jpg',
          supplier: supplier.name,
          supplierKey,
          available: true,
          stock: Math.floor(Math.random() * 500) + 10,
          rating: Math.random() * 2 + 3, // 3-5 stars
          reviews: Math.floor(Math.random() * 100) + 5,
          features: ['Alta calidad', 'Garantía', 'Entrega rápida'],
          specifications: {
            'Material': 'Premium',
            'Origen': 'Chile',
            'Garantía': '1 año'
          },
          shipping: {
            free: Math.random() > 0.5,
            cost: Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 10000) + 2000,
            estimated_days: Math.floor(Math.random() * 5) + 1
          },
          warranty: '1 año',
          sku: `SKU-${supplierKey.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
          barcode: `${Math.floor(Math.random() * 10000000000000)}`
        }
      ];

      for (let i = 0; i < count; i++) {
        const baseProduct = baseProducts[0];
        mockProducts.push({
          ...baseProduct,
          id: `${supplierKey}_${i}_${Date.now()}`,
          name: `${searchTerm} ${i + 1} - ${supplier.name}`,
          price: baseProduct.price + (i * 5000),
          sku: `SKU-${supplierKey.toUpperCase()}-${i + 1}`,
          searchScore: calculateSearchScore(baseProduct, searchTerm) + i
        });
      }

      return mockProducts;
    };

    const searchPromises = suppliersToSearch.map(async (supplierKey) => {
      const supplier = CHILEAN_SUPPLIERS_DATABASE[supplierKey as keyof typeof CHILEAN_SUPPLIERS_DATABASE];
      if (!supplier) return null;

      try {
        // Intentar búsqueda real primero
        const searchUrl = `${supplier.baseUrl}${supplier.endpoints.search}`;
        const params: any = {
          q: searchTerm,
          limit: limitNum
        };

        if (categoryFilter) {
          params.category = categoryFilter;
        }

        if (priceMin !== undefined) {
          params.price_min = priceMin;
        }

        if (priceMax !== undefined) {
          params.price_max = priceMax;
        }

        if (availableOnly) {
          params.available_only = true;
        }

        const response = await axios.get(searchUrl, {
          params,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Patolin-Construction-App/1.0'
          },
          timeout: 5000 // Timeout más corto
        });

        const products = response.data.products || response.data.data || response.data || [];
        
        return {
          supplier: supplier.name,
          supplierKey,
          supplierInfo: supplier,
          products: products.map((product: any) => ({
            ...product,
            supplier: supplier.name,
            supplierKey,
            searchScore: calculateSearchScore(product, searchTerm),
            recommended: recommendedSuppliers.some(rec => rec.key === supplierKey)
          })),
          total: response.data.total || response.data.count || products.length,
          searchTime: new Date().toISOString(),
          source: 'API'
        };
      } catch (error) {
        console.log(`Usando datos mock para ${supplier.name} - API no disponible`);
        
        // Generar productos mock cuando la API falla
        const mockProducts = generateMockProducts(supplierKey, supplier, 2);
        
        return {
          supplier: supplier.name,
          supplierKey,
          supplierInfo: supplier,
          products: mockProducts.map((product: any) => ({
            ...product,
            supplier: supplier.name,
            supplierKey,
            searchScore: calculateSearchScore(product, searchTerm),
            recommended: recommendedSuppliers.some(rec => rec.key === supplierKey)
          })),
          total: mockProducts.length,
          searchTime: new Date().toISOString(),
          source: 'MOCK',
          note: 'Datos simulados - API no disponible'
        };
      }
    });

    const results = await Promise.all(searchPromises);
    const validResults = results.filter(result => result !== null);

    // Combinar y ordenar resultados
    const allProducts: any[] = [];
    validResults.forEach(result => {
      if (result && result.products) {
        allProducts.push(...result.products);
      }
    });

    // Ordenar por relevancia y precio
    allProducts.sort((a, b) => {
      // Priorizar proveedores recomendados
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      
      // Luego por score de búsqueda
      if (a.searchScore !== b.searchScore) {
        return b.searchScore - a.searchScore;
      }
      
      // Finalmente por precio
      return (a.price || 0) - (b.price || 0);
    });

    const responseData = {
      query: searchTerm,
      total: allProducts.length,
      suppliers: validResults.map(r => ({
        name: r?.supplier,
        key: r?.supplierKey,
        total: r?.total || 0,
        error: (r as any)?.error,
        recommended: recommendedSuppliers.some(rec => rec.key === r?.supplierKey)
      })),
      recommendedSuppliers: recommendedSuppliers.map(s => ({
        name: s.name,
        key: s.key,
        specialties: s.specialties,
        coverage: s.coverage
      })),
      products: allProducts.slice(0, limitNum),
      searchTime: new Date().toISOString(),
      filters: {
        category: categoryFilter,
        priceRange: { min: priceMin, max: priceMax },
        availableOnly,
        suppliers: suppliersFilter
      }
    };

    // Guardar en cache
    searchCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    // Limpiar cache expirado
    clearExpiredCache();

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error en búsqueda inteligente:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Función auxiliar para calcular score de búsqueda mejorada
const calculateSearchScore = (product: any, searchTerm: string): number => {
  let score = 0;
  const searchLower = searchTerm.toLowerCase();
  
  // Puntaje por coincidencia exacta en nombre
  if (product.name && product.name.toLowerCase().includes(searchLower)) {
    score += 20;
  }
  
  // Puntaje por coincidencia en descripción
  if (product.description && product.description.toLowerCase().includes(searchLower)) {
    score += 10;
  }
  
  // Puntaje por coincidencia en categoría
  if (product.category && product.category.toLowerCase().includes(searchLower)) {
    score += 15;
  }
  
  // Puntaje por coincidencia en marca
  if (product.brand && product.brand.toLowerCase().includes(searchLower)) {
    score += 12;
  }
  
  // Puntaje por coincidencia en SKU
  if (product.sku && product.sku.toLowerCase().includes(searchLower)) {
    score += 8;
  }
  
  // Puntaje por disponibilidad
  if (product.available || product.stock > 0) {
    score += 5;
  }
  
  // Puntaje por stock alto
  if (product.stock > 100) {
    score += 3;
  }
  
  // Puntaje por precio competitivo (productos más baratos tienen mejor score)
  if (product.price) {
    score += Math.max(0, 10 - (product.price / 10000));
  }
  
  // Puntaje por rating alto
  if (product.rating && product.rating >= 4) {
    score += 5;
  }
  
  // Puntaje por número de reseñas
  if (product.reviews && product.reviews > 10) {
    score += 2;
  }
  
  return score;
};

export default router;
