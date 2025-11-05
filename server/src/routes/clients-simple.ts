import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';

const router = express.Router();

// Datos en memoria (se comparten con auth-simple.ts)
let clients = [
  {
    id: 1,
    rut: '12.345.678-9',
    name: 'Juan Pérez',
    email: 'juan.perez@email.com',
    phone: '+56 9 1234 5678',
    address: 'Av. Principal 123',
    city: 'Santiago',
    region: 'Región Metropolitana',
    type: 'individual',
    status: 'active',
    notes: 'Cliente preferencial',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    rut: '98.765.432-1',
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+56 9 8765 4321',
    address: 'Calle Secundaria 456',
    city: 'Valparaíso',
    region: 'Región de Valparaíso',
    type: 'individual',
    status: 'potential',
    notes: 'Cliente potencial',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    rut: '12.345.678-0',
    name: 'Constructora ABC Ltda.',
    email: 'info@constructoraabc.cl',
    phone: '+56 2 2345 6789',
    address: 'Av. Empresarial 789',
    city: 'Santiago',
    region: 'Región Metropolitana',
    type: 'company',
    status: 'active',
    notes: 'Empresa constructora',
    created_at: new Date(),
    updated_at: new Date()
  }
];

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

    let filteredClients = [...clients];

    // Filtrar por estado
    if (status) {
      filteredClients = filteredClients.filter(client => client.status === status);
    }

    // Filtrar por búsqueda
    if (search) {
      filteredClients = filteredClients.filter(client => 
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.email.toLowerCase().includes(search.toLowerCase()) ||
        client.rut.includes(search)
      );
    }

    const total = filteredClients.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedClients = filteredClients.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedClients,
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
    const client = clients.find(c => c.id === parseInt(id));
    
    if (!client) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    res.json({
      success: true,
      data: client
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
    const existingClient = clients.find(c => c.rut === rut);
    if (existingClient) {
      return res.status(400).json({ success: false, error: 'Ya existe un cliente con este RUT' });
    }

    const newClient = {
      id: Math.max(...clients.map(c => c.id)) + 1,
      rut,
      name,
      email,
      phone,
      address,
      city,
      region,
      type,
      status,
      notes: notes || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    clients.push(newClient);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: newClient
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
    const clientIndex = clients.findIndex(c => c.id === parseInt(id));
    
    if (clientIndex === -1) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    const updates = req.body;

    // Si se está actualizando el RUT, verificar que no exista otro cliente con el mismo RUT
    if (updates.rut) {
      const duplicateRut = clients.find(c => c.rut === updates.rut && c.id !== parseInt(id));
      if (duplicateRut) {
        return res.status(400).json({ success: false, error: 'Ya existe otro cliente con este RUT' });
      }
    }

    // Actualizar cliente
    clients[clientIndex] = {
      ...clients[clientIndex],
      ...updates,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: clients[clientIndex]
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
    const clientIndex = clients.findIndex(c => c.id === parseInt(id));
    
    if (clientIndex === -1) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    clients.splice(clientIndex, 1);

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
    const clientIndex = clients.findIndex(c => c.id === parseInt(id));
    
    if (clientIndex === -1) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    clients[clientIndex] = {
      ...clients[clientIndex],
      status: 'active',
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Cliente activado exitosamente',
      data: clients[clientIndex]
    });
  } catch (error) {
    console.error('Error activando cliente:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
