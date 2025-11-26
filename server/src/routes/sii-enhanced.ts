import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken } from './auth-simple';
import { siiService } from '../services/sii.service';

const router = express.Router();

/**
 * Validar RUT con SII
 */
router.post('/validate-rut', authenticateToken, [
  body('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'RUT inválido' });
    }

    const { rut } = req.body;
    const taxStatus = await siiService.validateRUT(rut);

    if (!taxStatus) {
      return res.status(404).json({ success: false, error: 'RUT no encontrado' });
    }

    res.json({
      success: true,
      data: taxStatus,
    });
  } catch (error: any) {
    console.error('Error validating RUT:', error);
    res.status(500).json({ success: false, error: 'Error validando RUT' });
  }
});

/**
 * Enviar documento al SII
 */
router.post('/send-document', authenticateToken, [
  body('tipo').isIn(['FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'FACTURA_COMPRA']),
  body('folio').isInt({ min: 1 }),
  body('fechaEmision').isISO8601(),
  body('rutEmisor').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  body('rutReceptor').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  body('montoNeto').isFloat({ min: 0 }),
  body('montoIva').isFloat({ min: 0 }),
  body('montoTotal').isFloat({ min: 0 }),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos del documento inválidos' });
    }

    const document = req.body;
    const response = await siiService.sendDocument(document);

    res.json({
      success: true,
      message: 'Documento enviado exitosamente al SII',
      data: response,
    });
  } catch (error: any) {
    console.error('Error sending document:', error);
    res.status(500).json({ success: false, error: 'Error enviando documento al SII' });
  }
});

/**
 * Sincronizar libros contables
 */
router.post('/sync-books', authenticateToken, [
  body('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  body('period').matches(/^\d{4}-\d{2}$/),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { rut, period } = req.body;
    const result = await siiService.syncAccountingBooks(rut, period);

    res.json({
      success: true,
      message: 'Libros sincronizados exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error syncing books:', error);
    res.status(500).json({ success: false, error: 'Error sincronizando libros' });
  }
});

/**
 * Generar declaración mensual
 */
router.post('/generate-declaration', authenticateToken, [
  body('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  body('period').matches(/^\d{4}-\d{2}$/),
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { rut, period } = req.body;
    const result = await siiService.generateMonthlyDeclaration(rut, period);

    res.json({
      success: true,
      message: 'Declaración generada y enviada exitosamente',
      data: result,
    });
  } catch (error: any) {
    console.error('Error generating declaration:', error);
    res.status(500).json({ success: false, error: 'Error generando declaración' });
  }
});

export default router;

