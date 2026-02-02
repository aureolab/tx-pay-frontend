import { useState, useEffect } from 'react';
import { merchantsApi, partnersApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Plus, Store, Trash2 } from 'lucide-react';
import { MerchantStatuses, PaymentMethods, getPaymentMethodLabel } from '@/lib/constants';

interface MerchantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: any;
  defaultOwner?: string;
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

export function MerchantDialog({ open, onOpenChange, onSuccess, item, defaultOwner }: MerchantDialogProps) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [partners, setPartners] = useState<any[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [formData, setFormData] = useState({
    owner: '',
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
    if (open && !isEdit && !defaultOwner) {
      setLoadingPartners(true);
      partnersApi.list({ page: 1, limit: 100 })
        .then((res) => setPartners(res.data.data || []))
        .catch(() => setPartners([]))
        .finally(() => setLoadingPartners(false));
    }
  }, [open, isEdit, defaultOwner]);

  useEffect(() => {
    if (item) {
      setFormData({
        owner: item.owner || '',
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
        owner: defaultOwner || '',
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
        payload.owner = formData.owner;
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
              <Label htmlFor="merchant-owner">Owner (Partner) *</Label>
              {defaultOwner ? (
                <Input
                  value={defaultOwner}
                  disabled
                  className="h-11 font-mono text-sm"
                />
              ) : (
                <Select
                  value={formData.owner}
                  onValueChange={(value) => setFormData({ ...formData, owner: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={loadingPartners ? 'Loading partners...' : 'Select a partner'} />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.fantasy_name} — {p.contact_email}
                      </SelectItem>
                    ))}
                    {partners.length === 0 && !loadingPartners && (
                      <SelectItem value="" disabled>No partners found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
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
                  {getPaymentMethodLabel(method)}
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
                            <SelectItem key={m} value={m}>{getPaymentMethodLabel(m)}</SelectItem>
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
