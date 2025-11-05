import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { pool } from '../index';
import { authenticateToken } from './auth';
import { AccountingEntry } from '../types';

const router = express.Router();

// Plan de cuentas básico para construcción en Chile
const CHART_OF_ACCOUNTS = {
  // ACTIVOS
  '110000': 'Caja',
  '120000': 'Bancos',
  '130000': 'Cuentas por Cobrar',
  '140000': 'Inventario de Materiales',
  '150000': 'Equipos y Maquinaria',
  '160000': 'Depreciación Acumulada Equipos',
  
  // PASIVOS
  '210000': 'Cuentas por Pagar',
  '220000': 'Impuestos por Pagar',
  '230000': 'IVA Crédito Fiscal',
  '240000': 'IVA Débito Fiscal',
  
  // PATRIMONIO
  '310000': 'Capital',
  '320000': 'Utilidades Retenidas',
  
  // INGRESOS
  '410000': 'Ingresos por Servicios',
  '420000': 'Ingresos por Ventas',
  
  // GASTOS
  '510000': 'Costo de Ventas',
  '520000': 'Gastos Operacionales',
  '530000': 'Gastos Administrativos',
  '540000': 'Gastos de Venta',
  '550000': 'Gastos Financieros'
};

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

// Crear asiento contable
router.post('/entries', authenticateToken, [
  body('date').isISO8601(),
  body('description').notEmpty().trim(),
  body('entries').isArray({ min: 2 }),
  body('entries.*.account').notEmpty().trim(),
  body('entries.*.debit').optional().isFloat({ min: 0 }),
  body('entries.*.credit').optional().isFloat({ min: 0 }),
  body('reference_type').optional().isIn(['invoice', 'purchase_order', 'payment', 'expense']),
  body('reference_id').optional().isInt()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { date, description, entries, reference_type, reference_id } = req.body;

    // Validar que el asiento esté balanceado
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      if (entry.debit && entry.credit) {
        return res.status(400).json({ 
          success: false, 
          error: 'Una cuenta no puede tener débito y crédito al mismo tiempo' 
        });
      }
      
      if (!entry.debit && !entry.credit) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cada cuenta debe tener débito o crédito' 
        });
      }

      totalDebit += entry.debit || 0;
      totalCredit += entry.credit || 0;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ 
        success: false, 
        error: 'El asiento no está balanceado. Débito debe igualar crédito' 
      });
    }

    // Crear asiento contable
    const result = await pool.query(
      `INSERT INTO accounting_entries (date, description, reference_type, reference_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [date, description, reference_type, reference_id]
    );

    const accountingEntry = result.rows[0];

    // Crear movimientos contables
    for (const entry of entries) {
      await pool.query(
        `INSERT INTO accounting_movements (accounting_entry_id, account, debit, credit)
         VALUES ($1, $2, $3, $4)`,
        [accountingEntry.id, entry.account, entry.debit || 0, entry.credit || 0]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Asiento contable creado exitosamente',
      data: accountingEntry
    });
  } catch (error) {
    console.error('Error creando asiento contable:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener movimientos contables con filtros
router.get('/movements', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('account').optional().isString(),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
  query('reference_type').optional().isIn(['invoice', 'purchase_order', 'payment', 'expense'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const account = req.query.account as string;
    const dateFrom = req.query.date_from as string;
    const dateTo = req.query.date_to as string;
    const referenceType = req.query.reference_type as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (account) {
      whereClause += ` AND am.account = $${paramIndex}`;
      queryParams.push(account);
      paramIndex++;
    }

    if (dateFrom) {
      whereClause += ` AND ae.date >= $${paramIndex}`;
      queryParams.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      whereClause += ` AND ae.date <= $${paramIndex}`;
      queryParams.push(dateTo);
      paramIndex++;
    }

    if (referenceType) {
      whereClause += ` AND ae.reference_type = $${paramIndex}`;
      queryParams.push(referenceType);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) FROM accounting_movements am
      LEFT JOIN accounting_entries ae ON am.accounting_entry_id = ae.id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Obtener movimientos
    const dataQuery = `
      SELECT 
        am.*,
        ae.date,
        ae.description,
        ae.reference_type,
        ae.reference_id
      FROM accounting_movements am
      LEFT JOIN accounting_entries ae ON am.accounting_entry_id = ae.id
      ${whereClause}
      ORDER BY ae.date DESC, am.id ASC
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
    console.error('Error obteniendo movimientos contables:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generar balance de prueba
router.get('/trial-balance', authenticateToken, [
  query('date').optional().isISO8601()
], async (req: express.Request, res: express.Response) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    const result = await pool.query(`
      SELECT 
        am.account,
        SUM(am.debit) as total_debit,
        SUM(am.credit) as total_credit,
        SUM(am.debit - am.credit) as balance
      FROM accounting_movements am
      LEFT JOIN accounting_entries ae ON am.accounting_entry_id = ae.id
      WHERE ae.date <= $1
      GROUP BY am.account
      HAVING SUM(am.debit) > 0 OR SUM(am.credit) > 0
      ORDER BY am.account
    `, [date]);

    const trialBalance = result.rows.map(row => ({
      account: row.account,
      account_name: CHART_OF_ACCOUNTS[row.account as keyof typeof CHART_OF_ACCOUNTS] || 'Cuenta no definida',
      debit: parseFloat(row.total_debit),
      credit: parseFloat(row.total_credit),
      balance: parseFloat(row.balance)
    }));

    // Calcular totales
    const totalDebit = trialBalance.reduce((sum, row) => sum + row.debit, 0);
    const totalCredit = trialBalance.reduce((sum, row) => sum + row.credit, 0);

    res.json({
      success: true,
      data: {
        date,
        trial_balance: trialBalance,
        totals: {
          total_debit: totalDebit,
          total_credit: totalCredit,
          is_balanced: Math.abs(totalDebit - totalCredit) < 0.01
        }
      }
    });
  } catch (error) {
    console.error('Error generando balance de prueba:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generar estado de resultados
router.get('/income-statement', authenticateToken, [
  query('date_from').isISO8601(),
  query('date_to').isISO8601()
], async (req: express.Request, res: express.Response) => {
  try {
    const { date_from, date_to } = req.query;

    // Ingresos
    const incomeResult = await pool.query(`
      SELECT 
        am.account,
        SUM(am.credit - am.debit) as total_income
      FROM accounting_movements am
      LEFT JOIN accounting_entries ae ON am.accounting_entry_id = ae.id
      WHERE ae.date BETWEEN $1 AND $2
        AND am.account LIKE '4%'
      GROUP BY am.account
    `, [date_from, date_to]);

    // Gastos
    const expenseResult = await pool.query(`
      SELECT 
        am.account,
        SUM(am.debit - am.credit) as total_expense
      FROM accounting_movements am
      LEFT JOIN accounting_entries ae ON am.accounting_entry_id = ae.id
      WHERE ae.date BETWEEN $1 AND $2
        AND am.account LIKE '5%'
      GROUP BY am.account
    `, [date_from, date_to]);

    const incomeStatement = {
      period: { from: date_from, to: date_to },
      income: incomeResult.rows.map(row => ({
        account: row.account,
        account_name: CHART_OF_ACCOUNTS[row.account as keyof typeof CHART_OF_ACCOUNTS] || 'Cuenta no definida',
        amount: parseFloat(row.total_income)
      })),
      expenses: expenseResult.rows.map(row => ({
        account: row.account,
        account_name: CHART_OF_ACCOUNTS[row.account as keyof typeof CHART_OF_ACCOUNTS] || 'Cuenta no definida',
        amount: parseFloat(row.total_expense)
      }))
    };

    const totalIncome = incomeStatement.income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = incomeStatement.expenses.reduce((sum, item) => sum + item.amount, 0);
    const netIncome = totalIncome - totalExpenses;

    res.json({
      success: true,
      data: {
        ...incomeStatement,
        totals: {
          total_income: totalIncome,
          total_expenses: totalExpenses,
          net_income: netIncome
        }
      }
    });
  } catch (error) {
    console.error('Error generando estado de resultados:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generar balance general
router.get('/balance-sheet', authenticateToken, [
  query('date').optional().isISO8601()
], async (req: express.Request, res: express.Response) => {
  try {
    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    // Activos
    const assetsResult = await pool.query(`
      SELECT 
        am.account,
        SUM(am.debit - am.credit) as balance
      FROM accounting_movements am
      LEFT JOIN accounting_entries ae ON am.accounting_entry_id = ae.id
      WHERE ae.date <= $1
        AND am.account LIKE '1%'
      GROUP BY am.account
      HAVING SUM(am.debit - am.credit) > 0
    `, [date]);

    // Pasivos
    const liabilitiesResult = await pool.query(`
      SELECT 
        am.account,
        SUM(am.credit - am.debit) as balance
      FROM accounting_movements am
      LEFT JOIN accounting_entries ae ON am.accounting_entry_id = ae.id
      WHERE ae.date <= $1
        AND am.account LIKE '2%'
      GROUP BY am.account
      HAVING SUM(am.credit - am.debit) > 0
    `, [date]);

    // Patrimonio
    const equityResult = await pool.query(`
      SELECT 
        am.account,
        SUM(am.credit - am.debit) as balance
      FROM accounting_movements am
      LEFT JOIN accounting_entries ae ON am.accounting_entry_id = ae.id
      WHERE ae.date <= $1
        AND am.account LIKE '3%'
      GROUP BY am.account
      HAVING SUM(am.credit - am.debit) > 0
    `, [date]);

    const balanceSheet = {
      date,
      assets: assetsResult.rows.map(row => ({
        account: row.account,
        account_name: CHART_OF_ACCOUNTS[row.account as keyof typeof CHART_OF_ACCOUNTS] || 'Cuenta no definida',
        balance: parseFloat(row.balance)
      })),
      liabilities: liabilitiesResult.rows.map(row => ({
        account: row.account,
        account_name: CHART_OF_ACCOUNTS[row.account as keyof typeof CHART_OF_ACCOUNTS] || 'Cuenta no definida',
        balance: parseFloat(row.balance)
      })),
      equity: equityResult.rows.map(row => ({
        account: row.account,
        account_name: CHART_OF_ACCOUNTS[row.account as keyof typeof CHART_OF_ACCOUNTS] || 'Cuenta no definida',
        balance: parseFloat(row.balance)
      }))
    };

    const totalAssets = balanceSheet.assets.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = balanceSheet.liabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = balanceSheet.equity.reduce((sum, item) => sum + item.balance, 0);

    res.json({
      success: true,
      data: {
        ...balanceSheet,
        totals: {
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          total_equity: totalEquity,
          is_balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
        }
      }
    });
  } catch (error) {
    console.error('Error generando balance general:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas contables
router.get('/stats/summary', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const currentMonth = new Date();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(CASE WHEN ae.date >= $1 THEN 1 END) as current_month_entries,
        SUM(CASE WHEN am.account LIKE '4%' AND ae.date >= $1 THEN am.credit - am.debit ELSE 0 END) as current_month_income,
        SUM(CASE WHEN am.account LIKE '5%' AND ae.date >= $1 THEN am.debit - am.credit ELSE 0 END) as current_month_expenses
      FROM accounting_entries ae
      LEFT JOIN accounting_movements am ON ae.id = am.accounting_entry_id
    `, [firstDay.toISOString().split('T')[0]]);

    res.json({
      success: true,
      data: {
        ...statsResult.rows[0],
        current_month_net_income: 
          parseFloat(statsResult.rows[0].current_month_income || 0) - 
          parseFloat(statsResult.rows[0].current_month_expenses || 0)
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas contables:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
