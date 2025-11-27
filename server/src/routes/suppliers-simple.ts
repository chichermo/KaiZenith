import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';

const router = express.Router();

// Datos en memoria
let suppliers = [
  {
    id: 1,
    rut: '76.123.456-7',
    name: 'Materiales Santiago S.A.',
    email: 'ventas@materialessantiago.cl',
    phone: '+56 2 2345 6789',
    address: 'Av. Industrial 1234',
    city: 'Santiago',
    region: 'Región Metropolitana',
    type: 'materials',
    status: 'active',
    notes: 'Proveedor de materiales de construcción',
    contact_person: 'Carlos Mendoza',
    payment_terms: '30 días',
    discount_percentage: 5,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    rut: '98.765.432-1',
    name: 'Ferretería Central',
    email: 'compras@ferreteriacentral.cl',
    phone: '+56 32 1234 5678',
    address: 'Calle Comercial 567',
    city: 'Valparaíso',
    region: 'Región de Valparaíso',
    type: 'tools',
    status: 'active',
    notes: 'Proveedor de herramientas',
    contact_person: 'María González',
    payment_terms: '15 días',
    discount_percentage: 3,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    rut: '12.345.678-9',
    name: 'Servicios de Construcción Ltda.',
    email: 'servicios@construccion.cl',
    phone: '+56 9 8765 4321',
    address: 'Av. Obrera 890',
    city: 'Concepción',
    region: 'Región del Biobío',
    type: 'services',
    status: 'active',
    notes: 'Servicios de mano de obra especializada',
    contact_person: 'Roberto Silva',
    payment_terms: '45 días',
    discount_percentage: 0,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Obtener todos los proveedores con paginación
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['materials', 'tools', 'services']),
  query('status').optional().isIn(['active', 'inactive']),
  query('search').optional().isString()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let filteredSuppliers = [...suppliers];

    // Filtrar por tipo
    if (type) {
      filteredSuppliers = filteredSuppliers.filter(supplier => supplier.type === type);
    }

    // Filtrar por estado
    if (status) {
      filteredSuppliers = filteredSuppliers.filter(supplier => supplier.status === status);
    }

    // Filtrar por búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      filteredSuppliers = filteredSuppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(searchLower) ||
        supplier.rut.toLowerCase().includes(searchLower) ||
        supplier.email.toLowerCase().includes(searchLower)
      );
    }

    const total = filteredSuppliers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedSuppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener proveedor por ID
router.get('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const supplier = suppliers.find(s => s.id === parseInt(id));
    
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
    }

    res.json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error obteniendo proveedor:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear nuevo proveedor
router.post('/', authenticateToken, [
  body('rut').notEmpty().trim(),
  body('name').notEmpty().trim(),
  body('email').isEmail(),
  body('phone').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('region').notEmpty().trim(),
  body('type').isIn(['materials', 'tools', 'services']),
  body('status').isIn(['active', 'inactive']),
  body('notes').optional().isString(),
  body('contact_person').optional().isString(),
  body('payment_terms').optional().isString(),
  body('discount_percentage').optional().isFloat({ min: 0, max: 100 })
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
      notes,
      contact_person,
      payment_terms,
      discount_percentage
    } = req.body;

    // Normalizar teléfono: eliminar espacios
    const normalizedPhone = phone.replace(/\s+/g, '');

    // Verificar que el RUT no esté duplicado
    const existingSupplier = suppliers.find(s => s.rut === rut);
    if (existingSupplier) {
      return res.status(400).json({ success: false, error: 'Ya existe un proveedor con este RUT' });
    }

    // Crear proveedor
    const newSupplier = {
      id: Math.max(...suppliers.map(s => s.id)) + 1,
      rut,
      name,
      email,
      phone: normalizedPhone,
      address,
      city,
      region,
      type,
      status,
      notes: notes || '',
      contact_person: contact_person || '',
      payment_terms: payment_terms || '30 días',
      discount_percentage: discount_percentage || 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    suppliers.push(newSupplier);

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: newSupplier
    });
  } catch (error) {
    console.error('Error creando proveedor:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar proveedor
router.put('/:id', authenticateToken, [
  body('rut').notEmpty().trim(),
  body('name').notEmpty().trim(),
  body('email').isEmail(),
  body('phone').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('region').notEmpty().trim(),
  body('type').isIn(['materials', 'tools', 'services']),
  body('status').isIn(['active', 'inactive']),
  body('notes').optional().isString(),
  body('contact_person').optional().isString(),
  body('payment_terms').optional().isString(),
  body('discount_percentage').optional().isFloat({ min: 0, max: 100 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const supplierIndex = suppliers.findIndex(s => s.id === parseInt(id));
    
    if (supplierIndex === -1) {
      return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
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
      notes,
      contact_person,
      payment_terms,
      discount_percentage
    } = req.body;

    // Normalizar teléfono: eliminar espacios
    const normalizedPhone = phone.replace(/\s+/g, '');

    // Verificar que el RUT no esté duplicado (excluyendo el proveedor actual)
    const existingSupplier = suppliers.find(s => s.rut === rut && s.id !== parseInt(id));
    if (existingSupplier) {
      return res.status(400).json({ success: false, error: 'Ya existe un proveedor con este RUT' });
    }

    // Actualizar proveedor
    suppliers[supplierIndex] = {
      ...suppliers[supplierIndex],
      rut,
      name,
      email,
      phone: normalizedPhone,
      address,
      city,
      region,
      type,
      status,
      notes: notes || '',
      contact_person: contact_person || '',
      payment_terms: payment_terms || '30 días',
      discount_percentage: discount_percentage || 0,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: suppliers[supplierIndex]
    });
  } catch (error) {
    console.error('Error actualizando proveedor:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Eliminar proveedor
router.delete('/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const supplierIndex = suppliers.findIndex(s => s.id === parseInt(id));
    
    if (supplierIndex === -1) {
      return res.status(404).json({ success: false, error: 'Proveedor no encontrado' });
    }

    suppliers.splice(supplierIndex, 1);

    res.json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de proveedores
router.get('/stats/summary', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
    const materialsSuppliers = suppliers.filter(s => s.type === 'materials').length;
    const toolsSuppliers = suppliers.filter(s => s.type === 'tools').length;
    const servicesSuppliers = suppliers.filter(s => s.type === 'services').length;

    res.json({
      success: true,
      data: {
        total: totalSuppliers,
        active: activeSuppliers,
        inactive: totalSuppliers - activeSuppliers,
        by_type: {
          materials: materialsSuppliers,
          tools: toolsSuppliers,
          services: servicesSuppliers
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
