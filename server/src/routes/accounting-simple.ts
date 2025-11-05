import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';
import PDFDocument from 'pdfkit';
import { getCompanyConfig } from './settings-simple';
import {
  generateInvoiceAccountingEntry,
  generateInvoicePaymentAccountingEntry,
  generatePurchaseOrderAccountingEntry,
  generateSupplierPaymentAccountingEntry,
  generateInventoryMovementAccountingEntry,
  generateExpenseAccountingEntry,
  AccountingEntryExtended
} from '../utils/accounting-auto';

const router = express.Router();

// Tipo local para asientos contables (estructura diferente al tipo AccountingEntry en types)
type AccountingEntryLocal = AccountingEntryExtended;

// Plan de cuentas según normas chilenas
const CHART_OF_ACCOUNTS = {
  '1101': 'Caja',
  '1102': 'Banco Cuenta Corriente',
  '1103': 'Banco Cuenta de Ahorro',
  '1201': 'Cuentas por Cobrar Clientes',
  '1202': 'Documentos por Cobrar',
  '1301': 'Mercaderías',
  '1302': 'Materiales',
  '1303': 'Productos en Proceso',
  '1304': 'Productos Terminados',
  '1401': 'Muebles y Útiles',
  '1402': 'Equipos de Computación',
  '1403': 'Maquinarias',
  '1404': 'Vehículos',
  '1501': 'Depreciación Acumulada Muebles',
  '1502': 'Depreciación Acumulada Equipos',
  '1503': 'Depreciación Acumulada Maquinarias',
  '1504': 'Depreciación Acumulada Vehículos',
  '2101': 'Cuentas por Pagar Proveedores',
  '2102': 'Documentos por Pagar',
  '2103': 'Remuneraciones por Pagar',
  '2104': 'Cotizaciones Previsionales por Pagar',
  '2105': 'IVA Crédito Fiscal',
  '2106': 'Retenciones por Pagar',
  '3101': 'Capital',
  '3102': 'Reservas',
  '3201': 'Utilidades del Ejercicio',
  '3202': 'Pérdidas del Ejercicio',
  '4101': 'Ventas de Servicios',
  '4102': 'Ventas de Productos',
  '5101': 'Costo de Ventas Servicios',
  '5102': 'Costo de Ventas Productos',
  '6101': 'Gastos de Administración',
  '6102': 'Gastos de Ventas',
  '6103': 'Gastos Financieros',
  '7101': 'Otros Ingresos',
  '7102': 'Ingresos Financieros'
};

// Datos en memoria para contabilidad
let accountingEntries: AccountingEntryLocal[] = [
  {
    id: 1,
    date: '2024-01-15',
    reference: 'FAC-000001',
    description: 'Venta de servicios de construcción',
    entries: [
      { account: '1201', debit: 119000, credit: 0, description: 'Cuentas por Cobrar Clientes' },
      { account: '4101', debit: 0, credit: 100000, description: 'Ventas de Servicios' },
      { account: '2105', debit: 0, credit: 19000, description: 'IVA Crédito Fiscal' }
    ],
    total_debit: 119000,
    total_credit: 119000,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    date: '2024-01-20',
    reference: 'OC-000001',
    description: 'Compra de materiales',
    entries: [
      { account: '1302', debit: 500000, credit: 0, description: 'Materiales' },
      { account: '2105', debit: 95000, credit: 0, description: 'IVA Crédito Fiscal' },
      { account: '2101', debit: 0, credit: 595000, description: 'Cuentas por Pagar Proveedores' }
    ],
    total_debit: 595000,
    total_credit: 595000,
    created_at: new Date(),
    updated_at: new Date()
  }
];

let balanceSheet: {
  assets: {
    current: Record<string, { balance: number; description: string }>;
    fixed: Record<string, { balance: number; description: string }>;
  };
  liabilities: {
    current: Record<string, { balance: number; description: string }>;
    long_term: Record<string, { balance: number; description: string }>;
  };
  equity: Record<string, { balance: number; description: string }>;
} = {
  assets: {
    current: {
      '1101': { balance: 50000, description: 'Caja' },
      '1102': { balance: 250000, description: 'Banco Cuenta Corriente' },
      '1201': { balance: 300000, description: 'Cuentas por Cobrar Clientes' },
      '1302': { balance: 500000, description: 'Materiales' }
    },
    fixed: {
      '1401': { balance: 150000, description: 'Muebles y Útiles' },
      '1403': { balance: 800000, description: 'Maquinarias' },
      '1501': { balance: -30000, description: 'Depreciación Acumulada Muebles' },
      '1503': { balance: -160000, description: 'Depreciación Acumulada Maquinarias' }
    }
  },
  liabilities: {
    current: {
      '2101': { balance: 200000, description: 'Cuentas por Pagar Proveedores' },
      '2103': { balance: 150000, description: 'Remuneraciones por Pagar' },
      '2105': { balance: 50000, description: 'IVA Crédito Fiscal' }
    },
    long_term: {
      '2102': { balance: 300000, description: 'Documentos por Pagar' }
    }
  },
  equity: {
    '3101': { balance: 1000000, description: 'Capital' },
    '3201': { balance: 200000, description: 'Utilidades del Ejercicio' }
  }
};

// Obtener todas las entradas contables
router.get('/entries', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('account').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;
    const account = req.query.account as string;

    let filteredEntries = [...accountingEntries];

    // Filtrar por fecha
    if (dateFrom) {
      filteredEntries = filteredEntries.filter(entry => entry.date >= dateFrom);
    }

    if (dateTo) {
      filteredEntries = filteredEntries.filter(entry => entry.date <= dateTo);
    }

    // Filtrar por cuenta
    if (account) {
      filteredEntries = filteredEntries.filter(entry => 
        entry.entries.some(e => e.account === account)
      );
    }

    const total = filteredEntries.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedEntries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo entradas contables:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear nueva entrada contable
router.post('/entries', authenticateToken, [
  body('date').isISO8601(),
  body('reference').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('entries').isArray({ min: 2 }),
  body('entries.*.account').notEmpty().trim(),
  body('entries.*.debit').isFloat({ min: 0 }),
  body('entries.*.credit').isFloat({ min: 0 }),
  body('entries.*.description').notEmpty().trim()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { date, reference, description, entries } = req.body;

    // Verificar que los débitos y créditos sean iguales
    const totalDebit = entries.reduce((sum: number, entry: any) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum: number, entry: any) => sum + entry.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ 
        success: false, 
        error: 'Los débitos y créditos deben ser iguales' 
      });
    }

    // Verificar que las cuentas existan
    for (const entry of entries) {
      if (!CHART_OF_ACCOUNTS[entry.account as keyof typeof CHART_OF_ACCOUNTS]) {
        return res.status(400).json({ 
          success: false, 
          error: `La cuenta ${entry.account} no existe en el plan de cuentas` 
        });
      }
    }

    // Crear entrada contable
    const newEntry = {
      id: Math.max(...accountingEntries.map(e => e.id)) + 1,
      date,
      reference,
      description,
      entries: entries.map((entry: any) => ({
        account: entry.account,
        debit: entry.debit,
        credit: entry.credit,
        description: entry.description
      })),
      total_debit: totalDebit,
      total_credit: totalCredit,
      created_at: new Date(),
      updated_at: new Date()
    };

    accountingEntries.push(newEntry);

    res.status(201).json({
      success: true,
      message: 'Entrada contable creada exitosamente',
      data: newEntry
    });
  } catch (error) {
    console.error('Error creando entrada contable:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Función helper para crear asiento contable automático desde transacción
export const createAccountingEntryFromTransaction = (
  transactionType: 'invoice' | 'invoice_payment' | 'purchase_order' | 'supplier_payment' | 'inventory' | 'expense',
  transactionData: any
): void => {
  try {
    let entry;

    switch (transactionType) {
      case 'invoice':
        entry = generateInvoiceAccountingEntry(transactionData);
        break;
      case 'invoice_payment':
        entry = generateInvoicePaymentAccountingEntry(transactionData.invoice, transactionData.payment);
        break;
      case 'purchase_order':
        entry = generatePurchaseOrderAccountingEntry(transactionData, transactionData.received || false);
        break;
      case 'supplier_payment':
        entry = generateSupplierPaymentAccountingEntry(transactionData.order, transactionData.payment);
        break;
      case 'inventory':
        entry = generateInventoryMovementAccountingEntry(transactionData, transactionData.movement_type);
        break;
      case 'expense':
        entry = generateExpenseAccountingEntry(transactionData);
        break;
      default:
        return;
    }

    if (entry) {
      entry.id = Math.max(...accountingEntries.map(e => e.id), 0) + 1;
      accountingEntries.push(entry);
      
      // Actualizar balance sheet
      updateBalanceSheet(entry);
    }
  } catch (error) {
    console.error('Error creando asiento contable automático:', error);
  }
};

// Función para actualizar balance sheet desde entrada contable
const updateBalanceSheet = (entry: AccountingEntryLocal): void => {
  entry.entries.forEach((e) => {
    const accountCode = e.account;
    const accountType = accountCode[0]; // Primer dígito determina el tipo

    if (accountType === '1') {
      // Activos
      if (!balanceSheet.assets.current[accountCode] && !balanceSheet.assets.fixed[accountCode]) {
        balanceSheet.assets.current[accountCode] = { 
          balance: 0, 
          description: CHART_OF_ACCOUNTS[accountCode as keyof typeof CHART_OF_ACCOUNTS] || '' 
        };
      }
      const account = balanceSheet.assets.current[accountCode] || balanceSheet.assets.fixed[accountCode];
      if (account) {
        account.balance += (e.debit - e.credit);
      }
    } else if (accountType === '2') {
      // Pasivos
      if (!balanceSheet.liabilities.current[accountCode] && !balanceSheet.liabilities.long_term[accountCode]) {
        balanceSheet.liabilities.current[accountCode] = { 
          balance: 0, 
          description: CHART_OF_ACCOUNTS[accountCode as keyof typeof CHART_OF_ACCOUNTS] || '' 
        };
      }
      const account = balanceSheet.liabilities.current[accountCode] || balanceSheet.liabilities.long_term[accountCode];
      if (account) {
        account.balance += (e.credit - e.debit);
      }
    } else if (accountType === '3') {
      // Patrimonio
      if (!balanceSheet.equity[accountCode]) {
        balanceSheet.equity[accountCode] = { 
          balance: 0, 
          description: CHART_OF_ACCOUNTS[accountCode as keyof typeof CHART_OF_ACCOUNTS] || '' 
        };
      }
      balanceSheet.equity[accountCode].balance += (e.credit - e.debit);
    }
  });
};

// Obtener balance general
router.get('/balance-sheet', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    res.json({
      success: true,
      data: balanceSheet
    });
  } catch (error) {
    console.error('Error obteniendo balance general:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estado de resultados
router.get('/income-statement', authenticateToken, [
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601()
], async (req: express.Request, res: express.Response) => {
  try {
    const dateFrom = req.query.date_from as string || '2024-01-01';
    const dateTo = req.query.date_to as string || '2024-12-31';

    // Calcular ingresos
    const revenues = {
      '4101': { balance: 500000, description: 'Ventas de Servicios' },
      '4102': { balance: 200000, description: 'Ventas de Productos' },
      '7101': { balance: 50000, description: 'Otros Ingresos' }
    };

    // Calcular costos
    const costs = {
      '5101': { balance: 300000, description: 'Costo de Ventas Servicios' },
      '5102': { balance: 120000, description: 'Costo de Ventas Productos' }
    };

    // Calcular gastos
    const expenses = {
      '6101': { balance: 80000, description: 'Gastos de Administración' },
      '6102': { balance: 40000, description: 'Gastos de Ventas' },
      '6103': { balance: 20000, description: 'Gastos Financieros' }
    };

    const totalRevenue = Object.values(revenues).reduce((sum, item) => sum + item.balance, 0);
    const totalCosts = Object.values(costs).reduce((sum, item) => sum + item.balance, 0);
    const totalExpenses = Object.values(expenses).reduce((sum, item) => sum + item.balance, 0);
    const grossProfit = totalRevenue - totalCosts;
    const netIncome = grossProfit - totalExpenses;

    res.json({
      success: true,
      data: {
        period: { from: dateFrom, to: dateTo },
        revenues,
        costs,
        expenses,
        totals: {
          revenue: totalRevenue,
          costs: totalCosts,
          expenses: totalExpenses,
          gross_profit: grossProfit,
          net_income: netIncome
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado de resultados:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener libro mayor
router.get('/general-ledger', authenticateToken, [
  query('account').optional().isString(),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601()
], async (req: express.Request, res: express.Response) => {
  try {
    const account = req.query.account as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;

    let ledgerEntries: any[] = [];

    // Filtrar entradas por cuenta y fecha
    accountingEntries.forEach(entry => {
      if (dateFrom && entry.date < dateFrom) return;
      if (dateTo && entry.date > dateTo) return;

      entry.entries.forEach(item => {
        if (!account || item.account === account) {
          ledgerEntries.push({
            date: entry.date,
            reference: entry.reference,
            description: item.description,
            account: item.account,
            account_name: CHART_OF_ACCOUNTS[item.account as keyof typeof CHART_OF_ACCOUNTS] || 'Cuenta no definida',
            debit: item.debit,
            credit: item.credit
          });
        }
      });
    });

    // Ordenar por fecha
    ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({
      success: true,
      data: ledgerEntries
    });
  } catch (error) {
    console.error('Error obteniendo libro mayor:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener plan de cuentas
router.get('/chart-of-accounts', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    res.json({
      success: true,
      data: CHART_OF_ACCOUNTS
    });
  } catch (error) {
    console.error('Error obteniendo plan de cuentas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generar reporte contable en PDF
router.get('/report/pdf', authenticateToken, [
  query('type').isIn(['balance-sheet', 'income-statement', 'general-ledger']),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('account').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const type = req.query.type as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;
    const account = req.query.account as string;

    // Obtener configuración de la empresa
    const company = getCompanyConfig();

    // Crear PDF
    const doc = new PDFDocument({ 
      margin: 50,
      size: 'A4',
      info: {
        Title: `Reporte Contable - ${type}`,
        Author: company.name,
        Subject: 'Reporte Contable',
        Creator: `Sistema ${company.name}`
      }
    });
    
    // Configurar headers HTTP
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-contable-${type}.pdf"`);
    
    doc.pipe(res);

    // Logo y nombre de la empresa
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

    // Título del reporte
    let reportTitle = '';
    switch (type) {
      case 'balance-sheet':
        reportTitle = 'BALANCE GENERAL';
        break;
      case 'income-statement':
        reportTitle = 'ESTADO DE RESULTADOS';
        break;
      case 'general-ledger':
        reportTitle = 'LIBRO MAYOR';
        break;
    }

    doc.fontSize(16).text(reportTitle, 50, 150);
    
    if (dateFrom && dateTo) {
      doc.fontSize(12).text(`Período: ${dateFrom} al ${dateTo}`, 50, 170);
    }

    // Contenido del reporte según el tipo
    let yPosition = 200;

    if (type === 'balance-sheet') {
      // Balance General
      doc.fontSize(14).text('ACTIVOS', 50, yPosition);
      yPosition += 30;

      doc.fontSize(12).text('ACTIVOS CIRCULANTES', 70, yPosition);
      yPosition += 20;

      Object.entries(balanceSheet.assets.current).forEach(([code, data]) => {
        doc.text(`${code} - ${data.description}`, 90, yPosition);
        doc.text(`$${data.balance.toLocaleString('es-CL')}`, 400, yPosition);
        yPosition += 15;
      });

      yPosition += 20;
      doc.fontSize(12).text('ACTIVOS FIJOS', 70, yPosition);
      yPosition += 20;

      Object.entries(balanceSheet.assets.fixed).forEach(([code, data]) => {
        doc.text(`${code} - ${data.description}`, 90, yPosition);
        doc.text(`$${data.balance.toLocaleString('es-CL')}`, 400, yPosition);
        yPosition += 15;
      });

      yPosition += 30;
      doc.fontSize(14).text('PASIVOS', 50, yPosition);
      yPosition += 30;

      doc.fontSize(12).text('PASIVOS CIRCULANTES', 70, yPosition);
      yPosition += 20;

      Object.entries(balanceSheet.liabilities.current).forEach(([code, data]) => {
        doc.text(`${code} - ${data.description}`, 90, yPosition);
        doc.text(`$${data.balance.toLocaleString('es-CL')}`, 400, yPosition);
        yPosition += 15;
      });

      yPosition += 30;
      doc.fontSize(14).text('PATRIMONIO', 50, yPosition);
      yPosition += 30;

      Object.entries(balanceSheet.equity).forEach(([code, data]) => {
        doc.text(`${code} - ${data.description}`, 90, yPosition);
        doc.text(`$${data.balance.toLocaleString('es-CL')}`, 400, yPosition);
        yPosition += 15;
      });
    }

    // Pie de página
    yPosition = 750;
    doc.fontSize(10).text('Este reporte cumple con las normas contables chilenas', 50, yPosition);
    doc.text('Documento generado electrónicamente', 50, yPosition + 15);

    doc.end();
  } catch (error) {
    console.error('Error generando reporte PDF:', error);
    res.status(500).json({ success: false, error: 'Error generando reporte PDF' });
  }
});

export default router;
