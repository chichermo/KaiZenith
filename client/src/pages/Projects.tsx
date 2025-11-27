import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Alert,
  Snackbar,
  Tooltip,
  Tabs,
  Tab,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  InputAdornment,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Timeline as TimelineIcon,
  Assignment as ProjectIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface Project {
  id: number;
  code: string;
  name: string;
  description?: string;
  project_type: string;
  client_id: number;
  client_name: string;
  status: string;
  start_date: string;
  planned_end_date: string;
  actual_end_date?: string;
  budget: number;
  actual_cost: number;
  estimated_revenue: number;
  actual_revenue: number;
  materials_cost: number;
  labor_cost: number;
  equipment_cost: number;
  overhead_cost: number;
  other_costs: number;
  margin: number;
  actual_margin: number;
  progress: number;
}

interface ProjectCost {
  id: number;
  project_id: number;
  category: string;
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_type?: string;
  reference_id?: number;
  date: string;
}

const Projects: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectCosts, setProjectCosts] = useState<ProjectCost[]>([]);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openCostDialog, setOpenCostDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    project_type: 'construction',
    client_id: '',
    start_date: '',
    planned_end_date: '',
    budget: 0,
    estimated_revenue: 0,
    location: '',
    address: '',
  });

  const [costFormData, setCostFormData] = useState({
    category: 'material',
    description: '',
    quantity: 0,
    unit_cost: 0,
    reference_type: '',
    reference_id: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [statusFilter, typeFilter]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('project_type', typeFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`http://localhost:5000/api/projects?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/clients?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProjectCosts = async (projectId: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjectCosts(data.data.cost_details || []);
      }
    } catch (error) {
      console.error('Error fetching project costs:', error);
    }
  };

  const handleOpenProjectDialog = (project?: Project) => {
    if (project) {
      setSelectedProject(project);
      setFormData({
        code: project.code,
        name: project.name,
        description: project.description || '',
        project_type: project.project_type,
        client_id: project.client_id.toString(),
        start_date: project.start_date,
        planned_end_date: project.planned_end_date,
        budget: project.budget,
        estimated_revenue: project.estimated_revenue,
        location: '',
        address: '',
      });
    } else {
      setSelectedProject(null);
      setFormData({
        code: '',
        name: '',
        description: '',
        project_type: 'construction',
        client_id: '',
        start_date: new Date().toISOString().split('T')[0],
        planned_end_date: '',
        budget: 0,
        estimated_revenue: 0,
        location: '',
        address: '',
      });
    }
    setOpenProjectDialog(true);
  };

  const handleSaveProject = async () => {
    try {
      setLoading(true);
      const url = selectedProject
        ? `http://localhost:5000/api/projects/${selectedProject.id}`
        : 'http://localhost:5000/api/projects';

      const method = selectedProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          client_id: parseInt(formData.client_id),
        })
      });

      if (response.ok) {
        setSuccess(`Proyecto ${selectedProject ? 'actualizado' : 'creado'} exitosamente`);
        setOpenProjectDialog(false);
        fetchProjects();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar proyecto');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      setError('Error al guardar proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCostDialog = (project: Project) => {
    setSelectedProject(project);
    setCostFormData({
      category: 'material',
      description: '',
      quantity: 0,
      unit_cost: 0,
      reference_type: '',
      reference_id: '',
      date: new Date().toISOString().split('T')[0],
    });
    setOpenCostDialog(true);
  };

  const handleSaveCost = async () => {
    if (!selectedProject) return;

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/projects/${selectedProject.id}/costs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...costFormData,
          reference_id: costFormData.reference_id ? parseInt(costFormData.reference_id) : undefined,
        })
      });

      if (response.ok) {
        setSuccess('Costo registrado exitosamente');
        setOpenCostDialog(false);
        fetchProjects();
        fetchProjectCosts(selectedProject.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al registrar costo');
      }
    } catch (error) {
      console.error('Error saving cost:', error);
      setError('Error al registrar costo');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProject = async (project: Project) => {
    setSelectedProject(project);
    await fetchProjectCosts(project.id);
    setOpenViewDialog(true);
  };

  const handleUpdateProgress = async (projectId: number, progress: number) => {
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ progress })
      });

      if (response.ok) {
        setSuccess('Progreso actualizado exitosamente');
        fetchProjects();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      setError('Error al actualizar progreso');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: any } = {
      'planning': 'info',
      'active': 'success',
      'on_hold': 'warning',
      'completed': 'primary',
      'cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'planning': 'Planificación',
      'active': 'Activo',
      'on_hold': 'En Pausa',
      'completed': 'Completado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'construction': 'Construcción',
      'repair': 'Reparación',
      'maintenance': 'Mantenimiento',
      'renovation': 'Remodelación',
      'consulting': 'Consultoría'
    };
    return labels[type] || type;
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return 'success';
    if (margin >= 15) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Gestión de Proyectos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenProjectDialog()}
        >
          Nuevo Proyecto
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Buscar proyectos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            value={statusFilter}
            label="Estado"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="planning">Planificación</MenuItem>
            <MenuItem value="active">Activo</MenuItem>
            <MenuItem value="on_hold">En Pausa</MenuItem>
            <MenuItem value="completed">Completado</MenuItem>
            <MenuItem value="cancelled">Cancelado</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Tipo</InputLabel>
          <Select
            value={typeFilter}
            label="Tipo"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="construction">Construcción</MenuItem>
            <MenuItem value="repair">Reparación</MenuItem>
            <MenuItem value="maintenance">Mantenimiento</MenuItem>
            <MenuItem value="renovation">Remodelación</MenuItem>
            <MenuItem value="consulting">Consultoría</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={fetchProjects}>
          Buscar
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Presupuesto</TableCell>
                  <TableCell align="right">Costo Real</TableCell>
                  <TableCell align="right">Ingresos</TableCell>
                  <TableCell align="right">Margen</TableCell>
                  <TableCell>Progreso</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => {
                  const overBudget = project.actual_cost > project.budget;
                  return (
                    <TableRow key={project.id}>
                      <TableCell>{project.code}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {project.name}
                        </Typography>
                        {project.description && (
                          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {project.description.substring(0, 50)}...
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{project.client_name}</TableCell>
                      <TableCell>{getProjectTypeLabel(project.project_type)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(project.status)}
                          color={getStatusColor(project.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        ${project.budget.toLocaleString('es-CL')}
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ color: overBudget ? '#f5365c' : '#ffffff' }}
                          >
                            ${project.actual_cost.toLocaleString('es-CL')}
                          </Typography>
                          {overBudget && (
                            <Chip
                              label="Sobre presupuesto"
                              color="error"
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        ${(project.actual_revenue || project.estimated_revenue).toLocaleString('es-CL')}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${project.actual_margin.toFixed(1)}%`}
                          color={getMarginColor(project.actual_margin) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={project.progress}
                            sx={{ width: 100, height: 8, borderRadius: 1 }}
                          />
                          <Typography variant="body2">{project.progress}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Ver Detalles">
                            <IconButton
                              size="small"
                              onClick={() => handleViewProject(project)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenProjectDialog(project)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Registrar Costo">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenCostDialog(project)}
                            >
                              <MoneyIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog Proyecto */}
      <Dialog open={openProjectDialog} onClose={() => setOpenProjectDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Código"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={!!selectedProject}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Proyecto</InputLabel>
                <Select
                  value={formData.project_type}
                  label="Tipo de Proyecto"
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                >
                  <MenuItem value="construction">Construcción</MenuItem>
                  <MenuItem value="repair">Reparación</MenuItem>
                  <MenuItem value="maintenance">Mantenimiento</MenuItem>
                  <MenuItem value="renovation">Remodelación</MenuItem>
                  <MenuItem value="consulting">Consultoría</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={clients}
                getOptionLabel={(option) => `${option.name} - ${option.rut}`}
                value={clients.find(c => c.id.toString() === formData.client_id) || null}
                onChange={(e, newValue) => setFormData({ ...formData, client_id: newValue?.id.toString() || '' })}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField {...params} label="Cliente" required />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Inicio"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de Término Planeada"
                type="date"
                value={formData.planned_end_date}
                onChange={(e) => setFormData({ ...formData, planned_end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Presupuesto"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Ingresos Estimados"
                type="number"
                value={formData.estimated_revenue}
                onChange={(e) => setFormData({ ...formData, estimated_revenue: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenProjectDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveProject} variant="contained" disabled={loading}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Costo */}
      <Dialog open={openCostDialog} onClose={() => setOpenCostDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Costo - {selectedProject?.name}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={costFormData.category}
                  label="Categoría"
                  onChange={(e) => setCostFormData({ ...costFormData, category: e.target.value })}
                >
                  <MenuItem value="material">Materiales</MenuItem>
                  <MenuItem value="labor">Mano de Obra</MenuItem>
                  <MenuItem value="equipment">Equipos</MenuItem>
                  <MenuItem value="overhead">Gastos Generales</MenuItem>
                  <MenuItem value="other">Otros</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                value={costFormData.description}
                onChange={(e) => setCostFormData({ ...costFormData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={costFormData.quantity}
                onChange={(e) => setCostFormData({ ...costFormData, quantity: parseFloat(e.target.value) || 0 })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Costo Unitario"
                type="number"
                value={costFormData.unit_cost}
                onChange={(e) => setCostFormData({ ...costFormData, unit_cost: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Fecha"
                type="date"
                value={costFormData.date}
                onChange={(e) => setCostFormData({ ...costFormData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tipo de Referencia"
                value={costFormData.reference_type}
                onChange={(e) => setCostFormData({ ...costFormData, reference_type: e.target.value })}
                placeholder="Ej: purchase_order, invoice"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID Referencia"
                type="number"
                value={costFormData.reference_id}
                onChange={(e) => setCostFormData({ ...costFormData, reference_id: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCostDialog(false)}>Cancelar</Button>
          <Button onClick={handleSaveCost} variant="contained" disabled={loading}>
            Registrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Ver Proyecto */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Detalles del Proyecto</DialogTitle>
        <DialogContent>
          {selectedProject && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Información General</Typography>
                      <Typography variant="body2" color="text.secondary">Código: {selectedProject.code}</Typography>
                      <Typography variant="body2" color="text.secondary">Cliente: {selectedProject.client_name}</Typography>
                      <Typography variant="body2" color="text.secondary">Tipo: {getProjectTypeLabel(selectedProject.project_type)}</Typography>
                      <Typography variant="body2" color="text.secondary">Estado: {getStatusLabel(selectedProject.status)}</Typography>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2">Progreso</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={selectedProject.progress}
                          sx={{ mt: 1, height: 10, borderRadius: 1 }}
                        />
                        <Typography variant="body2" sx={{ mt: 1 }}>{selectedProject.progress}%</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Financiero</Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Presupuesto</Typography>
                        <Typography variant="h6">${selectedProject.budget.toLocaleString('es-CL')}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Costo Real</Typography>
                        <Typography variant="h6" color={selectedProject.actual_cost > selectedProject.budget ? 'error' : 'inherit'}>
                          ${selectedProject.actual_cost.toLocaleString('es-CL')}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Ingresos</Typography>
                        <Typography variant="h6">${(selectedProject.actual_revenue || selectedProject.estimated_revenue).toLocaleString('es-CL')}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Margen</Typography>
                        <Chip
                          label={`${selectedProject.actual_margin.toFixed(1)}%`}
                          color={getMarginColor(selectedProject.actual_margin) as any}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Costos por Categoría</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">Materiales</Typography>
                          <Typography variant="h6">${selectedProject.materials_cost.toLocaleString('es-CL')}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">Mano de Obra</Typography>
                          <Typography variant="h6">${selectedProject.labor_cost.toLocaleString('es-CL')}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">Equipos</Typography>
                          <Typography variant="h6">${selectedProject.equipment_cost.toLocaleString('es-CL')}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">Gastos Generales</Typography>
                          <Typography variant="h6">${selectedProject.overhead_cost.toLocaleString('es-CL')}</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Typography variant="body2" color="text.secondary">Otros</Typography>
                          <Typography variant="h6">${selectedProject.other_costs.toLocaleString('es-CL')}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Historial de Costos</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Fecha</TableCell>
                              <TableCell>Categoría</TableCell>
                              <TableCell>Descripción</TableCell>
                              <TableCell align="right">Cantidad</TableCell>
                              <TableCell align="right">Costo Unit.</TableCell>
                              <TableCell align="right">Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {projectCosts.map((cost) => (
                              <TableRow key={cost.id}>
                                <TableCell>{new Date(cost.date).toLocaleDateString('es-CL')}</TableCell>
                                <TableCell>{cost.category}</TableCell>
                                <TableCell>{cost.description}</TableCell>
                                <TableCell align="right">{cost.quantity}</TableCell>
                                <TableCell align="right">${cost.unit_cost.toLocaleString('es-CL')}</TableCell>
                                <TableCell align="right">${cost.total_cost.toLocaleString('es-CL')}</TableCell>
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
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Projects;


