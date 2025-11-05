import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { pool } from '../index';
import { authenticateToken } from './auth';
import { Client } from '../types';

const router = express.Router();

// Obtener todos los clientes con paginación
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['active', 'potential', 'inactive']),
  query('search').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR rut ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Contar total de registros
    const countQuery = `SELECT COUNT(*) FROM clients ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Obtener clientes
    const dataQuery = `
      SELECT * FROM clients 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);
    
    const result = await pool.query(dataQuery, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener cliente por ID
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear nuevo cliente
router.post('/', authenticateToken, [
  body('rut').notEmpty().matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('phone').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('region').notEmpty().trim(),
  body('type').isIn(['individual', 'company']),
  body('status').isIn(['active', 'potential', 'inactive'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const {
      rut,
      name,
      email,
      phone,
      address,
      city,
      region,
      type,
      status,
      notes
    } = req.body;

    // Verificar si el RUT ya existe
    const existingClient = await pool.query('SELECT id FROM clients WHERE rut = $1', [rut]);
    if (existingClient.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Ya existe un cliente con este RUT' });
    }

    const result = await pool.query(
      `INSERT INTO clients (rut, name, email, phone, address, city, region, type, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [rut, name, email, phone, address, city, region, type, status, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar cliente
router.put('/:id', authenticateToken, [
  body('rut').optional().matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  body('name').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().notEmpty().trim(),
  body('address').optional().notEmpty().trim(),
  body('city').optional().notEmpty().trim(),
  body('region').optional().notEmpty().trim(),
  body('type').optional().isIn(['individual', 'company']),
  body('status').optional().isIn(['active', 'potential', 'inactive'])
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Verificar si el cliente existe
    const existingClient = await pool.query('SELECT id FROM clients WHERE id = $1', [id]);
    if (existingClient.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    // Si se está actualizando el RUT, verificar que no exista otro cliente con el mismo RUT
    if (updates.rut) {
      const duplicateRut = await pool.query('SELECT id FROM clients WHERE rut = $1 AND id != $2', [updates.rut, id]);
      if (duplicateRut.rows.length > 0) {
        return res.status(400).json({ success: false, error: 'Ya existe otro cliente con este RUT' });
      }
    }

    // Construir query dinámico
    const fields = Object.keys(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field])];

    const result = await pool.query(
      `UPDATE clients SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Eliminar cliente
router.delete('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    // Verificar si el cliente existe
    const existingClient = await pool.query('SELECT id FROM clients WHERE id = $1', [id]);
    if (existingClient.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    // Verificar si tiene facturas o cotizaciones asociadas
    const invoices = await pool.query('SELECT id FROM invoices WHERE client_id = $1', [id]);
    const quotations = await pool.query('SELECT id FROM quotations WHERE client_id = $1', [id]);

    if (invoices.rows.length > 0 || quotations.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar el cliente porque tiene facturas o cotizaciones asociadas' 
      });
    }

    await pool.query('DELETE FROM clients WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Convertir cliente potencial a activo
router.patch('/:id/activate', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE clients SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['active', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    res.json({
      success: true,
      message: 'Cliente activado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error activando cliente:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
