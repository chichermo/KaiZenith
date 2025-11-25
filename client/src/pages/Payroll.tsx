import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Tabs,
  Tab,
  Divider,
  Alert,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import axios from 'axios';

interface Employee {
  id: number;
  rut: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  base_salary: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface PayrollEntry {
  id: number;
  employee_id: number;
  employee_name: string;
  period: string; // YYYY-MM
  base_salary: number;
  overtime_hours: number;
  overtime_amount: number;
  bonuses: number;
  allowances: number;
  gross_salary: number;
  afp: number; // 10% o 12.5%
  health: number; // 7% o 0% (FONASA)
  income_tax: number; // Impuesto a la renta
  other_deductions: number;
  net_salary: number;
  status: 'draft' | 'approved' | 'paid';
  payment_date?: string;
  created_at: string;
  updated_at: string;
}

const Payroll: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [openPayrollDialog, setOpenPayrollDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingPayroll, setEditingPayroll] = useState<PayrollEntry | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [employeeForm, setEmployeeForm] = useState({
    rut: '',
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    hire_date: '',
    base_salary: 0,
    status: 'active' as 'active' | 'inactive',
  });
  const [payrollForm, setPayrollForm] = useState({
    employee_id: '',
    period: format(new Date(), 'yyyy-MM'),
    overtime_hours: 0,
    bonuses: 0,
    allowances: 0,
    other_deductions: 0,
  });

  useEffect(() => {
    fetchEmployees();
    fetchPayrollEntries();
  }, [selectedPeriod]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Mock data por ahora
      const mockEmployees: Employee[] = [
        {
          id: 1,
          rut: '12.345.678-9',
          name: 'Juan Pérez',
          email: 'juan.perez@empresa.cl',
          phone: '+56 9 1234 5678',
          position: 'Obrero',
          department: 'Construcción',
          hire_date: '2023-01-15',
          base_salary: 500000,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          rut: '98.765.432-1',
          name: 'María González',
          email: 'maria.gonzalez@empresa.cl',
          phone: '+56 9 8765 4321',
          position: 'Supervisora',
          department: 'Construcción',
          hire_date: '2022-06-01',
          base_salary: 800000,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setEmployees(mockEmployees);
    } catch (error) {
      console.error('Error cargando empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayrollEntries = async () => {
    try {
      // Mock data
      const mockPayroll: PayrollEntry[] = [];
      setPayrollEntries(mockPayroll);
    } catch (error) {
      console.error('Error cargando nómina:', error);
    }
  };

  const calculatePayroll = (employee: Employee, formData: typeof payrollForm): PayrollEntry => {
    const baseSalary = employee.base_salary;
    const overtimeRate = baseSalary / 30 / 8 * 1.5; // 1.5x por hora extra
    const overtimeAmount = formData.overtime_hours * overtimeRate;
    const grossSalary = baseSalary + overtimeAmount + formData.bonuses + formData.allowances;

    // AFP: 10% o 12.5% (simulado como 10%)
    const afp = grossSalary * 0.1;

    // Salud: 7% (FONASA) o 0% si tiene isapre
    const health = grossSalary * 0.07;

    // Impuesto a la renta (simplificado)
    let incomeTax = 0;
    const taxableIncome = grossSalary - afp - health;
    if (taxableIncome > 1500000) {
      incomeTax = (taxableIncome - 1500000) * 0.08; // 8% sobre excedente
    }

    const totalDeductions = afp + health + incomeTax + formData.other_deductions;
    const netSalary = grossSalary - totalDeductions;

    return {
      id: editingPayroll?.id || 0,
      employee_id: employee.id,
      employee_name: employee.name,
      period: formData.period,
      base_salary: baseSalary,
      overtime_hours: formData.overtime_hours,
      overtime_amount: overtimeAmount,
      bonuses: formData.bonuses,
      allowances: formData.allowances,
      gross_salary: grossSalary,
      afp,
      health,
      income_tax: incomeTax,
      other_deductions: formData.other_deductions,
      net_salary: netSalary,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleCreatePayroll = () => {
    setEditingPayroll(null);
    setPayrollForm({
      employee_id: '',
      period: selectedPeriod,
      overtime_hours: 0,
      bonuses: 0,
      allowances: 0,
      other_deductions: 0,
    });
    setOpenPayrollDialog(true);
  };

  const handleSavePayroll = () => {
    const employee = employees.find((e) => e.id === parseInt(payrollForm.employee_id));
    if (!employee) return;

    const payroll = calculatePayroll(employee, payrollForm);
    if (editingPayroll) {
      setPayrollEntries(payrollEntries.map((p) => (p.id === editingPayroll.id ? payroll : p)));
    } else {
      payroll.id = Math.max(...payrollEntries.map((p) => p.id), 0) + 1;
      setPayrollEntries([...payrollEntries, payroll]);
    }
    setOpenPayrollDialog(false);
  };

  const handleSaveEmployee = () => {
    if (editingEmployee) {
      setEmployees(employees.map((e) => (e.id === editingEmployee.id ? { ...editingEmployee, ...employeeForm } : e)));
    } else {
      const newEmployee: Employee = {
        id: Math.max(...employees.map((e) => e.id), 0) + 1,
        ...employeeForm,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setEmployees([...employees, newEmployee]);
    }
    setOpenEmployeeDialog(false);
  };

  const selectedEmployee = employees.find((e) => e.id === parseInt(payrollForm.employee_id));
  const previewPayroll = selectedEmployee ? calculatePayroll(selectedEmployee, payrollForm) : null;

  const filteredPayroll = payrollEntries.filter((p) => p.period === selectedPeriod);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
            Recursos Humanos - Nómina
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de empleados y cálculo de nómina
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {tabValue === 0 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenEmployeeDialog(true)}>
              Nuevo Empleado
            </Button>
          )}
          {tabValue === 1 && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreatePayroll}>
              Nueva Nómina
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ border: '1px solid #e8eaed' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ borderBottom: '1px solid #e8eaed' }}>
          <Tab icon={<PersonIcon />} label="Empleados" iconPosition="start" />
          <Tab icon={<MoneyIcon />} label="Nómina" iconPosition="start" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            {loading ? (
              <LinearProgress />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>RUT</TableCell>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Cargo</TableCell>
                      <TableCell>Departamento</TableCell>
                      <TableCell>Sueldo Base</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>{employee.rut}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {employee.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {employee.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          ${employee.base_salary.toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={employee.status === 'active' ? 'Activo' : 'Inactivo'}
                            color={employee.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingEmployee(employee);
                              setEmployeeForm({
                                rut: employee.rut,
                                name: employee.name,
                                email: employee.email,
                                phone: employee.phone,
                                position: employee.position,
                                department: employee.department,
                                hire_date: employee.hire_date,
                                base_salary: employee.base_salary,
                                status: employee.status,
                              });
                              setOpenEmployeeDialog(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Período</InputLabel>
                <Select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} label="Período">
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(date.getMonth() - i);
                    const period = format(date, 'yyyy-MM');
                    const label = format(date, 'MMMM yyyy');
                    return (
                      <MenuItem key={period} value={period}>
                        {label.charAt(0).toUpperCase() + label.slice(1)}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                {filteredPayroll.length} registro{filteredPayroll.length !== 1 ? 's' : ''} para este período
              </Typography>
            </Box>

            {filteredPayroll.length === 0 ? (
              <Alert severity="info">No hay registros de nómina para este período</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Empleado</TableCell>
                      <TableCell align="right">Sueldo Bruto</TableCell>
                      <TableCell align="right">AFP</TableCell>
                      <TableCell align="right">Salud</TableCell>
                      <TableCell align="right">Impuesto</TableCell>
                      <TableCell align="right">Otros Desc.</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Sueldo Neto
                      </TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPayroll.map((payroll) => (
                      <TableRow key={payroll.id}>
                        <TableCell>{payroll.employee_name}</TableCell>
                        <TableCell align="right">${payroll.gross_salary.toLocaleString('es-CL')}</TableCell>
                        <TableCell align="right">${payroll.afp.toLocaleString('es-CL')}</TableCell>
                        <TableCell align="right">${payroll.health.toLocaleString('es-CL')}</TableCell>
                        <TableCell align="right">${payroll.income_tax.toLocaleString('es-CL')}</TableCell>
                        <TableCell align="right">${payroll.other_deductions.toLocaleString('es-CL')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ${payroll.net_salary.toLocaleString('es-CL')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              payroll.status === 'paid'
                                ? 'Pagado'
                                : payroll.status === 'approved'
                                ? 'Aprobado'
                                : 'Borrador'
                            }
                            color={payroll.status === 'paid' ? 'success' : payroll.status === 'approved' ? 'info' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Descargar">
                            <IconButton size="small">
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
      </Paper>

      {/* Dialog Empleado */}
      <Dialog open={openEmployeeDialog} onClose={() => setOpenEmployeeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="RUT" value={employeeForm.rut} onChange={(e) => setEmployeeForm({ ...employeeForm, rut: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nombre Completo" value={employeeForm.name} onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Teléfono" value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Cargo" value={employeeForm.position} onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Departamento" value={employeeForm.department} onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Fecha de Contratación" type="date" value={employeeForm.hire_date} onChange={(e) => setEmployeeForm({ ...employeeForm, hire_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Sueldo Base" type="number" value={employeeForm.base_salary} onChange={(e) => setEmployeeForm({ ...employeeForm, base_salary: parseFloat(e.target.value) || 0 })} InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select value={employeeForm.status} onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value as 'active' | 'inactive' })} label="Estado">
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmployeeDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveEmployee} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Nómina */}
      <Dialog open={openPayrollDialog} onClose={() => setOpenPayrollDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingPayroll ? 'Editar Nómina' : 'Nueva Nómina'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Empleado</InputLabel>
                <Select value={payrollForm.employee_id} onChange={(e) => setPayrollForm({ ...payrollForm, employee_id: e.target.value })} label="Empleado">
                  {employees.filter((e) => e.status === 'active').map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name} - ${emp.base_salary.toLocaleString('es-CL')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Período" type="month" value={payrollForm.period} onChange={(e) => setPayrollForm({ ...payrollForm, period: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Horas Extras" type="number" value={payrollForm.overtime_hours} onChange={(e) => setPayrollForm({ ...payrollForm, overtime_hours: parseFloat(e.target.value) || 0 })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Bonificaciones" type="number" value={payrollForm.bonuses} onChange={(e) => setPayrollForm({ ...payrollForm, bonuses: parseFloat(e.target.value) || 0 })} InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Asignaciones" type="number" value={payrollForm.allowances} onChange={(e) => setPayrollForm({ ...payrollForm, allowances: parseFloat(e.target.value) || 0 })} InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Otros Descuentos" type="number" value={payrollForm.other_deductions} onChange={(e) => setPayrollForm({ ...payrollForm, other_deductions: parseFloat(e.target.value) || 0 })} InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>$</Typography> }} />
            </Grid>

            {previewPayroll && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Card variant="outlined" sx={{ bgcolor: '#f5f7fa' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Resumen de Cálculo
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Sueldo Base
                        </Typography>
                        <Typography variant="h6">${previewPayroll.base_salary.toLocaleString('es-CL')}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Horas Extras
                        </Typography>
                        <Typography variant="h6">${previewPayroll.overtime_amount.toLocaleString('es-CL')}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Bonificaciones
                        </Typography>
                        <Typography variant="h6">${previewPayroll.bonuses.toLocaleString('es-CL')}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Asignaciones
                        </Typography>
                        <Typography variant="h6">${previewPayroll.allowances.toLocaleString('es-CL')}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Sueldo Bruto
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                          ${previewPayroll.gross_salary.toLocaleString('es-CL')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          AFP (10%)
                        </Typography>
                        <Typography variant="body1">${previewPayroll.afp.toLocaleString('es-CL')}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Salud (7%)
                        </Typography>
                        <Typography variant="body1">${previewPayroll.health.toLocaleString('es-CL')}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Impuesto a la Renta
                        </Typography>
                        <Typography variant="body1">${previewPayroll.income_tax.toLocaleString('es-CL')}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Otros Descuentos
                        </Typography>
                        <Typography variant="body1">${previewPayroll.other_deductions.toLocaleString('es-CL')}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                          Sueldo Neto
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          ${previewPayroll.net_salary.toLocaleString('es-CL')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPayrollDialog(false)}>Cancelar</Button>
          <Button onClick={handleSavePayroll} variant="contained" disabled={!payrollForm.employee_id}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;

