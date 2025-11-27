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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface DashboardData {
  clients: {
    total: number;
    active: number;
    potential: number;
  };
  invoices: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    total_value: number;
    paid_value: number;
    pending_value: number;
  };
  purchaseInvoices: {
    total: number;
    paid: number;
    pending: number;
    total_value: number;
  };
  accounting: {
    total_revenue: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
  };
}

const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: { value: number; isPositive: boolean };
}> = ({ title, value, icon, color = 'primary.main', trend }) => {
  const isPositive = trend?.isPositive ?? true;
  const trendColor = isPositive ? 'success.main' : 'error.main';

  return (
    <Card sx={{ height: '100%', border: '1px solid #e8eaed' }}>
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
          {trend && (
            <Chip
              label={`${trend.isPositive ? '+' : ''}${trend.value.toFixed(1)}%`}
              color={isPositive ? 'success' : 'error'}
              size="small"
              icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
            />
          )}
        </Box>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }} gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const ExecutiveDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos de múltiples endpoints
      const [clientsRes, invoicesRes, purchaseInvoicesRes, accountingRes] = await Promise.allSettled([
        axios.get('/clients?limit=100'),
        axios.get('/invoices?limit=100'),
        axios.get('/purchase-invoices?limit=100'),
        axios.get('/accounting/balance-sheet'),
      ]);

      // Procesar clientes
      let clients = { total: 0, active: 0, potential: 0 };
      if (clientsRes.status === 'fulfilled' && clientsRes.value.data.success) {
        const clientsData = clientsRes.value.data.data;
        clients = {
          total: clientsRes.value.data.pagination?.total || clientsData.length,
          active: clientsData.filter((c: any) => c.status === 'active').length,
          potential: clientsData.filter((c: any) => c.status === 'potential').length,
        };
      }

      // Procesar facturas de venta
      let invoices = {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        total_value: 0,
        paid_value: 0,
        pending_value: 0,
      };
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value.data.success) {
        const invoicesData = invoicesRes.value.data.data;
        const today = new Date();
        invoices = {
          total: invoicesRes.value.data.pagination?.total || invoicesData.length,
          paid: invoicesData.filter((i: any) => i.status === 'paid').length,
          pending: invoicesData.filter((i: any) => i.status === 'sent' || i.status === 'pending').length,
          overdue: invoicesData.filter((i: any) => {
            const dueDate = new Date(i.due_date);
            return (i.status === 'sent' || i.status === 'pending') && dueDate < today;
          }).length,
          total_value: invoicesData.reduce((sum: number, i: any) => sum + (i.total || 0), 0),
          paid_value: invoicesData
            .filter((i: any) => i.status === 'paid')
            .reduce((sum: number, i: any) => sum + (i.total || 0), 0),
          pending_value: invoicesData
            .filter((i: any) => i.status === 'sent' || i.status === 'pending')
            .reduce((sum: number, i: any) => sum + (i.total || 0), 0),
        };
      }

      // Procesar facturas de compra
      let purchaseInvoices = { total: 0, paid: 0, pending: 0, total_value: 0 };
      if (purchaseInvoicesRes.status === 'fulfilled' && purchaseInvoicesRes.value.data.success) {
        const purchaseData = purchaseInvoicesRes.value.data.data;
        purchaseInvoices = {
          total: purchaseInvoicesRes.value.data.pagination?.total || purchaseData.length,
          paid: purchaseData.filter((i: any) => i.status === 'paid').length,
          pending: purchaseData.filter((i: any) => i.status === 'pending' || i.status === 'approved').length,
          total_value: purchaseData.reduce((sum: number, i: any) => sum + (i.total || 0), 0),
        };
      }

      // Procesar contabilidad
      let accounting = {
        total_revenue: invoices.paid_value,
        total_expenses: purchaseInvoices.total_value,
        net_profit: 0,
        profit_margin: 0,
      };
      if (accountingRes.status === 'fulfilled' && accountingRes.value.data.success) {
        const balanceSheet = accountingRes.value.data.data;
        // Calcular ingresos desde el balance sheet (cuentas de ingresos)
        const revenueAccounts = Object.values(balanceSheet.equity || {}).reduce(
          (sum: number, acc: any) => sum + (acc.balance || 0),
          0
        );
        accounting.total_revenue = revenueAccounts || invoices.paid_value;
      }

      accounting.net_profit = accounting.total_revenue - accounting.total_expenses;
      accounting.profit_margin =
        accounting.total_revenue > 0
          ? (accounting.net_profit / accounting.total_revenue) * 100
          : 0;

      setData({
        clients,
        invoices,
        purchaseInvoices,
        accounting,
      });
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      setError('Error cargando datos del dashboard');
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

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error || 'Error cargando datos del dashboard. Asegúrate de que el servidor esté corriendo.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        Dashboard Ejecutivo
      </Typography>

      {/* KPIs Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Ingresos Totales"
            value={formatCurrency(data.accounting.total_revenue)}
            icon={<MoneyIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Gastos Totales"
            value={formatCurrency(data.accounting.total_expenses)}
            icon={<MoneyIcon />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Utilidad Neta"
            value={formatCurrency(data.accounting.net_profit)}
            icon={<TrendingUpIcon />}
            color={data.accounting.net_profit >= 0 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Margen de Utilidad"
            value={`${data.accounting.profit_margin.toFixed(1)}%`}
            icon={<AssessmentIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Clientes Activos"
            value={data.clients.active}
            icon={<PeopleIcon />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Facturas Pendientes"
            value={data.invoices.pending}
            icon={<ReceiptIcon />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Facturas Vencidas"
            value={data.invoices.overdue}
            icon={<ReceiptIcon />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Por Cobrar"
            value={formatCurrency(data.invoices.pending_value)}
            icon={<AccountBalanceIcon />}
            color="info.main"
          />
        </Grid>
      </Grid>

      {/* Resumen Financiero */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen de Facturación
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Facturado</TableCell>
                      <TableCell align="right">{formatCurrency(data.invoices.total_value)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Facturas Pagadas</TableCell>
                      <TableCell align="right">
                        {data.invoices.paid} ({formatCurrency(data.invoices.paid_value)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Facturas Pendientes</TableCell>
                      <TableCell align="right">
                        {data.invoices.pending} ({formatCurrency(data.invoices.pending_value)})
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Facturas Vencidas</TableCell>
                      <TableCell align="right">{data.invoices.overdue}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen de Compras
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell>Total Facturas Compra</TableCell>
                      <TableCell align="right">{data.purchaseInvoices.total}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Total Valor</TableCell>
                      <TableCell align="right">{formatCurrency(data.purchaseInvoices.total_value)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pagadas</TableCell>
                      <TableCell align="right">{data.purchaseInvoices.paid}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Pendientes</TableCell>
                      <TableCell align="right">{data.purchaseInvoices.pending}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resumen de Clientes */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Resumen de Clientes
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="h4" sx={{ 
                  background: 'linear-gradient(87deg, #5e72e4 0, #825ee4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                  {data.clients.total}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Total Clientes
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                <Typography variant="h4" color="success.main">
                  {data.clients.active}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Clientes Activos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="h4" sx={{ color: '#fb6340' }}>
                  {data.clients.potential}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Clientes Potenciales
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ExecutiveDashboard;
