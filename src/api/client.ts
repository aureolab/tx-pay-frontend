import axios from 'axios';
import type {
  AdminUser,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
  Merchant,
  CreateMerchantRequest,
  UpdateMerchantRequest,
  BankAccount,
  Partner,
  CreatePartnerRequest,
  UpdatePartnerRequest,
  PartnerUser,
  CreatePartnerUserRequest,
  UpdatePartnerUserRequest,
  Transaction,
  CreateTransactionRequest,
  SystemConfig,
} from '../types/admin.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('/login');
      const isProfileCheck = error.config?.url?.includes('/auth/profile');
      if (!isLoginPage && !isProfileCheck) {
        window.location.href = '/administration/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    client.post('/auth/login', { email, password }),
  getProfile: () => client.get('/auth/profile'),
  logout: () => client.post('/auth/logout'),
  changeMyPassword: (data: { current_password: string; new_password: string }) =>
    client.post('/auth/change-my-password', data),
};

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ListParams extends PaginationParams {
  [key: string]: string | number | boolean | undefined;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Admin Users
export const adminUsersApi = {
  list: (params?: ListParams) =>
    client.get<PaginatedResponse<AdminUser>>('/admin-users', { params }),
  get: (id: string) => client.get<AdminUser>(`/admin-users/${id}`),
  create: (data: CreateAdminUserRequest) => client.post<AdminUser>('/admin-users', data),
  update: (id: string, data: UpdateAdminUserRequest) => client.patch<AdminUser>(`/admin-users/${id}`, data),
  delete: (id: string) => client.delete(`/admin-users/${id}`),
  resetPassword: (id: string) => client.post(`/admin-users/${id}/reset-password`),
};

// Merchants
export const merchantsApi = {
  list: (params?: ListParams) =>
    client.get<PaginatedResponse<Merchant>>('/merchants', { params }),
  get: (id: string) => client.get<Merchant>(`/merchants/${id}`),
  getSecret: (id: string) => client.get<string>(`/merchants/${id}/secret`),
  create: (data: CreateMerchantRequest) => client.post<Merchant>('/merchants', data),
  update: (id: string, data: UpdateMerchantRequest) => client.patch<Merchant>(`/merchants/${id}`, data),
  delete: (id: string) => client.delete(`/merchants/${id}`),
  addBankAccount: (id: string, data: BankAccount) =>
    client.post(`/merchants/${id}/bank-accounts`, data),
};

// Transactions
export const transactionsApi = {
  list: (params?: ListParams) =>
    client.get<PaginatedResponse<Transaction>>('/transactions', { params }),
  get: (id: string) => client.get<Transaction>(`/transactions/${id}`),
  create: (data: CreateTransactionRequest, merchantId?: string) =>
    client.post<Transaction>('/transactions', data, {
      headers: merchantId ? { 'X-Merchant-Id': merchantId } : {},
    }),
  capture: (id: string) => client.post(`/transactions/${id}/capture`),
  refund: (id: string) => client.post(`/transactions/${id}/refund`),
  void: (id: string) => client.post(`/transactions/${id}/void`),
  export: (params?: Record<string, string>) =>
    client.get('/transactions/export', { params, responseType: 'blob' }),
  getVitaCountries: (merchantId: string) =>
    client.get<{ countries: Array<{ code: string; name: string; flag: string }>; default_country: string }>(
      '/transactions/vita-countries',
      { params: { merchantId } }
    ),
};

// Partners
export const partnersApi = {
  list: (params?: ListParams) =>
    client.get<PaginatedResponse<Partner>>('/partners', { params }),
  get: (id: string) => client.get<Partner>(`/partners/${id}`),
  create: (data: CreatePartnerRequest) => client.post<Partner>('/partners', data),
  update: (id: string, data: UpdatePartnerRequest) => client.patch<Partner>(`/partners/${id}`, data),
  delete: (id: string) => client.delete(`/partners/${id}`),
};

// Partner Users
export const partnerUsersApi = {
  list: (params?: ListParams) =>
    client.get<PaginatedResponse<PartnerUser>>('/partner-users', { params }),
  listByPartner: (partnerId: string, params?: ListParams) =>
    client.get<PaginatedResponse<PartnerUser>>(`/partner-users/by-partner/${partnerId}`, { params }),
  get: (id: string) => client.get<PartnerUser>(`/partner-users/${id}`),
  create: (data: CreatePartnerUserRequest) => client.post<PartnerUser>('/partner-users', data),
  update: (id: string, data: UpdatePartnerUserRequest) => client.patch<PartnerUser>(`/partner-users/${id}`, data),
  changePassword: (id: string, data: { new_password: string }) =>
    client.patch(`/partner-users/${id}/password`, data),
  resetPassword: (id: string) => client.post(`/partner-users/${id}/reset-password`),
  delete: (id: string) => client.delete(`/partner-users/${id}`),
};

// Health
export const healthApi = {
  check: () => client.get('/health'),
};

// System Configuration
export const systemConfigApi = {
  get: () => client.get<SystemConfig>('/system-config'),
  update: (data: Partial<SystemConfig>) => client.patch<SystemConfig>('/system-config', data),
  getDefaultExportColumns: () => client.get('/system-config/default-export-columns'),
};

// Contact
export const contactApi = {
  send: (data: { name: string; email: string; company?: string; message: string }) =>
    client.post('/contact', data),
};

// Payment Links (Admin)
import type {
  PaymentLink,
  CreatePaymentLinkRequest,
  UpdatePaymentLinkRequest,
  QueryPaymentLinkParams,
  CodeValidationResponse,
} from '../types/payment-link.types';

export const paymentLinksApi = {
  list: (params?: QueryPaymentLinkParams) =>
    client.get<PaginatedResponse<PaymentLink>>('/payment-links', { params }),
  get: (id: string) => client.get<PaymentLink>(`/payment-links/${id}`),
  getByMerchant: (merchantId: string) =>
    client.get<PaymentLink[]>(`/payment-links/by-merchant/${merchantId}`),
  create: (data: CreatePaymentLinkRequest) =>
    client.post<PaymentLink>('/payment-links', data),
  update: (id: string, data: UpdatePaymentLinkRequest) =>
    client.patch<PaymentLink>(`/payment-links/${id}`, data),
  delete: (id: string) => client.delete(`/payment-links/${id}`),
  validateCode: (code: string) =>
    client.get<CodeValidationResponse>(`/payment-links/validate-code/${code}`),
  downloadQrPng: (id: string) =>
    client.get(`/payment-links/${id}/qr.png`, { responseType: 'blob' }),
  downloadQrSvg: (id: string) =>
    client.get(`/payment-links/${id}/qr.svg`, { responseType: 'blob' }),
  downloadQrPdf: (id: string) =>
    client.get(`/payment-links/${id}/qr.pdf`, { responseType: 'blob' }),
};
