import axios from 'axios';
import type {
  PartnerLoginResponse,
  PartnerProfileResponse,
  PartnerMerchant,
  PartnerTransaction,
  CreateTransactionRequest,
  PartnerClientUser,
  CreatePartnerClientUserRequest,
  UpdatePartnerClientUserRequest,
} from '../types/partner.types';
import type {
  PaymentLink,
  CreatePaymentLinkRequest,
  UpdatePaymentLinkRequest,
} from '../types/payment-link.types';
import type { PaginatedResponse, PaginationParams } from './client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const partnerClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Response interceptor: redirect to partner login on 401
partnerClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginPage = window.location.pathname.includes('/login');
      const isProfileCheck = error.config?.url?.includes('/auth/partner/profile');
      if (!isLoginPage && !isProfileCheck) {
        window.location.href = '/partners/login';
      }
    }
    return Promise.reject(error);
  }
);

export default partnerClient;

// Partner Auth API
export const partnerAuthApi = {
  login: (email: string, password: string) =>
    partnerClient.post<PartnerLoginResponse>('/auth/partner/login', {
      email,
      password,
    }),
  getProfile: () =>
    partnerClient.get<PartnerProfileResponse>('/auth/partner/profile'),
  logout: () => partnerClient.post('/auth/partner/logout'),
  changeMyPassword: (data: { current_password: string; new_password: string }) =>
    partnerClient.post('/auth/partner/change-my-password', data),
};

// Partner Merchants API
export const partnerMerchantsApi = {
  getMyMerchants: (params?: PaginationParams) =>
    partnerClient.get<PaginatedResponse<PartnerMerchant>>(
      '/partner-portal/merchants/my-merchants',
      { params }
    ),
  getOne: (id: string) =>
    partnerClient.get<PartnerMerchant>(`/partner-portal/merchants/${id}`),
};

// Partner Transactions API
export const partnerTransactionsApi = {
  getMyTransactions: (params?: PaginationParams & { payment_link_id?: string; status?: string; payment_method?: string; dateFrom?: string; dateTo?: string }) =>
    partnerClient.get<PaginatedResponse<PartnerTransaction>>(
      '/transactions/my-transactions',
      { params }
    ),
  exportMyTransactions: (params?: Record<string, string>) =>
    partnerClient.get('/transactions/my-transactions/export', {
      params,
      responseType: 'blob',
    }),
  getByMerchant: (merchantId: string, params?: PaginationParams) =>
    partnerClient.get<PaginatedResponse<PartnerTransaction>>(
      `/transactions/by-merchant/${merchantId}`,
      { params }
    ),
  create: (data: CreateTransactionRequest, merchantId: string) => {
    const financials: Record<string, unknown> = { currency: data.currency };
    if (data.amount_net_desired) {
      financials.amount_net_desired = data.amount_net_desired;
    } else {
      financials.amount_gross = data.amount;
    }
    return partnerClient.post(
      '/transactions',
      {
        user_context: { is_guest: true },
        financials,
        payment_method: data.payment_method,
        callback_url: data.callback_url,
        vita_country: data.vita_country,
      },
      {
        headers: { 'X-Merchant-Id': merchantId },
      },
    );
  },
  getVitaCountries: (merchantId: string) =>
    partnerClient.get<{ countries: Array<{ code: string; name: string; flag: string }>; default_country: string }>(
      '/transactions/vita-countries',
      { params: { merchantId } }
    ),
};

// Partner Portal User Management API
// Backend dependency: requires /partner-portal/users endpoints with Partner JWT auth
// These endpoints are restricted to PARTNER-type users only
export const partnerPortalUsersApi = {
  list: (params?: PaginationParams) =>
    partnerClient.get<PaginatedResponse<PartnerClientUser>>(
      '/partner-portal/users',
      { params }
    ),
  getOne: (id: string) =>
    partnerClient.get<PartnerClientUser>(`/partner-portal/users/${id}`),
  create: (data: CreatePartnerClientUserRequest) =>
    partnerClient.post('/partner-portal/users', data),
  update: (id: string, data: UpdatePartnerClientUserRequest) =>
    partnerClient.patch(`/partner-portal/users/${id}`, data),
  changePassword: (id: string, data: { new_password: string }) =>
    partnerClient.post(`/partner-portal/users/${id}/password`, data),
  resetPassword: (id: string) =>
    partnerClient.post(`/partner-portal/users/${id}/reset-password`),
  delete: (id: string) =>
    partnerClient.delete(`/partner-portal/users/${id}`),
};

// Partner Portal Payment Links API
// Backend dependency: requires /partner-portal/payment-links endpoints with Partner JWT auth
export const partnerPaymentLinksApi = {
  list: (params?: PaginationParams) =>
    partnerClient.get<PaginatedResponse<PaymentLink>>(
      '/partner-portal/payment-links',
      { params }
    ),
  getByMerchant: (merchantId: string) =>
    partnerClient.get<PaymentLink[]>(
      `/partner-portal/payment-links/by-merchant/${merchantId}`
    ),
  get: (id: string) =>
    partnerClient.get<PaymentLink>(`/partner-portal/payment-links/${id}`),
  create: (data: Omit<CreatePaymentLinkRequest, 'merchant_id'>, merchantId: string) =>
    partnerClient.post<PaymentLink>('/partner-portal/payment-links', {
      ...data,
      merchant_id: merchantId,
    }),
  update: (id: string, data: UpdatePaymentLinkRequest) =>
    partnerClient.patch<PaymentLink>(`/partner-portal/payment-links/${id}`, data),
  delete: (id: string) =>
    partnerClient.delete(`/partner-portal/payment-links/${id}`),
  downloadQrPng: (id: string) =>
    partnerClient.get(`/partner-portal/payment-links/${id}/qr.png`, {
      responseType: 'blob',
    }),
  downloadQrSvg: (id: string) =>
    partnerClient.get(`/partner-portal/payment-links/${id}/qr.svg`, {
      responseType: 'blob',
    }),
  downloadQrPdf: (id: string) =>
    partnerClient.get(`/partner-portal/payment-links/${id}/qr.pdf`, {
      responseType: 'blob',
    }),
};
