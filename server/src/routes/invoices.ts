import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { pool } from '../index';
import { authenticateToken } from './auth';
import { Invoice, InvoiceItem } from '../types';
import PDFDocument from 'pdfkit';

const router = express.Router();

// Generar número de factura automático
const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const result = await pool.query(
    'SELECT COUNT(*) FROM invoices WHERE EXTRACT(YEAR FROM date) = $1',
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `FAC-${year}-${count.toString().padStart(6, '0')}`;
};

// Obtener todas las facturas con paginación
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
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
      whereClause += ` AND i.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (clientId) {
      whereClause += ` AND i.client_id = $${paramIndex}`;
      queryParams.push(clientId);
      paramIndex++;
    }

    if (dateFrom) {
      whereClause += ` AND i.date >= $${paramIndex}`;
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND i.date <= $${paramIndex}`;
      queryParams.push(dateTo);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Obtener facturas con información del cliente
    const dataQuery = `
      SELECT 
        i.*,
        c.name as client_name,
        c.rut as client_rut,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        c.region as client_region
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ${whereClause}
      ORDER BY i.created_at DESC 
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
    console.error('Error obteniendo facturas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener factura por ID con items
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Obtener factura con cliente
    const invoiceResult = await pool.query(`
      SELECT 
        i.*,
        c.name as client_name,
        c.rut as client_rut,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        c.region as client_region,
        c.phone as client_phone
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `, [id]);
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    // Obtener items de la factura
    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id',
      [id]
    );

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error obteniendo factura:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear nueva factura
router.post('/', authenticateToken, [
  body('client_id').isInt(),
  body('date').isISO8601(),
  body('due_date').isISO8601(),
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

    const { client_id, date, due_date, items, notes } = req.body;

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

    // Generar número de factura
    const invoiceNumber = await generateInvoiceNumber();

    // Crear factura
    const invoiceResult = await pool.query(
      `INSERT INTO invoices (invoice_number, client_id, date, due_date, subtotal, tax, total, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [invoiceNumber, client_id, date, due_date, subtotal, tax, total, 'draft', notes]
    );

    const invoice = invoiceResult.rows[0];

    // Crear items de la factura
    for (const item of processedItems) {
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoice.id, item.description, item.quantity, item.unit_price, item.total]
      );
    }

    // Obtener factura completa con items
    const completeInvoiceResult = await pool.query(`
      SELECT 
        i.*,
        c.name as client_name,
        c.rut as client_rut,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        c.region as client_region,
        c.phone as client_phone
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `, [invoice.id]);

    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id',
      [invoice.id]
    );

    const completeInvoice = completeInvoiceResult.rows[0];
    completeInvoice.items = itemsResult.rows;

    res.status(201).json({
      success: true,
      message: 'Factura creada exitosamente',
      data: completeInvoice
    });
  } catch (error) {
    console.error('Error creando factura:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar estado de factura
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    res.json({
      success: true,
      message: 'Estado de factura actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando estado de factura:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generar PDF de factura
router.get('/:id/pdf', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Obtener factura completa
    const invoiceResult = await pool.query(`
      SELECT 
        i.*,
        c.name as client_name,
        c.rut as client_rut,
        c.email as client_email,
        c.address as client_address,
        c.city as client_city,
        c.region as client_region,
        c.phone as client_phone
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = $1
    `, [id]);
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id',
      [id]
    );

    const invoice = invoiceResult.rows[0];
    invoice.items = itemsResult.rows;

    // Crear PDF
    const doc = new PDFDocument({ margin: 50 });
    
    // Configurar headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${invoice.invoice_number}.pdf"`);
    
    doc.pipe(res);

    // Información de la empresa
    doc.fontSize(20).text(process.env.COMPANY_NAME || 'Patolin Construction', 50, 50);
    doc.fontSize(12).text(`RUT: ${process.env.COMPANY_RUT || '12.345.678-9'}`, 50, 80);
    doc.text(`Dirección: ${process.env.COMPANY_ADDRESS || 'Dirección de la empresa'}`, 50, 95);
    doc.text(`Teléfono: ${process.env.COMPANY_PHONE || '+56 9 1234 5678'}`, 50, 110);
    doc.text(`Email: ${process.env.COMPANY_EMAIL || 'contacto@patolin.cl'}`, 50, 125);

    // Información del cliente
    doc.fontSize(16).text('FACTURA', 400, 50);
    doc.fontSize(12).text(`N° ${invoice.invoice_number}`, 400, 70);
    doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString('es-CL')}`, 400, 85);
    doc.text(`Vencimiento: ${new Date(invoice.due_date).toLocaleDateString('es-CL')}`, 400, 100);

    doc.fontSize(14).text('Cliente:', 50, 160);
    doc.fontSize(12).text(invoice.client_name, 50, 180);
    doc.text(`RUT: ${invoice.client_rut}`, 50, 195);
    doc.text(invoice.client_address, 50, 210);
    doc.text(`${invoice.client_city}, ${invoice.client_region}`, 50, 225);

    // Tabla de items
    let yPosition = 280;
    doc.fontSize(12).text('Descripción', 50, yPosition);
    doc.text('Cantidad', 300, yPosition);
    doc.text('Precio Unit.', 400, yPosition);
    doc.text('Total', 500, yPosition);

    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    invoice.items.forEach((item: any) => {
      yPosition += 20;
      doc.text(item.description, 50, yPosition);
      doc.text(item.quantity.toString(), 300, yPosition);
      doc.text(`$${item.unit_price.toLocaleString('es-CL')}`, 400, yPosition);
      doc.text(`$${item.total.toLocaleString('es-CL')}`, 500, yPosition);
    });

    yPosition += 30;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    // Totales
    yPosition += 20;
    doc.text('Subtotal:', 400, yPosition);
    doc.text(`$${invoice.subtotal.toLocaleString('es-CL')}`, 500, yPosition);
    
    yPosition += 20;
    doc.text('IVA (19%):', 400, yPosition);
    doc.text(`$${invoice.tax.toLocaleString('es-CL')}`, 500, yPosition);
    
    yPosition += 20;
    doc.fontSize(14).text('TOTAL:', 400, yPosition);
    doc.text(`$${invoice.total.toLocaleString('es-CL')}`, 500, yPosition);

    // Notas
    if (invoice.notes) {
      yPosition += 40;
      doc.fontSize(12).text('Notas:', 50, yPosition);
      doc.text(invoice.notes, 50, yPosition + 20);
    }

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

export default router;
