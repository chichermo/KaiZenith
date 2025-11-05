import express from 'express';
import { authenticateToken } from './auth-simple';
import { query } from 'express-validator';

const router = express.Router();

// Dashboard ejecutivo con métricas avanzadas
router.get('/executive', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    // Estas métricas se obtendrían de los módulos correspondientes
    // Por ahora usamos datos mock, pero en producción deberían venir de las bases de datos

    const { date_from, date_to } = req.query;
    const dateFrom = date_from ? new Date(date_from as string) : new Date(new Date().getFullYear(), 0, 1);
    const dateTo = date_to ? new Date(date_to as string) : new Date();

    // KPIs principales
    const kpis = {
      total_revenue: {
        current: 125000000, // CLP
        previous: 98000000,
        change: 27.55,
        trend: 'up'
      },
      total_expenses: {
        current: 85000000,
        previous: 72000000,
        change: 18.06,
        trend: 'up'
      },
      net_profit: {
        current: 40000000,
        previous: 26000000,
        change: 53.85,
        trend: 'up'
      },
      profit_margin: {
        current: 32.0,
        previous: 26.5,
        change: 5.5,
        trend: 'up'
      },
      active_projects: {
        current: 12,
        previous: 8,
        change: 50.0,
        trend: 'up'
      },
      pending_invoices: {
        current: 15,
        previous: 22,
        change: -31.82,
        trend: 'down'
      },
      inventory_value: {
        current: 45000000,
        previous: 38000000,
        change: 18.42,
        trend: 'up'
      },
      cash_flow: {
        current: 35000000,
        previous: 28000000,
        change: 25.0,
        trend: 'up'
      }
    };

    // Análisis de ventas
    const salesAnalysis = {
      by_month: [
        { month: 'Ene', revenue: 8500000, invoices: 12 },
        { month: 'Feb', revenue: 9200000, invoices: 15 },
        { month: 'Mar', revenue: 10500000, invoices: 18 },
        { month: 'Abr', revenue: 9800000, invoices: 14 },
        { month: 'May', revenue: 11200000, invoices: 17 },
        { month: 'Jun', revenue: 12800000, invoices: 20 }
      ],
      by_category: [
        { category: 'Construcción', revenue: 45000000, percentage: 36 },
        { category: 'Reparaciones', revenue: 32000000, percentage: 25.6 },
        { category: 'Mantenimiento', revenue: 28000000, percentage: 22.4 },
        { category: 'Consultoría', revenue: 20000000, percentage: 16 }
      ],
      top_clients: [
        { name: 'Empresa ABC', revenue: 18500000, invoices: 8 },
        { name: 'Corporación XYZ', revenue: 15200000, invoices: 6 },
        { name: 'Constructora DEF', revenue: 12800000, invoices: 5 }
      ]
    };

    // Análisis de rentabilidad por proyecto
    const profitabilityAnalysis = {
      average_margin: 32.5,
      projects_over_budget: 3,
      projects_under_budget: 9,
      top_profitable_projects: [
        { code: 'PROJ-001', name: 'Edificio Residencial', margin: 45.2, revenue: 25000000 },
        { code: 'PROJ-002', name: 'Remodelación Comercial', margin: 38.5, revenue: 18000000 },
        { code: 'PROJ-003', name: 'Infraestructura', margin: 35.8, revenue: 32000000 }
      ]
    };

    // Estado financiero resumido
    const financialSummary = {
      accounts_receivable: {
        current: 35000000,
        overdue: 8500000,
        overdue_percentage: 24.3
      },
      accounts_payable: {
        current: 28000000,
        due_soon: 12000000,
        due_soon_percentage: 42.9
      },
      cash_position: {
        bank_accounts: 35000000,
        cash: 2500000,
        total: 37500000
      }
    };

    // Alertas y notificaciones
    const alerts = [
      {
        type: 'warning',
        message: '3 proyectos están sobre presupuesto',
        priority: 'high'
      },
      {
        type: 'info',
        message: '5 productos con stock bajo',
        priority: 'medium'
      },
      {
        type: 'success',
        message: '15 facturas pendientes de aprobación',
        priority: 'low'
      },
      {
        type: 'warning',
        message: '8 facturas vencidas por cobrar',
        priority: 'high'
      }
    ];

    // Tendencias y proyecciones
    const trends = {
      revenue_forecast: {
        next_month: 13500000,
        next_quarter: 42000000,
        confidence: 85
      },
      expense_forecast: {
        next_month: 9500000,
        next_quarter: 29000000,
        confidence: 78
      }
    };

    res.json({
      success: true,
      data: {
        kpis,
        sales_analysis: salesAnalysis,
        profitability_analysis: profitabilityAnalysis,
        financial_summary: financialSummary,
        alerts,
        trends,
        period: {
          from: dateFrom,
          to: dateTo
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo dashboard ejecutivo:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Dashboard operativo
router.get('/operational', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const operationalData = {
      pending_approvals: {
        quotations: 8,
        purchase_orders: 12,
        expenses: 5,
        payments: 3
      },
      today_tasks: {
        invoices_to_send: 5,
        orders_to_process: 3,
        payments_to_record: 2,
        follow_ups: 7
      },
      upcoming_deadlines: [
        { type: 'invoice', id: 1, description: 'Factura FAC-2024-001234', due_date: '2024-07-15', days_remaining: 5 },
        { type: 'quotation', id: 2, description: 'Cotización COT-2024-000567', due_date: '2024-07-18', days_remaining: 8 },
        { type: 'project', id: 3, description: 'Proyecto PROJ-001', due_date: '2024-07-20', days_remaining: 10 }
      ],
      recent_activity: [
        { type: 'invoice', action: 'created', user: 'Juan Pérez', time: '2024-07-10T10:30:00' },
        { type: 'quotation', action: 'approved', user: 'María González', time: '2024-07-10T09:15:00' },
        { type: 'purchase_order', action: 'completed', user: 'Carlos López', time: '2024-07-10T08:45:00' }
      ]
    };

    res.json({
      success: true,
      data: operationalData
    });
  } catch (error) {
    console.error('Error obteniendo dashboard operativo:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;




