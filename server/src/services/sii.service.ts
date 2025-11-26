import axios from 'axios';
import { createClient } from 'redis';
import * as cron from 'node-cron';

let redis: ReturnType<typeof createClient> | null = null;

try {
  redis = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  redis.on('error', (err) => console.error('Redis Client Error', err));
  redis.connect().catch(console.error);
} catch (error) {
  console.warn('Redis no disponible');
}

// Configuración Facturador Electrónico
const FACTURADOR_API_KEY = process.env.FACTURADOR_API_KEY || '';
const FACTURADOR_BASE_URL = process.env.FACTURADOR_BASE_URL || 'https://api.facturadorpro.cl/v1';
const SII_ENVIRONMENT = process.env.SII_ENVIRONMENT || 'test'; // 'test' o 'production'

interface SIIDocument {
  tipo: 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO' | 'FACTURA_COMPRA';
  folio: number;
  fechaEmision: string;
  rutEmisor: string;
  rutReceptor: string;
  montoNeto: number;
  montoIva: number;
  montoTotal: number;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    total: number;
  }>;
}

interface SIIResponse {
  folio: number;
  timbreElectronico: string;
  fechaEnvio: string;
  estado: 'ENVIADO' | 'RECHAZADO' | 'PENDIENTE';
  trackId: string;
  numeroOperacion?: string;
}

interface TaxStatus {
  rut: string;
  razonSocial: string;
  estado: string;
  ultimaDeclaracion: string;
  proximaDeclaracion: string;
  saldoFavor: number;
  saldoDeuda: number;
}

/**
 * Servicio de Integración con SII
 */
export class SIIService {
  /**
   * Validar RUT con SII
   */
  async validateRUT(rut: string): Promise<TaxStatus | null> {
    try {
      // Verificar cache
      if (redis) {
        const cacheKey = `rut_validation:${rut}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Consultar SII (usando facturador como intermediario)
      const response = await axios.get(
        `${FACTURADOR_BASE_URL}/contribuyentes/${rut}`,
        {
          headers: {
            'Authorization': `Bearer ${FACTURADOR_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const taxStatus: TaxStatus = {
        rut,
        razonSocial: response.data.razon_social,
        estado: response.data.estado,
        ultimaDeclaracion: response.data.ultima_declaracion,
        proximaDeclaracion: response.data.proxima_declaracion,
        saldoFavor: response.data.saldo_favor || 0,
        saldoDeuda: response.data.saldo_deuda || 0,
      };

      // Cachear por 24 horas
      if (redis) {
        await redis.setEx(cacheKey, 86400, JSON.stringify(taxStatus));
      }

      return taxStatus;
    } catch (error: any) {
      console.error('Error validating RUT:', error.response?.data || error.message);
      
      // Fallback para desarrollo
      if (!FACTURADOR_API_KEY) {
        return {
          rut,
          razonSocial: 'Empresa Demo',
          estado: 'HABILITADO',
          ultimaDeclaracion: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          proximaDeclaracion: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          saldoFavor: 0,
          saldoDeuda: 0,
        };
      }
      
      return null;
    }
  }

  /**
   * Enviar documento al SII
   */
  async sendDocument(document: SIIDocument): Promise<SIIResponse> {
    try {
      // Validar documento antes de enviar
      const validation = await this.validateDocument(document);
      if (!validation.valid) {
        throw new Error(`Documento inválido: ${validation.errors.join(', ')}`);
      }

      // Firmar documento digitalmente
      const signedDocument = await this.signDocument(document);

      // Enviar a SII usando facturador
      const response = await axios.post(
        `${FACTURADOR_BASE_URL}/documentos/enviar`,
        {
          ...signedDocument,
          ambiente: SII_ENVIRONMENT,
        },
        {
          headers: {
            'Authorization': `Bearer ${FACTURADOR_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const siiResponse: SIIResponse = {
        folio: response.data.folio,
        timbreElectronico: response.data.timbre_electronico,
        fechaEnvio: response.data.fecha_envio,
        estado: response.data.estado,
        trackId: response.data.track_id,
        numeroOperacion: response.data.numero_operacion,
      };

      // Guardar respuesta
      await this.saveSIIDocument(document.folio, siiResponse);

      return siiResponse;
    } catch (error: any) {
      console.error('Error sending document to SII:', error.response?.data || error.message);
      
      // Fallback para desarrollo
      if (!FACTURADOR_API_KEY) {
        return {
          folio: document.folio,
          timbreElectronico: `TIMBRE_${Date.now()}`,
          fechaEnvio: new Date().toISOString(),
          estado: 'ENVIADO',
          trackId: `TRACK_${Date.now()}`,
        };
      }
      
      throw error;
    }
  }

  /**
   * Sincronizar libros contables
   */
  async syncAccountingBooks(rut: string, period: string): Promise<any> {
    try {
      // Obtener documentos del período
      // TODO: Integrar con servicio de facturas
      const documents = {
        sales: [], // await invoiceService.getSalesByPeriod(period),
        purchases: [], // await invoiceService.getPurchasesByPeriod(period),
      };

      // Generar libro de ventas
      const salesBook = this.generateSalesBook(documents.sales);

      // Generar libro de compras
      const purchaseBook = this.generatePurchaseBook(documents.purchases);

      // Enviar a SII
      const response = await axios.post(
        `${FACTURADOR_BASE_URL}/libros/sincronizar`,
        {
          rut,
          periodo: period,
          libroVentas: salesBook,
          libroCompras: purchaseBook,
        },
        {
          headers: {
            'Authorization': `Bearer ${FACTURADOR_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Guardar confirmación
      await this.saveBookConfirmation(period, response.data);

      return response.data;
    } catch (error: any) {
      console.error('Error syncing books:', error.response?.data || error.message);
      
      // Fallback para desarrollo
      if (!FACTURADOR_API_KEY) {
        return {
          periodo: period,
          numeroConfirmacion: `CONF_${Date.now()}`,
          fechaEnvio: new Date().toISOString(),
          estado: 'ENVIADO',
        };
      }
      
      throw error;
    }
  }

  /**
   * Generar y enviar declaración mensual
   */
  async generateMonthlyDeclaration(rut: string, period: string): Promise<any> {
    try {
      // Obtener datos del período
      const periodData = await this.getPeriodData(rut, period);

      // Calcular impuestos
      const taxes = this.calculateTaxes(periodData);

      // Generar declaración
      const declaration = {
        rut,
        periodo: period,
        tipo: 'MENSUAL',
        ventas: periodData.sales,
        compras: periodData.purchases,
        ivaDebito: taxes.ivaDebito,
        ivaCredito: taxes.ivaCredito,
        ivaPagar: taxes.ivaPagar,
      };

      // Enviar a SII
      const response = await axios.post(
        `${FACTURADOR_BASE_URL}/declaraciones/enviar`,
        declaration,
        {
          headers: {
            'Authorization': `Bearer ${FACTURADOR_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Guardar confirmación
      await this.saveDeclarationConfirmation(period, response.data);

      // Programar recordatorio de pago si aplica
      if (taxes.ivaPagar > 0) {
        await this.schedulePaymentReminder(taxes.ivaPagar, response.data.fechaVencimiento);
      }

      return response.data;
    } catch (error: any) {
      console.error('Error generating declaration:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Configurar sincronización automática mensual
   */
  setupAutoSync() {
    // Sincronizar libros el día 1 de cada mes a las 2 AM
    cron.schedule('0 2 1 * *', async () => {
      try {
        const lastMonth = this.getLastMonth();
        const companyRut = process.env.COMPANY_RUT || '';
        
        if (companyRut) {
          await this.syncAccountingBooks(companyRut, lastMonth);
          console.log(`✅ Auto-synced accounting books for ${lastMonth}`);
        }
      } catch (error) {
        console.error('Error in auto-sync:', error);
      }
    });

    // Generar declaración el día 12 de cada mes
    cron.schedule('0 2 12 * *', async () => {
      try {
        const lastMonth = this.getLastMonth();
        const companyRut = process.env.COMPANY_RUT || '';
        
        if (companyRut) {
          await this.generateMonthlyDeclaration(companyRut, lastMonth);
          console.log(`✅ Auto-generated declaration for ${lastMonth}`);
        }
      } catch (error) {
        console.error('Error in auto-declaration:', error);
      }
    });
  }

  // Métodos auxiliares
  private async validateDocument(document: SIIDocument): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!document.rutEmisor || !this.isValidRUT(document.rutEmisor)) {
      errors.push('RUT emisor inválido');
    }

    if (!document.rutReceptor || !this.isValidRUT(document.rutReceptor)) {
      errors.push('RUT receptor inválido');
    }

    if (document.montoTotal !== document.montoNeto + document.montoIva) {
      errors.push('Montos no coinciden');
    }

    if (document.items.length === 0) {
      errors.push('Documento debe tener al menos un item');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async signDocument(document: SIIDocument): Promise<any> {
    // TODO: Implementar firma digital con certificado
    // Por ahora, retornar documento sin firma (el facturador lo hará)
    return document;
  }

  private generateSalesBook(sales: any[]): any {
    return {
      totalDocumentos: sales.length,
      totalMontoNeto: sales.reduce((sum, s) => sum + s.neto, 0),
      totalMontoIva: sales.reduce((sum, s) => sum + s.iva, 0),
      totalMontoTotal: sales.reduce((sum, s) => sum + s.total, 0),
      documentos: sales,
    };
  }

  private generatePurchaseBook(purchases: any[]): any {
    return {
      totalDocumentos: purchases.length,
      totalMontoNeto: purchases.reduce((sum, p) => sum + p.neto, 0),
      totalMontoIva: purchases.reduce((sum, p) => sum + p.iva, 0),
      totalMontoTotal: purchases.reduce((sum, p) => sum + p.total, 0),
      documentos: purchases,
    };
  }

  private async getPeriodData(rut: string, period: string): Promise<any> {
    // TODO: Integrar con servicio de facturas
    return {
      sales: [],
      purchases: [],
    };
  }

  private calculateTaxes(periodData: any): { ivaDebito: number; ivaCredito: number; ivaPagar: number } {
    const ivaDebito = periodData.sales.reduce((sum: number, s: any) => sum + (s.iva || 0), 0);
    const ivaCredito = periodData.purchases.reduce((sum: number, p: any) => sum + (p.iva || 0), 0);
    const ivaPagar = ivaDebito - ivaCredito;

    return { ivaDebito, ivaCredito, ivaPagar };
  }

  private async saveSIIDocument(folio: number, response: SIIResponse) {
    if (redis) {
      await redis.setEx(
        `sii_document:${folio}`,
        31536000, // 1 año
        JSON.stringify(response)
      );
    }
  }

  private async saveBookConfirmation(period: string, confirmation: any) {
    if (redis) {
      await redis.setEx(
        `sii_book:${period}`,
        31536000,
        JSON.stringify(confirmation)
      );
    }
  }

  private async saveDeclarationConfirmation(period: string, declaration: any) {
    if (redis) {
      await redis.setEx(
        `sii_declaration:${period}`,
        31536000,
        JSON.stringify(declaration)
      );
    }
  }

  private async schedulePaymentReminder(amount: number, dueDate: string) {
    // TODO: Integrar con servicio de notificaciones
    console.log(`📅 Payment reminder scheduled: $${amount} due on ${dueDate}`);
  }

  private isValidRUT(rut: string): boolean {
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/;
    return rutRegex.test(rut);
  }

  private getLastMonth(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

export const siiService = new SIIService();

// Inicializar auto-sync al cargar el servicio (solo si no estamos en modo test)
if (process.env.NODE_ENV !== 'test') {
  try {
    siiService.setupAutoSync();
  } catch (error) {
    console.warn('Error setting up auto-sync:', error);
  }
}

