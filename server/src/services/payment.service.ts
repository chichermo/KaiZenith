import { createClient } from 'redis';

// Importación opcional de Transbank
let WebpayPlus: any;
let Options: any;
let IntegrationCommerceCodes: any;
let IntegrationApiKeys: any;
let Environment: any;

try {
  const transbank = require('transbank-sdk');
  WebpayPlus = transbank.WebpayPlus;
  Options = transbank.Options;
  IntegrationCommerceCodes = transbank.IntegrationCommerceCodes;
  IntegrationApiKeys = transbank.IntegrationApiKeys;
  Environment = transbank.Environment;
} catch (error) {
  console.warn('Transbank SDK no disponible, usando modo mock');
}

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

// Configuración Transbank
const TBK_ENVIRONMENT = (process.env.TBK_ENVIRONMENT || 'integration') as 'integration' | 'production';
const TBK_COMMERCE_CODE = process.env.TBK_COMMERCE_CODE || (IntegrationCommerceCodes ? IntegrationCommerceCodes.WEBPLUS : '597055555532');
const TBK_API_KEY = process.env.TBK_API_KEY || (IntegrationApiKeys ? IntegrationApiKeys.WEBPLUS : '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1');

let webpay: any = null;

if (WebpayPlus && Options && IntegrationCommerceCodes && IntegrationApiKeys && Environment) {
  try {
    webpay = new WebpayPlus.Transaction(
      new Options(TBK_COMMERCE_CODE, TBK_API_KEY, TBK_ENVIRONMENT === 'production' ? Environment.Production : Environment.Integration)
    );
  } catch (error) {
    console.warn('Error inicializando Transbank, usando modo mock');
  }
}

interface PaymentRequest {
  invoiceId: string;
  amount: number;
  buyOrder: string;
  sessionId: string;
  returnUrl: string;
  finalUrl: string;
}

interface PaymentResponse {
  token: string;
  url: string;
}

interface PaymentConfirmation {
  token: string;
  amount: number;
  buyOrder: string;
  status: 'AUTHORIZED' | 'FAILED' | 'REJECTED';
  authorizationCode?: string;
  responseCode?: number;
}

/**
 * Servicio de Pagos con Transbank
 */
export class PaymentService {
  /**
   * Crear transacción de pago
   */
  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      if (!webpay) {
        // Modo mock para desarrollo
        return {
          token: `mock_token_${Date.now()}`,
          url: 'https://www.transbank.cl/mock',
        };
      }

      const response = await webpay.create(
        request.buyOrder,
        request.sessionId,
        request.amount,
        request.returnUrl
      );

      // Guardar transacción pendiente
      await this.savePendingPayment({
        invoiceId: request.invoiceId,
        token: response.token,
        amount: request.amount,
        buyOrder: request.buyOrder,
        createdAt: new Date().toISOString(),
      });

      return {
        token: response.token,
        url: response.url,
      };
    } catch (error: any) {
      console.error('Error creating payment:', error);
      throw new Error('Error creando transacción de pago');
    }
  }

  /**
   * Confirmar transacción (callback desde Transbank)
   */
  async confirmPayment(token: string): Promise<PaymentConfirmation> {
    try {
      if (!webpay) {
        // Modo mock
        return {
          token,
          amount: 0,
          buyOrder: '',
          status: 'AUTHORIZED',
          authorizationCode: 'MOCK_AUTH',
          responseCode: 0,
        };
      }

      const response = await webpay.commit(token);

      const confirmation: PaymentConfirmation = {
        token,
        amount: response.amount,
        buyOrder: response.buyOrder,
        status: response.responseCode === 0 ? 'AUTHORIZED' : 'FAILED',
        authorizationCode: response.authorizationCode,
        responseCode: response.responseCode,
      };

      // Si fue exitoso, marcar factura como pagada
      if (confirmation.status === 'AUTHORIZED') {
        await this.processSuccessfulPayment(confirmation);
      }

      // Guardar confirmación
      await this.savePaymentConfirmation(confirmation);

      return confirmation;
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      throw new Error('Error confirmando pago');
    }
  }

  /**
   * Obtener estado de transacción
   */
  async getPaymentStatus(token: string): Promise<any> {
    try {
      if (!webpay) {
        return { status: 'MOCK', token };
      }

      const response = await webpay.status(token);
      return response;
    } catch (error: any) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  }

  /**
   * Reembolsar transacción
   */
  async refundPayment(token: string, amount?: number): Promise<any> {
    try {
      if (!webpay) {
        return { token: `refund_${Date.now()}`, amount: amount || 0 };
      }

      // Primero obtener la transacción original
      const transaction = await this.getPaymentStatus(token);
      
      const refundAmount = amount || transaction.amount;
      const response = await webpay.refund(token, refundAmount);

      // Guardar reembolso
      await this.saveRefund({
        originalToken: token,
        refundToken: response.token,
        amount: refundAmount,
        createdAt: new Date().toISOString(),
      });

      return response;
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  private async savePendingPayment(payment: any) {
    if (redis) {
      await redis.setEx(
        `payment_pending:${payment.token}`,
        3600, // 1 hora
        JSON.stringify(payment)
      );
    }
  }

  private async savePaymentConfirmation(confirmation: PaymentConfirmation) {
    if (redis) {
      await redis.setEx(
        `payment_confirmation:${confirmation.token}`,
        31536000, // 1 año
        JSON.stringify(confirmation)
      );
    }
  }

  private async saveRefund(refund: any) {
    if (redis) {
      await redis.setEx(
        `payment_refund:${refund.refundToken}`,
        31536000,
        JSON.stringify(refund)
      );
    }
  }

  private async processSuccessfulPayment(confirmation: PaymentConfirmation) {
    // Obtener factura asociada
    if (!redis) return;
    const pendingPayment = await redis.get(`payment_pending:${confirmation.token}`);
    if (pendingPayment) {
      const payment = JSON.parse(pendingPayment);
      
      // TODO: Integrar con servicio de facturas
      // await invoiceService.markAsPaid(payment.invoiceId, {
      //   paymentMethod: 'TRANSBANK',
      //   transactionId: confirmation.token,
      //   authorizationCode: confirmation.authorizationCode,
      //   amount: confirmation.amount,
      // });

      console.log(`✅ Payment processed for invoice ${payment.invoiceId}`);
    }
  }
}

export const paymentService = new PaymentService();

