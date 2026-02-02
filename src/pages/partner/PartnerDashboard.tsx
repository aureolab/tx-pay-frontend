import { useState, useEffect, useCallback } from 'react';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import {
  partnerMerchantsApi,
  partnerTransactionsApi,
} from '../../api/partnerClient';
import type {
  PartnerMerchant,
  PartnerTransaction,
} from '../../types/partner.types';
import { type PaginationState, defaultPagination } from '@/types/dashboard.types';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';
import { getDecimalValue, formatCurrency, formatDate } from '@/lib/formatters';

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { DashboardFooter } from '@/components/shared/DashboardFooter';
import { StatsCard } from '@/components/shared/StatsCard';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { PartnerCreateTransactionDialog } from '@/components/partner/PartnerCreateTransactionDialog';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Store,
  CreditCard,
  TrendingUp,
  Plus,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

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
    setCreateTxDialogOpen(true);
  };

  // Stats calculations
  const activeMerchants = merchants.filter((m) => m.status === 'ACTIVE').length;

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
      <DashboardHeader
        portalName="Partner"
        icon={Building2}
        gradientClass="from-amber-500 to-orange-600"
        shadowClass="shadow-amber-500/20"
        userName={partnerUser?.name || ''}
        userEmail={partnerUser?.email || ''}
        onLogout={logout}
        logoutLabel="Salir"
        rightSlot={
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
        }
      />

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
          <StatsCard
            icon={Store}
            iconBgClass="from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10"
            iconColorClass="text-amber-600 dark:text-amber-400"
            label="Total Comercios"
            value={merchantsPagination.total}
          />
          <StatsCard
            icon={TrendingUp}
            iconBgClass="from-emerald-500/20 to-green-500/20 dark:from-emerald-500/10 dark:to-green-500/10"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            label="Comercios Activos"
            value={activeMerchants}
          />
          <StatsCard
            icon={CreditCard}
            iconBgClass="from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10"
            iconColorClass="text-blue-600 dark:text-blue-400"
            label="Total Transacciones"
            value={transactionsPagination.total}
          />
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
                    <TableHead>Razon Social</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Metodos de Pago</TableHead>
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
                      const statusCfg = getStatusConfig(merchant.status, 'es');
                      return (
                        <TableRow key={merchant._id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                          <TableCell className="font-medium">{merchant.profile.fantasy_name}</TableCell>
                          <TableCell className="text-zinc-600 dark:text-zinc-400">
                            {merchant.profile.legal_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusCfg.variant} className={statusCfg.className}>
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {merchant.enabled_payment_methods.slice(0, 3).map((method) => (
                                <Badge key={method} variant="outline" className="text-xs">
                                  {getPaymentMethodLabel(method, 'es')}
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
                              Nueva Transaccion
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
                  locale="es"
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
                    <TableHead>Metodo</TableHead>
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
                      const statusCfg = getStatusConfig(tx.status, 'es');
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
                            <Badge variant={statusCfg.variant} className={statusCfg.className}>
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {getPaymentMethodLabel(tx.payment_method, 'es')}
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
                  locale="es"
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Transaction Dialog */}
      <PartnerCreateTransactionDialog
        merchant={selectedMerchantForTx}
        open={createTxDialogOpen}
        onOpenChange={setCreateTxDialogOpen}
        onSuccess={() => fetchTransactions(1, selectedMerchantFilter)}
      />

      {/* Footer */}
      <DashboardFooter text={`\u00A9 ${new Date().getFullYear()} TX Pay Partner Portal. Todos los derechos reservados.`} />
    </div>
  );
}
