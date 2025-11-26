import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from './auth-simple';
import { notificationService } from '../services/notification.service';

const router = express.Router();

// Datos en memoria para notificaciones
let notifications: any[] = [];

/**
 * Función helper para crear notificaciones
 */
export function createNotification(
  userId: string | undefined,
  type: 'success' | 'error' | 'warning' | 'info',
  priority: 'low' | 'medium' | 'high',
  title: string,
  message: string
) {
  const notification = {
    id: notifications.length + 1,
    user_id: userId || null,
    type,
    priority,
    title,
    message,
    read: false,
    created_at: new Date().toISOString(),
  };

  notifications.push(notification);
  return notification;
}

/**
 * Enviar email
 */
router.post('/email', authenticateToken, [
  body('to').isEmail(),
  body('subject').notEmpty(),
  body('html').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { to, subject, html, text, from } = req.body;

    const sent = await notificationService.sendEmail({
      to,
      subject,
      html,
      text,
      from,
    });

    res.json({
      success: sent,
      message: sent ? 'Email enviado exitosamente' : 'Error enviando email',
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: 'Error enviando email' });
  }
});

/**
 * Enviar notificación push
 */
router.post('/push', authenticateToken, [
  body('userId').notEmpty(),
  body('title').notEmpty(),
  body('body').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { userId, title, body, data, fcmToken } = req.body;

    const sent = await notificationService.sendPushNotification({
      userId,
      title,
      body,
      data,
      fcmToken,
    });

    res.json({
      success: sent,
      message: sent ? 'Notificación enviada exitosamente' : 'Error enviando notificación',
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ success: false, error: 'Error enviando notificación' });
  }
});

/**
 * Guardar FCM token
 */
router.post('/fcm-token', authenticateToken, [
  body('userId').notEmpty(),
  body('token').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { userId, token } = req.body;

    await notificationService.saveFCMToken(userId, token);

    res.json({
      success: true,
      message: 'Token guardado exitosamente',
    });
  } catch (error: any) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ success: false, error: 'Error guardando token' });
  }
});

export default router;
