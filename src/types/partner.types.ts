// Constants matching backend enums
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

// Partner user from JWT/profile
export interface PartnerUser {
  userId: string;
  email: string;
  name: string;
  partnerId: string;
  partnerUserType: PartnerUserType;
  assignedMerchants: string[];
}

// Login response
export interface PartnerLoginResponse {
  access_token: string;
}

// Profile response from /auth/partner/profile
export interface PartnerProfileResponse {
  userId: string;
  partnerId: string;
  email: string;
  name?: string;
  partnerUserType: PartnerUserType;
  assignedMerchants: string[];
}

// Decimal type from MongoDB
type MongoDecimal = number | { $numberDecimal: string };

// Merchant for Partner portal
export interface PartnerMerchant {
  _id: string;
  owner: string;
  status: string;
  profile: {
    fantasy_name: string;
    legal_name: string;
    tax_id?: string;
    mcc?: string;
    contact_email?: string;
  };
  enabled_payment_methods: string[];
  // Optional fields returned by getOne detail endpoint
  integration?: {
    public_key: string;
  };
  pricing_rules?: {
    fees: Array<{
      method: string;
      fixed: MongoDecimal;
      percentage: MongoDecimal;
    }>;
  };
  bank_accounts?: Array<{
    bank_name: string;
    account_type: string;
    currency: string;
  }>;
  payment_link_timeout_minutes?: number;
  createdAt: string;
  updatedAt: string;
}

// Transaction for Partner portal
export interface PartnerTransaction {
  _id: string;
  merchant_id: string;
  terminal_id?: string;
  status: string;
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
  external_reference?: string;
  callback_url?: string;
  expires_at?: string;
  vita_country?: string;
  createdAt: string;
  updatedAt: string;
}

// Create transaction request
export interface CreateTransactionRequest {
  amount: number;
  amount_net_desired?: number;
  currency: string;
  payment_method: string;
  callback_url?: string;
  external_reference?: string;
  vita_country?: string;
}

// Partner-managed client user (from partner portal user management)
export interface PartnerClientUser {
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

export interface CreatePartnerClientUserRequest {
  name: string;
  email: string;
  password?: string;
  assigned_merchants: string[];
}

export interface UpdatePartnerClientUserRequest {
  name?: string;
  status?: PartnerUserStatus;
  assigned_merchants?: string[];
}
