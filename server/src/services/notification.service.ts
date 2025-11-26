import { createClient } from 'redis';

// Importaciones opcionales
let sgMail: any;
try {
  sgMail = require('@sendgrid/mail');
} catch (error) {
  console.warn('SendGrid no disponible');
}

let admin: any;
try {
  admin = require('firebase-admin');
} catch (error) {
  console.warn('Firebase Admin no disponible');
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

// Configuración SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// Configuración Firebase (FCM)
let firebaseApp: admin.app.App | null = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: any;
  fcmToken?: string;
}

/**
 * Servicio de Notificaciones
 */
export class NotificationService {
  private defaultFrom = process.env.SENDGRID_FROM_EMAIL || 'noreply@patolin.cl';

  /**
   * Enviar email con SendGrid
   */
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      if (!SENDGRID_API_KEY) {
        console.log('📧 [MOCK] Email would be sent:', notification);
        return true; // Mock en desarrollo
      }

      const msg = {
        to: notification.to,
        from: notification.from || this.defaultFrom,
        subject: notification.subject,
        html: notification.html,
        text: notification.text || this.htmlToText(notification.html),
      };

      await sgMail.send(msg);
      console.log(`✅ Email sent to ${notification.to}`);
      return true;
    } catch (error: any) {
      console.error('Error sending email:', error.response?.body || error);
      return false;
    }
  }

  /**
   * Enviar factura por email
   */
  async sendInvoiceEmail(invoice: any, clientEmail: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fe; padding: 20px; border-radius: 0 0 8px 8px; }
            .invoice-details { background: white; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .total { font-size: 1.5em; font-weight: bold; color: #5e72e4; }
            .button { display: inline-block; padding: 12px 24px; background: #5e72e4; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Factura ${invoice.number}</h1>
            </div>
            <div class="content">
              <p>Estimado/a cliente,</p>
              <p>Adjuntamos su factura por un monto de <strong>$${invoice.total.toLocaleString('es-CL')}</strong>.</p>
              
              <div class="invoice-details">
                <p><strong>Número:</strong> ${invoice.number}</p>
                <p><strong>Fecha:</strong> ${new Date(invoice.date).toLocaleDateString('es-CL')}</p>
                <p><strong>Vencimiento:</strong> ${new Date(invoice.due_date).toLocaleDateString('es-CL')}</p>
                <p class="total">Total: $${invoice.total.toLocaleString('es-CL')}</p>
              </div>

              <a href="${process.env.FRONTEND_URL}/invoices/${invoice.id}" class="button">Ver Factura</a>
              
              <p style="margin-top: 30px; font-size: 0.9em; color: #666;">
                Este es un email automático, por favor no responder.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: clientEmail,
      subject: `Factura ${invoice.number} - Patolin Construction`,
      html,
    });
  }

  /**
   * Enviar notificación push con FCM
   */
  async sendPushNotification(notification: PushNotification): Promise<boolean> {
    try {
      if (!firebaseApp) {
        console.log('📱 [MOCK] Push notification would be sent:', notification);
        return true; // Mock en desarrollo
      }

      // Obtener FCM token del usuario
      let fcmToken = notification.fcmToken;
      if (!fcmToken) {
        fcmToken = await this.getFCMToken(notification.userId);
      }

      if (!fcmToken) {
        console.warn(`No FCM token found for user ${notification.userId}`);
        return false;
      }

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        token: fcmToken,
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Push notification sent: ${response}`);
      
      return true;
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Enviar notificación a múltiples usuarios
   */
  async sendBulkPushNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: any
  ): Promise<number> {
    let successCount = 0;

    for (const userId of userIds) {
      const sent = await this.sendPushNotification({
        userId,
        title,
        body,
        data,
      });
      if (sent) successCount++;
    }

    return successCount;
  }

  /**
   * Enviar recordatorio de pago
   */
  async sendPaymentReminder(invoice: any, clientEmail: string, daysUntilDue: number): Promise<void> {
    // Email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Recordatorio de Pago</h2>
        <p>Estimado/a cliente,</p>
        <p>Le recordamos que la factura <strong>${invoice.number}</strong> vence en <strong>${daysUntilDue} día(s)</strong>.</p>
        <p><strong>Monto:</strong> $${invoice.total.toLocaleString('es-CL')}</p>
        <p><strong>Fecha de vencimiento:</strong> ${new Date(invoice.due_date).toLocaleDateString('es-CL')}</p>
        <a href="${process.env.FRONTEND_URL}/invoices/${invoice.id}" style="display: inline-block; padding: 12px 24px; background: #5e72e4; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Pagar Ahora
        </a>
      </div>
    `;

    await this.sendEmail({
      to: clientEmail,
      subject: `Recordatorio: Factura ${invoice.number} vence en ${daysUntilDue} día(s)`,
      html: emailHtml,
    });

    // Push notification (si el usuario tiene la app)
    // TODO: Obtener userId del cliente
    // await this.sendPushNotification({
    //   userId: client.userId,
    //   title: 'Recordatorio de Pago',
    //   body: `La factura ${invoice.number} vence en ${daysUntilDue} día(s)`,
    //   data: { invoiceId: invoice.id, type: 'PAYMENT_REMINDER' },
    // });
  }

  /**
   * Enviar alerta de declaración tributaria
   */
  async sendTaxDeclarationAlert(rut: string, daysUntilDue: number): Promise<void> {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Alerta: Declaración Tributaria</h2>
        <p>Le recordamos que su declaración tributaria vence en <strong>${daysUntilDue} día(s)</strong>.</p>
        <p>Por favor, genere y envíe su declaración antes de la fecha de vencimiento.</p>
        <a href="${process.env.FRONTEND_URL}/settings/integrations" style="display: inline-block; padding: 12px 24px; background: #5e72e4; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">
          Ver Declaraciones
        </a>
      </div>
    `;

    // TODO: Obtener email del usuario/empresa
    const companyEmail = process.env.COMPANY_EMAIL || 'admin@patolin.cl';

    await this.sendEmail({
      to: companyEmail,
      subject: `Alerta: Declaración tributaria vence en ${daysUntilDue} día(s)`,
      html: emailHtml,
    });
  }

  // Métodos auxiliares
  private async getFCMToken(userId: string): Promise<string | null> {
    if (redis) {
      return await redis.get(`fcm_token:${userId}`);
    }
    return null;
  }

  async saveFCMToken(userId: string, token: string): Promise<void> {
    if (redis) {
      await redis.setEx(`fcm_token:${userId}`, 31536000, token); // 1 año
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}

export const notificationService = new NotificationService();

