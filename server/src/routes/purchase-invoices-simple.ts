import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';
import PDFDocument from 'pdfkit';
import { getCompanyConfig } from './settings-simple';
import { createAccountingEntryFromTransaction } from './accounting-simple';
import { generatePurchaseInvoiceAccountingEntry } from '../utils/accounting-auto';
import axios from 'axios';

const router = express.Router();

// Datos en memoria para facturas de compra
interface PurchaseInvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  unit: string;
  category?: 'materials' | 'services' | 'expenses' | 'equipment' | 'other';
  account_code?: string; // Código de cuenta contable sugerido
}

interface PurchaseInvoice {
  id: number;
  invoice_number: string;
  supplier_invoice_number: string; // Número de factura del proveedor
  supplier_id: number;
  supplier_name: string;
  supplier_rut: string;
  supplier_email: string;
  supplier_address: string;
  supplier_city: string;
  supplier_region: string;
  supplier_phone: string;
  date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  category: 'materials' | 'services' | 'expenses' | 'equipment' | 'other';
  account_code: string; // Código de cuenta contable principal
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  notes: string;
  items: PurchaseInvoiceItem[];
  payment_method?: 'transferencia' | 'efectivo' | 'cheque' | 'other';
  payment_reference?: string;
  payment_date?: string;
  created_at: Date;
  updated_at: Date;
}

let purchaseInvoices: PurchaseInvoice[] = [];

// Mapeo de categorías a cuentas contables sugeridas
const CATEGORY_TO_ACCOUNT: { [key: string]: string } = {
  'materials': '1302', // Materiales
  'services': '6101', // Gastos de Administración (servicios)
  'expenses': '6101', // Gastos de Administración
  'equipment': '1403', // Maquinarias
  'other': '6101' // Gastos de Administración
};

// Clasificación automática por palabras clave en descripción
const KEYWORD_TO_ACCOUNT: { [key: string]: string } = {
  // Materiales
  'cemento': '1302',
  'arena': '1302',
  'grava': '1302',
  'ladrillo': '1302',
  'material': '1302',
  'acero': '1302',
  'hierro': '1302',
  
  // Servicios
  'servicio': '6101',
  'mantenimiento': '6101',
  'reparación': '6101',
  'consultoría': '6101',
  
  // Equipos
  'maquinaria': '1403',
  'equipo': '1403',
  'herramienta': '1402',
  'vehículo': '1404',
  
  // Gastos operacionales
  'combustible': '6103',
  'viático': '6101',
  'almuerzo': '6101',
  'oficina': '6101',
  'papelería': '6101'
};

// Función para clasificar automáticamente una factura
const classifyInvoice = (items: PurchaseInvoiceItem[], supplierType?: string): { category: string; account_code: string } => {
  // Primero intentar clasificar por tipo de proveedor
  if (supplierType === 'materials') {
    return { category: 'materials', account_code: '1302' };
  }
  if (supplierType === 'services') {
    return { category: 'services', account_code: '6101' };
  }
  if (supplierType === 'tools') {
    return { category: 'equipment', account_code: '1402' };
  }

  // Clasificar por palabras clave en los items
  let materialsCount = 0;
  let servicesCount = 0;
  let equipmentCount = 0;
  let expensesCount = 0;

  items.forEach(item => {
    const description = item.description.toLowerCase();
    
    // Buscar palabras clave
    for (const [keyword, account] of Object.entries(KEYWORD_TO_ACCOUNT)) {
      if (description.includes(keyword)) {
        if (account === '1302') materialsCount++;
        else if (account === '6101') servicesCount++;
        else if (account === '1403' || account === '1402' || account === '1404') equipmentCount++;
        else if (account === '6103') expensesCount++;
        
        // Asignar cuenta al item
        item.account_code = account;
        if (account === '1302') item.category = 'materials';
        else if (account === '1403' || account === '1402' || account === '1404') item.category = 'equipment';
        else if (account === '6103') item.category = 'expenses';
        else item.category = 'services';
        
        break;
      }
    }
  });

  // Determinar categoría principal
  let category = 'other';
  let accountCode = '6101';

  if (materialsCount > servicesCount && materialsCount > equipmentCount && materialsCount > expensesCount) {
    category = 'materials';
    accountCode = '1302';
  } else if (servicesCount > equipmentCount && servicesCount > expensesCount) {
    category = 'services';
    accountCode = '6101';
  } else if (equipmentCount > expensesCount) {
    category = 'equipment';
    accountCode = '1403';
  } else if (expensesCount > 0) {
    category = 'expenses';
    accountCode = '6103';
  }

  return { category, account_code: accountCode };
};

// Generar número de factura de compra automático
const generateInvoiceNumber = (): string => {
  const year = new Date().getFullYear();
  const count = purchaseInvoices.length + 1;
  return `FC-${count.toString().padStart(6, '0')}-${year}`;
};

// Obtener todas las facturas de compra
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['pending', 'approved', 'paid', 'cancelled']),
  query('supplier_id').optional().isInt(),
  query('category').optional().isIn(['materials', 'services', 'expenses', 'equipment', 'other']),
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
    const category = req.query.category as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;

    let filteredInvoices = [...purchaseInvoices];

    // Filtrar por estado
    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status);
    }

    // Filtrar por proveedor
    if (supplierId) {
      filteredInvoices = filteredInvoices.filter(inv => inv.supplier_id === parseInt(supplierId));
    }

    // Filtrar por categoría
    if (category) {
      filteredInvoices = filteredInvoices.filter(inv => inv.category === category);
    }

    // Filtrar por fecha
    if (dateFrom) {
      filteredInvoices = filteredInvoices.filter(inv => inv.date >= dateFrom);
    }
    if (dateTo) {
      filteredInvoices = filteredInvoices.filter(inv => inv.date <= dateTo);
    }

    // Ordenar por fecha más reciente
    filteredInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
    console.error('Error obteniendo facturas de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener factura de compra por ID
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const invoice = purchaseInvoices.find(inv => inv.id === parseInt(id));
    
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Factura de compra no encontrada' });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error obteniendo factura de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear nueva factura de compra
router.post('/', authenticateToken, [
  body('supplier_id').isInt(),
  body('supplier_invoice_number').notEmpty().trim(),
  body('date').isISO8601(),
  body('due_date').isISO8601(),
  body('items').isArray({ min: 1 }),
  body('items.*.description').notEmpty().trim(),
  body('items.*.quantity').isFloat({ min: 0.01 }),
  body('items.*.unit_price').isFloat({ min: 0 }),
  body('items.*.unit').notEmpty().trim(),
  body('category').optional().isIn(['materials', 'services', 'expenses', 'equipment', 'other']),
  body('account_code').optional().isString(),
  body('notes').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { supplier_id, supplier_invoice_number, date, due_date, items, category, account_code, notes } = req.body;

    // Obtener información del proveedor
    let supplier: any = null;
    try {
      // Obtener proveedor desde el endpoint interno
      const supplierResponse = await axios.get(`http://localhost:${process.env.PORT || 5000}/api/suppliers/${supplier_id}`, {
        headers: {
          'Authorization': req.headers.authorization || ''
        }
      });
      if (supplierResponse.data.success) {
        supplier = supplierResponse.data.data;
      }
    } catch (error: any) {
      console.warn('No se pudo obtener información del proveedor:', error.message);
    }

    if (!supplier) {
      return res.status(400).json({ success: false, error: 'Proveedor no encontrado' });
    }

    // Calcular totales
    let subtotal = 0;
    const processedItems: PurchaseInvoiceItem[] = items.map((item: any, index: number) => {
      const total = item.quantity * item.unit_price;
      subtotal += total;
      return {
        id: index + 1,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: total,
        unit: item.unit,
        category: item.category,
        account_code: item.account_code
      };
    });

    const taxRate = 0.19; // IVA 19% en Chile
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Clasificación automática si no se proporcionó
    let finalCategory = category;
    let finalAccountCode = account_code;

    if (!finalCategory || !finalAccountCode) {
      const classification = classifyInvoice(processedItems, supplier.type);
      finalCategory = finalCategory || classification.category;
      finalAccountCode = finalAccountCode || classification.account_code;
    }

    // Asignar categoría y cuenta a items que no la tengan
    processedItems.forEach(item => {
      if (!item.category) {
        item.category = finalCategory as any;
      }
      if (!item.account_code) {
        item.account_code = finalAccountCode;
      }
    });

    const invoiceNumber = generateInvoiceNumber();

    // Crear factura de compra
    const newInvoice: PurchaseInvoice = {
      id: Math.max(...purchaseInvoices.map(inv => inv.id), 0) + 1,
      invoice_number: invoiceNumber,
      supplier_invoice_number: supplier_invoice_number,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_rut: supplier.rut,
      supplier_email: supplier.email,
      supplier_address: supplier.address,
      supplier_city: supplier.city,
      supplier_region: supplier.region,
      supplier_phone: supplier.phone,
      date,
      due_date,
      subtotal,
      tax,
      total,
      category: finalCategory as any,
      account_code: finalAccountCode,
      status: 'pending',
      notes: notes || '',
      items: processedItems,
      created_at: new Date(),
      updated_at: new Date()
    };

    purchaseInvoices.push(newInvoice);

    // Generar asiento contable automático cuando se aprueba
    // (lo haremos cuando se apruebe la factura)

    res.status(201).json({
      success: true,
      message: 'Factura de compra creada exitosamente',
      data: newInvoice
    });
  } catch (error) {
    console.error('Error creando factura de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Aprobar factura de compra (genera asiento contable)
router.patch('/:id/approve', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const invoiceIndex = purchaseInvoices.findIndex(inv => inv.id === parseInt(id));
    
    if (invoiceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Factura de compra no encontrada' });
    }

    const invoice = purchaseInvoices[invoiceIndex];
    
    if (invoice.status === 'approved' || invoice.status === 'paid') {
      return res.status(400).json({ success: false, error: 'La factura ya está aprobada o pagada' });
    }

    // Cambiar estado
    purchaseInvoices[invoiceIndex].status = 'approved';
    purchaseInvoices[invoiceIndex].updated_at = new Date();

    // Generar asiento contable automático
    const accountingEntry = generatePurchaseInvoiceAccountingEntry(invoice);
    createAccountingEntryFromTransaction('purchase_invoice', { invoice, entry: accountingEntry });

    res.json({
      success: true,
      message: 'Factura de compra aprobada y asiento contable generado',
      data: purchaseInvoices[invoiceIndex]
    });
  } catch (error) {
    console.error('Error aprobando factura de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Marcar factura como pagada
router.patch('/:id/pay', authenticateToken, [
  body('payment_method').optional().isIn(['transferencia', 'efectivo', 'cheque', 'other']),
  body('payment_reference').optional().isString(),
  body('payment_date').optional().isISO8601()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const { payment_method, payment_reference, payment_date } = req.body;
    
    const invoiceIndex = purchaseInvoices.findIndex(inv => inv.id === parseInt(id));
    
    if (invoiceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Factura de compra no encontrada' });
    }

    const invoice = purchaseInvoices[invoiceIndex];
    
    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, error: 'La factura ya está pagada' });
    }

    // Si no estaba aprobada, aprobarla primero
    if (invoice.status !== 'approved') {
      purchaseInvoices[invoiceIndex].status = 'approved';
    }

    // Marcar como pagada
    purchaseInvoices[invoiceIndex].status = 'paid';
    purchaseInvoices[invoiceIndex].payment_method = payment_method || 'transferencia';
    purchaseInvoices[invoiceIndex].payment_reference = payment_reference || '';
    purchaseInvoices[invoiceIndex].payment_date = payment_date || new Date().toISOString().split('T')[0];
    purchaseInvoices[invoiceIndex].updated_at = new Date();

    // Generar asiento contable de pago si no estaba aprobada antes
    if (invoice.status === 'pending') {
      const accountingEntry = generatePurchaseInvoiceAccountingEntry(invoice);
      createAccountingEntryFromTransaction('purchase_invoice', { invoice, entry: accountingEntry });
    }

    res.json({
      success: true,
      message: 'Factura de compra marcada como pagada',
      data: purchaseInvoices[invoiceIndex]
    });
  } catch (error) {
    console.error('Error pagando factura de compra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generar PDF de factura de compra
router.get('/:id/pdf', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const invoice = purchaseInvoices.find(inv => inv.id === parseInt(id));
    
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Factura de compra no encontrada' });
    }

    const company = getCompanyConfig();

    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Factura de Compra ${invoice.invoice_number}`,
        Author: company.name,
        Subject: 'Factura de Compra',
        Creator: `Sistema ${company.name}`
      }
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-compra-${invoice.invoice_number}.pdf"`);
    
    doc.pipe(res);

    // Logo y nombre de la empresa
    let yPos = 50;
    
    doc.fontSize(24)
       .fillColor('#8B6914')
       .text('KaiZenith', 50, yPos);
    
    doc.fontSize(8)
       .fillColor('#8B6914')
       .text('REACH THE SUMMIT', 50, yPos + 25);
    
    doc.fillColor('#000000');
    
    yPos = 90;
    doc.fontSize(12).text(`${company.name}`, 50, yPos);
    doc.fontSize(10).text(`RUT: ${company.rut}`, 50, yPos + 15);
    doc.text(`Dirección: ${company.address}`, 50, yPos + 28);
    
    // Título
    yPos = 180;
    doc.fontSize(18).text('FACTURA DE COMPRA', 50, yPos);
    
    // Datos de la factura
    yPos += 40;
    doc.fontSize(10);
    doc.text(`Número: ${invoice.invoice_number}`, 50, yPos);
    doc.text(`Factura Proveedor: ${invoice.supplier_invoice_number}`, 50, yPos + 15);
    doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString('es-CL')}`, 50, yPos + 30);
    doc.text(`Vencimiento: ${new Date(invoice.due_date).toLocaleDateString('es-CL')}`, 50, yPos + 45);
    
    // Datos del proveedor
    yPos += 70;
    doc.fontSize(12).text('PROVEEDOR:', 50, yPos);
    doc.fontSize(10);
    doc.text(`${invoice.supplier_name}`, 50, yPos + 15);
    if (invoice.supplier_rut) doc.text(`RUT: ${invoice.supplier_rut}`, 50, yPos + 30);
    if (invoice.supplier_address) doc.text(`Dirección: ${invoice.supplier_address}`, 50, yPos + 45);
    
    // Items
    yPos += 90;
    doc.fontSize(12).text('ITEMS:', 50, yPos);
    yPos += 20;
    
    invoice.items.forEach((item, index) => {
      doc.fontSize(9);
      doc.text(`${index + 1}. ${item.description}`, 50, yPos);
      doc.text(`   Cantidad: ${item.quantity} ${item.unit}`, 60, yPos + 12);
      doc.text(`   Precio Unitario: $${item.unit_price.toLocaleString('es-CL')}`, 60, yPos + 24);
      doc.text(`   Total: $${item.total.toLocaleString('es-CL')}`, 60, yPos + 36);
      if (item.category) {
        doc.text(`   Categoría: ${item.category}`, 60, yPos + 48);
      }
      yPos += 65;
    });
    
    // Totales
    yPos += 10;
    doc.fontSize(10);
    doc.text(`Subtotal: $${invoice.subtotal.toLocaleString('es-CL')}`, 400, yPos);
    doc.text(`IVA (19%): $${invoice.tax.toLocaleString('es-CL')}`, 400, yPos + 15);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text(`TOTAL: $${invoice.total.toLocaleString('es-CL')}`, 400, yPos + 35);
    
    // Estado y categoría
    yPos += 60;
    doc.fontSize(10).font('Helvetica');
    doc.text(`Estado: ${invoice.status.toUpperCase()}`, 50, yPos);
    doc.text(`Categoría: ${invoice.category.toUpperCase()}`, 50, yPos + 15);
    doc.text(`Cuenta Contable: ${invoice.account_code}`, 50, yPos + 30);
    
    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;

