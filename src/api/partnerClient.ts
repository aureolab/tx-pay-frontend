import axios from 'axios';
import type {
  PartnerLoginResponse,
  PartnerProfileResponse,
  PartnerMerchant,
  PartnerTransaction,
  CreateTransactionRequest,
} from '../types/partner.types';
import type { PaginatedResponse, PaginationParams } from './client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Separate storage key for Partner token
const PARTNER_TOKEN_KEY = 'partner_access_token';

const partnerClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: inject Partner token
partnerClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(PARTNER_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: redirect to partner login on 401
partnerClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(PARTNER_TOKEN_KEY);
      window.location.href = '/partner/login';
    }
    return Promise.reject(error);
  }
);

export default partnerClient;

// Token helper
export const partnerTokenHelper = {
  get: () => localStorage.getItem(PARTNER_TOKEN_KEY),
  set: (token: string) => localStorage.setItem(PARTNER_TOKEN_KEY, token),
  remove: () => localStorage.removeItem(PARTNER_TOKEN_KEY),
};

// Partner Auth API
export const partnerAuthApi = {
  login: (email: string, password: string) =>
    partnerClient.post<PartnerLoginResponse>('/auth/partner/login', {
      email,
      password,
    }),
  getProfile: () =>
    partnerClient.get<PartnerProfileResponse>('/auth/partner/profile'),
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
  getMyTransactions: (params?: PaginationParams) =>
    partnerClient.get<PaginatedResponse<PartnerTransaction>>(
      '/transactions/my-transactions',
      { params }
    ),
  getByMerchant: (merchantId: string, params?: PaginationParams) =>
    partnerClient.get<PaginatedResponse<PartnerTransaction>>(
      `/transactions/by-merchant/${merchantId}`,
      { params }
    ),
  create: (data: CreateTransactionRequest, merchantId: string) =>
    partnerClient.post(
      '/transactions',
      {
        user_context: { is_guest: true },
        financials: {
          amount_gross: data.amount,
          currency: data.currency,
        },
        payment_method: data.payment_method,
        callback_url: data.callback_url,
      },
      {
        headers: { 'X-Merchant-Id': merchantId },
      },
    ),
};
