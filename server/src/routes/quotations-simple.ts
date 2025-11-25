import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';
import PDFDocument from 'pdfkit';
import { getCompanyConfig } from './settings-simple';
import { addDocumentHistory, isDocumentApproved } from './workflow-simple';
import axios from 'axios';

const router = express.Router();

// Datos en memoria
let quotations = [
  {
    id: 1,
    quotation_number: 'COT-2024-000001',
    client_id: 1,
    client_name: 'Juan Pérez',
    client_rut: '12.345.678-9',
    client_email: 'juan.perez@email.com',
    client_address: 'Av. Principal 123',
    client_city: 'Santiago',
    client_region: 'Región Metropolitana',
    client_phone: '+56 9 1234 5678',
    date: '2024-01-15',
    valid_until: '2024-02-15',
    subtotal: 800000,
    tax: 152000,
    total: 952000,
    status: 'sent',
    notes: 'Cotización para remodelación de cocina',
    items: [
      {
        id: 1,
        description: 'Demolición y preparación de área',
        quantity: 1,
        unit_price: 150000,
        total: 150000,
        unit: 'proyecto'
      },
      {
        id: 2,
        description: 'Instalación de cerámicas',
        quantity: 25,
        unit_price: 8000,
        total: 200000,
        unit: 'm2'
      },
      {
        id: 3,
        description: 'Instalación de muebles de cocina',
        quantity: 1,
        unit_price: 450000,
        total: 450000,
        unit: 'juego'
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    quotation_number: 'COT-2024-000002',
    client_id: 2,
    client_name: 'María González',
    client_rut: '98.765.432-1',
    client_email: 'maria.gonzalez@email.com',
    client_address: 'Calle Secundaria 456',
    client_city: 'Valparaíso',
    client_region: 'Región de Valparaíso',
    client_phone: '+56 9 8765 4321',
    date: '2024-01-20',
    valid_until: '2024-02-20',
    subtotal: 300000,
    tax: 57000,
    total: 357000,
    status: 'approved',
    notes: 'Reparación de techo y pintura',
    items: [
      {
        id: 4,
        description: 'Reparación de techo',
        quantity: 1,
        unit_price: 200000,
        total: 200000,
        unit: 'proyecto'
      },
      {
        id: 5,
        description: 'Pintura interior',
        quantity: 80,
        unit_price: 1250,
        total: 100000,
        unit: 'm2'
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

// Generar número de cotización automático
const generateQuotationNumber = (): string => {
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const count = quotations.length + 1;
  return `COT-${count.toString().padStart(6, '0')}-${month}${year}`;
};

// Obtener todas las cotizaciones con paginación
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['draft', 'sent', 'approved', 'rejected', 'expired']),
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

    let filteredQuotations = [...quotations];

    // Filtrar por estado
    if (status) {
      filteredQuotations = filteredQuotations.filter(quotation => quotation.status === status);
    }

    // Filtrar por cliente
    if (clientId) {
      filteredQuotations = filteredQuotations.filter(quotation => quotation.client_id === parseInt(clientId));
    }

    // Filtrar por fecha
    if (dateFrom) {
      filteredQuotations = filteredQuotations.filter(quotation => quotation.date >= dateFrom);
    }

    if (dateTo) {
      filteredQuotations = filteredQuotations.filter(quotation => quotation.date <= dateTo);
    }

    const total = filteredQuotations.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuotations = filteredQuotations.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedQuotations,
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

// Obtener cotización por ID
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const quotation = quotations.find(q => q.id === parseInt(id));
    
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

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
  body('items.*.unit').notEmpty().trim(),
  body('notes').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { 
      client_id, 
      date, 
      valid_until, 
      delivery_date,
      items, 
      notes,
      labor_cost = 0,
      margin_percentage = 3,
      payment_terms,
      partidas
    } = req.body;

    // Verificar que el cliente existe
    const client = clients.find(c => c.id === client_id);
    if (!client) {
      return res.status(400).json({ success: false, error: 'Cliente no encontrado' });
    }

    // Procesar items
    const processedItems = items.map((item: any, index: number) => {
      const total = item.quantity * item.unit_price;
      return {
        id: quotations.length * 100 + index + 1,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: total,
        unit: item.unit,
        partida: item.partida || null
      };
    });

    // Calcular totales
    const materialsTotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    const laborCost = labor_cost || 0;
    const marginPct = margin_percentage || 3;
    const subtotal = materialsTotal + laborCost;
    const marginAmount = subtotal * (marginPct / 100);
    const netTotal = subtotal + marginAmount;
    const taxRate = 0.19; // IVA 19% en Chile
    const tax = netTotal * taxRate;
    const total = netTotal + tax;

    // Generar número de cotización
    const quotationNumber = generateQuotationNumber();

    // Crear cotización
    const newQuotation = {
      id: Math.max(...quotations.map(q => q.id), 0) + 1,
      quotation_number: quotationNumber,
      client_id,
      client_name: client.name,
      client_rut: client.rut,
      client_email: client.email,
      client_address: client.address,
      client_city: client.city,
      client_region: client.region,
      client_phone: client.phone,
      date,
      valid_until,
      delivery_date: delivery_date || null,
      materials_total: materialsTotal,
      labor_cost: laborCost,
      margin_percentage: marginPct,
      subtotal,
      margin_amount: marginAmount,
      net_total: netTotal,
      tax,
      total,
      status: 'draft',
      notes: notes || '',
      payment_terms: payment_terms || '',
      items: processedItems,
      partidas: partidas || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    quotations.push(newQuotation);

    // Agregar al historial
    const user = (req as any).user;
    addDocumentHistory('quotation', newQuotation.id, user.id, user.name, 'created');

    // Crear solicitud de aprobación si es necesario
    try {
      const workflowResponse = await axios.post(
        `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/workflow/approval`,
        {
          document_type: 'quotation',
          document_id: newQuotation.id,
          amount: total
        },
        {
          headers: {
            Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}`
          }
        }
      );

      if (workflowResponse.data.data.approved) {
        newQuotation.status = 'approved';
        quotations[quotations.length - 1] = newQuotation;
      }
    } catch (error) {
      console.log('Workflow no disponible o no requiere aprobación');
    }

    res.status(201).json({
      success: true,
      message: 'Cotización creada exitosamente',
      data: newQuotation
    });
  } catch (error) {
    console.error('Error creando cotización:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar estado de cotización
router.patch('/:id/status', authenticateToken, [
  body('status').isIn(['draft', 'sent', 'approved', 'rejected', 'expired'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Estado inválido' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const quotationIndex = quotations.findIndex(q => q.id === parseInt(id));
    if (quotationIndex === -1) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    const oldStatus = quotations[quotationIndex].status;
    const user = (req as any).user;

    quotations[quotationIndex] = {
      ...quotations[quotationIndex],
      status,
      updated_at: new Date()
    };

    // Agregar al historial
    addDocumentHistory('quotation', parseInt(id), user.id, user.name, 'status_changed', {
      old_status: oldStatus,
      new_status: status
    });

    res.json({
      success: true,
      message: 'Estado de cotización actualizado exitosamente',
      data: quotations[quotationIndex]
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
    const quotation = quotations.find(q => q.id === parseInt(id));
    
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    if (quotation.status !== 'approved') {
      return res.status(400).json({ success: false, error: 'Solo se pueden convertir cotizaciones aprobadas' });
    }

    // Aquí se crearía la factura basada en la cotización
    // Por ahora retornamos un mensaje de éxito
    res.json({
      success: true,
      message: 'Cotización convertida a factura exitosamente',
      data: {
        quotation_id: quotation.id,
        invoice_id: quotation.id + 1000 // ID simulado de la factura creada
      }
    });
  } catch (error) {
    console.error('Error convirtiendo cotización a factura:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generar PDF de cotización
router.get('/:id/pdf', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Obtener cotización completa
    const quotation = quotations.find(q => q.id === parseInt(id));
    if (!quotation) {
      return res.status(404).json({ success: false, error: 'Cotización no encontrada' });
    }

    // Obtener configuración de la empresa
    const company = getCompanyConfig();

    // Crear PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Cotización ${quotation.quotation_number}`,
        Author: company.name,
        Subject: 'Cotización de Servicios',
        Creator: `Sistema ${company.name}`
      }
    });
    
    // Configurar headers HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="cotizacion-${quotation.quotation_number}.pdf"`);
    
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

    // Información de la cotización (lado derecho)
    yPos = 50;
    doc.fontSize(18)
       .fillColor('#000000')
       .text('COTIZACIÓN CLIENTE', 400, yPos);
    doc.fontSize(11).text(`N° ${quotation.quotation_number}`, 400, yPos + 22);
    doc.text(`Fecha: ${new Date(quotation.date).toLocaleDateString('es-CL')}`, 400, yPos + 35);
    doc.text(`Válida hasta: ${new Date(quotation.valid_until).toLocaleDateString('es-CL')}`, 400, yPos + 48);
    doc.text(`Estado: ${quotation.status.toUpperCase()}`, 400, yPos + 61);

    // Información del cliente
    yPos = 180;
    doc.fontSize(13)
       .fillColor('#000000')
       .text('Cliente:', 50, yPos);
    doc.fontSize(11).text(quotation.client_name, 50, yPos + 18);
    doc.text(`RUT: ${quotation.client_rut}`, 50, yPos + 31);
    doc.text(quotation.client_address, 50, yPos + 44);
    doc.text(`${quotation.client_city}, ${quotation.client_region}`, 50, yPos + 57);
    doc.text(`Teléfono: ${quotation.client_phone}`, 50, yPos + 70);

    // Tabla de items
    let yPosition = 270;
    doc.fontSize(12).text('Descripción', 50, yPosition);
    doc.text('Cantidad', 300, yPosition);
    doc.text('Unidad', 350, yPosition);
    doc.text('Precio Unit.', 400, yPosition);
    doc.text('Total', 500, yPosition);

    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    quotation.items.forEach((item: any) => {
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
    const materialsTotal = quotation.materials_total || quotation.subtotal;
    doc.text('Total Materiales:', 400, yPosition);
    doc.text(`$${materialsTotal.toLocaleString('es-CL')}`, 500, yPosition);
    
    if (quotation.labor_cost && quotation.labor_cost > 0) {
      yPosition += 20;
      doc.text('Mano de Obra:', 400, yPosition);
      doc.text(`$${quotation.labor_cost.toLocaleString('es-CL')}`, 500, yPosition);
    }
    
    yPosition += 20;
    doc.text('Subtotal:', 400, yPosition);
    doc.text(`$${quotation.subtotal.toLocaleString('es-CL')}`, 500, yPosition);
    
    if (quotation.margin_percentage && quotation.margin_percentage > 0) {
      yPosition += 20;
      doc.text(`Margen (${quotation.margin_percentage}%):`, 400, yPosition);
      doc.text(`$${(quotation.margin_amount || 0).toLocaleString('es-CL')}`, 500, yPosition);
    }
    
    if (quotation.net_total) {
      yPosition += 20;
      doc.text('Neto:', 400, yPosition);
      doc.text(`$${quotation.net_total.toLocaleString('es-CL')}`, 500, yPosition);
    }
    
    yPosition += 20;
    doc.text('IVA (19%):', 400, yPosition);
    doc.text(`$${quotation.tax.toLocaleString('es-CL')}`, 500, yPosition);
    
    yPosition += 20;
    doc.fontSize(14).text('TOTAL:', 400, yPosition);
    doc.text(`$${quotation.total.toLocaleString('es-CL')}`, 500, yPosition);

    // Notas
    if (quotation.notes) {
      yPosition += 40;
      doc.fontSize(12).text('Notas:', 50, yPosition);
      doc.text(quotation.notes, 50, yPosition + 20);
    }

    // Forma de pago
    if (quotation.payment_terms) {
      yPosition += 40;
      doc.fontSize(11).text(`Forma de pago: ${quotation.payment_terms}`, 50, yPosition);
    }

    // Términos y condiciones
    yPosition += 30;
    const validDays = Math.ceil((new Date(quotation.valid_until).getTime() - new Date(quotation.date).getTime()) / (1000 * 60 * 60 * 24));
    doc.fontSize(12).text('Términos y Condiciones:', 50, yPosition);
    doc.fontSize(10).text(`• Esta cotización tiene una vigencia de ${validDays} días.`, 50, yPosition + 20);
    doc.text('• Los precios incluyen IVA', 50, yPosition + 35);
    if (quotation.payment_terms) {
      doc.text(`• ${quotation.payment_terms}`, 50, yPosition + 50);
    } else {
      doc.text('• El trabajo comenzará una vez aprobada la cotización y recibido el anticipo', 50, yPosition + 50);
    }
    doc.text('• Los materiales pueden variar según disponibilidad', 50, yPosition + 65);

    // Pie de página
    yPosition = 750;
    doc.fontSize(10).text('Esta cotización cumple con las normas tributarias chilenas', 50, yPosition);
    doc.text('Documento generado electrónicamente', 50, yPosition + 15);

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

export default router;
