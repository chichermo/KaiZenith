import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from './auth-simple';

const router = express.Router();

// Tipos de documentos que pueden tener workflow
export type WorkflowDocumentType = 'quotation' | 'purchase_order' | 'invoice' | 'expense' | 'payment';

// Estados del workflow
export type WorkflowStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Roles que pueden aprobar
export type ApprovalRole = 'admin' | 'manager' | 'accountant' | 'director';

// Configuración de workflow por tipo de documento
interface WorkflowConfig {
  document_type: WorkflowDocumentType;
  requires_approval: boolean;
  approval_levels: ApprovalLevel[];
  auto_approve_limit?: number; // Monto en CLP que se aprueba automáticamente
}

interface ApprovalLevel {
  level: number;
  role: ApprovalRole;
  min_amount?: number; // Monto mínimo que requiere este nivel
  max_amount?: number; // Monto máximo que puede aprobar este nivel
}

// Configuraciones de workflow por defecto
let workflowConfigs: WorkflowConfig[] = [
  {
    document_type: 'quotation',
    requires_approval: true,
    approval_levels: [
      { level: 1, role: 'manager', max_amount: 5000000 },
      { level: 2, role: 'director', min_amount: 5000000 }
    ],
    auto_approve_limit: 1000000
  },
  {
    document_type: 'purchase_order',
    requires_approval: true,
    approval_levels: [
      { level: 1, role: 'manager', max_amount: 10000000 },
      { level: 2, role: 'director', min_amount: 10000000 }
    ],
    auto_approve_limit: 2000000
  },
  {
    document_type: 'invoice',
    requires_approval: false, // Las facturas generalmente no requieren aprobación
    approval_levels: []
  },
  {
    document_type: 'expense',
    requires_approval: true,
    approval_levels: [
      { level: 1, role: 'manager', max_amount: 2000000 },
      { level: 2, role: 'director', min_amount: 2000000 }
    ],
    auto_approve_limit: 500000
  },
  {
    document_type: 'payment',
    requires_approval: true,
    approval_levels: [
      { level: 1, role: 'accountant', max_amount: 5000000 },
      { level: 2, role: 'director', min_amount: 5000000 }
    ],
    auto_approve_limit: 1000000
  }
];

// Registros de aprobaciones
interface ApprovalRecord {
  id: number;
  document_type: WorkflowDocumentType;
  document_id: number;
  level: number;
  approver_id: number;
  approver_name: string;
  approver_role: ApprovalRole;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: Date;
  created_at: Date;
}

let approvalRecords: ApprovalRecord[] = [];

// Historial de cambios de documentos
interface DocumentHistory {
  id: number;
  document_type: WorkflowDocumentType;
  document_id: number;
  user_id: number;
  user_name: string;
  action: string; // 'created', 'updated', 'approved', 'rejected', 'cancelled'
  changes?: any; // Cambios realizados
  comments?: string;
  created_at: Date;
}

let documentHistory: DocumentHistory[] = [];

// Obtener configuración de workflow para un tipo de documento
router.get('/config/:document_type', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { document_type } = req.params;
    const config = workflowConfigs.find(w => w.document_type === document_type as WorkflowDocumentType);
    
    if (!config) {
      return res.status(404).json({ success: false, error: 'Configuración no encontrada' });
    }

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error obteniendo configuración de workflow:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar configuración de workflow
router.put('/config/:document_type', authenticateToken, [
  body('requires_approval').isBoolean(),
  body('approval_levels').isArray(),
  body('auto_approve_limit').optional().isFloat({ min: 0 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { document_type } = req.params;
    const { requires_approval, approval_levels, auto_approve_limit } = req.body;

    const configIndex = workflowConfigs.findIndex(w => w.document_type === document_type as WorkflowDocumentType);
    if (configIndex === -1) {
      return res.status(404).json({ success: false, error: 'Configuración no encontrada' });
    }

    workflowConfigs[configIndex] = {
      ...workflowConfigs[configIndex],
      requires_approval,
      approval_levels,
      auto_approve_limit
    };

    res.json({
      success: true,
      message: 'Configuración de workflow actualizada exitosamente',
      data: workflowConfigs[configIndex]
    });
  } catch (error) {
    console.error('Error actualizando configuración de workflow:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear solicitud de aprobación
router.post('/approval', authenticateToken, [
  body('document_type').isIn(['quotation', 'purchase_order', 'invoice', 'expense', 'payment']),
  body('document_id').isInt({ min: 1 }),
  body('amount').isFloat({ min: 0 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { document_type, document_id, amount } = req.body;
    const user = (req as any).user;

    // Obtener configuración de workflow
    const config = workflowConfigs.find(w => w.document_type === document_type as WorkflowDocumentType);
    if (!config) {
      return res.status(404).json({ success: false, error: 'Configuración de workflow no encontrada' });
    }

    // Verificar si requiere aprobación
    if (!config.requires_approval) {
      return res.json({
        success: true,
        message: 'Documento no requiere aprobación',
        data: { approved: true }
      });
    }

    // Verificar límite de auto-aprobación
    if (config.auto_approve_limit && amount <= config.auto_approve_limit) {
      const autoApproval: ApprovalRecord = {
        id: approvalRecords.length + 1,
        document_type: document_type as WorkflowDocumentType,
        document_id,
        level: 0,
        approver_id: user.id,
        approver_name: user.name,
        approver_role: user.role as ApprovalRole,
        status: 'approved',
        comments: 'Aprobación automática por monto menor al límite',
        approved_at: new Date(),
        created_at: new Date()
      };
      approvalRecords.push(autoApproval);

      return res.json({
        success: true,
        message: 'Documento aprobado automáticamente',
        data: { approved: true, approval: autoApproval }
      });
    }

    // Crear solicitudes de aprobación según niveles requeridos
    const requiredLevels = config.approval_levels.filter(level => {
      if (level.min_amount && amount < level.min_amount) return false;
      if (level.max_amount && amount > level.max_amount) return false;
      return true;
    });

    const approvals: ApprovalRecord[] = requiredLevels.map(level => ({
      id: approvalRecords.length + 1 + requiredLevels.indexOf(level),
      document_type: document_type as WorkflowDocumentType,
      document_id,
      level: level.level,
      approver_id: 0, // Pendiente de asignación
      approver_name: '',
      approver_role: level.role,
      status: 'pending',
      created_at: new Date()
    }));

    approvalRecords.push(...approvals);

    res.json({
      success: true,
      message: 'Solicitud de aprobación creada exitosamente',
      data: {
        approved: false,
        pending_approvals: approvals
      }
    });
  } catch (error) {
    console.error('Error creando solicitud de aprobación:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Aprobar o rechazar documento
router.post('/approval/:id/action', authenticateToken, [
  body('action').isIn(['approve', 'reject']),
  body('comments').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const { action, comments } = req.body;
    const user = (req as any).user;

    const approvalIndex = approvalRecords.findIndex(a => a.id === parseInt(id));
    if (approvalIndex === -1) {
      return res.status(404).json({ success: false, error: 'Solicitud de aprobación no encontrada' });
    }

    const approval = approvalRecords[approvalIndex];
    
    // Verificar que el usuario tenga el rol correcto
    if (approval.approver_role !== user.role) {
      return res.status(403).json({ success: false, error: 'No tienes permisos para aprobar este documento' });
    }

    // Actualizar aprobación
    approvalRecords[approvalIndex] = {
      ...approval,
      approver_id: user.id,
      approver_name: user.name,
      status: action === 'approve' ? 'approved' : 'rejected',
      comments,
      approved_at: new Date()
    };

    // Verificar si todas las aprobaciones requeridas están completas
    const documentApprovals = approvalRecords.filter(
      a => a.document_type === approval.document_type && a.document_id === approval.document_id
    );
    const allApproved = documentApprovals.every(a => a.status === 'approved');
    const anyRejected = documentApprovals.some(a => a.status === 'rejected');

    res.json({
      success: true,
      message: `Documento ${action === 'approve' ? 'aprobado' : 'rechazado'} exitosamente`,
      data: {
        approval: approvalRecords[approvalIndex],
        all_approved: allApproved,
        rejected: anyRejected,
        status: anyRejected ? 'rejected' : (allApproved ? 'approved' : 'pending')
      }
    });
  } catch (error) {
    console.error('Error procesando aprobación:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener historial de aprobaciones de un documento
router.get('/approval/:document_type/:document_id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { document_type, document_id } = req.params;
    
    const approvals = approvalRecords.filter(
      a => a.document_type === document_type as WorkflowDocumentType && 
           a.document_id === parseInt(document_id)
    );

    res.json({
      success: true,
      data: approvals.sort((a, b) => a.level - b.level)
    });
  } catch (error) {
    console.error('Error obteniendo historial de aprobaciones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener documentos pendientes de aprobación
router.get('/pending', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    
    const pending = approvalRecords.filter(
      a => a.status === 'pending' && a.approver_role === user.role
    );

    res.json({
      success: true,
      data: pending
    });
  } catch (error) {
    console.error('Error obteniendo documentos pendientes:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Agregar entrada al historial de documentos
export const addDocumentHistory = (
  document_type: WorkflowDocumentType,
  document_id: number,
  user_id: number,
  user_name: string,
  action: string,
  changes?: any,
  comments?: string
) => {
  const history: DocumentHistory = {
    id: documentHistory.length + 1,
    document_type,
    document_id,
    user_id,
    user_name,
    action,
    changes,
    comments,
    created_at: new Date()
  };
  documentHistory.push(history);
  return history;
};

// Obtener historial de un documento
router.get('/history/:document_type/:document_id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { document_type, document_id } = req.params;
    
    const history = documentHistory.filter(
      h => h.document_type === document_type as WorkflowDocumentType && 
           h.document_id === parseInt(document_id)
    );

    res.json({
      success: true,
      data: history.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Verificar si un documento está aprobado
export const isDocumentApproved = (document_type: WorkflowDocumentType, document_id: number): boolean => {
  const config = workflowConfigs.find(w => w.document_type === document_type);
  if (!config || !config.requires_approval) return true;

  const approvals = approvalRecords.filter(
    a => a.document_type === document_type && a.document_id === document_id
  );

  if (approvals.length === 0) return false;
  
  return approvals.every(a => a.status === 'approved') && !approvals.some(a => a.status === 'rejected');
};

export default router;




