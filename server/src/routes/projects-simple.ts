import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';

const router = express.Router();

// Estados de proyecto
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

// Tipos de proyectos
export type ProjectType = 'construction' | 'repair' | 'maintenance' | 'renovation' | 'consulting';

// Fases de proyecto
interface ProjectPhase {
  id: number;
  name: string;
  description?: string;
  start_date: Date;
  end_date?: Date;
  budget: number;
  actual_cost: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number; // 0-100
}

// Proyecto
interface Project {
  id: number;
  code: string; // Código único del proyecto
  name: string;
  description?: string;
  project_type: ProjectType;
  client_id: number;
  client_name: string;
  status: ProjectStatus;
  start_date: Date;
  planned_end_date: Date;
  actual_end_date?: Date;
  
  // Presupuesto
  budget: number;
  actual_cost: number;
  estimated_revenue: number;
  actual_revenue: number;
  
  // Costos desglosados
  materials_cost: number;
  labor_cost: number;
  equipment_cost: number;
  overhead_cost: number;
  other_costs: number;
  
  // Rentabilidad
  margin: number; // Margen estimado
  actual_margin: number; // Margen real
  
  // Progreso
  progress: number; // 0-100
  
  // Fases
  phases: ProjectPhase[];
  
  // Referencias a documentos
  quotation_id?: number;
  invoice_ids: number[];
  purchase_order_ids: number[];
  
  // Ubicación
  location?: string;
  address?: string;
  
  // Responsables
  project_manager_id?: number;
  project_manager_name?: string;
  
  created_at: Date;
  updated_at: Date;
}

// Costo por concepto
interface ProjectCost {
  id: number;
  project_id: number;
  category: 'material' | 'labor' | 'equipment' | 'overhead' | 'other';
  description: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_type?: string; // 'purchase_order', 'invoice', 'expense'
  reference_id?: number;
  date: Date;
  created_at: Date;
}

// Datos en memoria
let projects: Project[] = [];
let projectCosts: ProjectCost[] = [];

// Crear proyecto
router.post('/', authenticateToken, [
  body('code').notEmpty().trim(),
  body('name').notEmpty().trim(),
  body('project_type').isIn(['construction', 'repair', 'maintenance', 'renovation', 'consulting']),
  body('client_id').isInt({ min: 1 }),
  body('start_date').isISO8601(),
  body('planned_end_date').isISO8601(),
  body('budget').isFloat({ min: 0 }),
  body('estimated_revenue').isFloat({ min: 0 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const {
      code,
      name,
      description,
      project_type,
      client_id,
      start_date,
      planned_end_date,
      budget,
      estimated_revenue,
      location,
      address,
      project_manager_id,
      project_manager_name,
      quotation_id
    } = req.body;

    // Verificar que el código no exista
    const existingProject = projects.find(p => p.code === code);
    if (existingProject) {
      return res.status(400).json({ success: false, error: 'Ya existe un proyecto con este código' });
    }

    const margin = estimated_revenue > 0 ? ((estimated_revenue - budget) / estimated_revenue) * 100 : 0;

    const newProject: Project = {
      id: projects.length + 1,
      code,
      name,
      description,
      project_type,
      client_id,
      client_name: '', // Se llenará desde el cliente
      status: 'planning',
      start_date: new Date(start_date),
      planned_end_date: new Date(planned_end_date),
      budget,
      actual_cost: 0,
      estimated_revenue,
      actual_revenue: 0,
      materials_cost: 0,
      labor_cost: 0,
      equipment_cost: 0,
      overhead_cost: 0,
      other_costs: 0,
      margin,
      actual_margin: 0,
      progress: 0,
      phases: [],
      invoice_ids: [],
      purchase_order_ids: [],
      location,
      address,
      project_manager_id,
      project_manager_name,
      quotation_id,
      created_at: new Date(),
      updated_at: new Date()
    };

    projects.push(newProject);

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: newProject
    });
  } catch (error) {
    console.error('Error creando proyecto:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener todos los proyectos con filtros
router.get('/', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { status, project_type, client_id, date_from, date_to, search } = req.query;

    let filtered = [...projects];

    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }

    if (project_type) {
      filtered = filtered.filter(p => p.project_type === project_type);
    }

    if (client_id) {
      filtered = filtered.filter(p => p.client_id === parseInt(client_id as string));
    }

    if (date_from || date_to) {
      filtered = filtered.filter(p => {
        const startDate = new Date(p.start_date);
        if (date_from && startDate < new Date(date_from as string)) return false;
        if (date_to && startDate > new Date(date_to as string)) return false;
        return true;
      });
    }

    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.code.toLowerCase().includes(searchLower) ||
        (p.description && p.description.toLowerCase().includes(searchLower))
      );
    }

    res.json({
      success: true,
      data: filtered,
      total: filtered.length
    });
  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener proyecto por ID con detalles
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const project = projects.find(p => p.id === parseInt(id));

    if (!project) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    // Obtener costos del proyecto
    const costs = projectCosts.filter(c => c.project_id === parseInt(id));

    // Calcular resumen de costos
    const costsSummary = {
      materials: costs.filter(c => c.category === 'material').reduce((sum, c) => sum + c.total_cost, 0),
      labor: costs.filter(c => c.category === 'labor').reduce((sum, c) => sum + c.total_cost, 0),
      equipment: costs.filter(c => c.category === 'equipment').reduce((sum, c) => sum + c.total_cost, 0),
      overhead: costs.filter(c => c.category === 'overhead').reduce((sum, c) => sum + c.total_cost, 0),
      other: costs.filter(c => c.category === 'other').reduce((sum, c) => sum + c.total_cost, 0)
    };

    res.json({
      success: true,
      data: {
        ...project,
        costs: costsSummary,
        cost_details: costs.sort((a, b) => b.date.getTime() - a.date.getTime())
      }
    });
  } catch (error) {
    console.error('Error obteniendo proyecto:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar proyecto
router.put('/:id', authenticateToken, [
  body('status').optional().isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled']),
  body('progress').optional().isFloat({ min: 0, max: 100 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const projectIndex = projects.findIndex(p => p.id === parseInt(id));

    if (projectIndex === -1) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const updates = req.body;
    
    // Si se actualiza el progreso a 100%, marcar como completado
    if (updates.progress === 100 && projects[projectIndex].status !== 'completed') {
      updates.status = 'completed';
      updates.actual_end_date = new Date();
    }

    projects[projectIndex] = {
      ...projects[projectIndex],
      ...updates,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: projects[projectIndex]
    });
  } catch (error) {
    console.error('Error actualizando proyecto:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Registrar costo en proyecto
router.post('/:id/costs', authenticateToken, [
  body('category').isIn(['material', 'labor', 'equipment', 'overhead', 'other']),
  body('description').notEmpty().trim(),
  body('quantity').isFloat({ min: 0 }),
  body('unit_cost').isFloat({ min: 0 }),
  body('reference_type').optional().isString(),
  body('reference_id').optional().isInt({ min: 1 }),
  body('date').isISO8601()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const project = projects.find(p => p.id === parseInt(id));

    if (!project) {
      return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
    }

    const {
      category,
      description,
      quantity,
      unit_cost,
      reference_type,
      reference_id,
      date
    } = req.body;

    const total_cost = quantity * unit_cost;

    const cost: ProjectCost = {
      id: projectCosts.length + 1,
      project_id: parseInt(id),
      category,
      description,
      quantity,
      unit_cost,
      total_cost,
      reference_type,
      reference_id,
      date: new Date(date),
      created_at: new Date()
    };

    projectCosts.push(cost);

    // Actualizar costos del proyecto
    const projectIndex = projects.findIndex(p => p.id === parseInt(id));
    const projectCosts_filtered = projectCosts.filter(c => c.project_id === parseInt(id));

    projects[projectIndex] = {
      ...projects[projectIndex],
      actual_cost: projectCosts_filtered.reduce((sum, c) => sum + c.total_cost, 0),
      materials_cost: projectCosts_filtered.filter(c => c.category === 'material').reduce((sum, c) => sum + c.total_cost, 0),
      labor_cost: projectCosts_filtered.filter(c => c.category === 'labor').reduce((sum, c) => sum + c.total_cost, 0),
      equipment_cost: projectCosts_filtered.filter(c => c.category === 'equipment').reduce((sum, c) => sum + c.total_cost, 0),
      overhead_cost: projectCosts_filtered.filter(c => c.category === 'overhead').reduce((sum, c) => sum + c.total_cost, 0),
      other_costs: projectCosts_filtered.filter(c => c.category === 'other').reduce((sum, c) => sum + c.total_cost, 0),
      actual_margin: projects[projectIndex].estimated_revenue > 0 
        ? ((projects[projectIndex].estimated_revenue - projects[projectIndex].actual_cost) / projects[projectIndex].estimated_revenue) * 100 
        : 0,
      updated_at: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Costo registrado exitosamente',
      data: {
        cost,
        project: projects[projectIndex]
      }
    });
  } catch (error) {
    console.error('Error registrando costo:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener reporte de rentabilidad de proyectos
router.get('/reports/profitability', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { date_from, date_to, status } = req.query;

    let filtered = [...projects];

    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }

    if (date_from || date_to) {
      filtered = filtered.filter(p => {
        const startDate = new Date(p.start_date);
        if (date_from && startDate < new Date(date_from as string)) return false;
        if (date_to && startDate > new Date(date_to as string)) return false;
        return true;
      });
    }

    const summary = {
      total_projects: filtered.length,
      total_budget: filtered.reduce((sum, p) => sum + p.budget, 0),
      total_actual_cost: filtered.reduce((sum, p) => sum + p.actual_cost, 0),
      total_estimated_revenue: filtered.reduce((sum, p) => sum + p.estimated_revenue, 0),
      total_actual_revenue: filtered.reduce((sum, p) => sum + p.actual_revenue, 0),
      average_margin: filtered.length > 0 
        ? filtered.reduce((sum, p) => sum + p.actual_margin, 0) / filtered.length 
        : 0
    };

    const by_status = filtered.reduce((acc: any, p) => {
      if (!acc[p.status]) {
        acc[p.status] = { count: 0, total_revenue: 0, total_cost: 0 };
      }
      acc[p.status].count++;
      acc[p.status].total_revenue += p.actual_revenue || p.estimated_revenue;
      acc[p.status].total_cost += p.actual_cost;
      return acc;
    }, {});

    const by_type = filtered.reduce((acc: any, p) => {
      if (!acc[p.project_type]) {
        acc[p.project_type] = { count: 0, total_revenue: 0, total_cost: 0 };
      }
      acc[p.project_type].count++;
      acc[p.project_type].total_revenue += p.actual_revenue || p.estimated_revenue;
      acc[p.project_type].total_cost += p.actual_cost;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        summary,
        by_status,
        by_type,
        projects: filtered.map(p => ({
          id: p.id,
          code: p.code,
          name: p.name,
          budget: p.budget,
          actual_cost: p.actual_cost,
          estimated_revenue: p.estimated_revenue,
          actual_revenue: p.actual_revenue,
          margin: p.actual_margin,
          status: p.status
        }))
      }
    });
  } catch (error) {
    console.error('Error obteniendo reporte de rentabilidad:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;




