import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from './auth-simple';
import { paymentService } from '../services/payment.service';

const router = express.Router();

/**
 * Crear transacción de pago
 */
router.post('/create', authenticateToken, [
  body('invoiceId').notEmpty(),
  body('amount').isFloat({ min: 1 }),
  body('buyOrder').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const userId = (req as any).user.id;
    const { invoiceId, amount, buyOrder } = req.body;

    const payment = await paymentService.createPayment({
      invoiceId,
      amount,
      buyOrder,
      sessionId: `session_${userId}_${Date.now()}`,
      returnUrl: `${process.env.FRONTEND_URL}/payments/return`,
      finalUrl: `${process.env.FRONTEND_URL}/payments/final`,
    });

    res.json({
      success: true,
      data: payment,
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    res.status(500).json({ success: false, error: 'Error creando transacción de pago' });
  }
});

/**
 * Confirmar pago (callback desde Transbank)
 */
router.post('/confirm', authenticateToken, [
  body('token').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Token inválido' });
    }

    const { token } = req.body;
    const confirmation = await paymentService.confirmPayment(token);

    res.json({
      success: true,
      data: confirmation,
    });
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ success: false, error: 'Error confirmando pago' });
  }
});

/**
 * Obtener estado de pago
 */
router.get('/status', authenticateToken, [
  query('token').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Token inválido' });
    }

    const { token } = req.query;
    const status = await paymentService.getPaymentStatus(token as string);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo estado de pago' });
  }
});

/**
 * Reembolsar pago
 */
router.post('/refund', authenticateToken, [
  body('token').notEmpty(),
  body('amount').optional().isFloat({ min: 1 }),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { token, amount } = req.body;
    const refund = await paymentService.refundPayment(token, amount);

    res.json({
      success: true,
      message: 'Reembolso procesado exitosamente',
      data: refund,
    });
  } catch (error: any) {
    console.error('Error refunding payment:', error);
    res.status(500).json({ success: false, error: 'Error procesando reembolso' });
  }
});

export default router;

