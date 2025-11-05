import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';

const router = express.Router();

// Tipos de movimientos de inventario
export type InventoryMovementType = 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'return' | 'production' | 'consumption';

// Estados de productos
export type ProductStatus = 'active' | 'inactive' | 'discontinued';

// Producto en inventario
interface InventoryProduct {
  id: number;
  code: string; // Código interno
  name: string;
  description?: string;
  category: string;
  unit: string; // unidad, kg, m2, m3, etc.
  cost_method: 'fifo' | 'lifo' | 'average'; // Método de valuación
  current_stock: number;
  min_stock: number; // Stock mínimo (alerta)
  max_stock: number; // Stock máximo
  unit_cost: number; // Costo unitario promedio
  total_value: number; // Valor total del inventario
  location?: string; // Ubicación física (almacén, bodega, etc.)
  supplier_id?: number;
  status: ProductStatus;
  created_at: Date;
  updated_at: Date;
}

// Movimiento de inventario
interface InventoryMovement {
  id: number;
  movement_type: InventoryMovementType;
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_type?: string; // 'purchase_order', 'invoice', 'adjustment', etc.
  reference_id?: number;
  document_number?: string;
  location_from?: string;
  location_to?: string;
  notes?: string;
  user_id: number;
  user_name: string;
  created_at: Date;
}

// Stock por ubicación
interface LocationStock {
  location: string;
  product_id: number;
  quantity: number;
}

// Datos en memoria
let inventoryProducts: InventoryProduct[] = [];
let inventoryMovements: InventoryMovement[] = [];
let locationStocks: LocationStock[] = [];

// Crear producto en inventario
router.post('/', authenticateToken, [
  body('code').notEmpty().trim(),
  body('name').notEmpty().trim(),
  body('category').notEmpty().trim(),
  body('unit').notEmpty().trim(),
  body('cost_method').isIn(['fifo', 'lifo', 'average']),
  body('min_stock').isFloat({ min: 0 }),
  body('max_stock').optional().isFloat({ min: 0 }),
  body('unit_cost').optional().isFloat({ min: 0 }),
  body('location').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const {
      code,
      name,
      description,
      category,
      unit,
      cost_method,
      min_stock,
      max_stock,
      unit_cost,
      location,
      supplier_id
    } = req.body;

    // Verificar que el código no exista
    const existingProduct = inventoryProducts.find(p => p.code === code);
    if (existingProduct) {
      return res.status(400).json({ success: false, error: 'Ya existe un producto con este código' });
    }

    const newProduct: InventoryProduct = {
      id: inventoryProducts.length + 1,
      code,
      name,
      description,
      category,
      unit,
      cost_method,
      current_stock: 0,
      min_stock,
      max_stock: max_stock || min_stock * 10,
      unit_cost: unit_cost || 0,
      total_value: 0,
      location,
      supplier_id,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    inventoryProducts.push(newProduct);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener todos los productos con filtros
router.get('/', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { category, status, low_stock, location, search } = req.query;

    let filtered = [...inventoryProducts];

    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }

    if (low_stock === 'true') {
      filtered = filtered.filter(p => p.current_stock <= p.min_stock);
    }

    if (location) {
      filtered = filtered.filter(p => p.location === location);
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.code.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener producto por ID
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const product = inventoryProducts.find(p => p.id === parseInt(id));

    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    // Obtener movimientos recientes del producto
    const movements = inventoryMovements
      .filter(m => m.product_id === parseInt(id))
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        ...product,
        recent_movements: movements
      }
    });
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar producto
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty().trim(),
  body('min_stock').optional().isFloat({ min: 0 }),
  body('max_stock').optional().isFloat({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'discontinued'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const productIndex = inventoryProducts.findIndex(p => p.id === parseInt(id));

    if (productIndex === -1) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    const updates = req.body;
    inventoryProducts[productIndex] = {
      ...inventoryProducts[productIndex],
      ...updates,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: inventoryProducts[productIndex]
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Registrar movimiento de inventario
router.post('/movements', authenticateToken, [
  body('movement_type').isIn(['purchase', 'sale', 'adjustment', 'transfer', 'return', 'production', 'consumption']),
  body('product_id').isInt({ min: 1 }),
  body('quantity').isFloat({ min: 0 }),
  body('unit_cost').optional().isFloat({ min: 0 }),
  body('reference_type').optional().isString(),
  body('reference_id').optional().isInt({ min: 1 }),
  body('document_number').optional().isString(),
  body('location_from').optional().isString(),
  body('location_to').optional().isString(),
  body('notes').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const {
      movement_type,
      product_id,
      quantity,
      unit_cost,
      reference_type,
      reference_id,
      document_number,
      location_from,
      location_to,
      notes
    } = req.body;

    const user = (req as any).user;
    const product = inventoryProducts.find(p => p.id === product_id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Producto no encontrado' });
    }

    // Validar cantidad según tipo de movimiento
    if (movement_type === 'sale' || movement_type === 'consumption' || movement_type === 'transfer') {
      if (product.current_stock < quantity) {
        return res.status(400).json({ 
          success: false, 
          error: `Stock insuficiente. Stock actual: ${product.current_stock} ${product.unit}` 
        });
      }
    }

    // Calcular costo unitario
    let finalUnitCost = unit_cost || product.unit_cost;
    
    // Calcular nuevo stock
    let newStock = product.current_stock;
    switch (movement_type) {
      case 'purchase':
      case 'return':
      case 'production':
        newStock += quantity;
        break;
      case 'sale':
      case 'consumption':
        newStock -= quantity;
        break;
      case 'transfer':
        if (location_from === product.location) {
          newStock -= quantity;
        } else if (location_to === product.location) {
          newStock += quantity;
        }
        break;
      case 'adjustment':
        newStock = quantity; // Ajuste directo
        break;
    }

    // Calcular nuevo costo promedio (método promedio)
    let newUnitCost = product.unit_cost;
    if (movement_type === 'purchase' || movement_type === 'production') {
      if (product.current_stock > 0) {
        const totalValue = (product.current_stock * product.unit_cost) + (quantity * finalUnitCost);
        newUnitCost = totalValue / (product.current_stock + quantity);
      } else {
        newUnitCost = finalUnitCost;
      }
    }

    const totalCost = quantity * finalUnitCost;

    // Crear movimiento
    const movement: InventoryMovement = {
      id: inventoryMovements.length + 1,
      movement_type,
      product_id,
      product_code: product.code,
      product_name: product.name,
      quantity,
      unit_cost: finalUnitCost,
      total_cost: totalCost,
      reference_type,
      reference_id,
      document_number,
      location_from,
      location_to,
      notes,
      user_id: user.id,
      user_name: user.name,
      created_at: new Date()
    };

    inventoryMovements.push(movement);

    // Actualizar producto
    const productIndex = inventoryProducts.findIndex(p => p.id === product_id);
    inventoryProducts[productIndex] = {
      ...inventoryProducts[productIndex],
      current_stock: newStock,
      unit_cost: newUnitCost,
      total_value: newStock * newUnitCost,
      updated_at: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Movimiento registrado exitosamente',
      data: {
        movement,
        product: inventoryProducts[productIndex]
      }
    });
  } catch (error) {
    console.error('Error registrando movimiento:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener movimientos de inventario
router.get('/movements', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { product_id, movement_type, date_from, date_to, reference_type, reference_id } = req.query;

    let filtered = [...inventoryMovements];

    if (product_id) {
      filtered = filtered.filter(m => m.product_id === parseInt(product_id as string));
    }

    if (movement_type) {
      filtered = filtered.filter(m => m.movement_type === movement_type);
    }

    if (reference_type && reference_id) {
      filtered = filtered.filter(
        m => m.reference_type === reference_type && m.reference_id === parseInt(reference_id as string)
      );
    }

    if (date_from || date_to) {
      filtered = filtered.filter(m => {
        const movementDate = new Date(m.created_at);
        if (date_from && movementDate < new Date(date_from as string)) return false;
        if (date_to && movementDate > new Date(date_to as string)) return false;
        return true;
      });
    }

    // Ordenar por fecha más reciente
    filtered.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener reporte de inventario
router.get('/reports/inventory', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { category, location } = req.query;

    let filtered = [...inventoryProducts];

    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }

    if (location) {
      filtered = filtered.filter(p => p.location === location);
    }

    const totalValue = filtered.reduce((sum, p) => sum + p.total_value, 0);
    const lowStockCount = filtered.filter(p => p.current_stock <= p.min_stock).length;
    const totalProducts = filtered.length;

    const byCategory = filtered.reduce((acc: any, p) => {
      if (!acc[p.category]) {
        acc[p.category] = { count: 0, value: 0 };
      }
      acc[p.category].count++;
      acc[p.category].value += p.total_value;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary: {
          total_products: totalProducts,
          total_value: totalValue,
          low_stock_count: lowStockCount,
          average_cost: totalProducts > 0 ? totalValue / totalProducts : 0
        },
        by_category: byCategory,
        low_stock_products: filtered.filter(p => p.current_stock <= p.min_stock)
      }
    });
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener alertas de stock bajo
router.get('/alerts/low-stock', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const lowStockProducts = inventoryProducts.filter(p => p.current_stock <= p.min_stock);

    res.json({
      success: true,
      data: lowStockProducts.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        current_stock: p.current_stock,
        min_stock: p.min_stock,
        unit: p.unit,
        location: p.location,
        alert_level: p.current_stock === 0 ? 'critical' : (p.current_stock < p.min_stock * 0.5 ? 'high' : 'medium')
      }))
    });
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;




