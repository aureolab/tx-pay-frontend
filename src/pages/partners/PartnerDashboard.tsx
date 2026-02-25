import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePartnerAuth } from '../../context/PartnerAuthContext';
import {
  partnerMerchantsApi,
  partnerTransactionsApi,
  partnerPortalUsersApi,
  partnerPaymentLinksApi,
} from '../../api/partnerClient';
import type {
  PartnerMerchant,
  PartnerTransaction,
  PartnerClientUser,
} from '../../types/partner.types';
import type { PaymentLink } from '@/types/payment-link.types';
import { getErrorMessage } from '@/types/api-error.types';
import { type PaginationState } from '@/types/dashboard.types';
import {
  getStatusConfig,
  getPaymentMethodLabel,
  getPaymentLinkStatusConfig,
  getLinkModeLabel,
  MerchantStatuses,
  TransactionStatuses,
  PaymentMethods,
  PaymentLinkStatuses,
  LinkModes,
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
import { PartnerPaymentLinkDialog } from '@/components/partners/PartnerPaymentLinkDialog';
import { PartnerPaymentLinkDetailDialog } from '@/components/partners/PartnerPaymentLinkDetailDialog';

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
  Link2,
  Copy,
  Check,
  History,
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
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });
  const [usersMeta, setUsersMeta] = useState({ total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });

  const [counts, setCounts] = useState({ merchants: 0, activeMerchants: 0, transactions: 0, users: 0, paymentLinks: 0 });

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dialog states
  const [createTxDialogOpen, setCreateTxDialogOpen] = useState(false);
  const [selectedMerchantForTx, setSelectedMerchantForTx] = useState<PartnerMerchant | null>(null);
  const [txTabDialogOpen, setTxTabDialogOpen] = useState(false);

  // Detail dialog states
  const [selectedMerchant, setSelectedMerchant] = useState<PartnerMerchant | null>(null);
  const [merchantDetailOpen, setMerchantDetailOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PartnerTransaction | null>(null);
  const [transactionDetailOpen, setTransactionDetailOpen] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // User management dialog states
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PartnerClientUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<PartnerClientUser | null>(null);
  const [changeMyPasswordOpen, setChangeMyPasswordOpen] = useState(false);

  // Payment link dialog states
  const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = useState(false);
  const [editingPaymentLink, setEditingPaymentLink] = useState<PaymentLink | null>(null);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentLink | null>(null);
  const [deletingPaymentLink, setDeletingPaymentLink] = useState<PaymentLink | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Load all counts on mount
  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [mRes, tRes, plRes] = await Promise.all([
          partnerMerchantsApi.getMyMerchants({ page: 1, limit: 100 }),
          partnerTransactionsApi.getMyTransactions({ page: 1, limit: 1 }),
          partnerPaymentLinksApi.list({ page: 1, limit: 1 }),
        ]);
        const merchantsData = mRes.data.data as PartnerMerchant[];
        const activeMerch = merchantsData.filter((m) => m.status === 'ACTIVE').length;
        setCounts(prev => ({
          ...prev,
          merchants: merchantsData.length,
          activeMerchants: activeMerch,
          transactions: mRes.data.meta ? mRes.data.meta.total : merchantsData.length,
          paymentLinks: plRes.data.meta.total,
        }));
        setCounts(prev => ({
          ...prev,
          transactions: tRes.data.meta.total,
        }));
        // Also populate merchants array for filter dropdown
        setMerchants(merchantsData);
      } catch { /* ignore */ }
      if (isPartnerType) {
        try {
          const uRes = await partnerPortalUsersApi.list({ page: 1, limit: 1 });
          setCounts(prev => ({ ...prev, users: uRes.data.meta.total }));
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
    paymentLinks: [
      { key: 'status', label: t('partner:filters.status'), type: 'select', placeholder: t('common:filters.allStatuses'), options: PaymentLinkStatuses.map((s) => ({ value: s, label: getPaymentLinkStatusConfig(s, i18n.language as 'en' | 'es').label })) },
      { key: 'merchant_id', label: t('partner:filters.merchant'), type: 'select', placeholder: t('common:filters.allMerchants'), options: merchantOptions },
      { key: 'link_mode', label: t('partner:paymentLinks.linkMode'), type: 'select', placeholder: t('common:filters.all'), options: LinkModes.map((m) => ({ value: m, label: getLinkModeLabel(m, i18n.language as 'en' | 'es') })) },
    ],
  }), [merchantOptions, t, i18n.language]);

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
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('partner:errors.loadMerchants'));
    }
  }, [t]);

  // Fetch transactions
  const fetchTransactions = useCallback(async (pageNum: number = 1, merchantId?: string, txFilters?: Record<string, string>) => {
    try {
      let res;
      if (merchantId && merchantId !== 'all') {
        res = await partnerTransactionsApi.getByMerchant(merchantId, { page: pageNum, limit: 10 });
      } else {
        res = await partnerTransactionsApi.getMyTransactions({ page: pageNum, limit: 10, ...txFilters });
      }
      setTransactions(res.data.data);
      setMeta(res.data.meta);
      setCounts(prev => ({ ...prev, transactions: res.data.meta.total }));
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('partner:errors.loadTransactions'));
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
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('partner:errors.loadUsers'));
    }
  }, [isPartnerType, t]);

  // Fetch payment links
  const fetchPaymentLinks = useCallback(async (pageNum: number = 1, linkFilters?: Record<string, string>) => {
    try {
      const res = await partnerPaymentLinksApi.list({ page: pageNum, limit: 10, ...linkFilters });
      setPaymentLinks(res.data.data);
      setMeta(res.data.meta);
      setCounts(prev => ({ ...prev, paymentLinks: res.data.meta.total }));
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('partner:errors.loadPaymentLinks'));
    }
  }, [t]);

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
        const txFilters: Record<string, string> = {};
        if (filters.payment_link_id) txFilters.payment_link_id = filters.payment_link_id as string;
        if (filters.status) txFilters.status = filters.status as string;
        if (filters.payment_method) txFilters.payment_method = filters.payment_method as string;
        if (filters.dateFrom) txFilters.dateFrom = filters.dateFrom as string;
        if (filters.dateTo) txFilters.dateTo = filters.dateTo as string;
        await fetchTransactions(page, merchantFilter, txFilters);
      } else if (tab === 'users') {
        // Load merchants in background for user dialog if not yet loaded
        if (merchants.length === 0) {
          partnerMerchantsApi.getMyMerchants({ page: 1, limit: 100 }).then((res) => {
            if (!cancelled) setMerchants(res.data.data);
          }).catch(() => {});
        }
        await fetchClientUsers(page);
      } else if (tab === 'paymentLinks') {
        // Load merchants in background for filter dropdown and dialog if not yet loaded
        if (merchants.length === 0) {
          partnerMerchantsApi.getMyMerchants({ page: 1, limit: 100 }).then((res) => {
            if (!cancelled) setMerchants(res.data.data);
          }).catch(() => {});
        }
        const linkFilters: Record<string, string> = {};
        if (filters.status) linkFilters.status = filters.status as string;
        if (filters.merchant_id) linkFilters.merchant_id = filters.merchant_id as string;
        if (filters.link_mode) linkFilters.link_mode = filters.link_mode as string;
        await fetchPaymentLinks(page, linkFilters);
      }
      if (!cancelled) setLoading(false);
    };
    loadData();
    return () => { cancelled = true; };
  }, [tab, page, JSON.stringify(filters), fetchMerchants, fetchTransactions, fetchClientUsers, fetchPaymentLinks]);

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
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('partner:errors.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  // Delete client user
  const handleDeleteUser = async (userId: string) => {
    try {
      await partnerPortalUsersApi.delete(userId);
      fetchClientUsers(page);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('partner:dialogs.deleteUser.error'));
    }
  };

  // Get merchant name by ID
  const getMerchantName = (merchantId: string): string => {
    const merchant = merchants.find((m) => m._id === merchantId);
    return merchant?.profile.fantasy_name || merchantId.slice(-6);
  };

  // Delete payment link
  const handleDeletePaymentLink = async () => {
    if (!deletingPaymentLink) return;
    setDeletingLoading(true);
    try {
      await partnerPaymentLinksApi.delete(deletingPaymentLink._id);
      setDeletingPaymentLink(null);
      fetchPaymentLinks(page, filters as Record<string, string>);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t('partner:errors.deleteFailed'));
      setDeletingPaymentLink(null);
    } finally {
      setDeletingLoading(false);
    }
  };

  // Open payment link dialogs
  const openCreatePaymentLink = () => {
    setEditingPaymentLink(null);
    setPaymentLinkDialogOpen(true);
  };

  const openEditPaymentLink = (link: PaymentLink) => {
    setEditingPaymentLink(link);
    setPaymentLinkDialogOpen(true);
  };

  const handleCopyLink = async (url: string, linkId: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleViewLinkTransactions = (link: PaymentLink) => {
    if (link._id) {
      setTab('transactions', { payment_link_id: link._id });
    }
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
                value="paymentLinks"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
              >
                <Link2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('partner:tabs.paymentLinks')}</span>
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

          {/* Payment Links Tab */}
          <TabsContent value="paymentLinks" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {t('partner:paymentLinks.title', { total: meta.total })}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPaymentLinks(page, filters as Record<string, string>)}
                    className="gap-2 shrink-0"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={openCreatePaymentLink}
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('partner:paymentLinks.create')}</span>
                    <span className="sm:hidden">Nuevo</span>
                  </Button>
                </div>
              </div>
              <FilterBar
                config={filterConfigs.paymentLinks}
                values={filters}
                onChange={setFilter}
                onClear={clearFilters}
                hasFilters={hasFilters}
              />

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t('partner:paymentLinks.columns.merchant')}</TableHead>
                      <TableHead>{t('partner:paymentLinks.columns.name')}</TableHead>
                      <TableHead className="hidden md:table-cell">{t('partner:paymentLinks.columns.code')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('partner:paymentLinks.columns.type')}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t('partner:paymentLinks.columns.amount')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('partner:paymentLinks.columns.uses')}</TableHead>
                      <TableHead>{t('partner:paymentLinks.columns.status')}</TableHead>
                      <TableHead className="text-right">{t('common:table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentLinks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                          {t('partner:paymentLinks.noResults')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paymentLinks.map((link) => {
                        const statusConfig = getPaymentLinkStatusConfig(link.status, i18n.language as 'en' | 'es');
                        const merchantName = getMerchantName(link.merchant_id);
                        return (
                          <TableRow
                            key={link._id}
                            className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10"
                          >
                            <TableCell className="font-medium">{merchantName}</TableCell>
                            <TableCell>{link.name}</TableCell>
                            <TableCell className="hidden md:table-cell font-mono text-xs">
                              {link.code}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant="outline">
                                {getLinkModeLabel(link.link_mode, i18n.language as 'en' | 'es')}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {link.amount_mode === 'FIXED' && link.fixed_amount
                                ? formatCurrency(
                                    typeof link.fixed_amount === 'object' && '$numberDecimal' in link.fixed_amount
                                      ? parseFloat((link.fixed_amount as { $numberDecimal: string }).$numberDecimal)
                                      : Number(link.fixed_amount),
                                    link.currency
                                  )
                                : t('partner:paymentLinks.variable')}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {link.stats?.usage_count || 0}{link.max_uses ? `/${link.max_uses}` : ''}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig.variant} className={statusConfig.className}>
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCopyLink(link.checkout_url!, link._id!)}
                                  title={t('partner:paymentLinks.copyLink')}
                                  className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                                >
                                  {copiedLinkId === link._id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewLinkTransactions(link)}
                                  title={t('partner:paymentLinks.viewTransactions')}
                                  className="h-8 w-8 p-0 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedPaymentLink(link)}
                                  title={t('partner:merchants.viewDetails')}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditPaymentLink(link)}
                                  title={t('partner:dialogs.common.update')}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeletingPaymentLink(link)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                pagination={pagination}
                onPageChange={setPage}
              />
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-semibold text-zinc-900 dark:text-white">{t('partner:transactions.title')}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(page, filters.merchant as string)}
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
                    <span className="hidden sm:inline">{exporting ? t('partner:transactions.exporting') : t('partner:transactions.export')}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setTxTabDialogOpen(true)}
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('partner:transactions.create')}</span>
                    <span className="sm:hidden">Nuevo</span>
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

      {/* Create Transaction Dialog (from merchant row) */}
      <PartnerCreateTransactionDialog
        merchant={selectedMerchantForTx}
        open={createTxDialogOpen}
        onOpenChange={setCreateTxDialogOpen}
        onSuccess={() => fetchTransactions(1, filters.merchant)}
      />
      {/* Create Transaction Dialog (from transactions tab) */}
      <PartnerCreateTransactionDialog
        merchants={merchants.filter(m => m.status === 'ACTIVE')}
        open={txTabDialogOpen}
        onOpenChange={setTxTabDialogOpen}
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

      {/* Payment Link Dialogs */}
      <PartnerPaymentLinkDialog
        merchants={merchants.map(m => ({ _id: m._id, profile: { fantasy_name: m.profile.fantasy_name, legal_name: m.profile.legal_name } }))}
        item={editingPaymentLink}
        open={paymentLinkDialogOpen}
        onOpenChange={setPaymentLinkDialogOpen}
        onSuccess={() => fetchPaymentLinks(page, filters as Record<string, string>)}
      />

      <PartnerPaymentLinkDetailDialog
        item={selectedPaymentLink}
        open={!!selectedPaymentLink}
        onOpenChange={(open) => { if (!open) setSelectedPaymentLink(null); }}
      />

      {/* Delete Payment Link Confirmation */}
      <AlertDialog open={!!deletingPaymentLink} onOpenChange={(open) => !open && !deletingLoading && setDeletingPaymentLink(null)}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('partner:paymentLinks.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('partner:paymentLinks.deleteMessage', { name: deletingPaymentLink?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingPaymentLink(null)}
              disabled={deletingLoading}
            >
              {t('partner:dialogs.common.cancel')}
            </Button>
            <Button
              onClick={handleDeletePaymentLink}
              disabled={deletingLoading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deletingLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Eliminando...</span>
                </div>
              ) : (
                t('common:buttons.delete')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Footer */}
      <DashboardFooter text={t('partner:footer', { year: new Date().getFullYear() })} />
    </div>
  );
}
