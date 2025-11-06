// Funciones para generar asientos contables automáticos desde transacciones

// Tipo local para asientos contables (estructura diferente al tipo AccountingEntry en types)
export interface AccountingEntryExtended {
  id: number;
  date: Date | string;
  reference?: string;
  reference_type?: 'invoice' | 'invoice_payment' | 'purchase_order' | 'supplier_payment' | 'inventory' | 'expense' | 'purchase_invoice';
  reference_id?: number;
  description: string;
  entries: Array<{
    account: string;
    debit: number;
    credit: number;
    description: string;
  }>;
  total_debit: number;
  total_credit: number;
  created_at: Date;
  updated_at: Date;
}

// Generar asiento contable desde factura de venta
export const generateInvoiceAccountingEntry = (invoice: any): AccountingEntryExtended => {
  const entries = [
    {
      account: '1201', // Cuentas por Cobrar Clientes
      debit: invoice.total,
      credit: 0,
      description: `Factura ${invoice.invoice_number} - ${invoice.client_name}`
    },
    {
      account: '4101', // Ventas de Servicios
      debit: 0,
      credit: invoice.subtotal,
      description: `Venta de servicios - Factura ${invoice.invoice_number}`
    },
    {
      account: '2105', // IVA Débito Fiscal (por cobrar)
      debit: 0,
      credit: invoice.tax,
      description: `IVA Factura ${invoice.invoice_number}`
    }
  ];

  return {
    id: 0, // Se asignará al guardar
    date: new Date(invoice.date),
    reference: invoice.invoice_number,
    reference_type: 'invoice',
    reference_id: invoice.id,
    description: `Factura ${invoice.invoice_number} - ${invoice.client_name}`,
    entries,
    total_debit: invoice.total,
    total_credit: invoice.total,
    created_at: new Date(),
    updated_at: new Date()
  };
};

// Generar asiento contable desde pago de factura
export const generateInvoicePaymentAccountingEntry = (invoice: any, payment: any): AccountingEntryExtended => {
  const entries = [
    {
      account: payment.method === 'transferencia' ? '1102' : '1101', // Banco o Caja
      debit: invoice.total,
      credit: 0,
      description: `Pago Factura ${invoice.invoice_number}`
    },
    {
      account: '1201', // Cuentas por Cobrar Clientes
      debit: 0,
      credit: invoice.total,
      description: `Pago Factura ${invoice.invoice_number} - ${invoice.client_name}`
    }
  ];

  return {
    id: 0,
    date: new Date(payment.date),
    reference: payment.reference || `PAY-${invoice.invoice_number}`,
    reference_type: 'invoice_payment',
    reference_id: payment.id,
    description: `Pago Factura ${invoice.invoice_number}`,
    entries,
    total_debit: invoice.total,
    total_credit: invoice.total,
    created_at: new Date(),
    updated_at: new Date()
  };
};

// Generar asiento contable desde orden de compra (cuando se recibe)
export const generatePurchaseOrderAccountingEntry = (order: any, received: boolean = false): AccountingEntryExtended => {
  // Si received es false, solo registra la cuenta por pagar
  // Si received es true, registra también el inventario
  const entries = received ? [
    {
      account: '1302', // Materiales (o el tipo de inventario correspondiente)
      debit: order.subtotal,
      credit: 0,
      description: `Materiales de Orden ${order.order_number}`
    },
    {
      account: '2105', // IVA Crédito Fiscal
      debit: order.tax,
      credit: 0,
      description: `IVA Crédito Fiscal Orden ${order.order_number}`
    },
    {
      account: '2101', // Cuentas por Pagar Proveedores
      debit: 0,
      credit: order.total,
      description: `Orden de Compra ${order.order_number} - ${order.supplier_name}`
    }
  ] : [
    {
      account: '2101', // Cuentas por Pagar Proveedores
      debit: 0,
      credit: order.total,
      description: `Orden de Compra ${order.order_number} - ${order.supplier_name}`
    }
  ];

  return {
    id: 0,
    date: new Date(order.date),
    reference: order.order_number,
    reference_type: 'purchase_order',
    reference_id: order.id,
    description: `Orden de Compra ${order.order_number}`,
    entries,
    total_debit: received ? order.total : 0,
    total_credit: order.total,
    created_at: new Date(),
    updated_at: new Date()
  };
};

// Generar asiento contable desde pago a proveedor
export const generateSupplierPaymentAccountingEntry = (order: any, payment: any): AccountingEntryExtended => {
  const entries = [
    {
      account: '2101', // Cuentas por Pagar Proveedores
      debit: order.total,
      credit: 0,
      description: `Pago Orden ${order.order_number}`
    },
    {
      account: payment.method === 'transferencia' ? '1102' : '1101', // Banco o Caja
      debit: 0,
      credit: order.total,
      description: `Pago a ${order.supplier_name} - Orden ${order.order_number}`
    }
  ];

  return {
    id: 0,
    date: new Date(payment.date),
    reference: payment.reference || `PAY-${order.order_number}`,
    reference_type: 'supplier_payment',
    reference_id: payment.id,
    description: `Pago Orden ${order.order_number}`,
    entries,
    total_debit: order.total,
    total_credit: order.total,
    created_at: new Date(),
    updated_at: new Date()
  };
};

// Generar asiento contable desde movimiento de inventario
export const generateInventoryMovementAccountingEntry = (
  movement: any,
  movementType: 'purchase' | 'sale' | 'adjustment'
): AccountingEntryExtended | null => {
  if (movementType === 'purchase') {
    return {
      id: 0,
      date: new Date(movement.date),
      reference: movement.document_number || `INV-${movement.id}`,
      reference_type: 'inventory',
      reference_id: movement.id,
      description: `Compra de Inventario - ${movement.product_name}`,
      entries: [
        {
          account: '1302', // Materiales
          debit: movement.total_cost,
          credit: 0,
          description: `Compra ${movement.product_name}`
        }
      ],
      total_debit: movement.total_cost,
      total_credit: 0,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  if (movementType === 'sale') {
    return {
      id: 0,
      date: new Date(movement.date),
      reference: movement.document_number || `INV-${movement.id}`,
      reference_type: 'inventory',
      reference_id: movement.id,
      description: `Venta de Inventario - ${movement.product_name}`,
      entries: [
        {
          account: '5102', // Costo de Ventas Productos
          debit: movement.total_cost,
          credit: 0,
          description: `Costo de venta ${movement.product_name}`
        },
        {
          account: '1302', // Materiales
          debit: 0,
          credit: movement.total_cost,
          description: `Salida de inventario ${movement.product_name}`
        }
      ],
      total_debit: movement.total_cost,
      total_credit: movement.total_cost,
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  if (movementType === 'adjustment') {
    // Ajuste de inventario (diferencia entre valor real y contable)
    return {
      id: 0,
      date: new Date(movement.date),
      reference: movement.document_number || `ADJ-${movement.id}`,
      reference_type: 'inventory',
      reference_id: movement.id,
      description: `Ajuste de Inventario - ${movement.product_name}`,
      entries: [
        {
          account: '1302', // Materiales
          debit: movement.total_cost > 0 ? movement.total_cost : 0,
          credit: movement.total_cost < 0 ? Math.abs(movement.total_cost) : 0,
          description: `Ajuste ${movement.product_name}`
        },
        {
          account: '7101', // Otros Ingresos o Gastos según corresponda
          debit: movement.total_cost < 0 ? Math.abs(movement.total_cost) : 0,
          credit: movement.total_cost > 0 ? movement.total_cost : 0,
          description: `Ajuste de inventario ${movement.product_name}`
        }
      ],
      total_debit: Math.abs(movement.total_cost),
      total_credit: Math.abs(movement.total_cost),
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  return null;
};

// Generar asiento contable desde factura de compra
export const generatePurchaseInvoiceAccountingEntry = (invoice: any): AccountingEntryExtended => {
  // Determinar cuentas según la categoría y cuenta asignada
  let inventoryAccount = '1302'; // Materiales por defecto
  let expenseAccount = '6101'; // Gastos de Administración por defecto
  
  if (invoice.category === 'materials') {
    inventoryAccount = '1302'; // Materiales
  } else if (invoice.category === 'equipment') {
    inventoryAccount = invoice.account_code || '1403'; // Maquinarias o la cuenta asignada
  } else if (invoice.category === 'services' || invoice.category === 'expenses') {
    expenseAccount = invoice.account_code || '6101'; // Usar cuenta asignada o por defecto
  }

  // Si es materiales o equipos, va a inventario
  // Si es servicios o gastos, va directamente a gastos
  const entries = (invoice.category === 'materials' || invoice.category === 'equipment') ? [
    {
      account: inventoryAccount,
      debit: invoice.subtotal,
      credit: 0,
      description: `Factura Compra ${invoice.invoice_number} - ${invoice.supplier_name}`
    },
    {
      account: '2105', // IVA Crédito Fiscal
      debit: invoice.tax,
      credit: 0,
      description: `IVA Crédito Fiscal Factura ${invoice.invoice_number}`
    },
    {
      account: '2101', // Cuentas por Pagar Proveedores
      debit: 0,
      credit: invoice.total,
      description: `Factura Compra ${invoice.invoice_number} - ${invoice.supplier_name}`
    }
  ] : [
    {
      account: expenseAccount,
      debit: invoice.subtotal,
      credit: 0,
      description: `Factura Compra ${invoice.invoice_number} - ${invoice.supplier_name}`
    },
    {
      account: '2105', // IVA Crédito Fiscal
      debit: invoice.tax,
      credit: 0,
      description: `IVA Crédito Fiscal Factura ${invoice.invoice_number}`
    },
    {
      account: '2101', // Cuentas por Pagar Proveedores
      debit: 0,
      credit: invoice.total,
      description: `Factura Compra ${invoice.invoice_number} - ${invoice.supplier_name}`
    }
  ];

  return {
    id: 0,
    date: new Date(invoice.date),
    reference: invoice.invoice_number,
    reference_type: 'purchase_invoice',
    reference_id: invoice.id,
    description: `Factura de Compra ${invoice.invoice_number} - ${invoice.supplier_name}`,
    entries,
    total_debit: invoice.total,
    total_credit: invoice.total,
    created_at: new Date(),
    updated_at: new Date()
  };
};

// Generar asiento contable desde gasto/expense
export const generateExpenseAccountingEntry = (expense: any): AccountingEntryExtended => {
  const categoryAccount: { [key: string]: string } = {
    'administrative': '6101', // Gastos de Administración
    'sales': '6102', // Gastos de Ventas
    'financial': '6103', // Gastos Financieros
    'materials': '5101', // Costo de Ventas Servicios
    'labor': '5101', // Costo de Ventas Servicios
    'equipment': '5101', // Costo de Ventas Servicios
    'other': '6101' // Gastos de Administración
  };

  const account = categoryAccount[expense.category] || '6101';

  const entries = [
    {
      account,
      debit: expense.total,
      credit: 0,
      description: `${expense.description} - ${expense.reference || ''}`
    },
    {
      account: expense.payment_method === 'transferencia' ? '1102' : '1101',
      debit: 0,
      credit: expense.total,
      description: `Pago gasto ${expense.description}`
    }
  ];

  return {
    id: 0,
    date: new Date(expense.date),
    reference: expense.reference || `EXP-${expense.id}`,
    reference_type: 'expense',
    reference_id: expense.id,
    description: expense.description,
    entries,
    total_debit: expense.total,
    total_credit: expense.total,
    created_at: new Date(),
    updated_at: new Date()
  };
};




