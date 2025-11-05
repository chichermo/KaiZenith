import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';
import axios from 'axios';

const router = express.Router();

// Configuración de APIs de proveedores chilenos
const SUPPLIER_APIS = {
  sodimac: {
    name: 'Sodimac',
    baseUrl: 'https://api.sodimac.cl',
    endpoints: {
      products: '/v1/products',
      search: '/v1/products/search',
      categories: '/v1/categories',
      stores: '/v1/stores',
      availability: '/v1/products/{id}/availability'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  easy: {
    name: 'Easy',
    baseUrl: 'https://api.easy.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/stores',
      availability: '/api/products/{id}/stock'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  maestro: {
    name: 'Maestro',
    baseUrl: 'https://api.maestro.cl',
    endpoints: {
      products: '/products',
      search: '/products/search',
      categories: '/categories',
      stores: '/stores',
      availability: '/products/{id}/availability'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  homecenter: {
    name: 'Homecenter',
    baseUrl: 'https://api.homecenter.cl',
    endpoints: {
      products: '/api/v1/products',
      search: '/api/v1/products/search',
      categories: '/api/v1/categories',
      stores: '/api/v1/stores',
      availability: '/api/v1/products/{id}/availability'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  constructor: {
    name: 'Constructor',
    baseUrl: 'https://api.constructor.cl',
    endpoints: {
      products: '/api/products',
      search: '/api/products/search',
      categories: '/api/categories',
      stores: '/api/stores',
      availability: '/api/products/{id}/stock'
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }
};

// Cache de productos para evitar llamadas excesivas
let productCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Función para limpiar cache
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of productCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      productCache.delete(key);
    }
  }
};

// Buscar productos en múltiples proveedores
router.get('/search', authenticateToken, [
  query('q').notEmpty().trim(),
  query('category').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('suppliers').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { q, category, limit = 20, suppliers } = req.params;
    const searchTerm = q as string;
    const categoryFilter = category as string;
    const limitNum = parseInt(limit as string);
    const suppliersFilter = suppliers ? (suppliers as string).split(',') : Object.keys(SUPPLIER_APIS);

    // Verificar cache
    const cacheKey = `search_${searchTerm}_${categoryFilter}_${suppliersFilter.join(',')}`;
    const cachedResult = productCache.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return res.json({
        success: true,
        data: cachedResult.data,
        cached: true
      });
    }

    const searchPromises = suppliersFilter.map(async (supplierKey) => {
      const supplier = SUPPLIER_APIS[supplierKey as keyof typeof SUPPLIER_APIS];
      if (!supplier) return null;

      try {
        const searchUrl = `${supplier.baseUrl}${supplier.endpoints.search}`;
        const params: any = {
          q: searchTerm,
          limit: limitNum
        };

        if (categoryFilter) {
          params.category = categoryFilter;
        }

        const response = await axios.get(searchUrl, {
          params,
          headers: supplier.headers,
          timeout: 10000
        });

        return {
          supplier: supplier.name,
          supplierKey,
          products: response.data.products || response.data.data || response.data || [],
          total: response.data.total || response.data.count || 0
        };
      } catch (error) {
        console.error(`Error buscando en ${supplier.name}:`, error);
        return {
          supplier: supplier.name,
          supplierKey,
          products: [],
          total: 0,
          error: 'Error de conexión'
        };
      }
    });

    const results = await Promise.all(searchPromises);
    const validResults = results.filter(result => result !== null);

    // Combinar y ordenar resultados por precio
    const allProducts: any[] = [];
    validResults.forEach(result => {
      if (result && result.products) {
        result.products.forEach((product: any) => {
          allProducts.push({
            ...product,
            supplier: result.supplier,
            supplierKey: result.supplierKey,
            searchScore: calculateSearchScore(product, searchTerm)
          });
        });
      }
    });

    // Ordenar por relevancia y precio
    allProducts.sort((a, b) => {
      if (a.searchScore !== b.searchScore) {
        return b.searchScore - a.searchScore;
      }
      return (a.price || 0) - (b.price || 0);
    });

    const responseData = {
      query: searchTerm,
      total: allProducts.length,
      suppliers: validResults.map(r => ({
        name: r?.supplier,
        total: r?.total || 0,
        error: r?.error
      })),
      products: allProducts.slice(0, limitNum),
      searchTime: new Date().toISOString()
    };

    // Guardar en cache
    productCache.set(cacheKey, {
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
    console.error('Error en búsqueda de productos:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener detalles de un producto específico
router.get('/product/:id', authenticateToken, [
  query('supplier').notEmpty().trim()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { id } = req.params;
    const { supplier } = req.query;

    const supplierConfig = SUPPLIER_APIS[supplier as keyof typeof SUPPLIER_APIS];
    if (!supplierConfig) {
      return res.status(400).json({ success: false, error: 'Proveedor no válido' });
    }

    // Verificar cache
    const cacheKey = `product_${id}_${supplier}`;
    const cachedResult = productCache.get(cacheKey);
    
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return res.json({
        success: true,
        data: cachedResult.data,
        cached: true
      });
    }

    try {
      const productUrl = `${supplierConfig.baseUrl}${supplierConfig.endpoints.products}/${id}`;
      const response = await axios.get(productUrl, {
        headers: supplierConfig.headers,
        timeout: 10000
      });

      const productData = {
        ...response.data,
        supplier: supplierConfig.name,
        supplierKey: supplier,
        fetchedAt: new Date().toISOString()
      };

      // Guardar en cache
      productCache.set(cacheKey, {
        data: productData,
        timestamp: Date.now()
      });

      res.json({
        success: true,
        data: productData
      });
    } catch (error) {
      console.error(`Error obteniendo producto ${id} de ${supplierConfig.name}:`, error);
      res.status(500).json({ success: false, error: 'Error obteniendo producto' });
    }
  } catch (error) {
    console.error('Error en obtener producto:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Verificar disponibilidad de producto
router.get('/availability/:id', authenticateToken, [
  query('supplier').notEmpty().trim(),
  query('store').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { id } = req.params;
    const { supplier, store } = req.query;

    const supplierConfig = SUPPLIER_APIS[supplier as keyof typeof SUPPLIER_APIS];
    if (!supplierConfig) {
      return res.status(400).json({ success: false, error: 'Proveedor no válido' });
    }

    try {
      const availabilityUrl = `${supplierConfig.baseUrl}${supplierConfig.endpoints.availability.replace('{id}', id)}`;
      const params: any = {};
      
      if (store) {
        params.store = store;
      }

      const response = await axios.get(availabilityUrl, {
        params,
        headers: supplierConfig.headers,
        timeout: 10000
      });

      res.json({
        success: true,
        data: {
          ...response.data,
          supplier: supplierConfig.name,
          productId: id,
          checkedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error(`Error verificando disponibilidad de ${id} en ${supplierConfig.name}:`, error);
      res.status(500).json({ success: false, error: 'Error verificando disponibilidad' });
    }
  } catch (error) {
    console.error('Error en verificar disponibilidad:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener categorías de productos
router.get('/categories', authenticateToken, [
  query('supplier').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const { supplier } = req.query;
    const suppliersToCheck = supplier ? [supplier as string] : Object.keys(SUPPLIER_APIS);

    const categoryPromises = suppliersToCheck.map(async (supplierKey) => {
      const supplierConfig = SUPPLIER_APIS[supplierKey as keyof typeof SUPPLIER_APIS];
      if (!supplierConfig) return null;

      try {
        const categoriesUrl = `${supplierConfig.baseUrl}${supplierConfig.endpoints.categories}`;
        const response = await axios.get(categoriesUrl, {
          headers: supplierConfig.headers,
          timeout: 10000
        });

        return {
          supplier: supplierConfig.name,
          supplierKey,
          categories: response.data.categories || response.data.data || response.data || []
        };
      } catch (error) {
        console.error(`Error obteniendo categorías de ${supplierConfig.name}:`, error);
        return {
          supplier: supplierConfig.name,
          supplierKey,
          categories: [],
          error: 'Error de conexión'
        };
      }
    });

    const results = await Promise.all(categoryPromises);
    const validResults = results.filter(result => result !== null);

    res.json({
      success: true,
      data: validResults
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener tiendas/sucursales
router.get('/stores', authenticateToken, [
  query('supplier').optional().isString(),
  query('city').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const { supplier, city } = req.query;
    const suppliersToCheck = supplier ? [supplier as string] : Object.keys(SUPPLIER_APIS);

    const storePromises = suppliersToCheck.map(async (supplierKey) => {
      const supplierConfig = SUPPLIER_APIS[supplierKey as keyof typeof SUPPLIER_APIS];
      if (!supplierConfig) return null;

      try {
        const storesUrl = `${supplierConfig.baseUrl}${supplierConfig.endpoints.stores}`;
        const params: any = {};
        
        if (city) {
          params.city = city;
        }

        const response = await axios.get(storesUrl, {
          params,
          headers: supplierConfig.headers,
          timeout: 10000
        });

        return {
          supplier: supplierConfig.name,
          supplierKey,
          stores: response.data.stores || response.data.data || response.data || []
        };
      } catch (error) {
        console.error(`Error obteniendo tiendas de ${supplierConfig.name}:`, error);
        return {
          supplier: supplierConfig.name,
          supplierKey,
          stores: [],
          error: 'Error de conexión'
        };
      }
    });

    const results = await Promise.all(storePromises);
    const validResults = results.filter(result => result !== null);

    res.json({
      success: true,
      data: validResults
    });
  } catch (error) {
    console.error('Error obteniendo tiendas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Comparar precios de un producto específico
router.get('/compare/:productName', authenticateToken, [
  query('category').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { productName } = req.params;
    const { category, limit = 10 } = req.query;

    // Buscar el producto en todos los proveedores
    const searchPromises = Object.entries(SUPPLIER_APIS).map(async ([supplierKey, supplierConfig]) => {
      try {
        const searchUrl = `${supplierConfig.baseUrl}${supplierConfig.endpoints.search}`;
        const params: any = {
          q: productName,
          limit: parseInt(limit as string)
        };

        if (category) {
          params.category = category;
        }

        const response = await axios.get(searchUrl, {
          params,
          headers: supplierConfig.headers,
          timeout: 10000
        });

        const products = response.data.products || response.data.data || response.data || [];
        
        return {
          supplier: supplierConfig.name,
          supplierKey,
          products: products.map((product: any) => ({
            ...product,
            supplier: supplierConfig.name,
            supplierKey
          }))
        };
      } catch (error) {
        console.error(`Error comparando precios en ${supplierConfig.name}:`, error);
        return {
          supplier: supplierConfig.name,
          supplierKey,
          products: [],
          error: 'Error de conexión'
        };
      }
    });

    const results = await Promise.all(searchPromises);
    
    // Combinar todos los productos
    const allProducts: any[] = [];
    results.forEach(result => {
      allProducts.push(...result.products);
    });

    // Ordenar por precio
    allProducts.sort((a, b) => (a.price || 0) - (b.price || 0));

    // Agrupar por proveedor para estadísticas
    const supplierStats = results.map(result => ({
      supplier: result.supplier,
      supplierKey: result.supplierKey,
      productCount: result.products.length,
      averagePrice: result.products.length > 0 
        ? result.products.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / result.products.length 
        : 0,
      minPrice: result.products.length > 0 
        ? Math.min(...result.products.map((p: any) => p.price || Infinity))
        : null,
      maxPrice: result.products.length > 0 
        ? Math.max(...result.products.map((p: any) => p.price || 0))
        : null,
      error: result.error
    }));

    res.json({
      success: true,
      data: {
        productName,
        totalProducts: allProducts.length,
        suppliers: supplierStats,
        products: allProducts,
        priceRange: {
          min: allProducts.length > 0 ? Math.min(...allProducts.map(p => p.price || Infinity)) : null,
          max: allProducts.length > 0 ? Math.max(...allProducts.map(p => p.price || 0)) : null,
          average: allProducts.length > 0 
            ? allProducts.reduce((sum, p) => sum + (p.price || 0), 0) / allProducts.length 
            : null
        },
        comparedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error comparando precios:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Función auxiliar para calcular score de búsqueda
function calculateSearchScore(product: any, searchTerm: string): number {
  let score = 0;
  const searchLower = searchTerm.toLowerCase();
  
  // Puntaje por coincidencia exacta en nombre
  if (product.name && product.name.toLowerCase().includes(searchLower)) {
    score += 10;
  }
  
  // Puntaje por coincidencia en descripción
  if (product.description && product.description.toLowerCase().includes(searchLower)) {
    score += 5;
  }
  
  // Puntaje por coincidencia en categoría
  if (product.category && product.category.toLowerCase().includes(searchLower)) {
    score += 3;
  }
  
  // Puntaje por disponibilidad
  if (product.available || product.stock > 0) {
    score += 2;
  }
  
  // Puntaje por precio (productos más baratos tienen mejor score)
  if (product.price) {
    score += Math.max(0, 5 - (product.price / 10000));
  }
  
  return score;
}

export default router;
