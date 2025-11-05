import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { pool } from '../index';
import { authenticateToken } from './auth';
import { PurchaseOrder, PurchaseOrderItem } from '../types';

const router = express.Router();

// Generar número de orden de compra automático
const generateOrderNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const result = await pool.query(
    'SELECT COUNT(*) FROM purchase_orders WHERE EXTRACT(YEAR FROM date) = $1',
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `OC-${year}-${count.toString().padStart(6, '0')}`;
};

// Obtener todas las órdenes de compra con paginación
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'sent', 'confirmed', 'delivered', 'cancelled']),
  query('supplier_id').optional().isInt(),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const supplierId = req.query.supplier_id as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND po.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (supplierId) {
      whereClause += ` AND po.supplier_id = $${paramIndex}`;
      queryParams.push(supplierId);
      paramIndex++;
    }

    if (dateFrom) {
      whereClause += ` AND po.date >= $${paramIndex}`;
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND po.date <= $${paramIndex}`;
      queryParams.push(dateTo);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Obtener órdenes de compra con información del proveedor
    const dataQuery = `
      SELECT 
        po.*,
        s.name as supplier_name,
        s.rut as supplier_rut,
        s.email as supplier_email,
        s.phone as supplier_phone,
        s.address as supplier_address
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ${whereClause}
      ORDER BY po.created_at DESC 
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
    console.error('Error obteniendo órdenes de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener orden de compra por ID con items
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Obtener orden de compra con proveedor
    const orderResult = await pool.query(`
      SELECT 
        po.*,
        s.name as supplier_name,
        s.rut as supplier_rut,
        s.email as supplier_email,
        s.phone as supplier_phone,
        s.address as supplier_address,
        s.city as supplier_city,
        s.region as supplier_region
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = $1
    `, [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });
    }

    // Obtener items de la orden
    const itemsResult = await pool.query(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY id',
      [id]
    );

    const order = orderResult.rows[0];
    order.items = itemsResult.rows;

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error obteniendo orden de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear nueva orden de compra
router.post('/', authenticateToken, [
  body('supplier_id').isInt(),
  body('date').isISO8601(),
  body('expected_delivery').isISO8601(),
  body('items').isArray({ min: 1 }),
  body('items.*.product_name').notEmpty().trim(),
  body('items.*.quantity').isFloat({ min: 0.01 }),
  body('items.*.unit_price').isFloat({ min: 0 }),
  body('notes').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { supplier_id, date, expected_delivery, items, notes } = req.body;

    // Verificar que el proveedor existe
    const supplierResult = await pool.query('SELECT id FROM suppliers WHERE id = $1', [supplier_id]);
    if (supplierResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Proveedor no encontrado' });
    }

    // Calcular totales
    let subtotal = 0;
    const processedItems = items.map((item: any) => {
      const total = item.quantity * item.unit_price;
      subtotal += total;
      return {
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: total
      };
    });

    const taxRate = 0.19; // IVA 19% en Chile
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Generar número de orden
    const orderNumber = await generateOrderNumber();

    // Crear orden de compra
    const orderResult = await pool.query(
      `INSERT INTO purchase_orders (order_number, supplier_id, date, expected_delivery, subtotal, tax, total, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [orderNumber, supplier_id, date, expected_delivery, subtotal, tax, total, 'draft', notes]
    );

    const order = orderResult.rows[0];

    // Crear items de la orden
    for (const item of processedItems) {
      await pool.query(
        `INSERT INTO purchase_order_items (purchase_order_id, product_name, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.id, item.product_name, item.quantity, item.unit_price, item.total]
      );
    }

    // Obtener orden completa con items
    const completeOrderResult = await pool.query(`
      SELECT 
        po.*,
        s.name as supplier_name,
        s.rut as supplier_rut,
        s.email as supplier_email,
        s.phone as supplier_phone,
        s.address as supplier_address,
        s.city as supplier_city,
        s.region as supplier_region
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = $1
    `, [order.id]);

    const itemsResult = await pool.query(
      'SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY id',
      [order.id]
    );

    const completeOrder = completeOrderResult.rows[0];
    completeOrder.items = itemsResult.rows;

    res.status(201).json({
      success: true,
      message: 'Orden de compra creada exitosamente',
      data: completeOrder
    });
  } catch (error) {
    console.error('Error creando orden de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar estado de orden de compra
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['draft', 'sent', 'confirmed', 'delivered', 'cancelled'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });
    }

    res.json({
      success: true,
      message: 'Estado de orden de compra actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando estado de orden de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de órdenes de compra
router.get('/stats/summary', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_orders,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        SUM(CASE WHEN status IN ('sent', 'confirmed', 'delivered') THEN total ELSE 0 END) as total_value
      FROM purchase_orders
    `);

    const monthlyStatsResult = await pool.query(`
      SELECT 
        EXTRACT(YEAR FROM date) as year,
        EXTRACT(MONTH FROM date) as month,
        COUNT(*) as orders_count,
        SUM(total) as total_value
      FROM purchase_orders
      WHERE date >= NOW() - INTERVAL '12 months'
      GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
      ORDER BY year DESC, month DESC
    `);

    res.json({
      success: true,
      data: {
        summary: statsResult.rows[0],
        monthly: monthlyStatsResult.rows
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
