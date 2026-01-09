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
      window.location.href = '/login';
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
};

// Admin Users
export const adminUsersApi = {
  list: () => client.get('/admin-users'),
  get: (id: string) => client.get(`/admin-users/${id}`),
  create: (data: any) => client.post('/admin-users', data),
  update: (id: string, data: any) => client.patch(`/admin-users/${id}`, data),
  delete: (id: string) => client.delete(`/admin-users/${id}`),
};

// Merchants
export const merchantsApi = {
  list: () => client.get('/merchants'),
  get: (id: string) => client.get(`/merchants/${id}`),
  create: (data: any) => client.post('/merchants', data),
  update: (id: string, data: any) => client.patch(`/merchants/${id}`, data),
  delete: (id: string) => client.delete(`/merchants/${id}`),
  addBankAccount: (id: string, data: any) =>
    client.post(`/merchants/${id}/bank-accounts`, data),
};

// Transactions
export const transactionsApi = {
  list: () => client.get('/transactions'),
  get: (id: string) => client.get(`/transactions/${id}`),
  create: (data: any) => client.post('/transactions', data),
  capture: (id: string) => client.post(`/transactions/${id}/capture`),
  refund: (id: string) => client.post(`/transactions/${id}/refund`),
  void: (id: string) => client.post(`/transactions/${id}/void`),
};

// Health
export const healthApi = {
  check: () => client.get('/health'),
};
