import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from './auth-simple';

const router = express.Router();

// Configuración de la empresa en memoria
let companyConfig = {
  id: 1,
  name: 'KaiZenith Spa',
  rut: '78.218.808-9',
  address: 'Badajoz 100 OF 621 Ps 6 1, Dpto. 623, Las Condes',
  city: 'Las Condes',
  region: 'Región Metropolitana',
  phone: '(+569) 68208696',
  email: 'contacto.kaizenith@gmail.com',
  website: '',
  business_type: 'Construcción general - Soldaduras especiales - Reparación maquinaria pesada - Servicios logísticos',
  tax_regime: 'Régimen General',
  iva_rate: 19,
  currency: 'CLP',
  fiscal_year_start: '01-01',
  fiscal_year_end: '12-31',
  invoice_prefix: 'FAC',
  quotation_prefix: 'COT',
  purchase_order_prefix: 'OC',
  created_at: new Date(),
  updated_at: new Date()
};

// Configuración de usuarios
let users = [
  {
    id: 1,
    email: 'admin@patolin.cl',
    name: 'Administrador',
    role: 'admin',
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    email: 'contador@patolin.cl',
    name: 'Contador',
    role: 'accountant',
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    email: 'usuario@patolin.cl',
    name: 'Usuario General',
    role: 'user',
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Configuración de integraciones
let integrations = {
  sii: {
    enabled: false,
    api_key: '',
    environment: 'test', // test o production
    last_sync: null
  },
  banks: {
    enabled: false,
    bank_name: '',
    api_key: '',
    account_number: ''
  },
  suppliers: {
    enabled: true,
    apis: [
      {
        name: 'Sodimac',
        enabled: true,
        api_key: '',
        base_url: 'https://api.sodimac.cl',
        rate_limit: 100
      },
      {
        name: 'Easy',
        enabled: true,
        api_key: '',
        base_url: 'https://api.easy.cl',
        rate_limit: 100
      },
      {
        name: 'Maestro',
        enabled: true,
        api_key: '',
        base_url: 'https://api.maestro.cl',
        rate_limit: 100
      }
    ]
  }
};

// Obtener configuración de la empresa
router.get('/company', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    res.json({
      success: true,
      data: companyConfig
    });
  } catch (error) {
    console.error('Error obteniendo configuración de empresa:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar configuración de la empresa
router.put('/company', authenticateToken, [
  body('name').notEmpty().trim(),
  body('rut').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('region').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  body('email').isEmail(),
  body('website').optional().isString(),
  body('business_type').notEmpty().trim(),
  body('tax_regime').notEmpty().trim(),
  body('iva_rate').isFloat({ min: 0, max: 100 }),
  body('currency').isIn(['CLP', 'USD', 'EUR']),
  body('fiscal_year_start').matches(/^\d{2}-\d{2}$/),
  body('fiscal_year_end').matches(/^\d{2}-\d{2}$/),
  body('invoice_prefix').notEmpty().trim(),
  body('quotation_prefix').notEmpty().trim(),
  body('purchase_order_prefix').notEmpty().trim()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const {
      name,
      rut,
      address,
      city,
      region,
      phone,
      email,
      website,
      business_type,
      tax_regime,
      iva_rate,
      currency,
      fiscal_year_start,
      fiscal_year_end,
      invoice_prefix,
      quotation_prefix,
      purchase_order_prefix
    } = req.body;

    // Actualizar configuración
    companyConfig = {
      ...companyConfig,
      name,
      rut,
      address,
      city,
      region,
      phone,
      email,
      website: website || '',
      business_type,
      tax_regime,
      iva_rate,
      currency,
      fiscal_year_start,
      fiscal_year_end,
      invoice_prefix,
      quotation_prefix,
      purchase_order_prefix,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Configuración de empresa actualizada exitosamente',
      data: companyConfig
    });
  } catch (error) {
    console.error('Error actualizando configuración de empresa:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener usuarios
router.get('/users', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Crear usuario
router.post('/users', authenticateToken, [
  body('email').isEmail(),
  body('name').notEmpty().trim(),
  body('role').isIn(['admin', 'user', 'accountant']),
  body('password').isLength({ min: 6 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { email, name, role, password } = req.body;

    // Verificar que el email no esté duplicado
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Ya existe un usuario con este email' });
    }

    // Crear usuario
    const newUser = {
      id: Math.max(...users.map(u => u.id)) + 1,
      email,
      name,
      role,
      active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    users.push(newUser);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: newUser
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar usuario
router.put('/users/:id', authenticateToken, [
  body('email').isEmail(),
  body('name').notEmpty().trim(),
  body('role').isIn(['admin', 'user', 'accountant']),
  body('active').isBoolean()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { id } = req.params;
    const { email, name, role, active } = req.body;

    const userIndex = users.findIndex(u => u.id === parseInt(id));
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Verificar que el email no esté duplicado (excluyendo el usuario actual)
    const existingUser = users.find(u => u.email === email && u.id !== parseInt(id));
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Ya existe un usuario con este email' });
    }

    // Actualizar usuario
    users[userIndex] = {
      ...users[userIndex],
      email,
      name,
      role,
      active,
      updated_at: new Date()
    };

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: users[userIndex]
    });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Eliminar usuario
router.delete('/users/:id', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === parseInt(id));
    
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // No permitir eliminar el último administrador
    const adminUsers = users.filter(u => u.role === 'admin' && u.active);
    if (users[userIndex].role === 'admin' && adminUsers.length === 1) {
      return res.status(400).json({ success: false, error: 'No se puede eliminar el último administrador' });
    }

    users.splice(userIndex, 1);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener configuraciones de integración
router.get('/integrations', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    console.error('Error obteniendo integraciones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Actualizar configuración de integraciones
router.put('/integrations', authenticateToken, [
  body('sii').optional().isObject(),
  body('banks').optional().isObject(),
  body('suppliers').optional().isObject()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }

    const { sii, banks, suppliers: suppliersConfig } = req.body;

    // Actualizar configuraciones
    if (sii) {
      integrations.sii = { ...integrations.sii, ...sii };
    }

    if (banks) {
      integrations.banks = { ...integrations.banks, ...banks };
    }

    if (suppliersConfig) {
      integrations.suppliers = { ...integrations.suppliers, ...suppliersConfig };
    }

    res.json({
      success: true,
      message: 'Configuraciones de integración actualizadas exitosamente',
      data: integrations
    });
  } catch (error) {
    console.error('Error actualizando integraciones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas del sistema
router.get('/stats', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const stats = {
      company: {
        name: companyConfig.name,
        rut: companyConfig.rut,
        created_at: companyConfig.created_at
      },
      users: {
        total: users.length,
        active: users.filter(u => u.active).length,
        by_role: {
          admin: users.filter(u => u.role === 'admin').length,
          accountant: users.filter(u => u.role === 'accountant').length,
          user: users.filter(u => u.role === 'user').length
        }
      },
      integrations: {
        sii_enabled: integrations.sii.enabled,
        banks_enabled: integrations.banks.enabled,
        suppliers_enabled: integrations.suppliers.enabled,
        suppliers_count: integrations.suppliers.apis.length
      },
      system: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memory_usage: process.memoryUsage()
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Función helper para obtener configuración de la empresa (exportable)
export const getCompanyConfig = () => companyConfig;

export default router;
