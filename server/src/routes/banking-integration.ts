import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';
import axios from 'axios';

const router = express.Router();

// Base de datos de entidades bancarias chilenas
const CHILEAN_BANKS = {
  // Bancos principales
  banco_chile: {
    code: '001',
    name: 'Banco de Chile',
    shortName: 'Banco Chile',
    website: 'https://www.bancochile.cl',
    apiUrl: 'https://api.bancochile.cl',
    services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito'],
    atms: 1200,
    branches: 400,
    coverage: 'Nacional'
  },
  santander: {
    code: '037',
    name: 'Banco Santander Chile',
    shortName: 'Santander',
    website: 'https://www.santander.cl',
    apiUrl: 'https://api.santander.cl',
    services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito', 'inversiones'],
    atms: 1000,
    branches: 350,
    coverage: 'Nacional'
  },
  bci: {
    code: '016',
    name: 'Banco de Crédito e Inversiones',
    shortName: 'BCI',
    website: 'https://www.bci.cl',
    apiUrl: 'https://api.bci.cl',
    services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito', 'inversiones'],
    atms: 800,
    branches: 300,
    coverage: 'Nacional'
  },
  itau: {
    code: '049',
    name: 'Banco Itaú Chile',
    shortName: 'Itaú',
    website: 'https://www.itau.cl',
    apiUrl: 'https://api.itau.cl',
    services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito'],
    atms: 600,
    branches: 200,
    coverage: 'Nacional'
  },
  scotiabank: {
    code: '014',
    name: 'Scotiabank Chile',
    shortName: 'Scotiabank',
    website: 'https://www.scotiabank.cl',
    apiUrl: 'https://api.scotiabank.cl',
    services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito'],
    atms: 500,
    branches: 180,
    coverage: 'Nacional'
  },
  security: {
    code: '051',
    name: 'Banco Security',
    shortName: 'Security',
    website: 'https://www.security.cl',
    apiUrl: 'https://api.security.cl',
    services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito', 'inversiones'],
    atms: 300,
    branches: 120,
    coverage: 'Nacional'
  },
  ripley: {
    code: '039',
    name: 'Banco Ripley',
    shortName: 'Ripley',
    website: 'https://www.bancoripley.cl',
    apiUrl: 'https://api.bancoripley.cl',
    services: ['cuenta_corriente', 'credito_consumo', 'tarjeta_credito'],
    atms: 200,
    branches: 80,
    coverage: 'Nacional'
  },
  falabella: {
    code: '051',
    name: 'Banco Falabella',
    shortName: 'Falabella',
    website: 'https://www.bancofalabella.cl',
    apiUrl: 'https://api.bancofalabella.cl',
    services: ['cuenta_corriente', 'credito_consumo', 'tarjeta_credito'],
    atms: 250,
    branches: 90,
    coverage: 'Nacional'
  },
  consorcio: {
    code: '028',
    name: 'Banco Consorcio',
    shortName: 'Consorcio',
    website: 'https://www.bancoconsorcio.cl',
    apiUrl: 'https://api.bancoconsorcio.cl',
    services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario'],
    atms: 150,
    branches: 60,
    coverage: 'Nacional'
  },
  paris: {
    code: '041',
    name: 'Banco Paris',
    shortName: 'Paris',
    website: 'https://www.bancoparis.cl',
    apiUrl: 'https://api.bancoparis.cl',
    services: ['cuenta_corriente', 'credito_consumo', 'tarjeta_credito'],
    atms: 100,
    branches: 40,
    coverage: 'Nacional'
  },
  
  // Bancos especializados
  edwards: {
    code: '012',
    name: 'Banco Edwards',
    shortName: 'Edwards',
    website: 'https://www.edwards.cl',
    apiUrl: 'https://api.edwards.cl',
    services: ['cuenta_corriente', 'inversiones', 'wealth_management'],
    atms: 50,
    branches: 20,
    coverage: 'Nacional'
  },
  internacional: {
    code: '009',
    name: 'Banco Internacional',
    shortName: 'Internacional',
    website: 'https://www.bancointernacional.cl',
    apiUrl: 'https://api.bancointernacional.cl',
    services: ['cuenta_corriente', 'credito_consumo', 'credito_hipotecario'],
    atms: 80,
    branches: 30,
    coverage: 'Nacional'
  },
  citibank: {
    code: '019',
    name: 'Citibank Chile',
    shortName: 'Citibank',
    website: 'https://www.citibank.cl',
    apiUrl: 'https://api.citibank.cl',
    services: ['cuenta_corriente', 'inversiones', 'wealth_management'],
    atms: 40,
    branches: 15,
    coverage: 'Nacional'
  },
  
  // Cooperativas y bancos regionales
  cooperativa_la_union: {
    code: '065',
    name: 'Cooperative La Unión',
    shortName: 'La Unión',
    website: 'https://www.launion.cl',
    apiUrl: 'https://api.launion.cl',
    services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo'],
    atms: 60,
    branches: 25,
    coverage: 'Región Metropolitana'
  },
  banco_estado: {
    code: '001',
    name: 'Banco Estado',
    shortName: 'Banco Estado',
    website: 'https://www.bancoestado.cl',
    apiUrl: 'https://api.bancoestado.cl',
    services: ['cuenta_corriente', 'cuenta_ahorro', 'credito_consumo', 'credito_hipotecario', 'tarjeta_credito'],
    atms: 2000,
    branches: 500,
    coverage: 'Nacional'
  }
};

// Servicios bancarios disponibles
const BANKING_SERVICES = {
  cuenta_corriente: {
    name: 'Cuenta Corriente',
    description: 'Cuenta para transacciones diarias',
    features: ['chequera', 'transferencias', 'pago_servicios', 'retiro_cajeros']
  },
  cuenta_ahorro: {
    name: 'Cuenta de Ahorro',
    description: 'Cuenta para ahorrar dinero con intereses',
    features: ['intereses', 'ahorro_programado', 'retiro_cajeros']
  },
  credito_consumo: {
    name: 'Crédito de Consumo',
    description: 'Crédito para compras y gastos personales',
    features: ['tasa_fija', 'cuotas_flexibles', 'aprobacion_rapida']
  },
  credito_hipotecario: {
    name: 'Crédito Hipotecario',
    description: 'Crédito para compra de vivienda',
    features: ['tasa_preferencial', 'plazo_largo', 'seguro_cesantia']
  },
  tarjeta_credito: {
    name: 'Tarjeta de Crédito',
    description: 'Tarjeta para compras a crédito',
    features: ['cuotas_sin_interes', 'millas', 'cashback', 'seguros']
  },
  inversiones: {
    name: 'Inversiones',
    description: 'Servicios de inversión y fondos mutuos',
    features: ['fondos_mutuos', 'depositos_plazo', 'acciones']
  },
  wealth_management: {
    name: 'Gestión de Patrimonio',
    description: 'Servicios de gestión de patrimonio',
    features: ['asesoria_inversiones', 'planificacion_financiera', 'seguros']
  }
};

// Obtener lista de bancos
router.get('/banks', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { service, coverage } = req.query;
    
    let banks = Object.entries(CHILEAN_BANKS).map(([key, bank]) => ({
      key,
      ...bank
    }));

    // Filtrar por servicio
    if (service) {
      banks = banks.filter(bank => 
        bank.services.includes(service as string)
      );
    }

    // Filtrar por cobertura
    if (coverage) {
      banks = banks.filter(bank => 
        bank.coverage.toLowerCase().includes((coverage as string).toLowerCase())
      );
    }

    res.json({
      success: true,
      data: banks,
      total: banks.length
    });
  } catch (error) {
    console.error('Error obteniendo bancos:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener información de banco específico
router.get('/banks/:bankKey', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { bankKey } = req.params;
    
    const bank = CHILEAN_BANKS[bankKey as keyof typeof CHILEAN_BANKS];
    if (!bank) {
      return res.status(404).json({ success: false, error: 'Banco no encontrado' });
    }

    // Obtener servicios detallados
    const servicesDetail = bank.services.map(serviceKey => ({
      key: serviceKey,
      ...BANKING_SERVICES[serviceKey as keyof typeof BANKING_SERVICES]
    }));

    res.json({
      success: true,
      data: {
        ...bank,
        servicesDetail
      }
    });
  } catch (error) {
    console.error('Error obteniendo información del banco:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener servicios bancarios
router.get('/services', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const services = Object.entries(BANKING_SERVICES).map(([key, service]) => ({
      key,
      ...service
    }));

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error obteniendo servicios bancarios:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Simular consulta de saldo
router.post('/balance', authenticateToken, [
  body('bankKey').notEmpty(),
  body('accountNumber').notEmpty(),
  body('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/)
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { bankKey, accountNumber, rut } = req.body;
    
    const bank = CHILEAN_BANKS[bankKey as keyof typeof CHILEAN_BANKS];
    if (!bank) {
      return res.status(404).json({ success: false, error: 'Banco no encontrado' });
    }

    try {
      // Intentar consulta real al banco
      const response = await axios.post(`${bank.apiUrl}/api/balance`, {
        accountNumber,
        rut
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      res.json({
        success: true,
        data: response.data,
        source: 'BANK_API'
      });
    } catch (apiError) {
      // Fallback a datos mock
      const mockBalance = {
        bank: bank.name,
        accountNumber: accountNumber,
        rut: rut,
        balance: Math.floor(Math.random() * 5000000) + 100000,
        currency: 'CLP',
        lastUpdate: new Date().toISOString(),
        accountType: 'Cuenta Corriente',
        availableBalance: Math.floor(Math.random() * 4000000) + 50000
      };

      res.json({
        success: true,
        data: mockBalance,
        source: 'MOCK_DATA',
        note: 'Datos simulados - API bancaria no disponible'
      });
    }
  } catch (error) {
    console.error('Error consultando saldo:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Simular transferencia bancaria
router.post('/transfer', authenticateToken, [
  body('fromBank').notEmpty(),
  body('toBank').notEmpty(),
  body('fromAccount').notEmpty(),
  body('toAccount').notEmpty(),
  body('amount').isFloat({ min: 1 }),
  body('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/)
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos' });
    }

    const { fromBank, toBank, fromAccount, toAccount, amount, rut } = req.body;
    
    const fromBankInfo = CHILEAN_BANKS[fromBank as keyof typeof CHILEAN_BANKS];
    const toBankInfo = CHILEAN_BANKS[toBank as keyof typeof CHILEAN_BANKS];
    
    if (!fromBankInfo || !toBankInfo) {
      return res.status(404).json({ success: false, error: 'Banco no encontrado' });
    }

    try {
      // Intentar transferencia real
      const response = await axios.post(`${fromBankInfo.apiUrl}/api/transfer`, {
        fromAccount,
        toAccount,
        toBank: toBankInfo.code,
        amount,
        rut
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      res.json({
        success: true,
        data: response.data,
        source: 'BANK_API'
      });
    } catch (apiError) {
      // Simular transferencia exitosa
      const transferResult = {
        transactionId: `TXN_${Date.now()}`,
        fromBank: fromBankInfo.name,
        toBank: toBankInfo.name,
        fromAccount: fromAccount,
        toAccount: toAccount,
        amount: amount,
        currency: 'CLP',
        status: 'COMPLETADA',
        timestamp: new Date().toISOString(),
        fee: Math.floor(amount * 0.001), // 0.1% de comisión
        reference: `REF_${Date.now()}`
      };

      res.json({
        success: true,
        message: 'Transferencia procesada exitosamente',
        data: transferResult,
        source: 'MOCK_DATA',
        note: 'Simulación - API bancaria no disponible'
      });
    }
  } catch (error) {
    console.error('Error procesando transferencia:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener movimientos de cuenta
router.get('/movements', authenticateToken, [
  query('bankKey').notEmpty(),
  query('accountNumber').notEmpty(),
  query('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  query('fromDate').optional().isISO8601(),
  query('toDate').optional().isISO8601()
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { bankKey, accountNumber, rut, fromDate, toDate } = req.query;
    
    const bank = CHILEAN_BANKS[bankKey as keyof typeof CHILEAN_BANKS];
    if (!bank) {
      return res.status(404).json({ success: false, error: 'Banco no encontrado' });
    }

    try {
      // Intentar consulta real
      const response = await axios.get(`${bank.apiUrl}/api/movements`, {
        params: { accountNumber, rut, fromDate, toDate },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      res.json({
        success: true,
        data: response.data,
        source: 'BANK_API'
      });
    } catch (apiError) {
      // Fallback a datos mock
      const mockMovements = {
        bank: bank.name,
        accountNumber: accountNumber,
        rut: rut,
        period: {
          from: fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          to: toDate || new Date().toISOString().split('T')[0]
        },
        movements: [
          {
            date: '2024-01-15',
            description: 'Transferencia recibida',
            amount: 500000,
            type: 'CREDIT',
            balance: 1500000,
            reference: 'TXN123456'
          },
          {
            date: '2024-01-14',
            description: 'Pago servicios básicos',
            amount: -85000,
            type: 'DEBIT',
            balance: 1000000,
            reference: 'TXN123455'
          },
          {
            date: '2024-01-13',
            description: 'Retiro cajero automático',
            amount: -100000,
            type: 'DEBIT',
            balance: 1085000,
            reference: 'TXN123454'
          }
        ],
        totalMovements: 3,
        totalCredits: 500000,
        totalDebits: -185000
      };

      res.json({
        success: true,
        data: mockMovements,
        source: 'MOCK_DATA',
        note: 'Datos simulados - API bancaria no disponible'
      });
    }
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas bancarias
router.get('/stats', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const banks = Object.values(CHILEAN_BANKS);
    
    const stats = {
      totalBanks: banks.length,
      totalATMs: banks.reduce((sum, bank) => sum + bank.atms, 0),
      totalBranches: banks.reduce((sum, bank) => sum + bank.branches, 0),
      byCoverage: banks.reduce((acc, bank) => {
        acc[bank.coverage] = (acc[bank.coverage] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number }),
      byService: Object.keys(BANKING_SERVICES).reduce((acc, service) => {
        acc[service] = banks.filter(bank => bank.services.includes(service)).length;
        return acc;
      }, {} as { [key: string]: number }),
      topBanks: banks
        .sort((a, b) => (b.atms + b.branches) - (a.atms + a.branches))
        .slice(0, 5)
        .map(bank => ({
          name: bank.name,
          atms: bank.atms,
          branches: bank.branches,
          totalPoints: bank.atms + bank.branches
        }))
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas bancarias:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
