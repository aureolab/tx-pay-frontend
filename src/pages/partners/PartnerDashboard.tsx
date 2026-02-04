import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import {
  partnerMerchantsApi,
  partnerTransactionsApi,
  partnerPortalUsersApi,
} from '../../api/partnerClient';
import type {
  PartnerMerchant,
  PartnerTransaction,
  PartnerClientUser,
} from '../../types/partner.types';
import { type PaginationState } from '@/types/dashboard.types';
import {
  getStatusConfig,
  getPaymentMethodLabel,
  MerchantStatuses,
  TransactionStatuses,
  PaymentMethods,
} from '@/lib/constants';
import { getDecimalValue, formatCurrency, formatDate } from '@/lib/formatters';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { FilterBar, type FilterConfig } from '@/components/shared/FilterBar';

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { DashboardFooter } from '@/components/shared/DashboardFooter';
import { StatsCard } from '@/components/shared/StatsCard';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { PartnerCreateTransactionDialog } from '@/components/partners/PartnerCreateTransactionDialog';
import { PartnerMerchantDetailDialog } from '@/components/partners/PartnerMerchantDetailDialog';
import { PartnerTransactionDetailDialog } from '@/components/partners/PartnerTransactionDetailDialog';
import { PartnerClientUserDialog } from '@/components/partners/PartnerClientUserDialog';
import { PartnerResetPasswordDialog } from '@/components/partners/PartnerResetPasswordDialog';
import { PartnerChangeMyPasswordDialog } from '@/components/partners/PartnerChangeMyPasswordDialog';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  Store,
  CreditCard,
  Download,
  TrendingUp,
  Plus,
  AlertCircle,
  RefreshCw,
  Eye,
  Users,
  Pencil,
  Trash2,
} from 'lucide-react';
import { downloadBlob } from '@/lib/downloadFile';

export default function PartnerDashboard() {
  const { t, i18n } = useTranslation(['partner', 'common']);
  const { partnerUser, logout, isPartnerType } = usePartnerAuth();
  const { tab, page, filters, setTab, setPage, setFilter, clearFilters, hasFilters } = useUrlFilters({ defaultTab: 'merchants' });

  // Set default language to Spanish for partner portal
  useEffect(() => {
    if (!localStorage.getItem('i18nextLng')) {
      i18n.changeLanguage('es');
    }
  }, [i18n]);

  // Data states
  const [merchants, setMerchants] = useState<PartnerMerchant[]>([]);
  const [transactions, setTransactions] = useState<PartnerTransaction[]>([]);
  const [clientUsers, setClientUsers] = useState<PartnerClientUser[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [usersMeta, setUsersMeta] = useState({ total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });

  const [counts, setCounts] = useState({ merchants: 0, activeMerchants: 0, transactions: 0, users: 0 });

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [createTxDialogOpen, setCreateTxDialogOpen] = useState(false);
  const [selectedMerchantForTx, setSelectedMerchantForTx] = useState<PartnerMerchant | null>(null);

  // Detail dialog states
  const [selectedMerchant, setSelectedMerchant] = useState<PartnerMerchant | null>(null);
  const [merchantDetailOpen, setMerchantDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PartnerTransaction | null>(null);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);

  const [exporting, setExporting] = useState(false);

  // User management dialog states
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PartnerClientUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<PartnerClientUser | null>(null);
  const [changeMyPasswordOpen, setChangeMyPasswordOpen] = useState(false);

  // Load all counts on mount
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [mRes, tRes] = await Promise.all([
          partnerMerchantsApi.getMyMerchants({ page: 1, limit: 100 }),
          partnerTransactionsApi.getMyTransactions({ page: 1, limit: 1 }),
        ]);
        const merchantsData = mRes.data.data as PartnerMerchant[];
        const activeMerch = merchantsData.filter((m) => m.status === 'ACTIVE').length;
        setCounts(prev => ({
          ...prev,
          merchants: merchantsData.length,
          activeMerchants: activeMerch,
          transactions: mRes.data.meta ? mRes.data.meta.total : merchantsData.length,
        }));
        setCounts(prev => ({
          ...prev,
          transactions: (tRes.data as any).meta.total,
        }));
        // Also populate merchants array for filter dropdown
        setMerchants(merchantsData);
      } catch { /* ignore */ }
      if (isPartnerType) {
        try {
          const uRes = await partnerPortalUsersApi.list({ page: 1, limit: 1 });
          setCounts(prev => ({ ...prev, users: (uRes.data as any).meta.total }));
        } catch { /* ignore */ }
      }
    };
    loadCounts();
  }, [isPartnerType]);

  // Merchant options for transaction filter
  const merchantOptions = useMemo(
    () => merchants.map((m) => ({ value: m._id, label: m.profile.fantasy_name })),
    [merchants],
  );

  // Filter configurations per tab
  const filterConfigs: Record<string, FilterConfig[]> = useMemo(() => ({
    merchants: [
      { key: 'status', label: t('partner:filters.status'), type: 'select', placeholder: t('common:filters.allStatuses'), options: MerchantStatuses.map((s) => ({ value: s, label: getStatusConfig(s).label })) },
      { key: 'search', label: t('partner:filters.search'), type: 'text', placeholder: t('partner:filters.nameOrLegalName') },
    ],
    transactions: [
      { key: 'status', label: t('partner:filters.status'), type: 'select', placeholder: t('common:filters.allStatuses'), options: TransactionStatuses.map((s) => ({ value: s, label: getStatusConfig(s).label })) },
      { key: 'payment_method', label: t('partner:filters.method'), type: 'select', placeholder: t('common:filters.allMethods'), options: PaymentMethods.map((m) => ({ value: m, label: getPaymentMethodLabel(m) })) },
      { key: 'merchant', label: t('partner:filters.merchant'), type: 'select', placeholder: t('common:filters.allMerchants'), options: merchantOptions },
      { key: 'dateFrom', label: t('partner:filters.from'), type: 'date' },
      { key: 'dateTo', label: t('partner:filters.to'), type: 'date' },
    ],
  }), [merchantOptions, t]);

  // Fetch merchants
  const fetchMerchants = useCallback(async (pageNum: number = 1) => {
    try {
      const res = await partnerMerchantsApi.getMyMerchants({ page: pageNum, limit: 10 });
      setMerchants(res.data.data);
      setMeta(res.data.meta);
      const allData = res.data.data as PartnerMerchant[];
      setCounts(prev => ({
        ...prev,
        merchants: res.data.meta.total,
        activeMerchants: allData.filter((m) => m.status === 'ACTIVE').length,
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || t('partner:errors.loadMerchants'));
    }
  }, [t]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (pageNum: number = 1, merchantId?: string) => {
    try {
      let res;
      if (merchantId && merchantId !== 'all') {
        res = await partnerTransactionsApi.getByMerchant(merchantId, { page: pageNum, limit: 10 });
      } else {
        res = await partnerTransactionsApi.getMyTransactions({ page: pageNum, limit: 10 });
      }
      setTransactions(res.data.data);
      setMeta(res.data.meta);
      setCounts(prev => ({ ...prev, transactions: res.data.meta.total }));
    } catch (err: any) {
      setError(err.response?.data?.message || t('partner:errors.loadTransactions'));
    }
  }, [t]);

  // Fetch client users
  const fetchClientUsers = useCallback(async (pageNum: number = 1) => {
    if (!isPartnerType) return;
    try {
      const res = await partnerPortalUsersApi.list({ page: pageNum, limit: 10 });
      setClientUsers(res.data.data);
      setUsersMeta(res.data.meta);
      setCounts(prev => ({ ...prev, users: res.data.meta.total }));
    } catch (err: any) {
      setError(err.response?.data?.message || t('partner:errors.loadUsers'));
    }
  }, [isPartnerType, t]);

  // Load data based on active tab and filters
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      setError('');
      if (tab === 'merchants') {
        await fetchMerchants(page);
      } else if (tab === 'transactions') {
        // Load merchants in background for filter dropdown if not yet loaded
        if (merchants.length === 0) {
          partnerMerchantsApi.getMyMerchants({ page: 1, limit: 100 }).then((res) => {
            if (!cancelled) setMerchants(res.data.data);
          }).catch(() => {});
        }
        const merchantFilter = filters.merchant;
        await fetchTransactions(page, merchantFilter);
      } else if (tab === 'users') {
        // Load merchants in background for user dialog if not yet loaded
        if (merchants.length === 0) {
          partnerMerchantsApi.getMyMerchants({ page: 1, limit: 100 }).then((res) => {
            if (!cancelled) setMerchants(res.data.data);
          }).catch(() => {});
        }
        await fetchClientUsers(page);
      }
      if (!cancelled) setLoading(false);
    };
    loadData();
    return () => { cancelled = true; };
  }, [tab, page, JSON.stringify(filters), fetchMerchants, fetchTransactions, fetchClientUsers]);

  // Open create transaction dialog
  const openCreateTxDialog = (merchant: PartnerMerchant) => {
    setSelectedMerchantForTx(merchant);
    setCreateTxDialogOpen(true);
  };

  // Open merchant detail dialog
  const openMerchantDetail = (merchant: PartnerMerchant) => {
    setSelectedMerchant(merchant);
    setMerchantDetailOpen(true);
  };

  // Open transaction detail dialog
  const openTransactionDetail = (tx: PartnerTransaction) => {
    setSelectedTransaction(tx);
    setTransactionDetailOpen(true);
  };

  // Export transactions to Excel
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const exportFilters: Record<string, string> = {};
      if (filters.status) exportFilters.status = filters.status as string;
      if (filters.payment_method) exportFilters.payment_method = filters.payment_method as string;
      if (filters.dateFrom) exportFilters.dateFrom = filters.dateFrom as string;
      if (filters.dateTo) exportFilters.dateTo = filters.dateTo as string;

      const res = await partnerTransactionsApi.exportMyTransactions(exportFilters);
      const filename = `transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;
      downloadBlob(new Blob([res.data]), filename);
    } catch (err: any) {
      setError(err.response?.data?.message || t('partner:errors.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  // Delete client user
  const handleDeleteUser = async (userId: string) => {
    try {
      await partnerPortalUsersApi.delete(userId);
      fetchClientUsers(page);
    } catch (err: any) {
      setError(err.response?.data?.message || t('partner:dialogs.deleteUser.error'));
    }
  };

  // Get merchant name by ID
  const getMerchantName = (merchantId: string): string => {
    const merchant = merchants.find((m) => m._id === merchantId);
    return merchant?.profile.fantasy_name || merchantId.slice(-6);
  };

  const pagination: PaginationState = {
    page,
    limit: 10,
    total: meta.total,
    totalPages: meta.totalPages,
    hasNextPage: meta.hasNextPage,
    hasPrevPage: meta.hasPrevPage,
  };

  const usersPagination: PaginationState = {
    page,
    limit: 10,
    total: usersMeta.total,
    totalPages: usersMeta.totalPages,
    hasNextPage: usersMeta.hasNextPage,
    hasPrevPage: usersMeta.hasPrevPage,
  };

  if (loading && merchants.length === 0 && transactions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">{t('partner:loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50/50 via-orange-50/30 to-yellow-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-orange-500/10 dark:from-amber-500/5 dark:to-orange-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-80 h-80 bg-gradient-to-tr from-yellow-400/10 to-amber-500/10 dark:from-yellow-500/5 dark:to-amber-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <DashboardHeader
        portalName={t('partner:portal')}
        icon={Building2}
        gradientClass="from-amber-500 to-orange-600"
        shadowClass="shadow-amber-500/20"
        userName={partnerUser?.name || ''}
        userEmail={partnerUser?.email || ''}
        onLogout={logout}
        logoutLabel={t('partner:logout')}
        onChangePassword={() => setChangeMyPasswordOpen(true)}
        changePasswordLabel={t('partner:dialogs.changeMyPassword.title')}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Error alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${isPartnerType ? 'lg:grid-cols-4' : ''} gap-4 mb-8`}>
          <StatsCard
            icon={Store}
            iconBgClass="from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10"
            iconColorClass="text-amber-600 dark:text-amber-400"
            label={t('partner:stats.totalMerchants')}
            value={counts.merchants}
          />
          <StatsCard
            icon={TrendingUp}
            iconBgClass="from-emerald-500/20 to-green-500/20 dark:from-emerald-500/10 dark:to-green-500/10"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            label={t('partner:stats.activeMerchants')}
            value={counts.activeMerchants}
          />
          <StatsCard
            icon={CreditCard}
            iconBgClass="from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10"
            iconColorClass="text-blue-600 dark:text-blue-400"
            label={t('partner:stats.totalTransactions')}
            value={counts.transactions}
          />
          {isPartnerType && (
            <StatsCard
              icon={Users}
              iconBgClass="from-purple-500/20 to-violet-500/20 dark:from-purple-500/10 dark:to-violet-500/10"
              iconColorClass="text-purple-600 dark:text-purple-400"
              label={t('partner:stats.totalUsers')}
              value={counts.users}
            />
          )}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 p-1 rounded-xl inline-flex w-auto min-w-full sm:min-w-0">
              <TabsTrigger
                value="merchants"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
              >
                <Store className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('partner:tabs.merchants')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
              >
                <CreditCard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('partner:tabs.transactions')}</span>
              </TabsTrigger>
              {isPartnerType && (
                <TabsTrigger
                  value="users"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
                >
                  <Users className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('partner:tabs.users')}</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Merchants Tab */}
          <TabsContent value="merchants" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-white">{t('partner:merchants.title')}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMerchants(page)}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  {t('partner:merchants.refresh')}
                </Button>
              </div>
              <FilterBar
                config={filterConfigs.merchants}
                values={filters}
                onChange={setFilter}
                onClear={clearFilters}
                hasFilters={hasFilters}
              />

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t('partner:merchants.columns.name')}</TableHead>
                    <TableHead>{t('partner:merchants.columns.legalName')}</TableHead>
                    <TableHead>{t('partner:merchants.columns.status')}</TableHead>
                    <TableHead>{t('partner:merchants.columns.paymentMethods')}</TableHead>
                    <TableHead className="text-right">{t('partner:merchants.columns.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {merchants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                        {t('partner:merchants.noResults')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    merchants.map((merchant) => {
                      const statusCfg = getStatusConfig(merchant.status);
                      return (
                        <TableRow
                          key={merchant._id}
                          className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 cursor-pointer"
                          onClick={() => openMerchantDetail(merchant)}
                        >
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
                                  {getPaymentMethodLabel(method)}
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
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); openMerchantDetail(merchant); }}
                                title={t('partner:merchants.viewDetails')}
                                className="h-8 w-8 p-0 border-zinc-200 dark:border-zinc-700"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); openCreateTxDialog(merchant); }}
                                disabled={merchant.status !== 'ACTIVE'}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                {t('partner:merchants.newTransaction')}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>

              <PaginationControls
                pagination={pagination}
                onPageChange={setPage}
              />
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-white">{t('partner:transactions.title')}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(page, filters.merchant)}
                    className="gap-2 shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExportExcel}
                    disabled={exporting}
                    className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-md shadow-emerald-500/20"
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? t('partner:transactions.exporting') : t('partner:transactions.export')}
                  </Button>
                </div>
              </div>
              <FilterBar
                config={filterConfigs.transactions}
                values={filters}
                onChange={setFilter}
                onClear={clearFilters}
                hasFilters={hasFilters}
              />

              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t('partner:transactions.columns.id')}</TableHead>
                    <TableHead>{t('partner:transactions.columns.amount')}</TableHead>
                    <TableHead>{t('partner:transactions.columns.status')}</TableHead>
                    <TableHead>{t('partner:transactions.columns.method')}</TableHead>
                    <TableHead>{t('partner:transactions.columns.merchant')}</TableHead>
                    <TableHead>{t('partner:transactions.columns.date')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                        {t('partner:transactions.noResults')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => {
                      const statusCfg = getStatusConfig(tx.status);
                      const amount = getDecimalValue(tx.financials.amount_gross);
                      return (
                        <TableRow
                          key={tx._id}
                          className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10 cursor-pointer"
                          onClick={() => openTransactionDetail(tx)}
                        >
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
                              {getPaymentMethodLabel(tx.payment_method)}
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

              <PaginationControls
                pagination={pagination}
                onPageChange={setPage}
              />
            </div>
          </TabsContent>

          {/* Users Tab (only for PARTNER type) */}
          {isPartnerType && (
            <TabsContent value="users" className="space-y-4">
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
                <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">{t('partner:users.title')}</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchClientUsers(page)}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setEditingUser(null); setCreateUserDialogOpen(true); }}
                      className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20"
                    >
                      <Plus className="w-4 h-4" />
                      {t('partner:users.create')}
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t('partner:users.columns.name')}</TableHead>
                      <TableHead>{t('partner:users.columns.email')}</TableHead>
                      <TableHead>{t('partner:users.columns.status')}</TableHead>
                      <TableHead>{t('partner:users.columns.merchants')}</TableHead>
                      <TableHead className="text-right">{t('partner:users.columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                          {t('partner:users.noResults')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientUsers.map((user) => {
                        const statusCfg = getStatusConfig(user.status);
                        return (
                          <TableRow key={user._id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={statusCfg.variant} className={statusCfg.className}>
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {user.assigned_merchants.slice(0, 2).map((mid) => (
                                  <Badge key={mid} variant="outline" className="text-xs">
                                    {getMerchantName(mid)}
                                  </Badge>
                                ))}
                                {user.assigned_merchants.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.assigned_merchants.length - 2}
                                  </Badge>
                                )}
                                {user.assigned_merchants.length === 0 && (
                                  <span className="text-zinc-400 text-xs">{t('partner:dialogs.common.none')}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => { setEditingUser(user); setCreateUserDialogOpen(true); }}
                                  title={t('partner:dialogs.common.update')}
                                  className="h-7 w-7 p-0"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setResetPasswordUser(user)}
                                  title={t('partner:dialogs.resetPassword.title')}
                                  className="h-7 w-7 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('partner:dialogs.deleteUser.title')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('partner:dialogs.deleteUser.message', { name: user.name })}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('partner:dialogs.common.cancel')}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                      >
                                        {t('partner:dialogs.deleteUser.confirm')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                <PaginationControls
                  pagination={usersPagination}
                  onPageChange={setPage}
                />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Create Transaction Dialog */}
      <PartnerCreateTransactionDialog
        merchant={selectedMerchantForTx}
        open={createTxDialogOpen}
        onOpenChange={setCreateTxDialogOpen}
        onSuccess={() => fetchTransactions(1, filters.merchant)}
      />

      {/* Merchant Detail Dialog */}
      <PartnerMerchantDetailDialog
        merchant={selectedMerchant}
        open={merchantDetailOpen}
        onOpenChange={(open) => {
          setMerchantDetailOpen(open);
          if (!open) setSelectedMerchant(null);
        }}
      />

      {/* Transaction Detail Dialog */}
      <PartnerTransactionDetailDialog
        transaction={selectedTransaction}
        merchantName={selectedTransaction ? getMerchantName(selectedTransaction.merchant_id) : undefined}
        open={transactionDetailOpen}
        onOpenChange={(open) => {
          setTransactionDetailOpen(open);
          if (!open) setSelectedTransaction(null);
        }}
      />

      {/* User Management Dialogs (PARTNER type only) */}
      {isPartnerType && (
        <>
          <PartnerClientUserDialog
            open={createUserDialogOpen}
            onOpenChange={setCreateUserDialogOpen}
            onSuccess={() => fetchClientUsers(page)}
            item={editingUser}
            merchants={merchants}
          />
          <PartnerResetPasswordDialog
            open={!!resetPasswordUser}
            onOpenChange={(open) => { if (!open) setResetPasswordUser(null); }}
            onSuccess={() => fetchClientUsers(page)}
            userId={resetPasswordUser?._id || ''}
            userName={resetPasswordUser?.name || resetPasswordUser?.email || ''}
            userEmail={resetPasswordUser?.email || ''}
          />
        </>
      )}

      {/* Change My Password Dialog */}
      <PartnerChangeMyPasswordDialog
        open={changeMyPasswordOpen}
        onOpenChange={setChangeMyPasswordOpen}
      />

      {/* Footer */}
      <DashboardFooter text={t('partner:footer', { year: new Date().getFullYear() })} />
    </div>
  );
}
