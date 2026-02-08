import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { merchantsApi, transactionsApi, adminUsersApi, partnersApi, paymentLinksApi, type PaginatedResponse } from '../../api/client';
import { type PaginationState } from '@/types/dashboard.types';
import {
  getStatusConfig,
  getPaymentMethodLabel,
  getPaymentLinkStatusConfig,
  getLinkModeLabel,
  MerchantStatuses,
  PartnerStatuses,
  PaymentMethods,
  AdminRoles,
  TransactionStatuses,
  TransactionCurrencies,
  PaymentLinkStatuses,
  LinkModes,
} from '@/lib/constants';
import { useUrlFilters } from '@/hooks/useUrlFilters';
import { FilterBar, type FilterConfig } from '@/components/shared/FilterBar';

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { DashboardFooter } from '@/components/shared/DashboardFooter';
import { StatsCard } from '@/components/shared/StatsCard';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { TableSkeleton } from '@/components/shared/TableSkeleton';

import { AdminUserDialog } from '@/components/administration/AdminUserDialog';
import { AdminDetailDialog } from '@/components/administration/AdminDetailDialog';
import { MerchantDialog } from '@/components/administration/MerchantDialog';
import { MerchantDetailDialog } from '@/components/administration/MerchantDetailDialog';
import { CreateTransactionDialog } from '@/components/administration/CreateTransactionDialog';
import { TransactionDetailDialog } from '@/components/administration/TransactionDetailDialog';
import { PartnerDialog } from '@/components/administration/PartnerDialog';
import { PartnerDetailDialog } from '@/components/administration/PartnerDetailDialog';
import { SystemConfigTab } from '@/components/administration/SystemConfigTab';
import { ResetPasswordDialog } from '@/components/administration/ResetPasswordDialog';
import { ChangeMyPasswordDialog } from '@/components/administration/ChangeMyPasswordDialog';
import { PaymentLinkDialog } from '@/components/administration/PaymentLinkDialog';
import { PaymentLinkDetailDialog } from '@/components/administration/PaymentLinkDetailDialog';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Ban,
  CheckCircle,
  Download,
  Handshake,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CreditCard,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  RefreshCw,
  Settings,
  KeyRound,
  Link2,
} from 'lucide-react';
import { downloadBlob } from '@/lib/downloadFile';
import type { PaymentLink } from '@/types/payment-link.types';
import { formatCurrency } from '@/types/payment-link.types';

export default function Dashboard() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const { user, logout } = useAuth();
  const { tab, page, filters, setTab, setPage, setFilter, clearFilters, hasFilters } = useUrlFilters({ defaultTab: 'partners' });

  // Set default language to English for admin portal
  useEffect(() => {
    if (!localStorage.getItem('i18nextLng')) {
      i18n.changeLanguage('en');
    }
  }, [i18n]);

  const [merchants, setMerchants] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [allPartners, setAllPartners] = useState<any[]>([]);
  const [allMerchants, setAllMerchants] = useState<any[]>([]);
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);

  const [counts, setCounts] = useState({ partners: 0, merchants: 0, transactions: 0, admins: 0, paymentLinks: 0 });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  const [meta, setMeta] = useState({ total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });

  // Dialog states
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  const [merchantDialogOpen, setMerchantDialogOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<any>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [createTxMerchant, setCreateTxMerchant] = useState<any>(null);
  const [txDialogOpen, setTxDialogOpen] = useState(false);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [exporting, setExporting] = useState(false);

  // Payment Link dialogs
  const [paymentLinkDialogOpen, setPaymentLinkDialogOpen] = useState(false);
  const [editingPaymentLink, setEditingPaymentLink] = useState<PaymentLink | null>(null);
  const [selectedPaymentLink, setSelectedPaymentLink] = useState<PaymentLink | null>(null);
  const [deletingPaymentLink, setDeletingPaymentLink] = useState<PaymentLink | null>(null);

  // Password dialogs
  const [resetPasswordAdmin, setResetPasswordAdmin] = useState<any>(null);
  const [changeMyPasswordOpen, setChangeMyPasswordOpen] = useState(false);

  const partnerMap = useMemo(() => {
    const map: Record<string, string> = {};
    allPartners.forEach((p) => {
      map[p._id] = p.fantasy_name;
    });
    return map;
  }, [allPartners]);

  // Filter configurations per tab
  const partnerOptions = useMemo(
    () => allPartners.map((p) => ({ value: p._id, label: p.fantasy_name })),
    [allPartners],
  );

  const merchantOptions = useMemo(
    () => allMerchants.map((m) => ({ value: m._id, label: m.profile?.fantasy_name || m._id })),
    [allMerchants],
  );

  const filterConfigs: Record<string, FilterConfig[]> = useMemo(() => ({
    partners: [
      { key: 'status', label: t('admin:filters.status'), type: 'select', placeholder: t('common:filters.allStatuses'), options: PartnerStatuses.map((s) => ({ value: s, label: getStatusConfig(s).label })) },
      { key: 'search', label: t('admin:filters.search'), type: 'text', placeholder: t('admin:filters.nameOrEmail') },
    ],
    merchants: [
      { key: 'status', label: t('admin:filters.status'), type: 'select', placeholder: t('common:filters.allStatuses'), options: MerchantStatuses.map((s) => ({ value: s, label: getStatusConfig(s).label })) },
      { key: 'owner', label: t('admin:filters.partner'), type: 'select', placeholder: t('common:filters.allPartners'), options: partnerOptions },
      { key: 'payment_method', label: t('admin:filters.method'), type: 'select', placeholder: t('common:filters.allMethods'), options: PaymentMethods.map((m) => ({ value: m, label: getPaymentMethodLabel(m) })) },
      { key: 'search', label: t('admin:filters.search'), type: 'text', placeholder: t('admin:filters.nameTaxId') },
    ],
    transactions: [
      { key: 'status', label: t('admin:filters.status'), type: 'select', placeholder: t('common:filters.allStatuses'), options: TransactionStatuses.map((s) => ({ value: s, label: getStatusConfig(s).label })) },
      { key: 'payment_method', label: t('admin:filters.method'), type: 'select', placeholder: t('common:filters.allMethods'), options: PaymentMethods.map((m) => ({ value: m, label: getPaymentMethodLabel(m) })) },
      { key: 'currency', label: t('admin:filters.currency'), type: 'select', placeholder: t('common:filters.allCurrencies'), options: TransactionCurrencies.map((c) => ({ value: c, label: c })) },
      { key: 'dateFrom', label: t('admin:filters.from'), type: 'date' },
      { key: 'dateTo', label: t('admin:filters.to'), type: 'date' },
    ],
    admins: [
      { key: 'active', label: t('admin:filters.status'), type: 'select', placeholder: t('common:filters.allStatuses'), options: [{ value: 'true', label: t('admin:filters.active') }, { value: 'false', label: t('admin:filters.inactive') }] },
      { key: 'role', label: t('admin:filters.role'), type: 'select', placeholder: t('common:filters.allRoles'), options: AdminRoles.map((r) => ({ value: r, label: r })) },
      { key: 'search', label: t('admin:filters.search'), type: 'text', placeholder: t('admin:filters.nameOrEmail') },
    ],
    paymentLinks: [
      { key: 'status', label: t('admin:filters.status'), type: 'select', placeholder: t('admin:filters.allStatuses'), options: PaymentLinkStatuses.map((s) => ({ value: s, label: getPaymentLinkStatusConfig(s).label })) },
      { key: 'merchant_id', label: t('admin:filters.merchant'), type: 'select', placeholder: t('admin:filters.allMerchants'), options: merchantOptions },
      { key: 'link_mode', label: t('admin:paymentLinks.linkMode'), type: 'select', placeholder: t('admin:filters.all'), options: LinkModes.map((m) => ({ value: m, label: getLinkModeLabel(m) })) },
    ],
  }), [partnerOptions, merchantOptions, t]);

  useEffect(() => {
    // Load all counts in parallel on mount
    Promise.all([
      partnersApi.list({ page: 1, limit: 1 }),
      merchantsApi.list({ page: 1, limit: 1 }),
      transactionsApi.list({ page: 1, limit: 1 }),
      adminUsersApi.list({ page: 1, limit: 1 }),
      paymentLinksApi.list({ page: 1, limit: 1 }),
    ]).then(([pRes, mRes, tRes, aRes, plRes]) => {
      setCounts({
        partners: (pRes.data as PaginatedResponse<any>).meta.total,
        merchants: (mRes.data as PaginatedResponse<any>).meta.total,
        transactions: (tRes.data as PaginatedResponse<any>).meta.total,
        admins: (aRes.data as PaginatedResponse<any>).meta.total,
        paymentLinks: (plRes.data as PaginatedResponse<any>).meta.total,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [tab, page, JSON.stringify(filters)]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    const params = { page, limit: 10, ...filters };
    try {
      if (tab === 'partners') {
        const res = await partnersApi.list(params);
        const data = res.data as PaginatedResponse<any>;
        setPartners(data.data);
        setMeta(data.meta);
        setCounts(prev => ({ ...prev, partners: data.meta.total }));
      } else if (tab === 'merchants') {
        const [merchRes, partnersRes] = await Promise.all([
          merchantsApi.list(params),
          partnersApi.list({ limit: 100 }),
        ]);
        const data = merchRes.data as PaginatedResponse<any>;
        setMerchants(data.data);
        setMeta(data.meta);
        setCounts(prev => ({ ...prev, merchants: data.meta.total }));
        setAllPartners((partnersRes.data as PaginatedResponse<any>).data);
      } else if (tab === 'transactions') {
        const [txRes, merchRes] = await Promise.all([
          transactionsApi.list(params),
          allMerchants.length === 0 ? merchantsApi.list({ limit: 100 }) : Promise.resolve(null),
        ]);
        const data = txRes.data as PaginatedResponse<any>;
        setTransactions(data.data);
        setMeta(data.meta);
        setCounts(prev => ({ ...prev, transactions: data.meta.total }));
        if (merchRes) setAllMerchants((merchRes.data as PaginatedResponse<any>).data);
      } else if (tab === 'admins') {
        const res = await adminUsersApi.list(params);
        const data = res.data as PaginatedResponse<any>;
        setAdmins(data.data);
        setMeta(data.meta);
        setCounts(prev => ({ ...prev, admins: data.meta.total }));
      } else if (tab === 'paymentLinks') {
        const [linksRes, merchRes] = await Promise.all([
          paymentLinksApi.list(params),
          allMerchants.length === 0 ? merchantsApi.list({ limit: 100 }) : Promise.resolve(null),
        ]);
        const data = linksRes.data as PaginatedResponse<PaymentLink>;
        setPaymentLinks(data.data);
        setMeta(data.meta);
        setCounts(prev => ({ ...prev, paymentLinks: data.meta.total }));
        if (merchRes) setAllMerchants((merchRes.data as PaginatedResponse<any>).data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin:errors.loadFailed'));
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Load allPartners for the merchants filter dropdown when switching to merchants tab
  useEffect(() => {
    if (tab === 'merchants' && allPartners.length === 0) {
      partnersApi.list({ limit: 100 }).then((res) => {
        setAllPartners((res.data as PaginatedResponse<any>).data);
      }).catch(() => {});
    }
    // Load allMerchants for paymentLinks filter dropdown
    if (tab === 'paymentLinks' && allMerchants.length === 0) {
      merchantsApi.list({ limit: 100 }).then((res) => {
        setAllMerchants((res.data as PaginatedResponse<any>).data);
      }).catch(() => {});
    }
  }, [tab]);

  const pagination: PaginationState = {
    page,
    limit: 10,
    total: meta.total,
    totalPages: meta.totalPages,
    hasNextPage: meta.hasNextPage,
    hasPrevPage: meta.hasPrevPage,
  };

  const handleDeleteMerchant = async (id: string) => {
    try {
      await merchantsApi.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin:errors.deleteFailed'));
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      await adminUsersApi.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin:errors.deleteFailed'));
    }
  };

  const handleTransactionAction = async (id: string, action: 'capture' | 'refund' | 'void') => {
    try {
      if (action === 'capture') await transactionsApi.capture(id);
      else if (action === 'refund') await transactionsApi.refund(id);
      else if (action === 'void') await transactionsApi.void(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin:errors.actionFailed', { action }));
    }
  };

  const openCreateAdmin = () => {
    setEditingAdmin(null);
    setAdminDialogOpen(true);
  };

  const openEditAdmin = (admin: any) => {
    setEditingAdmin(admin);
    setAdminDialogOpen(true);
  };

  const handleDeletePartner = async (id: string) => {
    try {
      await partnersApi.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin:errors.deleteFailed'));
    }
  };

  const openCreatePartner = () => {
    setEditingPartner(null);
    setPartnerDialogOpen(true);
  };

  const openEditPartner = (partner: any) => {
    setEditingPartner(partner);
    setPartnerDialogOpen(true);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const exportFilters: Record<string, string> = {};
      if (filters.status) exportFilters.status = filters.status as string;
      if (filters.payment_method) exportFilters.payment_method = filters.payment_method as string;
      if (filters.currency) exportFilters.currency = filters.currency as string;
      if (filters.dateFrom) exportFilters.dateFrom = filters.dateFrom as string;
      if (filters.dateTo) exportFilters.dateTo = filters.dateTo as string;

      const res = await transactionsApi.export(exportFilters);
      const filename = `transactions_${new Date().toISOString().slice(0, 10)}.xlsx`;
      downloadBlob(new Blob([res.data]), filename);
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin:errors.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const openCreateMerchant = () => {
    setEditingMerchant(null);
    setMerchantDialogOpen(true);
  };

  const openEditMerchant = (merchant: any) => {
    setEditingMerchant(merchant);
    setMerchantDialogOpen(true);
  };

  // Payment Link actions
  const handleDeletePaymentLink = async () => {
    if (!deletingPaymentLink) return;
    try {
      await paymentLinksApi.delete(deletingPaymentLink._id);
      setDeletingPaymentLink(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || t('admin:errors.deleteFailed'));
      setDeletingPaymentLink(null);
    }
  };

  const getMerchantName = (merchantId: string): string => {
    const merchant = allMerchants.find((m) => m._id === merchantId);
    return merchant?.profile?.fantasy_name || merchantId.slice(-6);
  };

  const openCreatePaymentLink = () => {
    setEditingPaymentLink(null);
    setPaymentLinkDialogOpen(true);
  };

  const openEditPaymentLink = (link: PaymentLink) => {
    setEditingPaymentLink(link);
    setPaymentLinkDialogOpen(true);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">{t('admin:loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-sky-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-80 h-80 bg-gradient-to-tr from-sky-400/10 to-blue-500/10 dark:from-sky-500/5 dark:to-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <DashboardHeader
        portalName={t('admin:portal')}
        icon={ShieldCheck}
        gradientClass="from-blue-500 to-indigo-600"
        shadowClass="shadow-blue-500/20"
        userName={user?.full_name || user?.email || ''}
        userEmail={user?.email || ''}
        onLogout={logout}
        logoutLabel={t('admin:logout')}
        onChangePassword={() => setChangeMyPasswordOpen(true)}
        changePasswordLabel={t('admin:dialogs.changeMyPassword.title')}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Handshake}
            iconBgClass="from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10"
            iconColorClass="text-amber-600 dark:text-amber-400"
            label={t('admin:stats.partners')}
            value={counts.partners}
          />
          <StatsCard
            icon={Store}
            iconBgClass="from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10"
            iconColorClass="text-blue-600 dark:text-blue-400"
            label={t('admin:stats.merchants')}
            value={counts.merchants}
          />
          <StatsCard
            icon={TrendingUp}
            iconBgClass="from-emerald-500/20 to-green-500/20 dark:from-emerald-500/10 dark:to-green-500/10"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            label={t('admin:stats.transactions')}
            value={counts.transactions}
          />
          <StatsCard
            icon={Users}
            iconBgClass="from-purple-500/20 to-violet-500/20 dark:from-purple-500/10 dark:to-violet-500/10"
            iconColorClass="text-purple-600 dark:text-purple-400"
            label={t('admin:stats.adminUsers')}
            value={counts.admins}
          />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
            <TabsList className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 p-1 rounded-xl inline-flex w-auto min-w-full sm:min-w-0">
              <TabsTrigger
                value="partners"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
              >
                <Handshake className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin:tabs.partners')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="merchants"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
              >
                <Store className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin:tabs.merchants')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="paymentLinks"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
              >
                <Link2 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin:tabs.paymentLinks')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="transactions"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
              >
                <CreditCard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin:tabs.transactions')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="admins"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
              >
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin:tabs.admins')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="configuration"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-3 sm:px-6 shrink-0"
              >
                <Settings className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('admin:tabs.configuration')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Partners Tab */}
          <TabsContent value="partners" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {t('admin:partners.title', { total: meta.total })}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={openCreatePartner}
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    {t('admin:partners.create')}
                  </Button>
                </div>
              </div>
              <FilterBar
                config={filterConfigs.partners}
                values={filters}
                onChange={setFilter}
                onClear={clearFilters}
                hasFilters={hasFilters}
              />
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{t('admin:partners.columns.fantasyName')}</TableHead>
                        <TableHead>{t('admin:partners.columns.businessName')}</TableHead>
                        <TableHead>{t('admin:partners.columns.contactEmail')}</TableHead>
                        <TableHead>{t('admin:partners.columns.phone')}</TableHead>
                        <TableHead>{t('admin:partners.columns.status')}</TableHead>
                        <TableHead className="text-right">{t('common:table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partners.map((p) => {
                        const statusCfg = getStatusConfig(p.status);
                        return (
                          <TableRow key={p._id} className="hover:bg-amber-50/50 dark:hover:bg-amber-900/10">
                            <TableCell className="font-medium text-zinc-900 dark:text-white">
                              {p.fantasy_name}
                            </TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{p.legal_name}</TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{p.contact_email}</TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{p.contact_phone || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={statusCfg.variant} className={statusCfg.className}>
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedPartner(p)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditPartner(p)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('admin:partners.deleteTitle')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('admin:partners.deleteMessage', { name: p.fantasy_name })}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('common:buttons.cancel')}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeletePartner(p._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                      >
                                        {t('common:buttons.delete')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {partners.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                            {t('admin:partners.noResults')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    pagination={pagination}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Merchants Tab */}
          <TabsContent value="merchants" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {t('admin:merchants.title', { total: meta.total })}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={openCreateMerchant}
                    className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    {t('admin:merchants.create')}
                  </Button>
                </div>
              </div>
              <FilterBar
                config={filterConfigs.merchants}
                values={filters}
                onChange={setFilter}
                onClear={clearFilters}
                hasFilters={hasFilters}
              />
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{t('admin:merchants.columns.fantasyName')}</TableHead>
                        <TableHead>{t('admin:merchants.columns.legalName')}</TableHead>
                        <TableHead>{t('admin:merchants.columns.partner')}</TableHead>
                        <TableHead>{t('admin:merchants.columns.taxId')}</TableHead>
                        <TableHead>{t('admin:merchants.columns.status')}</TableHead>
                        <TableHead>{t('admin:merchants.columns.paymentMethods')}</TableHead>
                        <TableHead className="text-right">{t('common:table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {merchants.map((m) => {
                        const statusCfg = getStatusConfig(m.status);
                        return (
                          <TableRow key={m._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                            <TableCell className="font-medium text-zinc-900 dark:text-white">
                              {m.profile?.fantasy_name}
                            </TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{m.profile?.legal_name}</TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">
                              {partnerMap[m.owner] || m.owner?.slice?.(-6) || '-'}
                            </TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{m.profile?.tax_id}</TableCell>
                            <TableCell>
                              <Badge variant={statusCfg.variant} className={statusCfg.className}>
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {m.enabled_payment_methods?.slice(0, 2).map((method: string) => (
                                  <Badge key={method} variant="outline" className="text-xs">{getPaymentMethodLabel(method)}</Badge>
                                ))}
                                {m.enabled_payment_methods?.length > 2 && (
                                  <Badge variant="outline" className="text-xs">+{m.enabled_payment_methods.length - 2}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                {m.status === 'REVIEW' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => { await merchantsApi.update(m._id, { status: 'ACTIVE' }); loadData(); }}
                                      className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/50"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => { await merchantsApi.update(m._id, { status: 'BLOCKED' }); loadData(); }}
                                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50"
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedMerchant(m)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditMerchant(m)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setCreateTxMerchant(m)}
                                  className="h-8 w-8 p-0 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                                >
                                  <CreditCard className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('admin:merchants.deleteTitle')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('admin:merchants.deleteMessage', { name: m.profile?.fantasy_name })}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('common:buttons.cancel')}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteMerchant(m._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                      >
                                        {t('common:buttons.delete')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {merchants.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                            {t('admin:merchants.noResults')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    pagination={pagination}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Payment Links Tab */}
          <TabsContent value="paymentLinks" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {t('admin:paymentLinks.title', { total: meta.total })}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={openCreatePaymentLink}
                    className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('admin:paymentLinks.create')}</span>
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
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>{t('admin:paymentLinks.columns.merchant')}</TableHead>
                          <TableHead>{t('admin:paymentLinks.columns.name')}</TableHead>
                          <TableHead className="hidden md:table-cell">{t('admin:paymentLinks.columns.code')}</TableHead>
                          <TableHead className="hidden lg:table-cell">{t('admin:paymentLinks.columns.type')}</TableHead>
                          <TableHead className="hidden sm:table-cell">{t('admin:paymentLinks.columns.amount')}</TableHead>
                          <TableHead className="hidden lg:table-cell">{t('admin:paymentLinks.columns.uses')}</TableHead>
                          <TableHead>{t('admin:paymentLinks.columns.status')}</TableHead>
                          <TableHead className="text-right">{t('common:table.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentLinks.map((link) => {
                          const statusCfg = getPaymentLinkStatusConfig(link.status);
                          return (
                            <TableRow key={link._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                              <TableCell className="font-medium text-zinc-900 dark:text-white">
                                {getMerchantName(link.merchant_id)}
                              </TableCell>
                              <TableCell className="text-zinc-700 dark:text-zinc-300">{link.name}</TableCell>
                              <TableCell className="hidden md:table-cell font-mono text-xs text-zinc-500">
                                {link.code}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <Badge variant="outline" className="text-xs">{getLinkModeLabel(link.link_mode)}</Badge>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-zinc-600 dark:text-zinc-400">
                                {link.amount_mode === 'FIXED' && link.fixed_amount
                                  ? formatCurrency(link.fixed_amount, link.currency)
                                  : t('admin:paymentLinks.variable')}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-zinc-600 dark:text-zinc-400">
                                {link.stats.usage_count}{link.max_uses ? `/${link.max_uses}` : ''}
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusCfg.variant} className={statusCfg.className}>
                                  {statusCfg.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedPaymentLink(link)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditPaymentLink(link)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeletingPaymentLink(link)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {paymentLinks.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-zinc-500 py-8">
                              {t('admin:paymentLinks.noResults')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    pagination={pagination}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {t('admin:transactions.title', { total: meta.total })}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData()}
                    className="gap-2"
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
                    <span className="hidden sm:inline">{exporting ? t('admin:transactions.exporting') : t('admin:transactions.export')}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setTxDialogOpen(true)}
                    className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('admin:transactions.create')}</span>
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
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{t('admin:transactions.columns.id')}</TableHead>
                        <TableHead>{t('admin:transactions.columns.amount')}</TableHead>
                        <TableHead>{t('admin:transactions.columns.currency')}</TableHead>
                        <TableHead>{t('admin:transactions.columns.status')}</TableHead>
                        <TableHead>{t('admin:transactions.columns.paymentMethod')}</TableHead>
                        <TableHead>{t('admin:transactions.columns.created')}</TableHead>
                        <TableHead className="text-right">{t('common:table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => {
                        const statusCfg = getStatusConfig(tx.status);
                        return (
                          <TableRow key={tx._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                            <TableCell className="font-mono text-xs">
                              {tx._id?.slice(-8)}
                            </TableCell>
                            <TableCell className="font-semibold text-zinc-900 dark:text-white">
                              {tx.financials?.amount_gross?.$numberDecimal || tx.financials?.amount_gross?.toLocaleString() || tx.financials?.amount_gross}
                            </TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{tx.financials?.currency}</TableCell>
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
                            <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">
                              {new Date(tx.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTransaction(tx)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {tx.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleTransactionAction(tx._id, 'capture')}
                                      className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
                                    >
                                      {t('admin:transactions.capture')}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTransactionAction(tx._id, 'void')}
                                      className="h-8 text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs"
                                    >
                                      {t('admin:transactions.void')}
                                    </Button>
                                  </>
                                )}
                                {tx.status === 'APPROVED' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTransactionAction(tx._id, 'refund')}
                                    className="h-8 text-purple-500 border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-xs"
                                  >
                                    {t('admin:transactions.refund')}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {transactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                            {t('admin:transactions.noResults')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    pagination={pagination}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Admin Users Tab */}
          <TabsContent value="admins" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  {t('admin:admins.title', { total: meta.total })}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadData()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={openCreateAdmin}
                    className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    {t('admin:admins.create')}
                  </Button>
                </div>
              </div>
              <FilterBar
                config={filterConfigs.admins}
                values={filters}
                onChange={setFilter}
                onClear={clearFilters}
                hasFilters={hasFilters}
              />
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{t('admin:admins.columns.name')}</TableHead>
                        <TableHead>{t('admin:admins.columns.email')}</TableHead>
                        <TableHead>{t('admin:admins.columns.roles')}</TableHead>
                        <TableHead>{t('admin:admins.columns.status')}</TableHead>
                        <TableHead className="text-right">{t('common:table.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((a) => {
                        const statusCfg = getStatusConfig(a.active ? 'ACTIVE' : 'INACTIVE');
                        return (
                          <TableRow key={a._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                            <TableCell className="font-medium text-zinc-900 dark:text-white">
                              {a.full_name}
                            </TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{a.email}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {a.roles?.map((role: string) => (
                                  <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusCfg.variant} className={statusCfg.className}>
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedAdmin(a)}
                                  className="h-8 w-8 p-0"
                                  title={t('common:buttons.view')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditAdmin(a)}
                                  className="h-8 w-8 p-0"
                                  title={t('common:buttons.edit')}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setResetPasswordAdmin(a)}
                                  className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 border-amber-200 dark:border-amber-900/50"
                                  title={t('admin:dialogs.adminUser.resetPassword')}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 border-red-200 dark:border-red-900/50">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>{t('admin:admins.deleteTitle')}</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t('admin:admins.deleteMessage', { name: a.full_name || a.email })}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>{t('common:buttons.cancel')}</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteAdmin(a._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                      >
                                        {t('common:buttons.delete')}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {admins.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                            {t('admin:admins.noResults')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    pagination={pagination}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-4">
            <SystemConfigTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <DashboardFooter text={t('admin:footer', { year: new Date().getFullYear() })} />

      {/* Admin Dialogs */}
      <AdminUserDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        onSuccess={loadData}
        item={editingAdmin}
      />
      <AdminDetailDialog
        item={selectedAdmin}
        open={!!selectedAdmin}
        onOpenChange={(open) => !open && setSelectedAdmin(null)}
      />
      <ResetPasswordDialog
        open={!!resetPasswordAdmin}
        onOpenChange={(open) => !open && setResetPasswordAdmin(null)}
        onSuccess={loadData}
        userId={resetPasswordAdmin?._id || ''}
        userName={resetPasswordAdmin?.full_name || resetPasswordAdmin?.email || ''}
        userEmail={resetPasswordAdmin?.email || ''}
        userType="admin"
      />
      <ChangeMyPasswordDialog
        open={changeMyPasswordOpen}
        onOpenChange={setChangeMyPasswordOpen}
      />

      {/* Merchant Dialogs */}
      <MerchantDialog
        open={merchantDialogOpen}
        onOpenChange={setMerchantDialogOpen}
        onSuccess={loadData}
        item={editingMerchant}
      />
      <MerchantDetailDialog
        item={selectedMerchant}
        open={!!selectedMerchant}
        onOpenChange={(open) => !open && setSelectedMerchant(null)}
      />

      {/* Partner Dialogs */}
      <PartnerDialog
        open={partnerDialogOpen}
        onOpenChange={setPartnerDialogOpen}
        onSuccess={loadData}
        item={editingPartner}
      />
      <PartnerDetailDialog
        item={selectedPartner}
        open={!!selectedPartner}
        onOpenChange={(open) => !open && setSelectedPartner(null)}
      />

      {/* Transaction Dialogs */}
      <TransactionDetailDialog
        item={selectedTransaction}
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      />
      <CreateTransactionDialog
        merchant={createTxMerchant}
        open={!!createTxMerchant}
        onOpenChange={(open) => !open && setCreateTxMerchant(null)}
        onSuccess={loadData}
      />
      <CreateTransactionDialog
        merchants={allMerchants.filter(m => m.status === 'ACTIVE')}
        open={txDialogOpen}
        onOpenChange={setTxDialogOpen}
        onSuccess={loadData}
      />

      {/* Payment Link Dialogs */}
      <PaymentLinkDialog
        open={paymentLinkDialogOpen}
        onOpenChange={setPaymentLinkDialogOpen}
        onSuccess={loadData}
        item={editingPaymentLink}
        merchants={allMerchants}
      />
      <PaymentLinkDetailDialog
        item={selectedPaymentLink}
        open={!!selectedPaymentLink}
        onOpenChange={(open) => !open && setSelectedPaymentLink(null)}
      />

      {/* Delete Payment Link Confirmation */}
      <AlertDialog open={!!deletingPaymentLink} onOpenChange={(open) => !open && setDeletingPaymentLink(null)}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin:paymentLinks.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin:paymentLinks.deleteMessage', { name: deletingPaymentLink?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:buttons.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePaymentLink}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {t('common:buttons.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
