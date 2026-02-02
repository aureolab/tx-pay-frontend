import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { merchantsApi, transactionsApi, adminUsersApi, healthApi, type PaginatedResponse } from '../api/client';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  LogOut,
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  CreditCard,
  ShieldCheck,
  Store,
  TrendingUp,
  Users,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

// Enums from backend
const AdminRoles = ['SUPER_ADMIN', 'FINANCE', 'SUPPORT', 'COMPLIANCE'] as const;
const MerchantStatuses = ['ACTIVE', 'BLOCKED', 'REVIEW', 'INACTIVE'] as const;
const PaymentMethods = ['CREDIT', 'DEBIT', 'PREPAID', 'QR', 'PAYMENT_LINK', 'VITA_WALLET', 'WEBPAY'] as const;

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

// Status badge with semantic colors
function getStatusConfig(status: string): {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
  label: string;
} {
  const configs: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string; label: string }> = {
    APPROVED: { variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Approved' },
    CAPTURED: { variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Captured' },
    PENDING: { variant: 'secondary', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'Pending' },
    CREATED: { variant: 'secondary', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', label: 'Created' },
    EXPIRED: { variant: 'destructive', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20', label: 'Expired' },
    REJECTED: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', label: 'Rejected' },
    VOIDED: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', label: 'Voided' },
    REFUNDED: { variant: 'outline', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', label: 'Refunded' },
    ACTIVE: { variant: 'default', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', label: 'Active' },
    BLOCKED: { variant: 'destructive', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', label: 'Blocked' },
    REVIEW: { variant: 'secondary', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', label: 'Review' },
    INACTIVE: { variant: 'outline', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20', label: 'Inactive' },
  };
  return configs[status] || { variant: 'outline', className: '', label: status };
}

// Payment method labels
const paymentMethodLabels: Record<string, string> = {
  PAYMENT_LINK: 'Payment Link',
  QR: 'QR Code',
  CREDIT: 'Credit',
  DEBIT: 'Debit',
  PREPAID: 'Prepaid',
  VITA_WALLET: 'Vita Wallet',
  WEBPAY: 'Webpay',
};

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
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
    <div className="flex items-center justify-between px-4 py-4 border-t border-zinc-200/50 dark:border-zinc-800/50">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
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
          Page {pagination.page} of {pagination.totalPages}
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
}

// ==================== ADMIN USER DIALOGS ====================

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: any;
}

function AdminUserDialog({ open, onOpenChange, onSuccess, item }: AdminDialogProps) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    roles: [] as string[],
    active: true,
  });

  useEffect(() => {
    if (item) {
      setFormData({
        email: item.email || '',
        password: '',
        full_name: item.full_name || '',
        roles: item.roles || [],
        active: item.active ?? true,
      });
    } else {
      setFormData({ email: '', password: '', full_name: '', roles: [], active: true });
    }
    setError('');
  }, [item, open]);

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        full_name: formData.full_name,
        roles: formData.roles,
        active: formData.active,
      };

      if (!isEdit) {
        payload.email = formData.email;
        payload.password = formData.password;
      } else if (formData.password) {
        payload.password = formData.password;
      }

      if (isEdit) {
        await adminUsersApi.update(item._id, payload);
      } else {
        await adminUsersApi.create(payload);
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} admin user`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            {isEdit ? 'Edit Admin User' : 'Create Admin User'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update administrator information.' : 'Add a new administrator to the system.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="admin-name">Full Name *</Label>
            <Input
              id="admin-name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
              required
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email *</Label>
            <Input
              id="admin-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="admin@example.com"
              required={!isEdit}
              disabled={isEdit}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">
              Password {isEdit ? '(leave blank to keep current)' : '*'}
            </Label>
            <Input
              id="admin-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!isEdit}
              minLength={6}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-2">
              {AdminRoles.map(role => (
                <Badge
                  key={role}
                  variant={formData.roles.includes(role) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    formData.roles.includes(role)
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  onClick={() => handleRoleToggle(role)}
                >
                  {role}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="admin-active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="admin-active">Active</Label>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (isEdit ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AdminDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Admin User Details
          </DialogTitle>
          <DialogDescription>
            Information for {item.full_name || item.email}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Full Name</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.full_name || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Email</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.email}</p>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Status</Label>
              <div className="mt-1">
                <Badge variant={getStatusConfig(item.active ? 'ACTIVE' : 'INACTIVE').variant} className={getStatusConfig(item.active ? 'ACTIVE' : 'INACTIVE').className}>
                  {item.active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Roles</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.roles?.length > 0 ? item.roles.map((role: string) => (
                  <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                )) : <span className="text-zinc-500">No roles</span>}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">User ID</Label>
            <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg mt-1">{item._id}</p>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Created At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Updated At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MERCHANT DIALOGS ====================

interface MerchantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: any;
}

interface PricingRule {
  method: string;
  fixed: string;
  percentage: string;
}

interface AcquirerConfig {
  provider: string;
  config: string;
}

function MerchantDialog({ open, onOpenChange, onSuccess, item }: MerchantDialogProps) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    parent_client_id: '',
    fantasy_name: '',
    legal_name: '',
    tax_id: '',
    mcc: '',
    contact_email: '',
    status: 'REVIEW' as string,
    enabled_payment_methods: [] as string[],
  });
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [acquirerConfigs, setAcquirerConfigs] = useState<AcquirerConfig[]>([]);

  useEffect(() => {
    if (item) {
      setFormData({
        parent_client_id: item.parent_client_id || '',
        fantasy_name: item.profile?.fantasy_name || '',
        legal_name: item.profile?.legal_name || '',
        tax_id: item.profile?.tax_id || '',
        mcc: item.profile?.mcc || '',
        contact_email: item.profile?.contact_email || '',
        status: item.status || 'REVIEW',
        enabled_payment_methods: item.enabled_payment_methods || [],
      });
      if (item.pricing_rules?.fees?.length > 0) {
        setPricingRules(item.pricing_rules.fees.map((f: any) => ({
          method: f.method || '',
          fixed: f.fixed?.$numberDecimal || String(f.fixed || 0),
          percentage: f.percentage?.$numberDecimal || String(f.percentage || 0),
        })));
      } else {
        setPricingRules([]);
      }
      if (item.acquirer_configs?.length > 0) {
        setAcquirerConfigs(item.acquirer_configs.map((c: any) => ({
          provider: c.provider || '',
          config: JSON.stringify(c.config || {}, null, 2),
        })));
      } else {
        setAcquirerConfigs([]);
      }
    } else {
      setFormData({
        parent_client_id: '',
        fantasy_name: '',
        legal_name: '',
        tax_id: '',
        mcc: '',
        contact_email: '',
        status: 'REVIEW',
        enabled_payment_methods: [],
      });
      setPricingRules([]);
      setAcquirerConfigs([]);
    }
    setError('');
  }, [item, open]);

  const handlePaymentMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      enabled_payment_methods: prev.enabled_payment_methods.includes(method)
        ? prev.enabled_payment_methods.filter(m => m !== method)
        : [...prev.enabled_payment_methods, method]
    }));
  };

  const addPricingRule = () => {
    setPricingRules(prev => [...prev, { method: '', fixed: '0', percentage: '0' }]);
  };

  const removePricingRule = (index: number) => {
    setPricingRules(prev => prev.filter((_, i) => i !== index));
  };

  const updatePricingRule = (index: number, field: keyof PricingRule, value: string) => {
    setPricingRules(prev => prev.map((rule, i) =>
      i === index ? { ...rule, [field]: value } : rule
    ));
  };

  const addAcquirerConfig = () => {
    setAcquirerConfigs(prev => [...prev, { provider: '', config: '{}' }]);
  };

  const addVitaWalletConfig = () => {
    setAcquirerConfigs(prev => [...prev, {
      provider: 'VITA_WALLET',
      config: JSON.stringify({
        x_login: '',
        secret_key: '',
        trans_key: ''
      }, null, 2)
    }]);
  };

  const addTbkConfig = () => {
    setAcquirerConfigs(prev => [...prev, {
      provider: 'TBK',
      config: JSON.stringify({
        commerceCode: ''
      }, null, 2)
    }]);
  };

  const removeAcquirerConfig = (index: number) => {
    setAcquirerConfigs(prev => prev.filter((_, i) => i !== index));
  };

  const updateAcquirerConfig = (index: number, field: keyof AcquirerConfig, value: string) => {
    setAcquirerConfigs(prev => prev.map((config, i) =>
      i === index ? { ...config, [field]: value } : config
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const validPricingRules = pricingRules
        .filter(r => r.method)
        .map(r => ({
          method: r.method,
          fixed: parseFloat(r.fixed) || 0,
          percentage: parseFloat(r.percentage) || 0,
        }));

      const validAcquirerConfigs = acquirerConfigs
        .filter(c => c.provider)
        .map(c => {
          let parsedConfig = {};
          try {
            parsedConfig = JSON.parse(c.config);
          } catch {
            parsedConfig = {};
          }
          return {
            provider: c.provider,
            config: parsedConfig,
          };
        });

      const payload: any = {
        profile: {
          fantasy_name: formData.fantasy_name,
          legal_name: formData.legal_name,
          tax_id: formData.tax_id,
          mcc: formData.mcc,
          contact_email: formData.contact_email,
        },
        enabled_payment_methods: formData.enabled_payment_methods,
        pricing_rules: validPricingRules,
        acquirer_configs: validAcquirerConfigs,
      };

      if (!isEdit) {
        payload.parent_client_id = formData.parent_client_id;
      } else {
        payload.status = formData.status;
      }

      if (isEdit) {
        await merchantsApi.update(item._id, payload);
      } else {
        await merchantsApi.create(payload);
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} merchant`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] p-0 gap-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            {isEdit ? 'Edit Merchant' : 'Create Merchant'}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update merchant information.' : 'Add a new merchant to the payment platform.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)]">
        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-4">
          {error && (
            <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="merchant-parent">Parent Client ID *</Label>
              <Input
                id="merchant-parent"
                value={formData.parent_client_id}
                onChange={(e) => setFormData({ ...formData, parent_client_id: e.target.value })}
                placeholder="MongoDB ObjectId"
                required
                className="h-11"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merchant-fantasy">Fantasy Name *</Label>
              <Input
                id="merchant-fantasy"
                value={formData.fantasy_name}
                onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                placeholder="My Store"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant-legal">Legal Name *</Label>
              <Input
                id="merchant-legal"
                value={formData.legal_name}
                onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                placeholder="My Store SpA"
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merchant-tax">Tax ID (RUT) *</Label>
              <Input
                id="merchant-tax"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                placeholder="12.345.678-9"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant-mcc">MCC *</Label>
              <Input
                id="merchant-mcc"
                value={formData.mcc}
                onChange={(e) => setFormData({ ...formData, mcc: e.target.value })}
                placeholder="5411"
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant-email">Contact Email *</Label>
            <Input
              id="merchant-email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              placeholder="contact@store.com"
              required
              className="h-11"
            />
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="merchant-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {MerchantStatuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Enabled Payment Methods</Label>
            <div className="flex flex-wrap gap-2">
              {PaymentMethods.map(method => (
                <Badge
                  key={method}
                  variant={formData.enabled_payment_methods.includes(method) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    formData.enabled_payment_methods.includes(method)
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                  onClick={() => handlePaymentMethodToggle(method)}
                >
                  {paymentMethodLabels[method] || method}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pricing Rules Section */}
          <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <Label>Pricing Rules</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPricingRule} className="gap-1">
                <Plus className="h-3 w-3" />
                Add Rule
              </Button>
            </div>
            {pricingRules.length === 0 ? (
              <p className="text-sm text-zinc-500">No pricing rules configured</p>
            ) : (
              <div className="space-y-2">
                {pricingRules.map((rule, index) => (
                  <div key={index} className="flex gap-2 items-end p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-xs">Method</Label>
                      <Select
                        value={rule.method}
                        onValueChange={(value) => updatePricingRule(index, 'method', value)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {PaymentMethods.map(m => (
                            <SelectItem key={m} value={m}>{paymentMethodLabels[m] || m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">Fixed</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={rule.fixed}
                        onChange={(e) => updatePricingRule(index, 'fixed', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <Label className="text-xs">% Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={rule.percentage}
                        onChange={(e) => updatePricingRule(index, 'percentage', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePricingRule(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acquirer Configs Section */}
          <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <Label>Acquirer Configurations</Label>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={addVitaWalletConfig} className="gap-1">
                  <Plus className="h-3 w-3" />
                  VITA
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addTbkConfig} className="gap-1">
                  <Plus className="h-3 w-3" />
                  TBK
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addAcquirerConfig} className="gap-1">
                  <Plus className="h-3 w-3" />
                  Other
                </Button>
              </div>
            </div>
            {acquirerConfigs.length === 0 ? (
              <p className="text-sm text-zinc-500">No acquirer configurations</p>
            ) : (
              <div className="space-y-2">
                {acquirerConfigs.map((config, index) => (
                  <div key={index} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-2">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Label className="text-xs">Provider</Label>
                        <Input
                          value={config.provider}
                          onChange={(e) => updateAcquirerConfig(index, 'provider', e.target.value)}
                          placeholder="e.g., transbank, vita"
                          className="h-8 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAcquirerConfig(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 mt-4"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div>
                      <Label className="text-xs">Config (JSON)</Label>
                      <textarea
                        value={config.config}
                        onChange={(e) => updateAcquirerConfig(index, 'config', e.target.value)}
                        placeholder='{"key": "value"}'
                        className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono min-h-[60px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (isEdit ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function MerchantDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [showSecret, setShowSecret] = useState(false);
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [loadingSecret, setLoadingSecret] = useState(false);
  const [visibleSensitiveFields, setVisibleSensitiveFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setShowSecret(false);
      setSecretKey(null);
      setVisibleSensitiveFields(new Set());
    }
  }, [open, item?._id]);

  const toggleSensitiveField = (fieldKey: string) => {
    setVisibleSensitiveFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
      } else {
        newSet.add(fieldKey);
      }
      return newSet;
    });
  };

  const handleToggleSecret = async () => {
    if (showSecret) {
      setShowSecret(false);
      return;
    }

    if (secretKey) {
      setShowSecret(true);
      return;
    }

    setLoadingSecret(true);
    try {
      const res = await merchantsApi.getSecret(item._id);
      setSecretKey(res.data);
      setShowSecret(true);
    } catch (err) {
      console.error('Failed to fetch secret:', err);
    } finally {
      setLoadingSecret(false);
    }
  };

  if (!item) return null;
  const statusConfig = getStatusConfig(item.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            Merchant Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {item.profile?.fantasy_name}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)] px-6 pb-6">
        <div className="grid gap-4 pt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Fantasy Name</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.fantasy_name || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Legal Name</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.legal_name || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Tax ID</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.tax_id || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">MCC</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.mcc || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Contact Email</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{item.profile?.contact_email || '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Status</Label>
              <div className="mt-1">
                <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>
              </div>
            </div>
          </div>

          {/* IDs */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">IDs</Label>
            <div className="grid gap-2 mt-2">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Merchant ID</Label>
                <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">{item._id}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Parent Client ID</Label>
                <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">{item.parent_client_id || '-'}</p>
              </div>
            </div>
          </div>

          {/* Integration Keys */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">API Integration</Label>
            <div className="grid gap-2 mt-2">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Public Key</Label>
                <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all">{item.integration?.public_key || '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Secret Key</Label>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all flex-1">
                    {showSecret && secretKey ? secretKey : '••••••••••••••••••••••••'}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleSecret}
                    disabled={loadingSecret}
                    className="shrink-0"
                  >
                    {loadingSecret ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : showSecret ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Enabled Payment Methods</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {item.enabled_payment_methods?.length > 0 ? item.enabled_payment_methods.map((method: string) => (
                <Badge key={method} variant="outline" className="text-xs">{paymentMethodLabels[method] || method}</Badge>
              )) : <span className="text-zinc-500">None</span>}
            </div>
          </div>

          {/* Bank Accounts */}
          {item.bank_accounts?.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Bank Accounts</Label>
              <div className="space-y-2 mt-2">
                {item.bank_accounts.map((account: any, idx: number) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm">
                    <p><span className="text-zinc-500">Bank:</span> {account.bank_name}</p>
                    <p><span className="text-zinc-500">Type:</span> {account.account_type}</p>
                    <p><span className="text-zinc-500">Currency:</span> {account.currency}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Rules */}
          {item.pricing_rules?.fees?.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Pricing Rules</Label>
              <div className="space-y-2 mt-2">
                {item.pricing_rules.fees.map((fee: any, idx: number) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm">
                    <p><span className="text-zinc-500">Method:</span> {paymentMethodLabels[fee.method] || fee.method}</p>
                    <p><span className="text-zinc-500">Fixed:</span> {fee.fixed?.$numberDecimal || fee.fixed || 0}</p>
                    <p><span className="text-zinc-500">Percentage:</span> {fee.percentage?.$numberDecimal || fee.percentage || 0}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acquirer Configs */}
          {item.acquirer_configs?.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Acquirer Configurations</Label>
              <div className="space-y-3 mt-2">
                {item.acquirer_configs.map((config: any, idx: number) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm space-y-2">
                    <p className="font-medium text-zinc-900 dark:text-white">{config.provider}</p>
                    {config.config && Object.keys(config.config).length > 0 && (
                      <div className="grid gap-1 pl-3 border-l-2 border-blue-500/30">
                        {Object.entries(config.config).map(([key, value]) => {
                          const isSensitive = /secret|key|password|token/i.test(key);
                          const fieldKey = `${idx}-${key}`;
                          const isVisible = visibleSensitiveFields.has(fieldKey);
                          const displayValue = isSensitive && !isVisible
                            ? '••••••••••••'
                            : String(value);
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-zinc-500 shrink-0">{key}:</span>
                              <span className="font-mono break-all flex-1">{displayValue}</span>
                              {isSensitive && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSensitiveField(fieldKey)}
                                  className="shrink-0 h-6 w-6 p-0"
                                >
                                  {isVisible ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Settings</Label>
            <p className="text-sm mt-1 text-zinc-700 dark:text-zinc-300">Payment Link Timeout: {item.payment_link_timeout_minutes || 15} minutes</p>
          </div>

          {/* Timestamps */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Created At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Updated At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ==================== CREATE TRANSACTION DIALOG ====================

interface CreateTransactionDialogProps {
  merchant: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateTransactionDialog({ merchant, open, onOpenChange, onSuccess }: CreateTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'CLP',
    payment_method: 'PAYMENT_LINK' as string,
    callback_url: '',
  });

  useEffect(() => {
    if (open) {
      setFormData({
        amount: '',
        currency: 'CLP',
        payment_method: 'PAYMENT_LINK',
        callback_url: '',
      });
      setError('');
      setResult(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const payload = {
        user_context: {
          is_guest: true,
        },
        financials: {
          amount_gross: parseFloat(formData.amount),
          currency: formData.currency,
        },
        payment_method: formData.payment_method,
        callback_url: formData.callback_url || undefined,
      };

      const res = await transactionsApi.create(payload, merchant._id);
      setResult(res.data);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const checkoutUrl = result?.gateway_result?.checkout_url
    || result?.gateway_result?.authorization_payload_result?.started_transaction?.redirect_endpoint;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const resultStatusConfig = result ? getStatusConfig(result.status) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            Create Transaction
          </DialogTitle>
          <DialogDescription>
            Create a payment link or QR for{' '}
            <span className="font-medium text-zinc-900 dark:text-white">{merchant?.profile?.fantasy_name}</span>
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <div className="text-center py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                Transaction Created
              </h3>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Transaction ID</p>
              <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">{result._id}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Status</p>
              <Badge variant={resultStatusConfig?.variant} className={resultStatusConfig?.className}>
                {resultStatusConfig?.label}
              </Badge>
            </div>

            {checkoutUrl && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Payment Link</p>
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
                    onClick={() => copyToClipboard(checkoutUrl)}
                  >
                    Copy
                  </Button>
                </div>
                <Button
                  type="button"
                  className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                  onClick={() => window.open(checkoutUrl, '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Payment Page
                </Button>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tx-amount">Amount *</Label>
                <Input
                  id="tx-amount"
                  type="number"
                  step="1"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="10000"
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">CLP</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-method">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {merchant?.enabled_payment_methods?.length > 0
                    ? merchant.enabled_payment_methods.map((method: string) => (
                        <SelectItem key={method} value={method}>
                          {paymentMethodLabels[method] || method}
                        </SelectItem>
                      ))
                    : <>
                        <SelectItem value="PAYMENT_LINK">Payment Link</SelectItem>
                        <SelectItem value="QR">QR Code</SelectItem>
                        <SelectItem value="WEBPAY">Webpay</SelectItem>
                        <SelectItem value="VITA_WALLET">Vita Wallet</SelectItem>
                      </>
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-callback">Callback URL (optional)</Label>
              <Input
                id="tx-callback"
                type="url"
                value={formData.callback_url}
                onChange={(e) => setFormData({ ...formData, callback_url: e.target.value })}
                placeholder="https://your-site.com/callback"
                className="h-11"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  'Create Transaction'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== TRANSACTION DETAIL DIALOG ====================

function TransactionDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!item) return null;
  const statusConfig = getStatusConfig(item.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            Transaction Details
          </DialogTitle>
          <DialogDescription>
            Transaction ID: {item._id}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-100px)] px-6 pb-6">
        <div className="grid gap-4 pt-4">
          {/* Status & Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Status</Label>
              <div className="mt-1">
                <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>
              </div>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Payment Method</Label>
              <p className="font-medium text-zinc-900 dark:text-white">{paymentMethodLabels[item.payment_method] || item.payment_method || '-'}</p>
            </div>
          </div>

          {/* Financials */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Financial Details</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Gross Amount</Label>
                <p className="font-semibold text-lg text-zinc-900 dark:text-white">
                  {item.financials?.currency} {
                    item.financials?.amount_gross?.$numberDecimal ||
                    item.financials?.amount_gross?.toLocaleString() ||
                    item.financials?.amount_gross
                  }
                </p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Net Amount</Label>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {item.financials?.currency} {
                    item.financials?.amount_net?.$numberDecimal ||
                    item.financials?.amount_net?.toLocaleString() ||
                    item.financials?.amount_net || '-'
                  }
                </p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Currency</Label>
                <p className="font-medium text-zinc-900 dark:text-white">{item.financials?.currency || '-'}</p>
              </div>
            </div>
            {item.financials?.fee_snapshot && (
              <div className="mt-2 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg text-sm">
                <p><span className="text-zinc-500">Fee Fixed:</span> {item.financials.fee_snapshot.fixed?.$numberDecimal || item.financials.fee_snapshot.fixed || 0}</p>
                <p><span className="text-zinc-500">Fee Percentage:</span> {item.financials.fee_snapshot.percentage?.$numberDecimal || item.financials.fee_snapshot.percentage || 0}%</p>
              </div>
            )}
          </div>

          {/* IDs */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">References</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="min-w-0">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Merchant ID</Label>
                <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all">{item.merchant_id || '-'}</p>
              </div>
              {item.terminal_id && (
                <div className="min-w-0">
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Terminal ID</Label>
                  <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all">{item.terminal_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* User Context */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <Label className="text-zinc-500 dark:text-zinc-400 text-xs">User Context</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Is Guest</Label>
                <p className="font-medium text-zinc-900 dark:text-white">{item.user_context?.is_guest ? 'Yes' : 'No'}</p>
              </div>
              {item.user_context?.psp_user_id && (
                <div className="min-w-0">
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">PSP User ID</Label>
                  <p className="font-mono text-sm break-all">{item.user_context.psp_user_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Callback URL */}
          {item.callback_url && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Callback URL</Label>
              <p className="font-mono text-sm bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg break-all mt-1">{item.callback_url}</p>
            </div>
          )}

          {/* Gateway Result */}
          {item.gateway_result && Object.keys(item.gateway_result).length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Gateway Result</Label>
              <ScrollArea className="mt-2 h-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                <pre className="p-3 text-xs whitespace-pre-wrap break-all">
                  {JSON.stringify(item.gateway_result, null, 2)}
                </pre>
              </ScrollArea>
            </div>
          )}

          {/* Expires At */}
          {item.expires_at && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Expires At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{new Date(item.expires_at).toLocaleString()}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Created At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">Updated At</Label>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ==================== MAIN DASHBOARD ====================

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
      <header className="relative z-10 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-zinc-900 dark:text-white">TX Pay</span>
                <span className="hidden sm:inline text-lg text-zinc-400 dark:text-zinc-500 ml-1">Admin</span>
              </div>
            </div>

            {/* User info & actions */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-zinc-900 dark:text-white">
                  {user?.full_name || user?.email}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {user?.email}
                </span>
              </div>
              <Badge
                variant="outline"
                className="hidden md:flex gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              >
                <Database className="h-3 w-3" />
                {health?.details?.database?.status || 'checking...'}
              </Badge>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="gap-2 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

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
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg shadow-zinc-900/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-500/10 dark:to-indigo-500/10 flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Merchants</p>
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
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Transactions</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{transactionsPagination.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-200/50 dark:border-zinc-800/50 p-6 shadow-lg shadow-zinc-900/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 dark:from-purple-500/10 dark:to-violet-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Admin Users</p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white">{adminsPagination.total}</p>
              </div>
            </div>
          </div>
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
                        const statusConfig = getStatusConfig(m.status);
                        return (
                          <TableRow key={m._id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                            <TableCell className="font-medium text-zinc-900 dark:text-white">
                              {m.profile?.fantasy_name}
                            </TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{m.profile?.legal_name}</TableCell>
                            <TableCell className="text-zinc-600 dark:text-zinc-400">{m.profile?.tax_id}</TableCell>
                            <TableCell>
                              <Badge variant={statusConfig.variant} className={statusConfig.className}>
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {m.enabled_payment_methods?.slice(0, 2).map((method: string) => (
                                  <Badge key={method} variant="outline" className="text-xs">{paymentMethodLabels[method] || method}</Badge>
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
                        const statusConfig = getStatusConfig(t.status);
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
                              <Badge variant={statusConfig.variant} className={statusConfig.className}>
                                {statusConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {paymentMethodLabels[t.payment_method] || t.payment_method}
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
                        const statusConfig = getStatusConfig(a.active ? 'ACTIVE' : 'INACTIVE');
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
                              <Badge variant={statusConfig.variant} className={statusConfig.className}>
                                {statusConfig.label}
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
      <footer className="relative z-10 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            © {new Date().getFullYear()} TX Pay Admin Panel. All rights reserved.
          </p>
        </div>
      </footer>

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
