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
import { ThemeToggle } from '@/components/theme-toggle';
import { AlertCircle, ChevronLeft, ChevronRight, Database, LogOut, Plus, Eye, Pencil, Trash2, CreditCard } from 'lucide-react';

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
    case 'REVIEW':
      return 'secondary';
    case 'EXPIRED':
    case 'INACTIVE':
      return 'outline';
    default:
      return 'destructive';
  }
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Admin User' : 'Create Admin User'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update administrator information.' : 'Add a new administrator to the system.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
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
            />
          </div>
          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="flex flex-wrap gap-2">
              {AdminRoles.map(role => (
                <Badge
                  key={role}
                  variant={formData.roles.includes(role) ? 'default' : 'outline'}
                  className="cursor-pointer"
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Admin User Details</DialogTitle>
          <DialogDescription>
            Information for {item.full_name || item.email}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Full Name</Label>
              <p className="font-medium">{item.full_name || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="font-medium">{item.email}</p>
            </div>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Badge variant={item.active ? 'default' : 'destructive'}>
                {item.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Roles</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {item.roles?.length > 0 ? item.roles.map((role: string) => (
                  <Badge key={role} variant="outline">{role}</Badge>
                )) : <span className="text-muted-foreground">No roles</span>}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-muted-foreground text-xs">User ID</Label>
            <p className="font-mono text-sm bg-muted p-2 rounded mt-1">{item._id}</p>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Created At</Label>
              <p className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Updated At</Label>
              <p className="text-sm">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
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
      // Load existing pricing rules
      if (item.pricing_rules?.fees?.length > 0) {
        setPricingRules(item.pricing_rules.fees.map((f: any) => ({
          method: f.method || '',
          fixed: f.fixed?.$numberDecimal || String(f.fixed || 0),
          percentage: f.percentage?.$numberDecimal || String(f.percentage || 0),
        })));
      } else {
        setPricingRules([]);
      }
      // Load existing acquirer configs
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

  // Pricing Rules handlers
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

  // Acquirer Configs handlers
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
      // Build pricing rules payload
      const validPricingRules = pricingRules
        .filter(r => r.method)
        .map(r => ({
          method: r.method,
          fixed: parseFloat(r.fixed) || 0,
          percentage: parseFloat(r.percentage) || 0,
        }));

      // Build acquirer configs payload
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Merchant' : 'Create Merchant'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update merchant information.' : 'Add a new merchant to the payment platform.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
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
            />
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label htmlFor="merchant-status">Status</Label>
              <select
                id="merchant-status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {MerchantStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Enabled Payment Methods</Label>
            <div className="flex flex-wrap gap-2">
              {PaymentMethods.map(method => (
                <Badge
                  key={method}
                  variant={formData.enabled_payment_methods.includes(method) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handlePaymentMethodToggle(method)}
                >
                  {method}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pricing Rules Section */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Pricing Rules</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPricingRule}>
                <Plus className="h-3 w-3 mr-1" />
                Add Rule
              </Button>
            </div>
            {pricingRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pricing rules configured</p>
            ) : (
              <div className="space-y-2">
                {pricingRules.map((rule, index) => (
                  <div key={index} className="flex gap-2 items-end p-2 bg-muted rounded">
                    <div className="flex-1">
                      <Label className="text-xs">Method</Label>
                      <select
                        value={rule.method}
                        onChange={(e) => updatePricingRule(index, 'method', e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                      >
                        <option value="">Select...</option>
                        {PaymentMethods.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
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
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acquirer Configs Section */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label>Acquirer Configurations</Label>
              <div className="flex gap-1">
                <Button type="button" variant="outline" size="sm" onClick={addVitaWalletConfig}>
                  <Plus className="h-3 w-3 mr-1" />
                  VITA
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addTbkConfig}>
                  <Plus className="h-3 w-3 mr-1" />
                  TBK
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={addAcquirerConfig}>
                  <Plus className="h-3 w-3 mr-1" />
                  Other
                </Button>
              </div>
            </div>
            {acquirerConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No acquirer configurations</p>
            ) : (
              <div className="space-y-2">
                {acquirerConfigs.map((config, index) => (
                  <div key={index} className="p-2 bg-muted rounded space-y-2">
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
                        className="h-8 w-8 p-0 text-destructive mt-4"
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
                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-mono min-h-[60px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MerchantDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Merchant Details</DialogTitle>
          <DialogDescription>
            Complete information for {item.profile?.fantasy_name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Fantasy Name</Label>
              <p className="font-medium">{item.profile?.fantasy_name || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Legal Name</Label>
              <p className="font-medium">{item.profile?.legal_name || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Tax ID</Label>
              <p className="font-medium">{item.profile?.tax_id || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">MCC</Label>
              <p className="font-medium">{item.profile?.mcc || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Contact Email</Label>
              <p className="font-medium">{item.profile?.contact_email || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
            </div>
          </div>

          {/* IDs */}
          <div className="border-t pt-4">
            <Label className="text-muted-foreground text-xs">IDs</Label>
            <div className="grid gap-2 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Merchant ID</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded">{item._id}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Parent Client ID</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded">{item.parent_client_id || '-'}</p>
              </div>
            </div>
          </div>

          {/* Integration Keys */}
          <div className="border-t pt-4">
            <Label className="text-muted-foreground text-xs">API Integration</Label>
            <div className="grid gap-2 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Public Key</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded break-all">{item.integration?.public_key || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Secret Key</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded break-all">{item.integration?.secret || '••••••••'}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="border-t pt-4">
            <Label className="text-muted-foreground text-xs">Enabled Payment Methods</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {item.enabled_payment_methods?.length > 0 ? item.enabled_payment_methods.map((method: string) => (
                <Badge key={method} variant="outline">{method}</Badge>
              )) : <span className="text-muted-foreground">None</span>}
            </div>
          </div>

          {/* Bank Accounts */}
          {item.bank_accounts?.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground text-xs">Bank Accounts</Label>
              <div className="space-y-2 mt-2">
                {item.bank_accounts.map((account: any, idx: number) => (
                  <div key={idx} className="bg-muted p-2 rounded text-sm">
                    <p><span className="text-muted-foreground">Bank:</span> {account.bank_name}</p>
                    <p><span className="text-muted-foreground">Type:</span> {account.account_type}</p>
                    <p><span className="text-muted-foreground">Currency:</span> {account.currency}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Rules */}
          {item.pricing_rules?.fees?.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground text-xs">Pricing Rules</Label>
              <div className="space-y-2 mt-2">
                {item.pricing_rules.fees.map((fee: any, idx: number) => (
                  <div key={idx} className="bg-muted p-2 rounded text-sm">
                    <p><span className="text-muted-foreground">Method:</span> {fee.method}</p>
                    <p><span className="text-muted-foreground">Fixed:</span> {fee.fixed?.$numberDecimal || fee.fixed || 0}</p>
                    <p><span className="text-muted-foreground">Percentage:</span> {fee.percentage?.$numberDecimal || fee.percentage || 0}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acquirer Configs */}
          {item.acquirer_configs?.length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground text-xs">Acquirer Configurations</Label>
              <div className="space-y-2 mt-2">
                {item.acquirer_configs.map((config: any, idx: number) => (
                  <div key={idx} className="bg-muted p-2 rounded text-sm">
                    <p><span className="text-muted-foreground">Provider:</span> {config.provider}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="border-t pt-4">
            <Label className="text-muted-foreground text-xs">Settings</Label>
            <p className="text-sm mt-1">Payment Link Timeout: {item.payment_link_timeout_minutes || 15} minutes</p>
          </div>

          {/* Timestamps */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Created At</Label>
              <p className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Updated At</Label>
              <p className="text-sm">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
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

      // Pass merchant._id as header for admin users
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>
            Create a payment link or QR for {merchant?.profile?.fantasy_name}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Transaction created successfully!</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Transaction ID</Label>
              <p className="font-mono text-sm bg-muted p-2 rounded">{result._id}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Badge variant={getStatusVariant(result.status)}>{result.status}</Badge>
            </div>

            {checkoutUrl && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs">Payment Link</Label>
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
                  variant="default"
                  className="w-full"
                  onClick={() => window.open(checkoutUrl, '_blank')}
                >
                  Open Payment Page
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button type="button" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-currency">Currency</Label>
                <select
                  id="tx-currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="CLP">CLP</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-method">Payment Method *</Label>
              <select
                id="tx-method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="PAYMENT_LINK">Payment Link</option>
                <option value="QR">QR Code</option>
                <option value="WEBPAY">Webpay</option>
                <option value="VITA_WALLET">Vita Wallet</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tx-callback">Callback URL (optional)</Label>
              <Input
                id="tx-callback"
                type="url"
                value={formData.callback_url}
                onChange={(e) => setFormData({ ...formData, callback_url: e.target.value })}
                placeholder="https://your-site.com/callback"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Transaction'}
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Transaction ID: {item._id}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {/* Status & Payment Method */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Status</Label>
              <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Payment Method</Label>
              <p className="font-medium">{item.payment_method || '-'}</p>
            </div>
          </div>

          {/* Financials */}
          <div className="border-t pt-4">
            <Label className="text-muted-foreground text-xs">Financial Details</Label>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Gross Amount</Label>
                <p className="font-medium text-lg">
                  {item.financials?.currency} {
                    item.financials?.amount_gross?.$numberDecimal ||
                    item.financials?.amount_gross?.toLocaleString() ||
                    item.financials?.amount_gross
                  }
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Net Amount</Label>
                <p className="font-medium">
                  {item.financials?.currency} {
                    item.financials?.amount_net?.$numberDecimal ||
                    item.financials?.amount_net?.toLocaleString() ||
                    item.financials?.amount_net || '-'
                  }
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Currency</Label>
                <p className="font-medium">{item.financials?.currency || '-'}</p>
              </div>
            </div>
            {item.financials?.fee_snapshot && (
              <div className="mt-2 bg-muted p-2 rounded text-sm">
                <p><span className="text-muted-foreground">Fee Fixed:</span> {item.financials.fee_snapshot.fixed?.$numberDecimal || item.financials.fee_snapshot.fixed || 0}</p>
                <p><span className="text-muted-foreground">Fee Percentage:</span> {item.financials.fee_snapshot.percentage?.$numberDecimal || item.financials.fee_snapshot.percentage || 0}%</p>
              </div>
            )}
          </div>

          {/* IDs */}
          <div className="border-t pt-4">
            <Label className="text-muted-foreground text-xs">References</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Merchant ID</Label>
                <p className="font-mono text-sm bg-muted p-2 rounded">{item.merchant_id || '-'}</p>
              </div>
              {item.terminal_id && (
                <div>
                  <Label className="text-muted-foreground text-xs">Terminal ID</Label>
                  <p className="font-mono text-sm bg-muted p-2 rounded">{item.terminal_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* User Context */}
          <div className="border-t pt-4">
            <Label className="text-muted-foreground text-xs">User Context</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-muted-foreground text-xs">Is Guest</Label>
                <p className="font-medium">{item.user_context?.is_guest ? 'Yes' : 'No'}</p>
              </div>
              {item.user_context?.psp_user_id && (
                <div>
                  <Label className="text-muted-foreground text-xs">PSP User ID</Label>
                  <p className="font-mono text-sm">{item.user_context.psp_user_id}</p>
                </div>
              )}
            </div>
          </div>

          {/* Callback URL */}
          {item.callback_url && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground text-xs">Callback URL</Label>
              <p className="font-mono text-sm bg-muted p-2 rounded break-all mt-1">{item.callback_url}</p>
            </div>
          )}

          {/* Gateway Result */}
          {item.gateway_result && Object.keys(item.gateway_result).length > 0 && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground text-xs">Gateway Result</Label>
              <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(item.gateway_result, null, 2)}
              </pre>
            </div>
          )}

          {/* Expires At */}
          {item.expires_at && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground text-xs">Expires At</Label>
              <p className="text-sm">{new Date(item.expires_at).toLocaleString()}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Created At</Label>
              <p className="text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Updated At</Label>
              <p className="text-sm">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
            </div>
          </div>
        </div>
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Merchants ({merchantsPagination.total} total)
              </h2>
              <Button onClick={openCreateMerchant}>
                <Plus className="h-4 w-4 mr-2" />
                Create Merchant
              </Button>
            </div>
            {loading ? (
              <TableSkeleton />
            ) : (
              <>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fantasy Name</TableHead>
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
                            <div className="flex flex-wrap gap-1">
                              {m.enabled_payment_methods?.slice(0, 2).map((method: string) => (
                                <Badge key={method} variant="outline" className="text-xs">{method}</Badge>
                              ))}
                              {m.enabled_payment_methods?.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{m.enabled_payment_methods.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedMerchant(m)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditMerchant(m)}
                                title="Edit merchant"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => setCreateTxMerchant(m)}
                                title="Create transaction"
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
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
                                      Are you sure you want to delete "{m.profile?.fantasy_name}"? This action cannot be undone.
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
                            </div>
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
                            {t.financials?.amount_gross?.$numberDecimal || t.financials?.amount_gross?.toLocaleString() || t.financials?.amount_gross}
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTransaction(t)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Admin Users ({adminsPagination.total} total)
              </h2>
              <Button onClick={openCreateAdmin}>
                <Plus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </div>
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {admins.map((a) => (
                        <TableRow key={a._id}>
                          <TableCell className="font-medium">
                            {a.full_name}
                          </TableCell>
                          <TableCell>{a.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {a.roles?.map((role: string) => (
                                <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={a.active ? 'default' : 'destructive'}>
                              {a.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedAdmin(a)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditAdmin(a)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
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
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {admins.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
