import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken } from './auth-simple';
import axios from 'axios';

const router = express.Router();

// Configuración del SII
const SII_CONFIG = {
  baseUrl: 'https://sii.cl/api',
  endpoints: {
    // Documentos tributarios
    invoices: '/v1/documentos/facturas',
    creditNotes: '/v1/documentos/notas-credito',
    debitNotes: '/v1/documentos/notas-debito',
    purchaseInvoices: '/v1/documentos/facturas-compra',
    
    // Contribuyentes
    contributors: '/v1/contribuyentes',
    validateRut: '/v1/contribuyentes/validar-rut',
    contributorInfo: '/v1/contribuyentes/{rut}',
    
    // Libros contables
    salesBook: '/v1/libros/ventas',
    purchaseBook: '/v1/libros/compras',
    honorariumBook: '/v1/libros/honorarios',
    
    // Declaraciones
    declarations: '/v1/declaraciones',
    monthlyDeclaration: '/v1/declaraciones/mensual',
    annualDeclaration: '/v1/declaraciones/anual',
    
    // Certificados
    certificates: '/v1/certificados',
    digitalCertificate: '/v1/certificados/digital',
    
    // Consultas
    queries: '/v1/consultas',
    taxStatus: '/v1/consultas/estado-tributario',
    withholdingTax: '/v1/consultas/retenciones'
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Patolin-Construction-App/1.0'
  }
};

// Datos mock para desarrollo (simulando respuestas del SII)
const mockSIIData = {
  contributors: [
    {
      rut: '12.345.678-9',
      razonSocial: 'Patolin Construction SpA',
      giro: 'Construcción y Remodelaciones',
      direccion: 'Av. Principal 123, Santiago',
      comuna: 'Santiago',
      region: 'Región Metropolitana',
      telefono: '+56 9 1234 5678',
      email: 'contacto@patolin.cl',
      estado: 'ACTIVO',
      fechaInicioActividades: '2024-01-01',
      regimenTributario: 'Régimen General',
      categoria: 'Empresa',
      actividades: [
        { codigo: '410000', descripcion: 'Construcción de edificios' },
        { codigo: '439000', descripcion: 'Otras actividades de construcción especializada' }
      ]
    }
  ],
  invoices: [
    {
      folio: 1,
      fechaEmision: '2024-01-15',
      tipoDocumento: 'FACTURA',
      rutEmisor: '12.345.678-9',
      razonSocialEmisor: 'Patolin Construction SpA',
      rutReceptor: '98.765.432-1',
      razonSocialReceptor: 'Cliente Ejemplo',
      montoNeto: 100000,
      montoIva: 19000,
      montoTotal: 119000,
      estado: 'EMITIDA',
      timbreElectronico: 'ABC123456789',
      fechaVencimiento: '2024-02-15'
    }
  ],
  taxStatus: {
    rut: '12.345.678-9',
    estado: 'AL DÍA',
    ultimaDeclaracion: '2024-01-31',
    proximaDeclaracion: '2024-02-28',
    saldoFavor: 0,
    saldoDeuda: 0,
    observaciones: []
  }
};

// Validar RUT chileno
const validateRUT = (rut: string): boolean => {
  const cleanRUT = rut.replace(/[.-]/g, '');
  const rutNumber = cleanRUT.slice(0, -1);
  const checkDigit = cleanRUT.slice(-1).toUpperCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedCheckDigit = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString();
  
  return checkDigit === calculatedCheckDigit;
};

// Obtener información de contribuyente
router.get('/contributor/:rut', authenticateToken, [
  query('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/)
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'RUT inválido' });
    }

    const { rut } = req.params;
    
    if (!validateRUT(rut)) {
      return res.status(400).json({ success: false, error: 'RUT no válido' });
    }

    try {
      // Intentar consulta real al SII
      const response = await axios.get(`${SII_CONFIG.baseUrl}${SII_CONFIG.endpoints.contributorInfo.replace('{rut}', rut)}`, {
        headers: SII_CONFIG.headers,
        timeout: 10000
      });

      res.json({
        success: true,
        data: response.data,
        source: 'SII_API'
      });
    } catch (apiError) {
      // Fallback a datos mock
      const contributor = mockSIIData.contributors.find(c => c.rut === rut);
      if (contributor) {
        res.json({
          success: true,
          data: contributor,
          source: 'MOCK_DATA',
          note: 'Datos simulados - API SII no disponible'
        });
      } else {
        res.status(404).json({ success: false, error: 'Contribuyente no encontrado' });
      }
    }
  } catch (error) {
    console.error('Error consultando contribuyente:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Validar RUT
router.post('/validate-rut', authenticateToken, [
  body('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/)
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Formato de RUT inválido' });
    }

    const { rut } = req.body;
    const isValid = validateRUT(rut);

    res.json({
      success: true,
      data: {
        rut,
        valid: isValid,
        message: isValid ? 'RUT válido' : 'RUT inválido'
      }
    });
  } catch (error) {
    console.error('Error validando RUT:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estado tributario
router.get('/tax-status/:rut', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { rut } = req.params;
    
    if (!validateRUT(rut)) {
      return res.status(400).json({ success: false, error: 'RUT no válido' });
    }

    try {
      // Intentar consulta real al SII
      const response = await axios.get(`${SII_CONFIG.baseUrl}${SII_CONFIG.endpoints.taxStatus}`, {
        params: { rut },
        headers: SII_CONFIG.headers,
        timeout: 10000
      });

      res.json({
        success: true,
        data: response.data,
        source: 'SII_API'
      });
    } catch (apiError) {
      // Fallback a datos mock
      res.json({
        success: true,
        data: mockSIIData.taxStatus,
        source: 'MOCK_DATA',
        note: 'Datos simulados - API SII no disponible'
      });
    }
  } catch (error) {
    console.error('Error consultando estado tributario:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Enviar documento tributario al SII
router.post('/send-document', authenticateToken, [
  body('tipoDocumento').isIn(['FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO', 'FACTURA_COMPRA']),
  body('folio').isInt({ min: 1 }),
  body('fechaEmision').isISO8601(),
  body('rutEmisor').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  body('rutReceptor').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/),
  body('montoNeto').isFloat({ min: 0 }),
  body('montoIva').isFloat({ min: 0 }),
  body('montoTotal').isFloat({ min: 0 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos del documento inválidos' });
    }

    const documentData = req.body;

    try {
      // Intentar envío real al SII
      const response = await axios.post(`${SII_CONFIG.baseUrl}${SII_CONFIG.endpoints.invoices}`, documentData, {
        headers: SII_CONFIG.headers,
        timeout: 15000
      });

      res.json({
        success: true,
        message: 'Documento enviado exitosamente al SII',
        data: response.data,
        source: 'SII_API'
      });
    } catch (apiError) {
      // Simular respuesta exitosa
      res.json({
        success: true,
        message: 'Documento procesado (simulado)',
        data: {
          folio: documentData.folio,
          timbreElectronico: `TIMBRE_${Date.now()}`,
          fechaEnvio: new Date().toISOString(),
          estado: 'ENVIADO'
        },
        source: 'MOCK_DATA',
        note: 'Simulación - API SII no disponible'
      });
    }
  } catch (error) {
    console.error('Error enviando documento:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener libros contables
router.get('/books/:type', authenticateToken, [
  query('periodo').matches(/^\d{4}-\d{2}$/),
  query('rut').matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/)
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Parámetros inválidos' });
    }

    const { type } = req.params;
    const { periodo, rut } = req.query;

    if (!['ventas', 'compras', 'honorarios'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Tipo de libro inválido' });
    }

    try {
      // Intentar consulta real al SII
      const endpoint = type === 'ventas' ? SII_CONFIG.endpoints.salesBook :
                     type === 'compras' ? SII_CONFIG.endpoints.purchaseBook :
                     SII_CONFIG.endpoints.honorariumBook;

      const response = await axios.get(`${SII_CONFIG.baseUrl}${endpoint}`, {
        params: { periodo, rut },
        headers: SII_CONFIG.headers,
        timeout: 10000
      });

      res.json({
        success: true,
        data: response.data,
        source: 'SII_API'
      });
    } catch (apiError) {
      // Fallback a datos mock
      const mockBook = {
        tipo: type,
        periodo: periodo,
        rut: rut,
        totalDocumentos: 15,
        totalMontoNeto: 1500000,
        totalMontoIva: 285000,
        totalMontoTotal: 1785000,
        documentos: mockSIIData.invoices
      };

      res.json({
        success: true,
        data: mockBook,
        source: 'MOCK_DATA',
        note: 'Datos simulados - API SII no disponible'
      });
    }
  } catch (error) {
    console.error('Error obteniendo libro contable:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener declaraciones
router.get('/declarations/:rut', authenticateToken, [
  query('year').isInt({ min: 2020, max: 2030 })
], async (req: express.Request, res: express.Response) => {
  try {
    const { rut } = req.params;
    const { year } = req.query;

    if (!validateRUT(rut)) {
      return res.status(400).json({ success: false, error: 'RUT no válido' });
    }

    try {
      // Intentar consulta real al SII
      const response = await axios.get(`${SII_CONFIG.baseUrl}${SII_CONFIG.endpoints.declarations}`, {
        params: { rut, year },
        headers: SII_CONFIG.headers,
        timeout: 10000
      });

      res.json({
        success: true,
        data: response.data,
        source: 'SII_API'
      });
    } catch (apiError) {
      // Fallback a datos mock
      const mockDeclarations = {
        rut: rut,
        year: year,
        declarations: [
          {
            tipo: 'MENSUAL',
            periodo: `${year}-01`,
            fechaPresentacion: `${year}-02-28`,
            estado: 'PRESENTADA',
            monto: 150000
          },
          {
            tipo: 'ANUAL',
            periodo: year,
            fechaPresentacion: `${parseInt(year as string) + 1}-04-30`,
            estado: 'PENDIENTE',
            monto: 1800000
          }
        ]
      };

      res.json({
        success: true,
        data: mockDeclarations,
        source: 'MOCK_DATA',
        note: 'Datos simulados - API SII no disponible'
      });
    }
  } catch (error) {
    console.error('Error obteniendo declaraciones:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener certificados digitales
router.get('/certificates/:rut', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { rut } = req.params;

    if (!validateRUT(rut)) {
      return res.status(400).json({ success: false, error: 'RUT no válido' });
    }

    try {
      // Intentar consulta real al SII
      const response = await axios.get(`${SII_CONFIG.baseUrl}${SII_CONFIG.endpoints.certificates}`, {
        params: { rut },
        headers: SII_CONFIG.headers,
        timeout: 10000
      });

      res.json({
        success: true,
        data: response.data,
        source: 'SII_API'
      });
    } catch (apiError) {
      // Fallback a datos mock
      const mockCertificates = {
        rut: rut,
        certificates: [
          {
            tipo: 'CERTIFICADO_DIGITAL',
            fechaEmision: '2024-01-01',
            fechaVencimiento: '2025-01-01',
            estado: 'VIGENTE',
            numeroSerie: 'ABC123456789'
          }
        ]
      };

      res.json({
        success: true,
        data: mockCertificates,
        source: 'MOCK_DATA',
        note: 'Datos simulados - API SII no disponible'
      });
    }
  } catch (error) {
    console.error('Error obteniendo certificados:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Sincronizar datos con SII
router.post('/sync', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { rut, periodo } = req.body;

    if (!validateRUT(rut)) {
      return res.status(400).json({ success: false, error: 'RUT no válido' });
    }

    // Simular proceso de sincronización
    const syncResult = {
      rut: rut,
      periodo: periodo || new Date().toISOString().slice(0, 7),
      fechaSincronizacion: new Date().toISOString(),
      documentosSincronizados: 15,
      errores: [],
      estado: 'COMPLETADO'
    };

    res.json({
      success: true,
      message: 'Sincronización completada exitosamente',
      data: syncResult,
      source: 'MOCK_DATA',
      note: 'Simulación - API SII no disponible'
    });
  } catch (error) {
    console.error('Error sincronizando con SII:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
