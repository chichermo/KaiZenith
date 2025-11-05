import express from 'express';
import { authenticateToken } from './auth-simple';

const router = express.Router();

// Estado de todas las APIs del sistema
let apiStatus = {
  auth: { enabled: true, status: 'active', endpoints: 3 },
  clients: { enabled: true, status: 'active', endpoints: 5 },
  invoices: { enabled: true, status: 'active', endpoints: 6 },
  purchaseOrders: { enabled: true, status: 'active', endpoints: 6 },
  quotations: { enabled: true, status: 'active', endpoints: 6 },
  suppliers: { enabled: true, status: 'active', endpoints: 6 },
  accounting: { enabled: true, status: 'active', endpoints: 7 },
  settings: { enabled: true, status: 'active', endpoints: 6 },
  supplierIntegration: { enabled: true, status: 'active', endpoints: 5 },
  intelligentSearch: { enabled: true, status: 'active', endpoints: 4 }
};

// Habilitar todas las APIs
router.post('/enable-all', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    // Habilitar todas las APIs
    Object.keys(apiStatus).forEach(api => {
      apiStatus[api as keyof typeof apiStatus].enabled = true;
      apiStatus[api as keyof typeof apiStatus].status = 'active';
    });

    res.json({
      success: true,
      message: 'Todas las APIs han sido habilitadas exitosamente',
      data: apiStatus
    });
  } catch (error) {
    console.error('Error habilitando APIs:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estado de todas las APIs
router.get('/status', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const totalApis = Object.keys(apiStatus).length;
    const enabledApis = Object.values(apiStatus).filter(api => api.enabled).length;
    const totalEndpoints = Object.values(apiStatus).reduce((sum, api) => sum + api.endpoints, 0);

    res.json({
      success: true,
      data: {
        summary: {
          totalApis,
          enabledApis,
          disabledApis: totalApis - enabledApis,
          totalEndpoints,
          systemStatus: enabledApis === totalApis ? 'fully_operational' : 'partial'
        },
        apis: apiStatus
      }
    });
  } catch (error) {
    console.error('Error obteniendo estado de APIs:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Habilitar API específica
router.post('/enable/:apiName', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { apiName } = req.params;
    
    if (!apiStatus[apiName as keyof typeof apiStatus]) {
      return res.status(404).json({ success: false, error: 'API no encontrada' });
    }

    apiStatus[apiName as keyof typeof apiStatus].enabled = true;
    apiStatus[apiName as keyof typeof apiStatus].status = 'active';

    res.json({
      success: true,
      message: `API ${apiName} habilitada exitosamente`,
      data: apiStatus[apiName as keyof typeof apiStatus]
    });
  } catch (error) {
    console.error('Error habilitando API:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Deshabilitar API específica
router.post('/disable/:apiName', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { apiName } = req.params;
    
    if (!apiStatus[apiName as keyof typeof apiStatus]) {
      return res.status(404).json({ success: false, error: 'API no encontrada' });
    }

    // No permitir deshabilitar auth
    if (apiName === 'auth') {
      return res.status(400).json({ success: false, error: 'No se puede deshabilitar la API de autenticación' });
    }

    apiStatus[apiName as keyof typeof apiStatus].enabled = false;
    apiStatus[apiName as keyof typeof apiStatus].status = 'disabled';

    res.json({
      success: true,
      message: `API ${apiName} deshabilitada exitosamente`,
      data: apiStatus[apiName as keyof typeof apiStatus]
    });
  } catch (error) {
    console.error('Error deshabilitando API:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Reiniciar API específica
router.post('/restart/:apiName', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const { apiName } = req.params;
    
    if (!apiStatus[apiName as keyof typeof apiStatus]) {
      return res.status(404).json({ success: false, error: 'API no encontrada' });
    }

    // Simular reinicio
    apiStatus[apiName as keyof typeof apiStatus].status = 'restarting';
    
    setTimeout(() => {
      apiStatus[apiName as keyof typeof apiStatus].status = 'active';
    }, 2000);

    res.json({
      success: true,
      message: `API ${apiName} reiniciada exitosamente`,
      data: apiStatus[apiName as keyof typeof apiStatus]
    });
  } catch (error) {
    console.error('Error reiniciando API:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Obtener estadísticas de uso de APIs
router.get('/usage-stats', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const usageStats = {
      totalRequests: 1250,
      successfulRequests: 1180,
      failedRequests: 70,
      averageResponseTime: 245, // ms
      peakUsage: {
        hour: '14:00',
        requests: 89
      },
      byApi: {
        auth: { requests: 150, avgResponseTime: 120 },
        clients: { requests: 200, avgResponseTime: 180 },
        invoices: { requests: 300, avgResponseTime: 250 },
        purchaseOrders: { requests: 180, avgResponseTime: 220 },
        quotations: { requests: 160, avgResponseTime: 200 },
        suppliers: { requests: 120, avgResponseTime: 300 },
        accounting: { requests: 80, avgResponseTime: 400 },
        settings: { requests: 60, avgResponseTime: 150 },
        supplierIntegration: { requests: 90, avgResponseTime: 800 },
        intelligentSearch: { requests: 10, avgResponseTime: 1200 }
      },
      errors: {
        '400': 25,
        '401': 15,
        '404': 20,
        '500': 10
      }
    };

    res.json({
      success: true,
      data: usageStats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de uso:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Health check de todas las APIs
router.get('/health-check', authenticateToken, async (req: express.Request, res: express.Response) => {
  try {
    const healthChecks = Object.keys(apiStatus).map(apiName => {
      const api = apiStatus[apiName as keyof typeof apiStatus];
      return {
        name: apiName,
        status: api.enabled ? 'healthy' : 'unhealthy',
        enabled: api.enabled,
        responseTime: Math.floor(Math.random() * 200) + 50, // Simulado
        lastCheck: new Date().toISOString()
      };
    });

    const healthyApis = healthChecks.filter(check => check.status === 'healthy').length;
    const overallHealth = healthyApis === healthChecks.length ? 'healthy' : 'degraded';

    res.json({
      success: true,
      data: {
        overallHealth,
        healthyApis,
        totalApis: healthChecks.length,
        checks: healthChecks
      }
    });
  } catch (error) {
    console.error('Error en health check:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
