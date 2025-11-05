import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';
import PDFDocument from 'pdfkit';
import { getCompanyConfig } from './settings-simple';
import { createAccountingEntryFromTransaction } from './accounting-simple';
import { addDocumentHistory } from './workflow-simple';
import { createNotification } from './notifications-simple';

const router = express.Router();

// Datos en memoria
let invoices = [
  {
    id: 1,
    invoice_number: 'FAC-2024-000001',
    client_id: 1,
    client_name: 'Juan Pérez',
    client_rut: '12.345.678-9',
    client_email: 'juan.perez@email.com',
    client_address: 'Av. Principal 123',
    client_city: 'Santiago',
    client_region: 'Región Metropolitana',
    client_phone: '+56 9 1234 5678',
    date: '2024-01-15',
    due_date: '2024-02-15',
    subtotal: 100000,
    tax: 19000,
    total: 119000,
    status: 'paid',
    notes: 'Factura pagada',
    payment_method: 'transferencia',
    payment_reference: 'TRF-001234',
    items: [
      {
        id: 1,
        description: 'Servicio de construcción',
        quantity: 1,
        unit_price: 100000,
        total: 100000
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    invoice_number: 'FAC-2024-000002',
    client_id: 2,
    client_name: 'María González',
    client_rut: '98.765.432-1',
    client_email: 'maria.gonzalez@email.com',
    client_address: 'Calle Secundaria 456',
    client_city: 'Valparaíso',
    client_region: 'Región de Valparaíso',
    client_phone: '+56 9 8765 4321',
    date: '2024-01-20',
    due_date: '2024-02-20',
    subtotal: 150000,
    tax: 28500,
    total: 178500,
    status: 'sent',
    notes: 'Factura pendiente de pago',
    payment_method: 'efectivo',
    payment_reference: '',
    items: [
      {
        id: 2,
        description: 'Reparación de techo',
        quantity: 1,
        unit_price: 150000,
        total: 150000
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  }
];

let clients = [
  {
    id: 1,
    rut: '12.345.678-9',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+56 9 1234 5678',
    address: 'Av. Principal 123',
    city: 'Santiago',
    region: 'Región Metropolitana',
    type: 'individual',
    status: 'active',
    notes: 'Cliente preferencial',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    rut: '98.765.432-1',
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+56 9 8765 4321',
    address: 'Calle Secundaria 456',
    city: 'Valparaíso',
    region: 'Región de Valparaíso',
    type: 'individual',
    status: 'potential',
    notes: 'Cliente potencial',
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Generar número de factura automático según norma chilena
const generateInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const count = invoices.length + 1;
  return `${count.toString().padStart(6, '0')}-${month}${year}`;
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

    let filteredInvoices = [...invoices];

    // Filtrar por estado
    if (status) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.status === status);
    }

    // Filtrar por cliente
    if (clientId) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.client_id === parseInt(clientId));
    }

    // Filtrar por fecha
    if (dateFrom) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.date >= dateFrom);
    }

    if (dateTo) {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.date <= dateTo);
    }

    const total = filteredInvoices.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedInvoices,
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
    const invoice = invoices.find(i => i.id === parseInt(id));
    
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

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
  body('notes').optional().isString(),
  body('payment_method').optional().isIn(['efectivo', 'transferencia', 'cheque', 'tarjeta']),
  body('payment_reference').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { client_id, date, due_date, items, notes, payment_method, payment_reference } = req.body;

    // Verificar que el cliente existe
    const client = clients.find(c => c.id === client_id);
    if (!client) {
      return res.status(400).json({ success: false, error: 'Cliente no encontrado' });
    }

    // Calcular totales
    let subtotal = 0;
    const processedItems = items.map((item: any, index: number) => {
      const total = item.quantity * item.unit_price;
      subtotal += total;
      return {
        id: invoices.length * 100 + index + 1,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: total
      };
    });

    const taxRate = 0.19; // IVA 19% en Chile
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Generar número de factura según norma chilena
    const invoiceNumber = generateInvoiceNumber();

    // Crear factura
    const newInvoice = {
      id: Math.max(...invoices.map(i => i.id)) + 1,
      invoice_number: invoiceNumber,
      client_id,
      client_name: client.name,
      client_rut: client.rut,
      client_email: client.email,
      client_address: client.address,
      client_city: client.city,
      client_region: client.region,
      client_phone: client.phone,
      date,
      due_date,
      subtotal,
      tax,
      total,
      status: 'draft',
      notes: notes || '',
      payment_method: payment_method || 'efectivo',
      payment_reference: payment_reference || '',
      items: processedItems,
      created_at: new Date(),
      updated_at: new Date()
    };

    invoices.push(newInvoice);

    // Crear asiento contable automático
    createAccountingEntryFromTransaction('invoice', newInvoice);

    // Agregar al historial
    const user = (req as any).user;
    addDocumentHistory('invoice', newInvoice.id, user.id, user.name, 'created');

    // Crear notificación si la factura está pagada
    if (newInvoice.status === 'paid') {
      createNotification(
        undefined, // Notificación global
        'success',
        'medium',
        'Factura Pagada',
        `La factura ${newInvoice.invoice_number} ha sido marcada como pagada`,
        `/invoices/${newInvoice.id}`,
        'Ver Factura'
      );
    }

    res.status(201).json({
      success: true,
      message: 'Factura creada exitosamente',
      data: newInvoice
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

    const invoiceIndex = invoices.findIndex(i => i.id === parseInt(id));
    if (invoiceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    const oldStatus = invoices[invoiceIndex].status;

    invoices[invoiceIndex] = {
      ...invoices[invoiceIndex],
      status,
      updated_at: new Date()
    };

    // Si cambió a pagada, crear asiento de pago y notificación
    if (status === 'paid' && oldStatus !== 'paid') {
      createAccountingEntryFromTransaction('invoice_payment', {
        invoice: invoices[invoiceIndex],
        payment: {
          id: Date.now(),
          date: new Date(),
          method: invoices[invoiceIndex].payment_method,
          reference: invoices[invoiceIndex].payment_reference
        }
      });

      createNotification(
        undefined,
        'success',
        'medium',
        'Factura Pagada',
        `La factura ${invoices[invoiceIndex].invoice_number} ha sido marcada como pagada`,
        `/invoices/${invoices[invoiceIndex].id}`,
        'Ver Factura'
      );
    }

    // Agregar al historial
    const user = (req as any).user;
    addDocumentHistory('invoice', parseInt(id), user.id, user.name, 'status_changed', {
      old_status: oldStatus,
      new_status: status
    });

    res.json({
      success: true,
      message: 'Estado de factura actualizado exitosamente',
      data: invoices[invoiceIndex]
    });
  } catch (error) {
    console.error('Error actualizando estado de factura:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generar PDF de factura según normas chilenas
router.get('/:id/pdf', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Obtener factura completa
    const invoice = invoices.find(i => i.id === parseInt(id));
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Factura no encontrada' });
    }

    // Obtener configuración de la empresa
    const company = getCompanyConfig();
    
    // Crear PDF según normas chilenas
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Factura ${invoice.invoice_number}`,
        Author: company.name,
        Subject: 'Factura de Venta',
        Creator: `Sistema ${company.name}`
      }
    });
    
    // Configurar headers HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${invoice.invoice_number}.pdf"`);
    
    doc.pipe(res);

    // Logo y nombre de la empresa (lado izquierdo)
    let yPos = 50;
    
    // Logo textual "KaiZenith" con tagline
    doc.fontSize(24)
       .fillColor('#8B6914') // Color dorado/bronce
       .text('KaiZenith', 50, yPos);
    
    doc.fontSize(8)
       .fillColor('#8B6914')
       .text('REACH THE SUMMIT', 50, yPos + 25);
    
    // Restaurar color negro
    doc.fillColor('#000000');
    
    // Información de la empresa
    yPos = 90;
    doc.fontSize(12).text(`${company.name}`, 50, yPos);
    doc.fontSize(10).text(`RUT: ${company.rut}`, 50, yPos + 15);
    doc.text(`Dirección: ${company.address}`, 50, yPos + 28);
    doc.text(`Teléfono: ${company.phone}`, 50, yPos + 41);
    doc.text(`Email: ${company.email}`, 50, yPos + 54);
    
    // Servicios de la empresa
    if (company.business_type) {
      doc.fontSize(9).text(company.business_type, 50, yPos + 67);
    }

    // Información de la factura (lado derecho)
    yPos = 50;
    doc.fontSize(18)
       .fillColor('#000000')
       .text('FACTURA', 400, yPos);
    doc.fontSize(11).text(`N° ${invoice.invoice_number}`, 400, yPos + 22);
    doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString('es-CL')}`, 400, yPos + 35);
    doc.text(`Vencimiento: ${new Date(invoice.due_date).toLocaleDateString('es-CL')}`, 400, yPos + 48);
    doc.text(`Estado: ${invoice.status.toUpperCase()}`, 400, yPos + 61);

    // Información del cliente
    yPos = 180;
    doc.fontSize(13)
       .fillColor('#000000')
       .text('Cliente:', 50, yPos);
    doc.fontSize(11).text(invoice.client_name, 50, yPos + 18);
    doc.text(`RUT: ${invoice.client_rut}`, 50, yPos + 31);
    doc.text(invoice.client_address, 50, yPos + 44);
    doc.text(`${invoice.client_city}, ${invoice.client_region}`, 50, yPos + 57);
    doc.text(`Teléfono: ${invoice.client_phone}`, 50, yPos + 70);

    // Tabla de items (según formato chileno)
    let yPosition = 270;
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

    // Totales (formato chileno)
    yPosition += 20;
    doc.text('Subtotal:', 400, yPosition);
    doc.text(`$${invoice.subtotal.toLocaleString('es-CL')}`, 500, yPosition);
    
    yPosition += 20;
    doc.text('IVA (19%):', 400, yPosition);
    doc.text(`$${invoice.tax.toLocaleString('es-CL')}`, 500, yPosition);
    
    yPosition += 20;
    doc.fontSize(14).text('TOTAL:', 400, yPosition);
    doc.text(`$${invoice.total.toLocaleString('es-CL')}`, 500, yPosition);

    // Información de pago
    yPosition += 40;
    doc.fontSize(12).text('Información de Pago:', 50, yPosition);
    doc.text(`Método: ${invoice.payment_method}`, 50, yPosition + 20);
    if (invoice.payment_reference) {
      doc.text(`Referencia: ${invoice.payment_reference}`, 50, yPosition + 35);
    }

    // Notas
    if (invoice.notes) {
      yPosition += 60;
      doc.fontSize(12).text('Notas:', 50, yPosition);
      doc.text(invoice.notes, 50, yPosition + 20);
    }

    // Pie de página (normas chilenas)
    yPosition = 750;
    doc.fontSize(10).text('Esta factura cumple con las normas tributarias chilenas', 50, yPosition);
    doc.text('Documento generado electrónicamente', 50, yPosition + 15);

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

export default router;
