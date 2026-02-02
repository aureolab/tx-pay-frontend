import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { merchantsApi, transactionsApi, adminUsersApi, healthApi, type PaginatedResponse } from '../api/client';
import { type PaginationState, defaultPagination } from '@/types/dashboard.types';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { DashboardFooter } from '@/components/shared/DashboardFooter';
import { StatsCard } from '@/components/shared/StatsCard';
import { PaginationControls } from '@/components/shared/PaginationControls';
import { TableSkeleton } from '@/components/shared/TableSkeleton';

import { AdminUserDialog } from '@/components/admin/AdminUserDialog';
import { AdminDetailDialog } from '@/components/admin/AdminDetailDialog';
import { MerchantDialog } from '@/components/admin/MerchantDialog';
import { MerchantDetailDialog } from '@/components/admin/MerchantDetailDialog';
import { CreateTransactionDialog } from '@/components/admin/CreateTransactionDialog';
import { TransactionDetailDialog } from '@/components/admin/TransactionDetailDialog';

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
  Database,
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
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<string>('merchants');
  const [merchants, setMerchants] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  const [merchantsPagination, setMerchantsPagination] = useState<PaginationState>(defaultPagination);
  const [transactionsPagination, setTransactionsPagination] = useState<PaginationState>(defaultPagination);
  const [adminsPagination, setAdminsPagination] = useState<PaginationState>(defaultPagination);

  // Dialog states
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  const [merchantDialogOpen, setMerchantDialogOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<any>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);
  const [createTxMerchant, setCreateTxMerchant] = useState<any>(null);

  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  useEffect(() => {
    healthApi.check().then(res => setHealth(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [tab, merchantsPagination.page, transactionsPagination.page, adminsPagination.page]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'merchants') {
        const res = await merchantsApi.list({ page: merchantsPagination.page, limit: merchantsPagination.limit });
        const data = res.data as PaginatedResponse<any>;
        setMerchants(data.data);
        setMerchantsPagination(prev => ({ ...prev, ...data.meta }));
      } else if (tab === 'transactions') {
        const res = await transactionsApi.list({ page: transactionsPagination.page, limit: transactionsPagination.limit });
        const data = res.data as PaginatedResponse<any>;
        setTransactions(data.data);
        setTransactionsPagination(prev => ({ ...prev, ...data.meta }));
      } else if (tab === 'admins') {
        const res = await adminUsersApi.list({ page: adminsPagination.page, limit: adminsPagination.limit });
        const data = res.data as PaginatedResponse<any>;
        setAdmins(data.data);
        setAdminsPagination(prev => ({ ...prev, ...data.meta }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (tab === 'merchants') {
      setMerchantsPagination(prev => ({ ...prev, page: newPage }));
    } else if (tab === 'transactions') {
      setTransactionsPagination(prev => ({ ...prev, page: newPage }));
    } else if (tab === 'admins') {
      setAdminsPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleDeleteMerchant = async (id: string) => {
    try {
      await merchantsApi.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      await adminUsersApi.delete(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleTransactionAction = async (id: string, action: 'capture' | 'refund' | 'void') => {
    try {
      if (action === 'capture') await transactionsApi.capture(id);
      else if (action === 'refund') await transactionsApi.refund(id);
      else if (action === 'void') await transactionsApi.void(id);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || `${action} failed`);
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

  const openCreateMerchant = () => {
    setEditingMerchant(null);
    setMerchantDialogOpen(true);
  };

  const openEditMerchant = (merchant: any) => {
    setEditingMerchant(merchant);
    setMerchantDialogOpen(true);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-sky-50/50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 dark:from-blue-500/5 dark:to-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-80 h-80 bg-gradient-to-tr from-sky-400/10 to-blue-500/10 dark:from-sky-500/5 dark:to-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <DashboardHeader
        portalName="Admin"
        icon={ShieldCheck}
        gradientClass="from-blue-500 to-indigo-600"
        shadowClass="shadow-blue-500/20"
        userName={user?.full_name || user?.email || ''}
        userEmail={user?.email || ''}
        onLogout={logout}
        logoutLabel="Logout"
        rightSlot={
          <Badge
            variant="outline"
            className="hidden md:flex gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
          >
            <Database className="h-3 w-3" />
            {health?.details?.database?.status || 'checking...'}
          </Badge>
        }
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatsCard
            icon={Store}
            iconBgClass="from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10"
            iconColorClass="text-blue-600 dark:text-blue-400"
            label="Merchants"
            value={merchantsPagination.total}
          />
          <StatsCard
            icon={TrendingUp}
            iconBgClass="from-emerald-500/20 to-green-500/20 dark:from-emerald-500/10 dark:to-green-500/10"
            iconColorClass="text-emerald-600 dark:text-emerald-400"
            label="Transactions"
            value={transactionsPagination.total}
          />
          <StatsCard
            icon={Users}
            iconBgClass="from-purple-500/20 to-violet-500/20 dark:from-purple-500/10 dark:to-violet-500/10"
            iconColorClass="text-purple-600 dark:text-purple-400"
            label="Admin Users"
            value={adminsPagination.total}
          />
        </div>

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-800/50 p-1 rounded-xl">
            <TabsTrigger
              value="merchants"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-6"
            >
              <Store className="w-4 h-4 mr-2" />
              Merchants
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-6"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white rounded-lg px-6"
            >
              <Users className="w-4 h-4 mr-2" />
              Admin Users
            </TabsTrigger>
          </TabsList>

          {/* Merchants Tab */}
          <TabsContent value="merchants" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  Merchants ({merchantsPagination.total} total)
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
                    Create Merchant
                  </Button>
                </div>
              </div>
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Fantasy Name</TableHead>
                        <TableHead>Legal Name</TableHead>
                        <TableHead>Tax ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Methods</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedMerchant(m)}
                                  title="View details"
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditMerchant(m)}
                                  title="Edit merchant"
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => setCreateTxMerchant(m)}
                                  title="Create transaction"
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
                                      <AlertDialogTitle>Delete Merchant</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{m.profile?.fantasy_name}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteMerchant(m._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                      >
                                        Delete
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
                          <TableCell colSpan={6} className="text-center text-zinc-500 py-8">
                            No merchants found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    pagination={merchantsPagination}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 shadow-lg shadow-zinc-900/5 overflow-hidden">
              <div className="p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-white">
                  Transactions ({transactionsPagination.total} total)
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadData()}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((t) => {
                        const statusCfg = getStatusConfig(t.status);
                        return (
                          <TableRow key={t._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                            <TableCell className="font-mono text-xs">
                              {t._id?.slice(-8)}
                            </TableCell>
                            <TableCell className="font-semibold text-zinc-900 dark:text-white">
                              {t.financials?.amount_gross?.$numberDecimal || t.financials?.amount_gross?.toLocaleString() || t.financials?.amount_gross}
                            </TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{t.financials?.currency}</TableCell>
                            <TableCell>
                              <Badge variant={statusCfg.variant} className={statusCfg.className}>
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {getPaymentMethodLabel(t.payment_method)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-500 dark:text-zinc-400 text-sm">
                              {new Date(t.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedTransaction(t)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {t.status === 'PENDING' && (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleTransactionAction(t._id, 'capture')}
                                      className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white text-xs"
                                    >
                                      Capture
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTransactionAction(t._id, 'void')}
                                      className="h-8 text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/50 text-xs"
                                    >
                                      Void
                                    </Button>
                                  </>
                                )}
                                {t.status === 'APPROVED' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTransactionAction(t._id, 'refund')}
                                    className="h-8 text-purple-500 border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-950/50 text-xs"
                                  >
                                    Refund
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
                            No transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    pagination={transactionsPagination}
                    onPageChange={handlePageChange}
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
                  Admin Users ({adminsPagination.total} total)
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
                    Create Admin
                  </Button>
                </div>
              </div>
              {loading ? (
                <TableSkeleton />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditAdmin(a)}
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
                                      <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{a.full_name || a.email}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteAdmin(a._id)}
                                        className="bg-red-500 hover:bg-red-600 text-white"
                                      >
                                        Delete
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
                            No admin users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <PaginationControls
                    pagination={adminsPagination}
                    onPageChange={handlePageChange}
                  />
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <DashboardFooter text={`\u00A9 ${new Date().getFullYear()} TX Pay Admin Panel. All rights reserved.`} />

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
    </div>
  );
}
