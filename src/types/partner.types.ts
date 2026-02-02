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

// Merchant for Partner portal
export interface PartnerMerchant {
  _id: string;
  owner: string;
  status: string;
  profile: {
    fantasy_name: string;
    legal_name: string;
    tax_id?: string;
    contact_email?: string;
  };
  enabled_payment_methods: string[];
  createdAt: string;
  updatedAt: string;
}

// Transaction for Partner portal
export interface PartnerTransaction {
  _id: string;
  merchant_id: string;
  status: string;
  payment_method: string;
  financials: {
    amount_gross: number | { $numberDecimal: string };
    amount_net?: number | { $numberDecimal: string };
    currency: string;
  };
  external_reference?: string;
  callback_url?: string;
  createdAt: string;
  updatedAt: string;
}

// Create transaction request
export interface CreateTransactionRequest {
  amount: number;
  currency: string;
  payment_method: string;
  callback_url?: string;
  external_reference?: string;
}
