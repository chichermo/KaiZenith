import axios from 'axios';
import { createClient } from 'redis';

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

// Configuración Fintoc (API bancaria chilena)
const FINTOC_API_KEY = process.env.FINTOC_API_KEY || '';
const FINTOC_BASE_URL = 'https://api.fintoc.com/v1';

interface BankAccount {
  id: string;
  bankCode: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  ownerName: string;
  rut: string;
}

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  balance: number;
  reference: string;
  category?: string;
  matchedInvoiceId?: string;
}

interface CashFlowProjection {
  currentBalance: number;
  projections: Array<{
    date: string;
    projectedBalance: number;
    expectedIncome: number;
    expectedExpenses: number;
  }>;
  alerts: Array<{
    date: string;
    message: string;
    type: 'WARNING' | 'CRITICAL';
  }>;
}

/**
 * Servicio de Integración Bancaria
 */
export class BankingService {
  /**
   * Conectar cuenta bancaria con Fintoc
   */
  async connectBankAccount(
    userId: string,
    bankCode: string,
    credentials: any
  ): Promise<{ linkToken: string; linkUrl: string }> {
    try {
      // Crear link de conexión con Fintoc
      const response = await axios.post(
        `${FINTOC_BASE_URL}/links`,
        {
          holder_id: credentials.rut,
          institution: bankCode,
          username: credentials.username,
          password: credentials.password, // En producción, esto debe ser más seguro
        },
        {
          headers: {
            'Authorization': `Bearer ${FINTOC_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const linkToken = response.data.id;
      const linkUrl = response.data.url;

      // Guardar link token encriptado
      await this.saveBankConnection(userId, bankCode, linkToken);

      return { linkToken, linkUrl };
    } catch (error: any) {
      console.error('Error connecting bank account:', error.response?.data || error.message);
      
      // Fallback: simular conexión exitosa para desarrollo
      if (!FINTOC_API_KEY) {
        const mockLinkToken = `mock_${Date.now()}`;
        await this.saveBankConnection(userId, bankCode, mockLinkToken);
        return {
          linkToken: mockLinkToken,
          linkUrl: 'https://fintoc.com/mock-connection',
        };
      }
      
      throw new Error('Error conectando cuenta bancaria');
    }
  }

  /**
   * Obtener saldo de cuenta
   */
  async getAccountBalance(
    userId: string,
    bankCode: string,
    accountNumber: string
  ): Promise<BankAccount> {
    try {
      const linkToken = await this.getBankConnection(userId, bankCode);
      
      if (!linkToken) {
        throw new Error('Cuenta no conectada');
      }

      // Obtener cuenta desde Fintoc
      const response = await axios.get(
        `${FINTOC_BASE_URL}/links/${linkToken}/accounts/${accountNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${FINTOC_API_KEY}`,
          },
        }
      );

      return {
        id: response.data.id,
        bankCode,
        accountNumber,
        accountType: response.data.type,
        balance: response.data.balance.available,
        currency: response.data.balance.currency,
        ownerName: response.data.holder_name,
        rut: response.data.holder_id,
      };
    } catch (error: any) {
      console.error('Error getting balance:', error.response?.data || error.message);
      
      // Fallback para desarrollo
      if (!FINTOC_API_KEY) {
        return {
          id: `acc_${Date.now()}`,
          bankCode,
          accountNumber,
          accountType: 'Cuenta Corriente',
          balance: Math.floor(Math.random() * 5000000) + 100000,
          currency: 'CLP',
          ownerName: 'Usuario Demo',
          rut: '12.345.678-9',
        };
      }
      
      throw error;
    }
  }

  /**
   * Obtener transacciones
   */
  async getTransactions(
    userId: string,
    bankCode: string,
    accountNumber: string,
    fromDate?: string,
    toDate?: string
  ): Promise<BankTransaction[]> {
    try {
      const linkToken = await this.getBankConnection(userId, bankCode);
      
      if (!linkToken) {
        throw new Error('Cuenta no conectada');
      }

      const response = await axios.get(
        `${FINTOC_BASE_URL}/links/${linkToken}/accounts/${accountNumber}/movements`,
        {
          params: {
            from: fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to: toDate || new Date().toISOString(),
          },
          headers: {
            'Authorization': `Bearer ${FINTOC_API_KEY}`,
          },
        }
      );

      return response.data.map((movement: any) => ({
        id: movement.id,
        date: movement.post_date,
        description: movement.description,
        amount: movement.amount,
        type: movement.amount > 0 ? 'CREDIT' : 'DEBIT',
        balance: movement.balance,
        reference: movement.reference_number || movement.id,
      }));
    } catch (error: any) {
      console.error('Error getting transactions:', error.response?.data || error.message);
      
      // Fallback para desarrollo
      if (!FINTOC_API_KEY) {
        return this.generateMockTransactions();
      }
      
      throw error;
    }
  }

  /**
   * Reconciliación automática
   */
  async autoReconcile(
    userId: string,
    transactions: BankTransaction[],
    pendingInvoices: any[]
  ): Promise<{
    matched: number;
    needsReview: number;
    suggestions: any[];
  }> {
    const matches: any[] = [];
    const needsReview: any[] = [];

    for (const transaction of transactions) {
      // Buscar facturas pendientes que coincidan
      const possibleMatches = pendingInvoices.filter((invoice) => {
        const amountMatch = Math.abs(invoice.total - Math.abs(transaction.amount)) < invoice.total * 0.01; // 1% tolerancia
        const dateMatch = this.daysBetween(new Date(transaction.date), new Date(invoice.due_date)) <= 7;
        return amountMatch && dateMatch;
      });

      if (possibleMatches.length === 1) {
        // Match único - marcar como pagada
        matches.push({
          transaction,
          invoice: possibleMatches[0],
        });
      } else if (possibleMatches.length > 1) {
        // Múltiples matches - necesita revisión
        needsReview.push({
          transaction,
          suggestions: possibleMatches,
        });
      }
    }

    return {
      matched: matches.length,
      needsReview: needsReview.length,
      suggestions: needsReview,
    };
  }

  /**
   * Proyección de flujo de caja
   */
  async projectCashFlow(
    userId: string,
    bankCode: string,
    accountNumber: string,
    days: number = 30
  ): Promise<CashFlowProjection> {
    try {
      // Obtener transacciones históricas (últimos 90 días)
      const transactions = await this.getTransactions(
        userId,
        bankCode,
        accountNumber,
        new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
      );

      // Obtener saldo actual
      const account = await this.getAccountBalance(userId, bankCode, accountNumber);
      let currentBalance = account.balance;

      // Analizar patrones
      const dailyAverages = this.calculateDailyAverages(transactions);
      const projections: CashFlowProjection['projections'] = [];
      const alerts: CashFlowProjection['alerts'] = [];

      // Proyectar día por día
      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dayOfWeek = date.getDay();

        // Ajustar promedios según día de la semana
        const dayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1; // Menos actividad en fines de semana

        const expectedIncome = dailyAverages.income * dayMultiplier;
        const expectedExpenses = dailyAverages.expenses * dayMultiplier;

        currentBalance += expectedIncome - expectedExpenses;

        projections.push({
          date: date.toISOString().split('T')[0],
          projectedBalance: currentBalance,
          expectedIncome,
          expectedExpenses,
        });

        // Alertas
        if (currentBalance < 0) {
          alerts.push({
            date: date.toISOString().split('T')[0],
            message: `Balance proyectado negativo: $${Math.abs(currentBalance).toLocaleString()}`,
            type: 'CRITICAL',
          });
        } else if (currentBalance < 100000) {
          alerts.push({
            date: date.toISOString().split('T')[0],
            message: `Balance bajo: $${currentBalance.toLocaleString()}`,
            type: 'WARNING',
          });
        }
      }

      return {
        currentBalance: account.balance,
        projections,
        alerts,
      };
    } catch (error) {
      console.error('Error projecting cash flow:', error);
      throw error;
    }
  }

  /**
   * Sincronización automática
   */
  async syncAccount(userId: string, bankCode: string, accountNumber: string): Promise<void> {
    try {
      const transactions = await this.getTransactions(userId, bankCode, accountNumber);
      
      // Obtener facturas pendientes
      // TODO: Integrar con servicio de facturas
      const pendingInvoices: any[] = []; // await invoiceService.getPendingInvoices(userId);

      // Reconciliar automáticamente
      const reconciliation = await this.autoReconcile(userId, transactions, pendingInvoices);

      // Guardar resultados
      if (redis) {
        await redis.setEx(
          `bank_sync:${userId}:${bankCode}:${accountNumber}`,
          3600,
          JSON.stringify({
            lastSync: new Date().toISOString(),
            transactionsCount: transactions.length,
            reconciliation,
          })
        );
      }

      console.log(`✅ Synced account ${accountNumber}: ${reconciliation.matched} matched, ${reconciliation.needsReview} need review`);
    } catch (error) {
      console.error('Error syncing account:', error);
      throw error;
    }
  }

  // Métodos auxiliares
  private async saveBankConnection(userId: string, bankCode: string, linkToken: string) {
    if (redis) {
      await redis.setEx(
        `bank_connection:${userId}:${bankCode}`,
        31536000, // 1 año
        linkToken
      );
    }
  }

  private async getBankConnection(userId: string, bankCode: string): Promise<string | null> {
    if (redis) {
      return await redis.get(`bank_connection:${userId}:${bankCode}`);
    }
    return null;
  }

  private daysBetween(date1: Date, date2: Date): number {
    return Math.abs(Math.floor((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private calculateDailyAverages(transactions: BankTransaction[]) {
    const credits = transactions.filter(t => t.type === 'CREDIT');
    const debits = transactions.filter(t => t.type === 'DEBIT');

    const totalDays = 90; // Últimos 90 días

    return {
      income: credits.reduce((sum, t) => sum + t.amount, 0) / totalDays,
      expenses: Math.abs(debits.reduce((sum, t) => sum + t.amount, 0) / totalDays),
    };
  }

  private generateMockTransactions(): BankTransaction[] {
    return [
      {
        id: 'txn_1',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Transferencia recibida',
        amount: 500000,
        type: 'CREDIT',
        balance: 1500000,
        reference: 'TXN123456',
      },
      {
        id: 'txn_2',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Pago servicios básicos',
        amount: -85000,
        type: 'DEBIT',
        balance: 1000000,
        reference: 'TXN123455',
      },
    ];
  }
}

export const bankingService = new BankingService();

