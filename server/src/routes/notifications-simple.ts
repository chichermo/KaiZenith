import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';

const router = express.Router();

// Tipos de notificaciones
export type NotificationType = 'info' | 'warning' | 'error' | 'success' | 'approval' | 'deadline';

// Prioridad de notificaciones
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Notificación
interface Notification {
  id: number;
  user_id?: number; // null para notificaciones globales
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  action_url?: string; // URL para acción relacionada
  action_label?: string; // Label del botón de acción
  read: boolean;
  created_at: Date;
  read_at?: Date;
}

// Alertas automáticas
interface Alert {
  id: number;
  type: 'invoice_overdue' | 'quotation_expiring' | 'low_stock' | 'project_overdue' | 'payment_due' | 'approval_pending';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: number;
  created_at: Date;
  resolved: boolean;
  resolved_at?: Date;
}

// Datos en memoria
let notifications: Notification[] = [];
let alerts: Alert[] = [];

// Crear notificación
export const createNotification = (
  userId: number | undefined,
  type: NotificationType,
  priority: NotificationPriority,
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string
): Notification => {
  const notification: Notification = {
    id: notifications.length + 1,
    user_id: userId,
    type,
    priority,
    title,
    message,
    action_url: actionUrl,
    action_label: actionLabel,
    read: false,
    created_at: new Date()
  };

  notifications.push(notification);
  return notification;
};

// Crear alerta automática
export const createAlert = (
  type: Alert['type'],
  severity: Alert['severity'],
  title: string,
  message: string,
  referenceType?: string,
  referenceId?: number
): Alert => {
  const alert: Alert = {
    id: alerts.length + 1,
    type,
    severity,
    title,
    message,
    reference_type: referenceType,
    reference_id: referenceId,
    created_at: new Date(),
    resolved: false
  };

  alerts.push(alert);
  return alert;
};

// Obtener notificaciones del usuario
router.get('/', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { read, type, priority, limit } = req.query;
    const user = (req as any).user;

    let filtered = notifications.filter(n => !n.user_id || n.user_id === user.id);

    if (read !== undefined) {
      filtered = filtered.filter(n => n.read === (read === 'true'));
    }

    if (type) {
      filtered = filtered.filter(n => n.type === type);
    }

    if (priority) {
      filtered = filtered.filter(n => n.priority === priority);
    }

    // Ordenar por fecha más reciente
    filtered.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    // Limitar resultados
    const limitNum = limit ? parseInt(limit as string) : 50;
    filtered = filtered.slice(0, limitNum);

    res.json({
      success: true,
      data: filtered,
      unread_count: filtered.filter(n => !n.read).length
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Marcar notificación como leída
router.patch('/:id/read', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const notificationIndex = notifications.findIndex(
      n => n.id === parseInt(id) && (!n.user_id || n.user_id === user.id)
    );

    if (notificationIndex === -1) {
      return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
    }

    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      read: true,
      read_at: new Date()
    };

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: notifications[notificationIndex]
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Marcar todas las notificaciones como leídas
router.patch('/read-all', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;

    notifications.forEach((notification, index) => {
      if (!notification.read && (!notification.user_id || notification.user_id === user.id)) {
        notifications[index] = {
          ...notification,
          read: true,
          read_at: new Date()
        };
      }
    });

    res.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marcando notificaciones como leídas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Eliminar notificación
router.delete('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const notificationIndex = notifications.findIndex(
      n => n.id === parseInt(id) && (!n.user_id || n.user_id === user.id)
    );

    if (notificationIndex === -1) {
      return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
    }

    notifications.splice(notificationIndex, 1);

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener alertas
router.get('/alerts', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { resolved, severity, type } = req.query;

    let filtered = [...alerts];

    if (resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === (resolved === 'true'));
    }

    if (severity) {
      filtered = filtered.filter(a => a.severity === severity);
    }

    if (type) {
      filtered = filtered.filter(a => a.type === type);
    }

    // Ordenar por severidad y fecha
    filtered.sort((a, b) => {
      const severityOrder: { [key: string]: number } = { critical: 4, high: 3, medium: 2, low: 1 };
      if (severityOrder[b.severity] !== severityOrder[a.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.created_at.getTime() - a.created_at.getTime();
    });

    res.json({
      success: true,
      data: filtered,
      unresolved_count: filtered.filter(a => !a.resolved).length
    });
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Resolver alerta
router.patch('/alerts/:id/resolve', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const alertIndex = alerts.findIndex(a => a.id === parseInt(id));

    if (alertIndex === -1) {
      return res.status(404).json({ success: false, error: 'Alerta no encontrada' });
    }

    alerts[alertIndex] = {
      ...alerts[alertIndex],
      resolved: true,
      resolved_at: new Date()
    };

    res.json({
      success: true,
      message: 'Alerta resuelta exitosamente',
      data: alerts[alertIndex]
    });
  } catch (error) {
    console.error('Error resolviendo alerta:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Función para generar alertas automáticas
export const checkAndGenerateAlerts = async (): Promise<void> => {
  // Esta función se llamaría periódicamente para generar alertas automáticas
  // Por ejemplo: facturas vencidas, cotizaciones por expirar, stock bajo, etc.
  
  // Ejemplo: alertas de facturas vencidas (se implementaría con datos reales)
  const today = new Date();
  // Aquí iría la lógica para verificar facturas vencidas, etc.
};

export default router;




