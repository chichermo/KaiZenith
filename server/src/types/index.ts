// Tipos principales del sistema

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user' | 'accountant';
  created_at: Date;
  updated_at: Date;
}

export interface Client {
  id: number;
  rut: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  type: 'individual' | 'company';
  status: 'active' | 'potential' | 'inactive';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  client_id: number;
  client: Client;
  date: Date;
  due_date: Date;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: InvoiceItem[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier_id: number;
  supplier: Supplier;
  date: Date;
  expected_delivery: Date;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'confirmed' | 'delivered' | 'cancelled';
  items: PurchaseOrderItem[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Quotation {
  id: number;
  quotation_number: string;
  client_id: number;
  client: Client;
  date: Date;
  valid_until: Date;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  items: QuotationItem[];
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface QuotationItem {
  id: number;
  quotation_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Supplier {
  id: number;
  name: string;
  rut: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  region: string;
  category: 'materials' | 'equipment' | 'services' | 'all';
  api_endpoint?: string;
  api_key?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  unit: string;
  suppliers: ProductSupplier[];
  created_at: Date;
  updated_at: Date;
}

export interface ProductSupplier {
  supplier_id: number;
  supplier: Supplier;
  product_code: string;
  price: number;
  availability: boolean;
  last_updated: Date;
}

export interface AccountingEntry {
  id: number;
  date: Date;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  reference_type: 'invoice' | 'purchase_order' | 'payment' | 'expense';
  reference_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CompanySettings {
  id: number;
  name: string;
  rut: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  tax_rate: number; // IVA en Chile es 19%
  currency: string; // CLP
  created_at: Date;
  updated_at: Date;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
