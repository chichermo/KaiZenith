import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';
import PDFDocument from 'pdfkit';
import { getCompanyConfig } from './settings-simple';
import { addDocumentHistory, isDocumentApproved } from './workflow-simple';
import axios from 'axios';

const router = express.Router();

// Datos en memoria
let purchaseOrders = [
  {
    id: 1,
    order_number: 'OC-2024-000001',
    supplier_id: 1,
    supplier_name: 'Materiales Santiago S.A.',
    supplier_rut: '76.123.456-7',
    supplier_email: 'ventas@materialessantiago.cl',
    supplier_address: 'Av. Industrial 1234',
    supplier_city: 'Santiago',
    supplier_region: 'Región Metropolitana',
    supplier_phone: '+56 2 2345 6789',
    date: '2024-01-15',
    delivery_date: '2024-01-25',
    subtotal: 500000,
    tax: 95000,
    total: 595000,
    status: 'pending',
    notes: 'Materiales para proyecto residencial',
    items: [
      {
        id: 1,
        description: 'Cemento Portland 25kg',
        quantity: 100,
        unit_price: 2500,
        total: 250000,
        unit: 'bolsas'
      },
      {
        id: 2,
        description: 'Arena gruesa',
        quantity: 10,
        unit_price: 15000,
        total: 150000,
        unit: 'm3'
      },
      {
        id: 3,
        description: 'Grava 1/2"',
        quantity: 8,
        unit_price: 12500,
        total: 100000,
        unit: 'm3'
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    order_number: 'OC-2024-000002',
    supplier_id: 2,
    supplier_name: 'Ferretería Central',
    supplier_rut: '98.765.432-1',
    supplier_email: 'compras@ferreteriacentral.cl',
    supplier_address: 'Calle Comercial 567',
    supplier_city: 'Valparaíso',
    supplier_region: 'Región de Valparaíso',
    supplier_phone: '+56 32 1234 5678',
    date: '2024-01-20',
    delivery_date: '2024-01-30',
    subtotal: 200000,
    tax: 38000,
    total: 238000,
    status: 'delivered',
    notes: 'Herramientas y accesorios',
    items: [
      {
        id: 4,
        description: 'Martillo demoledor',
        quantity: 2,
        unit_price: 80000,
        total: 160000,
        unit: 'unidades'
      },
      {
        id: 5,
        description: 'Taladro percutor',
        quantity: 1,
        unit_price: 40000,
        total: 40000,
        unit: 'unidades'
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  }
];

let suppliers = [
  {
    id: 1,
    rut: '76.123.456-7',
    name: 'Materiales Santiago S.A.',
    email: 'ventas@materialessantiago.cl',
    phone: '+56 2 2345 6789',
    address: 'Av. Industrial 1234',
    city: 'Santiago',
    region: 'Región Metropolitana',
    type: 'materials',
    status: 'active',
    notes: 'Proveedor de materiales de construcción',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    rut: '98.765.432-1',
    name: 'Ferretería Central',
    email: 'compras@ferreteriacentral.cl',
    phone: '+56 32 1234 5678',
    address: 'Calle Comercial 567',
    city: 'Valparaíso',
    region: 'Región de Valparaíso',
    type: 'tools',
    status: 'active',
    notes: 'Proveedor de herramientas',
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Generar número de orden de compra automático
const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const count = purchaseOrders.length + 1;
  return `OC-${count.toString().padStart(6, '0')}-${month}${year}`;
};

// Obtener todas las órdenes de compra con paginación
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'approved', 'ordered', 'delivered', 'cancelled']),
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

    let filteredOrders = [...purchaseOrders];

    // Filtrar por estado
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    // Filtrar por proveedor
    if (supplierId) {
      filteredOrders = filteredOrders.filter(order => order.supplier_id === parseInt(supplierId));
    }

    // Filtrar por fecha
    if (dateFrom) {
      filteredOrders = filteredOrders.filter(order => order.date >= dateFrom);
    }

    if (dateTo) {
      filteredOrders = filteredOrders.filter(order => order.date <= dateTo);
    }

    const total = filteredOrders.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedOrders,
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

// Obtener orden de compra por ID
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const order = purchaseOrders.find(o => o.id === parseInt(id));
    
    if (!order) {
      return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });
    }

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
  body('delivery_date').isISO8601(),
  body('items').isArray({ min: 1 }),
  body('items.*.description').notEmpty().trim(),
  body('items.*.quantity').isFloat({ min: 0.01 }),
  body('items.*.unit_price').isFloat({ min: 0 }),
  body('items.*.unit').notEmpty().trim(),
  body('notes').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { supplier_id, date, delivery_date, items, notes } = req.body;

    // Verificar que el proveedor existe
    const supplier = suppliers.find(s => s.id === supplier_id);
    if (!supplier) {
      return res.status(400).json({ success: false, error: 'Proveedor no encontrado' });
    }

    // Calcular totales
    let subtotal = 0;
    const processedItems = items.map((item: any, index: number) => {
      const total = item.quantity * item.unit_price;
      subtotal += total;
      return {
        id: purchaseOrders.length * 100 + index + 1,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: total,
        unit: item.unit
      };
    });

    const taxRate = 0.19; // IVA 19% en Chile
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Generar número de orden
    const orderNumber = generateOrderNumber();

    // Crear orden de compra
    const newOrder = {
      id: Math.max(...purchaseOrders.map(o => o.id)) + 1,
      order_number: orderNumber,
      supplier_id,
      supplier_name: supplier.name,
      supplier_rut: supplier.rut,
      supplier_email: supplier.email,
      supplier_address: supplier.address,
      supplier_city: supplier.city,
      supplier_region: supplier.region,
      supplier_phone: supplier.phone,
      date,
      delivery_date,
      subtotal,
      tax,
      total,
      status: 'pending',
      notes: notes || '',
      items: processedItems,
      created_at: new Date(),
      updated_at: new Date()
    };

    purchaseOrders.push(newOrder);

    // Agregar al historial
    const user = (req as any).user;
    addDocumentHistory('purchase_order', newOrder.id, user.id, user.name, 'created');

    // Crear solicitud de aprobación si es necesario
    try {
      const workflowResponse = await axios.post(
        `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/workflow/approval`,
        {
          document_type: 'purchase_order',
          document_id: newOrder.id,
          amount: total
        },
        {
          headers: {
            Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}`
          }
        }
      );

      if (workflowResponse.data.data.approved) {
        newOrder.status = 'approved';
        purchaseOrders[purchaseOrders.length - 1] = newOrder;
      }
    } catch (error) {
      console.log('Workflow no disponible o no requiere aprobación');
    }

    res.status(201).json({
      success: true,
      message: 'Orden de compra creada exitosamente',
      data: newOrder
    });
  } catch (error) {
    console.error('Error creando orden de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar estado de orden de compra
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'approved', 'ordered', 'delivered', 'cancelled'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const orderIndex = purchaseOrders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });
    }

    const oldStatus = purchaseOrders[orderIndex].status;
    const user = (req as any).user;

    purchaseOrders[orderIndex] = {
      ...purchaseOrders[orderIndex],
      status,
      updated_at: new Date()
    };

    // Agregar al historial
    addDocumentHistory('purchase_order', parseInt(id), user.id, user.name, 'status_changed', {
      old_status: oldStatus,
      new_status: status
    });

    res.json({
      success: true,
      message: 'Estado de orden de compra actualizado exitosamente',
      data: purchaseOrders[orderIndex]
    });
  } catch (error) {
    console.error('Error actualizando estado de orden de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generar PDF de orden de compra
router.get('/:id/pdf', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Obtener orden de compra completa
    const order = purchaseOrders.find(o => o.id === parseInt(id));
    if (!order) {
      return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });
    }

    // Obtener configuración de la empresa
    const company = getCompanyConfig();

    // Crear PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Orden de Compra ${order.order_number}`,
        Author: company.name,
        Subject: 'Orden de Compra',
        Creator: `Sistema ${company.name}`
      }
    });
    
    // Configurar headers HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="orden-compra-${order.order_number}.pdf"`);
    
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

    // Información de la orden (lado derecho)
    yPos = 50;
    doc.fontSize(18)
       .fillColor('#000000')
       .text('ORDEN DE COMPRA', 400, yPos);
    doc.fontSize(11).text(`N° ${order.order_number}`, 400, yPos + 22);
    doc.text(`Fecha: ${new Date(order.date).toLocaleDateString('es-CL')}`, 400, yPos + 35);
    doc.text(`Entrega: ${new Date(order.delivery_date).toLocaleDateString('es-CL')}`, 400, yPos + 48);
    doc.text(`Estado: ${order.status.toUpperCase()}`, 400, yPos + 61);

    // Información del proveedor
    yPos = 180;
    doc.fontSize(13)
       .fillColor('#000000')
       .text('Proveedor:', 50, yPos);
    doc.fontSize(11).text(order.supplier_name, 50, yPos + 18);
    doc.text(`RUT: ${order.supplier_rut}`, 50, yPos + 31);
    doc.text(order.supplier_address, 50, yPos + 44);
    doc.text(`${order.supplier_city}, ${order.supplier_region}`, 50, yPos + 57);
    doc.text(`Teléfono: ${order.supplier_phone}`, 50, yPos + 70);

    // Tabla de items
    let yPosition = 270;
    doc.fontSize(12).text('Descripción', 50, yPosition);
    doc.text('Cantidad', 300, yPosition);
    doc.text('Unidad', 350, yPosition);
    doc.text('Precio Unit.', 400, yPosition);
    doc.text('Total', 500, yPosition);

    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    order.items.forEach((item: any) => {
      yPosition += 20;
      doc.text(item.description, 50, yPosition);
      doc.text(item.quantity.toString(), 300, yPosition);
      doc.text(item.unit, 350, yPosition);
      doc.text(`$${item.unit_price.toLocaleString('es-CL')}`, 400, yPosition);
      doc.text(`$${item.total.toLocaleString('es-CL')}`, 500, yPosition);
    });

    yPosition += 30;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    // Totales
    yPosition += 20;
    doc.text('Subtotal:', 400, yPosition);
    doc.text(`$${order.subtotal.toLocaleString('es-CL')}`, 500, yPosition);
    
    yPosition += 20;
    doc.text('IVA (19%):', 400, yPosition);
    doc.text(`$${order.tax.toLocaleString('es-CL')}`, 500, yPosition);
    
    yPosition += 20;
    doc.fontSize(14).text('TOTAL:', 400, yPosition);
    doc.text(`$${order.total.toLocaleString('es-CL')}`, 500, yPosition);

    // Notas
    if (order.notes) {
      yPosition += 40;
      doc.fontSize(12).text('Notas:', 50, yPosition);
      doc.text(order.notes, 50, yPosition + 20);
    }

    // Pie de página
    yPosition = 750;
    doc.fontSize(10).text('Esta orden de compra es válida por 30 días', 50, yPosition);
    doc.text('Documento generado electrónicamente', 50, yPosition + 15);

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

export default router;
