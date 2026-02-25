// MongoDB Decimal type
type MongoDecimal = number | { $numberDecimal: string };

// ── Admin Users ──────────────────────────────────────────

export const AdminRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  VIEWER: 'VIEWER',
} as const;

export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export interface AdminUser {
  _id: string;
  email: string;
  full_name: string;
  roles: AdminRole[];
  active: boolean;
  last_login?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminUserRequest {
  email: string;
  password?: string;
  full_name: string;
  roles?: AdminRole[];
  active?: boolean;
}

export interface UpdateAdminUserRequest {
  email?: string;
  full_name?: string;
  roles?: AdminRole[];
  active?: boolean;
}

// ── Merchants ────────────────────────────────────────────

export const MerchantStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  REVIEW: 'REVIEW',
  BLOCKED: 'BLOCKED',
} as const;

export type MerchantStatus = (typeof MerchantStatus)[keyof typeof MerchantStatus];

export const PaymentMethod = {
  WEBPAY: 'WEBPAY',
  VITA_WALLET: 'VITA_WALLET',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export interface MerchantProfile {
  fantasy_name: string;
  legal_name: string;
  tax_id?: string;
  mcc?: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
}

export interface BankAccount {
  bank_name: string;
  account_type: string;
  account_number?: string;
  currency: string;
}

export interface PricingRule {
  method: string;
  fixed: MongoDecimal;
  percentage: MongoDecimal;
}

export interface AcquirerConfig {
  provider: string;
  config: Record<string, unknown>;
}

export interface Merchant {
  _id: string;
  owner: string;
  status: MerchantStatus;
  profile: MerchantProfile;
  integration?: {
    public_key: string;
    secret?: string;
  };
  enabled_payment_methods: string[];
  pricing_rules?: {
    fees: PricingRule[];
  };
  bank_accounts?: BankAccount[];
  acquirer_configs?: AcquirerConfig[];
  payment_link_timeout_minutes?: number;
  payment_link_config?: {
    min_amount?: MongoDecimal;
    max_amount?: MongoDecimal;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateMerchantRequest {
  owner: string;
  profile: MerchantProfile;
  bank_accounts?: BankAccount[];
  pricing_rules?: PricingRule[];
  enabled_payment_methods?: string[];
  acquirer_configs?: AcquirerConfig[];
  payment_link_timeout_minutes?: number;
}

export interface UpdateMerchantRequest {
  profile?: Partial<MerchantProfile>;
  status?: MerchantStatus;
  bank_accounts?: BankAccount[];
  pricing_rules?: PricingRule[];
  enabled_payment_methods?: string[];
  acquirer_configs?: AcquirerConfig[];
  payment_link_timeout_minutes?: number;
}

// ── Partners ─────────────────────────────────────────────

export const PartnerStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type PartnerStatus = (typeof PartnerStatus)[keyof typeof PartnerStatus];

export interface Partner {
  _id: string;
  fantasy_name: string;
  legal_name: string;
  tax_id?: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status: PartnerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerRequest {
  fantasy_name: string;
  legal_name: string;
  tax_id?: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  status?: PartnerStatus;
}

export interface UpdatePartnerRequest {
  fantasy_name?: string;
  legal_name?: string;
  tax_id?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  status?: PartnerStatus;
}

// ── Partner Users (Admin-managed) ────────────────────────

export const PartnerUserType = {
  PARTNER: 'PARTNER',
  CLIENT: 'CLIENT',
} as const;

export type PartnerUserType = (typeof PartnerUserType)[keyof typeof PartnerUserType];

export const PartnerUserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type PartnerUserStatus = (typeof PartnerUserStatus)[keyof typeof PartnerUserStatus];

export interface PartnerUser {
  _id: string;
  partner_id: string;
  name: string;
  email: string;
  type: PartnerUserType;
  status: PartnerUserStatus;
  assigned_merchants: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnerUserRequest {
  partner_id: string;
  name: string;
  email: string;
  password?: string;
  type: PartnerUserType;
  assigned_merchants?: string[];
  status?: PartnerUserStatus;
}

export interface UpdatePartnerUserRequest {
  name?: string;
  email?: string;
  type?: PartnerUserType;
  status?: PartnerUserStatus;
  assigned_merchants?: string[];
}

// ── Transactions (Admin view) ────────────────────────────

export const TransactionStatus = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  VOIDED: 'VOIDED',
  REFUNDED: 'REFUNDED',
  EXPIRED: 'EXPIRED',
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const TransactionType = {
  WEBPAY: 'WEBPAY',
  VITA_WALLET: 'VITA_WALLET',
  PAYMENT_LINK: 'PAYMENT_LINK',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export interface Transaction {
  _id: string;
  merchant_id: string;
  terminal_id?: string;
  status: TransactionStatus;
  payment_method: string;
  financials: {
    amount_gross: MongoDecimal;
    amount_net?: MongoDecimal;
    currency: string;
    fee_snapshot?: {
      fixed: MongoDecimal;
      percentage: MongoDecimal;
      iva_percentage?: MongoDecimal;
      iva_amount?: MongoDecimal;
    };
  };
  user_context?: {
    is_guest?: boolean;
    psp_user_id?: string;
  };
  external_reference?: string;
  gateway_result?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  callback_url?: string;
  expires_at?: string;
  vita_country?: string;
  payment_link_id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  payment_method: string;
  financials: {
    amount_gross: number;
    currency: string;
  };
  user_context: {
    is_guest?: boolean;
  };
  callback_url?: string;
  external_reference?: string;
  vita_country?: string;
}

// ── System Config ────────────────────────────────────────

export interface SystemConfig {
  _id: string;
  iva_percentage: number;
  acquirer_defaults: Array<{
    provider: string;
    config: Record<string, unknown>;
  }>;
  pricing_rules_defaults: PricingRule[];
  export_columns: Array<{
    key: string;
    label: string;
    path: string;
    type: string;
  }>;
  payment_link_defaults?: {
    min_amount?: number;
    max_amount?: number;
  };
}
