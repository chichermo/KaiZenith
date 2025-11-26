import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from './auth-simple';
import { bankingService } from '../services/banking.service';

const router = express.Router();

/**
 * Conectar cuenta bancaria
 */
router.post('/connect', authenticateToken, [
  body('bankCode').notEmpty(),
  body('credentials').isObject(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const userId = (req as any).user.id;
    const { bankCode, credentials } = req.body;

    const connection = await bankingService.connectBankAccount(userId, bankCode, credentials);

    res.json({
      success: true,
      data: connection,
    });
  } catch (error: any) {
    console.error('Error connecting bank:', error);
    res.status(500).json({ success: false, error: 'Error conectando cuenta bancaria' });
  }
});

/**
 * Obtener saldo
 */
router.get('/balance', authenticateToken, [
  query('bankCode').notEmpty(),
  query('accountNumber').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const userId = (req as any).user.id;
    const { bankCode, accountNumber } = req.query;

    const balance = await bankingService.getAccountBalance(
      userId,
      bankCode as string,
      accountNumber as string
    );

    res.json({
      success: true,
      data: balance,
    });
  } catch (error: any) {
    console.error('Error getting balance:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo saldo' });
  }
});

/**
 * Obtener transacciones
 */
router.get('/transactions', authenticateToken, [
  query('bankCode').notEmpty(),
  query('accountNumber').notEmpty(),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const userId = (req as any).user.id;
    const { bankCode, accountNumber, fromDate, toDate } = req.query;

    const transactions = await bankingService.getTransactions(
      userId,
      bankCode as string,
      accountNumber as string,
      fromDate as string | undefined,
      toDate as string | undefined
    );

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error('Error getting transactions:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo transacciones' });
  }
});

/**
 * Reconciliación automática
 */
router.post('/reconcile', authenticateToken, [
  body('bankCode').notEmpty(),
  body('accountNumber').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const userId = (req as any).user.id;
    const { bankCode, accountNumber } = req.body;

    // Obtener transacciones
    const transactions = await bankingService.getTransactions(
      userId,
      bankCode,
      accountNumber
    );

    // TODO: Obtener facturas pendientes reales
    const pendingInvoices: any[] = []; // await invoiceService.getPendingInvoices(userId);

    // Reconciliar
    const reconciliation = await bankingService.autoReconcile(
      userId,
      transactions,
      pendingInvoices
    );

    res.json({
      success: true,
      data: reconciliation,
    });
  } catch (error: any) {
    console.error('Error reconciling:', error);
    res.status(500).json({ success: false, error: 'Error en reconciliación' });
  }
});

/**
 * Proyección de flujo de caja
 */
router.get('/cash-flow-projection', authenticateToken, [
  query('bankCode').notEmpty(),
  query('accountNumber').notEmpty(),
  query('days').optional().isInt({ min: 1, max: 365 }),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const userId = (req as any).user.id;
    const { bankCode, accountNumber, days } = req.query;

    const projection = await bankingService.projectCashFlow(
      userId,
      bankCode as string,
      accountNumber as string,
      days ? parseInt(days as string) : 30
    );

    res.json({
      success: true,
      data: projection,
    });
  } catch (error: any) {
    console.error('Error projecting cash flow:', error);
    res.status(500).json({ success: false, error: 'Error proyectando flujo de caja' });
  }
});

/**
 * Sincronizar cuenta
 */
router.post('/sync', authenticateToken, [
  body('bankCode').notEmpty(),
  body('accountNumber').notEmpty(),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const userId = (req as any).user.id;
    const { bankCode, accountNumber } = req.body;

    await bankingService.syncAccount(userId, bankCode, accountNumber);

    res.json({
      success: true,
      message: 'Cuenta sincronizada exitosamente',
    });
  } catch (error: any) {
    console.error('Error syncing account:', error);
    res.status(500).json({ success: false, error: 'Error sincronizando cuenta' });
  }
});

export default router;

