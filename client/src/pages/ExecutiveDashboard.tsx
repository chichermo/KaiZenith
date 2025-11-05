import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  Construction as ProjectIcon,
  Inventory as InventoryIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface KPIData {
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down';
}

interface ExecutiveDashboard {
  kpis: {
    total_revenue: KPIData;
    total_expenses: KPIData;
    net_profit: KPIData;
    profit_margin: KPIData;
    active_projects: KPIData;
    pending_invoices: KPIData;
    inventory_value: KPIData;
    cash_flow: KPIData;
  };
  sales_analysis: {
    by_month: Array<{ month: string; revenue: number; invoices: number }>;
    by_category: Array<{ category: string; revenue: number; percentage: number }>;
    top_clients: Array<{ name: string; revenue: number; invoices: number }>;
  };
  profitability_analysis: {
    average_margin: number;
    projects_over_budget: number;
    projects_under_budget: number;
    top_profitable_projects: Array<{
      code: string;
      name: string;
      margin: number;
      revenue: number;
    }>;
  };
  financial_summary: {
    accounts_receivable: {
      current: number;
      overdue: number;
      overdue_percentage: number;
    };
    accounts_payable: {
      current: number;
      due_soon: number;
      due_soon_percentage: number;
    };
    cash_position: {
      bank_accounts: number;
      cash: number;
      total: number;
    };
  };
  alerts: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
}

const KPICard: React.FC<{
  title: string;
  data: KPIData;
  format?: (value: number) => string;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, data, format = (v) => v.toLocaleString('es-CL'), icon, color = 'primary.main' }) => {
  const isPositive = data.trend === 'up' && data.change > 0;
  const changeColor = isPositive ? 'success.main' : 'error.main';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: color,
              color: 'white',
              borderRadius: 1,
              p: 1,
            }}
          >
            {icon}
          </Box>
          <Chip
            label={`${data.change > 0 ? '+' : ''}${data.change.toFixed(1)}%`}
            color={isPositive ? 'success' : 'error'}
            size="small"
            icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
          />
        </Box>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
          {format(data.current)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Anterior: {format(data.previous)}
        </Typography>
      </CardContent>
    </Card>
  );
};

const ExecutiveDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<ExecutiveDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, [dateFrom, dateTo]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`http://localhost:5000/api/dashboard/executive?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        console.error('Error fetching dashboard');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => `$${value.toLocaleString('es-CL')}`;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Cargando dashboard ejecutivo...</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Error cargando datos del dashboard</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Dashboard Ejecutivo
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Desde</InputLabel>
            <Select
              value={dateFrom}
              label="Desde"
              onChange={(e) => setDateFrom(e.target.value)}
            >
              <MenuItem value="">Todo</MenuItem>
              <MenuItem value={new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]}>
                Año actual
              </MenuItem>
              <MenuItem value={new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0]}>
                Últimos 3 meses
              </MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Hasta</InputLabel>
            <Select
              value={dateTo}
              label="Hasta"
              onChange={(e) => setDateTo(e.target.value)}
            >
              <MenuItem value="">Hoy</MenuItem>
              <MenuItem value={new Date().toISOString().split('T')[0]}>Hoy</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Alertas */}
      {data.alerts && data.alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {data.alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.type === 'warning' ? 'warning' : alert.type === 'error' ? 'error' : 'info'}
              sx={{ mb: 1 }}
              icon={<WarningIcon />}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* KPIs Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Ingresos Totales"
            data={data.kpis.total_revenue}
            format={formatCurrency}
            icon={<MoneyIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Gastos Totales"
            data={data.kpis.total_expenses}
            format={formatCurrency}
            icon={<MoneyIcon />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Utilidad Neta"
            data={data.kpis.net_profit}
            format={formatCurrency}
            icon={<TrendingUpIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Margen de Utilidad"
            data={data.kpis.profit_margin}
            format={(v) => `${v.toFixed(1)}%`}
            icon={<AssessmentIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Proyectos Activos"
            data={data.kpis.active_projects}
            format={(v) => v.toString()}
            icon={<ProjectIcon />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Facturas Pendientes"
            data={data.kpis.pending_invoices}
            format={(v) => v.toString()}
            icon={<NotificationsIcon />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Valor Inventario"
            data={data.kpis.inventory_value}
            format={formatCurrency}
            icon={<InventoryIcon />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Flujo de Caja"
            data={data.kpis.cash_flow}
            format={formatCurrency}
            icon={<MoneyIcon />}
            color="success.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Análisis de Ventas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ventas por Mes
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mes</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                      <TableCell align="right">Facturas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.sales_analysis.by_month.map((month, index) => (
                      <TableRow key={index}>
                        <TableCell>{month.month}</TableCell>
                        <TableCell align="right">{formatCurrency(month.revenue)}</TableCell>
                        <TableCell align="right">{month.invoices}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Ventas por Categoría */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ventas por Categoría
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoría</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                      <TableCell align="right">%</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.sales_analysis.by_category.map((cat, index) => (
                      <TableRow key={index}>
                        <TableCell>{cat.category}</TableCell>
                        <TableCell align="right">{formatCurrency(cat.revenue)}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <LinearProgress
                              variant="determinate"
                              value={cat.percentage}
                              sx={{ width: 60, mr: 1 }}
                            />
                            {cat.percentage}%
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumen Financiero */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen Financiero
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cuentas por Cobrar
                </Typography>
                <Typography variant="h6">{formatCurrency(data.financial_summary.accounts_receivable.current)}</Typography>
                <Typography variant="body2" color="error">
                  Vencidas: {formatCurrency(data.financial_summary.accounts_receivable.overdue)} ({data.financial_summary.accounts_receivable.overdue_percentage.toFixed(1)}%)
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cuentas por Pagar
                </Typography>
                <Typography variant="h6">{formatCurrency(data.financial_summary.accounts_payable.current)}</Typography>
                <Typography variant="body2" color="warning.main">
                  Por vencer: {formatCurrency(data.financial_summary.accounts_payable.due_soon)} ({data.financial_summary.accounts_payable.due_soon_percentage.toFixed(1)}%)
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Posición de Caja
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(data.financial_summary.cash_position.total)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Rentabilidad de Proyectos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rentabilidad de Proyectos
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Margen Promedio: <strong>{data.profitability_analysis.average_margin.toFixed(1)}%</strong>
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={`${data.profitability_analysis.projects_over_budget} sobre presupuesto`}
                  color="error"
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={`${data.profitability_analysis.projects_under_budget} bajo presupuesto`}
                  color="success"
                />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Proyecto</TableCell>
                      <TableCell align="right">Margen</TableCell>
                      <TableCell align="right">Ingresos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.profitability_analysis.top_profitable_projects.map((project, index) => (
                      <TableRow key={index}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${project.margin.toFixed(1)}%`}
                            color={project.margin > 30 ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{formatCurrency(project.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExecutiveDashboard;


