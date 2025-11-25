import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalance as AccountBalanceIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import axios from 'axios';

interface DashboardData {
  financial: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    cash_flow: number;
  };
  clients: {
    total: number;
    active: number;
    potential: number;
    new_this_month: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    total_value: number;
    paid_value: number;
    pending_value: number;
    overdue_value: number;
  };
  purchaseInvoices: {
    total: number;
    paid: number;
    pending: number;
    total_value: number;
  };
  accounting: {
    assets: number;
    liabilities: number;
    equity: number;
  };
  trends: {
    revenue: Array<{ date: string; value: number }>;
    expenses: Array<{ date: string; value: number }>;
    invoices: Array<{ date: string; count: number; value: number }>;
  };
  topClients: Array<{ name: string; total: number; invoices: number }>;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}

const COLORS = ['#0d47a1', '#2e7d32', '#f57c00', '#c62828', '#7b1fa2', '#00838f'];

const ProfessionalDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [clientsRes, invoicesRes, purchaseInvoicesRes, accountingRes] = await Promise.allSettled([
        axios.get('/clients?limit=100'),
        axios.get('/invoices?limit=100'),
        axios.get('/purchase-invoices?limit=100'),
        axios.get('/accounting/balance-sheet'),
      ]);

      // Procesar datos
      const clients = clientsRes.status === 'fulfilled' ? clientsRes.value.data.data || [] : [];
      const invoices = invoicesRes.status === 'fulfilled' ? invoicesRes.value.data.data || [] : [];
      const purchaseInvoices = purchaseInvoicesRes.status === 'fulfilled' ? purchaseInvoicesRes.value.data.data || [] : [];
      const accounting = accountingRes.status === 'fulfilled' ? accountingRes.value.data.data || {} : {};

      // Calcular totales financieros
      const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const totalExpenses = purchaseInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Generar datos de tendencias (simulado)
      const trends = generateTrendData(period);

      // Top clientes
      const clientTotals: { [key: string]: { name: string; total: number; invoices: number } } = {};
      invoices.forEach((inv: any) => {
        const clientName = inv.client_name || 'Sin nombre';
        if (!clientTotals[clientName]) {
          clientTotals[clientName] = { name: clientName, total: 0, invoices: 0 };
        }
        clientTotals[clientName].total += inv.total || 0;
        clientTotals[clientName].invoices += 1;
      });
      const topClients = Object.values(clientTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      const dashboardData: DashboardData = {
        financial: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_profit: netProfit,
          profit_margin: profitMargin,
          cash_flow: totalRevenue - totalExpenses,
        },
        clients: {
          total: clients.length,
          active: clients.filter((c: any) => c.status === 'active').length,
          potential: clients.filter((c: any) => c.status === 'potential').length,
          new_this_month: clients.filter((c: any) => {
            const created = new Date(c.created_at);
            const now = new Date();
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }).length,
        },
        invoices: {
          total: invoices.length,
          paid: invoices.filter((i: any) => i.status === 'paid').length,
          pending: invoices.filter((i: any) => i.status === 'sent' || i.status === 'pending').length,
          overdue: invoices.filter((i: any) => {
            if (i.status === 'paid') return false;
            const dueDate = new Date(i.due_date || i.date);
            return dueDate < new Date();
          }).length,
          total_value: totalRevenue,
          paid_value: invoices.filter((i: any) => i.status === 'paid').reduce((sum: number, i: any) => sum + (i.total || 0), 0),
          pending_value: invoices.filter((i: any) => i.status === 'sent' || i.status === 'pending').reduce((sum: number, i: any) => sum + (i.total || 0), 0),
          overdue_value: invoices.filter((i: any) => {
            if (i.status === 'paid') return false;
            const dueDate = new Date(i.due_date || i.date);
            return dueDate < new Date();
          }).reduce((sum: number, i: any) => sum + (i.total || 0), 0),
        },
        purchaseInvoices: {
          total: purchaseInvoices.length,
          paid: purchaseInvoices.filter((i: any) => i.status === 'paid').length,
          pending: purchaseInvoices.filter((i: any) => i.status === 'pending' || i.status === 'approved').length,
          total_value: totalExpenses,
        },
        accounting: {
          assets: accounting.assets?.total || 0,
          liabilities: accounting.liabilities?.total || 0,
          equity: accounting.equity?.total || 0,
        },
        trends,
        topClients,
        topProducts: [],
      };

      setData(dashboardData);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateTrendData = (period: string) => {
    const data: { revenue: Array<{ date: string; value: number }>; expenses: Array<{ date: string; value: number }>; invoices: Array<{ date: string; count: number; value: number }> } = {
      revenue: [],
      expenses: [],
      invoices: [],
    };

    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '90d') days = 90;
    else if (period === '12m') days = 365;

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      data.revenue.push({
        date: dateStr,
        value: Math.random() * 1000000 + 500000,
      });
      data.expenses.push({
        date: dateStr,
        value: Math.random() * 500000 + 200000,
      });
      data.invoices.push({
        date: dateStr,
        count: Math.floor(Math.random() * 10) + 1,
        value: Math.random() * 500000 + 200000,
      });
    }

    return data;
  };

  const KPICard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }> = ({ title, value, subtitle, icon, color, trend }) => (
    <Card sx={{ height: '100%', border: '1px solid #e8eaed', transition: 'all 0.3s ease', '&:hover': { boxShadow: 4 } }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: '#78909c', fontSize: '0.688rem', fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: '#212121', mt: 0.5, mb: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#78909c', fontSize: '0.75rem' }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend.isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: '#2e7d32', mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: '#c62828', mr: 0.5 }} />
                )}
                <Typography variant="caption" sx={{ color: trend.isPositive ? '#2e7d32' : '#c62828', fontWeight: 500 }}>
                  {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#78909c', ml: 0.5 }}>
                  vs período anterior
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              color: 'white',
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              height: 48,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Cargando dashboard...</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">Error al cargar los datos del dashboard</Typography>
        <Button onClick={fetchDashboardData} sx={{ mt: 2 }}>Reintentar</Button>
      </Box>
    );
  }

  const revenueExpenseData = data.trends.revenue.map((r, i) => ({
    date: format(new Date(r.date), 'dd/MM'),
    Ingresos: r.value,
    Gastos: data.trends.expenses[i]?.value || 0,
  }));

  const invoiceStatusData = [
    { name: 'Pagadas', value: data.invoices.paid, amount: data.invoices.paid_value },
    { name: 'Pendientes', value: data.invoices.pending, amount: data.invoices.pending_value },
    { name: 'Vencidas', value: data.invoices.overdue, amount: data.invoices.overdue_value },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#212121', mb: 0.5 }}>
            Dashboard Profesional
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Última actualización: {format(lastRefresh, "dd 'de' MMMM 'a las' HH:mm")}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Período</InputLabel>
            <Select value={period} onChange={(e) => setPeriod(e.target.value as any)} label="Período">
              <MenuItem value="7d">Últimos 7 días</MenuItem>
              <MenuItem value="30d">Últimos 30 días</MenuItem>
              <MenuItem value="90d">Últimos 90 días</MenuItem>
              <MenuItem value="12m">Últimos 12 meses</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Actualizar datos">
            <IconButton onClick={fetchDashboardData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<DownloadIcon />} size="small">
            Exportar
          </Button>
        </Box>
      </Box>

      {/* KPIs Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Ingresos Totales"
            value={`$${data.financial.total_revenue.toLocaleString('es-CL')}`}
            icon={<MoneyIcon />}
            color="#2e7d32"
            trend={{ value: 12.5, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Gastos Totales"
            value={`$${data.financial.total_expenses.toLocaleString('es-CL')}`}
            icon={<ShoppingCartIcon />}
            color="#c62828"
            trend={{ value: -5.2, isPositive: false }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Utilidad Neta"
            value={`$${data.financial.net_profit.toLocaleString('es-CL')}`}
            subtitle={`Margen: ${data.financial.profit_margin.toFixed(1)}%`}
            icon={<TrendingUpIcon />}
            color="#0d47a1"
            trend={{ value: 18.3, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Flujo de Caja"
            value={`$${data.financial.cash_flow.toLocaleString('es-CL')}`}
            icon={<AccountBalanceIcon />}
            color="#7b1fa2"
            trend={{ value: 8.7, isPositive: true }}
          />
        </Grid>
      </Grid>

      {/* Gráficos Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Gráfico de Ingresos vs Gastos */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ border: '1px solid #e8eaed' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Ingresos vs Gastos
                </Typography>
                <Chip icon={<LineChartIcon />} label="Tendencia" size="small" />
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueExpenseData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c62828" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#c62828" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" stroke="#78909c" />
                  <YAxis stroke="#78909c" />
                  <RechartsTooltip
                    formatter={(value: number) => `$${value.toLocaleString('es-CL')}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: 4 }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Ingresos" stroke="#2e7d32" fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="Gastos" stroke="#c62828" fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Estado de Facturas */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ border: '1px solid #e8eaed' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Estado de Facturas
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {invoiceStatusData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: COLORS[index],
                          mr: 1,
                        }}
                      />
                      <Typography variant="body2">{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      ${item.amount.toLocaleString('es-CL')}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Estadísticas Secundarias */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Clientes */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid #e8eaed' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Top 5 Clientes
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Facturas</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.topClients.map((client, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                backgroundColor: COLORS[index % COLORS.length],
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 1.5,
                                fontWeight: 600,
                                fontSize: '0.875rem',
                              }}
                            >
                              {index + 1}
                            </Box>
                            {client.name}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{client.invoices}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500 }}>
                          ${client.total.toLocaleString('es-CL')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumen Contable */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: '1px solid #e8eaed' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Resumen Contable
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Activos</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                    ${data.accounting.assets.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">Pasivos</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#c62828' }}>
                    ${data.accounting.liabilities.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Patrimonio
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0d47a1' }}>
                    ${data.accounting.equity.toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Estadísticas Adicionales */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e8eaed', textAlign: 'center' }}>
            <CardContent>
              <PeopleIcon sx={{ fontSize: 40, color: '#0d47a1', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {data.clients.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Clientes
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {data.clients.new_this_month} nuevos este mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e8eaed', textAlign: 'center' }}>
            <CardContent>
              <ReceiptIcon sx={{ fontSize: 40, color: '#2e7d32', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {data.invoices.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Facturas Emitidas
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {data.invoices.overdue} vencidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e8eaed', textAlign: 'center' }}>
            <CardContent>
              <ShoppingCartIcon sx={{ fontSize: 40, color: '#f57c00', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {data.purchaseInvoices.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Facturas de Compra
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {data.purchaseInvoices.pending} pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e8eaed', textAlign: 'center' }}>
            <CardContent>
              <AssessmentIcon sx={{ fontSize: 40, color: '#7b1fa2', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                {data.financial.profit_margin.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Margen de Utilidad
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {data.financial.net_profit > 0 ? 'Rentable' : 'Pérdida'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfessionalDashboard;

