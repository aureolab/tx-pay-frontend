import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { merchantsApi, transactionsApi, adminUsersApi, healthApi, type PaginatedResponse } from '../api/client';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { AlertCircle, ChevronLeft, ChevronRight, Database, LogOut } from 'lucide-react';

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

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function PaginationControls({
  pagination,
  onPageChange,
}: {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-4 mt-4 p-4 bg-card rounded-lg border">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.page - 1)}
        disabled={!pagination.hasPrevPage}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(pagination.page + 1)}
        disabled={!pagination.hasNextPage}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'ACTIVE':
    case 'APPROVED':
      return 'default';
    case 'PENDING':
    case 'CREATED':
      return 'secondary';
    case 'EXPIRED':
    case 'INACTIVE':
      return 'outline';
    default:
      return 'destructive';
  }
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<string>('merchants');
  const [merchants, setMerchants] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [merchantsPagination, setMerchantsPagination] = useState<PaginationState>(defaultPagination);
  const [transactionsPagination, setTransactionsPagination] = useState<PaginationState>(defaultPagination);
  const [adminsPagination, setAdminsPagination] = useState<PaginationState>(defaultPagination);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Tx Pay Admin</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.full_name || user?.email}
            </span>
            <Badge variant="outline" className="gap-1">
              <Database className="h-3 w-3" />
              {health?.details?.database?.status || 'checking...'}
            </Badge>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="merchants">Merchants</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="admins">Admin Users</TabsTrigger>
          </TabsList>

          {/* Merchants Tab */}
          <TabsContent value="merchants" className="space-y-4">
            <h2 className="text-lg font-semibold">
              Merchants ({merchantsPagination.total} total)
            </h2>
            {loading ? (
              <TableSkeleton />
            ) : (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Legal Name</TableHead>
                        <TableHead>Tax ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Methods</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {merchants.map((m) => (
                        <TableRow key={m._id}>
                          <TableCell className="font-medium">
                            {m.profile?.fantasy_name}
                          </TableCell>
                          <TableCell>{m.profile?.legal_name}</TableCell>
                          <TableCell>{m.profile?.tax_id}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(m.status)}>
                              {m.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {m.enabled_payment_methods?.join(', ')}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Merchant</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this merchant? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteMerchant(m._id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                      {merchants.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No merchants found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  pagination={merchantsPagination}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <h2 className="text-lg font-semibold">
              Transactions ({transactionsPagination.total} total)
            </h2>
            {loading ? (
              <TableSkeleton />
            ) : (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((t) => (
                        <TableRow key={t._id}>
                          <TableCell className="font-mono text-xs">
                            {t._id?.slice(-8)}
                          </TableCell>
                          <TableCell>
                            {t.financials?.amount_gross?.toLocaleString()}
                          </TableCell>
                          <TableCell>{t.financials?.currency}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(t.status)}>
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{t.payment_method}</TableCell>
                          <TableCell>
                            {new Date(t.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {t.status === 'PENDING' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleTransactionAction(t._id, 'capture')}
                                  >
                                    Capture
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTransactionAction(t._id, 'void')}
                                  >
                                    Void
                                  </Button>
                                </>
                              )}
                              {t.status === 'APPROVED' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleTransactionAction(t._id, 'refund')}
                                >
                                  Refund
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  pagination={transactionsPagination}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </TabsContent>

          {/* Admin Users Tab */}
          <TabsContent value="admins" className="space-y-4">
            <h2 className="text-lg font-semibold">
              Admin Users ({adminsPagination.total} total)
            </h2>
            {loading ? (
              <TableSkeleton />
            ) : (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Roles</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((a) => (
                        <TableRow key={a._id}>
                          <TableCell className="font-medium">
                            {a.full_name}
                          </TableCell>
                          <TableCell>{a.email}</TableCell>
                          <TableCell>{a.roles?.join(', ')}</TableCell>
                          <TableCell>
                            <Badge variant={a.active ? 'default' : 'destructive'}>
                              {a.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {admins.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No admin users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <PaginationControls
                  pagination={adminsPagination}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
