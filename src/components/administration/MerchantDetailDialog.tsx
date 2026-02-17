import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { merchantsApi } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, EyeOff, Store } from 'lucide-react';
import { getStatusConfig, getPaymentMethodLabel } from '@/lib/constants';

export function MerchantDetailDialog({ item, open, onOpenChange }: { item: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation('admin');
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
      <DialogContent className="max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800/80 shadow-xl shadow-blue-900/5 dark:shadow-blue-900/20 p-0 gap-0 overflow-hidden flex flex-col">
        {/* Decorative top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 flex-shrink-0" />

        <DialogHeader className="px-6 pt-5 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <Store className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-zinc-900 dark:text-zinc-50">
              {t('dialogs.merchantDetail.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="mt-1.5 pl-12 text-zinc-500 dark:text-zinc-400">
            {t('dialogs.merchantDetail.description', { name: item.profile?.fantasy_name })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
          <div className="px-6 pb-6 grid gap-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.fantasyName')}</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.fantasy_name || '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.legalName')}</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.legal_name || '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.taxId')}</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.tax_id || '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.mcc')}</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.mcc || '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.contactEmail')}</Label>
                <p className="font-medium text-zinc-900 dark:text-white mt-0.5">{item.profile?.contact_email || '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.status')}</Label>
                <div className="mt-1">
                  <Badge variant={statusConfig.variant} className={statusConfig.className}>{statusConfig.label}</Badge>
                </div>
              </div>
            </div>

            {/* IDs */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.ids')}</Label>
              <div className="grid gap-2 mt-2">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.merchantId')}</Label>
                  <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg mt-0.5">{item._id}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.ownerPartnerId')}</Label>
                  <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg mt-0.5">{item.owner || '-'}</p>
                </div>
              </div>
            </div>

            {/* Integration Keys */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.apiIntegration')}</Label>
              <div className="grid gap-2 mt-2">
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.publicKey')}</Label>
                  <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all mt-0.5">{item.integration?.public_key || '-'}</p>
                </div>
                <div>
                  <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.secretKey')}</Label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-mono text-sm bg-zinc-50/80 dark:bg-zinc-800/50 p-2 rounded-lg break-all flex-1">
                      {showSecret && secretKey ? secretKey : '••••••••••••••••••••••••'}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleToggleSecret}
                      disabled={loadingSecret}
                      className="shrink-0 h-8 w-8 p-0"
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
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.enabledPaymentMethods')}</Label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.enabled_payment_methods?.length > 0 ? item.enabled_payment_methods.filter((m: string) => m !== 'QR').map((method: string) => (
                  <Badge key={method} variant="outline" className="text-xs bg-blue-500/5 text-blue-700 dark:text-blue-300 border-blue-500/20">{getPaymentMethodLabel(method)}</Badge>
                )) : <span className="text-zinc-500 text-sm">{t('dialogs.common.none')}</span>}
              </div>
            </div>

            {/* Bank Accounts */}
            {item.bank_accounts?.length > 0 && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.bankAccounts')}</Label>
                <div className="space-y-2 mt-2">
                  {item.bank_accounts.map((account: any, idx: number) => (
                    <div key={idx} className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40">
                      <p><span className="text-zinc-500">{t('dialogs.merchantDetail.bank')}</span> {account.bank_name}</p>
                      <p><span className="text-zinc-500">{t('dialogs.merchantDetail.accountType')}</span> {account.account_type}</p>
                      <p><span className="text-zinc-500">{t('dialogs.merchantDetail.accountCurrency')}</span> {account.currency}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Rules */}
            {item.pricing_rules?.fees?.length > 0 && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.pricingRules')}</Label>
                <div className="space-y-2 mt-2">
                  {item.pricing_rules.fees.map((fee: any, idx: number) => (
                    <div key={idx} className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40">
                      <p><span className="text-zinc-500">{t('dialogs.merchantDetail.method')}</span> {getPaymentMethodLabel(fee.method)}</p>
                      <p><span className="text-zinc-500">{t('dialogs.merchantDetail.fixed')}</span> {fee.fixed?.$numberDecimal || fee.fixed || 0}</p>
                      <p><span className="text-zinc-500">{t('dialogs.merchantDetail.percentage')}</span> {fee.percentage?.$numberDecimal || fee.percentage || 0}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acquirer Configs */}
            {item.acquirer_configs?.length > 0 && (
              <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.acquirerConfigs')}</Label>
                <div className="space-y-3 mt-2">
                  {item.acquirer_configs.map((config: any, idx: number) => (
                    <div key={idx} className="bg-zinc-50/80 dark:bg-zinc-800/30 p-3 rounded-lg text-sm border border-zinc-200/60 dark:border-zinc-700/40 space-y-2">
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
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4">
              <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.merchantDetail.settings')}</Label>
              <p className="text-sm mt-1 text-zinc-700 dark:text-zinc-300">
                {t('dialogs.merchantDetail.paymentLinkTimeout', { minutes: item.payment_link_timeout_minutes || 15 })}
              </p>
            </div>

            {/* Timestamps */}
            <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.common.createdAt')}</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</p>
              </div>
              <div>
                <Label className="text-zinc-500 dark:text-zinc-400 text-xs">{t('dialogs.common.updatedAt')}</Label>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-0.5">{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
