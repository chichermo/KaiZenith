import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Datos en memoria para desarrollo
let users = [
  {
    id: 1,
    email: 'admin@patolin.cl',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
    name: 'Administrador',
    role: 'admin',
    created_at: new Date(),
    updated_at: new Date()
  }
];

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
  }
];

let invoices = [
  {
    id: 1,
    invoice_number: 'FAC-2024-000001',
    client_id: 1,
    client_name: 'Juan Pérez',
    client_rut: '12.345.678-9',
    date: '2024-01-15',
    due_date: '2024-02-15',
    subtotal: 100000,
    tax: 19000,
    total: 119000,
    status: 'paid',
    notes: 'Factura pagada',
    items: [
      {
        id: 1,
        description: 'Servicio de construcción',
        quantity: 1,
        unit_price: 100000,
        total: 100000
      }
    ],
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Middleware para verificar JWT
export const authenticateToken = (req: any, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
};

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { email, password } = req.body;

    // Buscar usuario
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener perfil del usuario actual
router.get('/profile', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
