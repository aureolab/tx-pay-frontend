import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/administration/login';
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
    client.get('/admin-users', { params }),
  get: (id: string) => client.get(`/admin-users/${id}`),
  create: (data: any) => client.post('/admin-users', data),
  update: (id: string, data: any) => client.patch(`/admin-users/${id}`, data),
  delete: (id: string) => client.delete(`/admin-users/${id}`),
  resetPassword: (id: string) => client.post(`/admin-users/${id}/reset-password`),
};

// Merchants
export const merchantsApi = {
  list: (params?: ListParams) =>
    client.get('/merchants', { params }),
  get: (id: string) => client.get(`/merchants/${id}`),
  getSecret: (id: string) => client.get<string>(`/merchants/${id}/secret`),
  create: (data: any) => client.post('/merchants', data),
  update: (id: string, data: any) => client.patch(`/merchants/${id}`, data),
  delete: (id: string) => client.delete(`/merchants/${id}`),
  addBankAccount: (id: string, data: any) =>
    client.post(`/merchants/${id}/bank-accounts`, data),
};

// Transactions
export const transactionsApi = {
  list: (params?: ListParams) =>
    client.get('/transactions', { params }),
  get: (id: string) => client.get(`/transactions/${id}`),
  create: (data: any, merchantId?: string) =>
    client.post('/transactions', data, {
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
    client.get('/partners', { params }),
  get: (id: string) => client.get(`/partners/${id}`),
  create: (data: any) => client.post('/partners', data),
  update: (id: string, data: any) => client.patch(`/partners/${id}`, data),
  delete: (id: string) => client.delete(`/partners/${id}`),
};

// Partner Users
export const partnerUsersApi = {
  list: (params?: ListParams) =>
    client.get('/partner-users', { params }),
  listByPartner: (partnerId: string, params?: ListParams) =>
    client.get(`/partner-users/by-partner/${partnerId}`, { params }),
  get: (id: string) => client.get(`/partner-users/${id}`),
  create: (data: any) => client.post('/partner-users', data),
  update: (id: string, data: any) => client.patch(`/partner-users/${id}`, data),
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
  get: () => client.get('/system-config'),
  update: (data: any) => client.patch('/system-config', data),
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
