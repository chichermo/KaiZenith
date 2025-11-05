import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { pool } from '../index';
import { authenticateToken } from './auth';
import { Supplier, Product, ProductSupplier } from '../types';
import axios from 'axios';

const router = express.Router();

// Obtener todos los proveedores
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn(['materials', 'equipment', 'services', 'all']),
  query('status').optional().isIn(['active', 'inactive'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      whereClause += ` AND category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = `SELECT COUNT(*) FROM suppliers ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Obtener proveedores
    const dataQuery = `
      SELECT * FROM suppliers 
      ${whereClause}
      ORDER BY name ASC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);
    
    const result = await pool.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear nuevo proveedor
router.post('/', authenticateToken, [
  body('name').notEmpty().trim(),
  body('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('region').notEmpty().trim(),
  body('category').isIn(['materials', 'equipment', 'services', 'all']),
  body('api_endpoint').optional().isURL(),
  body('api_key').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const {
      name,
      rut,
      email,
      phone,
      address,
      city,
      region,
      category,
      api_endpoint,
      api_key
    } = req.body;

    // Verificar si el RUT ya existe
    const existingSupplier = await pool.query('SELECT id FROM suppliers WHERE rut = $1', [rut]);
    if (existingSupplier.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Ya existe un proveedor con este RUT' });
    }

    const result = await pool.query(
      `INSERT INTO suppliers (name, rut, email, phone, address, city, region, category, api_endpoint, api_key, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [name, rut, email, phone, address, city, region, category, api_endpoint, api_key, 'active']
    );

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando proveedor:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Buscar productos en proveedores
router.post('/search-products', authenticateToken, [
  body('query').notEmpty().trim(),
  body('category').optional().isString(),
  body('max_price').optional().isFloat({ min: 0 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { query, category, max_price } = req.body;

    // Obtener proveedores activos con API
    const suppliersResult = await pool.query(
      'SELECT * FROM suppliers WHERE status = $1 AND api_endpoint IS NOT NULL AND api_key IS NOT NULL',
      ['active']
    );

    const searchResults = [];

    // Buscar en cada proveedor
    for (const supplier of suppliersResult.rows) {
      try {
        const searchResult = await searchInSupplier(supplier, query, category, max_price);
        searchResults.push({
          supplier: {
            id: supplier.id,
            name: supplier.name,
            category: supplier.category
          },
          products: searchResult
        });
      } catch (error) {
        console.error(`Error buscando en proveedor ${supplier.name}:`, error);
        searchResults.push({
          supplier: {
            id: supplier.id,
            name: supplier.name,
            category: supplier.category
          },
          products: [],
          error: 'Error conectando con el proveedor'
        });
      }
    }

    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    console.error('Error buscando productos:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Función para buscar en un proveedor específico
async function searchInSupplier(supplier: any, query: string, category?: string, maxPrice?: number) {
  const products = [];

  try {
    // Simulación de búsqueda en diferentes proveedores chilenos
    switch (supplier.name.toLowerCase()) {
      case 'sodimac':
        products.push(...await searchSodimac(query, category, maxPrice));
        break;
      case 'maestro':
        products.push(...await searchMaestro(query, category, maxPrice));
        break;
      case 'construmart':
        products.push(...await searchConstrumart(query, category, maxPrice));
        break;
      default:
        // Proveedor genérico
        products.push(...await searchGenericSupplier(supplier, query, category, maxPrice));
    }
  } catch (error) {
    console.error(`Error en proveedor ${supplier.name}:`, error);
  }

  return products;
}

// Simulación de búsqueda en Sodimac
async function searchSodimac(query: string, category?: string, maxPrice?: number) {
  // En un caso real, aquí harías una llamada a la API de Sodimac
  return [
    {
      id: `sodimac_${Math.random().toString(36).substr(2, 9)}`,
      name: `${query} - Sodimac`,
      description: `Producto ${query} disponible en Sodimac`,
      price: Math.floor(Math.random() * 100000) + 10000,
      availability: true,
      supplier_code: 'SOD001',
      category: category || 'materials',
      image_url: 'https://via.placeholder.com/150',
      delivery_time: '2-3 días hábiles'
    }
  ];
}

// Simulación de búsqueda en Maestro
async function searchMaestro(query: string, category?: string, maxPrice?: number) {
  return [
    {
      id: `maestro_${Math.random().toString(36).substr(2, 9)}`,
      name: `${query} - Maestro`,
      description: `Producto ${query} disponible en Maestro`,
      price: Math.floor(Math.random() * 120000) + 8000,
      availability: true,
      supplier_code: 'MAE001',
      category: category || 'materials',
      image_url: 'https://via.placeholder.com/150',
      delivery_time: '1-2 días hábiles'
    }
  ];
}

// Simulación de búsqueda en Construmart
async function searchConstrumart(query: string, category?: string, maxPrice?: number) {
  return [
    {
      id: `construmart_${Math.random().toString(36).substr(2, 9)}`,
      name: `${query} - Construmart`,
      description: `Producto ${query} disponible en Construmart`,
      price: Math.floor(Math.random() * 90000) + 12000,
      availability: true,
      supplier_code: 'CON001',
      category: category || 'materials',
      image_url: 'https://via.placeholder.com/150',
      delivery_time: '3-5 días hábiles'
    }
  ];
}

// Simulación de búsqueda en proveedor genérico
async function searchGenericSupplier(supplier: any, query: string, category?: string, maxPrice?: number) {
  return [
    {
      id: `${supplier.name.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${query} - ${supplier.name}`,
      description: `Producto ${query} disponible en ${supplier.name}`,
      price: Math.floor(Math.random() * 80000) + 15000,
      availability: true,
      supplier_code: `${supplier.name.substring(0, 3).toUpperCase()}001`,
      category: category || 'materials',
      image_url: 'https://via.placeholder.com/150',
      delivery_time: '2-4 días hábiles'
    }
  ];
}

// Comparar precios de un producto específico
router.post('/compare-prices', authenticateToken, [
  body('product_name').notEmpty().trim(),
  body('category').optional().isString(),
  body('quantity').optional().isFloat({ min: 1 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { product_name, category, quantity = 1 } = req.body;

    // Buscar el producto en todos los proveedores
    const searchResults = await searchInAllSuppliers(product_name, category);

    // Procesar y comparar resultados
    const comparison = searchResults.map(result => ({
      supplier: result.supplier,
      products: result.products.map(product => ({
        ...product,
        total_price: product.price * quantity,
        price_per_unit: product.price
      }))
    }));

    // Encontrar el mejor precio
    const allProducts = comparison.flatMap(result => 
      result.products.map(product => ({
        ...product,
        supplier: result.supplier
      }))
    );

    const bestPrice = allProducts.reduce((best, current) => 
      current.price < best.price ? current : best
    );

    res.json({
      success: true,
      data: {
        product_name,
        quantity,
        comparison,
        best_price: bestPrice,
        total_suppliers: comparison.length,
        total_products: allProducts.length
      }
    });
  } catch (error) {
    console.error('Error comparando precios:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Función auxiliar para buscar en todos los proveedores
async function searchInAllSuppliers(query: string, category?: string) {
  const suppliersResult = await pool.query(
    'SELECT * FROM suppliers WHERE status = $1',
    ['active']
  );

  const results = [];
  for (const supplier of suppliersResult.rows) {
    try {
      const products = await searchInSupplier(supplier, query, category);
      results.push({
        supplier: {
          id: supplier.id,
          name: supplier.name,
          category: supplier.category
        },
        products
      });
    } catch (error) {
      console.error(`Error en proveedor ${supplier.name}:`, error);
    }
  }

  return results;
}

// Obtener estadísticas de proveedores
router.get('/stats/summary', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_suppliers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_suppliers,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_suppliers,
        COUNT(CASE WHEN category = 'materials' THEN 1 END) as materials_suppliers,
        COUNT(CASE WHEN category = 'equipment' THEN 1 END) as equipment_suppliers,
        COUNT(CASE WHEN category = 'services' THEN 1 END) as services_suppliers,
        COUNT(CASE WHEN api_endpoint IS NOT NULL THEN 1 END) as api_enabled_suppliers
      FROM suppliers
    `);

    res.json({
      success: true,
      data: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
