import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { pool } from '../index';
import { authenticateToken } from './auth';
import { Quotation, QuotationItem } from '../types';

const router = express.Router();

// Generar número de cotización automático
const generateQuotationNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const result = await pool.query(
    'SELECT COUNT(*) FROM quotations WHERE EXTRACT(YEAR FROM date) = $1',
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `COT-${year}-${count.toString().padStart(6, '0')}`;
};

// Obtener todas las cotizaciones con paginación
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'sent', 'accepted', 'rejected', 'expired']),
  query('client_id').optional().isInt(),
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
    const clientId = req.query.client_id as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND q.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (clientId) {
      whereClause += ` AND q.client_id = $${paramIndex}`;
      queryParams.push(clientId);
      paramIndex++;
    }

    if (dateFrom) {
      whereClause += ` AND q.date >= $${paramIndex}`;
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND q.date <= $${paramIndex}`;
      queryParams.push(dateTo);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Obtener cotizaciones con información del cliente
    const dataQuery = `
      SELECT 
        q.*,
        c.name as client_name,
        c.rut as client_rut,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        c.region as client_region
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      ${whereClause}
      ORDER BY q.created_at DESC 
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
    console.error('Error obteniendo cotizaciones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener cotización por ID con items
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Obtener cotización con cliente
    const quotationResult = await pool.query(`
      SELECT 
        q.*,
        c.name as client_name,
        c.rut as client_rut,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        c.region as client_region,
        c.phone as client_phone
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      WHERE q.id = $1
    `, [id]);
    
    if (quotationResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    // Obtener items de la cotización
    const itemsResult = await pool.query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id',
      [id]
    );

    const quotation = quotationResult.rows[0];
    quotation.items = itemsResult.rows;

    res.json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error obteniendo cotización:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear nueva cotización
router.post('/', authenticateToken, [
  body('client_id').isInt(),
  body('date').isISO8601(),
  body('valid_until').isISO8601(),
  body('items').isArray({ min: 1 }),
  body('items.*.description').notEmpty().trim(),
  body('items.*.quantity').isFloat({ min: 0.01 }),
  body('items.*.unit_price').isFloat({ min: 0 }),
  body('notes').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { client_id, date, valid_until, items, notes } = req.body;

    // Verificar que el cliente existe
    const clientResult = await pool.query('SELECT id FROM clients WHERE id = $1', [client_id]);
    if (clientResult.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Cliente no encontrado' });
    }

    // Calcular totales
    let subtotal = 0;
    const processedItems = items.map((item: any) => {
      const total = item.quantity * item.unit_price;
      subtotal += total;
      return {
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: total
      };
    });

    const taxRate = 0.19; // IVA 19% en Chile
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Generar número de cotización
    const quotationNumber = await generateQuotationNumber();

    // Crear cotización
    const quotationResult = await pool.query(
      `INSERT INTO quotations (quotation_number, client_id, date, valid_until, subtotal, tax, total, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [quotationNumber, client_id, date, valid_until, subtotal, tax, total, 'draft', notes]
    );

    const quotation = quotationResult.rows[0];

    // Crear items de la cotización
    for (const item of processedItems) {
      await pool.query(
        `INSERT INTO quotation_items (quotation_id, description, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [quotation.id, item.description, item.quantity, item.unit_price, item.total]
      );
    }

    // Obtener cotización completa con items
    const completeQuotationResult = await pool.query(`
      SELECT 
        q.*,
        c.name as client_name,
        c.rut as client_rut,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        c.region as client_region,
        c.phone as client_phone
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      WHERE q.id = $1
    `, [quotation.id]);

    const itemsResult = await pool.query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id',
      [quotation.id]
    );

    const completeQuotation = completeQuotationResult.rows[0];
    completeQuotation.items = itemsResult.rows;

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: completeQuotation
    });
  } catch (error) {
    console.error('Error creando cotización:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar estado de cotización
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['draft', 'sent', 'accepted', 'rejected', 'expired'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE quotations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    res.json({
      success: true,
      message: 'Estado de cotización actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando estado de cotización:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Convertir cotización a factura
router.post('/:id/convert-to-invoice', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Obtener cotización completa
    const quotationResult = await pool.query(`
      SELECT 
        q.*,
        c.name as client_name,
        c.rut as client_rut,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        c.region as client_region,
        c.phone as client_phone
      FROM quotations q
      LEFT JOIN clients c ON q.client_id = c.id
      WHERE q.id = $1
    `, [id]);
    
    if (quotationResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    const quotation = quotationResult.rows[0];

    // Verificar que la cotización esté aceptada
    if (quotation.status !== 'accepted') {
      return res.status(400).json({ 
        success: false, 
        error: 'Solo se pueden convertir cotizaciones aceptadas a factura' 
      });
    }

    // Obtener items de la cotización
    const itemsResult = await pool.query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY id',
      [id]
    );

    // Generar número de factura
    const year = new Date().getFullYear();
    const invoiceCountResult = await pool.query(
      'SELECT COUNT(*) FROM invoices WHERE EXTRACT(YEAR FROM date) = $1',
      [year]
    );
    const invoiceCount = parseInt(invoiceCountResult.rows[0].count) + 1;
    const invoiceNumber = `FAC-${year}-${invoiceCount.toString().padStart(6, '0')}`;

    // Crear factura
    const invoiceResult = await pool.query(
      `INSERT INTO invoices (invoice_number, client_id, date, due_date, subtotal, tax, total, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        invoiceNumber,
        quotation.client_id,
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        quotation.subtotal,
        quotation.tax,
        quotation.total,
        'draft',
        `Factura generada desde cotización ${quotation.quotation_number}`
      ]
    );

    const invoice = invoiceResult.rows[0];

    // Crear items de la factura
    for (const item of itemsResult.rows) {
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoice.id, item.description, item.quantity, item.unit_price, item.total]
      );
    }

    // Actualizar estado de la cotización
    await pool.query(
      'UPDATE quotations SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', id]
    );

    res.json({
      success: true,
      message: 'Cotización convertida a factura exitosamente',
      data: {
        quotation_id: quotation.id,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number
      }
    });
  } catch (error) {
    console.error('Error convirtiendo cotización a factura:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de cotizaciones
router.get('/stats/summary', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_quotations,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_quotations,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_quotations,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotations,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_quotations,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_quotations,
        SUM(CASE WHEN status = 'accepted' THEN total ELSE 0 END) as accepted_value,
        SUM(total) as total_value
      FROM quotations
    `);

    const conversionRateResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(*) as total
      FROM quotations
      WHERE status IN ('accepted', 'rejected')
    `);

    const conversionRate = conversionRateResult.rows[0].total > 0 
      ? (conversionRateResult.rows[0].accepted / conversionRateResult.rows[0].total) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        summary: statsResult.rows[0],
        conversion_rate: Math.round(conversionRate * 100) / 100
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
