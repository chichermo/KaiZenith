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

const COLORS = ['#5e72e4', '#2dce89', '#fb6340', '#f5365c', '#11cdef', '#825ee4'];

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
    <Card sx={{ 
      height: '100%', 
      border: 'none', 
      transition: 'all 0.3s ease', 
      background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)',
      borderRadius: 4,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)',
      '&:hover': { 
        boxShadow: '0 1.5rem 3rem rgba(94, 114, 228, 0.5)',
        transform: 'translateY(-8px)',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 6,
        background: `linear-gradient(87deg, ${color} 0, ${color}dd 100%)`,
        zIndex: 1,
      },
    }}>
      <CardContent sx={{ p: 2.5, position: 'relative', zIndex: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="overline" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.688rem', fontWeight: 600, letterSpacing: '0.1em' }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mt: 0.5, mb: 0.5, fontSize: '1.75rem' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', fontWeight: 500 }}>
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                {trend.isPositive ? (
                  <TrendingUpIcon sx={{ fontSize: 16, color: '#2dce89', mr: 0.5 }} />
                ) : (
                  <TrendingDownIcon sx={{ fontSize: 16, color: '#f5365c', mr: 0.5 }} />
                )}
                <Typography variant="caption" sx={{ color: trend.isPositive ? '#2dce89' : '#f5365c', fontWeight: 600, fontSize: '0.813rem' }}>
                  {trend.isPositive ? '+' : ''}{trend.value.toFixed(1)}%
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', ml: 0.5, fontSize: '0.75rem' }}>
                  vs período anterior
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              background: `linear-gradient(87deg, ${color} 0, ${color}dd 100%)`,
              color: 'white',
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 56,
              height: 56,
              boxShadow: `0 4px 6px ${color}40`,
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
          <Typography variant="h4" sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(87deg, #ffffff 0, rgba(255, 255, 255, 0.9) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 0.5 
          }}>
            Dashboard Profesional
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
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
            color="#2dce89"
            trend={{ value: 12.5, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Gastos Totales"
            value={`$${data.financial.total_expenses.toLocaleString('es-CL')}`}
            icon={<ShoppingCartIcon />}
            color="#f5365c"
            trend={{ value: -5.2, isPositive: false }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Utilidad Neta"
            value={`$${data.financial.net_profit.toLocaleString('es-CL')}`}
            subtitle={`Margen: ${data.financial.profit_margin.toFixed(1)}%`}
            icon={<TrendingUpIcon />}
            color="#5e72e4"
            trend={{ value: 18.3, isPositive: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Flujo de Caja"
            value={`$${data.financial.cash_flow.toLocaleString('es-CL')}`}
            icon={<AccountBalanceIcon />}
            color="#11cdef"
            trend={{ value: 8.7, isPositive: true }}
          />
        </Grid>
      </Grid>

      {/* Gráficos Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Gráfico de Ingresos vs Gastos */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                  Ingresos vs Gastos
                </Typography>
                <Chip 
                  icon={<LineChartIcon />} 
                  label="Tendencia" 
                  size="small" 
                  sx={{ 
                    background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
                    color: 'white',
                    fontWeight: 600,
                  }} 
                />
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueExpenseData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dce89" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#2dce89" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f5365c" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f5365c" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5e72e4" stopOpacity={0.1} />
                      <stop offset="50%" stopColor="#825ee4" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="#f5365c" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="date" stroke="#8898aa" fontSize={12} />
                  <YAxis stroke="#8898aa" fontSize={12} />
                  <RechartsTooltip
                    formatter={(value: number) => `$${value.toLocaleString('es-CL')}`}
                    contentStyle={{ 
                      backgroundColor: '#1a2742', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: 8,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)',
                      color: '#ffffff',
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Ingresos" stroke="#2dce89" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="Gastos" stroke="#f5365c" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Estado de Facturas */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#ffffff' }}>
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
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {invoiceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ 
                      backgroundColor: '#1a2742', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      borderRadius: 8,
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.5)',
                      color: '#ffffff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {invoiceStatusData.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, p: 1, borderRadius: 1, '&:hover': { background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.2) 0%, rgba(130, 94, 228, 0.2) 100%)' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: COLORS[index],
                          mr: 1.5,
                          boxShadow: `0 2px 4px ${COLORS[index]}40`,
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)' }}>{item.name}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ffffff' }}>
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
          <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#ffffff' }}>
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
                            <Typography sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{client.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>{client.invoices}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#ffffff' }}>
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
          <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#ffffff' }}>
                Resumen Contable
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, p: 1.5, borderRadius: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Activos</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    ${data.accounting.assets.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, p: 1.5, borderRadius: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Pasivos</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    ${data.accounting.liabilities.toLocaleString('es-CL')}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.1)' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, borderRadius: 1, background: 'linear-gradient(135deg, rgba(94, 114, 228, 0.2) 0%, rgba(130, 94, 228, 0.2) 100%)' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                    Patrimonio
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#ffffff' }}>
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
          <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', textAlign: 'center', transition: 'all 0.3s ease', boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 1.5rem 3rem rgba(94, 114, 228, 0.5)' } }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
                boxShadow: '0 4px 6px rgba(94, 114, 228, 0.3)',
              }}>
                <PeopleIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff', mb: 0.5 }}>
                {data.clients.total}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
                Total Clientes
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                {data.clients.new_this_month} nuevos este mes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e9ecef', borderRadius: 2, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 0.75rem 1.5rem rgba(0, 0, 0, 0.1)' } }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                background: 'linear-gradient(87deg, #2dce89 0, #1aae6e 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
                boxShadow: '0 4px 6px rgba(45, 206, 137, 0.3)',
              }}>
                <ReceiptIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                mb: 0.5 
              }}>
                {data.invoices.total}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                Facturas Emitidas
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                {data.invoices.overdue} vencidas
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e9ecef', borderRadius: 2, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 0.75rem 1.5rem rgba(0, 0, 0, 0.1)' } }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                background: 'linear-gradient(87deg, #fb6340 0, #e04a2a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
                boxShadow: '0 4px 6px rgba(251, 99, 64, 0.3)',
              }}>
                <ShoppingCartIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                mb: 0.5 
              }}>
                {data.purchaseInvoices.total}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                Facturas de Compra
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
                {data.purchaseInvoices.pending} pendientes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e9ecef', borderRadius: 2, textAlign: 'center', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 0.75rem 1.5rem rgba(0, 0, 0, 0.1)' } }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                background: 'linear-gradient(87deg, #11cdef 0, #0da5c0 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
                boxShadow: '0 4px 6px rgba(17, 205, 239, 0.3)',
              }}>
                <AssessmentIcon sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#ffffff',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                mb: 0.5 
              }}>
                {data.financial.profit_margin.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                Margen de Utilidad
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mt: 0.5, fontSize: '0.75rem' }}>
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

