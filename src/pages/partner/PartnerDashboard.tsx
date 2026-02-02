import { useState, useEffect, useCallback } from 'react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import {
  partnerMerchantsApi,
  partnerTransactionsApi,
} from '../../api/partnerClient';
import type {
  PartnerMerchant,
  PartnerTransaction,
  CreateTransactionRequest,
} from '../../types/partner.types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Building2,
  LogOut,
  Store,
  CreditCard,
  TrendingUp,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

const defaultPagination: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

// Helper to extract decimal value
function getDecimalValue(value: number | { $numberDecimal: string }): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && '$numberDecimal' in value) {
    return parseFloat(value.$numberDecimal);
  }
  return 0;
}

// Format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency || 'CLP',
    minimumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(amount);
}

// Format date
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

// Status badge variants
function getStatusConfig(status: string): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  label: string;
} {
  const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; label: string }> = {
    APPROVED: { variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Aprobada' },
    CAPTURED: { variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Capturada' },
    PENDING: { variant: 'secondary', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'Pendiente' },
    CREATED: { variant: 'secondary', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', label: 'Creada' },
    EXPIRED: { variant: 'destructive', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20', label: 'Expirada' },
    REJECTED: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', label: 'Rechazada' },
    VOIDED: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', label: 'Anulada' },
    REFUNDED: { variant: 'outline', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', label: 'Reembolsada' },
    ACTIVE: { variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Activo' },
    BLOCKED: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', label: 'Bloqueado' },
    REVIEW: { variant: 'secondary', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'En revisión' },
    INACTIVE: { variant: 'outline', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20', label: 'Inactivo' },
  };
  return configs[status] || { variant: 'outline', className: '', label: status };
}

// Payment method labels
const paymentMethodLabels: Record<string, string> = {
  PAYMENT_LINK: 'Link de Pago',
  QR: 'Código QR',
  CREDIT: 'Crédito',
  DEBIT: 'Débito',
  PREPAID: 'Prepago',
  VITA_WALLET: 'Vita Wallet',
  WEBPAY: 'Webpay',
};

export default function PartnerDashboard() {
  const { partnerUser, logout, isPartnerType } = usePartnerAuth();

  // Data states
  const [merchants, setMerchants] = useState<PartnerMerchant[]>([]);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [merchantsPagination, setMerchantsPagination] = useState<PaginationState>(defaultPagination);
  const [transactionsPagination, setTransactionsPagination] = useState<PaginationState>(defaultPagination);

  // UI states
  const [activeTab, setActiveTab] = useState('merchants');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMerchantFilter, setSelectedMerchantFilter] = useState<string>('all');

  // Dialog states
  const [createTxDialogOpen, setCreateTxDialogOpen] = useState(false);
  const [selectedMerchantForTx, setSelectedMerchantForTx] = useState<PartnerMerchant | null>(null);
  const [txFormData, setTxFormData] = useState<CreateTransactionRequest>({
    amount: 0,
    currency: 'CLP',
    payment_method: 'PAYMENT_LINK',
  });
  const [creatingTx, setCreatingTx] = useState(false);
  const [txError, setTxError] = useState('');
  const [txSuccess, setTxSuccess] = useState<any>(null);

  // Fetch merchants
  const fetchMerchants = useCallback(async (page: number = 1) => {
    try {
      const res = await partnerMerchantsApi.getMyMerchants({ page, limit: 10 });
      setMerchants(res.data.data);
      setMerchantsPagination({
        ...res.data.meta,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar comercios');
    }
  }, []);

  // Fetch transactions
  const fetchTransactions = useCallback(async (page: number = 1, merchantId?: string) => {
    try {
      let res;
      if (merchantId && merchantId !== 'all') {
        res = await partnerTransactionsApi.getByMerchant(merchantId, { page, limit: 10 });
      } else {
        res = await partnerTransactionsApi.getMyTransactions({ page, limit: 10 });
      }
      setTransactions(res.data.data);
      setTransactionsPagination({
        ...res.data.meta,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar transacciones');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMerchants(), fetchTransactions()]);
      setLoading(false);
    };
    loadData();
  }, [fetchMerchants, fetchTransactions]);

  // Handle merchant filter change
  useEffect(() => {
    if (!loading) {
      fetchTransactions(1, selectedMerchantFilter);
    }
  }, [selectedMerchantFilter, fetchTransactions, loading]);

  // Open create transaction dialog
  const openCreateTxDialog = (merchant: PartnerMerchant) => {
    setSelectedMerchantForTx(merchant);
    setTxFormData({
      amount: 0,
      currency: 'CLP',
      payment_method: merchant.enabled_payment_methods[0] || 'PAYMENT_LINK',
    });
    setTxError('');
    setTxSuccess(null);
    setCreateTxDialogOpen(true);
  };

  // Create transaction
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMerchantForTx) return;

    setCreatingTx(true);
    setTxError('');
    try {
      const res = await partnerTransactionsApi.create(
        {
          amount: txFormData.amount,
          currency: txFormData.currency,
          payment_method: txFormData.payment_method,
          callback_url: txFormData.callback_url,
        },
        selectedMerchantForTx._id
      );
      setTxSuccess(res.data);
      fetchTransactions(1, selectedMerchantFilter);
    } catch (err: any) {
      setTxError(err.response?.data?.message || 'Error al crear transacción');
    } finally {
      setCreatingTx(false);
    }
  };

  // Stats calculations
  const activeMerchants = merchants.filter((m) => m.status === 'ACTIVE').length;

  // Pagination controls component
  const PaginationControls = ({
    pagination,
    onPageChange,
  }: {
    pagination: PaginationState;
    onPageChange: (page: number) => void;
  }) => (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
        {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[100px] text-center">
          Página {pagination.page} de {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
          className="h-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Get merchant name by ID
  const getMerchantName = (merchantId: string): string => {
    const merchant = merchants.find((m) => m._id === merchantId);
    return merchant?.profile.fantasy_name || merchantId.slice(-6);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-80 h-80 bg-gradient-to-tr from-yellow-400/10 to-amber-500/10 dark:from-yellow-500/5 dark:to-amber-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">TX Pay</span>
                <span className="hidden sm:inline text-lg text-zinc-400 dark:text-zinc-500 ml-1">Partner</span>
              </div>
            </div>

            {/* User info & actions */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {partnerUser?.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {partnerUser?.email}
                </span>
              </div>
              <Badge
                variant="outline"
                className={`hidden md:flex ${
                  isPartnerType
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                }`}
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {isPartnerType ? 'Acceso Completo' : 'Acceso Limitado'}
              </Badge>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg shadow-zinc-900/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Comercios</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{merchantsPagination.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg shadow-zinc-900/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 dark:from-emerald-500/10 dark:to-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Comercios Activos</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{activeMerchants}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg shadow-zinc-900/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Total Transacciones</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{transactionsPagination.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 p-1 rounded-xl">
            <TabsTrigger
              value="merchants"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg px-6"
            >
              <Store className="w-4 h-4 mr-2" />
              Comercios
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg px-6"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Transacciones
            </TabsTrigger>
          </TabsList>

          {/* Merchants Tab */}
          <TabsContent value="merchants" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Mis Comercios</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMerchants(merchantsPagination.page)}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Actualizar
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nombre</TableHead>
                    <TableHead>Razón Social</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Métodos de Pago</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                        No tienes comercios asignados
                      </TableCell>
                    </TableRow>
                  ) : (
                    merchants.map((merchant) => {
                      const statusConfig = getStatusConfig(merchant.status);
                      return (
                        <TableRow key={merchant._id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                          <TableCell className="font-medium">{merchant.profile.fantasy_name}</TableCell>
                          <TableCell className="text-zinc-600 dark:text-zinc-400">
                            {merchant.profile.legal_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant} className={statusConfig.className}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {merchant.enabled_payment_methods.slice(0, 3).map((method) => (
                                <Badge key={method} variant="outline" className="text-xs">
                                  {paymentMethodLabels[method] || method}
                                </Badge>
                              ))}
                              {merchant.enabled_payment_methods.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{merchant.enabled_payment_methods.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => openCreateTxDialog(merchant)}
                              disabled={merchant.status !== 'ACTIVE'}
                              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Nueva Transacción
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {merchantsPagination.total > 0 && (
                <PaginationControls
                  pagination={merchantsPagination}
                  onPageChange={(page) => fetchMerchants(page)}
                />
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="font-semibold text-zinc-900 dark:text-white">Mis Transacciones</h3>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Select value={selectedMerchantFilter} onValueChange={setSelectedMerchantFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Filtrar por comercio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los comercios</SelectItem>
                      {merchants.map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.profile.fantasy_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(transactionsPagination.page, selectedMerchantFilter)}
                    className="gap-2 shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>ID</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Comercio</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                        No hay transacciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => {
                      const statusConfig = getStatusConfig(tx.status);
                      const amount = getDecimalValue(tx.financials.amount_gross);
                      return (
                        <TableRow key={tx._id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                          <TableCell className="font-mono text-xs">
                            {tx._id.slice(-8)}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(amount, tx.financials.currency)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusConfig.variant} className={statusConfig.className}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {paymentMethodLabels[tx.payment_method] || tx.payment_method}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-600 dark:text-zinc-400">
                            {getMerchantName(tx.merchant_id)}
                          </TableCell>
                          <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">
                            {formatDate(tx.createdAt)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              {transactionsPagination.total > 0 && (
                <PaginationControls
                  pagination={transactionsPagination}
                  onPageChange={(page) => fetchTransactions(page, selectedMerchantFilter)}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Transaction Dialog */}
      <Dialog open={createTxDialogOpen} onOpenChange={setCreateTxDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              Nueva Transacción
            </DialogTitle>
            <DialogDescription>
              Crear transacción para{' '}
              <span className="font-medium text-zinc-900 dark:text-white">
                {selectedMerchantForTx?.profile.fantasy_name}
              </span>
            </DialogDescription>
          </DialogHeader>

          {txSuccess ? (
            (() => {
              const checkoutUrl = txSuccess.gateway_result?.checkout_url
                || txSuccess.gateway_result?.authorization_payload_result?.started_transaction?.redirect_endpoint;
              return (
                <div className="py-4 space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                      Transacción Creada
                    </h3>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">ID de Transacción</p>
                    <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded">{txSuccess._id}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Estado</p>
                    <Badge variant="secondary" className={getStatusConfig(txSuccess.status).className}>
                      {getStatusConfig(txSuccess.status).label}
                    </Badge>
                  </div>

                  {checkoutUrl && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Link de Pago</p>
                      <div className="flex gap-2">
                        <Input
                          value={checkoutUrl}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(checkoutUrl)}
                        >
                          Copiar
                        </Button>
                      </div>
                      <Button
                        type="button"
                        className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        onClick={() => window.open(checkoutUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Abrir Página de Pago
                      </Button>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button onClick={() => setCreateTxDialogOpen(false)} variant="outline" className="w-full">
                      Cerrar
                    </Button>
                  </div>
                </div>
              );
            })()
          ) : (
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {txError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{txError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  value={txFormData.amount || ''}
                  onChange={(e) =>
                    setTxFormData({ ...txFormData, amount: parseInt(e.target.value) || 0 })
                  }
                  placeholder="10000"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={txFormData.currency}
                    onValueChange={(v) => setTxFormData({ ...txFormData, currency: v })}
                  >
                    <SelectTrigger id="currency" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLP">CLP</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Método de Pago</Label>
                  <Select
                    value={txFormData.payment_method}
                    onValueChange={(v) => setTxFormData({ ...txFormData, payment_method: v })}
                  >
                    <SelectTrigger id="payment_method" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMerchantForTx?.enabled_payment_methods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {paymentMethodLabels[method] || method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="callback_url">URL de Callback (opcional)</Label>
                <Input
                  id="callback_url"
                  type="url"
                  value={txFormData.callback_url || ''}
                  onChange={(e) =>
                    setTxFormData({ ...txFormData, callback_url: e.target.value })
                  }
                  placeholder="https://mi-sitio.com/callback"
                  className="h-11"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateTxDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={creatingTx || txFormData.amount <= 0}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {creatingTx ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creando...
                    </>
                  ) : (
                    'Crear Transacción'
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} TX Pay Partner Portal. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
