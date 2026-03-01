import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { merchantsApi, partnersApi, systemConfigApi } from '../../api/client';
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
import type { Merchant, Partner, PricingRule as AdminPricingRule, AcquirerConfig as AdminAcquirerConfig, CreateMerchantRequest, UpdateMerchantRequest, ProviderFee } from '@/types/admin.types';
import { getErrorMessage } from '@/types/api-error.types';
import { MerchantStatuses, PaymentMethods, getPaymentMethodLabel } from '@/lib/constants';

interface MerchantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  item?: Merchant | null;
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
  const { t } = useTranslation('admin');
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [partners, setPartners] = useState<Partner[]>([]);
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
    payment_link_timeout_minutes: 15,
  });
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [acquirerConfigs, setAcquirerConfigs] = useState<AcquirerConfig[]>([]);
  const [providerFees, setProviderFees] = useState<ProviderFee[]>([]);

  useEffect(() => {
    if (open) {
      systemConfigApi.get()
        .then((res) => setProviderFees(res.data.provider_fees || []))
        .catch(() => setProviderFees([]));
    }
  }, [open]);

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
        payment_link_timeout_minutes: item.payment_link_timeout_minutes ?? 15,
      });
      if (item.pricing_rules?.fees && item.pricing_rules.fees.length > 0) {
        setPricingRules(item.pricing_rules.fees.map((f: AdminPricingRule) => ({
          method: f.method || '',
          fixed: typeof f.fixed === 'object' && f.fixed !== null && '$numberDecimal' in f.fixed ? f.fixed.$numberDecimal : String(f.fixed || 0),
          percentage: typeof f.percentage === 'object' && f.percentage !== null && '$numberDecimal' in f.percentage ? f.percentage.$numberDecimal : String(f.percentage || 0),
        })));
      } else {
        setPricingRules([]);
      }
      if (item.acquirer_configs && item.acquirer_configs.length > 0) {
        setAcquirerConfigs(item.acquirer_configs.map((c: AdminAcquirerConfig) => ({
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
        payment_link_timeout_minutes: 15,
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

      const payload: Record<string, unknown> = {
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
        payment_link_timeout_minutes: formData.payment_link_timeout_minutes,
      };

      if (!isEdit) {
        payload.owner = formData.owner;
      } else {
        payload.status = formData.status;
      }

      if (isEdit) {
        await merchantsApi.update(item._id, payload as unknown as UpdateMerchantRequest);
      } else {
        await merchantsApi.create(payload as unknown as CreateMerchantRequest);
      }
      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      setError(getErrorMessage(err) || t(isEdit ? 'dialogs.merchant.updateError' : 'dialogs.merchant.createError'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 transition-colors placeholder:text-zinc-400";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 p-0 gap-0 overflow-hidden">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Store className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {isEdit ? t('dialogs.merchant.editTitle') : t('dialogs.merchant.createTitle')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {isEdit ? t('dialogs.merchant.editDescription') : t('dialogs.merchant.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="merchant-owner" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.merchant.owner')} {t('dialogs.common.required')}
                </Label>
                {defaultOwner ? (
                  <Input
                    value={defaultOwner}
                    disabled
                    className="h-10 font-mono text-sm bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg disabled:opacity-60"
                  />
                ) : (
                  <Select
                    value={formData.owner}
                    onValueChange={(value) => setFormData({ ...formData, owner: value })}
                  >
                    <SelectTrigger className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                      <SelectValue placeholder={loadingPartners ? t('dialogs.merchant.loadingPartners') : t('dialogs.merchant.selectPartner')} />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((p) => (
                        <SelectItem key={p._id} value={p._id}>
                          {p.fantasy_name} — {p.contact_email}
                        </SelectItem>
                      ))}
                      {partners.length === 0 && !loadingPartners && (
                        <SelectItem value="" disabled>{t('dialogs.merchant.noPartners')}</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="merchant-fantasy" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.merchant.fantasyName')} {t('dialogs.common.required')}
                </Label>
                <Input
                  id="merchant-fantasy"
                  value={formData.fantasy_name}
                  onChange={(e) => setFormData({ ...formData, fantasy_name: e.target.value })}
                  placeholder={t('dialogs.merchant.placeholderFantasy')}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="merchant-legal" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.merchant.legalName')} {t('dialogs.common.required')}
                </Label>
                <Input
                  id="merchant-legal"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  placeholder={t('dialogs.merchant.placeholderLegal')}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="merchant-tax" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.merchant.taxId')} {t('dialogs.common.required')}
                </Label>
                <Input
                  id="merchant-tax"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  placeholder={t('dialogs.merchant.placeholderTaxId')}
                  required
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="merchant-mcc" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.merchant.mcc')} {t('dialogs.common.required')}
                </Label>
                <Input
                  id="merchant-mcc"
                  value={formData.mcc}
                  onChange={(e) => setFormData({ ...formData, mcc: e.target.value })}
                  placeholder={t('dialogs.merchant.placeholderMcc')}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="merchant-email" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.merchant.contactEmail')} {t('dialogs.common.required')}
              </Label>
              <Input
                id="merchant-email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder={t('dialogs.merchant.placeholderEmail')}
                required
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="merchant-timeout" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.merchant.paymentLinkTimeout')}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="merchant-timeout"
                  type="number"
                  min={1}
                  value={formData.payment_link_timeout_minutes}
                  onChange={(e) => setFormData({ ...formData, payment_link_timeout_minutes: parseInt(e.target.value) || 15 })}
                  className={`w-32 ${inputClass}`}
                />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{t('dialogs.merchant.minutes')}</span>
              </div>
            </div>

            {isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="merchant-status" className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.merchant.status')}
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="h-10 bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-700/80 rounded-lg">
                    <SelectValue placeholder={t('dialogs.common.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    {MerchantStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Methods */}
            <div className="space-y-2">
              <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                {t('dialogs.merchant.enabledPaymentMethods')}
              </Label>
              <div className="flex flex-wrap gap-1.5 p-3 bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-200/80 dark:border-zinc-700/50 rounded-lg">
                {PaymentMethods.map(method => {
                  const isSelected = formData.enabled_payment_methods.includes(method);
                  return (
                    <Badge
                      key={method}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all duration-150 select-none ${
                        isSelected
                          ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/25 shadow-sm shadow-blue-500/10'
                          : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                      onClick={() => handlePaymentMethodToggle(method)}
                    >
                      {getPaymentMethodLabel(method)}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Pricing Rules Section */}
            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.merchant.pricingRules')}
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addPricingRule} className="gap-1 h-7 text-xs border-zinc-200 dark:border-zinc-700">
                  <Plus className="h-3 w-3" />
                  {t('dialogs.merchant.addRule')}
                </Button>
              </div>
              {pricingRules.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('dialogs.merchant.noPricingRules')}</p>
              ) : (
                <div className="space-y-2">
                  {pricingRules.map((rule, index) => (
                    <div key={index} className="flex gap-2 items-end p-3 bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-700/40 rounded-lg">
                      <div className="flex-1">
                        <Label className="text-xs text-zinc-500 dark:text-zinc-400">{t('dialogs.merchant.method')}</Label>
                        <Select
                          value={rule.method}
                          onValueChange={(value) => updatePricingRule(index, 'method', value)}
                        >
                          <SelectTrigger className="h-8 text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                            <SelectValue placeholder={t('dialogs.merchant.selectMethod')} />
                          </SelectTrigger>
                          <SelectContent>
                            {PaymentMethods.map(m => (
                              <SelectItem key={m} value={m}>{getPaymentMethodLabel(m)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Label className="text-xs text-zinc-500 dark:text-zinc-400">{t('dialogs.merchant.fixed')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rule.fixed}
                          onChange={(e) => updatePricingRule(index, 'fixed', e.target.value)}
                          className="h-8 text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs text-zinc-500 dark:text-zinc-400">{t('dialogs.merchant.percentageRate')}</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={rule.percentage}
                          onChange={(e) => updatePricingRule(index, 'percentage', e.target.value)}
                          className={`h-8 text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${
                            (() => {
                              const pf = providerFees.find(p => p.provider === rule.method);
                              return pf && parseFloat(rule.percentage || '0') < pf.percentage ? 'border-amber-400 dark:border-amber-500' : '';
                            })()
                          }`}
                        />
                        {(() => {
                          const pf = providerFees.find(p => p.provider === rule.method);
                          if (pf && parseFloat(rule.percentage || '0') < pf.percentage) {
                            return <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{t('dialogs.merchant.providerFeeWarning', { percentage: pf.percentage })}</p>;
                          }
                          return null;
                        })()}
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
            <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-700 dark:text-zinc-300 text-sm font-medium">
                  {t('dialogs.merchant.acquirerConfigs')}
                </Label>
                <div className="flex gap-1">
                  <Button type="button" variant="outline" size="sm" onClick={addVitaWalletConfig} className="gap-1 h-7 text-xs border-zinc-200 dark:border-zinc-700">
                    <Plus className="h-3 w-3" />
                    VITA
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addTbkConfig} className="gap-1 h-7 text-xs border-zinc-200 dark:border-zinc-700">
                    <Plus className="h-3 w-3" />
                    TBK
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={addAcquirerConfig} className="gap-1 h-7 text-xs border-zinc-200 dark:border-zinc-700">
                    <Plus className="h-3 w-3" />
                    Other
                  </Button>
                </div>
              </div>
              {acquirerConfigs.length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('dialogs.merchant.noAcquirerConfigs')}</p>
              ) : (
                <div className="space-y-2">
                  {acquirerConfigs.map((config, index) => (
                    <div key={index} className="p-3 bg-zinc-50/80 dark:bg-zinc-800/30 border border-zinc-200/60 dark:border-zinc-700/40 rounded-lg space-y-2">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <Label className="text-xs text-zinc-500 dark:text-zinc-400">{t('dialogs.merchant.provider')}</Label>
                          <Input
                            value={config.provider}
                            onChange={(e) => updateAcquirerConfig(index, 'provider', e.target.value)}
                            placeholder={t('dialogs.merchant.placeholderProvider')}
                            className="h-8 text-sm bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
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
                        <Label className="text-xs text-zinc-500 dark:text-zinc-400">{t('dialogs.merchant.configJson')}</Label>
                        <textarea
                          value={config.config}
                          onChange={(e) => updateAcquirerConfig(index, 'config', e.target.value)}
                          placeholder='{"key": "value"}'
                          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono min-h-[60px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 dark:focus:border-blue-400 outline-none transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 -mx-6 px-6 -mb-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {t('dialogs.common.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-200 min-w-[90px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('dialogs.common.saving')}</span>
                  </div>
                ) : (
                  isEdit ? t('dialogs.common.update') : t('dialogs.common.create')
                )}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
