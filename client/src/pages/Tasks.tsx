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
  Chip,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  Upcoming as UpcomingIcon,
  CheckCircleOutline as CompletedIcon,
} from '@mui/icons-material';
import { format, isToday, isPast, isFuture, parseISO } from 'date-fns';
import axios from 'axios';

interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to?: number;
  assigned_to_name?: string;
  category?: string;
  reminder_date?: string;
  created_at: string;
  updated_at: string;
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

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as Task['priority'],
    status: 'pending' as Task['status'],
    category: '',
    reminder_date: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Por ahora usar datos mock, luego conectar con backend
      const mockTasks: Task[] = [
        {
          id: 1,
          title: 'Seguimiento cliente ABC Corp',
          description: 'Llamar para confirmar factura pendiente',
          due_date: new Date().toISOString().split('T')[0],
          priority: 'high',
          status: 'pending',
          category: 'Clientes',
          reminder_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          title: 'Revisar presupuesto proyecto XYZ',
          description: 'Validar costos y aprobar presupuesto',
          due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'medium',
          status: 'in_progress',
          category: 'Proyectos',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 3,
          title: 'Preparar reporte mensual',
          description: 'Generar reportes contables del mes',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high',
          status: 'pending',
          category: 'Contabilidad',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setTasks(mockTasks);
    } catch (error) {
      console.error('Error cargando tareas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
      category: '',
      reminder_date: '',
    });
    setOpenDialog(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      due_date: task.due_date,
      priority: task.priority,
      status: task.status,
      category: task.category || '',
      reminder_date: task.reminder_date || '',
    });
    setOpenDialog(true);
  };

  const handleSaveTask = async () => {
    try {
      if (editingTask) {
        // Actualizar tarea
        setTasks(tasks.map((t) => (t.id === editingTask.id ? { ...editingTask, ...formData } : t)));
      } else {
        // Crear nueva tarea
        const newTask: Task = {
          id: Math.max(...tasks.map((t) => t.id), 0) + 1,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setTasks([...tasks, newTask]);
      }
      setOpenDialog(false);
    } catch (error) {
      console.error('Error guardando tarea:', error);
    }
  };

  const handleDeleteTask = (taskId: number) => {
    if (window.confirm('¿Estás seguro de eliminar esta tarea?')) {
      setTasks(tasks.filter((t) => t.id !== taskId));
    }
  };

  const handleToggleStatus = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
    }
  };

  const getPriorityLabel = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'completed') return task.status === 'completed';
    if (filter === 'today') return isToday(parseISO(task.due_date));
    if (filter === 'upcoming') return isFuture(parseISO(task.due_date));
    if (filter === 'overdue') return isPast(parseISO(task.due_date)) && task.status !== 'completed';
    return true;
  });

  const todayTasks = tasks.filter((t) => isToday(parseISO(t.due_date)) && t.status !== 'completed');
  const overdueTasks = tasks.filter((t) => isPast(parseISO(t.due_date)) && t.status !== 'completed');
  const upcomingTasks = tasks.filter((t) => isFuture(parseISO(t.due_date)) && t.status !== 'completed');

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#ffffff', textShadow: '0 2px 8px rgba(94, 114, 228, 0.6)' }}>
            Tareas y Recordatorios
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Gestiona tus tareas, recordatorios y seguimientos
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateTask}>
          Nueva Tarea
        </Button>
      </Box>

      {/* Alertas */}
      {overdueTasks.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Tienes {overdueTasks.length} tarea{overdueTasks.length !== 1 ? 's' : ''} vencida{overdueTasks.length !== 1 ? 's' : ''}
        </Alert>
      )}
      {todayTasks.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Tienes {todayTasks.length} tarea{todayTasks.length !== 1 ? 's' : ''} para hoy
        </Alert>
      )}

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Total Tareas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    {tasks.length}
                  </Typography>
                </Box>
                <Box sx={{ background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)', borderRadius: 3, p: 1.5, boxShadow: '0 4px 6px rgba(94, 114, 228, 0.3)' }}>
                  <AssignmentIcon sx={{ fontSize: 32, color: '#ffffff' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Pendientes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    {tasks.filter((t) => t.status === 'pending').length}
                  </Typography>
                </Box>
                <Box sx={{ background: 'linear-gradient(135deg, #fb6340 0%, #e04a2a 100%)', borderRadius: 3, p: 1.5, boxShadow: '0 4px 6px rgba(251, 99, 64, 0.3)' }}>
                  <RadioButtonUncheckedIcon sx={{ fontSize: 32, color: '#ffffff' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    En Progreso
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    {tasks.filter((t) => t.status === 'in_progress').length}
                  </Typography>
                </Box>
                <Box sx={{ background: 'linear-gradient(135deg, #11cdef 0%, #0da5c0 100%)', borderRadius: 3, p: 1.5, boxShadow: '0 4px 6px rgba(17, 205, 239, 0.3)' }}>
                  <NotificationsIcon sx={{ fontSize: 32, color: '#ffffff' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    Completadas
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ffffff' }}>
                    {tasks.filter((t) => t.status === 'completed').length}
                  </Typography>
                </Box>
                <Box sx={{ background: 'linear-gradient(135deg, #2dce89 0%, #1aae6e 100%)', borderRadius: 3, p: 1.5, boxShadow: '0 4px 6px rgba(45, 206, 137, 0.3)' }}>
                  <CheckCircleIcon sx={{ fontSize: 32, color: '#ffffff' }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros y Tabs */}
      <Card sx={{ mb: 3, border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: '#ffffff',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#5e72e4',
              },
            }}
          >
            <Tab icon={<TodayIcon />} label="Hoy" iconPosition="start" />
            <Tab icon={<UpcomingIcon />} label="Próximas" iconPosition="start" />
            <Tab icon={<NotificationsIcon />} label="Vencidas" iconPosition="start" />
            <Tab icon={<CompletedIcon />} label="Completadas" iconPosition="start" />
            <Tab label="Todas" />
          </Tabs>
        </Box>
      </Card>

      {/* Lista de Tareas */}
      <Card sx={{ border: 'none', background: 'linear-gradient(135deg, #1a2742 0%, #172b4d 100%)', borderRadius: 4, boxShadow: '0 0.5rem 1.5rem rgba(0, 0, 0, 0.3)' }}>
        <CardContent>
          {loading ? (
            <LinearProgress />
          ) : filteredTasks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">No hay tareas para mostrar</Typography>
            </Box>
          ) : (
            <List>
              {filteredTasks.map((task) => (
                <ListItem
                  key={task.id}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: task.status === 'completed' ? '#f5f5f5' : '#ffffff',
                  }}
                >
                  <ListItemIcon>
                    <Checkbox
                      checked={task.status === 'completed'}
                      onChange={() => handleToggleStatus(task)}
                      icon={<RadioButtonUncheckedIcon />}
                      checkedIcon={<CheckCircleIcon />}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                            fontWeight: 500,
                          }}
                        >
                          {task.title}
                        </Typography>
                        <Chip
                          label={getPriorityLabel(task.priority)}
                          size="small"
                          color={getPriorityColor(task.priority) as any}
                        />
                        {task.category && (
                          <Chip label={task.category} size="small" variant="outlined" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {task.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon sx={{ fontSize: 14, color: '#78909c' }} />
                            <Typography variant="caption" color="text.secondary">
                              {format(parseISO(task.due_date), 'dd/MM/yyyy')}
                            </Typography>
                            {isPast(parseISO(task.due_date)) && task.status !== 'completed' && (
                              <Chip label="Vencida" size="small" color="error" sx={{ ml: 1, height: 18 }} />
                            )}
                            {isToday(parseISO(task.due_date)) && task.status !== 'completed' && (
                              <Chip label="Hoy" size="small" color="warning" sx={{ ml: 1, height: 18 }} />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleEditTask(task)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDeleteTask(task.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar tarea */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Vencimiento"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha de Recordatorio"
                type="date"
                value={formData.reminder_date}
                onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Task['priority'] })}
                  label="Prioridad"
                >
                  <MenuItem value="low">Baja</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="urgent">Urgente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Task['status'] })}
                  label="Estado"
                >
                  <MenuItem value="pending">Pendiente</MenuItem>
                  <MenuItem value="in_progress">En Progreso</MenuItem>
                  <MenuItem value="completed">Completada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Categoría"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Clientes, Proyectos, Contabilidad"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveTask} variant="contained" disabled={!formData.title || !formData.due_date}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;

