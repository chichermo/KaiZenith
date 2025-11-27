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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Divider,
  Tooltip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Description as DescriptionIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  ShowChart as ChartIcon,
  CalendarToday as CalendarIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import axios from 'axios';

interface BalanceSheet {
  date: string;
  assets: {
    current: { [key: string]: { description: string; balance: number } };
    fixed: { [key: string]: { description: string; balance: number } };
    total: number;
  };
  liabilities: {
    current: { [key: string]: { description: string; balance: number } };
    long_term: { [key: string]: { description: string; balance: number } };
    total: number;
  };
  equity: { [key: string]: { description: string; balance: number } };
  equity_total: number;
}

interface IncomeStatement {
  period: { from: string; to: string };
  revenues: { [key: string]: { balance: number; description: string } };
  costs: { [key: string]: { balance: number; description: string } };
  expenses: { [key: string]: { balance: number; description: string } };
  totals: {
    revenue: number;
    costs: number;
    expenses: number;
    gross_profit: number;
    net_income: number;
  };
}

interface GeneralLedgerEntry {
  date: string;
  entry_number: string;
  description: string;
  account: string;
  account_name: string;
  debit: number;
  credit: number;
  balance: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const AccountingReports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [balanceDate, setBalanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [generalLedger, setGeneralLedger] = useState<GeneralLedgerEntry[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');

  useEffect(() => {
    if (tabValue === 0) {
      fetchBalanceSheet();
    } else if (tabValue === 1) {
      fetchIncomeStatement();
    } else if (tabValue === 2) {
      fetchGeneralLedger();
    }
  }, [tabValue, balanceDate, dateFrom, dateTo, selectedAccount]);

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/accounting/balance-sheet?date=${balanceDate}`);
      if (response.data.success) {
        setBalanceSheet(response.data.data);
      }
    } catch (error) {
      console.error('Error obteniendo balance general:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncomeStatement = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/accounting/income-statement?date_from=${dateFrom}&date_to=${dateTo}`);
      if (response.data.success) {
        setIncomeStatement(response.data.data);
      }
    } catch (error) {
      console.error('Error obteniendo estado de resultados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneralLedger = async () => {
    try {
      setLoading(true);
      const params: any = { date_from: dateFrom, date_to: dateTo };
      if (selectedAccount) params.account = selectedAccount;
      const response = await axios.get('/accounting/general-ledger', { params });
      if (response.data.success) {
        setGeneralLedger(response.data.data || []);
      }
    } catch (error) {
      console.error('Error obteniendo libro mayor:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (type: string) => {
    try {
      let url = `/accounting/report/pdf?type=${type}`;
      if (type === 'balance-sheet') {
        url += `&date=${balanceDate}`;
      } else {
        url += `&date_from=${dateFrom}&date_to=${dateTo}`;
      }
      if (selectedAccount && type === 'general-ledger') {
        url += `&account=${selectedAccount}`;
      }

      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `reporte-${type}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(urlBlob);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exportando PDF:', error);
    }
  };

  const handleExportExcel = () => {
    // Implementar exportación a Excel
    alert('Exportación a Excel próximamente');
  };

  const renderBalanceSheet = () => {
    if (!balanceSheet) return null;

    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Balance General
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Al {format(new Date(balanceDate), "dd 'de' MMMM 'de' yyyy")}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              type="date"
              label="Fecha"
              value={balanceDate}
              onChange={(e) => setBalanceDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExportPDF('balance-sheet')}>
              PDF
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportExcel}>
              Excel
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Activos */}
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '1px solid #e8eaed' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
                  ACTIVOS
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#546e7a' }}>
                  Activos Circulantes
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cuenta</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(balanceSheet.assets.current || {}).map(([code, data]) => (
                        <TableRow key={code}>
                          <TableCell>
                            <Typography variant="body2">{code}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {data.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            ${data.balance.toLocaleString('es-CL')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2, color: '#546e7a' }}>
                  Activos Fijos
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cuenta</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(balanceSheet.assets.fixed || {}).map(([code, data]) => (
                        <TableRow key={code}>
                          <TableCell>
                            <Typography variant="body2">{code}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {data.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            ${data.balance.toLocaleString('es-CL')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Activos
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                    ${balanceSheet.assets.total.toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Pasivos y Patrimonio */}
          <Grid item xs={12} md={6}>
            <Card sx={{ border: '1px solid #e8eaed' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#c62828' }}>
                  PASIVOS
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#546e7a' }}>
                  Pasivos Circulantes
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cuenta</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(balanceSheet.liabilities.current || {}).map(([code, data]) => (
                        <TableRow key={code}>
                          <TableCell>
                            <Typography variant="body2">{code}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {data.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            ${data.balance.toLocaleString('es-CL')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2, color: '#546e7a' }}>
                  Pasivos a Largo Plazo
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cuenta</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(balanceSheet.liabilities.long_term || {}).map(([code, data]) => (
                        <TableRow key={code}>
                          <TableCell>
                            <Typography variant="body2">{code}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {data.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            ${data.balance.toLocaleString('es-CL')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Pasivos
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#c62828' }}>
                    ${balanceSheet.liabilities.total.toLocaleString('es-CL')}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#0d47a1' }}>
                  PATRIMONIO
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cuenta</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(balanceSheet.equity || {}).map(([code, data]) => (
                        <TableRow key={code}>
                          <TableCell>
                            <Typography variant="body2">{code}</Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              {data.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 500 }}>
                            ${data.balance.toLocaleString('es-CL')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Patrimonio
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#0d47a1' }}>
                    ${balanceSheet.equity_total.toLocaleString('es-CL')}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                    Total Pasivos + Patrimonio
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffffff' }}>
                    ${(balanceSheet.liabilities.total + balanceSheet.equity_total).toLocaleString('es-CL')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderIncomeStatement = () => {
    if (!incomeStatement) return null;

    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Estado de Resultados
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Del {format(new Date(dateFrom), "dd 'de' MMMM 'de' yyyy")} al{' '}
              {format(new Date(dateTo), "dd 'de' MMMM 'de' yyyy")}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              type="date"
              label="Desde"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="Hasta"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExportPDF('income-statement')}>
              PDF
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportExcel}>
              Excel
            </Button>
          </Box>
        </Box>

        <Card sx={{ border: '1px solid #e8eaed' }}>
          <CardContent>
            {/* Ingresos */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2e7d32' }}>
              INGRESOS
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cuenta</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(incomeStatement.revenues || {}).map(([code, data]) => (
                    <TableRow key={code}>
                      <TableCell>{code}</TableCell>
                      <TableCell>{data.description}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        ${data.balance.toLocaleString('es-CL')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 3 }}>
              <Box sx={{ minWidth: 300, borderTop: '2px solid #2e7d32', pt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'right' }}>
                  Total Ingresos: ${incomeStatement.totals.revenue.toLocaleString('es-CL')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Costos */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#f57c00' }}>
              COSTOS DE VENTAS
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cuenta</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(incomeStatement.costs || {}).map(([code, data]) => (
                    <TableRow key={code}>
                      <TableCell>{code}</TableCell>
                      <TableCell>{data.description}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        ${data.balance.toLocaleString('es-CL')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 3 }}>
              <Box sx={{ minWidth: 300, borderTop: '2px solid #f57c00', pt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'right' }}>
                  Total Costos: ${incomeStatement.totals.costs.toLocaleString('es-CL')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Utilidad Bruta */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Box sx={{ minWidth: 300 }}>
                <Typography variant="h5" sx={{ fontWeight: 600, textAlign: 'right', color: '#0d47a1' }}>
                  Utilidad Bruta: ${incomeStatement.totals.gross_profit.toLocaleString('es-CL')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Gastos */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#c62828' }}>
              GASTOS OPERACIONALES
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cuenta</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(incomeStatement.expenses || {}).map(([code, data]) => (
                    <TableRow key={code}>
                      <TableCell>{code}</TableCell>
                      <TableCell>{data.description}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        ${data.balance.toLocaleString('es-CL')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, mb: 3 }}>
              <Box sx={{ minWidth: 300, borderTop: '2px solid #c62828', pt: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'right' }}>
                  Total Gastos: ${incomeStatement.totals.expenses.toLocaleString('es-CL')}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Utilidad Neta */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 3, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Box sx={{ minWidth: 300 }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 600, 
                  textAlign: 'right', 
                  color: incomeStatement.totals.net_income >= 0 ? '#2dce89' : '#f5365c',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}>
                  Utilidad Neta: ${incomeStatement.totals.net_income.toLocaleString('es-CL')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderGeneralLedger = () => {
    return (
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              Libro Mayor
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Del {format(new Date(dateFrom), "dd 'de' MMMM 'de' yyyy")} al{' '}
              {format(new Date(dateTo), "dd 'de' MMMM 'de' yyyy")}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              type="date"
              label="Desde"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="Hasta"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Cuenta (opcional)"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              size="small"
              placeholder="Ej: 1101"
            />
            <Button variant="outlined" startIcon={<PdfIcon />} onClick={() => handleExportPDF('general-ledger')}>
              PDF
            </Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportExcel}>
              Excel
            </Button>
          </Box>
        </Box>

        <Card sx={{ border: '1px solid #e8eaed' }}>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>N° Asiento</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Cuenta</TableCell>
                    <TableCell>Nombre Cuenta</TableCell>
                    <TableCell align="right">Débito</TableCell>
                    <TableCell align="right">Crédito</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generalLedger.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography sx={{ py: 3, color: 'rgba(255, 255, 255, 0.7)' }}>
                          No hay movimientos para el período seleccionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    generalLedger.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{format(new Date(entry.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>{entry.entry_number}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>{entry.account}</TableCell>
                        <TableCell>{entry.account_name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: entry.debit > 0 ? 500 : 400 }}>
                          {entry.debit > 0 ? `$${entry.debit.toLocaleString('es-CL')}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: entry.credit > 0 ? 500 : 400 }}>
                          {entry.credit > 0 ? `$${entry.credit.toLocaleString('es-CL')}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ${entry.balance.toLocaleString('es-CL')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
          Reportes Contables
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          Reportes financieros detallados para auditoría y análisis contable
        </Typography>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Paper sx={{ border: '1px solid #e8eaed' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: '1px solid #e8eaed' }}
        >
          <Tab icon={<AccountBalanceIcon />} label="Balance General" iconPosition="start" />
          <Tab icon={<AssessmentIcon />} label="Estado de Resultados" iconPosition="start" />
          <Tab icon={<DescriptionIcon />} label="Libro Mayor" iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {renderBalanceSheet()}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {renderIncomeStatement()}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          {renderGeneralLedger()}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AccountingReports;

